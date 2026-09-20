# Pokémon Game Builder

An open-ended, node-based game creation sandbox, inspired by the wiring
mechanics of Nintendo's *Game Builder Garage*, streamlined for a young kid
(built with an 8-year-old in mind) and themed around Pokémon.

Instead of filling in a fixed template, the child wires small logic blocks
together on a **Programming Canvas** — a D-Pad block into a Pikachu block to
control it, a Touch Sensor between two Pokémon into a Game Over block — and
sees the result live on the **Sandbox Stage** above it. There's no "correct"
game here: it's a construction kit.

The first time you open it, a short 3-step walkthrough explains the wiring
metaphor (`src/ui/onboarding.js`) — it only shows once per browser, but the
**❓ How to Play** button in the header reopens it anytime.

> Picking this project back up in a new session? Read
> **[HANDOFF.md](./HANDOFF.md)** first — architecture notes, hard-won
> gotchas, and a backlog of ideas for the next iteration.

## How it works

The app is split into two halves, just like Game Builder Garage's Make mode:

- **Sandbox Stage** (top) — the live game. Whatever is wired on the canvas
  below controls what happens here, instantly.
- **Programming Canvas** (bottom) — drag blocks in from the palette on the
  left, then wire their colored dots together. A dot's color is its data
  type — you can only connect matching colors:

  | Color | Type | Meaning |
  |---|---|---|
  | 🔵 Blue | Direction | A movement vector, like "which way to walk" |
  | 🟢 Green | Object | A reference to a specific Pokémon on stage |
  | 🟠 Orange | Trigger | A one-shot pulse - true for exactly the instant something happens |
  | 🟣 Purple | Number | A plain number, like a score |
  | 🩵 Teal | Boolean | A *held* true/false state, like "currently touching" (as opposed to the instant it started) |

  Trigger and Boolean are deliberately different colors/types: a trigger is
  an edge (the moment something happens), a boolean is a level (the state
  right now). The **Turns On** block bridges from one to the other.

### Wiring controls

- **Add a block**: click it in the left palette.
- **Move a block**: drag its colored title bar.
- **Wire two blocks**: drag from an output dot (right side of a block) to an
  input dot (left side of another block) of the same color.
- **Rewire an input**: drag from an already-wired input dot to detach it,
  then drop it on a new output dot.
- **Delete a block or wire**: click it to select it, then press `Delete` (or
  `Backspace`).

### The starter game

The project opens with a small but complete game already wired up: dodge a
patrolling Gengar while collecting 3 touches of Charmander to win.

1. **D-Pad → Pikachu (Move)** — arrow keys / WASD move Pikachu around the
   stage.
2. **Patrol → Gengar (Move)** — Gengar walks back and forth on its own,
   forever, with no key presses - a loop block driving a living obstacle.
3. **Pikachu + Gengar → Touch Sensor → Game Over** — bumping into Gengar
   ends the game.
4. **Pikachu + Charmander → Touch Sensor → Score Counter** — touching
   Charmander adds a point (and it can be touched again once Pikachu moves
   away and back).
5. **...→ Touch Sensor → Counter (count to 3) → You Win!** — the same touch
   also feeds a Counter; the third touch fires "Reached!", which triggers the
   win screen. A bounded loop ("do this 3 times") built from the same Counter
   block used in the Missions below.

Click **Reset Game** at any time to put every Pokémon back at its starting
spot and clear the score/game-over/win state.

Every block in the left palette shows a plain-language description of what
it does right under its name (and the same text shows up as a tooltip on
placed blocks) — so "what does a Touch Sensor actually do?" has an answer
without leaving the app.

## Learning it: Missions

Click **🎯 Missions** to try four short, progressive challenges instead of
free-building right away — each one clears the canvas down to just the
blocks needed and teaches one concept:

1. **Get Moving!** (Cause & Effect) — wire the D-Pad into Pikachu and move him.
2. **Danger Zone!** (If This, Then That) — wire a Touch Sensor between Pikachu
   and Gengar into a Game Over.
