import React, { useState, useEffect, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { API_BASE } from '../config';

export default function LyricsPanel({ isOpen, onClose }) {
  const { currentTrack, currentTime } = useAudio();
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const lyricsRef = useRef(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) { setLyrics(null); return; }
    setLoading(true);
    setLyrics(null);
    const { title, subtitle: artist, duration } = currentTrack;
    fetch(`${API_BASE}/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&duration=${Math.round(duration || 0)}`)
      .then(r => r.json())
      .then(data => { setLyrics(data.lyrics); setLoading(false); })
      .catch(() => { setLyrics(null); setLoading(false); });
  }, [currentTrack?.id]);

  // Parse synced lyrics "[mm:ss.xx] text"
  const parsedLines = React.useMemo(() => {
    if (!lyrics?.synced) return null;
    return lyrics.synced.split('\n').map(line => {
      const match = line.match(/^\[(\d+):(\d+\.\d+)\]\s*(.*)/);
      if (!match) return null;
      const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
      return { time, text: match[3] };
    }).filter(Boolean);
  }, [lyrics]);

  // Highlight current line based on playback position
  useEffect(() => {
    if (!parsedLines) return;
    let idx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      if (parsedLines[i].time <= currentTime) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [currentTime, parsedLines]);

  // Scroll active line into view smoothly
  useEffect(() => {
    if (activeLine < 0 || !lyricsRef.current) return;
    const el = lyricsRef.current.querySelector(`[data-idx="${activeLine}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  return (
    <div className={`lyrics-panel ${isOpen ? 'open' : ''}`}>
      <div className="lyrics-panel-header">
        <div>
          <h3 className="lyrics-panel-title">Lyrics</h3>
          {currentTrack && (
            <p className="lyrics-panel-track">
              {currentTrack.title} &mdash; {currentTrack.subtitle}
            </p>
          )}
        </div>
        <button className="lyrics-close-btn" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="lyrics-content" ref={lyricsRef}>
        {!currentTrack && (
          <div className="lyrics-placeholder">
            <Music size={48} />
            <p>Play a song to see lyrics</p>
          </div>
        )}
        {currentTrack && loading && (
          <div className="lyrics-loading">
            <div className="pulsing-loader"></div>
            <p>Fetching lyrics...</p>
          </div>
        )}
        {currentTrack && !loading && !lyrics && (
          <div className="lyrics-placeholder">
            <Music size={48} />
            <p>No lyrics found for this track</p>
          </div>
        )}
        {parsedLines && (
          <div className="synced-lyrics">
            {parsedLines.map((line, i) => (
              <p
                key={i}
                data-idx={i}
                className={`lyric-line ${i === activeLine ? 'active-lyric' : ''}`}
              >
                {line.text || '\u00A0'}
              </p>
            ))}
          </div>
        )}
        {!parsedLines && lyrics?.plain && (
          <div className="plain-lyrics">
            {lyrics.plain.split('\n').map((line, i) => (
              <p key={i} className="lyric-line">{line || '\u00A0'}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
