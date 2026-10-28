import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const ytPlayerRef = useRef(null);
  const ytPlayerReadyRef = useRef(false);
  const isYouTubeRef = useRef(false);
  const pendingVideoIdRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    try {
      const saved = localStorage.getItem('spoty_liked_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [errorNotice, setErrorNotice] = useState(null);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    function initYT() {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player('spoty-yt-iframe', {
            height: '200',
            width: '200',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0
            },
            events: {
              onReady: () => {
                ytPlayerReadyRef.current = true;
                if (pendingVideoIdRef.current) {
                  const vid = pendingVideoIdRef.current;
                  pendingVideoIdRef.current = null;
                  ytPlayerRef.current.loadVideoById(vid);
                  ytPlayerRef.current.playVideo();
                  setIsPlaying(true);
                }
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  setErrorNotice(null);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  if (repeatMode === 'one') {
                    ytPlayerRef.current?.seekTo(0, true);
                    ytPlayerRef.current?.playVideo();
                  } else {
                    nextTrack();
                  }
                }
              },
              onError: (err) => {
                console.warn('YouTube Player playback warning:', err);
              }
            }
          });
        } catch (e) {
          console.warn('YT player initialization error:', e);
        }
      }
    }

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      window.onYouTubeIframeAPIReady = initYT;
    }
  }, [repeatMode]);

  // Track elapsed time & duration smoothly for YouTube
  useEffect(() => {
    const timer = setInterval(() => {
      if (isYouTubeRef.current && ytPlayerRef.current && isPlaying) {
        try {
          const curr = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (typeof curr === 'number' && !isNaN(curr)) {
            setCurrentTime(curr);
          }
          if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
            setDuration(dur);
          }
        } catch {}
      }
    }, 250);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Setup HTML5 Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isYouTubeRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (!isYouTubeRef.current) {
        setDuration(audio.duration || 0);
        setErrorNotice(null);
      }
    };
    const onError = (e) => {
      if (!isYouTubeRef.current) {
        console.warn('Audio playback error:', e);
        setIsPlaying(false);
        setErrorNotice('Unable to play audio stream from this source. Trying next track...');
      }
    };

    const onEnded = () => {
      if (!isYouTubeRef.current) {
        if (repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          nextTrack();
        }
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [repeatMode, queue, queueIndex]);

  // Persist liked tracks
  useEffect(() => {
    try {
      localStorage.setItem('spoty_liked_tracks', JSON.stringify(likedTrackIds));
    } catch (e) {
      console.error(e);
    }
  }, [likedTrackIds]);

  // Global keyboard shortcuts (Space to toggle play/pause when not in an input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        seek(Math.min(currentTime + 5, duration));
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        seek(Math.max(currentTime - 5, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration]);

  // MediaSession API Integration for Android Lock Screen & Background Playback
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Spoty Track',
        artist: currentTrack.subtitle || 'Spoty Music',
        album: currentTrack.tag || 'Spoty Keyless',
        artwork: [
          { src: currentTrack.image, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.image, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.image, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.image, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('MediaSession API notice:', e);
    }
  }, [currentTrack, isPlaying]);

  const playTrack = (track, newQueue = null) => {
    if (!track) return;

    setCurrentTrack(track);
    setErrorNotice(null);

    if (newQueue && Array.isArray(newQueue)) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    }

    const isYT = track.previewUrl?.startsWith('youtube:') || track.id?.startsWith('yt_');
    isYouTubeRef.current = isYT;

    if (isYT) {
      // Pause HTML5 audio
      audioRef.current.pause();

      const videoId = track.previewUrl?.replace('youtube:', '') || track.id?.replace('yt_', '');
      setDuration(track.duration || 180);
      setCurrentTime(0);

      if (ytPlayerReadyRef.current && ytPlayerRef.current?.loadVideoById) {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        pendingVideoIdRef.current = videoId;
      }
    } else {
      // Pause YouTube player
      if (ytPlayerRef.current?.pauseVideo) {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
      }

      if (!track.previewUrl) {
        setErrorNotice('No audio stream URL available for this item.');
        return;
      }

      const audio = audioRef.current;
      audio.src = track.previewUrl;
      audio.load();
      audio.play().catch(err => {
        console.warn('Autoplay blocked or error:', err.message);
        setIsPlaying(false);
      });
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0], queue);
      }
      return;
    }

    if (isYouTubeRef.current) {
      if (isPlaying) {
        try { ytPlayerRef.current?.pauseVideo(); } catch {}
        setIsPlaying(false);
      } else {
        try { ytPlayerRef.current?.playVideo(); } catch {}
        setIsPlaying(true);
      }
    } else {
      const audio = audioRef.current;
      if (audio.paused) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    }
  };

  const nextTrack = () => {
    if (!queue || queue.length === 0) return;

    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') nextIdx = 0;
        else return;
      }
    }

    setQueueIndex(nextIdx);
    const nextT = queue[nextIdx];
    if (nextT) {
      playTrack(nextT, queue);
    }
  };

  const prevTrack = () => {
    // If track has been playing for > 3s, restart it
    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (!queue || queue.length === 0) return;
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      playTrack(queue[prevIdx], queue);
    } else if (repeatMode === 'all') {
      const lastIdx = queue.length - 1;
      setQueueIndex(lastIdx);
      playTrack(queue[lastIdx], queue);
    }
  };

  const seek = (timeInSeconds) => {
    const clamped = Math.max(0, Math.min(timeInSeconds, duration || 180));
    setCurrentTime(clamped);

    if (isYouTubeRef.current) {
      try { ytPlayerRef.current?.seekTo(clamped, true); } catch {}
    } else {
      audioRef.current.currentTime = clamped;
    }
  };

  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(val, 1));
    audioRef.current.volume = clamped;
    setVolumeState(clamped);

    if (ytPlayerRef.current?.setVolume) {
      try { ytPlayerRef.current.setVolume(clamped * 100); } catch {}
    }

    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
      try { ytPlayerRef.current?.unMute(); } catch {}
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;

    if (newMuted) {
      try { ytPlayerRef.current?.mute(); } catch {}
    } else {
      try { ytPlayerRef.current?.unMute(); } catch {}
    }
  };

  const toggleLike = (id, trackObj = null) => {
    setLikedTrackIds(prev => {
      const isCurrentlyLiked = prev.includes(id);
      const updated = isCurrentlyLiked ? prev.filter(item => item !== id) : [...prev, id];

      try {
        const saved = localStorage.getItem('spoty_liked_tracks_objects');
        const objects = saved ? JSON.parse(saved) : [];
        if (isCurrentlyLiked) {
          const filtered = objects.filter(item => item.id !== id);
          localStorage.setItem('spoty_liked_tracks_objects', JSON.stringify(filtered));
        } else {
          const toSave = trackObj || (currentTrack && currentTrack.id === id ? currentTrack : null);
          if (toSave) {
            const deduped = objects.filter(item => item.id !== id);
            localStorage.setItem('spoty_liked_tracks_objects', JSON.stringify([toSave, ...deduped]));
          }
        }
      } catch (err) {
        console.error('Error syncing liked track objects:', err);
      }

      return updated;
    });
  };

  const toggleShuffle = () => setIsShuffle(prev => !prev);

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      queue,
      queueIndex,
      isShuffle,
      repeatMode,
      likedTrackIds,
      errorNotice,
      playTrack,
      togglePlayPause,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      toggleMute,
      toggleLike,
      toggleShuffle,
      toggleRepeat,
      clearError: () => setErrorNotice(null)
    }}>
      {children}
      {/* Invisible YouTube Player iframe container for background full track audio */}
      <div
        id="spoty-yt-iframe"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 200,
          height: 200,
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
