import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Landing Page
const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero-section">
          <div className="floating-badge" data-testid="beta-badge">✨ Beta Launch</div>
          <h1 className="hero-title" data-testid="hero-title">
            Find Your Tribe.
            <br />
            <span className="gradient-text">Match Your Vibe.</span>
          </h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            Connect with groups that share your passions. AI-powered matching for real communities.
          </p>
          <button 
            className="cta-button"
            data-testid="get-started-button"
            onClick={() => navigate('/onboarding')}
          >
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card" data-testid="feature-ai-matching">
            <div className="feature-icon">🎯</div>
            <h3>AI Matching</h3>
            <p>Smart algorithms find groups that match your interests perfectly</p>
          </div>
          <div className="feature-card" data-testid="feature-real-events">
            <div className="feature-icon">🎉</div>
            <h3>Real Events</h3>
            <p>Host and join real-life meetups with your community</p>
          </div>
          <div className="feature-card" data-testid="feature-group-merge">
            <div className="feature-icon">🤝</div>
            <h3>Group Merging</h3>
            <p>Similar communities can vote to merge and grow together</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding
const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [interests, setInterests] = useState([]);
  const [inputInterest, setInputInterest] = useState("");

  const popularInterests = [
    "Tech", "Music", "Art", "Sports", "Gaming", "Food", "Travel", 
    "Fitness", "Photography", "Reading", "Movies", "Cooking"
  ];

  const addInterest = (interest) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleCustomInterest = () => {
    if (inputInterest.trim() && !interests.includes(inputInterest.trim())) {
      setInterests([...interests, inputInterest.trim()]);
      setInputInterest("");
    }
  };

  const handleSubmit = async () => {
    if (interests.length === 0) {
      toast.error("Please add at least one interest");
      return;
    }

    try {
      const response = await axios.post(`${API}/users`, {
        name,
        interests
      });
      
      localStorage.setItem('userId', response.data.id);
      localStorage.setItem('userName', response.data.name);
      toast.success("Profile created! 🎉");
      navigate('/discover');
    } catch (error) {
      console.error(error);
      toast.error("Failed to create profile");
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {step === 1 ? (
          <div className="onboarding-step" data-testid="onboarding-step-1">
            <h2>What's your name?</h2>
            <p className="step-subtitle">Let's get to know you</p>
            <input
              type="text"
              className="name-input"
              data-testid="name-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && name && setStep(2)}
            />
            <button 
              className="primary-button"
              data-testid="continue-button"
              disabled={!name}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="onboarding-step" data-testid="onboarding-step-2">
            <h2>What are you into?</h2>
            <p className="step-subtitle">Pick your interests (select as many as you like)</p>
            
            <div className="interests-selected" data-testid="selected-interests">
              {interests.map(interest => (
                <span key={interest} className="interest-tag selected" data-testid={`selected-interest-${interest}`}>
                  {interest}
                  <button onClick={() => removeInterest(interest)}>×</button>
                </span>
              ))}
            </div>

            <div className="interests-grid">
              {popularInterests.map(interest => (
                <button
                  key={interest}
                  className={`interest-button ${interests.includes(interest) ? 'active' : ''}`}
                  data-testid={`interest-button-${interest}`}
                  onClick={() => 
                    interests.includes(interest) 
                      ? removeInterest(interest) 
                      : addInterest(interest)
                  }
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="custom-interest">
              <input
                type="text"
                className="interest-input"
                data-testid="custom-interest-input"
                placeholder="Add custom interest..."
                value={inputInterest}
                onChange={(e) => setInputInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomInterest()}
              />
              <button 
                className="add-button"
                data-testid="add-interest-button"
                onClick={handleCustomInterest}
              >
                Add
              </button>
            </div>

            <div className="onboarding-actions">
              <button 
                className="secondary-button"
                data-testid="back-button"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                className="primary-button"
                data-testid="finish-button"
                disabled={interests.length === 0}
                onClick={handleSubmit}
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Discover Groups
const Discover = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding');
      return;
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API}/groups`);
      // Filter out groups user is already in
      const user = await axios.get(`${API}/users/${userId}`);
      const userGroups = user.data.groups || [];
      const availableGroups = response.data.filter(g => !userGroups.includes(g.id));
      setGroups(availableGroups);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (currentIndex >= groups.length) return;
    
    try {
      await axios.post(`${API}/groups/${groups[currentIndex].id}/join`, {
        user_id: userId
      });
      toast.success(`Joined ${groups[currentIndex].name}! 🎉`);
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to join group");
    }
  };

  const handleSkip = () => {
    setCurrentIndex(currentIndex + 1);
  };

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  if (loading) {
    return <div className="loading-container">Loading groups...</div>;
  }

  const currentGroup = groups[currentIndex];

  return (
    <div className="discover-container">
      <nav className="top-nav">
        <h1 className="nav-title" data-testid="nav-title">Discover Groups</h1>
        <div className="nav-actions">
          <button className="nav-button" data-testid="my-groups-button" onClick={() => navigate('/my-groups')}>My Groups</button>
          <button className="nav-button" data-testid="events-button" onClick={() => navigate('/events')}>Events</button>
          <div className="user-badge" data-testid="user-badge">{userName}</div>
        </div>
      </nav>

      <div className="discover-content">
        {!currentGroup ? (
          <div className="empty-state" data-testid="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No more groups to discover</h2>
            <p>You've seen all available groups!</p>
            <button className="primary-button" data-testid="create-group-button" onClick={handleCreateGroup}>
              Create Your Own Group
            </button>
          </div>
        ) : (
          <div className="swipe-card" data-testid={`group-card-${currentGroup.id}`}>
            <div className="card-header">
              <div className="group-avatar">{currentGroup.name.charAt(0)}</div>
              <div className="group-info">
                <h2 data-testid="group-name">{currentGroup.name}</h2>
                <p className="members-count" data-testid="members-count">{currentGroup.members.length} members</p>
              </div>
            </div>

            <p className="group-description" data-testid="group-description">{currentGroup.description}</p>

            <div className="interests-section">
              <h3>Interests</h3>
              <div className="interests-tags" data-testid="group-interests">
                {currentGroup.interests.map((interest, idx) => (
                  <span key={idx} className="interest-tag">{interest}</span>
                ))}
              </div>
            </div>

            <div className="swipe-actions">
              <button 
                className="skip-button"
                data-testid="skip-button"
                onClick={handleSkip}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Skip
              </button>
              <button 
                className="join-button"
                data-testid="join-button"
                onClick={handleJoin}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join
              </button>
            </div>
          </div>
        )}

        <button 
          className="floating-create-button"
          data-testid="floating-create-button"
          onClick={handleCreateGroup}
        >
          +
        </button>
      </div>
    </div>
  );
};

// Create Group
const CreateGroup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [interests, setInterests] = useState([]);
  const [inputInterest, setInputInterest] = useState("");
  const userId = localStorage.getItem('userId');

  const popularInterests = [
    "Tech", "Music", "Art", "Sports", "Gaming", "Food", "Travel", 
    "Fitness", "Photography", "Reading", "Movies", "Cooking"
  ];

  const addInterest = (interest) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleCustomInterest = () => {
    if (inputInterest.trim() && !interests.includes(inputInterest.trim())) {
      setInterests([...interests, inputInterest.trim()]);
      setInputInterest("");
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || interests.length === 0) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await axios.post(`${API}/groups`, {
        name,
        description,
        interests,
        created_by: userId
      });
      toast.success("Group created! 🎉");
      navigate('/my-groups');
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-card">
        <h2 data-testid="create-group-title">Create a New Group</h2>
        <p className="subtitle">Build your community</p>

        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            className="form-input"
            data-testid="group-name-input"
            placeholder="e.g., Tech Enthusiasts"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-textarea"
            data-testid="group-description-input"
            placeholder="What's your group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Interests</label>
          <div className="interests-selected">
            {interests.map(interest => (
              <span key={interest} className="interest-tag selected" data-testid={`selected-interest-${interest}`}>
                {interest}
                <button onClick={() => removeInterest(interest)}>×</button>
              </span>
            ))}
          </div>

          <div className="interests-grid">
            {popularInterests.map(interest => (
              <button
                key={interest}
                className={`interest-button ${interests.includes(interest) ? 'active' : ''}`}
                data-testid={`interest-button-${interest}`}
                onClick={() => 
                  interests.includes(interest) 
                    ? removeInterest(interest) 
                    : addInterest(interest)
                }
              >
                {interest}
              </button>
            ))}
          </div>

          <div className="custom-interest">
            <input
              type="text"
              className="interest-input"
              data-testid="custom-interest-input"
              placeholder="Add custom interest..."
              value={inputInterest}
              onChange={(e) => setInputInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomInterest()}
            />
            <button 
              className="add-button"
              data-testid="add-custom-interest-button"
              onClick={handleCustomInterest}
            >
              Add
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="secondary-button"
            data-testid="cancel-button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            className="primary-button"
            data-testid="create-button"
            disabled={!name || !description || interests.length === 0}
            onClick={handleSubmit}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

// My Groups
const MyGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding');
      return;
    }
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const user = await axios.get(`${API}/users/${userId}`);
      const userGroupIds = user.data.groups || [];
      
      const allGroups = await axios.get(`${API}/groups`);
      const myGroups = allGroups.data.filter(g => userGroupIds.includes(g.id));
      
      setGroups(myGroups);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading your groups...</div>;
  }

  return (
    <div className="my-groups-container">
      <nav className="top-nav">
        <h1 className="nav-title" data-testid="my-groups-title">My Groups</h1>
        <div className="nav-actions">
          <button className="nav-button" data-testid="discover-button" onClick={() => navigate('/discover')}>Discover</button>
          <button className="nav-button" data-testid="events-nav-button" onClick={() => navigate('/events')}>Events</button>
        </div>
      </nav>

      <div className="groups-grid">
        {groups.length === 0 ? (
          <div className="empty-state" data-testid="empty-groups">
            <div className="empty-icon">👥</div>
            <h2>No groups yet</h2>
            <p>Join or create a group to get started!</p>
            <button className="primary-button" data-testid="discover-groups-button" onClick={() => navigate('/discover')}>
              Discover Groups
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div 
              key={group.id} 
              className="group-card"
              data-testid={`my-group-card-${group.id}`}
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <div className="group-card-header">
                <div className="group-avatar-large">{group.name.charAt(0)}</div>
                <div>
                  <h3 data-testid={`group-name-${group.id}`}>{group.name}</h3>
                  <p className="members-count" data-testid={`members-count-${group.id}`}>{group.members.length} members</p>
                </div>
              </div>
              <p className="group-card-description" data-testid={`group-description-${group.id}`}>{group.description}</p>
              <div className="interests-tags">
                {group.interests.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="interest-tag small">{interest}</span>
                ))}
                {group.interests.length > 3 && (
                  <span className="interest-tag small">+{group.interests.length - 3}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Group Detail
const GroupDetail = () => {
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMerge, setShowMerge] = useState(false);
  const groupId = window.location.pathname.split('/').pop();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchGroupDetails();
    fetchSuggestions();
  }, []);

  const fetchGroupDetails = async () => {
    try {
      const response = await axios.get(`${API}/groups/${groupId}`);
      setGroup(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/groups/${groupId}/suggestions`);
      setSuggestions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleVoteMerge = async (targetGroupId, vote) => {
    try {
      const response = await axios.post(`${API}/groups/vote-merge`, {
        group_id: groupId,
        target_group_id: targetGroupId,
        user_id: userId,
        vote: vote
      });
      
      if (response.data.merged) {
        toast.success("Groups merged! 🎉");
        navigate('/my-groups');
      } else {
        toast.success(`Vote recorded! ${response.data.yes_votes}/${response.data.total_members} voted yes`);
      }
      fetchSuggestions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to vote");
    }
  };

  const handleCreateEvent = () => {
    navigate(`/create-event/${groupId}`);
  };

  if (loading) {
    return <div className="loading-container">Loading group...</div>;
  }

  if (!group) {
    return <div className="loading-container">Group not found</div>;
  }

  return (
    <div className="group-detail-container">
      <nav className="top-nav">
        <button className="back-nav-button" data-testid="back-button" onClick={() => navigate(-1)}>← Back</button>
      </nav>

      <div className="group-detail-content">
        <div className="group-header-section">
          <div className="group-avatar-xl">{group.name.charAt(0)}</div>
          <h1 data-testid="group-detail-name">{group.name}</h1>
          <p className="members-count" data-testid="group-detail-members">{group.members.length} members</p>
          <p className="group-description-large" data-testid="group-detail-description">{group.description}</p>
          
          <div className="interests-tags">
            {group.interests.map((interest, idx) => (
              <span key={idx} className="interest-tag">{interest}</span>
            ))}
          </div>

          <button 
            className="primary-button"
            data-testid="create-event-button"
            onClick={handleCreateEvent}
          >
            Create Event
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions-section">
            <div className="section-header">
              <h2>Similar Groups</h2>
              <button 
                className="toggle-button"
                data-testid="toggle-merge-button"
                onClick={() => setShowMerge(!showMerge)}
              >
                {showMerge ? 'Hide' : 'Show'} Merge Suggestions
              </button>
            </div>

            {showMerge && (
              <div className="suggestions-grid">
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} className="suggestion-card" data-testid={`suggestion-${suggestion.id}`}>
                    <div className="suggestion-header">
                      <div className="group-avatar">{suggestion.name.charAt(0)}</div>
                      <div>
                        <h3 data-testid={`suggestion-name-${suggestion.id}`}>{suggestion.name}</h3>
                        <p className="match-score" data-testid={`match-score-${suggestion.id}`}>{suggestion.match_score}% Match</p>
                      </div>
                    </div>
                    <p data-testid={`suggestion-description-${suggestion.id}`}>{suggestion.description}</p>
                    <div className="interests-tags">
                      {suggestion.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="interest-tag small">{interest}</span>
                      ))}
                    </div>
                    <div className="merge-actions">
                      <button 
                        className="vote-no-button"
                        data-testid={`vote-no-${suggestion.id}`}
                        onClick={() => handleVoteMerge(suggestion.id, false)}
                      >
                        Pass
                      </button>
                      <button 
                        className="vote-yes-button"
                        data-testid={`vote-yes-${suggestion.id}`}
                        onClick={() => handleVoteMerge(suggestion.id, true)}
                      >
                        Vote to Merge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Event
const CreateEvent = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const groupId = window.location.pathname.split('/').pop();
  const userId = localStorage.getItem('userId');

  const handleSubmit = async () => {
    if (!title || !description || !location || !date) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await axios.post(`${API}/events`, {
        title,
        description,
        location,
        date,
        host_id: userId,
        group_id: groupId
      });
      toast.success("Event created! 🎉");
      navigate('/events');
    } catch (error) {
      console.error(error);
      toast.error("Failed to create event");
    }
  };

  return (
    <div className="create-event-container">
      <div className="create-event-card">
        <h2 data-testid="create-event-title">Create an Event</h2>
        <p className="subtitle">Plan a real-life meetup</p>

        <div className="form-group">
          <label>Event Title</label>
          <input
            type="text"
            className="form-input"
            data-testid="event-title-input"
            placeholder="e.g., Coffee Meetup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-textarea"
            data-testid="event-description-input"
            placeholder="What's the event about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            className="form-input"
            data-testid="event-location-input"
            placeholder="e.g., Central Park"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            className="form-input"
            data-testid="event-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button 
            className="secondary-button"
            data-testid="cancel-event-button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            className="primary-button"
            data-testid="create-event-submit-button"
            disabled={!title || !description || !location || !date}
            onClick={handleSubmit}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

// Events List
const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding');
      return;
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await axios.post(`${API}/events/${eventId}/join`, {
        user_id: userId
      });
      toast.success("Join request sent! 🎉");
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to join event");
    }
  };

  const handleApprove = async (eventId, participantId) => {
    try {
      await axios.post(`${API}/events/${eventId}/approve`, {
        user_id: participantId,
        host_id: userId
      });
      toast.success("Participant approved!");
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve");
    }
  };

  if (loading) {
    return <div className="loading-container">Loading events...</div>;
  }

  return (
    <div className="events-container">
      <nav className="top-nav">
        <h1 className="nav-title" data-testid="events-title">Events</h1>
        <div className="nav-actions">
          <button className="nav-button" data-testid="discover-nav-button" onClick={() => navigate('/discover')}>Discover</button>
          <button className="nav-button" data-testid="my-groups-nav-button" onClick={() => navigate('/my-groups')}>My Groups</button>
        </div>
      </nav>

      <div className="events-grid">
        {events.length === 0 ? (
          <div className="empty-state" data-testid="empty-events">
            <div className="empty-icon">📅</div>
            <h2>No events yet</h2>
            <p>Create an event from one of your groups!</p>
            <button className="primary-button" data-testid="go-to-groups-button" onClick={() => navigate('/my-groups')}>
              View My Groups
            </button>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-card" data-testid={`event-card-${event.id}`}>
              <div className="event-header">
                <h3 data-testid={`event-title-${event.id}`}>{event.title}</h3>
                <span className="event-date" data-testid={`event-date-${event.id}`}>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <p className="event-description" data-testid={`event-description-${event.id}`}>{event.description}</p>
              <div className="event-meta">
                <span data-testid={`event-location-${event.id}`}>📍 {event.location}</span>
                <span data-testid={`event-participants-${event.id}`}>👥 {event.approved_participants.length} attending</span>
              </div>
              {event.host_id === userId ? (
                <div className="host-section">
                  <p className="host-badge" data-testid={`host-badge-${event.id}`}>You're hosting</p>
                  {event.participants.filter(p => !event.approved_participants.includes(p)).length > 0 && (
                    <div className="pending-approvals">
                      <p>Pending approvals: {event.participants.filter(p => !event.approved_participants.includes(p)).length}</p>
                      {event.participants.filter(p => !event.approved_participants.includes(p)).map(participantId => (
                        <button
                          key={participantId}
                          className="approve-button"
                          data-testid={`approve-${participantId}-${event.id}`}
                          onClick={() => handleApprove(event.id, participantId)}
                        >
                          Approve User
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="join-event-button"
                  data-testid={`join-event-${event.id}`}
                  disabled={event.participants.includes(userId)}
                  onClick={() => handleJoinEvent(event.id)}
                >
                  {event.participants.includes(userId) 
                    ? event.approved_participants.includes(userId) 
                      ? 'Approved ✓' 
                      : 'Pending Approval' 
                    : 'Request to Join'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/my-groups" element={<MyGroups />} />
          <Route path="/group/:id" element={<GroupDetail />} />
          <Route path="/create-event/:groupId" element={<CreateEvent />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
