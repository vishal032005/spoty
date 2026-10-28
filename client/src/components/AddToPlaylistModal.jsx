import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';

export default function AddToPlaylistModal({
  isOpen,
  onClose,
  track,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist
}) {
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState(null);

  if (!isOpen || !track) return null;

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newPl = onCreatePlaylist(newTitle.trim());
    onAddToPlaylist(newPl.id, track);
    setNewTitle('');
    setIsCreating(false);
    setAddedPlaylistId(newPl.id);
    setTimeout(() => {
      onClose();
      setAddedPlaylistId(null);
    }, 900);
  };

  const handleSelect = (plId) => {
    onAddToPlaylist(plId, track);
    setAddedPlaylistId(plId);
    setTimeout(() => {
      onClose();
      setAddedPlaylistId(null);
    }, 700);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="playlist-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="playlist-modal-header">
          <div className="playlist-modal-title-row">
            <Music size={20} className="text-accent" />
            <h3>Add to Playlist</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Track Preview Header */}
        <div className="modal-track-preview">
          <img src={track.image} alt={track.title} className="modal-track-img" />
          <div className="modal-track-meta">
            <span className="modal-track-title">{track.title}</span>
            <span className="modal-track-artist">{track.subtitle}</span>
          </div>
        </div>

        {/* Create New Playlist Button / Inline Form */}
        {!isCreating ? (
          <button className="create-pl-trigger-btn" onClick={() => setIsCreating(true)}>
            <Plus size={18} />
            <span>New Playlist</span>
          </button>
        ) : (
          <form className="create-pl-inline-form" onSubmit={handleCreateAndAdd}>
            <input
              type="text"
              placeholder="Playlist name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="create-pl-input"
              autoFocus
            />
            <div className="create-pl-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!newTitle.trim()}>
                Create & Add
              </button>
            </div>
          </form>
        )}

        {/* Existing Playlists List */}
        <div className="modal-playlists-list">
          {playlists.map((pl) => {
            const hasSong = pl.tracks?.some((t) => t.id === track.id);
            const isJustAdded = addedPlaylistId === pl.id;

            return (
              <div
                key={pl.id}
                className={`modal-playlist-item ${hasSong ? 'already-added' : ''}`}
                onClick={() => !hasSong && handleSelect(pl.id)}
              >
                <div
                  className="modal-pl-icon"
                  style={{ background: pl.color || '#333' }}
                >
                  <Music size={16} />
                </div>
                <div className="modal-pl-info">
                  <span className="modal-pl-name">{pl.title}</span>
                  <span className="modal-pl-count">
                    {pl.tracks?.length || 0} song{pl.tracks?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isJustAdded && (
                  <span className="modal-added-badge">
                    <Check size={16} className="text-accent" /> Added!
                  </span>
                )}
                {hasSong && !isJustAdded && (
                  <span className="modal-exists-text">Added</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

