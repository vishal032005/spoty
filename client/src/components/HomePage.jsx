import React from 'react';

const FEATURED_MOODS = [
  { label: 'Good Morning 🌅', query: 'morning acoustic', color: '#e8a838' },
  { label: 'Lofi Focus 🎧', query: 'lofi chill beats study', color: '#1e3a5f' },
  { label: 'Workout 💪', query: 'workout motivation rock', color: '#c0392b' },
  { label: 'Bollywood Hits 🎵', query: 'bollywood hits 2024', color: '#8e44ad' },
  { label: 'Classic Rock 🎸', query: 'classic rock best', color: '#2c3e50' },
  { label: 'Jazz Night 🎷', query: 'smooth jazz night', color: '#1a6b4a' },
  { label: 'Pop Vibes ✨', query: 'top pop hits 2024', color: '#d35400' },
  { label: 'Peaceful Sleep 🌙', query: 'peaceful sleep ambient', color: '#2c3e50' },
];

export default function HomePage({ onSelectMood }) {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-greeting">Good to see you 👋</h1>
        <p className="home-subtext">Discover full-length tracks from YouTube, public archives &amp; previews — all free, no account needed.</p>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Choose your vibe</h2>
        <div className="mood-grid">
          {FEATURED_MOODS.map(mood => (
            <div
              key={mood.label}
              className="mood-card"
              style={{ background: `linear-gradient(135deg, ${mood.color}cc, ${mood.color}44)` }}
              onClick={() => onSelectMood(mood.query)}
            >
              <span className="mood-label">{mood.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">What's playing worldwide</h2>
        <div className="trending-chips">
          {['Taylor Swift', 'Arijit Singh', 'Ed Sheeran', 'Dua Lipa', 'A.R. Rahman', 'The Weeknd', 'BTS', 'Coldplay'].map(a => (
            <button key={a} className="trending-chip" onClick={() => onSelectMood(a)}>
              {a}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
