import React, { useState, useEffect } from 'react';
import { AudioProvider } from './context/AudioContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SearchPage from './components/SearchPage';
import HomePage from './components/HomePage';
import LikedSongsPage from './components/LikedSongsPage';
import PlaylistsPage from './components/PlaylistsPage';
import PlaylistView from './components/PlaylistView';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import PlayerBar from './components/PlayerBar';
import QueueDrawer from './components/QueueDrawer';
import LyricsPanel from './components/LyricsPanel';
import AttributionModal from './components/AttributionModal';
import { useSearch } from './hooks/useSearch';
import { useAudio } from './context/AudioContext';

const DEFAULT_PLAYLISTS = [
  {
    id: 'pl_bollywood',
    title: 'Bollywood Hits & Melodies',
    description: 'Favorite Hindi songs, romance, and soulful vibes.',
    color: '#e74c3c',
    tracks: [
      {
        id: 'saavn_barsaat_main',
        title: 'Barsaat',
        subtitle: 'Armaan Malik, Payal Dev',
        image: 'https://c.saavncdn.com/236/Barsaat-Unknown-2026-20260708180612-500x500.jpg',
        tag: 'Direct 320kbps (Lock Screen Play)',
        previewUrl: 'https://aac.saavncdn.com/236/3895fcff973f4254da484f534a8f1392_320.mp4',
        duration: 236
      },
      {
        id: 'saavn_kesariya_main',
        title: 'Kesariya - Brahmāstra',
        subtitle: 'Arijit Singh, Pritam',
        image: 'https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg',
        tag: 'Direct 320kbps (Lock Screen Play)',
        previewUrl: 'https://aac.saavncdn.com/871/c2febd353f3a076a406fa37510f31f9f_320.mp4',
        duration: 268
      },
      {
        id: 'saavn_raataan_main',
        title: 'Raataan Lambiyan - Shershaah',
        subtitle: 'Jubin Nautiyal, Asees Kaur',
        image: 'https://c.saavncdn.com/238/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg',
        tag: 'Direct 320kbps (Lock Screen Play)',
        previewUrl: 'https://aac.saavncdn.com/238/35726d4394604604e961bf5b846870d0_320.mp4',
        duration: 230
      }
    ]
  },
  {
    id: 'pl_lofi',
    title: 'Midnight Lo-Fi Chill',
    description: 'Relaxing beats to study, focus, and chill out.',
    color: '#34495e',
    tracks: [
      {
        id: 'yt_jfKfPfyJRdk',
        title: 'lofi hip hop radio - beats to relax/study to',
        subtitle: 'Lofi Girl',
        image: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        tag: 'YouTube (Full Track)',
        previewUrl: 'youtube:jfKfPfyJRdk',
        duration: 240
      }
    ]
  },
  {
    id: 'pl_favorites',
    title: 'All-Time Favorites',
    description: 'Curated collection of songs you love on loop.',
    color: '#8e44ad',
    tracks: []
  }
];

const PLAYLIST_COLORS = ['#e74c3c', '#8e44ad', '#3498db', '#1abc9c', '#f39c12', '#2ecc71', '#e67e22', '#16a085'];

