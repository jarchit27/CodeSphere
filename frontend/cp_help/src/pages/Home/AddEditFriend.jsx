import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { friendService } from '../../services/api';
import axios from 'axios';
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

    try {
      const validateRes = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      if (validateRes.data.status !== "OK") {
        setError("Invalid Codeforces handle");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setError("Invalid handle error");
      setIsLoading(false);
      return;
    }

    if (type === "edit") {
      editFriend();
    } else {
      addNewFriend();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {type === "edit" ? "Edit Friend" : "Add Friend"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {type === "edit" ? "Update friend details" : "Track a new Codeforces user"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Codeforces Handle
            </label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-800"
              placeholder="e.g. tourist"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-800"
              placeholder="e.g. Gennady Korotkevich"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-sm font-medium text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            className={`w-full h-12 flex items-center justify-center rounded-xl font-bold text-white transition-all
              ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200'}
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