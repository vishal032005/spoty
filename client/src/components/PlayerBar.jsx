import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  Info,
  Mic2,
  ListPlus
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function PlayerBar({ onToggleQueue, isQueueOpen, onOpenAttribution, onToggleLyrics, isLyricsOpen, onOpenAddToPlaylist }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    likedTrackIds,
    errorNotice,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    clearError
  } = useAudio();

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const isLiked = currentTrack && likedTrackIds.includes(currentTrack.id);

  // Volume icon logic
  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <footer className="spoty-player-bar">
      {/* Top progress bar for mobile mini-player */}
      <div className="mobile-player-progress-bar">
        <div
          className="mobile-player-progress-fill"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        ></div>
      </div>

      {/* Error notification bar if stream error occurs */}
      {errorNotice && (
        <div className="player-error-banner">
          <span>{errorNotice}</span>
          <button className="error-close-btn" onClick={clearError}>&times;</button>
        </div>
      )}

      {/* Left: Track Information */}
      <div className="player-left">
        {currentTrack ? (
          <>
            <img src={currentTrack.image} alt={currentTrack.title} className="player-artwork" />
            <div className="player-meta">
              <div className="player-track-title" title={currentTrack.title}>
                {currentTrack.title}
              </div>
              <div className="player-artist" title={currentTrack.subtitle}>
                {currentTrack.subtitle}
              </div>
              <span className="player-source-tag">{currentTrack.tag}</span>
            </div>
            <button
              className={`player-like-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => toggleLike(currentTrack.id, currentTrack)}
              title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
            >
              <Heart size={18} fill={isLiked ? '#1ed760' : 'none'} color={isLiked ? '#1ed760' : 'currentColor'} />
            </button>
            {onOpenAddToPlaylist && (
              <button
                className="player-like-btn"
                onClick={() => onOpenAddToPlaylist(currentTrack)}
                title="Add to Playlist"
              >
                <ListPlus size={18} />
              </button>
            )}
          </>
        ) : (
          <div className="player-placeholder">
            <span className="placeholder-text">Select a track to start playback</span>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Scrubber */}
      <div className="player-center">
        {/* Buttons Row */}
        <div className="playback-controls">
          <button
            className={`control-btn ${isShuffle ? 'active-control' : ''}`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Disable Shuffle' : 'Enable Shuffle'}
          >
            <Shuffle size={18} />
          </button>

          <button className="control-btn" onClick={prevTrack} title="Previous Track (or restart)">
            <SkipBack size={20} />
          </button>

          <button
            className="master-play-btn"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={22} fill="#000" /> : <Play size={22} fill="#000" />}
          </button>

          <button className="control-btn" onClick={nextTrack} title="Next Track">
            <SkipForward size={20} />
          </button>

          <button
            className={`control-btn ${repeatMode !== 'off' ? 'active-control' : ''}`}
            onClick={toggleRepeat}
            title={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Progress Bar / Scrubber Timeline */}
        <div className="scrubber-row">
          <span className="scrubber-time">{formatTime(currentTime)}</span>
          <div className="scrubber-bar-container">
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.1"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="scrubber-input"
              aria-label="Seek time"
            />
            <div
              className="scrubber-fill"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
          <span className="scrubber-time">{formatTime(duration || 30)}</span>
        </div>
      </div>

      {/* Right: Queue, Lyrics & Volume Controls */}
      <div className="player-right">
        <button
          className={`player-extra-btn ${isQueueOpen ? 'active-control' : ''}`}
          onClick={onToggleQueue}
          title="Play Queue"
        >
          <ListMusic size={18} />
        </button>

        <button
          className={`player-extra-btn ${isLyricsOpen ? 'active-control' : ''}`}
          onClick={onToggleLyrics}
          title="Lyrics"
        >
          <Mic2 size={18} />
        </button>

        <button
          className="player-extra-btn"
          onClick={onOpenAttribution}
          title="Public API Attribution Notice"
        >
          <Info size={18} />
        </button>

        <div className="volume-control-box">
          <button className="volume-icon-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            {renderVolumeIcon()}
          </button>
          <div className="volume-slider-wrapper">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
              aria-label="Volume slider"
            />
            <div
              className="volume-fill"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
