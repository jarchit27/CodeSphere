import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect/CustomSelect';

// Constants for platform and difficulty options based on your schema
const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'HackerRank', 'AtCoder', 'TopCoder', 'Other'];
const DIFFICULTY = ['Easy', 'Medium', 'Hard'];

const Problems = () => {
  const { user: userInfo } = useAuth();
  const navigate = useNavigate();
  
  // State for managing problems
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'fetchedAt', direction: 'desc' });
  const [selectedNote, setSelectedNote] = useState(null);
  // Form state
  const [formData, setFormData] = useState({
    questionName: '',
    platform: 'LeetCode',
    difficulty: 'Medium',
    questionLink: 'https://',
    notes: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  // Fetch all problems
  const fetchProblems = async(page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        query: searchQuery,
        platform: platformFilter,
        difficulty: difficultyFilter,
        tag: tagFilter,
        sortBy: sortConfig.key,
        order: sortConfig.direction
      };
      
      const response = await problemService.getAll(params);
      if(response.data && response.data.problems) {
        setProblems(response.data.problems);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);
        
        if (response.data.allTags) {
          setAllTags(response.data.allTags);
        }
      }
    } catch(error) {
      setError("Failed to fetch problems. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new problem
  const handleAddProblem = async() => {
    // Form validation
    const errors = {};
    if (!formData.questionName.trim()) errors.questionName = "Question name is required";
    if (!formData.platform) errors.platform = "Platform is required";
    if (!formData.difficulty) errors.difficulty = "Difficulty is required";
    if (!formData.questionLink.trim()) errors.questionLink = "Question link is required";
    if (!formData.questionLink.startsWith('http')) errors.questionLink = "Link must start with http:// or https://";
    if (!formData.notes.trim()) errors.notes = "Notes are required";
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        const response = await problemService.add(formData);
        if(response.data && !response.data.error) {
          setAddSuccess(true);
          // Add new problem to the list
          setProblems([response.data.problem, ...problems]);
          
          // Reset form
          setFormData({
            questionName: '',
            platform: 'LeetCode',
            difficulty: 'Medium',
            questionLink: 'https://',
            notes: '',
            tags: []
          });
          setTagInput('');
          
          // Update tags
          const newTags = new Set(allTags);
          formData.tags.forEach(tag => newTags.add(tag));
          setAllTags(Array.from(newTags));
          
          // Hide form after 1 second
          setTimeout(() => {
            setShowAddForm(false);
            setAddSuccess(false);
          }, 1000);
        }
      } catch(error) {
        setError("Failed to add problem. Please try again later.");
        if(error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Delete problem
  const handleDeleteProblem = async(problemId) => {
    try {
      const response = await problemService.delete(problemId);
      if(response.data && !response.data.error) {
        // Remove problem from list or refetch
        fetchProblems(currentPage);
      }
    } catch(error) {
      setError("Failed to delete problem. Please try again later.");
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear related error if value is provided
    if (value && formErrors[name]) {
      setFormErrors(prevErrors => {
        const newErrors = {...prevErrors};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prevState => ({
        ...prevState,
        tags: [...prevState.tags, tagInput]
      }));
      setTagInput('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prevState => ({
      ...prevState,
      tags: prevState.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Sort filtered problems - DELETED client side logic
  const sortedProblems = problems;
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sorting icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };
  
  // Load data when filters or sort config change
  useEffect(() => {
    fetchProblems(1);
  }, [platformFilter, difficultyFilter, tagFilter, sortConfig]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProblems(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  
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
        
        {/* Add Problem Form */}
        {showAddForm && (
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 mb-8 border border-purple-500/20 relative overflow-hidden group">
            {/* Ambient glow behind the form */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 opacity-50"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-2xl">✨</span> Add New Problem
              </h2>
            
            {addSuccess && (
              <div className="bg-green-900/80 border border-green-500 text-green-100 px-4 py-3 rounded-lg mb-4">
                Problem added successfully!
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-indigo-200/90 mb-2 tracking-wide uppercase">Question Name*</label>
                <div className="relative search-bar-container !rounded-xl">
                  <div className="search-bar-content w-full h-full flex items-center !p-0">
                    <input
                      type="text"
                      name="questionName"
                      placeholder="Enter question name"
                      className={`search-input !py-3 !px-4 ${formErrors.questionName ? 'border border-red-500/50' : ''}`}
                      value={formData.questionName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="search-bar-shine"></div>
                </div>
                {formErrors.questionName && <p className="text-red-400 text-xs mt-1">{formErrors.questionName}</p>}
              </div>
              
              <div className="sort-controls-inner !p-2 !rounded-xl col-span-1 flex flex-col justify-end">
                <CustomSelect
                  label="Platform*"
                  value={formData.platform}
                  onChange={(val) => setFormData({ ...formData, platform: val })}
                  options={[
                    { value: '', label: 'Select Platform' },
                    ...PLATFORMS.map(p => ({ value: p, label: p }))
                  ]}
                />
                {formErrors.platform && <p className="text-red-400 text-xs mt-1">{formErrors.platform}</p>}
              </div>
              
              <div className="sort-controls-inner !p-2 !rounded-xl col-span-1 flex flex-col justify-end">
                <CustomSelect
                  label="Difficulty*"
                  value={formData.difficulty}
                  onChange={(val) => setFormData({ ...formData, difficulty: val })}
                  options={[
                    { value: '', label: 'Select Difficulty' },
                    ...DIFFICULTY.map(d => ({ value: d, label: d }))
                  ]}
                />
                {formErrors.difficulty && <p className="text-red-400 text-xs mt-1">{formErrors.difficulty}</p>}
              </div>
              
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block text-sm font-semibold text-indigo-200/90 mb-2 tracking-wide uppercase">Question Link*</label>
                <div className="relative search-bar-container !rounded-xl">
                  <div className="search-bar-content w-full h-full flex items-center !p-0">
                    <input
                      type="url"
                      name="questionLink"
                      placeholder="https://example.com/problem"
                      className={`search-input !py-3 !px-4 ${formErrors.questionLink ? 'border border-red-500/50' : ''}`}
                      value={formData.questionLink}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="search-bar-shine"></div>
                </div>
                {formErrors.questionLink && <p className="text-red-400 text-xs mt-1">{formErrors.questionLink}</p>}
              </div>
              
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block text-sm font-semibold text-indigo-200/90 mb-2 tracking-wide uppercase">Tags</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative search-bar-container !rounded-xl">
                    <div className="search-bar-content w-full h-full flex items-center !p-0">
                      <input
                        type="text"
                        placeholder="Add a tag (e.g. Arrays, DP)"
                        className="search-input !py-3 !px-4"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        list="available-tags-input"
                      />
                    </div>
                    <div className="search-bar-shine"></div>
                  </div>
                  <datalist id="available-tags-input">
                    {allTags.map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)] transition-all hover:bg-purple-900/60"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-purple-300 hover:text-white transition-colors p-0.5 rounded-full hover:bg-purple-500/20"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block text-sm font-semibold text-indigo-200/90 mb-2 tracking-wide uppercase">Notes*</label>
                <div className="relative search-bar-container !rounded-xl">
                  <div className="search-bar-content w-full h-full !p-0">
                    <textarea
                      name="notes"
                      placeholder="Your approach, tips, or solutions"
                      className={`search-input !py-3 !px-4 w-full bg-transparent border-none outline-none resize-y min-h-[100px] ${formErrors.notes ? 'border border-red-500/50' : ''}`}
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                    ></textarea>
                  </div>
                  <div className="search-bar-shine"></div>
                </div>
                {formErrors.notes && <p className="text-red-400 text-xs mt-1">{formErrors.notes}</p>}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-4 border-t border-slate-700/50 pt-6">
              <button
                type="button"
                className="px-6 py-2.5 border border-slate-600/60 text-slate-300 rounded-xl hover:bg-slate-700/50 hover:text-white transition-all font-medium min-w-[100px]"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 border border-purple-400/30 transition-all hover:-translate-y-0.5 flex items-center justify-center min-w-[160px]"
                onClick={handleAddProblem}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  'Save Problem'
                )}
              </button>
            </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter Bar */}
        <div className="mb-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative search-bar-container !rounded-2xl shadow-lg shadow-blue-500/10 group">
              <div className="search-bar-content w-full h-full flex items-center !py-3 !px-5 transition-colors group-hover:bg-slate-900/60">
                <Search size={20} className="text-blue-400 mr-3 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                <input
                  type="text"
                  placeholder="Search for any problem..."
                  className="search-input text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="search-bar-shine"></div>
            </div>
            
            <div className="flex gap-4 flex-wrap md:flex-nowrap items-center sort-controls-inner !p-2 !rounded-xl">
              <CustomSelect
                label="Platform"
                value={platformFilter}
                onChange={setPlatformFilter}
                options={[
                  { value: 'All', label: 'All Platforms' },
                  ...PLATFORMS.map(p => ({ value: p, label: p }))
                ]}
              />
              
              <div className="sort-divider"></div>

              <CustomSelect
                label="Difficulty"
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                options={[
                  { value: 'All', label: 'All Difficulties' },
                  ...DIFFICULTY.map(d => ({ value: d, label: d }))
                ]}
              />
              
              <div className="sort-divider"></div>

              <div className="relative search-bar-container w-48 !h-auto !rounded-2xl shadow-lg shadow-purple-500/10 group">
                <div className="search-bar-content w-full h-full flex items-center !py-3 !px-4 transition-colors group-hover:bg-slate-900/60">
                  <Tag size={18} className="text-purple-400 mr-2 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <input
                    type="text"
                    placeholder="Filter by tag"
                    className="search-input !text-sm"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    list="available-tags"
                  />
                  <datalist id="available-tags">
                    {allTags.map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                </div>
                <div className="search-bar-shine"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Problems List */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">🌟 Your Coding Problems ({problems.length})</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Loading problems...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">
                {searchQuery || platformFilter !== 'All' || difficultyFilter !== 'All' || tagFilter 
                  ? "No problems match your current filters."
                  : "You haven't added any problems yet. Click 'Add Problem' to get started."
                }
              </p>
            </div>
          ) : (
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
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          problem.difficulty === 'Easy' ? 'bg-green-900/50 text-green-200 border border-green-700' :
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Problems;