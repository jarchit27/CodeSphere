import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Contests.css";

export default function Contests() {
  const [contests, setContests] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const textToBinary = (text) => {
    return text.slice(0, 8).split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('').slice(0, 8);
  };

  const generateBinaryPattern = (contestName, index) => {
    const patterns = [
      textToBinary("CONTEST"), textToBinary("CODING"), textToBinary("BATTLE"),
      textToBinary("FIGHT"), textToBinary("WIN"), textToBinary("CODE"),
      textToBinary("ALGO"), textToBinary("DATA"),
    ];
    const hash = contestName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return patterns[hash % patterns.length];
  };

  useEffect(() => {
    axios.get("https://api.digitomize.com/contests")
      .then((res) => {
        setTotal(res.data.total || 0);
        setContests(res.data.results || []);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="contests-container">
        <div className="stars"></div>
        <div className="contests-error">
          <div className="error-icon">⚠️</div>
          <p>Connection to contest database failed</p>
          <span className="error-code">[ERROR_404_NETWORK]</span>
        </div>
      </div>
    );
  }

  if (contests === null) {
    return (
      <div className="contests-container">
        <div className="stars"></div>
        <div className="contests-loading">
          <div className="loading-spinner"></div>
          <p>Fetching contest data...</p>
          <span className="loading-code">[LOADING_CONTESTS.EXE]</span>
        </div>
      </div>
    );
  }

  return (
    <div className="contests-container">
      <div className="stars"></div>
      <div className="lightning"></div>
      
      <div className="contests-content">
        <header className="contests-header">
          <div className="header-left">
            <h1 className="contests-title">
              <span className="title-bracket">&lt;</span>
              <span className="title-text">Upcoming Contests</span>
              <span className="title-bracket">/&gt;</span>
            </h1>
            <div className="contests-stats">
              <span className="stat-item">
                <span className="stat-label">TOTAL:</span>
                <span className="stat-value">{total}</span>
              </span>
              <span className="binary-decoration">{textToBinary("TOTAL")}</span>
            </div>
          </div>
          
          <button className="home-btn" onClick={() => navigate("/dashboard")}>
            <span>DASHBOARD</span>
          </button>
        </header>

        <div className="contests-grid">
          {contests.map((c, index) => {
            const getBadgeClass = (host) => {
              const hostClasses = {
                codeforces: 'badge-codeforces', codechef: 'badge-codechef',
                leetcode: 'badge-leetcode', atcoder: 'badge-atcoder',
                geeksforgeeks: 'badge-geeksforgeeks', codingninjas: 'badge-codingninjas',
              };
              return hostClasses[host] || 'badge-default';
            };

            return (
              <div key={c.vanity} className="contest-card">
                <div className="card-glow"></div>
                <div className="card-header">
                  <div className={`contest-host-badge ${getBadgeClass(c.host)}`}>
                    {c.host.toUpperCase()}
                  </div>
                  <div className="card-corner-decoration"></div>
                </div>

                <h2 className="contest-title-card">
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    {c.name}
                  </a>
                </h2>

                <div className="contest-details">
                  <div className="detail-row">
                    <span className="detail-icon">🔗</span>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="contest-link">
                      {c.host.charAt(0).toUpperCase() + c.host.slice(1)} Platform
                    </a>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <div className="detail-content">
                      <span className="detail-label">START:</span>
                      <span className="detail-value">
                        {new Date(c.startTimeUnix * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏱️</span>
                    <div className="detail-content">
                      <span className="detail-label">DURATION:</span>
                      <span className="detail-value">{c.duration} min</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="binary-pattern">
                    {generateBinaryPattern(c.name, index)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}