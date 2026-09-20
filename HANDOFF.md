# Handoff Doc — Pokémon Game Builder

Written at the end of the session that built this project from scratch, for
whoever (human or Claude) picks up the next round of iteration. Read this
first — it has the *why* behind decisions that aren't obvious from the code
alone, plus gotchas that cost real time to figure out once already.

**Live game:** https://frugalhahns.github.io/pokemon-game-builder/
**Repo:** https://github.com/frugalhahns/pokemon-game-builder (public)
**User-facing docs:** [README.md](./README.md) — read that too; this doc is
the developer/continuation layer on top of it, not a replacement.

## What this is

A node-based, wire-together game creation sandbox for an 8-year-old,
inspired by *Game Builder Garage*, themed with Pokémon. Not a template with
knobs to turn — the kid builds the actual game logic by dragging blocks and
wiring colored dots together, live, on a canvas next to the running game.

## Where things stand

Six commits, each a complete working increment (see `git log`):

1. **Initial prototype** — the engine (Graph/Runtime/Stage), the wireable
   editor, five foundational blocks (D-Pad, 3 Pokémon, Touch Sensor, Game
   Over, Score Counter), original placeholder sprite art.
2. **Real sprites** — swapped placeholder art for sprites loaded *live* from
   `PokeAPI/sprites` at runtime, specifically so the public repo never
   stores redistributed Nintendo/Game Freak artwork (see "IP notes" below).
3. **Cloud saves** — Firebase (Google sign-in + Firestore), so a kid's
   wired-up game follows them across devices.
