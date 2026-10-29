import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, X, ChevronLeft, ChevronRight, ShieldCheck, Database } from 'lucide-react';
import QuickSearchDropdown from './QuickSearchDropdown';
import { useAudio } from '../context/AudioContext';

export default function Header({
  query,
  setQuery,
  results,
  isLoading,
  source,
  setSource,
  onOpenAttribution
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const { playTrack } = useAudio();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Keyboard Navigation inside search bar
  const handleKeyDown = (e) => {
    const previewList = (results || []).slice(0, 5);
    const count = previewList.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex(prev => (prev < count - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex(prev => (prev > 0 ? prev - 1 : count - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && previewList[activeIndex]) {
        playTrack(previewList[activeIndex], results);
        setIsDropdownOpen(false);
      } else if (query.trim()) {
        setIsDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelectTrack = (track, list) => {
    playTrack(track, list);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <header className="spoty-header">
      {/* Navigation history arrows */}
      <div className="header-left">
        <button className="round-nav-btn" title="Back" onClick={() => window.history.back()}>
          <ChevronLeft size={22} />
        </button>
        <button className="round-nav-btn" title="Forward" onClick={() => window.history.forward()}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Interactive Search Bar */}
      <div className="header-search-container" ref={searchContainerRef}>
        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search tracks, artists, or genres..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (query.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls="quick-search-list"
          />
          {query && (
            <button className="clear-search-btn" onClick={handleClear} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Search Autocomplete Dropdown */}
        <QuickSearchDropdown
          results={results}
          isLoading={isLoading}
          isOpen={isDropdownOpen && Boolean(query.trim())}
          activeIndex={activeIndex}
          onSelectTrack={handleSelectTrack}
          onClose={() => setIsDropdownOpen(false)}
          searchQuery={query}
        />
      </div>

      {/* Source Selector & Legal Button */}
      <div className="header-right">
        <div className="source-picker-pill">
          <Database size={15} className="text-secondary" />
          <select
            className="source-select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            title="Select Public Legal Audio Source"
          >
            <option value="all">All Sources (YouTube + Saavn)</option>
            <option value="piped">YouTube Music (Background)</option>
            <option value="saavn">JioSaavn 320kbps (Full)</option>
            <option value="archive">Internet Archive (Full)</option>
          </select>
        </div>

        <button className="pill-attribution-btn" onClick={onOpenAttribution} title="Legal Terms & Attribution">
          <ShieldCheck size={16} />
          <span>Terms</span>
        </button>
      </div>
    </header>
  );
}
