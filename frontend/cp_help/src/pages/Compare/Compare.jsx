import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line, Bar } from "react-chartjs-2";
import { Loader2, Search, AlertCircle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const rankColors = {
  newbie: { bg: "bg-gray-200", text: "text-gray-800" },
  pupil: { bg: "bg-green-100", text: "text-green-800" },
  specialist: { bg: "bg-cyan-100", text: "text-cyan-800" },
  expert: { bg: "bg-blue-100", text: "text-blue-800" },
  candidateMaster: { bg: "bg-purple-100", text: "text-purple-800" },
  master: { bg: "bg-orange-100", text: "text-orange-800" },
  internationalMaster: { bg: "bg-orange-200", text: "text-orange-900" },
  grandmaster: { bg: "bg-red-200", text: "text-red-800" },
  internationalGrandmaster: { bg: "bg-red-300", text: "text-red-900" },
  legendaryGrandmaster: { bg: "bg-red-500", text: "text-white" },
};

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 shadow-sm backdrop-blur-sm">
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function UserCard({ stats }) {
  const {
    handle, avatar, rank, maxRank, rating, maxRating, contribution,
    organization, totalContests, lastDate, solvedCount, acceptance, avg45,
  } = stats;

  const primary = rankColors[rank] || rankColors.newbie;
  const secondary = rankColors[maxRank] || rankColors.newbie;

  return (
    <div className="bg-slate-800/80 p-6 rounded-xl shadow-sm border border-slate-700 w-full hover:shadow-md transition-shadow backdrop-blur-md">
      <div className="flex items-center mb-6">
        <img
          src={avatar}
          alt={`${handle} avatar`}
          className="w-16 h-16 rounded-full border-2 border-slate-600 mr-4 shadow-sm"
        />
        <div>
          <h3 className="text-2xl font-bold text-white">{handle}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`${primary.bg} ${primary.text} px-2.5 py-1 rounded-full text-xs font-semibold capitalize tracking-wide`}>
              {rank}
            </span>
            {rank !== maxRank && (
              <span className={`${secondary.bg} ${secondary.text} px-2.5 py-1 rounded-full text-xs font-semibold capitalize tracking-wide`}>
                Max: {maxRank}
              </span>
            )}
          </div>
          {organization && (
            <p className="text-slate-400 text-sm mt-2">{organization}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatBox label="Current Rating" value={rating} />
        <StatBox label="Max Rating" value={maxRating} />
        <StatBox label="Total Contests" value={totalContests} />
        <StatBox label="Last Contest" value={lastDate ? lastDate.toLocaleDateString() : "N/A"} />
        <StatBox label="Problems Solved" value={solvedCount} />
        <StatBox label="Acceptance Rate" value={`${acceptance}%`} />
        <StatBox label="Avg. Problems/Day" value={avg45} />
        <StatBox label="Contribution" value={contribution} />
      </div>
    </div>
  );
}

function safeProcess(info, ratingHist = [], subs = []) {
  if (!info) return null;

  const {
    handle = "N/A", rating = 0, maxRating = 0, rank = "unrated", maxRank = "unrated",
    contribution = 0, organization = "", avatar = info.avatar || info.titlePhoto || "",
  } = info;

  const seen = new Set();
  let acCount = 0;
  subs.forEach((s) => {
    if (s?.verdict === "OK" && s.problem?.contestId && s.problem?.index) {
      acCount++;
      seen.add(`${s.problem.contestId}-${s.problem.index}`);
    }
  });
  const solvedCount = seen.size;
  const acceptance = subs.length ? Math.round((acCount / subs.length) * 100) : 0;

  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 45 * 24 * 3600;
  const recent = new Set();
  subs.forEach((s) => {
    if (s?.verdict === "OK" && s.creationTimeSeconds >= cutoff && s.problem?.contestId && s.problem?.index) {
      recent.add(`${s.problem.contestId}-${s.problem.index}`);
    }
  });
  const avg45 = (recent.size / 45).toFixed(2);
  const lastDate = ratingHist.length > 0 ? new Date(ratingHist[ratingHist.length - 1].ratingUpdateTimeSeconds * 1000) : null;

  const ratingCounts = {};
  const tagCounts = {};
  seen.forEach((key) => {
    const sub = subs.find(s => s.problem?.contestId + "-" + s.problem?.index === key);
    const pr = sub?.problem?.rating || 0;
    ratingCounts[pr] = (ratingCounts[pr] || 0) + 1;
    (sub?.problem?.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return {
    handle, avatar, rating, maxRating, rank, maxRank, contribution, organization,
    totalContests: ratingHist.length, lastDate, solvedCount, acceptance, avg45,
    ratingHist, ratingCounts, tagCounts,
  };
}

const Compare = () => {
  const { user: userInfo } = useAuth();
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [u1, setU1] = useState(null);
  const [u2, setU2] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const h1 = user1.trim();
    const h2 = user2.trim();
    if (!h1 || !h2) return;

    setLoading(true);
    setError("");
    setU1(null);
    setU2(null);

    try {
      const [infoRes, r1Res, r2Res, s1Res, s2Res] = await Promise.all([
        fetch(`https://codeforces.com/api/user.info?handles=${h1};${h2}`).then(r => r.json()),
        fetch(`https://codeforces.com/api/user.rating?handle=${h1}`).then(r => r.json()),
        fetch(`https://codeforces.com/api/user.rating?handle=${h2}`).then(r => r.json()),
        fetch(`https://codeforces.com/api/user.status?handle=${h1}`).then(r => r.json()),
        fetch(`https://codeforces.com/api/user.status?handle=${h2}`).then(r => r.json()),
      ]);

      if (infoRes.status !== "OK") throw new Error("Invalid handles provided");
      if (r1Res.status !== "OK" || r2Res.status !== "OK") throw new Error("Could not fetch rating history");
      if (s1Res.status !== "OK" || s2Res.status !== "OK") throw new Error("Could not fetch submission history");

      const mapInfo = {};
      infoRes.result.forEach((u) => { mapInfo[u.handle.toLowerCase()] = u; });

      setU1(safeProcess(mapInfo[h1.toLowerCase()], r1Res.result, s1Res.result));
      setU2(safeProcess(mapInfo[h2.toLowerCase()], r2Res.result, s2Res.result));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Chart configs
  const lineData = u1 && u2 ? {
    datasets: [
      { label: u1.handle, data: u1.ratingHist.map(c => ({ x: new Date(c.ratingUpdateTimeSeconds * 1000), y: c.newRating })), borderColor: "#ef4444", fill: false, tension: 0.2 },
      { label: u2.handle, data: u2.ratingHist.map(c => ({ x: new Date(c.ratingUpdateTimeSeconds * 1000), y: c.newRating })), borderColor: "#3b82f6", fill: false, tension: 0.2 },
    ]
  } : null;

  const allRatings = u1 && u2 ? Array.from(new Set([...Object.keys(u1.ratingCounts), ...Object.keys(u2.ratingCounts)])).map(Number).sort((a, b) => a - b) : [];
  const ratingBarData = u1 && u2 ? {
    labels: allRatings,
    datasets: [
      { label: u1.handle, data: allRatings.map(r => u1.ratingCounts[r] || 0), backgroundColor: "#ef4444" },
      { label: u2.handle, data: allRatings.map(r => u2.ratingCounts[r] || 0), backgroundColor: "#3b82f6" },
    ]
  } : null;

  const allTags = u1 && u2 ? Array.from(new Set([...Object.keys(u1.tagCounts), ...Object.keys(u2.tagCounts)])).sort((a, b) => (u2.tagCounts[b] || 0) + (u1.tagCounts[b] || 0) - ((u2.tagCounts[a] || 0) + (u1.tagCounts[a] || 0))) : [];
  const tagBarData = u1 && u2 ? {
    labels: allTags,
    datasets: [
      { label: u1.handle, data: allTags.map(t => u1.tagCounts[t] || 0), backgroundColor: "#ef4444" },
      { label: u2.handle, data: allTags.map(t => u2.tagCounts[t] || 0), backgroundColor: "#3b82f6" },
    ]
  } : null;

  return (
    <div className="min-h-screen bg-transparent text-slate-200">
      <Navbar userInfo={userInfo} showSearchBar={false} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-slate-700 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Compare Profiles</h1>
            <p className="text-slate-400 mt-2">Enter two Codeforces handles to compare their stats, ratings, and solved problems.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
            <div className="flex-1 relative search-bar-container !rounded-xl">
              <div className="search-bar-content w-full h-full flex items-center !p-0">
                <input
                  type="text"
                  placeholder="First handle"
                  value={user1}
                  onChange={(e) => setUser1(e.target.value)}
                  className="search-input !py-3 !px-4"
                  required
                />
              </div>
              <div className="search-bar-shine"></div>
            </div>
            <div className="flex-1 relative search-bar-container !rounded-xl">
              <div className="search-bar-content w-full h-full flex items-center !p-0">
                <input
                  type="text"
                  placeholder="Second handle"
                  value={user2}
                  onChange={(e) => setUser2(e.target.value)}
                  className="search-input !py-3 !px-4"
                  required
                />
              </div>
              <div className="search-bar-shine"></div>
            </div>
            <button
              type="submit"
              disabled={loading || !user1.trim() || !user2.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border border-blue-400/30"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Compare
            </button>
          </form>

          {error && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {u1 && u2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserCard stats={u1} />
              <UserCard stats={u2} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-slate-700 h-[400px]">
                <Line 
                  data={lineData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                      title: { display: true, text: "Contest Rating Progress", color: "rgba(255,255,255,0.8)" },
                      legend: { labels: { color: "rgba(255,255,255,0.7)" } }
                    }, 
                    scales: { 
                      x: { type: "time", time: { unit: "month" }, ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.1)" } },
                      y: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.1)" } }
                    } 
                  }} 
                />
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-slate-700 h-[400px]">
                <Bar 
                  data={ratingBarData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                      title: { display: true, text: "Problems by Difficulty", color: "rgba(255,255,255,0.8)" },
                      legend: { labels: { color: "rgba(255,255,255,0.7)" } }
                    },
                    scales: { 
                      x: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { display: false } },
                      y: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.1)" } }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-slate-700 h-[500px]">
              <Bar 
                data={tagBarData} 
                options={{ 
                  indexAxis: "x", 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    title: { display: true, text: "Problems by Tag", color: "rgba(255,255,255,0.8)" },
                    legend: { labels: { color: "rgba(255,255,255,0.7)" } }
                  },
                  scales: { 
                    x: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { display: false } },
                    y: { ticks: { color: "rgba(255,255,255,0.6)" }, grid: { color: "rgba(255,255,255,0.1)" } }
                  }
                }} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Compare;