3. **Score a Point!** (Reuse What You Know) — the same sensor-into-trigger
   pattern, now wired into a Score Counter instead.
4. **On Autopilot!** (Loops) — wire Patrol into Gengar and watch it walk back
   and forth on its own, forever, with no keys pressed.

A mission isn't marked complete just because a wire exists — it checks that
the thing actually happens in the live game (Pikachu really moves, Game Over
really fires), so the concept has to actually work, not just look right.
Each mission has a **Hint** button that stays locked for a couple of tries
(`src/missions/missionRunner.js`) — a kid has to attempt it themselves before
the hint text is offered. Progress is saved locally per browser. **Exit**
at any point returns to the free-play starter game.

## Saving your game (cross-device)

Click **Sign in with Google** in the toolbar to save your wired-up game to
the cloud (Firebase) and load it back on any device — a save made on one
computer or tablet shows up under **Load a saved game…** anywhere else you
sign in with the same Google account.

- **Save Game** — names and saves the current wiring + Pokémon positions.
- **Load a saved game…** — replaces the current graph with a saved one.
- **Delete** — removes the selected save permanently.

Each person's saves are private to their own Google account (enforced by
Firestore security rules in `firestore.rules` — a user can only read or
write documents under their own `users/{uid}/` path). No save data is tied
to a device, so it survives clearing browser data, a new computer, etc., as
long as you sign in again. It's entirely free at this scale (Firebase's
Spark plan).

## Playing it

This is a plain client-side web app (HTML/CSS/JS, canvas-rendered) — there's
no account, no install, and no backend. Anyone with the link opens it in a
browser and starts wiring blocks immediately. The easiest way to play is the
hosted GitHub Pages link (see below); running it locally is mainly useful for
editing the code itself.

## Running it locally

This is plain HTML/CSS/JS with **no build step and no npm dependencies** —
but it does need to be served over `http://`, not opened directly as a
`file://` URL, because the browser's ES module loader requires it.

```bash
cd pokemon-game-builder
node server.js
# or: npm start
```

Then open **http://localhost:5173** in a browser.

Any other static file server works too, for example:

```bash
python3 -m http.server 8000
```

or the VS Code "Live Server" extension.

## Hosting it (free)

Since this is a static, no-build site, any static host works for free. This
repo is set up for **GitHub Pages**, deployed straight from the `main`
branch — no build, no config: `https://frugalhahns.github.io/pokemon-game-builder/`.
Every push to `main` redeploys it automatically within a minute or two.

Other free options, if you ever want one instead (e.g. to add a custom
domain or a backend later):

| Host | Notes |
|---|---|
| **GitHub Pages** (used here) | Free for public repos, zero config for a static site like this |
| **Cloudflare Pages** | Free, generous limits, fast global CDN |
| **Netlify** | Free tier, drag-and-drop deploys or GitHub integration |
| **Vercel** | Free tier, GitHub integration, easy if you later add serverless functions |

## Project structure

```
pokemon-game-builder/
├── index.html              Page shell: cloud bar + stage panel + editor panel
├── server.js                Zero-dependency static file server
├── firebase.json             Firebase project config (Firestore rules path)
├── firestore.rules           Security rules: users can only touch their own saves
├── styles/
│   └── main.css              All layout/visual styling
└── src/
    ├── main.js               Boots the engine, editor, cloud UI, and starter graph
    ├── engine/
    │   ├── types.js           Port-type -> wire color mapping
    │   ├── graph.js           Node/wire data model, topological sort, save/load JSON
    │   ├── nodeTypes.js       The block "vocabulary" (see below)
    │   ├── stage.js           Live stage: object positions, collisions, score
    │   ├── sprites.js         Live PokeAPI sprite loading + placeholder fallback
    │   ├── inputManager.js    Keyboard -> D-Pad vector
    │   └── runtime.js         Runs the graph against the stage every frame
    ├── editor/
    │   ├── nodeEditor.js       The draggable/wireable Programming Canvas
    │   └── palette.js          Sidebar of block buttons
    ├── cloud/
    │   ├── firebase.js         Firebase init, auth, and Firestore save/load calls
    │   └── cloudUI.js          Wires the cloud toolbar up to firebase.js
    ├── missions/
    │   ├── missions.js          The 4 challenges: setup + isComplete per mission
    │   ├── missionRunner.js     State machine: active mission, attempts, hint gate, progress
    │   └── missionUI.js         Mission-select modal + the live mission bar
    └── ui/
        ├── modal.js            Small styled prompt()/confirm() replacements
        └── onboarding.js        The first-time "How to Play" walkthrough
```

