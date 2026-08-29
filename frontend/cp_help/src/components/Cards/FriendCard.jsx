import { MdCreate, MdDelete, MdLocationOn, MdEmojiEvents, MdCode } from 'react-icons/md';
import { getColorByRating } from '../../utils/helper';
import './FriendCard.css';

const FriendCard = ({
  friend,
  onEdit,
  onDelete,
  onViewAnalysis
}) => {
  const {
    handle, name, rating, maxRating, rank, contribution,
    contestsCount, solvedCount, country, city, organization, friendOfCount
  } = friend;

  // Helper function to get background gradient based on rating
  const getCardBackground = (r) => {
    if (!r || r < 1200) return 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0a0a0a 100%)';
    if (r < 1400) return 'linear-gradient(135deg, #1a4d1a 0%, #0d2d0d 50%, #051405 100%)';
    if (r < 1600) return 'linear-gradient(135deg, #1a4d4d 0%, #0d2d2d 50%, #051414 100%)';
    if (r < 1900) return 'linear-gradient(135deg, #1a1a4d 0%, #0d0d2d 50%, #050514 100%)';
    if (r < 2100) return 'linear-gradient(135deg, #4d1a4d 0%, #2d0d2d 50%, #140514 100%)';
    if (r < 2400) return 'linear-gradient(135deg, #4d2d1a 0%, #2d1a0d 50%, #140a05 100%)';
    return 'linear-gradient(135deg, #4d1a1a 0%, #2d0d0d 50%, #140505 100%)';
  };

  const ratingColor = getColorByRating(rating || 0);
  const maxRatingColor = getColorByRating(maxRating || 0);
  const cardBackground = getCardBackground(rating || 0);
  const hasStats = rating > 0 || solvedCount > 0;

  return (
    <div 
      className="rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative border border-white/10"
      style={{ background: cardBackground }}
    >
      <div className="metallic-header p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-xs font-mono text-gray-300">@{handle}</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${ratingColor}`}>
            {!hasStats && !rating ? <span className="text-gray-400 text-sm italic">Syncing...</span> : (rating || 0)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-grow">
        <div className="grid grid-cols-2 gap-2">
          <div className="metallic-stat rounded-lg p-3 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold mb-1">Rank</p>
            <p className={`font-bold text-sm ${ratingColor}`}>
              {rank || "Unrated"}
            </p>
          </div>
          <div className="metallic-stat rounded-lg p-3 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold mb-1">Max Rating</p>
            <p className={`font-bold text-sm ${maxRatingColor}`}>
              {maxRating || "Unrated"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="metallic-stat rounded-lg p-2 text-center">
            <p className="text-xs text-gray-300 uppercase font-semibold">Contrib</p>
            <p className={`font-bold text-sm ${(contribution || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {contribution || 0}
            </p>
          </div>
          <div className="metallic-stat rounded-lg p-2 text-center">
            <MdEmojiEvents className="text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-gray-300 uppercase font-semibold">Contests</p>
            <p className="font-bold text-sm text-white">{contestsCount !== undefined ? contestsCount : '-'}</p>
          </div>
          <div className="metallic-stat rounded-lg p-2 text-center">
            <MdCode className="text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-300 uppercase font-semibold">Solved</p>
            <p className="font-bold text-sm text-white">{solvedCount !== undefined ? solvedCount : '-'}</p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {(country || city) && (
            <div className="flex items-center text-gray-300">
              <MdLocationOn className="mr-1 text-gray-400" />
              <p className="truncate">
                {city ? `${city}, ` : ""}{country}
              </p>
            </div>
          )}
          {organization && (
            <p className="text-gray-300 truncate text-sm">
              <span className="font-medium">Org:</span> {organization}
            </p>
          )}
          {friendOfCount > 0 && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium">Friends:</span> {friendOfCount}
            </p>
          )}
        </div>
      </div>

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