4. **Onboarding** — a 3-step first-time walkthrough of the wiring metaphor.
5. **Missions + block descriptions** — 3 guided challenges with earned
   hints, plus always-visible plain-language descriptions on every block
   (a user reported blocks like Touch Sensor weren't self-explanatory).
6. **Loop/logic blocks + real win condition** — Repeat Timer, Counter,
   Patrol, AND/OR/NOT gates, a boolean port type, a Win state; the starter
   game became an actual mini-game (dodge a patrolling Gengar, collect 3
   Charmanders to win) instead of a static wiring demo. A 4th mission
   teaches the loop concept directly.

Everything is deployed and working at the live URL above as of this
session. Each increment was manually tested end-to-end in a real browser
(via the claude-in-chrome skill) before being pushed, not just written and
assumed correct — worth continuing that practice.

## Architecture map

No build step, no framework, no bundler — plain ES modules loaded directly
by the browser. `node server.js` (or any static file server) for local dev.

```
src/
├── main.js              Boots everything, owns the default/free-play game graph
├── engine/               Pure logic - no DOM, would work headless
│   ├── graph.js           Node/wire data model, topological sort, JSON save/load
│   ├── nodeTypes.js       THE BLOCK VOCABULARY - every block type is defined here
│   ├── types.js           Port-type -> wire color mapping
│   ├── stage.js           Game object positions, collisions, score/gameOver/win state
│   ├── sprites.js         Live PokeAPI sprite loading + hand-drawn fallback shapes
│   ├── inputManager.js    Keyboard -> D-Pad vector
│   └── runtime.js         The per-frame tick: propagates wires, calls each node's tick()
├── editor/               The Programming Canvas UI (DOM/SVG, no game logic)
│   ├── nodeEditor.js       Draggable nodes, wire-dragging, param inputs, delete
│   └── palette.js          Sidebar of block buttons
├── cloud/                Firebase integration
│   ├── firebase.js         Init, auth, Firestore save/load calls
│   └── cloudUI.js          Wires the cloud toolbar up to firebase.js
├── missions/             The guided-challenge system
│   ├── missions.js          Each mission: setup() clears canvas to just what's needed,
│   │                        isComplete() checks actual live-game outcome (not just wiring)
│   ├── missionRunner.js     State machine: active mission, attempt counting, hint gate,
│   │                        localStorage progress
│   └── missionUI.js         Mission-select modal + the live mission status bar
└── ui/
    ├── modal.js            Small styled prompt()/confirm() replacements (native dialogs
    │                       block automated testing and can't be styled)
    └── onboarding.js        First-time "How to Play" walkthrough
```

**The core loop** (`main.js`'s `requestAnimationFrame` loop): each frame,
`runtime.tick(dt)` walks the graph in dependency order (topological sort by
wiring), fills each node's `inputs` from whatever's wired into it, calls
that node type's `tick()`, then `missionRunner.tick()` checks whether the
active mission's `isComplete()` now returns true.

**Adding a new block type**: everything lives in one entry in the
`NodeTypes` object in `nodeTypes.js` — `inputs`/`outputs` (typed ports),
`description` (shown in palette + as a tooltip), optional `param` (an
inline-editable number on the node itself), and `create()`/`tick()`/
`reset()` hooks. Add an entry, it shows up in the palette automatically.
That's the whole extension point — no registration step anywhere else.

**Port types** (`types.js`): `vector2` (direction), `object` (a Pokémon
reference), `trigger` (a one-shot pulse - true for exactly one tick),
`number`, `boolean` (a *held* state, true for as long as something's the
case). Trigger and boolean are deliberately different types you can't wire
directly together — `logic.onTrue` in `nodeTypes.js` is the bridge, and is
itself a small lesson about edge-vs-level.

## Gotchas that cost real time this session (read before debugging)

1. **`[hidden]` can silently stop working.** If any CSS rule gives an
   element `display: flex` (or grid, etc.), it overrides the browser's own
   `[hidden] { display: none }` UA rule *regardless of selector
   specificity*, because author styles beat UA styles as a matter of CSS
   origin, not specificity. Fixed once, globally, in `main.css`:
   `[hidden] { display: none !important; }`. Don't remove this rule.

2. **A bare class selector for a colored button variant can lose to a
   broader sibling rule.** E.g. `.mission-actions button { background:
   white; }` (class + element = higher specificity) beats `.mission-next-btn
   { background: green; color: white; }` (class alone) *regardless of
   source order*, producing invisible white-on-white text. This exact bug
   happened twice in this session (once in the save/delete modal buttons,
   once in the mission bar's "All Done!" button). **Always scope a colored
   button variant under its parent class**: `.mission-actions
   .mission-next-btn { ... }`, not `.mission-next-btn { ... }` alone. If you
   add a new colored button anywhere, check this.

3. **`requestAnimationFrame` pauses/throttles when a browser tab is
   backgrounded** (`document.visibilityState === 'hidden'`), independent of
   `document.hasFocus()`. When testing via claude-in-chrome automation,
   tabs can end up in this state even while you're actively taking
   screenshots of them, making time-based logic (movement, timers, Patrol)
   appear completely broken — nothing moves no matter how long you wait.
   **This is a test-environment artifact, not a bug.** To verify real logic
   correctness when you suspect this, drive `runtime.tick(0.016)` in a
   manual loop via `javascript_exec` instead of relying on real elapsed
   time — that bypasses rAF entirely and tests the actual tick logic.

4. **The Bash tool's sandbox blocks some redirect targets** (e.g.
   `release-assets.githubusercontent.com`, the CDN GitHub release downloads
   actually redirect to). Downloads from `github.com/.../releases/download/`
   need `dangerouslyDisableSandbox: true`. Related: the scratchpad directory
   path doesn't exist in the non-sandboxed filesystem view — write to `/tmp`
   when the sandbox is disabled, not the scratchpad path.

5. **Pasting an OAuth code into a Bash command gets blocked** by Claude
   Code's auto-mode safety classifier ("Credential Materialization"), even
   when it's a legitimate single-use CLI login code. The user has to run
   that specific command themselves (suggest they type `!` + the command).

6. **A brand-new Google account's first-ever Firebase project can't be
   created purely via CLI/API** — `firebase projects:create` succeeds at
   the GCP-project level but `addFirebase` 403s until the account has been
   through the "A few things to remember when adding Firebase to a Google
   Cloud project" one-time web console flow at console.firebase.google.com.
   Not needed again for a second project on the same account.

7. **Native `window.prompt()`/`confirm()` block page scripts while open**,
   which also breaks automated testing. Already replaced with
   `src/ui/modal.js`'s `showPrompt()`/`showConfirm()` — use those, not the
   native dialogs, for anything new.

## Current game design (as shipped)

**Starter/free-play graph** (built in `main.js`'s `buildDefaultGraph()`):
D-Pad → Pikachu (Move); Patrol → Gengar (Move, autonomous patrol); Pikachu +
Gengar → Touch Sensor → Game Over; Pikachu + Charmander → Touch Sensor →
Score Counter *and* → Counter (count to 3) → You Win!.

**Missions** (`src/missions/missions.js`), each clearing the canvas to just
what's needed and checking a real live-game outcome, not just that a wire
exists:
1. *Get Moving!* — wire D-Pad→Pikachu, move him (distance-from-spawn check).
2. *Danger Zone!* — wire Touch Sensor + Game Over, walk into Gengar
   (`stage.gameOver === true` check).
3. *Score a Point!* — same pattern into Score Counter (`score >= 1` check).
4. *On Autopilot!* — wire Patrol→Gengar (distance-from-spawn check, same
   pattern as #1 but proving autonomous movement instead of key-driven).

Hints are attempt-gated (2 wire-connect attempts unlocks the hint) via
`MissionRunner.registerAttempt()`, called from `NodeEditor`'s `onConnect`
hook. Mission progress is `localStorage`-only, per browser — **not synced
to the cloud save system**, unlike game saves. Worth fixing if that
inconsistency bothers you (see Backlog).

## Backlog / ideas for next iterations

Nothing below is started — just things that came up as natural next steps
but were out of scope for this session:

- **Charmander doesn't respawn** after being touched for a score point —
  the kid has to walk away and back to re-trigger the sensor (edge-
  triggered by design). A "respawn on touch" behavior would make the
  scoring loop feel much better.
- **No node currently consumes `number` type.** Score Counter's `value`
  output and a hypothetical Counter count-display have nowhere to plug in.
  A "Show Number" HUD block or a "Number ≥ Threshold" comparator (outputting
  `boolean`) would close this gap and add real value.
- **Mission progress isn't cloud-synced** — only game saves are. Inconsistent
  from a kid's perspective if they switch devices mid-missions.
- **More blocks**: Random, XOR gate, a single-shot Delay/Wait (distinct from
  Repeat Timer's *forever* loop — teaches sequencing, "wait, then do this
  once"), a Lives/Health counter, sound effects, more Pokémon (Squirtle,
  Bulbasaur — same `makePokemonObjectType()` pattern, trivial to add).
- **More missions**: nothing currently teaches AND/OR/NOT gates directly —
  Mission 4 only covers Patrol. A 5th mission built around combining two
  Touch Sensors through an AND gate would round out the Logic category.
- **Mobile/touch controls** — currently keyboard-only (arrow keys/WASD).
- **Editor**: no undo/redo, no pan/zoom on the 2000×1200 node canvas
  (relies on native scrollbars), wiring is mouse-only (no keyboard path).
- **Level select / multiple stages** for more game-like structure.

## Firebase reference

- Project ID: `pokemon-game-builder`, owned by `cyahahn@gmail.com` (Spark/
  free plan — no billing account, safe at this scale: 50K reads / 20K
  writes per day, 1GiB storage).
- Auth: Google Sign-In only. Authorized domains: `localhost`,
  `frugalhahns.github.io`, `pokemon-game-builder.firebaseapp.com`,
  `pokemon-game-builder.web.app`. **If you ever host this somewhere else,
  add that domain in Firebase Console → Authentication → Settings →
  Authorized domains, or sign-in will fail there.**
- Firestore: one collection path, `users/{uid}/saves/{saveId}`, locked down
  by `firestore.rules` so a user can only read/write their own subtree.
  Deploy rule changes with `firebase deploy --only firestore:rules` (the
  Firebase CLI is installed at `~/.local/bin/firebase` on this machine, not
  via npm — see `.firebaserc`/`firebase.json` for project config).
- The `apiKey` embedded in `src/cloud/firebase.js` is not a secret — it only
  identifies the project; access control is entirely the Firestore rules
  and requiring a signed-in user.

## GitHub / hosting reference

- Repo `frugalhahns/pokemon-game-builder` is **public** (deliberate — see
  README's "About the sprites" for the IP reasoning: sprites are fetched
  live from PokeAPI at runtime rather than committed, specifically so a
  public repo never stores redistributed copyrighted art).
- GitHub Pages deploys straight from `main`, no build step, auto-redeploys
  ~1-2 minutes after every push. Nothing else to do to ship a change —
  `git push` is the deploy step.
- `gh` CLI is installed at `~/.local/bin/gh` on this machine (not via
  Homebrew — none of the usual package managers were available, so both
  `gh` and `firebase` were installed as standalone binaries).

## How to resume

```bash
cd ~/pokemon-game-builder
node server.js            # or: python3 -m http.server 5173
# open http://localhost:5173
```

No `npm install` needed anywhere in this project. Make changes, test live
in a browser (claude-in-chrome skill works well for this — see gotcha #3
above about tab visibility), then `git add -A && git commit && git push` to
ship — Pages picks it up automatically.
