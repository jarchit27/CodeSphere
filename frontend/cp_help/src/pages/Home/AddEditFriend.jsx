import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';

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
      const response = await axiosInstance.post("/add-friend", {
        handle,
        name,
      });
      if (response.data && response.data.friend) {
        getAllFriends();
        onClose();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editFriend = async () => {
    const friendId = friendData._id;
    try {
      const response = await axiosInstance.put("/edit-friend/" + friendId, {
        handle,
        name,
      });
      if (response.data && response.data.friend) {
        getAllFriends();
        onClose();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriends = async () => {
    if (!handle) {
      setError("Please enter the handle");
      return;
    }
    if (!name) {
      setError("Please enter the name");
      return;
    }

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderRadius: '16px',
          border: '1px solid #475569',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '600px',
          position: 'relative',
          maxHeight: '90vh',
          overflow: 'hidden' // Changed from overflowY: 'auto' to prevent scrollbar
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Metallic gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(88, 28, 135, 0.2) 50%, rgba(15, 23, 42, 0.2) 100%)',
          borderRadius: '16px',
          pointerEvents: 'none'
        }}></div>
        


        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          padding: '32px',
          maxHeight: '90vh',
          overflowY: 'auto' // Moved the scroll to the content area only
        }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '30px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px'
            }}>
              {type === "edit" ? "Edit Friend" : "Add New Friend"}
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              {type === "edit" ? "Update friend information" : "Add a new friend to your list"}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Handle Input */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Codeforces Handle
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    padding: '0 20px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box' // Added to prevent overflow
                  }}
                  placeholder="Enter codeforces handle..."
                  value={handle}
                  onChange={({ target }) => setHandle(target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#475569';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Display Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    padding: '0 20px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box' // Added to prevent overflow
                  }}
                  placeholder="Enter display name..."
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#475569';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '16px',
                background: 'rgba(127, 29, 29, 0.3)',
                border: '1px solid rgba(185, 28, 28, 0.5)',
                borderRadius: '12px'
              }}>
                <p style={{ color: '#fca5a5', textAlign: 'center', fontWeight: '500', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ paddingTop: '16px' }}>
              <button
                style={{
                  width: '100%',
                  height: '56px',
                  background: isLoading ? '#64748b' : 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={handleAddFriends}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '12px'
                      }}></div>
                      {type === "edit" ? "UPDATING..." : "ADDING..."}
                    </>
                  ) : (
                    type === "edit" ? "UPDATE FRIEND" : "ADD FRIEND"
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '32px',
          right: '80px',
          width: '12px',
          height: '12px',
          background: '#60a5fa',
          borderRadius: '50%',
          opacity: 0.6,
          animation: 'pulse 2s infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '32px',
          width: '8px',
          height: '8px',
          background: '#a78bfa',
          borderRadius: '50%',
          opacity: 0.4,
          animation: 'pulse 2s infinite'
        }}></div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );

  // Use createPortal to render the modal at the document body level
  return createPortal(modalContent, document.body);
};

export default AddEditFriend;