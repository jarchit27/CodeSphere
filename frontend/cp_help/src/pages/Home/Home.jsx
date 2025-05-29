import React, { useEffect, useState } from 'react';
import './Home.css';                    // ← your Space-themed Home.css
import Navbar from '../../components/Navbar/Navbar';
import FriendCard from '../../components/Cards/FriendCard';
import { MdAdd } from 'react-icons/md';
import AddEditFriend from './AddEditFriend';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';

const Home = () => {
  const [allFriends, setAllFriends] = useState([]);
  const [isSearch, setIsSearch] = useState(false);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  });
  const [visibleCards, setVisibleCards] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const handleEdit = (friendDetails) => {
    setOpenAddEditModal({ isShown: true, data: friendDetails, type: 'edit' });
  };

  const startRevealTimer = (friends) => {
    setVisibleCards(0);
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setVisibleCards((prev) => {
        if (index >= friends.length) clearInterval(interval);
        return prev + 1;
      });
    }, 2500);
  };

    const handleDelete = async (friendDetails) => {
    const friendId = friendDetails._id;
    try {
      const response = await axiosInstance.delete(`/delete-friend/${friendId}`);
      if (response.data && !response.data.error) {
        getAllFriends();
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
    }
  };


  const getUserInfo = async () => {
    try {
      const { data } = await axiosInstance.get('/get-user');
      if (data.user) setUserInfo(data.user);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const getAllFriends = async () => {
    try {
      const response = await axiosInstance.get("/get-all-friends");
      if (response.data?.friends) {
        setAllFriends(response.data.friends);
        startRevealTimer(response.data.friends);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  const onSearchFriend = async (query) => {
    try {
      const response = await axiosInstance.get("/search-friend/", {
        params: { query },
      });
      if (response.data?.friends) {
        setIsSearch(true);
        setAllFriends(response.data.friends);
        startRevealTimer(response.data.friends);  // 👈 Add this
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllFriends();
  };

  useEffect(() => {
    getUserInfo();
    getAllFriends();
  }, []);

  return (
    <>
      <div className="home-page">
        {/* Cosmic Background Elements */}
        <div className="background-elements">
          {/* Animated Stars */}
          <div className="stars"></div>
          
          {/* Nebula Effects */}
          <div className="nebula-purple"></div>
          <div className="nebula-blue"></div>
          <div className="nebula-cyan"></div>
          
          {/* Cosmic Dust */}
          <div className="cosmic-dust"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Distant Planets */}
          <div className="planet planet-1"></div>
          <div className="planet planet-2"></div>
        </div>

        <Navbar
          userInfo={userInfo}
          showSearchBar = {true}
          onSearchFriend={onSearchFriend}
          handleClearSearch={handleClearSearch}
        />

        <div className="home-content">
          <div className="header-section">
            <div className="header-content">
              <div className="title-container">
                <h1 className="main-title">
                  <span className="title-gradient">Friends List</span>
                  <div className="title-glow"></div>
                </h1>
                <div className="subtitle-container">
                  <p className="subtitle">
                    <span className="friend-count">{allFriends.length}</span>
                    <span className="friend-text">
                      friend{allFriends.length !== 1 ? 's' : ''} added
                    </span>
                  </p>
                  <div className="stats-indicator">
                    <div className="pulse-dot"></div>
                    <span>Live Stats</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() =>
                  setOpenAddEditModal({ isShown: true, type: 'add', data: null })
                }
                className="add-friend-button"
              >
                <div className="button-background"></div>
                <div className="button-content">
                  <MdAdd className="add-icon" />
                  <span className="button-text">Add Friend</span>
                </div>
                <div className="button-shine"></div>
              </button>
            </div>
          </div>

          <div className="cards-container">
            <div className="cards-grid">
              {allFriends.slice(0, visibleCards).map((f, index) => (
                <div 
                  key={f._id} 
                  className="card-wrapper"
                  style={{ '--delay': `${index * 0.1}s` }}
                >
                  <FriendCard
                    handle={f.handle}
                    date={f.createdOn}
                    name={f.name}
                    onEdit={() => handleEdit(f)}
                    onDelete={() => handleDelete(f)}
                    onViewAnalysis={() => navigate(`/viewanalysis/${f.handle}`)}
                    className="enhanced-card"
                  />
                </div>
              ))}
            </div>
            
            {allFriends.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <MdAdd />
                </div>
                <h3 className="empty-title">No friends added yet</h3>
                <p className="empty-description">
                  Start by adding your first Codeforces friend to track their progress and explore the cosmic leaderboards!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Space-themed Modal */}
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: 'add', data: null })
        }
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(15px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            transform: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 191, 255, 0.15)',
          }
        }}
        ariaHideApp={false}
      >
        <AddEditFriend
          type={openAddEditModal.type}
          friendData={openAddEditModal.data}
          onClose={() =>
            setOpenAddEditModal({ isShown: false, type: 'add', data: null })
          }
          getAllFriends={getAllFriends}
        />
      </Modal>
    </>
  );
};

export default Home;