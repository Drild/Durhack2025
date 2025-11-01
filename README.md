# 🎯 Tinder for Groups - Hackathon MVP

**Bridge communities, match interests, build connections.**

A full-stack social platform that uses AI-powered matching to connect people with similar interests through groups and real-life events.

## 🚀 Features

### Core Functionality
- **🎨 User Profiles**: Create profiles with custom interests
- **👥 Group Discovery**: Swipe-style interface to discover and join groups
- **🤖 AI Matching**: Jaccard similarity algorithm finds groups with matching interests
- **🗳️ Democratic Merging**: Groups can vote to merge when AI detects similarity
- **🎉 Real Events**: Host and join real-life meetups with approval system
- **📊 Match Scores**: See how well groups align with your interests

### Technical Highlights
- **Backend**: FastAPI with async MongoDB
- **Frontend**: React with modern UI/UX
- **AI Logic**: Modular similarity detection (easily replaceable with advanced models)
- **Real-time**: Toast notifications for instant feedback
- **Responsive**: Mobile-first design

## 🏗️ Project Structure

```
/app/
├── backend/
│   ├── server.py          # FastAPI app with all endpoints
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # React components and routing
│   │   └── App.css       # Modern styling
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend configuration
└── README.md
```

## 🔧 Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB

### Backend Setup
```bash
cd /app/backend
pip install -r requirements.txt

# Set environment variables
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="tinder_for_groups"

# Run server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup
```bash
cd /app/frontend
yarn install

# Set environment variables
export REACT_APP_BACKEND_URL="http://localhost:8001"

# Run development server
yarn start
```

## 📡 API Endpoints

### Base URL
```
http://localhost:8001/api
```

### Users

#### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "name": "Alice",
  "interests": ["Tech", "Music", "Gaming"]
}

Response:
{
  "id": "uuid-here",
  "name": "Alice",
  "interests": ["Tech", "Music", "Gaming"],
  "groups": [],
  "created_at": "2025-11-01T12:00:00Z"
}
```

#### Get All Users
```bash
GET /api/users

Response: Array of user objects
```

#### Get User by ID
```bash
GET /api/users/{user_id}

Response: User object
```

### Groups

#### Create Group
```bash
POST /api/groups
Content-Type: application/json

{
  "name": "Tech Gaming Hub",
  "description": "For tech enthusiasts who love gaming",
  "interests": ["Tech", "Gaming"],
  "created_by": "user-id-here"
}

Response:
{
  "id": "group-uuid",
  "name": "Tech Gaming Hub",
  "description": "For tech enthusiasts who love gaming",
  "interests": ["Tech", "Gaming"],
  "members": ["user-id-here"],
  "created_by": "user-id-here",
  "created_at": "2025-11-01T12:00:00Z"
}
```

#### Get All Groups
```bash
GET /api/groups

Response: Array of group objects
```

#### Join Group
```bash
POST /api/groups/{group_id}/join
Content-Type: application/json

{
  "user_id": "user-id-here"
}

Response:
{
  "message": "Successfully joined group",
  "group_id": "group-uuid"
}
```

#### Get AI Merge Suggestions
```bash
GET /api/groups/{group_id}/suggestions

Response:
[
  {
    "id": "similar-group-uuid",
    "name": "Gaming Champions",
    "description": "Competitive gaming community",
    "interests": ["Gaming", "Sports", "Tech"],
    "members": ["user-id"],
    "match_score": 66.7,  // Jaccard similarity percentage
    "created_at": "2025-11-01T12:00:00Z"
  }
]
```

#### Vote on Group Merge
```bash
POST /api/groups/vote-merge
Content-Type: application/json

{
  "group_id": "your-group-id",
  "target_group_id": "group-to-merge-with",
  "user_id": "your-user-id",
  "vote": true  // true for yes, false for no
}

Response:
{
  "message": "Vote recorded",
  "yes_votes": 3,
  "total_members": 5,
  "merged": false  // true if merge happened due to majority
}
```

### Events

#### Create Event
```bash
POST /api/events
Content-Type: application/json

{
  "title": "Gaming Night",
  "description": "Let's play some games together!",
  "location": "Central Gaming Cafe",
  "date": "2025-11-15T19:00:00",
  "host_id": "user-id-here",
  "group_id": "group-id-here"
}

Response:
{
  "id": "event-uuid",
  "title": "Gaming Night",
  "description": "Let's play some games together!",
  "location": "Central Gaming Cafe",
  "date": "2025-11-15T19:00:00",
  "host_id": "user-id-here",
  "group_id": "group-id-here",
  "participants": [],
  "approved_participants": [],
  "created_at": "2025-11-01T12:00:00Z"
}
```

#### Get All Events
```bash
GET /api/events

Response: Array of event objects
```

#### Join Event (Request)
```bash
POST /api/events/{event_id}/join
Content-Type: application/json

{
  "user_id": "user-id-here"
}

Response:
{
  "message": "Join request sent",
  "event_id": "event-uuid"
}
```

#### Approve Participant (Host Only)
```bash
POST /api/events/{event_id}/approve
Content-Type: application/json

{
  "user_id": "participant-id-to-approve",
  "host_id": "your-user-id"
}

Response:
{
  "message": "Participant approved",
  "user_id": "participant-id"
}
```

## 🧪 Testing with cURL

### Complete Flow Example

