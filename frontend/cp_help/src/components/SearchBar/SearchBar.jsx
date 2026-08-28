import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

const SearchBar = ({ value, onChange, handleSearch, onClearSearch }) => {
  return (
    <div className="search-bar-container">
      <div className="search-bar-content">
        <FaMagnifyingGlass
          className="search-icon"
          onClick={handleSearch}
          aria-label="Search"
        />
        <input
          type="text"
          placeholder="Search Friends..."
          className="search-input"
          value={value}
          onChange={onChange}
        />
        {value && (
          <IoMdClose
            className="search-icon clear-icon"
            onClick={onClearSearch}
            aria-label="Clear search"
          />
        )}
      </div>
      <div className="search-bar-shine"></div>
    </div>
  );
};

export default SearchBar;
