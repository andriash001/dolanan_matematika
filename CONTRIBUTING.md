# Contributing to Dolanan Matematika

Thank you for your interest in contributing to **Dolanan Matematika**! We welcome contributions from educators, developers, designers, and anyone passionate about improving math education for Indonesian kids.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Areas for Contribution](#areas-for-contribution)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and kind to all contributors
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy toward other viewpoints
- Respect the educational mission: making math fun for Indonesian primary school kids

---

## How to Contribute

### 1. Fork the Repository

```bash
git clone https://github.com/YOUR_USERNAME/dolanan_matematika.git
cd dolanan_matematika
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-description
```

### 3. Make Changes

- Keep changes focused on a single feature or bug fix
- Test thoroughly in desktop and mobile viewports
- Run the game locally to ensure no regressions

### 4. Commit and Push

```bash
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

Open a PR against the **`dev`** branch with:
- Clear description of changes
- Why this change is needed
- Any testing steps or screenshots (especially for UI changes)

---

## Development Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A text editor (VS Code recommended)
- A local HTTP server (Python, Node.js, PHP, or similar)

### Run Locally

```bash
# Clone and navigate
git clone https://github.com/andriash001/dolanan_matematika.git
cd dolanan_matematika

# Start a local server
python3 -m http.server 8080

# Open in browser
# http://localhost:8080
```

No build tools, no dependencies — just serve the files and play!

### Testing Checklist

Before submitting a PR, verify:

- [ ] Both games load correctly (Rumah Penjumlahan & Rumah Perkalian)
- [ ] PvP and AI modes both work
- [ ] Timer counts down correctly (test all 4 options)
- [ ] Win/draw detection works
- [ ] Coin toss animation plays smoothly
- [ ] Sound effects work (and mute toggle functions)
- [ ] Mobile responsiveness: test on 375px, 600px, and tablet sizes
- [ ] Dark theme looks good
- [ ] No console errors
- [ ] Player names persist after refresh

---

## Code Style Guidelines

### HTML/CSS/JavaScript

- **No frameworks or build tools** — keep it vanilla
- **Semantic HTML** — use proper heading hierarchy, `<main>`, `<section>`, `<button>` instead of divs for interactive elements
- **CSS** — use CSS custom properties (`--var-name`), avoid inline styles, leverage Flexbox/Grid
- **JavaScript** — ES6+ strict mode, IIFE module pattern, clear variable names in Indonesian and English comments where helpful
- **Comments** — explain *why*, not *what*. The code should be readable enough to show what it does.

### File Naming

- `kebab-case` for files: `game.js`, `ui-perkalian.js`
- `camelCase` for variables/functions: `handleBoardClick()`, `updateTurnTimer()`
- `PascalCase` for modules/objects: `Game`, `UI`, `AI`

### Accessibility

- Always add `role`, `aria-label`, or `aria-live` to interactive elements
- Ensure colorblind-friendly symbols (`●`, `▲`, distinct colors)
- Test with a keyboard (Tab, Enter, Escape)
- Maintain at least WCAG AA contrast ratios

### Mobile-First

- Test on small viewports (375px) first
- Use `clamp()` for responsive sizing
- Ensure touch targets are at least 44×44px
- Test landscape orientation

---

## Commit Message Convention

Follow this format for clarity:

```
type(scope): subject

Body (optional)
Fixes #123
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation updates
- `style:` — CSS or visual tweaks (no logic change)
- `refactor:` — Code restructuring (no feature change)
- `perf:` — Performance improvement
- `tests:` — Test additions or fixes
- `chore:` — Build, config, or dependency updates

**Examples:**
```
feat(penjumlahan): add difficulty levels
fix(ai): prevent AI from choosing invalid moves
docs(readme): update feature list
style(colors): improve contrast for accessibility
```

---

## Areas for Contribution

### High Priority

- **Difficulty Levels** — Smaller board sizes (6×6, 8×8) for Kelas 1–2
- **Light Theme** — Create a bright, warm color palette for younger kids
- **Interactive Tutorial** — Guided first-game walkthrough with highlighted UI elements
- **Sound Accessibility** — On-screen visual feedback for sound effects
- **Confetti/Win Celebrations** — Particle effects or animations for wins

### Medium Priority

- **i18n/Localization** — Support more languages (English fully bilingual HTP exists, but more languages welcome)
- **Tablet Breakpoint** — Dedicated styles for 768px–1024px screens
- **Streak Counter** — Display win streaks and lifetime stats
- **Custom Board Names** — Let players name their houses
- **Undo Move** — Limited undo for casual play

### Low Priority (But Welcome!)

- **Service Worker** — True offline PWA support
- **Themes** — Holiday/seasonal themes
- **Sound Pack Alternatives** — Different audio styles
- **Bot Difficulty Levels** — Easy/Medium/Hard AI variants
- **Leaderboard** — Browser-local leaderboard (localStorage)

---

## Reporting Bugs

### Before You Report

1. Check [GitHub Issues](https://github.com/andriash001/dolanan_matematika/issues) — someone may have reported it already
2. Test on multiple browsers and devices
3. Try clearing `localStorage` (F12 → Application → Clear Site Data)
4. Note your browser, device, and OS

### How to Report

Click **Issues** → **New Issue** and include:

- **Environment:** Browser, device, and OS
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Steps to Reproduce:** Numbered steps to trigger the bug
- **Screenshots:** If visual, attach a screenshot
- **Console Errors:** Paste any errors from F12 → Console

---

## Suggesting Features

### Before You Suggest

1. Check [GitHub Issues](https://github.com/andriash001/dolanan_matematika/issues) — is it already suggested?
2. Review [ROADMAP.md](ROADMAP.md) — is it already planned?
3. Ask yourself: Does this serve the **primary school student audience**?

### How to Suggest

Click **Issues** → **New Issue** and include:

- **Problem:** What user problem does this solve?
- **Solution:** Describe the feature
- **Alternatives:** Other ways to solve this?
- **Target Audience:** Which grade? SD Kelas __?
- **Example:** Sketch, mock-up, or use case

---

## Pull Request Process

### Before Submitting

1. **Sync with `origin/dev`:**
   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. **Test thoroughly** (see [Testing Checklist](#testing-checklist))

3. **Update documentation** if needed:
   - Update `README.md` for user-facing changes
   - Update `ROADMAP.md` if applicable
   - Add inline comments for complex logic

### In Your PR

- **Title:** Keep it clear, e.g., "Add difficulty levels for Kelas 1–2"
- **Description:** Explain *why* this change exists and *how* to test it
- **Linked Issues:** Write `Fixes #123` to auto-close related issues

### Review Process

- We'll review your code for:
  - Correctness (does it work?)
  - Clarity (can others understand it?)
  - Consistency (does it match our style?)
  - Accessibility (does it work for all kids?)
  - Performance (any regressions?)

- Address feedback kindly — this is collaborative!
- You may be asked to make changes; that's normal and expected.
- Once approved, we'll merge into `dev`, then promote to `main` + tag a release.

---

## Questions?

- **Found a bug?** Open a [GitHub Issue](https://github.com/andriash001/dolanan_matematika/issues)
- **Want to chat?** Start a [GitHub Discussion](https://github.com/andriash001/dolanan_matematika/discussions)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for making Dolanan Matematika better for Indonesian kids! 🎓🎮
