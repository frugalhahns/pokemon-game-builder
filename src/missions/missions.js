// Three progressive challenges, each teaching one logic concept by clearing
// the canvas down to just the blocks needed and checking for the concept
// actually working in the live game (not just that a wire exists). Mission
// 2 and 3 hand back a pre-wired D-Pad -> Pikachu connection, since movement
// is the skill Mission 1 already taught - each mission introduces exactly
// one new idea on top of what came before.
export const MISSIONS = [
  {
    id: 'move',
    emoji: '🕹️',
    title: 'Get Moving!',
    concept: 'Cause & Effect',
    blurb: 'Wire the D-Pad into Pikachu, then press the arrow keys to move him.',
    hint: 'Drag from the blue "Direction" dot on D-Pad to the blue "Move" dot on Pikachu. Then try the arrow keys!',
    setup({ graph, runtime }) {
      const dpad = graph.addNode('input.dpad', 40, 40);
      const pikachu = graph.addNode('object.pikachu', 320, 60);
      pikachu.spawn = { x: 320, y: 200 };
      runtime.spawnNode(dpad);
      runtime.spawnNode(pikachu);
      return { pikachuId: pikachu.id, spawn: { ...pikachu.spawn } };
    },
    isComplete({ graph, stage }, state) {
      const node = graph.nodes.get(state.pikachuId);
      if (!node?.gameObject) return false;
      const obj = stage.getObject(node.gameObject.id);
      if (!obj) return false;
      return Math.hypot(obj.x - state.spawn.x, obj.y - state.spawn.y) > 40;
    },
  },
  {
    id: 'danger',
    emoji: '⚠️',
    title: 'Danger Zone!',
    concept: 'If This, Then That',
    blurb: "Wire a Touch Sensor between Pikachu and Gengar, then wire the Sensor into Game Over. Walk into Gengar to test it!",
    hint: "Wire Pikachu's Object dot and Gengar's Object dot into the Touch Sensor's two Object dots. Then wire the Sensor's trigger dot into Game Over's trigger dot.",
    setup({ graph, runtime }) {
      const dpad = graph.addNode('input.dpad', 40, 40);
      const pikachu = graph.addNode('object.pikachu', 320, 40);
      pikachu.spawn = { x: 160, y: 260 };
      const gengar = graph.addNode('object.gengar', 320, 220);
      gengar.spawn = { x: 460, y: 100 };
      const sensor = graph.addNode('sensor.touch', 580, 130);
      const gameOver = graph.addNode('state.gameover', 800, 130);
      graph.connect(dpad.id, 'dir', pikachu.id, 'move');
      for (const n of [dpad, pikachu, gengar, sensor, gameOver]) runtime.spawnNode(n);
      return {};
    },
    isComplete({ stage }) {
      return stage.gameOver === true;
    },
  },
  {
    id: 'score',
    emoji: '🏆',
    title: 'Score a Point!',
    concept: 'Reuse What You Know',
    blurb: 'Same trick as before! Wire a Touch Sensor between Pikachu and Charmander, then wire it into the Score Counter.',
    hint: "Wire Pikachu and Charmander's Object dots into the Touch Sensor. Then wire the Sensor's trigger dot into the Score Counter's \"Add Point\" dot.",
    setup({ graph, runtime }) {
      const dpad = graph.addNode('input.dpad', 40, 40);
      const pikachu = graph.addNode('object.pikachu', 320, 40);
      pikachu.spawn = { x: 160, y: 260 };
      const charmander = graph.addNode('object.charmander', 320, 220);
      charmander.spawn = { x: 460, y: 100 };
      const sensor = graph.addNode('sensor.touch', 580, 130);
      const score = graph.addNode('state.score', 800, 130);
      graph.connect(dpad.id, 'dir', pikachu.id, 'move');
      for (const n of [dpad, pikachu, charmander, sensor, score]) runtime.spawnNode(n);
      return { scoreId: score.id };
    },
    isComplete({ graph }, state) {
      const node = graph.nodes.get(state.scoreId);
      return (node?.state?.score || 0) >= 1;
    },
  },
];
