# Dolanan Matematika — Implementation Roadmap

> **Vision**: Build a chess.com-like platform for competitive math strategy games,
> where players can register, play online, compete in tournaments, spectate matches,
> and improve their skills — all while learning math.

**Last updated**: February 2026

**Feature intake**: New feature requests are logged in [GitHub Issues](https://github.com/andriash001/dolanan_matematika/issues) and promoted into this roadmap after triage.

---

## Recommended Tech Stack

| Layer              | Technology                    | Rationale                                                     |
| ------------------ | ----------------------------- | ------------------------------------------------------------- |
| **Frontend**       | Nuxt 3 (Vue 3 + TypeScript)  | SSR/SSG, file-based routing, composables, great DX            |
| **Styling**        | Tailwind CSS + Headless UI    | Utility-first, consistent design system, accessible           |
| **Real-time**      | Socket.IO                     | Reliable WebSocket with fallback, rooms, namespaces           |
| **Backend/API**    | Node.js + Nitro (Nuxt server) | JS everywhere, built into Nuxt 3, API routes out of the box   |
| **Database**       | PostgreSQL                    | Relational, robust, great for user/game/rating data           |
| **ORM**            | Prisma                        | Type-safe, migrations, schema-first, great DX                |
| **Cache/Pub-Sub**  | Redis                         | Session store, matchmaking queue, real-time pub/sub, leaderboards |
| **Auth**           | Nuxt Auth (OAuth + email)     | Google/GitHub social login + email/password                   |
| **File Storage**   | S3-compatible (Cloudflare R2) | Avatars, game replays                                         |
| **Hosting**        | VPS (Railway / Fly.io)        | Affordable, WebSocket-friendly, easy deployment               |
| **CI/CD**          | GitHub Actions                | Automated testing, linting, deployment                        |
| **Monitoring**     | Sentry + Plausible Analytics  | Error tracking + privacy-friendly analytics                   |

---

## Phase 0: Pre-Migration Prep (Month 1–2)

> Get the house in order before the big move.

### 0.1 — Project Setup
- Initialize monorepo (pnpm workspaces): `apps/web` (Nuxt), `apps/server` (game server), `packages/shared` (game logic, types)
- Set up TypeScript, ESLint, Prettier across all packages
- Configure GitHub Actions for CI (lint, type-check, test)
- Set up development environment docs (CONTRIBUTING.md)

### 0.2 — Extract & Formalize Game Logic
- Extract pure game logic from `js/game.js` and `js/game-perkalian.js` into `packages/shared`
- Convert to TypeScript with strict types (`Board`, `Pion`, `Player`, `GameState`, `Move`)
- Write comprehensive unit tests (Vitest) for game rules, win detection, draw detection, auto-lose
- Make game logic isomorphic (runs on client AND server — critical for cheat prevention)

### 0.3 — Extract & Improve AI
- Extract AI from `js/ai.js` and `js/ai-perkalian.js` into `packages/shared`
- ✅ Add difficulty levels (Easy / Normal / Hard). Current Hard uses heuristic + limited depth-2 lookahead.
- Future upgrade: replace Hard lookahead with deeper minimax + alpha-beta pruning after shared engine extraction.
- Unit test all AI difficulty levels

**Deliverables**: Clean monorepo, typed game engine, tested AI, CI pipeline

---

## Phase 1: Platform Foundation (Month 3–6)

> Rebuild the frontend in Nuxt 3, add auth, user profiles, and local play.

### 1.1 — Nuxt 3 App Scaffold
- Set up Nuxt 3 with TypeScript, Tailwind CSS, Pinia (state management)
- Recreate the home screen, game selection, and setup screens as Vue components
- Implement responsive layout and dark/light theme toggle
- Port sound system (`js/sounds.js`) to a Vue composable (`useSoundEffects`)

### 1.2 — Game UI Components
- Build reusable game board component (`GameBoard.vue`) with props for size, operation, state
- Build pion selector component (`PionSelector.vue`)
- Build coin toss animation component (`CoinToss.vue`)
- Build timer component (`TurnTimer.vue`)
- Build game overlay/modal system (win, draw, lose, rematch)
- Ensure feature parity with current vanilla JS version

### 1.3 — Local Play (Offline-First)
- PvP on same device — identical to current functionality
- PvAI with selectable difficulty (Easy / Normal / Hard)
- Store game preferences in localStorage (backward compatible)
- This is the "fallback" mode — always works without internet

### 1.4 — Authentication System
- Set up PostgreSQL database with Prisma schema
- User model: `id`, `username`, `email`, `passwordHash`, `avatar`, `rating`, `createdAt`, `lastSeen`
- Implement auth flows: register (email+password), login, logout, password reset
- Social login: Google OAuth, GitHub OAuth
- Guest play (no account required, limited features)
- JWT tokens + HTTP-only refresh cookies

### 1.5 — User Profiles
- Profile page: `/player/{username}`
- Display: avatar, username, join date, rating, games played, win/loss/draw stats
- Edit profile: change username, upload avatar, update email
- Profile visibility settings (public/private)

### 1.6 — Basic Navigation & Pages
- Landing page with hero, feature highlights, CTA to play
- Game lobby page (placeholder for Phase 2)
- Settings page (theme, sound, language)
- About/rules page (port existing "Cara Bermain" modal)
- Footer with links, version, social

**Deliverables**: Fully functional Nuxt 3 app with auth, profiles, and local play at feature parity

---

## Phase 2: Online Multiplayer (Month 7–12)

> The core chess.com experience — play against anyone, anywhere.

### 2.1 — Real-Time Game Server
- Set up Socket.IO server in `apps/server`
- Define game protocol events:
  - `game:create`, `game:join`, `game:move`, `game:state`, `game:end`
  - `game:rematch-request`, `game:rematch-accept`
  - `game:resign`, `game:timeout`
- Server-authoritative game state (server runs game logic from `packages/shared`)
- Server-side move validation (anti-cheat)
- Reconnection handling (player disconnects mid-game → grace period → auto-forfeit)

### 2.2 — Matchmaking System
- Quick Play: click "Play Online" → queued by rating range → auto-matched
- Redis-backed matchmaking queue with rating brackets
- Estimated wait time display
- Cancel matchmaking
- Game mode selection: Addition / Multiplication, timer preset

### 2.3 — Game Rooms & Direct Challenge
- Create private room with shareable link/code
- Challenge a specific player by username
- Accept/decline challenge UI with notification
- Room settings: game type, timer, rated/unrated

### 2.4 — Live Game UI
- Real-time board sync via Socket.IO
- Opponent's move animated on your screen
- Connection status indicator (🟢 connected, 🟡 reconnecting, 🔴 disconnected)
- In-game chat (text, with report/mute)
- Emoji reactions (like chess.com's "Good move!", "Oops!")
- Sound effects for opponent's move, your turn notification

### 2.5 — Rating System (ELO)
- Implement Glicko-2 rating system (better than basic ELO for infrequent players)
- Separate ratings per game type (Addition rating, Multiplication rating)
- Rating displayed on profile, in-game, leaderboard
- Provisional rating period (first 20 games)
- Rating change shown after each game (+15, -12, etc.)

### 2.6 — Game History
- Store completed games in database: moves, timestamps, result, players, ratings
- Game history page: `/player/{username}/games`
- Game replay viewer: step through moves with forward/backward controls
- Share game link: `/game/{id}`
- Download game record (JSON/custom notation)

**Deliverables**: Full online multiplayer with matchmaking, ELO, game history, and replay

---

## Phase 3: Social & Competitive (Month 13–18)

> Build community — friends, leaderboards, tournaments, spectating.

### 3.1 — Friends System
- Send/accept/decline friend requests
- Friends list with online status (online / in-game / offline)
- Quick-challenge friends from friends list
- Activity feed: "FriendX just won a game", "FriendY achieved a new rating"

### 3.2 — Leaderboards
- Global leaderboard by rating (per game type)
- Weekly/monthly/all-time tabs
- Top 100 players page
- Player ranking badge on profile (#1, Top 10, Top 100, Top 1%)
- Redis sorted sets for fast leaderboard queries

### 3.3 — Spectating (Live Watch)
- Browse live games: list of ongoing matches with player names, ratings, turn count
- Click to spectate: read-only view of the game board, real-time updates
- Spectator count displayed to players ("5 people watching")
- Featured games: high-rated matches auto-promoted
- Spectator chat (separate from player chat)

### 3.4 — Tournament System
- **Organizer role**: verified users can create tournaments
- Tournament formats: Single elimination, Double elimination, Swiss, Round-robin
- Tournament creation: name, description, format, max players, start time, game type, timer
- Registration: open/invite-only, registration deadline
- Tournament lobby with bracket visualization
- Automated pairing and advancement
- Tournament results page with final standings
- Tournament history

### 3.5 — Notification System
- In-app notifications (bell icon with badge)
- Types: challenge received, friend request, tournament starting, your turn (correspondence)
- Optional email notifications (digest)
- Optional browser push notifications
- Notification preferences page

### 3.6 — Club/Community System
- Create/join clubs (like chess.com clubs)
- Club page: members, club matches, chat, leaderboard
- Club vs Club challenges
- Club admin tools (invite, kick, roles)

**Deliverables**: Full social platform with friends, leaderboards, tournaments, spectating, clubs

---

## Phase 4: Content & Engagement (Month 19–24)

> Keep players coming back — puzzles, lessons, achievements, new game modes.

### 4.1 — Daily Puzzles
- "Puzzle of the Day": given a board state, find the winning move
- Puzzle rating (separate from game rating)
- Puzzle streak (consecutive days solved)
- User-submitted puzzles (from interesting game positions)
- Puzzle archive

### 4.2 — Achievements & Badges
- Achievement system: "Win 10 games", "5-game win streak", "Beat Hard AI", "Play 100 games"
- Badges displayed on profile
- Progress tracking
- Seasonal achievements (monthly challenges)

### 4.3 — New Game Modes
- **Subtraction House** (Rumah Pengurangan): extend the math game family
- **Division House** (Rumah Pembagian): complete the four operations
- **Blitz Mode**: 5-second turns, fast-paced
- **Zen Mode**: no timer, relaxed, unrated
- **Custom boards**: different board sizes (6×6, 8×8, 12×12), different win lengths (3, 4, 5)

### 4.4 — Learning Center
- Interactive tutorials for each game type
- Strategy guides (opening theory, common patterns, endgame tactics)
- Video content (embedded YouTube)
- Skill assessment quiz
- Curriculum alignment info for teachers/parents

### 4.5 — Internationalization (i18n)
- Extract all strings for translation
- Support: Indonesian (primary), English, Javanese
- Language picker in settings
- RTL support architecture (for future Arabic, etc.)

### 4.6 — Progressive Web App (PWA)
- Service worker for offline play (local + vs AI)
- App manifest for "Add to Home Screen"
- Push notifications via service worker
- Background sync for game moves (correspondence mode)

**Deliverables**: Rich content ecosystem, new game modes, PWA, multi-language support

---

## Phase 5: Monetization & Scale (Month 25–36)

> Sustainable revenue to fund development and hosting.

### 5.1 — Premium Subscription ("Dolanan Plus")
- **Free tier**: play online, basic profile, limited game history (last 10 games)
- **Premium tier** (monthly/yearly):
  - Unlimited game history & replay
  - Advanced game analysis (AI evaluation of each move)
  - Unlimited puzzles (free: 1 per day)
  - Custom avatar frames & board themes
  - No ads
  - Priority matchmaking
  - Tournament creation (free users can only join)
  - Detailed statistics & charts

### 5.2 — Cosmetic Shop
- Board themes (nature, space, batik, pixel art)
- Pion skins (different shapes, colors, animations)
- Profile frames and banners
- Victory animations
- Sound packs

### 5.3 — Payment Integration
- Stripe for subscription billing
- Regional pricing (important for Indonesian market)
- Gift subscriptions
- Promo codes and referral program

### 5.4 — Scaling Infrastructure
- Horizontal scaling: multiple game server instances behind load balancer
- Redis Cluster for distributed state
- PostgreSQL read replicas
- CDN for static assets (Cloudflare)
- Database archival strategy for old games
- Rate limiting and DDoS protection

### 5.5 — Admin Dashboard
- User management (ban, warn, role assignment)
- Game moderation (reported games review)
- Analytics dashboard (DAU, MAU, games/day, revenue)
- Tournament management
- Content management (puzzles, lessons)
- System health monitoring

---

## Phase 6: Mobile Apps — Android & iOS (Month 37–48)

> Bring Dolanan Matematika to every pocket — native mobile experience on Android and iOS.

### 6.1 — Technology Decision & Setup
- **Recommended approach**: Capacitor (wraps the existing Nuxt 3 web app as a native shell)
  - Maximizes code reuse (~90% shared with web)
  - Native plugin access (push notifications, haptics, in-app purchase)
  - Single codebase for Android + iOS
- **Alternative** (if native feel is critical): Flutter or React Native rebuild
  - Higher effort but smoother animations, better platform conventions
  - Reuse `packages/shared` game logic via wasm/JS bridge
- Set up mobile development environment (Xcode, Android Studio)
- Configure Capacitor project with Nuxt 3 output

### 6.2 — Android App (Month 37–40)
- Build and test Capacitor Android shell
- Native splash screen and app icon (adaptive icons)
- Deep linking support (`dolanan.id/game/{id}` → opens app)
- Push notifications via Firebase Cloud Messaging (FCM)
- Haptic feedback on move placement, win, timer tick
- Handle back button navigation (Android-specific)
- Offline mode: local play + vs AI works without internet
- Performance optimization for low-end Android devices
- Internal testing track on Google Play Console
- Open beta testing
- **Google Play Store listing** (title, description, screenshots, ASO)
- Target: Android 8.0+ (API 26+)

### 6.3 — iOS App (Month 40–43)
- Build and test Capacitor iOS shell
- Native splash screen and app icon (all required sizes)
- Deep linking / Universal Links
- Push notifications via APNs
- Haptic feedback (Taptic Engine integration)
- Handle iOS Safe Area (notch, Dynamic Island, home indicator)
- Offline mode: local play + vs AI
- TestFlight beta testing
- **App Store listing** (title, description, screenshots, App Preview video, ASO)
- App Store Review compliance (guidelines 4.2, 3.1.1 for in-app purchases)
- Target: iOS 15.0+

### 6.4 — Mobile-Specific Features
- In-app purchase integration (StoreKit for iOS, Google Play Billing for Android)
  - "Dolanan Plus" subscription via native IAP
  - Cosmetic purchases
- Biometric login (Face ID / Touch ID / fingerprint)
- Share game results to WhatsApp, Instagram Stories, etc. (native share sheet)
- Widget support: daily puzzle widget (iOS 16+ / Android 12+)
- Background game notifications ("It's your turn!" for correspondence mode)
- Adaptive layout for tablets (iPad, Android tablets)
- Dark/light mode synced with system preference

### 6.5 — App Store Optimization & Launch
- Localized store listings (Indonesian, English)
- Screenshot sets for all device sizes
- App Preview / promo video
- Rating prompt (in-app review API) after 5th game
- Respond to user reviews
- Track install/uninstall metrics, crash reports (Firebase Crashlytics)
- A/B test store listing assets

### 6.6 — Post-Launch Mobile Iteration
- Monitor crash-free rate (target: >99.5%)
- Weekly OTA updates via Capacitor Live Update (skip store review for web layer changes)
- Collect mobile-specific feedback (touch targets, gestures, performance)
- Add platform-specific enhancements based on user feedback
- Consider Wear OS / watchOS companion (daily puzzle notification + quick answer)

**Deliverables**: Published Android (Google Play) and iOS (App Store) apps with native features, IAP, push notifications, and offline support

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│                   Client                      │
│  Nuxt 3 (Vue 3 + TypeScript + Tailwind)      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Game UI  │ │ Lobby/   │ │ Profile/     │  │
│  │Components│ │ Match UI │ │ Social UI    │  │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │ Socket.IO   │  REST/tRPC   │          │
└───────┼─────────────┼──────────────┼──────────┘
        │             │              │
┌───────▼─────────────▼──────────────▼──────────┐
│                 Server Layer                   │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Game Server  │  │ API Server           │   │
│  │ (Socket.IO)  │  │ (Nitro/Express)      │   │
│  │ • Rooms      │  │ • Auth endpoints     │   │
│  │ • Game logic │  │ • User CRUD          │   │
│  │ • Matchmaking│  │ • Game history       │   │
│  │ • Spectating │  │ • Tournaments        │   │
│  └──────┬───────┘  └──────────┬───────────┘   │
│         │                     │                │
│  ┌──────▼─────────────────────▼───────────┐   │
│  │         packages/shared                │   │
│  │  • Game logic  • Types  • Validation   │   │
│  └────────────────────────────────────────┘   │
└───────┬───────────────────────┬───────────────┘
        │                       │
┌───────▼───────┐  ┌────────────▼───────────────┐
│    Redis      │  │     PostgreSQL              │
│ • Sessions    │  │ • Users     • Games         │
│ • Match queue │  │ • Ratings   • Tournaments   │
│ • Leaderboard │  │ • Friends   • Puzzles       │
│ • Pub/Sub     │  │ • Clubs     • Achievements  │
└───────────────┘  └────────────────────────────┘
```

---

## Database Schema (Key Tables)

| Table                | Key Fields                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| `users`              | id, username, email, password_hash, avatar_url, is_premium, created_at     |
| `ratings`            | user_id, game_type, rating, deviation, volatility, games_played            |
| `games`              | id, type, player1_id, player2_id, winner_id, result, moves (JSONB), rated  |
| `friendships`        | user_id, friend_id, status (pending/accepted/blocked)                      |
| `tournaments`        | id, organizer_id, name, format, status, max_players, starts_at             |
| `tournament_players` | tournament_id, user_id, seed, final_rank                                   |
| `clubs`              | id, name, description, owner_id, created_at                               |
| `achievements`       | id, key, name, description, icon, criteria                                |
| `user_achievements`  | user_id, achievement_id, unlocked_at                                       |
| `puzzles`            | id, board_state (JSONB), solution (JSONB), rating, game_type              |
| `notifications`      | id, user_id, type, data (JSONB), read, created_at                         |

---

## Key Principles

1. **Server-authoritative**: All game logic runs on the server. Client is a view layer. Prevents cheating.
2. **Offline-first**: Local play always works without internet. Online features degrade gracefully.
3. **Isomorphic game engine**: Same TypeScript code validates moves on server and provides instant client feedback.
4. **Incremental delivery**: Each phase is independently deployable and valuable.
5. **Accessibility**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation, colorblind-friendly.
6. **Mobile-first**: Design for phones first, enhance for desktop.
7. **Indonesian-first**: Primary language is Indonesian/Javanese. English is secondary.

---

## Risk & Mitigation

| Risk                              | Impact | Mitigation                                                |
| --------------------------------- | ------ | --------------------------------------------------------- |
| Solo dev burnout                  | High   | Phase 0-1 is the MVP; each phase is independently useful  |
| Low initial player base           | High   | AI opponents always available; target school communities   |
| WebSocket scaling                 | Medium | Redis pub/sub for horizontal scaling from Phase 2         |
| Cheating (modified client)        | Medium | Server-authoritative game state from day 1                |
| Scope creep                       | High   | Strict phase boundaries; features only added in next phase|
| Hosting costs                     | Low    | Start on free/cheap tiers; scale with revenue             |

---

## Success Metrics (per Phase)

| Phase | Key Metric                          | Target         |
| ----- | ----------------------------------- | -------------- |
| 1     | Feature parity + auth working       | 100% parity    |
| 2     | Online games played per week        | 50+            |
| 3     | Registered users                    | 500+           |
| 3     | Tournament participation            | 10+ per event  |
| 4     | Daily active users                  | 100+           |
| 5     | Premium conversion rate             | 3-5%           |
| 6     | Android app published on Play Store | Live           |
| 6     | iOS app published on App Store      | Live           |
| 6     | Mobile installs (first 6 months)    | 1,000+         |
| 6     | Mobile crash-free rate              | >99.5%         |

---

## Planned Game Releases

> New math games to expand the Dolanan Matematika collection beyond Addition and Multiplication.
> These are ordered by priority based on educational impact, engagement, and development feasibility.

### Next — Arena Pecahan (Fraction Arena)
**Format**: New — Competitive memory/matching board
**Curriculum**: Kelas 3–5 (fraction equivalence)

A **4×4 or 5×4 grid** of face-down cards. Each card shows a fraction (e.g., `1/2`, `2/4`, `3/6`, `0.5`). Players take turns flipping two cards — if they're **equivalent fractions**, the player claims them. One card is always a numeric fraction, the other could be a **visual representation** (pie chart, bar model) or a **decimal**. Most pairs claimed wins.

- Fraction equivalence is one of the biggest stumbling blocks in SD math
- Visual + numeric reinforcement is research-backed for understanding fractions
- Completely different format from the grid games — refreshes the app's feel
- ~40% code reuse (screens, overlays, SFX, timer); new board generation, card flip animation, equivalence checking logic needed

### Planned — Rumah Pembagian (Division House)
**Format**: Same mechanic (10×10 grid + side board + 4-in-a-row)
**Curriculum**: Kelas 3–4 (pairs naturally with multiplication)

Side board rows both **1–9**. Board pre-filled with values that are **valid quotients** from the 1–9 division table (only whole-number results). Player moves pion → computes `larger ÷ smaller` → claims matching cell. Consider a smaller **8×8 or 7×7 grid** to match the restricted quotient set.

- Division is the hardest of the four basic operations for SD kids
- Inverse-of-multiplication reinforcement is pedagogically powerful
- Consider a **difficulty toggle**: Kelas 3 (divide by 1–5 only) vs Kelas 4+ (full 1–9)
- ~80% code reuse from `game-perkalian.js`

### Planned — Susun Bilangan (Number Builder)
**Format**: New — Competitive place-value puzzle
**Curriculum**: Kelas 2–4 (place value, number sense)

Players are dealt **random digits** (0–9) one at a time, 4–6 digits total. After each digit, they must immediately place it into a slot (ones, tens, hundreds, thousands). Goal: build the **largest** (or smallest, alternating rounds) number possible. Neither player sees the other's board until reveal. Best of 5 rounds wins.

- Place value understanding is foundational; builds number sense and probabilistic thinking
- Quick-round format adds pace variety — complements the longer grid games
- Great for younger kids (Kelas 2–3) who can't sustain 15-minute grid sessions
- Very simple UI (digit cards + slot grid); ~50% code reuse

### Planned — Tantangan FPB & KPK (GCD & LCM Challenge)
**Format**: New — Number line race
**Curriculum**: Kelas 5–6 (FPB/KPK — explicitly tested in Indonesian national assessments)

A **number line race** (1–100). Each round, two numbers appear (e.g., 12 and 18). Players choose: find the **FPB (GCD)** or the **KPK (LCM)**. Correct answer advances your token by the answer's value. Wrong answer stays put. First to reach 100 wins. Strategic layer: FPB gives small safe advances, KPK gives big risky leaps (but harder to compute). Optional **buzzer mode**: both players race to answer first.

- FPB/KPK is a dedicated topic in Indonesian SD curriculum with few fun practice tools
- Race mechanic + risk/reward strategy adds tension
- Expands the target audience upward to Kelas 5–6 who may have "outgrown" the grid games
- Simpler UI than grid games (number line + input field); GCD/LCM algorithms are trivial to implement

---

*This roadmap is a living document. Priorities may shift based on user feedback and community needs.*
