import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

// Register Chart.js modules
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

// Codeforces rank → Tailwind colors
const rankColors = {
  newbie:                   { bg: "bg-gray-200",    text: "text-gray-800"   },
  pupil:                    { bg: "bg-green-100",   text: "text-green-800"  },
  specialist:               { bg: "bg-cyan-100",    text: "text-cyan-800"   },
  expert:                   { bg: "bg-blue-100",    text: "text-blue-800"   },
  candidateMaster:          { bg: "bg-purple-100",  text: "text-purple-800" },
  master:                   { bg: "bg-orange-100",  text: "text-orange-800" },
  internationalMaster:      { bg: "bg-orange-200",  text: "text-orange-900" },
  grandmaster:              { bg: "bg-red-200",     text: "text-red-800"    },
  internationalGrandmaster: { bg: "bg-red-300",     text: "text-red-900"    },
  legendaryGrandmaster:     { bg: "bg-red-500",     text: "text-white"      },
};

function StatBox({ label, value }) {
  return (
    <div className="bg-white p-3 rounded border">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

function UserCard({ stats }) {
  const {
    handle,
    avatar,
    rank,
    maxRank,
    rating,
    maxRating,
    contribution,
    organization,
    totalContests,
    lastDate,
    solvedCount,
    acceptance,
    avg45,
  } = stats;

  const primary = rankColors[rank] || rankColors.newbie;
  const secondary = rankColors[maxRank] || rankColors.newbie;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow w-full">
      {/* Header */}
      <div className="flex items-center mb-6">
        <img
          src={avatar}
          alt={`${handle} avatar`}
          className="w-16 h-16 rounded-full border-2 border-gray-300 mr-4"
        />
        <div>
          <h3 className="text-2xl font-semibold">{handle}</h3>
          <div className="mt-1 space-x-2">
            <span
              className={`${primary.bg} ${primary.text} px-2 py-1 rounded-full text-sm capitalize`}
            >
              {rank}
            </span>
            {rank !== maxRank && (
              <span
                className={`${secondary.bg} ${secondary.text} px-2 py-1 rounded-full text-sm capitalize`}
              >
                {maxRank}
              </span>
            )}
          </div>
          {organization && (
            <p className="text-gray-500 mt-1">{organization}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <StatBox label="Current Rating" value={rating} />
        <StatBox label="Max Rating" value={maxRating} />
        <StatBox label="Total Contests" value={totalContests} />
        <StatBox
          label="Last Contest"
          value={lastDate ? lastDate.toLocaleDateString() : "N/A"}
        />
        <StatBox label="Problems Solved" value={solvedCount} />
        <StatBox label="Acceptance Rate" value={`${acceptance}%`} />
        <StatBox label="Avg. Problems/Day (45d)" value={avg45} />
        <StatBox label="Contribution" value={contribution} />
      </div>
    </div>
  );
}

// Safely process API data into stats
function safeProcess(info, ratingHist = [], subs = []) {
  if (!info) return {
    handle: "N/A", avatar: "", rating: 0, maxRating: 0,
    rank: "unrated", maxRank: "unrated", contribution: 0,
    organization: "", totalContests: 0, lastDate: null,
    solvedCount: 0, acceptance: 0, avg45: "0.00",
    ratingHist: [], ratingCounts: {}, tagCounts: {}
  };

  const {
    handle = "N/A",
    rating = 0,
    maxRating = 0,
    rank = "unrated",
    maxRank = "unrated",
    contribution = 0,
    organization = "",
    avatar = info.avatar || info.titlePhoto || "",
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
    if (
      s?.verdict === "OK" &&
      s.creationTimeSeconds >= cutoff &&
      s.problem?.contestId &&
      s.problem?.index
    ) {
      recent.add(`${s.problem.contestId}-${s.problem.index}`);
    }
  });
  const avg45 = (recent.size / 45).toFixed(2);

  const lastDate =
    ratingHist.length > 0
      ? new Date(ratingHist[ratingHist.length - 1].ratingUpdateTimeSeconds * 1000)
      : null;

  const ratingCounts = {};
  const tagCounts = {};
  seen.forEach((key) => {
    const sub = subs.find(
      (s) =>
        s.problem?.contestId + "-" + s.problem?.index === key
    );
    const pr = sub?.problem?.rating || 0;
    ratingCounts[pr] = (ratingCounts[pr] || 0) + 1;
    (sub?.problem?.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return {
    handle,
    avatar,
    rating,
    maxRating,
    rank,
    maxRank,
    contribution,
    organization,
    totalContests: ratingHist.length,
    lastDate,
    solvedCount,
    acceptance,
    avg45,
    ratingHist,
    ratingCounts,
    tagCounts,
  };
}

export default function CompareResult() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const h1 = params.get("u1"),
    h2 = params.get("u2");

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [u1, setU1]           = useState(null);
  const [u2, setU2]           = useState(null);

  useEffect(() => {
    if (!h1 || !h2) {
      setError("Both Codeforces handles required in URL");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [infoRes, r1Res, r2Res, s1Res, s2Res] = await Promise.all([
          fetch(`https://codeforces.com/api/user.info?handles=${h1};${h2}`).then((r) => r.json()),
          fetch(`https://codeforces.com/api/user.rating?handle=${h1}`).then((r) => r.json()),
          fetch(`https://codeforces.com/api/user.rating?handle=${h2}`).then((r) => r.json()),
          fetch(`https://codeforces.com/api/user.status?handle=${h1}`).then((r) => r.json()),
          fetch(`https://codeforces.com/api/user.status?handle=${h2}`).then((r) => r.json()),
        ]);
        if (infoRes.status !== "OK") throw new Error("Invalid handles");
        if (r1Res.status !== "OK" || r2Res.status !== "OK") throw new Error("Rating history error");
        if (s1Res.status !== "OK" || s2Res.status !== "OK") throw new Error("Submission history error");

        const mapInfo = {};
        infoRes.result.forEach((u) => {
          mapInfo[u.handle.toLowerCase()] = u;
        });

        setU1(safeProcess(mapInfo[h1.toLowerCase()], r1Res.result, s1Res.result));
        setU2(safeProcess(mapInfo[h2.toLowerCase()], r2Res.result, s2Res.result));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [h1, h2]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading…</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  if (!u1 || !u2) return null;

  // Chart data & options
  const lineData = {
    datasets: [
      {
        label: u1.handle,
        data: u1.ratingHist.map((c) => ({
          x: new Date(c.ratingUpdateTimeSeconds * 1000),
          y: c.newRating,
        })),
        borderColor: "#f44336", // bright red
        fill: false,
        pointRadius: 3,
        tension: 0.2,
      },
      {
        label: u2.handle,
        data: u2.ratingHist.map((c) => ({
          x: new Date(c.ratingUpdateTimeSeconds * 1000),
          y: c.newRating,
        })),
        borderColor: "#2196f3", // bright blue
        fill: false,
        pointRadius: 3,
        tension: 0.2,
      },
    ],
  };
  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      title: { display: true, text: "Contest Rating Progress" },
      tooltip: { enabled: true },
      legend: { position: "top" },
    },
    scales: {
      x: { type: "time", time: { unit: "month" } },
      y: { title: { display: true, text: "Rating" } },
    },
  };

  const allRatings = Array.from(new Set([
    ...Object.keys(u1.ratingCounts),
    ...Object.keys(u2.ratingCounts),
  ])).map(Number).sort((a, b) => a - b);
  const ratingBarData = {
    labels: allRatings,
    datasets: [
      {
        label: u1.handle,
        data: allRatings.map((r) => u1.ratingCounts[r] || 0),
        backgroundColor: "#f44336",
      },
      {
        label: u2.handle,
        data: allRatings.map((r) => u2.ratingCounts[r] || 0),
        backgroundColor: "#2196f3",
      },
    ],
  };
  const ratingBarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      title: { display: true, text: "Problems by Difficulty" },
      tooltip: { enabled: true },
      legend: { position: "bottom" },
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Rating" } },
      y: { title: { display: true, text: "Count" } },
    },
  };

  const allTags = Array.from(new Set([
    ...Object.keys(u1.tagCounts),
    ...Object.keys(u2.tagCounts),
  ])).sort((a, b) =>
    (u2.tagCounts[b] || 0) + (u1.tagCounts[b] || 0)
    - ((u2.tagCounts[a] || 0) + (u1.tagCounts[a] || 0))
  );
  const tagBarData = {
    labels: allTags,
    datasets: [
      {
        label: u1.handle,
        data: allTags.map((t) => u1.tagCounts[t] || 0),
        backgroundColor: "#f44336",
      },
      {
        label: u2.handle,
        data: allTags.map((t) => u2.tagCounts[t] || 0),
        backgroundColor: "#2196f3",
      },
    ],
  };
  const tagBarOpts = {
    indexAxis: "x",
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      title: { display: true, text: "Problems by Tag" },
      tooltip: { enabled: true },
      legend: { position: "bottom" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Count" } },
      x: { title: { display: true, text: "Tag" } },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Top buttons */}
      <div className="max-w-5xl mx-auto flex justify-end gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow space-y-8">
        {/* Profile Cards */}
        <div className="flex flex-col md:flex-row gap-6">
          <UserCard stats={u1} />
          <UserCard stats={u2} />
        </div>

        {/* Charts */}
        <div className="space-y-8">
          <div className="bg-white p-4 rounded shadow" style={{ height: 400 }}>
            <Line id="chart-rating-progress" data={lineData} options={lineOpts} />
          </div>
          <div className="bg-white p-4 rounded shadow" style={{ height: 300 }}>
            <Bar id="chart-rating-dist" data={ratingBarData} options={ratingBarOpts} />
          </div>
          <div className="bg-white p-4 rounded shadow overflow-x-auto" style={{ height: 500 }}>
            <Bar id="chart-tag-dist" data={tagBarData} options={tagBarOpts} />
          </div>
        </div>
      </div>
    </div>
  );
}