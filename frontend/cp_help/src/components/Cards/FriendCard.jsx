import { MdCreate, MdDelete, MdLocationOn, MdEmojiEvents, MdCode } from 'react-icons/md';
import { getBgColorByRating, getColorByRating } from '../../utils/helper';
import './FriendCard.css';

const FriendCard = ({
  handle,
  name,
  date,
  userData,
  solvedCount,
  contestsCount,
  loading,
  onEdit,
  onDelete,
  onViewAnalysis
}) => {
  
  // Helper function to get background gradient based on rating
  const getCardBackground = (rating) => {
    if (!rating || rating < 1200) {
      // Gray/Default
      return 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0a0a0a 100%)';
    } else if (rating < 1400) {
      // Green
      return 'linear-gradient(135deg, #1a4d1a 0%, #0d2d0d 50%, #051405 100%)';
    } else if (rating < 1600) {
      // Cyan
      return 'linear-gradient(135deg, #1a4d4d 0%, #0d2d2d 50%, #051414 100%)';
    } else if (rating < 1900) {
      // Blue
      return 'linear-gradient(135deg, #1a1a4d 0%, #0d0d2d 50%, #050514 100%)';
    } else if (rating < 2100) {
      // Purple
      return 'linear-gradient(135deg, #4d1a4d 0%, #2d0d2d 50%, #140514 100%)';
    } else if (rating < 2400) {
      // Orange
      return 'linear-gradient(135deg, #4d2d1a 0%, #2d1a0d 50%, #140a05 100%)';
    } else {
      // Red
      return 'linear-gradient(135deg, #4d1a1a 0%, #2d0d0d 50%, #140505 100%)';
    }
  };

  // Handle case where userData might not exist yet
  if (loading || !userData) {
    return (
      <div className="space-card rounded-xl p-5 my-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 w-3/4 bg-white/20 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="mt-3 text-sm text-gray-300 text-center">
          <span>Loading Codeforces data for @{handle}...</span>
        </div>
      </div>
    );
  }

  // Safety check for userData
  if (!userData || typeof userData !== 'object') {
    return (
      <div className="space-card rounded-xl p-4 my-3 shadow-lg">
        <div className="flex items-center text-red-400">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Error for @{handle}: Failed to load data</p>
          </div>
        </div>
      </div>
    );
  }

  const ratingColor = getColorByRating(userData.rating);
  const maxRatingColor = getColorByRating(userData.maxRating);
  const cardBackground = getCardBackground(userData.rating);

  return (
    <div 
      className="rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative border border-white/10"
      style={{ background: cardBackground }}
    >
      {/* Header */}
      <div className="metallic-header p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-bold text-white">
                {name}
              </h3>
              <p className="text-xs font-mono text-gray-300">@{handle}</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${ratingColor}`}>
            {userData.rating || 0}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-grow">
        {/* Ranks */}
        <div className="grid grid-cols-2 gap-2">
          <div className="metallic-stat rounded-lg p-3 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold mb-1">Rank</p>
            <p className={`font-bold text-sm ${ratingColor}`}>
              {userData.rank || "Unrated"}
            </p>
          </div>
          <div className="metallic-stat rounded-lg p-3 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold mb-1">Max Rating</p>
            <p className={`font-bold text-sm ${maxRatingColor}`}>
              {userData.maxRating || "Unrated"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="metallic-stat rounded-lg p-2 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold">Contrib</p>
            <p className={`font-bold text-sm ${(userData.contribution || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {userData.contribution || 0}
            </p>
          </div>
          <div className="metallic-stat rounded-lg p-2 text-center">
            <MdEmojiEvents className="text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-gray-300 uppercase font-semibold">Contests</p>
            <p className="font-bold text-sm text-white">
              {contestsCount !== undefined ? contestsCount : '...'}
            </p>
          </div>
          <div className="metallic-stat rounded-lg p-2 text-center">
            <MdCode className="text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-300 uppercase font-semibold">Solved</p>
            <p className="font-bold text-sm text-white">
              {solvedCount !== undefined ? solvedCount : '...'}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1 text-sm">
          {(userData.country || userData.city) && (
            <div className="flex items-center text-gray-300">
              <MdLocationOn className="mr-1 text-gray-400" />
              <p className="truncate">
                {userData.city ? `${userData.city}, ` : ""}
                {userData.country}
              </p>
            </div>
          )}
          
          {userData.organization && (
            <p className="text-gray-300 truncate text-sm">
              <span className="font-medium">Org:</span> {userData.organization}
            </p>
          )}
          
          {userData.friendOfCount && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium">Friends:</span> {userData.friendOfCount}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="space-footer px-4 py-3 mt-auto">
        <div className="flex items-center justify-between">
          <button 
            className="space-button px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center space-x-1 text-sm" 
            onClick={onViewAnalysis}
          >
            <span>View Analysis</span>
          </button>
          <div className="flex items-center space-x-2">
            <button 
              className="space-button p-2 rounded-full text-gray-300 hover:text-green-400 transition-colors" 
              onClick={onEdit}
            >
              <MdCreate className="text-xl" />
            </button>
            <button 
              className="space-button p-2 rounded-full text-gray-300 hover:text-red-400 transition-colors" 
              onClick={onDelete}
            >
              <MdDelete className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;