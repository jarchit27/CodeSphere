import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const ProblemTable = ({
  problems,
  isLoading,
  searchQuery,
  platformFilter,
  difficultyFilter,
  tagFilter,
  sortConfig,
  setSortConfig,
  handleDeleteProblem,
  currentPage,
  totalPages,
  fetchProblems
}) => {
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronDown size={14} className="text-slate-600" />;
    return sortConfig.direction === 'desc' ? <ChevronDown size={14} className="text-blue-400" /> : <ChevronUp size={14} className="text-blue-400" />;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">🌟 Your Coding Problems</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-400">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">🌟 Your Coding Problems (0)</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-400">
            {searchQuery || platformFilter !== 'All' || difficultyFilter !== 'All' || tagFilter
              ? "No problems match your current filters."
              : "You haven't added any problems yet. Click 'Add Problem' to get started."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white">🌟 Your Coding Problems ({problems.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/80 border-b border-slate-700 backdrop-blur-md">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase tracking-wider cursor-pointer hover:text-blue-200 transition-colors"
                onClick={() => requestSort('questionName')}
              >
                <div className="flex items-center gap-1">
                  Problem Name {getSortIcon('questionName')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase tracking-wider cursor-pointer hover:text-blue-200 transition-colors"
                onClick={() => requestSort('platform')}
              >
                <div className="flex items-center gap-1">
                  Platform {getSortIcon('platform')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase tracking-wider cursor-pointer hover:text-blue-200 transition-colors"
                onClick={() => requestSort('difficulty')}
              >
                <div className="flex items-center gap-1">
                  Difficulty {getSortIcon('difficulty')}
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900/40 divide-y divide-slate-700/50 backdrop-blur-sm">
            {problems.map(problem => (
              <tr key={problem._id} className="hover:bg-slate-800/60 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{problem.questionName}</div>
                  <div className="text-sm text-slate-400 mt-1">{problem.notes.length > 80 ? problem.notes.substring(0, 80) + '...' : problem.notes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-200 border border-blue-700">
                    {problem.platform}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${problem.difficulty === 'Easy' ? 'bg-green-900/50 text-green-200 border border-green-700' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700' :
                        'bg-red-900/50 text-red-200 border border-red-700'
                    }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {problem.tags && problem.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-purple-900/50 text-purple-200 rounded-full border border-purple-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={problem.questionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 mr-4"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteProblem(problem._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center p-6 border-t border-slate-700 bg-slate-800/30 space-x-4">
            <button
              onClick={() => fetchProblems(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center ${currentPage === 1 ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border border-blue-400/30'}`}
            >
              Previous
            </button>
            <span className="text-slate-300 font-medium px-4 py-2 bg-slate-900/50 rounded-lg border border-white/10">
              Page <span className="text-blue-400 font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
            </span>
            <button
              onClick={() => fetchProblems(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center ${currentPage === totalPages ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg border border-blue-400/30'}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemTable;
