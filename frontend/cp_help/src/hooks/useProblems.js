import { useState, useCallback, useRef } from 'react';
import { problemService } from '../services/api';

export const useProblems = () => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [allTags, setAllTags] = useState([]);
  
  // UI Filters state
  const [platformFilter, setPlatformFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fetchedAt', direction: 'desc' });
  const [lastQuery, setLastQuery] = useState('');
  const fetchIdRef = useRef(0);

  const fetchProblems = useCallback(async (page = 1, query = '', quiet = false) => {
    const currentFetchId = ++fetchIdRef.current;
    if (!quiet) setIsLoading(true);
    setLastQuery(query);
    try {
      const params = {
        page,
        query,
        platform: platformFilter,
        difficulty: difficultyFilter,
        tag: tagFilter,
        sortBy: sortConfig.key,
        order: sortConfig.direction
      };

      const response = await problemService.getAll(params);
      
      // If a newer request was fired after this one, drop this stale response
      if (currentFetchId !== fetchIdRef.current) return;

      if (response.data && response.data.problems) {
        setProblems(response.data.problems);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);
        setTotalProblems(response.data.totalProblems || 0);

        if (response.data.allTags) {
          setAllTags(response.data.allTags);
        }
      }
    } catch (err) {
      if (currentFetchId !== fetchIdRef.current) return;
      console.error('Failed to fetch problems:', err);
      setError("Failed to fetch problems. Please try again later.");
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        if (!quiet) setIsLoading(false);
      }
    }
  }, [platformFilter, difficultyFilter, tagFilter, sortConfig]);

  const deleteProblem = async (problemId) => {
    // Optimistically remove from UI
    setProblems(prev => prev.filter(p => p._id !== problemId));
    
    try {
      const response = await problemService.delete(problemId);
      if (response.data && !response.data.error) {
        // Silently backfill pagination
        fetchProblems(currentPage, lastQuery, true);
        return { success: true };
      }
      // If failed, revert silently
      fetchProblems(currentPage, lastQuery, true);
      return { success: false, error: "Failed to delete" };
    } catch (err) {
      // Revert silently
      fetchProblems(currentPage, lastQuery, true);
      setError("Failed to delete problem. Please try again later.");
      return { success: false, error: err.message };
    }
  };

  const addProblemLocally = (newProblem, newTags) => {
    // Silently fetch to apply correct sorting and pagination from backend directly
    // Instead of optimistically pushing to the top which breaks sort order
    fetchProblems(currentPage, lastQuery, true);
    
    // Update allTags if there are new ones
    if (newTags && newTags.length > 0) {
      const tagsSet = new Set(allTags);
      newTags.forEach(t => tagsSet.add(t));
      setAllTags(Array.from(tagsSet));
    }
  };

  return {
    problems,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalProblems,
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
    addProblemLocally,
    setError
  };
};
