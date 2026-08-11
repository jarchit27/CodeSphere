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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFriendsCount, setTotalFriendsCount] = useState(0);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  });

  const [userInfoMap, setUserInfoMap] = useState({});
  // loadingUserInfo state removed to prevent global flicker

  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  const handleEdit = (friendDetails) => {
    setOpenAddEditModal({ isShown: true, data: friendDetails, type: 'edit' });
  };

  const handleDelete = async (friendDetails) => {
    const friendId = friendDetails._id;
    
    // Optimistic UI update: instantly remove the friend from the screen
    // This prevents the whole page from "reloading" (showing skeletons)
    setAllFriends(prev => prev.filter(f => f._id !== friendId));

    try {
      const response = await friendService.delete(friendId);
      if (response.data && response.data.error) {
        // If deletion failed on the backend, revert the UI
        getAllFriends(currentPage);
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      // Revert the UI on error
      getAllFriends(currentPage);
    }
  };

  const getAllFriends = async (page = 1) => {
    try {
      const response = await friendService.getAll(page);
      if (response.data?.friends) {
        setAllFriends(response.data.friends);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);
        setTotalFriendsCount(response.data.totalFriends || response.data.friends.length);
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
      return;
    }
    
    // Find handles that are NOT already in our in-memory cache (userInfoMap)
    // We normalize to lowercase and trim to prevent casing/spacing mismatches
    const missingHandles = friends
      .map(f => f.handle.trim().toLowerCase())
      .filter(handle => !userInfoMap[handle]);

    // If we already have data for everyone, don't hit the API again!
    if (missingHandles.length === 0) {
      return;
    }
    
    const handlesToFetch = missingHandles.join(';');
    
    try {
      const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handlesToFetch}`);
      const userInfoData = await userInfoResponse.json();

      if (userInfoData.status === 'OK') {
        // Merge the newly fetched data with the existing cached data
        const infoMap = { ...userInfoMap };
        userInfoData.result.forEach(user => {
          // Save in the map using lowercase to ensure we can always find it
          infoMap[user.handle.toLowerCase()] = user;
        });
        setUserInfoMap(infoMap);
      }
    } catch (error) {
      console.error('Error during batch fetch:', error);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllFriends(1);
  };

  useEffect(() => {
    getAllFriends(1);
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
                    <span className="friend-count">{isSearch ? allFriends.length : totalFriendsCount}</span>
                    <span className="friend-text">
                      friend{totalFriendsCount !== 1 ? 's' : ''} tracked
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
                  // Lookup using the normalized handle
                  userData={userInfoMap[f.handle.trim().toLowerCase()]}
                  loading={false} // Global loading disabled, falls back to userData check
                  onEdit={() => handleEdit(f)}
                  onDelete={() => handleDelete(f)}
                  onViewAnalysis={() => navigate(`/profile/${f.handle}`)}
                  className="enhanced-card"
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {!isSearch && totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 space-x-4">
                <button 
                  onClick={() => getAllFriends(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center ${currentPage === 1 ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30'}`}
                >
                  Previous
                </button>
                <span className="text-gray-300 font-medium px-4 py-2 bg-gray-900/50 rounded-lg border border-white/10">
                  Page <span className="text-blue-400 font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button 
                  onClick={() => getAllFriends(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center ${currentPage === totalPages ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30'}`}
                >
                  Next
                </button>
              </div>
            )}

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
          getAllFriends={() => getAllFriends(currentPage)}
        />
      )}
    </>
  );
};

export default Home;