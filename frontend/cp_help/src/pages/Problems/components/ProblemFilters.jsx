import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';

const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'HackerRank', 'AtCoder', 'TopCoder', 'Other'];
const DIFFICULTY = ['Easy', 'Medium', 'Hard'];

const ProblemFilters = ({
  onSearch,
  platformFilter,
  setPlatformFilter,
  difficultyFilter,
  setDifficultyFilter,
  tagFilter,
  setTagFilter,
  allTags
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isInitialMount = React.useRef(true);

  // Live debouncer matching the Friends page pattern
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      onSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, onSearch]);

  return (
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

          <CustomSelect
            label="Tag"
            value={tagFilter}
            onChange={setTagFilter}
            options={[
              { value: '', label: 'All Tags' },
              ...allTags.map(t => ({ value: t, label: t }))
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ProblemFilters;
