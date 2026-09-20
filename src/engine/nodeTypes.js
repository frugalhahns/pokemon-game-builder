// The registry of foundational logic blocks. Each entry describes a node's
// ports (with the data types the editor uses to color-code and type-check
// wires), plus two lifecycle hooks the Runtime calls:
//   create(node, ctx) - once, when the node is added to the graph
//   tick(node, ctx)   - every frame, after node.inputs has been filled in
//                       from whatever is wired into it
// This is the whole "vocabulary" of the sandbox - add a new entry here to
// teach the engine a new kind of block.

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
    description: 'Watches two Pokémon and sends a quick ON signal the instant they bump into each other. Wire two Pokémon in, then wire the trigger dot out to whatever should happen when they touch.',
    inputs: [
      { id: 'a', label: 'Object A', type: 'object' },
      { id: 'b', label: 'Object B', type: 'object' },
    ],
    outputs: [{ id: 'trigger', label: 'On Touch', type: 'trigger', default: false }],
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
      node.state.wasTouching = touching;
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
