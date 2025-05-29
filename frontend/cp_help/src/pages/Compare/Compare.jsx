import React, { useState, useEffect } from "react";
import "./Compare.css";
import Navbar from "../../components/Navbar/Navbar";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const Compare = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");
  const navigate = useNavigate();
  const getUserInfo = async () => {
    try {
      const { data } = await axiosInstance.get('/get-user');
      if (data.user) setUserInfo(data.user);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);
  


  const handleSubmit = (e) => {
    e.preventDefault();
    const a = user1.trim();
    const b = user2.trim();
    if (a && b) {
      navigate(`/compare-result?u1=${a}&u2=${b}`);
    }
  };

  return (
    <>
        <Navbar
          userInfo={userInfo}
          showSearchBar = {false}
        />

      <div className="compare-container">
        <div className="compare-background">
          <div className="compare-card">
            <div className="compare-header">
              <h1 className="compare-title">
                Compare Profiles
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="compare-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter first Codeforces handle"
                  value={user1}
                  onChange={(e) => setUser1(e.target.value)}
                  className="compare-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Enter second Codeforces handle"
                  value={user2}
                  onChange={(e) => setUser2(e.target.value)}
                  className="compare-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="compare-button"
                disabled={!user1.trim() || !user2.trim()}
              >
                <span className="button-text">🚀 Compare Profiles</span>
                <div className="button-glow"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Compare;