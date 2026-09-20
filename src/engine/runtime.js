// Bridges the Graph (what's wired to what) with the Stage (what's actually
// on screen). Each animation frame, tick(dt) walks the graph in dependency
// order, pipes each node's wired inputs in from its source node's outputs,
// and calls that node type's tick(). Movement/collision/score all fall out
// of that single pass.
export class Runtime {
  constructor(graph, stage, input) {
    this.graph = graph;
    this.stage = stage;
    this.input = input;
    this.ctx = { stage, input, graph, dt: 0 };
  }

  spawnNode(node) {
    const def = this.graph.getNodeDef(node);
    def.create?.(node, this.ctx);
    node.initialState = structuredClone(node.state);
  }

  init() {
    for (const node of this.graph.nodes.values()) this.spawnNode(node);
  }

  removeNode(node) {
    if (node.gameObject) this.stage.removeObject(node.gameObject.id);
  }

  // Tears down every current node (removing spawned game objects from the
  // stage) and rebuilds the graph from a saved snapshot.
  loadGraph(data) {
    for (const node of this.graph.nodes.values()) this.removeNode(node);
    this.stage.setScore(0);
    this.stage.setGameOver(false);
    this.graph.loadJSON(data);
    this.init();
  }

  reset() {
    this.stage.reset();
    for (const node of this.graph.nodes.values()) {
      node.state = structuredClone(node.initialState || {});
      const def = this.graph.getNodeDef(node);
      def.reset?.(node, this.ctx);
    }
  }

  tick(dt) {
    this.ctx.dt = dt;
    if (!this.stage.gameOver) {
      const order = this.graph.topoOrder();
      for (const id of order) {
        const node = this.graph.nodes.get(id);
        if (!node) continue;
        const def = this.graph.getNodeDef(node);
        for (const portDef of def.inputs) {
          const conn = this.graph.getIncoming(node.id, portDef.id);
          if (conn) {
            const source = this.graph.nodes.get(conn.fromNode);
            node.inputs[portDef.id] = source ? source.outputs[conn.fromPort] : portDef.default ?? null;
          } else {
            node.inputs[portDef.id] = portDef.default ?? null;
          }
        }
        def.tick?.(node, this.ctx);
      }
    }
    this.stage.render();
  }
}
