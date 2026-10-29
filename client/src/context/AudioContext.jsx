import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';

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

  // Mutable refs to prevent stale closure bugs in event callbacks & background loops
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const isShuffleRef = useRef(isShuffle);
  const repeatModeRef = useRef(repeatMode);
  const isPlayingRef = useRef(isPlaying);
  const currentTrackRef = useRef(currentTrack);
  const userPausedRef = useRef(false);
  const keepAliveAudioRef = useRef(null);
  const webAudioKeepAliveRef = useRef(null);

  const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

  // Hardware Audio Pipeline Keep-Alive for Android Lock Screen
  const startKeepAliveAudio = () => {
    try {
      if (!webAudioKeepAliveRef.current) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.0001; // Inaudible, but keeps Android hardware AudioTrack active
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          webAudioKeepAliveRef.current = { ctx, osc, gain };
        }
      } else if (webAudioKeepAliveRef.current.ctx.state === 'suspended') {
        webAudioKeepAliveRef.current.ctx.resume();
      }
    } catch {}

    try {
      if (keepAliveAudioRef.current) {
        keepAliveAudioRef.current.play().catch(() => {});
      }
    } catch {}
  };

  const stopKeepAliveAudio = () => {
    try {
      if (webAudioKeepAliveRef.current?.ctx?.state === 'running') {
        webAudioKeepAliveRef.current.ctx.suspend();
      }
    } catch {}

    try {
      if (keepAliveAudioRef.current) {
        keepAliveAudioRef.current.pause();
      }
    } catch {}
  };

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  // Robust Next Track / Song End Handler (reads from mutable refs)
  const handleTrackEnded = () => {
    if (repeatModeRef.current === 'one') {
      if (isYouTubeRef.current) {
        ytPlayerRef.current?.seekTo(0, true);
        ytPlayerRef.current?.playVideo();
      } else {
        const audio = audioRef.current;
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    const currentQueue = queueRef.current;
    if (!currentQueue || currentQueue.length === 0) return;

    let nextIdx;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else {
      nextIdx = queueIndexRef.current + 1;
      if (nextIdx >= currentQueue.length) {
        // If at end of queue/playlist, loop back to the beginning
        nextIdx = 0;
      }
    }

    const nextT = currentQueue[nextIdx];
    if (nextT) {
      setQueueIndex(nextIdx);
      queueIndexRef.current = nextIdx;
      playTrack(nextT, currentQueue);
    }
  };

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
                  isPlayingRef.current = true;
                }
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  isPlayingRef.current = true;
                  userPausedRef.current = false;
                  setErrorNotice(null);
                  startKeepAliveAudio();
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  // If pause was NOT user-initiated (e.g. Android screen lock or app minimize)
                  if (isPlayingRef.current && !userPausedRef.current) {
                    setTimeout(() => {
                      if (!userPausedRef.current) {
                        try { ytPlayerRef.current?.playVideo(); } catch {}
                      }
                    }, 50);
                  } else {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    stopKeepAliveAudio();
                  }
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  handleTrackEnded();
                }
              },
              onError: (err) => {
                console.warn('YouTube Player playback warning:', err);
                handleTrackEnded();
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
  }, []);

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

  const playViaYouTubeIframe = (track) => {
    if (!track) return;
    isYouTubeRef.current = true;
    try { audioRef.current.pause(); } catch {}

    const cleanUrl = track.previewUrl || '';
    let videoId = track.id?.replace(/^yt_/, '') || '';
    if (cleanUrl.includes('youtube?id=')) {
      videoId = cleanUrl.split('youtube?id=')[1]?.split('&')[0] || videoId;
    } else if (cleanUrl.startsWith('youtube:')) {
      videoId = cleanUrl.replace('youtube:', '');
    }

    setDuration(track.duration || 180);
    setCurrentTime(0);

    if (ytPlayerReadyRef.current && ytPlayerRef.current?.loadVideoById) {
      try {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        isPlayingRef.current = true;
        setErrorNotice(null);
      } catch (err) {
        console.warn('YT fallback error:', err);
      }
    } else {
      pendingVideoIdRef.current = videoId;
    }
  };

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
        const activeTrack = currentTrackRef.current;
        if (activeTrack && (activeTrack.id?.startsWith('yt_') || activeTrack.previewUrl?.includes('youtube') || activeTrack.previewUrl?.includes('invidious'))) {
          console.log('[AudioContext] Direct stream failed, falling back to YouTube iframe player for:', activeTrack.title);
          playViaYouTubeIframe(activeTrack);
          return;
        }

        setIsPlaying(false);
        setErrorNotice('Unable to play audio stream from this source. Trying next track...');
      }
    };

    const onEnded = () => {
      if (!isYouTubeRef.current) {
        handleTrackEnded();
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

    userPausedRef.current = false;
    isPlayingRef.current = true;
    setCurrentTrack(track);
    setErrorNotice(null);

    // Keep background audio active in Android
    startKeepAliveAudio();

    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      if (newQueue !== queueRef.current) {
        setQueue(newQueue);
        queueRef.current = newQueue;
        const index = newQueue.findIndex(t => t.id === track.id);
        const targetIndex = index !== -1 ? index : 0;
        setQueueIndex(targetIndex);
        queueIndexRef.current = targetIndex;
      }
    }

    // Instant YouTube Playback: Bypass slow server roundtrip and play immediately via YouTube player
    const isYT = track.id?.startsWith('yt_') || 
                 track.previewUrl?.startsWith('youtube:') || 
                 track.previewUrl?.includes('youtube.com') ||
                 track.tag?.toLowerCase().includes('youtube');

    if (isYT) {
      try { audioRef.current.pause(); } catch {}
      playViaYouTubeIframe(track);
      return;
    }

    // Direct High-Fidelity Audio Streams (JioSaavn 320kbps, etc.) play via native HTML5 Audio
    isYouTubeRef.current = false;
    let audioUrl = track.previewUrl || '';
    if (audioUrl.startsWith('/api/')) {
      audioUrl = `${API_BASE}${audioUrl}`;
    }

    if (!audioUrl) {
      setErrorNotice('No audio stream URL available for this item.');
      handleTrackEnded();
      return;
    }

    if (track.duration) {
      setDuration(track.duration);
    }

    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.play().catch(err => {
      console.warn('Playback error or blocked:', err.message);
      setIsPlaying(false);
    });
  };

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (queueRef.current.length > 0) {
        playTrack(queueRef.current[0], queueRef.current);
      }
      return;
    }

    if (isYouTubeRef.current) {
      if (isPlaying) {
        userPausedRef.current = true;
        try { ytPlayerRef.current?.pauseVideo(); } catch {}
        stopKeepAliveAudio();
        setIsPlaying(false);
        isPlayingRef.current = false;
      } else {
        userPausedRef.current = false;
        try { ytPlayerRef.current?.playVideo(); } catch {}
        startKeepAliveAudio();
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    } else {
      const audio = audioRef.current;
      if (audio.paused) {
        userPausedRef.current = false;
        audio.play().catch(console.error);
        startKeepAliveAudio();
        setIsPlaying(true);
        isPlayingRef.current = true;
      } else {
        userPausedRef.current = true;
        audio.pause();
        stopKeepAliveAudio();
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    }
  };

  const nextTrack = () => {
    handleTrackEnded();
  };

  const prevTrack = () => {
    // If track has been playing for > 3s, restart it
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const currentQueue = queueRef.current;
    if (!currentQueue || currentQueue.length === 0) return;

    let prevIdx = queueIndexRef.current - 1;
    if (prevIdx < 0) {
      prevIdx = currentQueue.length - 1;
    }

    const prevT = currentQueue[prevIdx];
    if (prevT) {
      setQueueIndex(prevIdx);
      queueIndexRef.current = prevIdx;
      playTrack(prevT, currentQueue);
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
      {/* Active YouTube Player iframe kept in active viewport (1px) to prevent Chromium background discard */}
      <div
        id="spoty-yt-iframe"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
      {/* Hidden audio element loop for Android WebView background keep-alive */}
      <audio
        ref={keepAliveAudioRef}
        loop
        playsInline
        src={SILENT_AUDIO}
        style={{
          position: 'fixed',
          width: 0,
          height: 0,
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
