from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Tinder for Groups API")
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    interests: List[str]
    groups: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    interests: List[str]

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    interests: List[str]
    members: List[str] = Field(default_factory=list)
    created_by: str
    match_score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupCreate(BaseModel):
    name: str
    description: str
    interests: List[str]
    created_by: str

class JoinGroup(BaseModel):
    user_id: str

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    date: str
    host_id: str
    group_id: str
    participants: List[str] = Field(default_factory=list)
    approved_participants: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    title: str
    description: str
    location: str
    date: str
    host_id: str
    group_id: str

class JoinEvent(BaseModel):
    user_id: str

class ApproveParticipant(BaseModel):
    user_id: str
    host_id: str

class MergeVote(BaseModel):
    group_id: str
    target_group_id: str
    user_id: str
    vote: bool  # True for yes, False for no

# ============= UTILITY FUNCTIONS =============

def jaccard_similarity(set1: set, set2: set) -> float:
    """Calculate Jaccard similarity between two sets"""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

async def find_similar_groups(group: Group, threshold: float = 0.3) -> List[Group]:
    """Find groups with similar interests using Jaccard similarity"""
    all_groups = await db.groups.find({"id": {"$ne": group.id}}, {"_id": 0}).to_list(1000)
    
    similar_groups = []
    group_interests = set(group.interests)
    
    for g_dict in all_groups:
        other_interests = set(g_dict['interests'])
        similarity = jaccard_similarity(group_interests, other_interests)
        
        if similarity >= threshold:
            g_dict['match_score'] = round(similarity * 100, 1)
            similar_groups.append(Group(**g_dict))
    
    # Sort by similarity score
    similar_groups.sort(key=lambda x: x.match_score, reverse=True)
    return similar_groups

# ============= USER ENDPOINTS =============

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user with interests"""
    user = User(**user_data.model_dump())
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.get("/users", response_model=List[User])
async def get_users():
    """Get all users"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a specific user by ID"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)

# ============= GROUP ENDPOINTS =============

@api_router.post("/groups", response_model=Group)
async def create_group(group_data: GroupCreate):
    """Create a new group"""
    # Verify creator exists
    creator = await db.users.find_one({"id": group_data.created_by})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator user not found")
    
    group = Group(**group_data.model_dump(), members=[group_data.created_by])
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.groups.insert_one(doc)
    
    # Add group to user's groups
    await db.users.update_one(
        {"id": group_data.created_by},
        {"$push": {"groups": group.id}}
    )
    
    return group

