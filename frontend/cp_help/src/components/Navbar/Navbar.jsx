import React, { useState } from 'react';
import './Navbar.css';  // Import the new CSS file
import ProfileInfo from '../Cards/ProfileInfo';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';

const Navbar = ({ userInfo, showSearchBar, onSearchFriend, handleClearSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const goToHome = () => navigate('/dashboard');
  const goToProblems = () => navigate('/problems/' + userInfo.codeforcesHandle);
  const goToCompare = () => navigate('/Compare');
  const goToContests = () => navigate('/Contests');
  const showProfile = () => navigate('/profile/' + userInfo.codeforcesHandle);

  const handleSearch = () => {
    if (searchQuery) onSearchFriend(searchQuery);
  };

  const onClearSearch = () => {
    setSearchQuery('');
    handleClearSearch();
  };

  return (
    <nav className="navbar-container">
      {/* Left - Logo */}
      <div className="navbar-logo" onClick={goToHome}>
        <h2 className="navbar-brand">CodeSphere</h2>
      </div>

      {/* Nav Links */}
      <div className="navbar-links">
        {[
          ['Home', goToHome],
          ['Problems', goToProblems],
          ['Compare', goToCompare],
          ['Contests', goToContests],
        ].map(([label, handler]) => {
          const isContest = label === 'Contests';
          return (
            <div
              key={label}
              onClick={handler}
              className={`navbar-link ${isContest ? 'glitter-text' : ''}`}            
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="navbar-search">
          <SearchBar
            value={searchQuery}
            onChange={({ target }) => setSearchQuery(target.value)}
            handleSearch={handleSearch}
            onClearSearch={onClearSearch}
          />
        </div>
      )}

      {/* Right - Profile */}
      <div className="navbar-profile">
        <ProfileInfo
          userInfo={userInfo}
          onLogout={onLogout}
          showProfile={showProfile}
        />
      </div>
    </nav>
  );
};

export default Navbar;