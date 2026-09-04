# AFTERLIGHT

### Echo Heist · A time-loop puzzle game

**One thief. Three echoes. Six vaults to crack.**

[Game engine](dist/engine.js) · [Mission definitions](dist/levels.js) · [Tests](tests/engine.test.mjs) · [Portfolio notes](PORTFOLIO.md)

A complete, single-player browser puzzle game. Record your movements, rewind time, and use up to three echoes of your past self to hold switches, unlock gates, evade security, and extract stolen light.

**Portfolio owner:** Alexander Zaghloul  
**Development:** AI-assisted implementation  
**Stack:** JavaScript ES modules, Canvas 2D, Web Audio API, HTML, CSS  
**Dependencies:** None at runtime or for local development

## Play locally

With Node.js 20 or later installed:

```bash
git clone https://github.com/alexanderzaghloul/portfolio.git
cd portfolio/afterlight
npm start
```

Open **http://localhost:3000** in a modern browser. If you downloaded the repository as a ZIP, extract it and open a terminal in its `afterlight` folder before running `npm start`.

The [hosted build](https://afterlight-echo-heist.azaghlou.chatgpt.site) is currently private. Local play does not require an account.

There is no dependency installation or build step. The game uses JavaScript modules, so serve the folder with the included server rather than opening `index.html` as a file.

Alternatively, with Python installed, run `python -m http.server 3000 --directory dist` and open the same address.

## The game

The Helix Archive stores the last light in six secured vaults. Your only partner is your own past.

Move onto a lettered switch and rewind. Your echo follows your recorded route, then holds its final position. While it keeps a gate open, you can record another route or collect the light shards. Collect all three shards in a sector, then reach the **OUT** tile.

- Six handcrafted sectors teach single switches, simultaneous switches, sequential gates, laser timing, and a three-echo finale.
- Three echo slots. A fourth recording replaces the oldest one.
- Each loop has a countdown and automatically records an echo when it expires.
- Shards remain collected across rewinds and security interceptions.
- Getting caught returns you to the start of the loop when you choose Retry; echoes and shards remain.
- A short dash grants protection from patrols and laser beams. Walls and closed gates still block it.
- Restarting a sector clears its current attempt while preserving campaign unlocks and best scores.
- Sound starts muted. Enable it with the sound button or M.
- Best scores, sector unlocks, and sound preference save on the current device. There is no cloud save or online leaderboard.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Space | Record an echo and rewind |
| Shift | Dash |
| Escape / P | Pause or resume |
| R | Restart confirmation |
| M | Sound on/off |
| Touch thumbstick | Move on a phone or tablet |
| Touch Rewind / Dash buttons | Perform the matching action |

### Campaign

| Sector | Mechanic | Loop duration |
| --- | --- | ---: |
| The first echo | Leave one echo on a switch | 20 s |
| Crossed signals | Activate two switches together | 22 s |
| Borrowed seconds | Open sequential gates | 25 s |
| Ghost protocol | Time laser crossings | 24 s |
| Three-body problem | Coordinate all three echo slots | 26 s |
| The last light | Chain three echoes through the archive | 36 s |

### Scoring

Score = `max(100, round(3000 − active_seconds × 8 − recorded_echoes × 85 − interceptions × 180))`.

Three stars require no interceptions and a clear within the sector's target time. Two stars allow up to two interceptions. Other clears earn one star. Paused time is excluded. The device retains the highest-scoring result for each sector.

## Engineering

The simulation is independent of the DOM and renderer. The browser runs it at a fixed 60 Hz; rendering uses `requestAnimationFrame` and a high-DPI canvas. Movement uses normalized input and collision substeps so diagonal movement and dashes remain consistent.

Echoes contain timestamped world positions. Playback uses binary search and linear interpolation; after the final frame, the echo holds its endpoint. Echoes activate the same switch logic as the live player. Gates include a doorway occupancy guard so they cannot close around a player.

Patrol positions and laser cycles are functions of loop time. They reset deterministically, so each sector can be learned and planned. Sound effects and a quiet ambient sequence are synthesized with the Web Audio API; there are no licensed samples or externally loaded audio assets.

The game pauses when the window loses focus or the tab becomes hidden. Storage validation reconstructs unlocked progress from completed sectors and rejects malformed values. If browser storage is unavailable, the game continues for the current visit and displays a notice.

## Project structure

```text
dist/
  index.html       Semantic game shell, guide, and dialogs
  style.css        Responsive interface and touch controls
  levels.js        Six declarative sector definitions
  engine.js        Simulation, collisions, echoes, gates, hazards, scoring
  renderer.js      Canvas world, traces, lighting, particles, HUD markers
  audio.js         Synthesized effects and ambient sequence
  storage.js       Validated local progress
  game.js          Input, interface, state coordination, animation loop
  icon.svg         Vector application icon
tests/
  engine.test.mjs  Gameplay and persistence regression checks
  solver.mjs       Time-expanded A* campaign playthrough helper
server.mjs         Dependency-free local development server
PORTFOLIO.md       Project summary and resume/LinkedIn material
```

## Validation

Run `npm test` for the gameplay suite and `npm run check` for JavaScript syntax checks.

The suite includes a time-expanded A* helper that plans routes through every sector with real echoes, moving patrols, and laser timing. It feeds those routes through the actual engine and verifies successful extraction without interceptions. It also checks path interpolation, endpoint holding, the echo cap, pause behavior, auto-rewind, movement normalization, dash collisions, capture/retry, gate occupancy, and corrupted storage.

The initial release passed all **16 tests**, including all six complete campaign simulations. Browser rendering, audio playback, and physical touch-device behavior have not been exercised in an interactive browser test. These are the main remaining platform checks.

## Deployment

Publish the contents of `dist/` with a static web host. Use the directory as the public root. The app requires no API keys, server database, third-party fonts, or remote assets.

The included `server.mjs` binds to localhost for local development. It is not intended as a production server.
