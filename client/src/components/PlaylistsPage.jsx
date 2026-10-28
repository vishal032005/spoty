import React from 'react';
import { Plus, Music, Play, ListMusic } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function PlaylistsPage({
  playlists = [],
  onSelectPlaylist,
  onCreatePlaylist
}) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();

  return (
    <div className="playlists-page-container">
      <div className="playlists-page-header">
        <div>
          <h1 className="playlists-page-title">Your Playlists</h1>
          <p className="playlists-page-sub">Create, organize, and listen to your personal music collections.</p>
        </div>
        <button className="btn-primary-create-pl" onClick={onCreatePlaylist}>
          <Plus size={18} />
          <span>Create Playlist</span>
        </button>
      </div>

      <div className="playlists-cards-grid">
        {/* Create Playlist Action Card */}
        <div className="create-playlist-card" onClick={onCreatePlaylist}>
          <div className="create-pl-card-icon">
            <Plus size={36} />
          </div>
          <span className="create-pl-card-title">Create New Playlist</span>
          <span className="create-pl-card-sub">Start a fresh collection</span>
        </div>

        {/* Existing Playlists Cards */}
        {playlists.map(pl => {
          const trackCount = pl.tracks?.length || 0;
          const isThisPlaylistPlaying = currentTrack && pl.tracks?.some(t => t.id === currentTrack.id);

          return (
            <div
              key={pl.id}
              className="playlist-grid-card"
              onClick={() => onSelectPlaylist(pl.id)}
            >
              <div
                className="pl-card-cover"
                style={{ background: pl.color || '#333' }}
              >
                {pl.tracks?.[0]?.image ? (
                  <img src={pl.tracks[0].image} alt={pl.title} className="pl-card-img" />
                ) : (
                  <Music size={44} className="pl-card-fallback-icon" />
                )}

                {trackCount > 0 && (
                  <button
                    className="pl-card-hover-play"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isThisPlaylistPlaying) {
                        togglePlayPause();
                      } else {
                        playTrack(pl.tracks[0], pl.tracks);
                      }
                    }}
                    title="Play Playlist"
                  >
                    <Play size={22} fill="#000" />
                  </button>
                )}
              </div>

              <div className="pl-card-info">
                <span className="pl-card-title" title={pl.title}>{pl.title}</span>
                <span className="pl-card-count">
                  {trackCount} song{trackCount !== 1 ? 's' : ''}
                </span>
                <p className="pl-card-desc">
                  {pl.description || 'Personal playlist'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

