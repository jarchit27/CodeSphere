import React, { useState, useEffect } from "react";
import { contestService } from "../../services/api";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

export default function Contests() {
  const { user } = useAuth();
  const [contests, setContests] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    contestService.getUpcoming()
      .then((res) => {
        setTotal(res.data.total || 0);
        setContests(res.data.results || []);
      })
      .catch(() => setError(true));
  }, []);

  const getBadgeColor = (host) => {
    const colors = {
      codeforces: 'bg-blue-100 text-blue-800 border-blue-200',
      codechef: 'bg-orange-100 text-orange-800 border-orange-200',
      leetcode: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      atcoder: 'bg-slate-100 text-slate-800 border-slate-200',
      geeksforgeeks: 'bg-green-100 text-green-800 border-green-200',
      codingninjas: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[host] || 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-200">
      <Navbar userInfo={user} showSearchBar={false} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Upcoming Contests</h1>
            <p className="text-slate-400 mt-1">Discover and track competitive programming contests.</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-slate-700 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Total Upcoming:</span>
            <span className="text-lg font-bold text-indigo-600">{total}</span>
          </div>
        </div>

        {error && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-red-900/50">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-white">Connection Failed</h3>
            <p className="text-slate-400 mt-2">Could not fetch contest data from the database.</p>
          </div>
        )}

        {contests === null && !error && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-700">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white">Loading Contests</h3>
            <p className="text-slate-400 mt-2">Fetching the latest schedule...</p>
          </div>
        )}

        {contests && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((c) => (
              <div 
                key={c.vanity || c.id || c.name} 
                className="bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-700 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${getBadgeColor(c.host)}`}>
                      {c.host}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-4 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.name}
                    </a>
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300 text-sm">
                      <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                      <span>{new Date(c.startTimeUnix * 1000).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center text-slate-300 text-sm">
                      <Clock className="w-4 h-4 mr-3 text-slate-400" />
                      <span>{c.duration} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 mt-auto">
                  <a 
                    href={c.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    View Contest
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}