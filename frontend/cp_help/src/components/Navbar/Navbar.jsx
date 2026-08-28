import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileInfo from '../Cards/ProfileInfo';
import SearchBar from '../SearchBar/SearchBar';
import { Code2, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ userInfo, showSearchBar, onSearchFriend, handleClearSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); // If AuthContext exports logout

  const onLogout = () => {
    logout(); // Clear AuthContext state properly
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Problems', path: '/problems' },
    { name: 'Compare', path: '/compare' },
    { name: 'Contests', path: '/contests' },
  ];

  const handleSearch = () => {
    if (searchQuery) onSearchFriend(searchQuery);
  };

  const onClearSearch = () => {
    setSearchQuery('');
    handleClearSearch();
  };

  return (
    <nav className="cosmic-navbar">
      <div className="cosmic-navbar-inner">
        <div className="cosmic-navbar-row">

          {/* Left Section: Logo & Nav Links */}
          <div className="cosmic-nav-left">
            {/* Logo */}
            <div className="cosmic-logo" onClick={() => navigate('/dashboard')}>
              <div className="cosmic-logo-icon">
                <Code2 className="cosmic-logo-svg" />
              </div>
              <span className="cosmic-logo-text">CodeSphere</span>
            </div>

            {/* Navigation Links (Desktop) */}
            <div className="cosmic-nav-links">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.path)}
                    className={`cosmic-nav-link ${isActive ? 'cosmic-nav-link--active' : ''}`}
                  >
                    {link.name}
                    {isActive && <span className="cosmic-nav-link-underline" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Section: Search & Profile */}
          <div className="cosmic-nav-right">
            {showSearchBar && (
              <div className="cosmic-searchbar-wrap">
                <SearchBar
                  value={searchQuery}
                  onChange={({ target }) => setSearchQuery(target.value)}
                  handleSearch={handleSearch}
                  onClearSearch={onClearSearch}
                />
              </div>
            )}

            <ProfileInfo
              userInfo={userInfo}
              onLogout={onLogout}
              showProfile={() => navigate('/profile/' + userInfo?.codeforcesHandle)}
            />

            {/* Mobile Menu Toggle */}
            <button
              className="cosmic-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="cosmic-mobile-menu">
          {showSearchBar && (
            <div className="cosmic-mobile-search">
              <SearchBar
                value={searchQuery}
                onChange={({ target }) => setSearchQuery(target.value)}
                handleSearch={handleSearch}
                onClearSearch={onClearSearch}
              />
            </div>
          )}
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => { navigate(link.path); setIsMobileMenuOpen(false); }}
                className={`cosmic-mobile-link ${isActive ? 'cosmic-mobile-link--active' : ''}`}
              >
                {link.name}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;