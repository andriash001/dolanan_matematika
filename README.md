# � Dolanan Matematika

**Dolanan Matematika** (Math Play) is a two-player strategy board game built with vanilla HTML, CSS, and JavaScript. Players compete to be the first to align **4 consecutive pions** on a 10×10 board by strategically manipulating shared addition pions to control which cells they can claim.

---

## Table of Contents

- [Features](#features)
- [How to Play](#how-to-play)
  - [Game Setup](#game-setup)
  - [Coin Toss](#coin-toss)
  - [Initial Placement](#initial-placement)
  - [Gameplay Loop](#gameplay-loop)
  - [Winning the Game](#winning-the-game)
- [Game Mechanics](#game-mechanics)
  - [The Boards](#the-boards)
  - [Sum Calculation](#sum-calculation)
  - [Pion Movement Rules](#pion-movement-rules)
  - [First Turn Special Rule](#first-turn-special-rule)
  - [Turn Skipping](#turn-skipping)
- [AI Opponent](#ai-opponent)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [License](#license)

---

## Features

- **Two Game Modes**: Local PvP (Player vs Player) or PvAI (Player vs AI)
- **Coin Toss Mechanic**: Animated coin flip to fairly decide who places first
- **Strategic Depth**: Shared pion positions mean every move affects your opponent's options
- **AI Opponent**: Heuristic-based AI that evaluates streaks, blocks threats, and prefers center control
- **Responsive Design**: Plays well on desktop and mobile screens
- **Dark Theme UI**: Modern, polished interface with smooth animations
- **No Dependencies**: Pure HTML/CSS/JS — no frameworks or build tools required

---

## How to Play

### Game Setup

1. Enter **Player 1's name** (Blue pion).
2. Choose a game mode:
   - **👥 PvP Lokal** — Two human players on the same device.
   - **🤖 vs AI** — Play against the computer.
3. If PvP, enter **Player 2's name** (Red pion).
4. Click **"Mulai Permainan"** (Start Game).

### Coin Toss

- Player 1 picks a side: **Head** or **Tail**.
- An animated coin flip determines the winner.
- The coin toss winner gets to **place both pions** on the Addition Board and takes the **first turn**.

### Initial Placement

- The coin toss winner places **two pions** on the **Addition Board** (2×10 grid):
  - **First pion**: Can be placed on either Row 1 (Blue) or Row 2 (Red), at any column (values 1–10).
  - **Second pion**: Must be placed on the remaining row. Some columns may be disabled if their sum with the first pion would exceed 18.
- After both pions are placed, click **"Konfirmasi Penempatan"** to begin.

### Gameplay Loop

Each turn consists of **two phases**:

1. **Move Pion** — The active player moves their pion to a **different column** on their row of the Addition Board. The two pion values are summed together.
2. **Place on Board** — The player claims an **unclaimed cell** on the 10×10 Game Board whose value matches the current sum. Matching cells are highlighted in gold.

Play alternates between players after each complete turn.

### Winning the Game

The first player to get **4 of their pions in a row** on the 10×10 Game Board wins. Winning lines can be:

- ↔️ Horizontal
- ↕️ Vertical
- ↗️ Diagonal (either direction)

Winning cells glow green to celebrate the victory.

---

## Game Mechanics

### The Boards

| Board | Size | Description |
|-------|------|-------------|
| **Game Board** | 10×10 | Each cell has a random value between **2 and 18**. Players claim cells by matching the current sum. |
| **Addition Board** | 2×10 | Two rows of values **1–10**. Row 1 belongs to Player 1 (Blue), Row 2 belongs to Player 2 (Red). Each row has exactly one pion. |

### Sum Calculation

```
Sum = (Player 1's pion column value) + (Player 2's pion column value)
```

- Pion column values range from **1 to 10**.
- Therefore, possible sums range from **2 to 18** (but constrained to max 18 during play).

For example, if Player 1's pion is on column 5 (value 5) and Player 2's pion is on column 7 (value 7), the sum is **12**. The active player must then claim a cell with value 12 on the Game Board.

### Pion Movement Rules

- A player **must move** their pion to a **different column** — staying in place is not allowed.
- A player can only move columns where the resulting sum does **not exceed 18**.
- Columns that would cause an invalid sum are visually **disabled** (greyed out).

### First Turn Special Rule

On the **very first turn** (belonging to the coin toss winner), the player may move **either** pion (Blue or Red) — not just their own. This adds an extra layer of strategy to the opening move. After the first turn, each player can only move their own pion.

### Turn Skipping

If the current sum has **no available (unclaimed) cells** on the Game Board, the turn is automatically **skipped** with a notification overlay. Play passes to the next player.

---

## AI Opponent

The AI (always Player 2 / Red) uses a **heuristic evaluation** strategy:

| Priority | Strategy | Score Weight |
|----------|----------|-------------|
| 1 | **Winning move** — If placing completes 4 in a row | 100,000 |
| 2 | **Block opponent win** — Prevent opponent from completing 4 | 50,000 |
| 3 | **Block opponent 3-streak** — Disrupt opponent building toward 4 | 8,000 |
| 4 | **Extend own 3-streak** — Build toward a win | 5,000 |
| 5 | **Extend own 2-streak** | 500 |
| 6 | **Block opponent 2-streak** | 300 |
| 7 | **Center preference** — Cells closer to the center offer more connection possibilities | Variable |
| 8 | **Random factor** — Small randomness to avoid predictability | 0–10 |

The AI evaluates **every possible pion position** (all 9 alternative columns) and every available cell for each resulting sum, then picks the highest-scoring move.

For **initial placement**, the AI prefers central columns (values 5–6) for maximum flexibility, with slight randomness.

---

## Tech Stack

- **HTML5** — Semantic markup, single-page structure
- **CSS3** — Custom properties, CSS Grid, Flexbox, keyframe animations
- **Vanilla JavaScript** — ES6+ module pattern (IIFE), no dependencies

---

## Project Structure

```
dolanan_matematika/
├── index.html          # Single-page HTML (all screens)
├── css/
│   └── style.css       # All styles, animations, responsive design
├── js/
│   ├── game.js         # Core game logic (state, rules, win detection)
│   ├── ai.js           # AI opponent (heuristic move evaluation)
│   └── ui.js           # DOM manipulation, event handling, screen flow
├── README.md
└── LICENSE
```

### Module Responsibilities

- **`Game`** — Manages all game state: board generation, coin toss, pion placement, move validation, sum calculation, win checking, and turn advancement. Exposes a public API consumed by UI and AI.
- **`AI`** — Evaluates all possible moves for the AI player using streak counting, threat detection, and positional scoring. Returns the optimal pion position and board cell.
- **`UI`** — Handles all DOM rendering, screen transitions, event listeners, animation triggers, and coordinates between Game and AI modules. Uses event delegation for efficient click handling.

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
