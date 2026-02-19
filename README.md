# 🎲 Dolanan Matematika

**Dolanan Matematika** (Math Play) is a collection of two-player math strategy board games designed for **elementary school kids (6–12 years old)**, built with vanilla HTML, CSS, and JavaScript. Two games are currently available:

- **Rumah Penjumlahan** (Addition House) — manipulate shared addition pions to control which cells you can claim.
- **Rumah Perkalian** (Multiplication House) — manipulate shared multiplication pions using products instead of sums.

Both games challenge players to align **4 consecutive pions** on a 10×10 board through strategic pion movement.

---

## Table of Contents

- [Features](#features)
- [Available Games](#available-games)
- [How to Play](#how-to-play)
  - [Home Screen](#home-screen)
  - [Game Setup](#game-setup)
  - [Coin Toss](#coin-toss)
  - [Initial Placement](#initial-placement)
  - [Gameplay Loop](#gameplay-loop)
  - [Winning the Game](#winning-the-game)
- [Game Mechanics](#game-mechanics)
  - [Rumah Penjumlahan (Addition)](#rumah-penjumlahan-addition)
  - [Rumah Perkalian (Multiplication)](#rumah-perkalian-multiplication)
  - [First Turn Special Rule](#first-turn-special-rule)
  - [Auto Game Over](#auto-game-over)
  - [Turn Timer](#turn-timer)
- [AI Opponent](#ai-opponent)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [License](#license)

---

## Features

- **Two Math Games**: Rumah Penjumlahan (Addition) and Rumah Perkalian (Multiplication)
- **Two Game Modes**: Local PvP (Player vs Player) or PvAI (Player vs AI)
- **Configurable Turn Timer**: Choose 15s, 30s, 60s, or unlimited time per turn
- **Coin Toss Mechanic**: Animated coin flip to fairly decide who places first
- **Strategic Depth**: Shared pion positions mean every move affects your opponent's options
- **AI Opponent with Levels**: Choose **Easy**, **Normal**, or **Hard** when playing vs AI
- **Smart Rematch Flow**: "Rematch" keeps the previous mode, timer, and AI difficulty for faster repeat games
- **Round Summary Card**: End-of-round overlay shows AI level (vs AI), move count, and round duration
- **Quick Exit from Coin Toss**: "Kembali ke Beranda" is available directly on coin toss screens
- **Mobile-Friendly**: Responsive layout with `100dvh` viewport fix, touch-optimized targets, and landscape support
- **Sound Effects**: Web Audio API-generated sounds for cell placement, coin toss, win celebration, timer warnings, and more — with mute toggle
- **Series Scoreboard**: Football-style scoreboard tracks wins across rounds (e.g., `Pemain 1 [2] – [1] AI`); persists through "Play Again", resets on menu/home navigation
- **Social Sharing**: Share game results to **X (Twitter)**, **Threads**, or copy to clipboard for **Instagram** — with score and winner in the share text
- **How to Play Guide**: In-app tutorial modal ("How to Play") with bilingual instructions (Indonesian and English, switchable via ID/EN toggle), plus a floating help button during gameplay
- **Accessibility**: ARIA live regions, grid roles, semantic HTML, and colorblind-friendly player symbols (● / ▲)
- **Player Name Persistence**: Names saved in `localStorage` across sessions
- **Leave-Game Protection**: Browser warning when navigating away mid-game
- **Dark Theme UI**: Modern, polished interface with smooth animations
- **SEO Optimized**: Target keywords ("Rumah Penjumlahan", "Rumah Perkalian") in title, meta description, and heading hierarchy; canonical URL, JSON-LD structured data (`WebApplication` schema), `<noscript>` fallback content for crawlers, `robots.txt`, and `sitemap.xml`
- **Social Sharing Meta**: Full Open Graph (with 1200×630 PNG image), Twitter Card meta tags, locale, and site name — previews render correctly on WhatsApp, Facebook, Twitter/X, LinkedIn, etc.
- **PWA-Ready**: Web app manifest with icons (192px, 512px, Apple Touch Icon), theme color, and standalone display mode
- **No Dependencies**: Pure HTML/CSS/JS — no frameworks or build tools required

---

## Available Games

| Game | Status | Description |
|------|--------|-------------|
| ➕ **Rumah Penjumlahan** | ✅ Available | Addition-based strategy board game |
| ✖️ **Rumah Perkalian** | ✅ Available | Multiplication-based strategy board game |

---

## How to Play

### Home Screen

Launch the app to see the **game selection hub**. Pick a game tile to begin — **Rumah Penjumlahan** (Addition House) or **Rumah Perkalian** (Multiplication House). Each game has its own setup, coin toss, placement, and game screens.

### Game Setup

1. Enter **Player 1's name** (Blue pion).
2. Choose a game mode:
   - **👥 PvP Lokal** — Two human players on the same device.
   - **🤖 vs AI** — Play against the computer.
3. If you choose **vs AI**, select the AI level:
  - **Easy** — more forgiving and less consistent.
  - **Normal** — balanced tactical AI.
  - **Hard** — stronger tactical AI with limited lookahead.
4. Select a **turn timer** (15s, 30s, 60s, or unlimited).
5. If PvP, enter **Player 2's name** (Red pion).
6. Click **"Mulai Permainan"** (Start Game).

After each round, use **"Rematch"** to start again with the same settings (mode, timer, and AI difficulty).

### Coin Toss

- Player 1 picks a side: **Kepala** (Head) or **Ekor** (Tail).
- An animated coin flip determines the winner.
- The coin toss winner gets to **place both pions** on the Addition Board and takes the **first turn**.

### Initial Placement

- The coin toss winner places **two pions** on the side board:
  - **Rumah Penjumlahan**: Addition Board (2×10 grid, values 1–10). Some columns may be disabled for the second pion if the sum would exceed 18.
  - **Rumah Perkalian**: Multiplication Board (2×9 grid, values 1–9). No column restrictions — all products are valid.
  - **First pion**: Can be placed on either Row 1 (Blue) or Row 2 (Red).
  - **Second pion**: Must be placed on the remaining row.
- After both pions are placed, click **"Konfirmasi Penempatan"** to begin.

### Gameplay Loop

Each turn consists of **two phases**:

1. **Move Pion** — The active player moves their pion to a **different column** on their row of the side board. The two pion values are combined (summed for Addition, multiplied for Multiplication).
2. **Place on Board** — The player claims an **unclaimed cell** on the 10×10 Game Board whose value matches the current result. Matching cells are highlighted in gold.

Play alternates between players after each complete turn.

### Winning the Game

The first player to get **4 of their pions in a row** on the 10×10 Game Board wins. Winning lines can be:

- ↔️ Horizontal
- ↕️ Vertical
- ↗️ Diagonal (either direction)

Winning cells glow green to celebrate the victory.

---

## Game Mechanics

### Rumah Penjumlahan (Addition)

| Board | Size | Description |
|-------|------|-------------|
| **Game Board** | 10×10 | Each cell has a random value between **2 and 18**. Players claim cells by matching the current sum. |
| **Addition Board** | 2×10 | Two rows of values **1–10**. Row 1 = Player 1 (Blue), Row 2 = Player 2 (Red). Each row has one pion. |

**Sum Calculation:**

```
Sum = (Player 1's pion value) + (Player 2's pion value)
```

- Pion values range from **1 to 10**, so possible sums are **2–20** (capped at 18 via disabled columns).
- A player **must move** to a different column. Columns where the sum would exceed 18 are **disabled**.

**Example:** Player 1's pion on column 5 + Player 2's pion on column 7 = sum **12**. Claim a cell with value 12.

### Rumah Perkalian (Multiplication)

| Board | Size | Description |
|-------|------|-------------|
| **Game Board** | 10×10 | Each cell has a random value from the set of **valid products** of two numbers 1–9 (36 unique values: 1, 2, 3, ..., 72, 81). |
| **Multiplication Board** | 2×9 | Two rows of values **1–9**. Row 1 = Player 1 (Blue), Row 2 = Player 2 (Red). Each row has one pion. |

**Product Calculation:**

```
Product = (Player 1's pion value) × (Player 2's pion value)
```

- Pion values range from **1 to 9**, so possible products are **1–81**.
- All products are valid — no columns are disabled by value range. Only the current position is disabled (must move).

**Example:** Player 1's pion on column 3 × Player 2's pion on column 7 = product **21**. Claim a cell with value 21.

**Valid Products (36 unique values):**
`1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 49, 54, 56, 63, 64, 72, 81`

### First Turn Special Rule

On the **very first turn** (belonging to the coin toss winner), the player may move **either** pion (Blue or Red) — not just their own. This adds an extra layer of strategy to the opening move. After the first turn, each player can only move their own pion. This rule applies to both games.

### Auto Game Over

A player **automatically loses** in the following situations:

1. **Time runs out** — If the turn timer expires, the current player loses immediately. No partial effort is counted.
2. **Dead-end move** — If the current result (sum or product) has no available (unclaimed) cells on the Game Board, and the player had an alternative pion position that would yield available cells → **Auto-lose** (the opponent wins).
3. **Draw** — If no valid pion position exists with available cells for the current player → the game ends in a **Draw**.

This prevents stalling tactics and deliberately choosing dead-end positions.

### Turn Timer

Each turn can be time-limited. Players select a timer duration before the game starts:

| Option | Description |
|--------|-------------|
| **15 detik** | 15 seconds per turn |
| **30 detik** | 30 seconds per turn (default) |
| **60 detik** | 60 seconds per turn |
| **∞ Tanpa Batas** | No time limit |

When the timer runs out, the current player **automatically loses** — no partial effort is counted. The opponent wins immediately.

---

## AI Opponent

The AI (always Player 2 / Red) now supports **three difficulty levels** in both games:

- **Easy**: uses lighter tactical weights and higher randomness so it makes more mistakes.
- **Normal**: uses strong heuristic evaluation (win/block/streak/center), similar to the previous AI behavior.
- **Hard**: uses the same tactical heuristic plus a **limited depth-2 lookahead** (candidate filtering + opponent best response check) to avoid obvious traps.

Core priorities remain the same across levels:

1. Take immediate wins.
2. Block immediate opponent wins.
3. Build own streaks and disrupt opponent streaks.
4. Prefer center control when tactical value is close.

For **initial placement** and the first board placement after coin toss, the same difficulty profile is applied so behavior stays consistent from opening to mid-game.

---

## Tech Stack

- **HTML5** — Semantic markup (`<main>`, ARIA attributes), single-page structure
- **CSS3** — Custom properties, CSS Grid, Flexbox, keyframe animations, `100dvh` viewport, responsive media queries (600px, 400px breakpoints + landscape)
- **Vanilla JavaScript** — ES6+ strict mode, IIFE module pattern, Web Audio API for sound effects, `localStorage` for persistence
- **Zero Dependencies** — No frameworks, no build tools, no external assets

---

## Project Structure

```
dolanan_matematika/
├── index.html             # Single-page HTML (all screens for both games)
├── favicon.svg            # SVG favicon (game board icon)
├── og-image.svg           # OG share image source (SVG)
├── og-image.png           # Social sharing preview image (1200×630)
├── apple-touch-icon.png   # Apple touch icon (180×180)
├── icon-192.png           # PWA icon (192×192)
├── icon-512.png           # PWA icon (512×512)
├── manifest.json          # PWA web app manifest
├── robots.txt             # Search engine crawler directives
├── sitemap.xml            # XML sitemap for search engines
├── css/
│   └── style.css          # All styles, animations, responsive design
├── js/
│   ├── sounds.js          # Sound effects engine (Web Audio API, SFX module)
│   ├── game.js            # Penjumlahan: core game logic (Game module)
│   ├── ai.js              # Penjumlahan: AI opponent (AI module)
│   ├── ui.js              # Penjumlahan: DOM & event handling (UI module)
│   ├── game-perkalian.js  # Perkalian: core game logic (GameMult module)
│   ├── ai-perkalian.js    # Perkalian: AI opponent (AIMult module)
│   └── ui-perkalian.js    # Perkalian: DOM & event handling (UIMult module)
├── README.md
├── ROADMAP.md
└── LICENSE
```

### Module Responsibilities

Each game has its own set of three modules that follow the same architecture:

| Module | Penjumlahan | Perkalian | Role |
|--------|------------|-----------|------|
| **Game Logic** | `Game` | `GameMult` | Board generation, move validation, win detection, turn management |
| **AI** | `AI` | `AIMult` | Heuristic move evaluation, initial placement strategy |
| **UI** | `UI` | `UIMult` | DOM rendering, screen transitions, event handling, timer |
| **Sound** | `SFX` (shared) | `SFX` (shared) | Web Audio API tone generation, mute toggle, localStorage persistence |

The games are fully independent — separate files, separate state, separate screens. The home screen, win/draw overlays, how-to-play modal, sound system, and floating buttons are shared. This architecture ensures changes to one game never break the other.

---

## Getting Started

No build step required. Just serve the files with any static HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

Alternatively, simply open `index.html` directly in a modern browser.

---

## License

This project is licensed under the [MIT License](LICENSE).
