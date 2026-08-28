import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';
import { useProblems } from '../../hooks/useProblems';
import ProblemFilters from './components/ProblemFilters';
import ProblemForm from './components/ProblemForm';
import ProblemTable from './components/ProblemTable';

const Problems = () => {
  const { user: userInfo } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const {
    problems,
    isLoading,
    error,
    currentPage,
    totalPages,
    allTags,
    platformFilter,
    setPlatformFilter,
    difficultyFilter,
    setDifficultyFilter,
    tagFilter,
    setTagFilter,
    sortConfig,
    setSortConfig,
    fetchProblems,
    deleteProblem,
    addProblemLocally
  } = useProblems();

  // Explicit handler triggered strictly by the debouncer in ProblemFilters
  const handleSearch = useCallback((query) => {
    setCurrentQuery(query);
    fetchProblems(1, query);
  }, [fetchProblems]);

  // Fetch when filters or sort change, injecting the last known search query
  useEffect(() => {
    fetchProblems(1, currentQuery);
  }, [platformFilter, difficultyFilter, tagFilter, sortConfig, fetchProblems]);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar userInfo={userInfo} showSearchBar={false}></Navbar>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">🚀 Coding Problems</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            <Plus size={18} />
            <span>Add Problem</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/80 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
            {error}
          </div>
        )}

        <ProblemForm
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          allTags={allTags}
          onSuccess={addProblemLocally}
        />

        <ProblemFilters
          onSearch={handleSearch}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          allTags={allTags}
        />

        <ProblemTable
          problems={problems}
          isLoading={isLoading}
          searchQuery={currentQuery}
          platformFilter={platformFilter}
          difficultyFilter={difficultyFilter}
          tagFilter={tagFilter}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          handleDeleteProblem={deleteProblem}
          currentPage={currentPage}
          totalPages={totalPages}
          fetchProblems={(page) => fetchProblems(page, currentQuery)}
        />
      </div>
    </div>
  );
};

export default Problems;