import React from 'react';
import { Home, Search, Library, Music, ShieldCheck, Heart, Sparkles, Radio, Plus, ListMusic, RotateCcw } from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  onSelectGenre,
  onOpenAttribution,
  likedCount,
  playlists = [],
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onResetDefaultPlaylists
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'All Playlists', icon: ListMusic },
    { id: 'browse', label: 'Browse Genres', icon: Sparkles },
    { id: 'archive', label: 'Archive Audio', icon: Radio },
  ];

  return (
    <>
      <aside className="spoty-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Music size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Spoty</span>
            <span className="brand-badge">Keyless Open</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Playlists & Library Section */}
        <div className="sidebar-section">
          <div className="section-header playlist-section-header">
            <div className="header-label-group">
              <Library size={16} />
              <span>Playlists</span>
            </div>
            <button
              className="create-playlist-icon-btn"
              onClick={onCreatePlaylist}
              title="Create New Playlist"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Liked Songs Special Playlist Item */}
          <button
            className={`nav-link liked-nav-item ${currentView === 'liked' ? 'active' : ''}`}
            onClick={() => setCurrentView('liked')}
          >
            <div className="liked-heart-badge">
              <Heart size={14} fill="#fff" color="#fff" />
            </div>
            <span>Liked Songs</span>
            {likedCount > 0 && (
              <span className="nav-badge">{likedCount}</span>
            )}
          </button>

          {/* User Playlists List */}
          <div className="playlists-scroll-list">
            {playlists.length === 0 ? (
              <div className="sidebar-empty-box">
                <p className="sidebar-empty-text">No playlists yet</p>
                <button className="sidebar-seed-btn" onClick={onResetDefaultPlaylists}>
                  <RotateCcw size={12} /> Load Sample Playlists
                </button>
              </div>
            ) : (
              playlists.map(pl => {
                const isActive = currentView === 'playlist' && activePlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    className={`sidebar-playlist-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectPlaylist(pl.id)}
                  >
                    <div className="sidebar-pl-avatar" style={{ background: pl.color || '#444' }}>
                      <ListMusic size={14} />
                    </div>
                    <div className="sidebar-pl-meta">
                      <span className="sidebar-pl-title">{pl.title}</span>
                      <span className="sidebar-pl-sub">
                        {pl.tracks?.length || 0} song{pl.tracks?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Curated Vibes */}
        <div className="sidebar-section">
          <div className="section-header">
            <Sparkles size={16} />
            <span>Quick Vibes</span>
          </div>
          <div className="quick-vibes-list">
            <button className="vibe-item" onClick={() => onSelectGenre('Lofi Chill Beats')}>
              ☕ Lofi Beats
            </button>
            <button className="vibe-item" onClick={() => onSelectGenre('Classic Rock')}>
              🎸 Classic Rock
            </button>
            <button className="vibe-item" onClick={() => onSelectGenre('Top Pop Hits')}>
              ✨ Pop Hits
            </button>
            <button className="vibe-item" onClick={() => onSelectGenre('Smooth Jazz')}>
              🎷 Smooth Jazz
            </button>
            <button className="vibe-item" onClick={() => onSelectGenre('Focus Ambient Study')}>
              🎧 Deep Focus
            </button>
          </div>
        </div>

        {/* Terms & Attribution Footer Notice */}
        <div className="sidebar-footer">
          <button className="attribution-trigger-btn" onClick={onOpenAttribution}>
            <ShieldCheck size={16} className="text-accent" />
            <span>Terms & Attribution</span>
          </button>
          <p className="attribution-tiny-text">
            100% Free & Keyless APIs. Streamed in-memory only.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile <= 768px) */}
      <nav className="spoty-mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'search' || currentView === 'browse' || currentView === 'archive' ? 'active' : ''}`}
          onClick={() => setCurrentView('search')}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'playlists' || currentView === 'playlist' ? 'active' : ''}`}
          onClick={() => setCurrentView('playlists')}
        >
          <ListMusic size={20} />
          <span>Playlists</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'liked' ? 'active' : ''}`}
          onClick={() => setCurrentView('liked')}
        >
          <div className="mobile-liked-icon-wrapper">
            <Heart size={20} fill={currentView === 'liked' ? 'var(--accent-green)' : 'none'} />
            {likedCount > 0 && <span className="mobile-badge">{likedCount}</span>}
          </div>
          <span>Liked</span>
        </button>
      </nav>
    </>
  );
}
