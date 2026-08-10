import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
        className="h-10 w-10 flex items-center justify-center rounded-full text-indigo-300 text-sm font-bold bg-indigo-600/30 hover:bg-indigo-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        {getInitials(userInfo.fullname)}
      </button>

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus:outline-none p-1 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-700"
        aria-hidden="true"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <div className="px-4 py-3 border-b border-slate-700 mb-1">
            <p className="text-sm font-medium text-white truncate">{userInfo.fullname}</p>
            <p className="text-xs text-slate-400 truncate">@{userInfo.codeforcesHandle}</p>
          </div>
          <button
            onClick={() => { setOpen(false); showProfile(); }}
            className="block px-4 py-2 w-full text-left text-sm text-slate-200 hover:bg-slate-800 hover:text-indigo-400 transition-colors"
            role="menuitem"
          >
            My Profile
          </button>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="block px-4 py-2 w-full text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;