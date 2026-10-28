# Spoty — Keyless Legal Music Player & Search Engine

> **100% Free, Keyless, and Terms-Compliant Architecture**  
> *Zero API keys, zero proprietary code or private tokens, 100% legal public audio streams.*

---

## 📑 Table of Contents
1. [Overview & Philosophy](#overview--philosophy)
2. [Step A: REA UI Behavior Analysis (`xpui_extracted`)](#step-a-rea-ui-behavior-analysis)
3. [Step B: Keyless Legal Data Sources & Adapter Contract](#step-b-data-sources--adapter-layer)
4. [Step C: System Architecture & Implementation](#step-c-system-architecture)
5. [Keyboard Navigation & Shortcuts](#keyboard-navigation--shortcuts)
6. [Terms of Service, Licensing & Attribution](#terms-of-service--attribution)
7. [Getting Started & Running Tests](#getting-started--running-tests)

---

## 1. Overview & Philosophy

Spoty is built to deliver a modern music streaming and search experience **without requiring any API keys, user credentials, or subscription fees**. 

- **Clean-room Implementation**: Zero Spotify code, CSS, fonts, tokens, or private endpoints are used. All styling, components, and logic are original implementations written in standard Vanilla CSS, React, and Node.js.
- **100% Legal Keyless Streams**: Audio previews (30s official high-quality AAC/MP3 streams) and full Creative Commons/Public Domain recordings are streamed live in-memory via the HTML5 `<audio>` player element. Previews are never recorded, downloaded, or saved to local disk.
- **Resilient Multi-Source Adapter**: A unified backend adapter abstracts public sources (Apple iTunes Search API, Internet Archive, Deezer) behind a clean standard contract.

---

## 2. Step A: REA UI Behavior Analysis

Analysis was performed on the extracted UI bundle in `C:\spoty_work\xpui_extracted` (specifically targeting `xpui-routes-search.js`, `xpui-routes-recent-searches.js`, `xpui-pip-mini-player.js`, and `xpui-snapshot.css`). The observed UI interaction paradigms include:

### 1. Quick-Search & Dropdown Interaction
- **Debounced Input**: Typing triggers queries with a ~300ms debounce delay, cancelling prior in-flight requests.
- **Live Suggestion Dropdown**: Floating flyout below the search input presenting the top matching tracks.
- **Keyboard Traversal**: 
  - `ArrowDown` / `ArrowUp` to navigate suggestions.
  - `Enter` to immediately select and play the highlighted track.
  - `Escape` to close the suggestion dropdown.
- **Clear Action**: Instant clear button (`X`) resetting the query and returning focus to the search input.

### 2. `/search` Page Architecture
- **Empty Query State (Browse Mode)**:
  - *Recent Searches*: Removable chip pills showing prior search queries with an "X" button to delete or click to re-search.
  - *Browse All*: Responsive grid of colorful category cards (Pop, Rock, Hip-Hop, Indie, Chill, Jazz, Classical, etc.) with title and background angled iconography.
- **Active Query State (Results Mode)**:
  - *Category Filter Chips*: Sticky pill filters (`All`, `Songs`, `Artists`, `Albums`) for narrowed result inspection.
  - *Split Layout*:
    - **Top Result (Left)**: Prominent card with high-res cover artwork, track title, artist subtitle, entity badge (`SONG`), and a green circular play button that lifts on hover.
    - **Songs Tracklist (Right)**: Numbered list rows displaying index / hover play button, thumbnail, title, artist, source badge, like heart button, and track duration (`mm:ss`).
  - *Grid Layout*: Grid of remaining matches beneath the split view.
  - *Infinite Scroll*: An `IntersectionObserver` sentinel at the bottom of the list triggers paginated fetches (`limit` & `offset`) seamlessly.

### 3. Persistent Player Bar
- **Sticky Bottom 3-Column Layout**:
  - **Left Section**: Current track artwork thumbnail with subtle glow, track title, artist name, like heart button, and source tag pill.
  - **Center Section**: 
    - Upper control cluster: Shuffle toggle, Previous track, large circular Play/Pause master toggle, Next track, Repeat mode toggle (`off` -> `all` -> `one`).
    - Lower Scrubber: Current elapsed time `mm:ss`, interactive progress timeline with continuous seek response, and total duration `mm:ss`.
  - **Right Section**: Queue drawer toggle, Volume icon with click-to-mute and range slider, and an API terms/attribution button.

---

## 3. Step B: Data Sources & Adapter Layer

### API Evaluation Matrix (No-Key Verification)

| Source | Status | Auth Required? | Audio Type | Catalog / Quality |
|---|---|---|---|---|
| **YouTube (via Piped API)** | **Active & Recommended** | **None (100% Free)** | **Full Tracks** | Virtually complete global catalog (pop, rock, regional, Bollywood, live, remixes). Keyless open-source streaming. |
| **Apple iTunes Search API** | **Active & Keyless** | **None (100% Free)** | **30s Official Previews** | Mainstream global catalog; official AAC/MP3 previews; up to 600x600 high-res album artwork. |
| **Internet Archive (Archive.org)** | **Active & Keyless** | **None (100% Free)** | **Full Tracks** | Public domain, Creative Commons, live concerts, and independent recordings. |
| **Deezer Public API** | **Available as Adapter** | **None (Public Search)** | **30s Previews** | European & global music catalog (used as fallback or alternate source). |
| **LRCLIB API** | **Active (Lyrics)** | **None (100% Free)** | **Synced / Plain Lyrics** | 100,000+ track real-time synchronized karaoke lyrics with auto-scroll. |
| **Audius / MusicBrainz** | Evaluated | None / No audio | Metadata only | MusicBrainz has no native audio previews without 3rd-party CDNs; Audius nodes experience intermittent public gateway rate limits. |

### Adapter Response Contract
Every adapter maps upstream responses to the required standard contract:

```typescript
interface StandardItem {
  type: 'track' | 'artist' | 'album';
  title: string;       // Track title or collection name
  image: string;       // High-res album or artist artwork URL
  subtitle: string;    // Artist or creator name
  id: string;          // Unique source-prefixed identifier
  tag: string;         // Attribution label (e.g., 'iTunes (30s Preview)')
  previewUrl: string;  // Streamable audio URL for HTML5 <audio> element
}
```

---

## 4. Step C: System Architecture

```
Spoty/
├── package.json                 # Project orchestration
├── server/                      # Node.js + Express Backend
│   ├── package.json
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── baseAdapter.js   # BaseAdapter interface & contract validator
│   │   │   ├── itunesAdapter.js # Apple iTunes keyless search adapter
│   │   │   ├── archiveAdapter.js# Internet Archive audio adapter
│   │   │   ├── deezerAdapter.js # Deezer public search adapter
│   │   │   └── index.js         # Unified AdapterService with multi-source fallback
│   │   ├── middleware/
│   │   │   └── rateLimiter.js   # 120 req/min rate limiter per IP
│   │   ├── routes/
│   │   │   ├── search.js        # /api/search with caching & /api/sources
│   │   │   └── categories.js    # /api/categories for Browse All view
│   │   ├── utils/
│   │   │   └── cache.js         # In-memory LRU & TTL (5-min) cache
│   │   ├── app.js               # Express application config
│   │   └── index.js             # Server entry point (port 5000)
│   └── tests/                   # Automated Node test runner suite
│       ├── adapter.test.js      # Contract enforcement & iTunes tests
│       ├── api.test.js          # Express endpoints & cache integration tests
│       └── cache.test.js        # LRU & TTL cache eviction tests
└── client/                      # React + Vite Frontend
    ├── package.json
    ├── vite.config.js           # Proxy config (/api -> http://localhost:5000)
    └── src/
        ├── context/
        │   └── AudioContext.jsx # HTML5 <audio> engine, playlist queue & shortcuts
        ├── hooks/
        │   └── useSearch.js     # Debounce (280ms) + AbortController + infinite scroll
        ├── components/
        │   ├── Header.jsx       # Search input, keyboard nav & source picker
        │   ├── QuickSearchDropdown.jsx # Live keyboard-navigable autocomplete flyout
        │   ├── SearchPage.jsx   # Browse view, filter chips, Top Result & tracklist
        │   ├── PlayerBar.jsx    # Persistent desktop audio player with scrubber
        │   ├── QueueDrawer.jsx  # Slide-out playlist queue drawer
        │   ├── Sidebar.jsx      # Navigation links and quick vibe shortcuts
        │   └── AttributionModal.jsx # Terms, licensing and clean-room modal
        ├── index.css            # Complete custom dark theme design system
        └── App.jsx
```

---

## 5. Keyboard Navigation & Shortcuts

| Key | Context | Action |
|---|---|---|
| <kbd>Space</kbd> | Global (outside inputs) | Toggle **Play / Pause** |
| <kbd>Shift</kbd> + <kbd>→</kbd> | Global | Seek forward 5 seconds |
| <kbd>Shift</kbd> + <kbd>←</kbd> | Global | Seek backward 5 seconds |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Search bar focused | Navigate down/up through Quick Suggestions |
| <kbd>Enter</kbd> | Search bar focused | Play selected suggestion or confirm search |
| <kbd>Esc</kbd> | Global / Search bar | Dismiss Quick Suggestions dropdown or close modals |

---

## 6. Terms of Service & Attribution

- **Apple iTunes Search API Terms**: Audio previews are strictly streamed live in-browser for non-commercial previewing purposes. Audio streams are never persisted or cached to disk.
- **Internet Archive Audio**: Distributed in compliance with Creative Commons and Public Domain licenses according to each item's rights statements.
- **Clean Room Policy**: This software contains zero proprietary code, CSS stylesheets, tokens, or reverse-engineered binaries from Spotify.

---

## 7. Getting Started & Running Tests

### Prerequisites
- Node.js >= 18 (Tested on Node v24.14.1)
- npm >= 9

### 1. Install Dependencies
```bash
# Install root, backend and frontend dependencies
npm --prefix server install
npm --prefix client install
```

### 2. Run Backend Tests
Run the comprehensive test suite covering adapters, standard contracts, caching, rate limits, and API routes:
```bash
npm run test
```
*Output: 10/10 tests pass.*

### 3. Start the Development Servers
In two separate terminals (or concurrently):

**Terminal 1 (Backend API):**
```bash
npm run server
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend React App):**
```bash
npm run client
# Client dev server starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start exploring and streaming music!
