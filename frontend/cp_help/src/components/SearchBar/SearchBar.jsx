import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io"; 

const SearchBar = ({ value, onChange, handleSearch, onClearSearch }) => {
  return (
    <div className="flex items-center bg-slate-100 rounded-md px-3 py-2 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
      <input
        type="text"
        placeholder="Search Friends"
        className="flex-grow text-xs bg-transparent outline-none py-2"
        value={value}
        onChange={onChange}
      />
      {value && (
        <IoMdClose
          className="text-xl text-slate-500 cursor-pointer hover:text-black mr-2"
          onClick={onClearSearch}
          aria-label="Clear search"
        />
      )}
      <FaMagnifyingGlass
        className="text-slate-400 cursor-pointer hover:text-black"
        onClick={handleSearch}
        aria-label="Search"
      />
    </div>
  );
};

export default SearchBar;