## The blocks

| Block | Category | Inputs | Outputs | Param |
|---|---|---|---|---|
| D-Pad | Input | — | Direction (vector) | — |
| Pikachu / Charmander / Gengar | Pokémon | Move (vector) | Object, Position | — |
| Touch Sensor | Sensor | Object A, Object B | On Touch (trigger), Touching (boolean) | — |
| Repeat Timer | Logic | — | Tick (trigger) | Seconds |
| Counter | Logic | Count (trigger) | Reached! (trigger) | Count to |
| Patrol | Logic | — | Direction (vector) | Seconds |
| AND / OR Gate | Logic | A, B (boolean) | Result (boolean) | — |
| NOT Gate | Logic | A (boolean) | Result (boolean) | — |
| Turns On | Logic | Value (boolean) | Trigger (trigger) | — |
| Game Over | Game State | Trigger | — | — |
| You Win! | Game State | Trigger | — | — |
| Score Counter | Game State | Add Point (trigger) | Score (number) | — |

**Repeat Timer**, **Counter**, and **Patrol** are the loop blocks: Repeat
Timer and Patrol run forever (an unbounded loop, like Blockly's "repeat
forever"), while Counter runs a bounded number of times before firing once
and resetting (like "repeat N times"). **AND/OR/NOT** are the same boolean
logic Blockly's Logic category teaches, just wired instead of nested — drag
two Touch Sensors' "Touching" outputs into an AND Gate for "only while
touching both at once," for example.

A block with a **Param** shows a small editable number right on the block
itself (e.g. Patrol's "Seconds") - click it and type a new value.

## Adding a new block type

All block behavior lives in `src/engine/nodeTypes.js`. Each entry is a plain
object with `inputs`/`outputs` (typed ports), a plain-language `description`
(shown in the palette and as a tooltip on placed blocks), an optional
`param` (a single inline-editable number on the block, e.g. `{ id, label,
type: 'number', default, min, max, step }`, read as `node.param`), and two
lifecycle hooks: `create(node, ctx)` runs once when the block is added,
`tick(node, ctx)` runs every frame after `node.inputs` has been filled in
from whatever is wired into it. Add a new entry there and it automatically
shows up in the palette and becomes wireable — that's the whole extension
point (a Squirtle object, a "Random" block, an XOR gate, etc. all follow the
same pattern).

## About the sprites

The Pokémon on the stage are loaded **live in the browser** from
[PokeAPI/sprites](https://github.com/PokeAPI/sprites), a community-maintained
mirror of the official in-game sprites that's widely used by hobby and
reference projects. `src/engine/sprites.js` fetches them by Pokédex number at
runtime — no sprite image files are stored in this (public) repository, only
the code that requests them. This keeps the repo itself free of redistributed
Nintendo/Game Freak/Creatures Inc. artwork.

If a sprite hasn't finished loading yet, or there's no internet connection,
the game automatically falls back to simple original placeholder shapes
(drawn from scratch in the same file) so it never breaks.

Pokémon is a trademark of Nintendo, Game Freak, and Creatures Inc. This is a
personal, non-commercial, educational project; it isn't affiliated with or
endorsed by any of them.
