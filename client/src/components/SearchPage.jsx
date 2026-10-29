import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Heart, Clock, Sparkles, Filter, Music, Disc, Mic, ListPlus } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { API_BASE } from '../config';

export default function SearchPage({
  query,
  setQuery,
  results,
  isLoading,
  isLoadingMore,
  hasMore,
  loadMore,
  filterType,
  setFilterType,
  recentSearches,
  removeRecentSearch,
  clearRecentSearches,
  onOpenAddToPlaylist
}) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, likedTrackIds, toggleLike } = useAudio();
  const [categories, setCategories] = useState([]);
  const observerRef = useRef(null);

  // Fetch categories for the default Browse All view
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '200px' });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // Format seconds into mm:ss
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const topResult = results && results.length > 0 ? results[0] : null;
  const songResults = results && results.length > 1 ? results.slice(1) : [];

  return (
    <div className="search-page-container">
      {/* 1. Default Browse All State (When query is empty) */}
      {!query.trim() && (
        <section className="browse-all-section">
          {/* Recent Searches Header */}
          {recentSearches && recentSearches.length > 0 && (
            <div className="recent-searches-block">
              <div className="section-title-row">
                <h2 className="section-title">Recent searches</h2>
                <button className="clear-recents-link" onClick={clearRecentSearches}>
                  Clear all
                </button>
              </div>
              <div className="recent-pills-row">
                {recentSearches.map(term => (
                  <div key={term} className="recent-search-pill" onClick={() => setQuery(term)}>
                    <span>{term}</span>
                    <button
                      className="pill-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(term);
                      }}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse All Categories Grid */}
          <div className="browse-categories-block">
            <h2 className="section-title">Browse all</h2>
            <div className="categories-grid">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="category-card"
                  style={{ backgroundColor: cat.color }}
                  onClick={() => setQuery(cat.query)}
                >
                  <span className="category-title">{cat.title}</span>
                  <div className="category-icon-bg">
                    <Music size={54} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Active Search Results State */}
      {query.trim() && (
        <section className="search-results-section">
          {/* Filter Chips Bar */}
          <div className="filter-chips-row">
            <button
              className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-chip ${filterType === 'track' ? 'active' : ''}`}
              onClick={() => setFilterType('track')}
            >
              <Music size={14} /> Songs
            </button>
            <button
              className={`filter-chip ${filterType === 'artist' ? 'active' : ''}`}
              onClick={() => setFilterType('artist')}
            >
              <Mic size={14} /> Artists
            </button>
            <button
              className={`filter-chip ${filterType === 'album' ? 'active' : ''}`}
              onClick={() => setFilterType('album')}
            >
              <Disc size={14} /> Albums
            </button>
          </div>

          {isLoading ? (
            <div className="search-loading-state">
              <div className="pulsing-loader"></div>
              <p>Searching legal music sources for "{query}"...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty-state">
              <h3>No results found for "{query}"</h3>
              <p>Try searching by artist name, track title, or choose another public source above.</p>
            </div>
          ) : (
            <div className="results-content-layout">
              {/* Top Result + Songs Side-by-Side */}
              <div className="top-split-layout">
                {/* Left: Featured Top Result Card */}
                {topResult && (
                  <div className="top-result-column">
                    <h3 className="sub-heading">Top result</h3>
                    <div
                      className="top-result-card"
                      onClick={() => playTrack(topResult, results)}
                    >
                      <img src={topResult.image} alt={topResult.title} className="top-result-art" />
                      <div className="top-result-title">{topResult.title}</div>
                      <div className="top-result-meta">
                        <span className="type-badge">{topResult.type.toUpperCase()}</span>
                        <span className="top-result-artist">{topResult.subtitle}</span>
                      </div>
                      <div className="top-result-source-tag">
                        {topResult.tag}
                      </div>

                      {/* Play Button with Hover Lift */}
                      <button
                        className="top-result-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentTrack?.id === topResult.id) {
                            togglePlayPause();
                          } else {
                            playTrack(topResult, results);
                          }
                        }}
                      >
                        {currentTrack?.id === topResult.id && isPlaying ? (
                          <Pause size={24} fill="#000" />
                        ) : (
                          <Play size={24} fill="#000" />
                        )}
                      </button>

                      {onOpenAddToPlaylist && (
                        <button
                          className="top-result-add-pl-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAddToPlaylist(topResult);
                          }}
                          title="Add to Playlist"
                        >
                          <ListPlus size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Right: Songs Tracklist */}
                <div className="songs-list-column">
                  <h3 className="sub-heading">Songs</h3>
                  <div className="songs-tracklist">
                    {songResults.slice(0, 5).map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const isLiked = likedTrackIds.includes(track.id);

                      return (
                        <div
                          key={track.id}
                          className={`tracklist-row ${isCurrent ? 'active' : ''}`}
                          onClick={() => playTrack(track, results)}
                        >
                          <div className="row-col-index">
                            <span className="track-number">{idx + 1}</span>
                            <button
                              className="row-play-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCurrent) togglePlayPause();
                                else playTrack(track, results);
                              }}
                            >
                              {isCurrent && isPlaying ? (
                                <Pause size={14} fill="#fff" />
                              ) : (
                                <Play size={14} fill="#fff" />
                              )}
                            </button>
                          </div>

                          <img src={track.image} alt={track.title} className="row-thumb" />

                          <div className="row-info">
                            <span className={`row-title ${isCurrent ? 'text-accent' : ''}`}>
                              {track.title}
                            </span>
                            <span className="row-artist">{track.subtitle}</span>
                          </div>

                          <div className="row-tag-badge">
                            {track.tag}
                          </div>

                          <button
                            className={`row-like-btn ${isLiked ? 'liked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id, track);
                            }}
                          >
                            <Heart size={16} fill={isLiked ? '#1ed760' : 'none'} color={isLiked ? '#1ed760' : 'currentColor'} />
                          </button>

                          {onOpenAddToPlaylist && (
                            <button
                              className="row-add-pl-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAddToPlaylist(track);
                              }}
                              title="Add to Playlist"
                            >
                              <ListPlus size={16} />
                            </button>
                          )}

                          <div className="row-duration">
                            {formatTime(track.duration)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grid of Remaining Results */}
              {songResults.length > 5 && (
                <div className="more-results-section">
                  <h3 className="sub-heading">More matches</h3>
                  <div className="cards-grid">
                    {songResults.slice(5).map(item => {
                      const isCurrent = currentTrack?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className="music-card"
                          onClick={() => playTrack(item, results)}
                        >
                          <div className="card-art-box">
                            <img src={item.image} alt={item.title} className="card-img" />
                            <button
                              className="card-play-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCurrent) togglePlayPause();
                                else playTrack(item, results);
                              }}
                            >
                              {isCurrent && isPlaying ? (
                                <Pause size={20} fill="#000" />
                              ) : (
                                <Play size={20} fill="#000" />
                              )}
                            </button>
                          </div>
                          <div className="card-title" title={item.title}>{item.title}</div>
                          <div className="card-subtitle">{item.subtitle}</div>
                          <div className="card-tag">{item.tag}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Infinite Scroll Trigger Sentinel */}
              <div ref={observerRef} className="infinite-scroll-sentinel">
                {isLoadingMore && (
                  <div className="loading-more-indicator">
                    <div className="spinner-dots"><div></div><div></div><div></div></div>
                    <span>Loading more tracks...</span>
                  </div>
                )}
                {!hasMore && results.length > 10 && (
                  <div className="end-of-results-text">
                    You've reached the end of the public preview catalog.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
