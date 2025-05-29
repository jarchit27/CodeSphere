import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';
import { getColorByRating, getRankTitle } from '../../utils/helper';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler 
);

const ViewAnalysis = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const { handle } = useParams();
  const [ratingData, setRatingData] = useState({ labels: [], data: [] });
  const [levelData, setLevelData] = useState({});
  const [verdictData, setVerdictData] = useState({});
  const [tagData, setTagData] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  const getUserInfo = async() => {
    try{
      const response = await axiosInstance.get("/get-user");
      if(response.data && response.data.user){
        setUserInfo(response.data.user);
      }
    }
    catch(error){
      if(error.response && error.response.status === 401)
      {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    getUserInfo();

    const fetchData = async () => {
      try {
        const [profileRes, ratingRes, submissionsRes] = await Promise.all([
          fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
          fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
          fetch(`https://codeforces.com/api/user.status?handle=${handle}`),
        ]);

        const profileJson = await profileRes.json();
        const ratingJson = await ratingRes.json();
        const submissionsJson = await submissionsRes.json();

        if (profileJson.status !== 'OK' || ratingJson.status !== 'OK' || submissionsJson.status !== 'OK') {
          throw new Error('Failed to fetch data');
        }

        setProfileData(profileJson.result[0]);

        const labels = ratingJson.result.map(r => r.contestName.substring(0, 20) + (r.contestName.length > 20 ? '...' : ''));
        const ratings = ratingJson.result.map(r => r.newRating);
        setRatingData({ labels, data: ratings });

        const levelCounts = {};
        const verdictCounts = {};
        const tagCounts = {};
        const solvedSet = new Set();

        submissionsJson.result.forEach(sub => {
          const key = `${sub.problem.contestId}-${sub.problem.index}`;
          const { verdict, problem } = sub;

          if (verdict === 'OK' && problem.rating && !solvedSet.has(key)) {
            solvedSet.add(key);

            levelCounts[problem.rating] = (levelCounts[problem.rating] || 0) + 1;

            if (problem.tags && problem.tags.length > 0) {
              problem.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          }

          verdictCounts[verdict] = (verdictCounts[verdict] || 0) + 1;
        });

        setLevelData(levelCounts);
        setVerdictData(verdictCounts);
        setTagData(tagCounts);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile data. Please check the handle and try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [handle, navigate]);

  const formatVerdict = (verdict) => {
    const verdictMap = {
      'OK': 'Accepted',
      'WRONG_ANSWER': 'Wrong Answer',
      'TIME_LIMIT_EXCEEDED': 'Time Limit',
      'MEMORY_LIMIT_EXCEEDED': 'Memory Limit',
      'RUNTIME_ERROR': 'Runtime Error',
      'COMPILATION_ERROR': 'Compilation Error',
      'SKIPPED': 'Skipped',
      'CHALLENGED': 'Challenged',
      'PARTIAL': 'Partial',
      'REJECTED': 'Rejected'
    };
    
    return verdictMap[verdict] || verdict;
  };

  const getVerdictColors = () => {
    return Object.keys(verdictData).map(verdict => {
      const colorMap = {
        'OK': 'rgba(75, 192, 192, 0.8)',
        'WRONG_ANSWER': 'rgba(255, 99, 132, 0.8)',
        'TIME_LIMIT_EXCEEDED': 'rgba(255, 159, 64, 0.8)',
        'MEMORY_LIMIT_EXCEEDED': 'rgba(153, 102, 255, 0.8)',
        'RUNTIME_ERROR': 'rgba(255, 205, 86, 0.8)',
        'COMPILATION_ERROR': 'rgba(201, 203, 207, 0.8)',
        'SKIPPED': 'rgba(54, 162, 235, 0.8)',
        'CHALLENGED': 'rgba(255, 99, 71, 0.8)',
        'PARTIAL': 'rgba(106, 176, 76, 0.8)',
        'REJECTED': 'rgba(169, 169, 169, 0.8)'
      };
      return colorMap[verdict] || 'rgba(100, 100, 100, 0.8)';
    });
  };

  const calculateTotal = (data) => {
    return Object.values(data).reduce((acc, curr) => acc + curr, 0);
  };

  const getTopTags = () => {
    return Object.entries(tagData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading analysis for <span className="font-bold text-blue-600">@{handle}</span>...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <div className="text-xl font-medium text-gray-800 mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => navigate(-1)} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar userInfo={userInfo} showSearchBar={false}></Navbar>
    <div className="min-h-screen bg-gray-100">
      {/* Profile Header */}
      {profileData && (
        // <div className=" py-6 px-4">
          <div className="container mx-auto py-6 px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">{profileData.firstName || ''} {profileData.lastName || ''}</h1>
                <div className="text-lg font-medium mb-1">@{handle}</div>
                <div className={`text-xl font-bold ${getColorByRating(profileData.rating)}`}>
                  {getRankTitle(profileData.rating)} ({profileData.rating || 'Unrated'})
                </div>
                <div className="text-sm opacity-80 mt-2">
                  {profileData.country && <span className="mr-3">📍 {profileData.country}</span>}
                  {profileData.organization && <span>🏢 {profileData.organization}</span>}
                </div>
              </div>
              <div className="ml-auto hidden md:flex">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm">Max Rating</div>
                      <div className={`text-xl font-bold ${getColorByRating(profileData.maxRating)}`}>
                        {profileData.maxRating || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">Contribution</div>
                      <div className={`text-xl font-bold ${profileData.contribution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profileData.contribution > 0 ? '+' : ''}{profileData.contribution || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        // </div>
      )}

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Stats Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">📊 Problems Solved</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {calculateTotal(levelData)}
            </div>
            <div className="text-sm text-gray-500">across different difficulty levels</div>
          </div>
          
          {/* Stats Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🧩 Total Submissions</h3>
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {calculateTotal(verdictData)}
            </div>
            <div className="text-sm text-gray-500">
              with {verdictData['OK'] || 0} accepted solutions
            </div>
          </div>
          
          {/* Stats Card 3 */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🔝 Top Tags</h3>
            <div className="space-y-1">
              {getTopTags().map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{item.tag}</span>
                  <span className="text-blue-600 font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating History */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">📈 Rating History</h3>
            <div className="h-64 md:h-80">
              <Line
                data={{
                  labels: ratingData.labels,
                  datasets: [
                    {
                      label: 'Rating',
                      data: ratingData.data,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.2,
                      pointRadius: 3,
                      pointHoverRadius: 5,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          if (!items.length) return '';
                          const idx = items[0].dataIndex;
                          return ratingData.labels[idx];
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      title: {
                        display: true,
                        text: 'Rating'
                      }
                    },
                    x: {
                      display: false,
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Problem Difficulty */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Problems by Difficulty</h3>
            <div className="h-64 md:h-80">
              <Bar
                data={{
                  labels: Object.keys(levelData).sort((a, b) => Number(a) - Number(b)),
                  datasets: [
                    {
                      label: 'Problems Solved',
                      data: Object.keys(levelData).sort((a, b) => Number(a) - Number(b)).map(key => levelData[key]),
                      backgroundColor: 'rgba(99, 102, 241, 0.7)',
                      borderColor: 'rgba(99, 102, 241, 1)',
                      borderWidth: 1,
                      barThickness: 'flex',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      title: {
                        display: true,
                        text: 'Problems Count'
                      }
                    },
                    x: {
                      grid: { display: false },
                      title: {
                        display: true,
                        text: 'Difficulty Rating'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Verdict Distribution */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">✅ Verdict Distribution</h3>
            <div className="h-96 md:h-96 ">
              <Doughnut
                data={{
                  labels: Object.keys(verdictData).map(formatVerdict),
                  datasets: [
                    {
                      data: Object.values(verdictData),
                      backgroundColor: getVerdictColors(),
                      borderColor: 'white',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          </div>

          {/* Problem Tags */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🏷️ Problems by Tags</h3>
            <div className="h-96 md:h-96 overflow-y-auto">
              <Bar
                data={{
                  labels: Object.entries(tagData)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag]) => tag),
                  datasets: [
                    {
                      label: 'Problems',
                      data: Object.entries(tagData)
                        .sort((a, b) => b[1] - a[1])
                        .map(([_, count]) => count),
                      backgroundColor: 'rgba(139, 92, 246, 0.7)',
                      borderColor: 'rgba(139, 92, 246, 1)',
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'x',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          return `${context.raw} problems`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      title: {
                        display: true,
                        text: 'Problems Count'
                      }
                    },
                    x: {
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ViewAnalysis;