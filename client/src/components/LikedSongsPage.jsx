import React from 'react';
import { Heart, Play, Pause, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function LikedSongsPage({ likedTracks }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();

  if (!likedTracks || likedTracks.length === 0) {
    return (
      <div className="liked-empty-state">
        <Heart size={64} className="liked-empty-icon" />
        <h2>Songs you like will appear here</h2>
        <p>Save songs by clicking the heart icon while browsing.</p>
      </div>
    );
  }

  return (
    <div className="liked-songs-page">
      <div className="liked-header" style={{ background: 'linear-gradient(135deg, #6c4ab6, #1a1a2e)' }}>
        <Heart size={80} fill="#1ed760" color="#1ed760" />
        <div>
          <p className="liked-playlist-label">Playlist</p>
          <h1 className="liked-title">Liked Songs</h1>
          <p className="liked-count">{likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="liked-tracklist">
        {likedTracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div
              key={track.id}
              className={`liked-row ${isCurrent ? 'active' : ''}`}
              onClick={() => playTrack(track, likedTracks)}
            >
              <span className="liked-row-num">{isCurrent && isPlaying ? '▶' : idx + 1}</span>
              <img src={track.image} alt={track.title} className="liked-row-art" />
              <div className="liked-row-info">
                <span className={`liked-row-title ${isCurrent ? 'text-accent' : ''}`}>{track.title}</span>
                <span className="liked-row-artist">{track.subtitle}</span>
              </div>
              <span className="liked-row-tag">{track.tag}</span>
              <button
                className="liked-row-play"
                onClick={e => {
                  e.stopPropagation();
                  isCurrent ? togglePlayPause() : playTrack(track, likedTracks);
                }}
              >
                {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
