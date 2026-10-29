import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config';

async function fetchSaavnDirect(q, signal) {
  try {
    const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(q)}`, {
      signal
    });
    if (!res.ok) return [];
    const songs = await res.json();
    if (!Array.isArray(songs)) return [];
    return songs.map(song => {
      const audioUrl = song.media_url || song.media_preview_url || '';
      const title = (song.song || 'Unknown Title')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'");
      const artist = song.primary_artists || song.singers || song.music || 'Various Artists';
      return {
        type: 'track',
        title,
        image: song.image || '',
        subtitle: artist,
        id: `saavn_${song.id || Math.random().toString(36).substring(7)}`,
        tag: 'JioSaavn (Full 320kbps)',
        previewUrl: audioUrl,
        duration: parseInt(song.duration, 10) || 240
      };
    }).filter(s => Boolean(s.previewUrl));
  } catch {
    return [];
  }
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('all'); // 'all' (YouTube + Saavn full tracks) | 'piped' | 'saavn'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'track' | 'artist' | 'album'
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('spoty_recent_searches');
      return saved ? JSON.parse(saved) : ['Coldplay', 'Queen', 'Lofi Beats', 'Taylor Swift'];
    } catch {
      return ['Coldplay', 'Queen', 'Lofi Beats'];
    }
  });

  const abortControllerRef = useRef(null);
  const offsetRef = useRef(0);
  const LIMIT = 20;

  // Handle Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Persist recent searches
  const addRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('spoty_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((term) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term);
      try {
        localStorage.setItem('spoty_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('spoty_recent_searches');
  }, []);

  // Fetch search results with AbortController
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsLoading(false);
      setHasMore(false);
      offsetRef.current = 0;
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    offsetRef.current = 0;

    const url = `${API_BASE}/api/search?q=${encodeURIComponent(debouncedQuery)}&source=${source}&type=${filterType}&limit=${LIMIT}&offset=0`;

    const backendPromise = fetch(url, { signal: controller.signal })
      .then(res => res.ok ? res.json() : { results: [] })
      .then(data => data.results || [])
      .catch(() => []);

    const saavnPromise = (source === 'all' || source === 'saavn')
      ? fetchSaavnDirect(debouncedQuery, controller.signal)
      : Promise.resolve([]);

    Promise.all([saavnPromise, backendPromise])
      .then(([saavnResults, backendResults]) => {
        // Strip out any iTunes (30s Preview) from backend results
        const cleanBackend = backendResults.filter(r => !r.tag?.toLowerCase().includes('itunes'));

        // Combine: Saavn 320kbps full streams first, then YouTube tracks
        const combined = [];
        const seenIds = new Set();

        const addUnique = (item) => {
          const normTitle = (item.title || '').toLowerCase().trim();
          if (!seenIds.has(item.id) && !seenIds.has(normTitle)) {
            seenIds.add(item.id);
            seenIds.add(normTitle);
            combined.push(item);
          }
        };

        saavnResults.forEach(addUnique);
        cleanBackend.forEach(addUnique);

        setResults(combined);
        setHasMore(combined.length >= LIMIT);
        setIsLoading(false);
        addRecentSearch(debouncedQuery);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Search fetch failed:', err);
        setError('Failed to load search results.');
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, source, filterType, addRecentSearch]);

  // Load more items for infinite scroll
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !debouncedQuery) return;

    const nextOffset = offsetRef.current + LIMIT;
    offsetRef.current = nextOffset;
    setIsLoadingMore(true);

    const url = `${API_BASE}/api/search?q=${encodeURIComponent(debouncedQuery)}&source=${source}&type=${filterType}&limit=${LIMIT}&offset=${nextOffset}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const newItems = data.results || [];
        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setResults(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...uniqueNew];
          });
          setHasMore(newItems.length >= LIMIT);
        }
        setIsLoadingMore(false);
      })
      .catch(err => {
        console.error('Load more failed:', err);
        setIsLoadingMore(false);
      });
  }, [isLoadingMore, hasMore, debouncedQuery, source, filterType]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    source,
    setSource,
    filterType,
    setFilterType,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    loadMore
  };
}
