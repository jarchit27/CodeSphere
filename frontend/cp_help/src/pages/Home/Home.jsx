import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import FriendCard from '../../components/Cards/FriendCard';
import { MdAdd, MdSort } from 'react-icons/md';
import AddEditFriend from './AddEditFriend';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/constants';

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

  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const eventSourceRef = useRef(null);

  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  const handleEdit = (friendDetails) => {
    setOpenAddEditModal({ isShown: true, data: friendDetails, type: 'edit' });
  };

  const handleDelete = async (friendDetails) => {
    const friendId = friendDetails._id;
    setAllFriends(prev => prev.filter(f => f._id !== friendId));

    try {
      const response = await friendService.delete(friendId);
      if (response.data && response.data.error) {
        getAllFriends(currentPage, sortBy, order);
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      getAllFriends(currentPage, sortBy, order);
    }
  };

  const getAllFriends = async (page = 1, currentSortBy = sortBy, currentOrder = order) => {
    try {
      const response = await friendService.getAll(page, currentSortBy, currentOrder);
      if (response.data?.friends) {
        setAllFriends(response.data.friends);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);
        setTotalFriendsCount(response.data.totalFriends || response.data.friends.length);
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
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllFriends(1, sortBy, order);
  };

  useEffect(() => {
    getAllFriends(1, sortBy, order);
  }, [sortBy, order]);

  // SSE: Open a persistent connection to receive real-time sync updates.
  // When the backend finishes syncing a handle, it pushes an event here
  // and we re-fetch the friends list exactly once — zero polling overhead.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const sseUrl = `${BASE_URL}/sync-events?token=${token}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'synced') {
          // A handle just finished syncing — refresh the list
          getAllFriends(currentPage, sortBy, order);
        }
      } catch (e) {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects, so we don't need to do anything
      console.warn('[SSE] Connection error, will auto-reconnect...');
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
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
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Sort Controls */}
                <div className="sort-controls">
                  <div className="sort-controls-inner">
                    <MdSort className="sort-icon" />
                    <CustomSelect 
                      label="Sort by"
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'name', label: 'Name' },
                        { value: 'rating', label: 'Rating' },
                        { value: 'highestRating', label: 'Max Rating' },
                        { value: 'contests', label: 'Contests' },
                        { value: 'problems', label: 'Solved' }
                      ]}
                    />
                    <div className="sort-divider"></div>
                    <CustomSelect 
                      label="Order"
                      value={order}
                      onChange={setOrder}
                      options={[
                        { value: 'asc', label: 'Ascending ↑' },
                        { value: 'desc', label: 'Descending ↓' }
                      ]}
                    />
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
          </div>

          <div className="cards-container">
            <div className="cards-grid">
              {allFriends.map((f) => (
                <FriendCard
                  key={f._id}
                  friend={f}
                  onEdit={() => handleEdit(f)}
                  onDelete={() => handleDelete(f)}
                  onViewAnalysis={() => navigate(`/profile/${f.handle}`)}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {!isSearch && totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 space-x-4">
                <button 
                  onClick={() => getAllFriends(currentPage - 1, sortBy, order)}
                  disabled={currentPage === 1}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center ${currentPage === 1 ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30'}`}
                >
                  Previous
                </button>
                <span className="text-gray-300 font-medium px-4 py-2 bg-gray-900/50 rounded-lg border border-white/10">
                  Page <span className="text-blue-400 font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button 
                  onClick={() => getAllFriends(currentPage + 1, sortBy, order)}
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
                <h3 className="empty-title">No friends found</h3>
                <p className="empty-description">
                  {isSearch 
                    ? "Try adjusting your search query." 
                    : "Start by adding your first Codeforces friend to track their progress and explore the cosmic leaderboards!"}
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
          getAllFriends={() => getAllFriends(currentPage, sortBy, order)}
        />
      )}
    </>
  );
};

export default Home;