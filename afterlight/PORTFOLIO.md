# AFTERLIGHT — portfolio notes

**Project:** AFTERLIGHT — Echo Heist  
**Owner:** Alexander Zaghloul  
**Category:** Browser game / interactive software  
**Scope:** Six playable sectors, custom simulation, responsive interface, touch input, sound, progress saving, and a repeatable test suite  
**Development approach:** AI-assisted implementation

## Project summary

AFTERLIGHT is a time-loop puzzle heist in which players cooperate with recordings of their previous movements. An echo can stand on a switch while the live player explores a different route, allowing one player to solve puzzles that require several simultaneous actions. Each sector adds a new constraint, from two-switch gates to sequential locks and timed security hazards.

## Resume project entry

**AFTERLIGHT — Browser Game | JavaScript, Canvas 2D, Web Audio**

- Built and deployed an AI-assisted, six-sector browser puzzle game featuring recorded movement playback, deterministic patrols, collision detection, and keyboard/touch controls.
- Separated gameplay simulation from rendering and interface code; implemented a fixed-timestep engine, three-echo coordination, procedural audio, and validated local progress saving.
- Verified all six missions with a time-aware pathfinding solver and a 16-test suite covering puzzle completion, movement, hazards, replay behavior, and persistence.

## LinkedIn project description

I wanted to explore a game mechanic where your previous moves become part of the solution, so I created AFTERLIGHT: a browser heist game in which you record a route, rewind, and work alongside echoes of your past self.

The six sectors build from a single switch to three coordinated timelines, with patrols and timed lasers adding pressure. The project includes a custom JavaScript/Canvas engine, touch controls, synthesized sound, saved progress, and automated checks that play through every mission.

Built with AI-assisted development. The full source is available to inspect, run, and extend.

## Technical talking points

1. **Why fixed timestep?** The simulation advances at 60 Hz independently of rendering, avoiding movement tied directly to a display's refresh rate.
2. **How are echoes implemented?** Timestamped position frames are recorded during each loop. Binary-search lookup and interpolation reconstruct a position for the current loop time; finished traces hold their endpoint.
3. **How do puzzles stay predictable?** Patrols and lasers derive their state from loop time, so rewinding restores the same hazard cycle.
4. **How are gates protected against edge cases?** Collision substeps prevent a dash from tunneling through walls. An occupancy guard prevents a gate from closing around a player.
5. **How was solvability checked?** A test-only time-expanded A* planner searches movement and waiting actions against the real hazard schedules, then sends each plan through the actual game engine.
6. **What persists?** Only local completion records and sound preference. There is no online account or remote leaderboard.

## Practical next steps

- Play through the campaign on your own phone and computer and note any changes you want.
- Customize a sector by editing the declarative objects in `dist/levels.js`, then rerun the solvability checks.
- Publish the source to your GitHub and place the public play URL alongside the project entry.

Public access for the hosted game must be enabled before linking it as a recruiter-facing demo.