@api_router.get("/groups", response_model=List[Group])
async def get_groups():
    """Get all groups"""
    groups = await db.groups.find({}, {"_id": 0}).to_list(1000)
    for group in groups:
        if isinstance(group['created_at'], str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    return groups

@api_router.get("/groups/{group_id}", response_model=Group)
async def get_group(group_id: str):
    """Get a specific group by ID"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if isinstance(group['created_at'], str):
        group['created_at'] = datetime.fromisoformat(group['created_at'])
    return Group(**group)

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, data: JoinGroup):
    """Join an existing group"""
    # Verify user exists
    user = await db.users.find_one({"id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify group exists
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if already a member
    if data.user_id in group.get('members', []):
        raise HTTPException(status_code=400, detail="Already a member")
    
    # Add user to group
    await db.groups.update_one(
        {"id": group_id},
        {"$push": {"members": data.user_id}}
    )
    
    # Add group to user's groups
    await db.users.update_one(
        {"id": data.user_id},
        {"$push": {"groups": group_id}}
    )
    
    return {"message": "Successfully joined group", "group_id": group_id}

@api_router.get("/groups/{group_id}/suggestions", response_model=List[Group])
async def get_merge_suggestions(group_id: str):
    """Get AI-powered merge suggestions for a group"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if isinstance(group['created_at'], str):
        group['created_at'] = datetime.fromisoformat(group['created_at'])
    
    group_obj = Group(**group)
    similar_groups = await find_similar_groups(group_obj, threshold=0.3)
    
    return similar_groups

@api_router.post("/groups/vote-merge")
async def vote_merge(vote_data: MergeVote):
    """Vote on a group merge proposal"""
    # Verify both groups exist
    group1 = await db.groups.find_one({"id": vote_data.group_id})
    group2 = await db.groups.find_one({"id": vote_data.target_group_id})
    
    if not group1 or not group2:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verify user is a member of the voting group
    if vote_data.user_id not in group1.get('members', []):
        raise HTTPException(status_code=403, detail="Must be a group member to vote")
    
    # Store vote in merge_votes collection
    vote_id = f"{vote_data.group_id}_{vote_data.target_group_id}"
    existing_vote = await db.merge_votes.find_one({"id": vote_id})
    
    if not existing_vote:
        # Create new vote record
        await db.merge_votes.insert_one({
            "id": vote_id,
            "group_id": vote_data.group_id,
            "target_group_id": vote_data.target_group_id,
            "yes_votes": [vote_data.user_id] if vote_data.vote else [],
            "no_votes": [] if vote_data.vote else [vote_data.user_id],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        # Update existing vote
        if vote_data.vote:
            await db.merge_votes.update_one(
                {"id": vote_id},
                {"$addToSet": {"yes_votes": vote_data.user_id}, "$pull": {"no_votes": vote_data.user_id}}
            )
        else:
            await db.merge_votes.update_one(
                {"id": vote_id},
                {"$addToSet": {"no_votes": vote_data.user_id}, "$pull": {"yes_votes": vote_data.user_id}}
            )
    
    # Check if merge should happen (majority vote)
    updated_vote = await db.merge_votes.find_one({"id": vote_id})
    total_members = len(group1.get('members', []))
    yes_votes = len(updated_vote.get('yes_votes', []))
    
    merged = False
    if yes_votes > total_members / 2:
        # Merge groups
        await db.groups.update_one(
            {"id": vote_data.group_id},
            {
                "$set": {
                    "name": f"{group1['name']} & {group2['name']}",
                    "description": f"Merged group: {group1['description']} + {group2['description']}",
                    "interests": list(set(group1['interests'] + group2['interests'])),
                    "members": list(set(group1.get('members', []) + group2.get('members', [])))
                }
            }
        )
        
        # Delete the merged group
        await db.groups.delete_one({"id": vote_data.target_group_id})
        merged = True
    
    return {
        "message": "Vote recorded",
        "yes_votes": yes_votes,
        "total_members": total_members,
        "merged": merged
    }

# ============= EVENT ENDPOINTS =============

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate):
    """Create a new event"""
    # Verify host exists
    host = await db.users.find_one({"id": event_data.host_id})
    if not host:
        raise HTTPException(status_code=404, detail="Host user not found")
    
    # Verify group exists
    group = await db.groups.find_one({"id": event_data.group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    event = Event(**event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.events.insert_one(doc)
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events():
    """Get all events"""
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """Get a specific event by ID"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    return Event(**event)

@api_router.post("/events/{event_id}/join")
async def join_event(event_id: str, data: JoinEvent):
    """Request to join an event"""
    # Verify user exists
    user = await db.users.find_one({"id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already requested
    if data.user_id in event.get('participants', []):
        raise HTTPException(status_code=400, detail="Already requested to join")
    
    # Add user to participants (pending approval)
    await db.events.update_one(
        {"id": event_id},
        {"$push": {"participants": data.user_id}}
    )
    
    return {"message": "Join request sent", "event_id": event_id}

@api_router.post("/events/{event_id}/approve")
async def approve_participant(event_id: str, data: ApproveParticipant):
    """Host approves a participant for the event"""
    # Verify event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify requester is the host
    if event['host_id'] != data.host_id:
        raise HTTPException(status_code=403, detail="Only the host can approve participants")
    
    # Verify user is in participants
    if data.user_id not in event.get('participants', []):
        raise HTTPException(status_code=400, detail="User has not requested to join")
    
    # Move user to approved_participants
    await db.events.update_one(
        {"id": event_id},
        {"$addToSet": {"approved_participants": data.user_id}}
    )
    
    return {"message": "Participant approved", "user_id": data.user_id}

# ============= HEALTH CHECK =============

@api_router.get("/")
async def root():
    return {"message": "Tinder for Groups API", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
