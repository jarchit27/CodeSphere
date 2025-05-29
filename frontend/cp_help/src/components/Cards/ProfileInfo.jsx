import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { getInitials } from '../../utils/helper';

const ProfileInfo = ({ userInfo, onLogout, showProfile }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (!userInfo) return null;

  return (
    <div className="relative inline-flex items-center gap-1 sm:gap-2" ref={dropdownRef}>
      {/* Initials Circle */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full text-black text-base sm:text-lg font-semibold bg-slate-100 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        {getInitials(userInfo.fullname)}
      </button>

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus:outline-none p-1 sm:p-2"
        aria-hidden="true"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? (
          <ChevronUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-white border rounded-md shadow-md z-30"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <button
            onClick={showProfile}
            className="block px-3 py-2 w-full text-left text-sm sm:text-base hover:bg-gray-100"
            role="menuitem"
          >
            My Profile
          </button>
          <button
            onClick={onLogout}
            className="block px-3 py-2 w-full text-left text-red-600 text-sm sm:text-base hover:bg-gray-100"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;