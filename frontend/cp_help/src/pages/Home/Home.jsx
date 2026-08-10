import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import FriendCard from '../../components/Cards/FriendCard';
import { MdAdd } from 'react-icons/md';
import AddEditFriend from './AddEditFriend';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const Home = () => {
  const [allFriends, setAllFriends] = useState([]);
  const [isSearch, setIsSearch] = useState(false);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  });

  const [userInfoMap, setUserInfoMap] = useState({});
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  const handleEdit = (friendDetails) => {
    setOpenAddEditModal({ isShown: true, data: friendDetails, type: 'edit' });
  };

  const handleDelete = async (friendDetails) => {
    const friendId = friendDetails._id;
    try {
      const response = await friendService.delete(friendId);
      if (response.data && !response.data.error) {
        getAllFriends();
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
    }
  };

  const getAllFriends = async () => {
    try {
      const response = await friendService.getAll();
      if (response.data?.friends) {
        setAllFriends(response.data.friends);
        fetchBatchUserData(response.data.friends);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  const onSearchFriend = async (query) => {
    try {
      const response = await friendService.search(query);
      if (response.data?.friends) {
        setIsSearch(true);
        setAllFriends(response.data.friends);
        fetchBatchUserData(response.data.friends);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const fetchBatchUserData = async (friends) => {
    if (!friends || friends.length === 0) {
      setLoadingUserInfo(false);
      return;
    }
    
    setLoadingUserInfo(true);
    const handles = friends.map(f => f.handle).join(';');
    
    try {
      const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handles}`);
      const userInfoData = await userInfoResponse.json();

      if (userInfoData.status === 'OK') {
        const infoMap = {};
        userInfoData.result.forEach(user => {
          infoMap[user.handle] = user;
        });
        setUserInfoMap(infoMap);
      }
    } catch (error) {
      console.error('Error during batch fetch:', error);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllFriends();
  };

  useEffect(() => {
    getAllFriends();
  }, []);

  return (
    <>
      <div>

        <Navbar
          userInfo={userInfo}
          showSearchBar={true}
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
              {allFriends.map((f) => (
                <FriendCard
                  key={f._id}
                  handle={f.handle}
                  date={f.createdOn}
                  name={f.name}
                  userData={userInfoMap[f.handle]}
                  loading={loadingUserInfo}
                  onEdit={() => handleEdit(f)}
                  onDelete={() => handleDelete(f)}
                  onViewAnalysis={() => navigate(`/profile/${f.handle}`)}
                  className="enhanced-card"
                />
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

      {openAddEditModal.isShown && (
        <AddEditFriend
          type={openAddEditModal.type}
          friendData={openAddEditModal.data}
          onClose={() =>
            setOpenAddEditModal({ isShown: false, type: 'add', data: null })
          }
          getAllFriends={getAllFriends}
        />
      )}
    </>
  );
};

export default Home;