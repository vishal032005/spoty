import React from 'react';
import { X, Play, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export default function QueueDrawer({ isOpen, onClose }) {
  const { queue, queueIndex, playTrack, currentTrack } = useAudio();

  if (!isOpen) return null;

  return (
    <aside className="queue-drawer">
      <div className="queue-header">
        <div className="queue-title-group">
          <Music size={18} className="text-accent" />
          <h3>Play Queue</h3>
        </div>
        <button className="queue-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="queue-content">
        {/* Currently Playing Track */}
        {currentTrack && (
          <div className="queue-section">
            <h4 className="queue-subheading">Now Playing</h4>
            <div className="queue-item current">
              <img src={currentTrack.image} alt={currentTrack.title} className="queue-art" />
              <div className="queue-item-info">
                <span className="queue-track-title">{currentTrack.title}</span>
                <span className="queue-artist">{currentTrack.subtitle}</span>
              </div>
              <span className="queue-tag">{currentTrack.tag}</span>
            </div>
          </div>
        )}

        {/* Next Up */}
        <div className="queue-section">
          <h4 className="queue-subheading">Next in Queue ({queue.length > 0 ? queue.length - (queueIndex + 1) : 0})</h4>
          {queue.length === 0 || queueIndex >= queue.length - 1 ? (
            <div className="queue-empty">No more tracks in queue. Search and select tracks to queue them.</div>
          ) : (
            <div className="queue-list">
              {queue.slice(queueIndex + 1).map((track, i) => (
                <div
                  key={track.id + '_' + i}
                  className="queue-item"
                  onClick={() => playTrack(track, queue)}
                >
                  <img src={track.image} alt={track.title} className="queue-art" />
                  <div className="queue-item-info">
                    <span className="queue-track-title">{track.title}</span>
                    <span className="queue-artist">{track.subtitle}</span>
                  </div>
                  <button className="queue-play-hover">
                    <Play size={14} fill="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
