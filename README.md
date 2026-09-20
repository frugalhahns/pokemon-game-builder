# Pokémon Game Builder

An open-ended, node-based game creation sandbox, inspired by the wiring
mechanics of Nintendo's *Game Builder Garage*, streamlined for a young kid
(built with an 8-year-old in mind) and themed around Pokémon.

Instead of filling in a fixed template, the child wires small logic blocks
together on a **Programming Canvas** — a D-Pad block into a Pikachu block to
control it, a Touch Sensor between two Pokémon into a Game Over block — and
sees the result live on the **Sandbox Stage** above it. There's no "correct"
game here: it's a construction kit.

## How it works

The app is split into two halves, just like Game Builder Garage's Make mode:

- **Sandbox Stage** (top) — the live game. Whatever is wired on the canvas
  below controls what happens here, instantly.
- **Programming Canvas** (bottom) — drag blocks in from the palette on the
  left, then wire their colored dots together. A dot's color is its data
  type (blue = direction, green = a Pokémon object, orange = a one-shot
  trigger, purple = a number) — you can only connect matching colors.

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

The project opens with a tiny complete game already wired up:

1. **D-Pad → Pikachu (Move)** — arrow keys / WASD move Pikachu around the
   stage.
2. **Pikachu + Gengar → Touch Sensor → Game Over** — bumping into Gengar
   ends the game.
3. **Pikachu + Charmander → Touch Sensor → Score Counter** — touching
   Charmander adds a point (and it can be touched again once Pikachu moves
   away and back).

Click **Reset Game** at any time to put every Pokémon back at its starting
spot and clear the score/game-over state.

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

## Project structure

```
pokemon-game-builder/
├── index.html              Page shell: stage panel + editor panel
├── server.js                Zero-dependency static file server
├── styles/
│   └── main.css              All layout/visual styling
└── src/
    ├── main.js               Boots the engine, editor, and starter graph
    ├── engine/
    │   ├── types.js           Port-type -> wire color mapping
    │   ├── graph.js           Node/wire data model + topological sort
    │   ├── nodeTypes.js       The block "vocabulary" (see below)
    │   ├── stage.js           Live stage: object positions, collisions, score
    │   ├── sprites.js         Simple placeholder Pokémon-style drawings
    │   ├── inputManager.js    Keyboard -> D-Pad vector
    │   └── runtime.js         Runs the graph against the stage every frame
    └── editor/
        ├── nodeEditor.js       The draggable/wireable Programming Canvas
        └── palette.js          Sidebar of block buttons
```

## The foundational blocks

| Block | Category | Inputs | Outputs |
|---|---|---|---|
| D-Pad | Input | — | Direction (vector) |
| Pikachu / Charmander / Gengar | Pokémon | Move (vector) | Object, Position |
| Touch Sensor | Sensor | Object A, Object B | On Touch (trigger) |
| Game Over | Game State | Trigger | — |
| Score Counter | Game State | Add Point (trigger) | Score (number) |

## Adding a new block type

All block behavior lives in `src/engine/nodeTypes.js`. Each entry is a plain
object with `inputs`/`outputs` (typed ports) and two lifecycle hooks:
`create(node, ctx)` runs once when the block is added, `tick(node, ctx)`
runs every frame after `node.inputs` has been filled in from whatever is
wired into it. Add a new entry there and it automatically shows up in the
palette and becomes wireable — that's the whole extension point (a Timer
block, a "Win" state, a Squirtle object, etc. all follow the same pattern).

## About the sprites

The Pokémon on the stage are simple original placeholder shapes (colored
circles with a few basic decorative features) drawn from scratch in
`sprites.js` — not official artwork. Pokémon is a trademark of Nintendo,
Game Freak, and Creatures Inc. This project is a personal, non-commercial,
educational tool; swap in your own licensed or fan-made art if you want a
closer look, especially before sharing it beyond personal use.
