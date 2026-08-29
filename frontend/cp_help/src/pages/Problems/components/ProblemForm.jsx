import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import { problemService } from '../../../services/api';

const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'HackerRank', 'AtCoder', 'TopCoder', 'Other'];
const DIFFICULTY = ['Easy', 'Medium', 'Hard'];

const ProblemForm = ({
  showAddForm,
  setShowAddForm,
  allTags,
  onSuccess
}) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    if (value && formErrors[name]) {
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prevState => ({
        ...prevState,
        tags: [...prevState.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prevState => ({
      ...prevState,
      tags: prevState.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
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
        if (response.data && !response.data.error) {
          setAddSuccess(true);
          onSuccess(response.data.problem, formData.tags);

          // Reset form after a delay
          setTimeout(() => {
            setFormData({
              questionName: '',
              platform: 'LeetCode',
              difficulty: 'Medium',
              questionLink: 'https://',
              notes: '',
              tags: []
            });
            setShowAddForm(false);
            setAddSuccess(false);
          }, 1500);
        }
      } catch (err) {
        console.error('Failed to add problem:', err);
        setFormErrors({ submit: "Failed to save problem. Link might already exist." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!showAddForm) return null;

  return (
    <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 mb-8 border border-purple-500/20 relative overflow-visible group">
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
        {formErrors.submit && (
          <div className="bg-red-900/80 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
            {formErrors.submit}
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

          <div className="sort-controls-inner !p-2 !rounded-xl col-span-1 flex flex-col justify-end relative z-50">
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

          <div className="sort-controls-inner !p-2 !rounded-xl col-span-1 flex flex-col justify-end relative z-40">
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
            onClick={handleSubmit}
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
  );
};

export default ProblemForm;
