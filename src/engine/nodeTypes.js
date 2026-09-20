// The registry of foundational logic blocks. Each entry describes a node's
// ports (with the data types the editor uses to color-code and type-check
// wires), an optional `param` (a single inline-editable number shown on the
// node itself, e.g. "Seconds: 2" - read as node.param), and two lifecycle
// hooks the Runtime calls:
//   create(node, ctx) - once, when the node is added to the graph
//   tick(node, ctx)   - every frame, after node.inputs has been filled in
//                       from whatever is wired into it
// This is the whole "vocabulary" of the sandbox - add a new entry here to
// teach the engine a new kind of block.
//
// Two boolean-ish port types exist on purpose: `trigger` is a one-shot pulse
// (true for exactly the tick something happens, like "just touched"), while
// `boolean` is a held state (true for as long as something is the case, like
// "currently touching"). They can't be wired directly into each other - the
// "Turns On" block below is the bridge between them - which is itself a
// small, deliberate lesson about the difference between an edge and a level.

function makePokemonObjectType(spriteKey, label, color) {
  return {
    key: `object.${spriteKey}`,
    category: 'object',
    label,
    color,
    description: `${label} on the stage. Wire something into its Move dot to control it, or wire its Object dot into a Sensor to use it there.`,
    sprite: spriteKey,
    inputs: [{ id: 'move', label: 'Move', type: 'vector2', default: { x: 0, y: 0 } }],
    outputs: [
      { id: 'obj', label: 'Object', type: 'object' },
      { id: 'pos', label: 'Position', type: 'vector2' },
    ],
    create(node, ctx) {
      const spawn = node.spawn || { x: 80 + Math.random() * 480, y: 60 + Math.random() * 240 };
      node.gameObject = ctx.stage.spawnObject({ sprite: spriteKey, x: spawn.x, y: spawn.y, radius: 26 });
      node.outputs.obj = node.gameObject.id;
    },
    reset(node, ctx) {
      const spawn = node.spawn || { x: node.gameObject.spawnX, y: node.gameObject.spawnY };
      ctx.stage.resetObject(node.gameObject.id, spawn.x, spawn.y);
    },
    tick(node, ctx) {
      const move = node.inputs.move || { x: 0, y: 0 };
      ctx.stage.moveObject(node.gameObject.id, move, ctx.dt);
      const obj = ctx.stage.getObject(node.gameObject.id);
      node.outputs.obj = node.gameObject.id;
      node.outputs.pos = { x: obj.x, y: obj.y };
    },
  };
}

