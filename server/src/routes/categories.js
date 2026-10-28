const express = require('express');
const router = express.Router();

// Rich category cards with gradient backgrounds for the Browse All page
const CATEGORIES = [
  { id: 'pop', title: 'Pop', color: '#e13300', query: 'Top Pop Hits', icon: 'Sparkles' },
  { id: 'hiphop', title: 'Hip-Hop', color: '#ba5d07', query: 'Hip Hop', icon: 'Flame' },
  { id: 'rock', title: 'Rock Classics', color: '#e91429', query: 'Classic Rock', icon: 'Guitar' },
  { id: 'indie', title: 'Indie & Alt', color: '#608108', query: 'Indie Alternative', icon: 'Compass' },
  { id: 'chill', title: 'Chill & Lofi', color: '#477d95', query: 'Lofi Chill Beats', icon: 'Coffee' },
  { id: 'electronic', title: 'Electronic / Dance', color: '#d84000', query: 'EDM Electronic Dance', icon: 'Zap' },
  { id: 'jazz', title: 'Jazz & Soul', color: '#8d67ab', query: 'Smooth Jazz', icon: 'Music' },
  { id: 'classical', title: 'Classical', color: '#7358ff', query: 'Classical Symphony', icon: 'BookOpen' },
  { id: 'workout', title: 'Workout', color: '#777777', query: 'High Energy Workout', icon: 'Activity' },
  { id: 'focus', title: 'Deep Focus', color: '#503750', query: 'Focus Ambient Study', icon: 'Headphones' },
  { id: 'acoustic', title: 'Acoustic', color: '#1e3264', query: 'Acoustic Covers', icon: 'Radio' },
  { id: 'rnb', title: 'R&B', color: '#dc148c', query: 'Modern R&B', icon: 'Heart' }
];

router.get('/', (req, res) => {
  res.json({ categories: CATEGORIES });
});

module.exports = router;
