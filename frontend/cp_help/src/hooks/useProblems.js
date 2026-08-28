import { useState, useCallback } from 'react';
import { problemService } from '../services/api';

export const useProblems = () => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allTags, setAllTags] = useState([]);
  
  // UI Filters state
  const [platformFilter, setPlatformFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fetchedAt', direction: 'desc' });

  const fetchProblems = useCallback(async (page = 1, query = '') => {
    setIsLoading(true);
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
      if (response.data && response.data.problems) {
        setProblems(response.data.problems);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);

        if (response.data.allTags) {
          setAllTags(response.data.allTags);
        }
      }
    } catch (err) {
      setError("Failed to fetch problems. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [platformFilter, difficultyFilter, tagFilter, sortConfig]);

  const deleteProblem = async (problemId) => {
    try {
      const response = await problemService.delete(problemId);
      if (response.data && !response.data.error) {
        // Refetch current page
        fetchProblems(currentPage);
        return { success: true };
      }
      return { success: false, error: "Failed to delete" };
    } catch (err) {
      setError("Failed to delete problem. Please try again later.");
      return { success: false, error: err.message };
    }
  };

  const addProblemLocally = (newProblem, newTags) => {
    setProblems(prev => [newProblem, ...(prev || [])]);
    
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