export const NodeTypes = {
  'input.dpad': {
    key: 'input.dpad',
    category: 'input',
    label: 'D-Pad',
    color: '#3b82f6',
    description: "Reads your arrow keys and sends out a direction. Wire it into a Pokémon's Move dot to control it.",
    inputs: [],
    outputs: [{ id: 'dir', label: 'Direction', type: 'vector2', default: { x: 0, y: 0 } }],
    tick(node, ctx) {
      node.outputs.dir = ctx.input.getDPadVector();
    },
  },

  'object.pikachu': makePokemonObjectType('pikachu', 'Pikachu', '#eab308'),
  'object.charmander': makePokemonObjectType('charmander', 'Charmander', '#f97316'),
  'object.gengar': makePokemonObjectType('gengar', 'Gengar', '#9333ea'),

  'sensor.touch': {
    key: 'sensor.touch',
    category: 'sensor',
    label: 'Touch Sensor',
    color: '#0ea5e9',
    description: 'Watches two Pokémon. "On Touch" pulses once the instant they bump into each other; "Touching" stays ON the whole time they’re overlapping. Wire two Pokémon in, then wire whichever output fits what you’re building.',
    inputs: [
      { id: 'a', label: 'Object A', type: 'object' },
      { id: 'b', label: 'Object B', type: 'object' },
    ],
    outputs: [
      { id: 'trigger', label: 'On Touch', type: 'trigger', default: false },
      { id: 'touching', label: 'Touching', type: 'boolean', default: false },
    ],
    create(node) {
      node.state.wasTouching = false;
    },
    reset(node) {
      node.state.wasTouching = false;
    },
    tick(node, ctx) {
      const objA = ctx.stage.getObject(node.inputs.a);
      const objB = ctx.stage.getObject(node.inputs.b);
      const touching = !!(objA && objB && ctx.stage.isColliding(objA, objB));
      node.outputs.trigger = touching && !node.state.wasTouching;
      node.outputs.touching = touching;
      node.state.wasTouching = touching;
    },
  },

  'logic.timer': {
    key: 'logic.timer',
    category: 'logic',
    label: 'Repeat Timer',
    color: '#6366f1',
    description: 'Fires a trigger pulse over and over, forever, every few seconds - a loop that keeps going on its own. Wire its trigger dot into anything you want to happen automatically and repeatedly.',
    param: { id: 'seconds', label: 'Seconds', type: 'number', default: 2, min: 0.5, max: 6, step: 0.5 },
    inputs: [],
    outputs: [{ id: 'trigger', label: 'Tick', type: 'trigger', default: false }],
    create(node) {
      node.state.elapsed = 0;
    },
    reset(node) {
      node.state.elapsed = 0;
    },
    tick(node, ctx) {
      const interval = node.param ?? 2;
      node.state.elapsed += ctx.dt;
      if (node.state.elapsed >= interval) {
        node.state.elapsed -= interval;
        node.outputs.trigger = true;
      } else {
        node.outputs.trigger = false;
      }
    },
  },

  'logic.counter': {
    key: 'logic.counter',
    category: 'logic',
    label: 'Counter',
    color: '#6366f1',
    description: 'Counts each time its trigger dot fires. Once it reaches its target, it fires "Reached!" once and starts counting over from zero - perfect for "do this N times" logic, like a loop with a limit.',
    param: { id: 'target', label: 'Count to', type: 'number', default: 3, min: 1, max: 20, step: 1 },
    inputs: [{ id: 'trigger', label: 'Count', type: 'trigger' }],
    outputs: [{ id: 'done', label: 'Reached!', type: 'trigger', default: false }],
    create(node) {
      node.state.count = 0;
    },
    reset(node) {
      node.state.count = 0;
    },
    tick(node) {
      const target = node.param ?? 3;
      if (node.inputs.trigger) node.state.count += 1;
      if (node.state.count >= target) {
        node.state.count = 0;
        node.outputs.done = true;
      } else {
        node.outputs.done = false;
      }
    },
  },

  'logic.patrol': {
    key: 'logic.patrol',
    category: 'logic',
    label: 'Patrol',
    color: '#6366f1',
    description: "Automatically outputs a direction that flips back and forth every couple of seconds - a loop that runs forever. Wire it into a Pokémon's Move dot to make it patrol on its own, no key presses needed.",
    param: { id: 'seconds', label: 'Seconds', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.5 },
    inputs: [],
    outputs: [{ id: 'dir', label: 'Direction', type: 'vector2', default: { x: 0, y: 0 } }],
    create(node) {
      node.state.elapsed = 0;
      node.state.goingRight = true;
    },
    reset(node) {
      node.state.elapsed = 0;
      node.state.goingRight = true;
    },
    tick(node, ctx) {
      const interval = node.param ?? 1.5;
      node.state.elapsed += ctx.dt;
      if (node.state.elapsed >= interval) {
        node.state.elapsed -= interval;
        node.state.goingRight = !node.state.goingRight;
      }
      node.outputs.dir = { x: node.state.goingRight ? 1 : -1, y: 0 };
    },
  },

  'logic.and': {
    key: 'logic.and',
    category: 'logic',
    label: 'AND Gate',
    color: '#0d9488',
    description: 'Stays ON only while BOTH of its inputs are ON at the same time. Use it for "only if these two things are both true."',
    inputs: [
      { id: 'a', label: 'A', type: 'boolean', default: false },
      { id: 'b', label: 'B', type: 'boolean', default: false },
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean', default: false }],
    tick(node) {
      node.outputs.result = !!(node.inputs.a && node.inputs.b);
    },
  },

  'logic.or': {
    key: 'logic.or',
    category: 'logic',
    label: 'OR Gate',
    color: '#0d9488',
    description: 'Turns ON while EITHER of its inputs is ON. Use it for "if this happens, or that happens."',
    inputs: [
      { id: 'a', label: 'A', type: 'boolean', default: false },
      { id: 'b', label: 'B', type: 'boolean', default: false },
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean', default: false }],
    tick(node) {
      node.outputs.result = !!(node.inputs.a || node.inputs.b);
    },
  },

  'logic.not': {
    key: 'logic.not',
    category: 'logic',
    label: 'NOT Gate',
    color: '#0d9488',
    description: 'Flips its input: ON becomes OFF, and OFF becomes ON. Use it to say "only while NOT touching," for example.',
    inputs: [{ id: 'a', label: 'A', type: 'boolean', default: false }],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean', default: false }],
    tick(node) {
      node.outputs.result = !node.inputs.a;
    },
  },

  'logic.onTrue': {
    key: 'logic.onTrue',
    category: 'logic',
    label: 'Turns On',
    color: '#0d9488',
    description: 'Fires a one-time trigger the instant its input switches from OFF to ON. The bridge for turning a steady "Touching" or gate result into a one-shot action.',
    inputs: [{ id: 'value', label: 'Value', type: 'boolean', default: false }],
    outputs: [{ id: 'trigger', label: 'Trigger', type: 'trigger', default: false }],
    create(node) {
      node.state.was = false;
    },
    reset(node) {
      node.state.was = false;
    },
    tick(node) {
      const now = !!node.inputs.value;
      node.outputs.trigger = now && !node.state.was;
      node.state.was = now;
    },
  },

  'state.gameover': {
    key: 'state.gameover',
    category: 'state',
    label: 'Game Over',
    color: '#ef4444',
    description: 'Ends the game the instant its trigger dot gets a signal.',
    inputs: [{ id: 'trigger', label: 'Trigger', type: 'trigger' }],
    outputs: [],
    tick(node, ctx) {
      if (node.inputs.trigger) ctx.stage.setGameOver(true);
    },
  },

  'state.win': {
    key: 'state.win',
    category: 'state',
    label: 'You Win!',
    color: '#16a34a',
    description: 'Shows a big victory screen the instant its trigger dot gets a signal.',
    inputs: [{ id: 'trigger', label: 'Trigger', type: 'trigger' }],
    outputs: [],
    tick(node, ctx) {
      if (node.inputs.trigger) ctx.stage.setWin(true);
    },
  },

  'state.score': {
    key: 'state.score',
    category: 'state',
    label: 'Score Counter',
    color: '#22c55e',
    description: 'Adds one point every time its trigger dot gets a signal.',
    inputs: [{ id: 'trigger', label: 'Add Point', type: 'trigger' }],
    outputs: [{ id: 'value', label: 'Score', type: 'number', default: 0 }],
    create(node) {
      node.state.score = 0;
    },
    reset(node) {
      node.state.score = 0;
    },
    tick(node, ctx) {
      if (node.inputs.trigger) node.state.score += 1;
      node.outputs.value = node.state.score;
      ctx.stage.setScore(node.state.score);
    },
  },
};
