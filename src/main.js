import { NodeTypes } from './engine/nodeTypes.js';
import { PortColors } from './engine/types.js';
import { Graph } from './engine/graph.js';
import { Stage } from './engine/stage.js';
import { InputManager } from './engine/inputManager.js';
import { Runtime } from './engine/runtime.js';
import { NodeEditor } from './editor/nodeEditor.js';
import { buildPalette } from './editor/palette.js';

const canvas = document.getElementById('stage-canvas');
const scoreEl = document.getElementById('score-display');
const overlayEl = document.getElementById('gameover-overlay');
const nodeLayer = document.getElementById('node-layer');
const wireLayer = document.getElementById('wire-layer');
const paletteEl = document.getElementById('palette');
const resetBtn = document.getElementById('reset-btn');

const graph = new Graph(NodeTypes);
const stage = new Stage(canvas, scoreEl, overlayEl);
const input = new InputManager();
const runtime = new Runtime(graph, stage, input);

const editor = new NodeEditor({
  graph,
  nodeLayer,
  wireLayer,
  portColors: PortColors,
  onAddNode: (node) => runtime.spawnNode(node),
  onRemoveNode: (node) => runtime.removeNode(node),
});

buildDefaultGraph();
runtime.init();
buildPalette(paletteEl, editor, NodeTypes);
editor.renderAll();

resetBtn.addEventListener('click', () => runtime.reset());

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  runtime.tick(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// A tiny starter game built entirely from wires, demonstrating the two
// example mechanics from the brief: D-Pad -> Pikachu movement, and a Touch
// Sensor -> Game State trigger (here for both "lose" and "score a point").
function buildDefaultGraph() {
  const dpad = graph.addNode('input.dpad', 30, 30);

  const pikachu = graph.addNode('object.pikachu', 300, 30);
  pikachu.spawn = { x: 140, y: 260 };

  const gengar = graph.addNode('object.gengar', 300, 190);
  gengar.spawn = { x: 480, y: 90 };

  const charmander = graph.addNode('object.charmander', 300, 330);
  charmander.spawn = { x: 100, y: 90 };

  const touchGengar = graph.addNode('sensor.touch', 580, 150);
  const gameOver = graph.addNode('state.gameover', 800, 150);

  const touchCharmander = graph.addNode('sensor.touch', 580, 330);
  const score = graph.addNode('state.score', 800, 330);

  graph.connect(dpad.id, 'dir', pikachu.id, 'move');

  graph.connect(pikachu.id, 'obj', touchGengar.id, 'a');
  graph.connect(gengar.id, 'obj', touchGengar.id, 'b');
  graph.connect(touchGengar.id, 'trigger', gameOver.id, 'trigger');

  graph.connect(pikachu.id, 'obj', touchCharmander.id, 'a');
  graph.connect(charmander.id, 'obj', touchCharmander.id, 'b');
  graph.connect(touchCharmander.id, 'trigger', score.id, 'trigger');
}
