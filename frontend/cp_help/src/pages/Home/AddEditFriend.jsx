import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { friendService } from '../../services/api';
import { Loader2, X } from 'lucide-react';

const AddEditFriend = ({ friendData, type, getAllFriends, onClose }) => {
  const [handle, setHandle] = useState(friendData?.handle || "");
  const [name, setName] = useState(friendData?.name || "");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const addNewFriend = async () => {
    try {
      const response = await friendService.add({ handle, name });
      if (response.data && response.data.friend) {
        getAllFriends();
        onClose();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editFriend = async () => {
    const friendId = friendData._id;
    try {
      const response = await friendService.edit(friendId, { handle, name });
      if (response.data && response.data.friend) {
        getAllFriends();
        onClose();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriends = async () => {
    if (!handle) return setError("Please enter the handle");
    if (!name) return setError("Please enter the name");

    setIsLoading(true);
    setError("");

    if (type === "edit") {
      editFriend();
    } else {
      try {
        await friendService.validateHandle(handle);
      } catch (error) {
        if (error.response?.status === 404) {
          setError("Invalid Codeforces handle");
        } else {
          setError("Error validating handle");
        }
        setIsLoading(false);
        return;
      }
      addNewFriend();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-[#0f1225] rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-700/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/80">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {type === "edit" ? "Edit Friend" : "Add Friend"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {type === "edit" ? "Update friend details" : "Track a new Codeforces user"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Codeforces Handle
            </label>
            <input
              type="text"
              className={`w-full h-12 px-4 rounded-xl border border-slate-600 bg-slate-800/50 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-white placeholder-slate-500 ${type === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="e.g. tourist"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              disabled={type === 'edit'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-xl border border-slate-600 bg-slate-800/50 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-white placeholder-slate-500"
              placeholder="e.g. Gennady Korotkevich"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/80 bg-slate-900/50">
          <button
            className={`w-full h-12 flex items-center justify-center rounded-xl font-bold text-white transition-all
              ${isLoading ? 'bg-indigo-400/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20'}
            `}
            onClick={handleAddFriends}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {type === "edit" ? "UPDATING..." : "ADDING..."}
              </>
            ) : (
              type === "edit" ? "UPDATE FRIEND" : "ADD FRIEND"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddEditFriend;