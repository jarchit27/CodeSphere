import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { Search, Plus, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';

// Constants for platform and difficulty options based on your schema
const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'HackerRank', 'AtCoder', 'TopCoder', 'Other'];
const DIFFICULTY = ['Easy', 'Medium', 'Hard'];

const Problems = () => {
  const [userInfo, setUserInfo] = useState("");
  const navigate = useNavigate();
  
  // State for managing problems
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Fetch user info
  const getUserInfo = async() => {
    try {
      const response = await axiosInstance.get("/get-user");
      if(response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch(error) {
      if(error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };
  
  // Fetch all problems
  const fetchProblems = async() => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/get-all-problems/");
      if(response.data && response.data.problems) {
        setProblems(response.data.problems);
        
        // Extract all unique tags
        const tags = new Set();
        response.data.problems.forEach(problem => {
          if (problem.tags && Array.isArray(problem.tags)) {
            problem.tags.forEach(tag => tags.add(tag));
          }
        });
        setAllTags(Array.from(tags));
      }
    } catch(error) {
      setError("Failed to fetch problems. Please try again later.");
      if(error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
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
        const response = await axiosInstance.post("/add-problem", formData);
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
      const response = await axiosInstance.delete(`/delete-problem/${problemId}`);
      if(response.data && !response.data.error) {
        // Remove problem from list
        setProblems(problems.filter(problem => problem._id !== problemId));
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
  
  // Filter problems based on search query and filters
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = 
      problem.questionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === 'All' || problem.platform === platformFilter;
    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesTag = tagFilter === '' || 
      (problem.tags && problem.tags.some(tag => 
        tag.toLowerCase().includes(tagFilter.toLowerCase())
      ));
    
    return matchesSearch && matchesPlatform && matchesDifficulty && matchesTag;
  });
  
  // Sort filtered problems
  const sortedProblems = [...filteredProblems].sort((a, b) => {
    if (sortConfig.key === 'fetchedAt') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.fetchedAt) - new Date(b.fetchedAt)
        : new Date(b.fetchedAt) - new Date(a.fetchedAt);
    }
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
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
  
  // Load data when component mounts
  useEffect(() => {
    getUserInfo();
    fetchProblems();
    return () => {};
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
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
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">✨ Add New Problem</h2>
            
            {addSuccess && (
              <div className="bg-green-900/80 border border-green-500 text-green-100 px-4 py-3 rounded-lg mb-4">
                Problem added successfully!
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Name*</label>
                <input
                  type="text"
                  name="questionName"
                  placeholder="Enter question name"
                  className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.questionName ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
                  value={formData.questionName}
                  onChange={handleChange}
                />
                {formErrors.questionName && <p className="text-red-400 text-xs mt-1">{formErrors.questionName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Platform*</label>
                <select
                  name="platform"
                  className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.platform ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                  value={formData.platform}
                  onChange={handleChange}
                >
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                {formErrors.platform && <p className="text-red-400 text-xs mt-1">{formErrors.platform}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty*</label>
                <select
                  name="difficulty"
                  className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.difficulty ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
                  value={formData.difficulty}
                  onChange={handleChange}
                >
                  {DIFFICULTY.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
                {formErrors.difficulty && <p className="text-red-400 text-xs mt-1">{formErrors.difficulty}</p>}
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Link*</label>
                <input
                  type="url"
                  name="questionLink"
                  placeholder="https://example.com/problem"
                  className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.questionLink ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
                  value={formData.questionLink}
                  onChange={handleChange}
                />
                {formErrors.questionLink && <p className="text-red-400 text-xs mt-1">{formErrors.questionLink}</p>}
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag (e.g. Arrays, DP)"
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    list="available-tags-input"
                  />
                  <datalist id="available-tags-input">
                    {allTags.map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-slate-600 text-gray-200 rounded-lg hover:bg-slate-500"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-900/50 text-blue-200 border border-blue-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-300 hover:text-blue-100"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes*</label>
                <textarea
                  name="notes"
                  placeholder="Your approach, tips, or solutions"
                  className={`w-full px-3 py-2 bg-slate-700 border ${formErrors.notes ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                ></textarea>
                {formErrors.notes && <p className="text-red-400 text-xs mt-1">{formErrors.notes}</p>}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                onClick={handleAddProblem}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Problem'}
              </button>
            </div>
          </div>
        )}
        
        {/* Search and Filter Bar */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-4 mb-6 border border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search problems..."
                className="pl-10 pr-4 py-2 w-full bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="All">All Platforms</option>
                {PLATFORMS.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="All">All Difficulties</option>
                {DIFFICULTY.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Filter by tag"
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
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
            </div>
          </div>
        </div>
        
        {/* Problems List */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">🌟 Your Coding Problems ({filteredProblems.length})</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Loading problems...</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">
                {problems.length === 0 ? 
                  "You haven't added any problems yet. Click 'Add Problem' to get started." :
                  "No problems match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => requestSort('questionName')}
                    >
                      <div className="flex items-center gap-1">
                        Problem Name {getSortIcon('questionName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => requestSort('platform')}
                    >
                      <div className="flex items-center gap-1">
                        Platform {getSortIcon('platform')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => requestSort('difficulty')}
                    >
                      <div className="flex items-center gap-1">
                        Difficulty {getSortIcon('difficulty')}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tags
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {sortedProblems.map(problem => (
                    <tr key={problem._id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{problem.questionName}</div>
                        <div className="text-sm text-gray-400 mt-1">{problem.notes.length > 80 ? problem.notes.substring(0, 80) + '...' : problem.notes}</div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Problems;