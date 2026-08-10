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
    localStorage.clear(); // Fallback
    navigate('/login');
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
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0a0a1a]/80 border-b border-slate-700/80 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section: Logo & Nav Links */}
          <div className="flex items-center gap-8">
            {/* Logo Section */}
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                CodeSphere
              </span>
            </div>

            {/* Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-500/20 text-indigo-300' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Section: Search & Profile */}
          <div className="flex items-center gap-4">
            {showSearchBar && (
              <div className="hidden sm:block w-64">
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
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a1a] border-t border-slate-700/80 px-4 pt-4 pb-6 space-y-2 shadow-xl">
          {showSearchBar && (
            <div className="sm:hidden mb-4">
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
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
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