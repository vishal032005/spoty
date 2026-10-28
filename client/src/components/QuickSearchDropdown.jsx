import React from 'react';
import { Play, Sparkles } from 'lucide-react';

export default function QuickSearchDropdown({
  results,
  isLoading,
  isOpen,
  activeIndex,
  onSelectTrack,
  onClose,
  searchQuery
}) {
  if (!isOpen || (!isLoading && (!results || results.length === 0))) {
    return null;
  }

  const previewItems = (results || []).slice(0, 5);

  return (
    <div className="quick-search-dropdown" role="listbox" id="quick-search-list">
      <div className="dropdown-header">
        <Sparkles size={14} className="text-accent" />
        <span>Quick Suggestions</span>
      </div>

      {isLoading ? (
        <div className="dropdown-loading">
          <div className="spinner-dots">
            <div></div><div></div><div></div>
          </div>
          <span>Searching open music catalogs...</span>
        </div>
      ) : (
        <div className="dropdown-items">
          {previewItems.map((item, index) => {
            const isSelected = index === activeIndex;
            return (
              <div
                key={item.id}
                role="option"
                aria-selected={isSelected}
                className={`dropdown-item ${isSelected ? 'highlighted' : ''}`}
                onClick={() => onSelectTrack(item, results)}
              >
                <div className="item-art-wrapper">
                  <img src={item.image} alt={item.title} className="item-thumb" />
                  <div className="hover-play-overlay">
                    <Play size={14} fill="#fff" />
                  </div>
                </div>

                <div className="item-details">
                  <div className="item-title">{item.title}</div>
                  <div className="item-subtitle">{item.subtitle}</div>
                </div>

                <div className="item-badge-pill">
                  {item.tag}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="dropdown-footer">
        <span>Press <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to play, <kbd>Esc</kbd> to dismiss</span>
      </div>
    </div>
  );
}
