import React, { useState } from 'react';
import { Play, Pause, Trash2, Heart, Music, Clock, Edit2, Check } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function PlaylistView({
  playlist,
  onDeletePlaylist,
  onRemoveTrack,
  onUpdateTitle,
  onGoToSearch
}) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, likedTrackIds, toggleLike } = useAudio();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist?.title || '');

  if (!playlist) return null;

  const tracks = playlist.tracks || [];

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      if (currentTrack && tracks.some(t => t.id === currentTrack.id)) {
        togglePlayPause();
      } else {
        playTrack(tracks[0], tracks);
      }
    }
  };

  const handleSaveTitle = (e) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onUpdateTitle(playlist.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs || isNaN(secs)) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDurationMin = Math.round(tracks.reduce((acc, t) => acc + (t.duration || 180), 0) / 60);

  const isPlaylistActive = currentTrack && tracks.some(t => t.id === currentTrack.id);

  return (
    <div className="playlist-view-page">
      {/* Header Banner */}
      <div
        className="playlist-header"
        style={{
          background: `linear-gradient(180deg, ${playlist.color || '#2e4057'}dd 0%, #121212 100%)`
        }}
      >
        <div className="playlist-cover-art" style={{ background: playlist.color || '#333' }}>
          <Music size={64} className="playlist-cover-icon" />
        </div>

        <div className="playlist-meta-column">
          <span className="playlist-eyebrow">Playlist</span>

          {isEditing ? (
            <form onSubmit={handleSaveTitle} className="playlist-edit-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="playlist-title-input"
                autoFocus
              />
              <button type="submit" className="playlist-edit-save-btn">
                <Check size={18} />
              </button>
            </form>
          ) : (
            <div className="playlist-title-row">
              <h1 className="playlist-main-title" onClick={() => setIsEditing(true)} title="Click to rename">
                {playlist.title}
              </h1>
              <button className="playlist-rename-btn" onClick={() => setIsEditing(true)} title="Rename playlist">
                <Edit2 size={16} />
              </button>
            </div>
          )}

          <p className="playlist-description">
            {playlist.description || 'Personal collection created on Spoty.'}
          </p>

          <div className="playlist-stats-row">
            <span className="playlist-owner">Spoty User</span>
            <span className="stats-dot">•</span>
            <span>{tracks.length} song{tracks.length !== 1 ? 's' : ''}</span>
            {tracks.length > 0 && (
              <>
                <span className="stats-dot">•</span>
                <span>about {totalDurationMin} min</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="playlist-actions-bar">
        {tracks.length > 0 && (
          <button
            className="playlist-master-play-btn"
            onClick={handlePlayAll}
            title={isPlaylistActive && isPlaying ? 'Pause' : 'Play playlist'}
          >
            {isPlaylistActive && isPlaying ? (
              <Pause size={28} fill="#000" />
            ) : (
              <Play size={28} fill="#000" />
            )}
          </button>
        )}

        <button
          className="playlist-delete-btn"
          onClick={() => {
            if (window.confirm(`Delete playlist "${playlist.title}"?`)) {
              onDeletePlaylist(playlist.id);
            }
          }}
          title="Delete Playlist"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Tracklist Table */}
      {tracks.length === 0 ? (
        <div className="playlist-empty-state">
          <Music size={60} className="empty-pl-icon" />
          <h3>This playlist is empty</h3>
          <p>Search for your favorite songs and click the "+ Playlist" button to add them here.</p>
          <button className="btn-primary" onClick={onGoToSearch} style={{ marginTop: '1rem' }}>
            Find Songs to Add
          </button>
        </div>
      ) : (
        <div className="playlist-table-container">
          <div className="playlist-table-header">
            <span className="col-num">#</span>
            <span className="col-title">Title</span>
            <span className="col-tag">Source</span>
            <span className="col-time"><Clock size={16} /></span>
            <span className="col-action"></span>
          </div>

          <div className="playlist-table-body">
            {tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedTrackIds.includes(track.id);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`playlist-row ${isCurrent ? 'active' : ''}`}
                  onClick={() => playTrack(track, tracks)}
                >
                  <div className="col-num">
                    <span className="row-index-num">{idx + 1}</span>
                    <button
                      className="row-hover-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlayPause();
                        else playTrack(track, tracks);
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause size={14} fill="#fff" />
                      ) : (
                        <Play size={14} fill="#fff" />
                      )}
                    </button>
                  </div>

                  <div className="col-title">
                    <img src={track.image} alt={track.title} className="track-thumb" />
                    <div className="track-info">
                      <span className={`track-title-text ${isCurrent ? 'text-accent' : ''}`}>
                        {track.title}
                      </span>
                      <span className="track-artist-text">{track.subtitle}</span>
                    </div>
                  </div>

                  <div className="col-tag">
                    <span className="playlist-track-tag">{track.tag}</span>
                  </div>

                  <div className="col-time">
                    <button
                      className={`row-like-icon ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track.id, track);
                      }}
                      title={isLiked ? 'Remove from Liked' : 'Like'}
                    >
                      <Heart size={16} fill={isLiked ? '#1ed760' : 'none'} color={isLiked ? '#1ed760' : 'currentColor'} />
                    </button>
                    <span className="track-duration-text">{formatDuration(track.duration)}</span>
                  </div>

                  <div className="col-action">
                    <button
                      className="remove-track-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(playlist.id, track.id);
                      }}
                      title="Remove from playlist"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