```bash
# 1. Create users
USER1=$(curl -s -X POST "http://localhost:8001/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "interests": ["Tech", "Music", "Gaming"]}')
USER1_ID=$(echo $USER1 | jq -r '.id')

USER2=$(curl -s -X POST "http://localhost:8001/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "interests": ["Tech", "Gaming", "Sports"]}')
USER2_ID=$(echo $USER2 | jq -r '.id')

# 2. Create groups
GROUP1=$(curl -s -X POST "http://localhost:8001/api/groups" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Tech Gaming Hub\", \"description\": \"For tech enthusiasts who love gaming\", \"interests\": [\"Tech\", \"Gaming\"], \"created_by\": \"$USER1_ID\"}")
GROUP1_ID=$(echo $GROUP1 | jq -r '.id')

GROUP2=$(curl -s -X POST "http://localhost:8001/api/groups" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Gaming Champions\", \"description\": \"Competitive gaming\", \"interests\": [\"Gaming\", \"Sports\", \"Tech\"], \"created_by\": \"$USER2_ID\"}")

# 3. Test AI similarity
curl -s "http://localhost:8001/api/groups/$GROUP1_ID/suggestions" | jq

# 4. Join group
curl -s -X POST "http://localhost:8001/api/groups/$GROUP1_ID/join" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER2_ID\"}" | jq

# 5. Create event
EVENT=$(curl -s -X POST "http://localhost:8001/api/events" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Gaming Night\", \"description\": \"Fun gaming session\", \"location\": \"Cafe\", \"date\": \"2025-11-15T19:00:00\", \"host_id\": \"$USER1_ID\", \"group_id\": \"$GROUP1_ID\"}")
EVENT_ID=$(echo $EVENT | jq -r '.id')

# 6. Join event
curl -s -X POST "http://localhost:8001/api/events/$EVENT_ID/join" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER2_ID\"}" | jq

# 7. Host approves participant
curl -s -X POST "http://localhost:8001/api/events/$EVENT_ID/approve" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER2_ID\", \"host_id\": \"$USER1_ID\"}" | jq
```

## 🤖 AI Similarity Algorithm

### Jaccard Similarity
The current implementation uses **Jaccard Similarity** for group matching:

```python
def jaccard_similarity(set1: set, set2: set) -> float:
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0
```

**Example:**
- Group A: ["Tech", "Gaming", "Music"]
- Group B: ["Gaming", "Sports", "Tech"]
- Intersection: ["Tech", "Gaming"] = 2 items
- Union: ["Tech", "Gaming", "Music", "Sports"] = 4 items
- **Similarity: 2/4 = 50% match**

### Upgrading to Advanced AI
The similarity function is modular and can be replaced with:
- **Word embeddings** (Word2Vec, GloVe)
- **Sentence transformers** (BERT, Sentence-BERT)
- **LLM-based matching** (GPT, Claude)
- **Graph-based algorithms**

## 🎨 Frontend Pages

1. **Landing Page** - Hero section with features
2. **Onboarding** - Name and interests selection
3. **Discover** - Tinder-style group swiping
4. **My Groups** - View joined groups
5. **Group Detail** - See members, merge suggestions, create events
6. **Events** - Browse and join real-life meetups
7. **Create Group** - Start your own community
8. **Create Event** - Plan meetups

## 🔑 Key Design Decisions

### Why Jaccard Similarity?
- ✅ Fast and efficient
- ✅ No external API required
- ✅ Works offline
- ✅ Easy to understand and debug
- ✅ Perfect for hackathon MVP

### Why Majority Voting?
- Ensures democratic decision-making
- Prevents unwanted merges
- Simple threshold: >50% yes votes

### Why Host Approval for Events?
- Quality control for meetups
- Safety and trust
- Prevents spam/unwanted participants

## 📊 Data Models

### User
```python
{
  "id": str,
  "name": str,
  "interests": List[str],
  "groups": List[str],  # group IDs
  "created_at": datetime
}
```

### Group
```python
{
  "id": str,
  "name": str,
  "description": str,
  "interests": List[str],
  "members": List[str],  # user IDs
  "created_by": str,  # user ID
  "created_at": datetime
}
```

### Event
```python
{
  "id": str,
  "title": str,
  "description": str,
  "location": str,
  "date": str,  # ISO datetime
  "host_id": str,
  "group_id": str,
  "participants": List[str],  # pending approval
  "approved_participants": List[str],
  "created_at": datetime
}
```

### Merge Vote
```python
{
  "id": str,  # "{group_id}_{target_group_id}"
  "group_id": str,
  "target_group_id": str,
  "yes_votes": List[str],  # user IDs
  "no_votes": List[str],
  "created_at": datetime
}
```

## 🚀 Future Enhancements

1. **Advanced AI**: Replace Jaccard with ML models
2. **Real-time Chat**: WebSocket group messaging
3. **Event Photos**: Upload and share meetup photos
4. **Notifications**: Push notifications for votes and approvals
5. **Geolocation**: Find nearby groups and events
6. **Ratings**: Rate events and group experiences
7. **Privacy Settings**: Control profile visibility
8. **Group Categories**: Filter by activity type

## 🎯 Hackathon Talking Points

### "Bridging Worlds" Theme
- Connects digital communities to real-world meetups
- Bridges people across different interest groups through AI
- Merges similar communities democratically
- Transforms online connections into physical gatherings

### Technical Innovation
- Modular AI architecture for easy upgrades
- Democratic voting system for community governance
- Host approval system ensures quality and safety
- Modern, responsive UI with smooth animations

### Social Impact
- Reduces social isolation by building communities
- Helps people discover like-minded individuals
- Encourages real-life interactions
- Scales community building through AI

## 📝 License

MIT License - Hackathon Ready

---

**Built with ❤️ for hackathons** | FastAPI + React + MongoDB | AI-Powered Matching