function SpotyMain() {
  const [currentView, setCurrentView] = useState('home');
  const [activePlaylistId, setActivePlaylistId] = useState('pl_bollywood');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isAttributionOpen, setIsAttributionOpen] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);

  const searchState = useSearch();
  const { likedTrackIds } = useAudio();

  // Playlists State & Persistence (ensuring default playlists load if saved is empty)
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('spoty_user_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_PLAYLISTS;
    } catch {
      return DEFAULT_PLAYLISTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('spoty_user_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.error('Failed to save playlists:', e);
    }
  }, [playlists]);

  // Liked tracks objects cache
  const [likedTracksCache, setLikedTracksCache] = useState(() => {
    try {
      const saved = localStorage.getItem('spoty_liked_tracks_objects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spoty_liked_tracks_objects');
      if (saved) setLikedTracksCache(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, [likedTrackIds]);

  const likedTracks = likedTracksCache.filter(t => likedTrackIds.includes(t.id));

  // Playlist Management Handlers
  const handleCreatePlaylist = (title = 'New Playlist') => {
    const randomColor = PLAYLIST_COLORS[Math.floor(Math.random() * PLAYLIST_COLORS.length)];
    const newPl = {
      id: `pl_${Date.now()}`,
      title,
      description: 'Custom playlist created on Spoty.',
      color: randomColor,
      tracks: []
    };
    setPlaylists(prev => [newPl, ...prev]);
    setActivePlaylistId(newPl.id);
    setCurrentView('playlist');
    return newPl;
  };

  const handleResetDefaultPlaylists = () => {
    setPlaylists(DEFAULT_PLAYLISTS);
    localStorage.setItem('spoty_user_playlists', JSON.stringify(DEFAULT_PLAYLISTS));
  };

  const handleDeletePlaylist = (playlistId) => {
    setPlaylists(prev => {
      const filtered = prev.filter(p => p.id !== playlistId);
      if (activePlaylistId === playlistId) {
        if (filtered.length > 0) {
          setActivePlaylistId(filtered[0].id);
        } else {
          setCurrentView('home');
        }
      }
      return filtered;
    });
  };

  const handleAddToPlaylist = (playlistId, track) => {
    if (!track) return;
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        if (pl.tracks?.some(t => t.id === track.id)) return pl;
        return {
          ...pl,
          tracks: [...(pl.tracks || []), track]
        };
      }
      return pl;
    }));
  };

  const handleRemoveTrackFromPlaylist = (playlistId, trackId) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          tracks: (pl.tracks || []).filter(t => t.id !== trackId)
        };
      }
      return pl;
    }));
  };

  const handleUpdatePlaylistTitle = (playlistId, newTitle) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, title: newTitle };
      }
      return pl;
    }));
  };

  const handleSelectPlaylist = (id) => {
    setActivePlaylistId(id);
    setCurrentView('playlist');
  };

  const handleSelectMood = (query) => {
    searchState.setQuery(query);
    setCurrentView('search');
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];

  return (
    <div className="spoty-app-root">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onSelectGenre={handleSelectMood}
        onOpenAttribution={() => setIsAttributionOpen(true)}
        likedCount={likedTracks.length}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylist={() => handleCreatePlaylist(`My Playlist #${playlists.length + 1}`)}
        onResetDefaultPlaylists={handleResetDefaultPlaylists}
      />

      <div className="spoty-main-wrapper">
        <Header
          query={searchState.query}
          setQuery={(q) => { searchState.setQuery(q); if (q.trim()) setCurrentView('search'); }}
          results={searchState.results}
          isLoading={searchState.isLoading}
          source={searchState.source}
          setSource={searchState.setSource}
          onOpenAttribution={() => setIsAttributionOpen(true)}
        />

        <main className="spoty-content-scroll">
          {currentView === 'home' && (
            <HomePage onSelectMood={handleSelectMood} />
          )}

          {currentView === 'liked' && (
            <LikedSongsPage likedTracks={likedTracks} />
          )}

          {currentView === 'playlists' && (
            <PlaylistsPage
              playlists={playlists}
              onSelectPlaylist={handleSelectPlaylist}
              onCreatePlaylist={() => handleCreatePlaylist(`My Playlist #${playlists.length + 1}`)}
            />
          )}

          {currentView === 'playlist' && (
            <PlaylistView
              playlist={activePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveTrack={handleRemoveTrackFromPlaylist}
              onUpdateTitle={handleUpdatePlaylistTitle}
              onGoToSearch={() => setCurrentView('search')}
            />
          )}

          {(currentView === 'search' || currentView === 'browse' || currentView === 'archive') && (
            <SearchPage
              query={searchState.query}
              setQuery={searchState.setQuery}
              results={searchState.results}
              isLoading={searchState.isLoading}
              isLoadingMore={searchState.isLoadingMore}
              hasMore={searchState.hasMore}
              loadMore={searchState.loadMore}
              filterType={searchState.filterType}
              setFilterType={searchState.setFilterType}
              recentSearches={searchState.recentSearches}
              removeRecentSearch={searchState.removeRecentSearch}
              clearRecentSearches={searchState.clearRecentSearches}
              onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
            />
          )}
        </main>
      </div>

      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      <LyricsPanel isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(addToPlaylistTrack)}
        onClose={() => setAddToPlaylistTrack(null)}
        track={addToPlaylistTrack}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onAddToPlaylist={handleAddToPlaylist}
      />

      <PlayerBar
        onToggleQueue={() => setIsQueueOpen(prev => !prev)}
        isQueueOpen={isQueueOpen}
        onOpenAttribution={() => setIsAttributionOpen(true)}
        onToggleLyrics={() => setIsLyricsOpen(prev => !prev)}
        isLyricsOpen={isLyricsOpen}
        onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
      />

      <AttributionModal
        isOpen={isAttributionOpen}
        onClose={() => setIsAttributionOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <SpotyMain />
    </AudioProvider>
  );
}
