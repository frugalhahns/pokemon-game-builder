// The Graph is the data model behind the Programming Canvas: a set of node
// instances and the wires (connections) between their ports. It knows nothing
// about pixels or dragging - that's the editor's job. It only knows how to
// add/remove nodes and wires, and how to order nodes so the runtime can
// evaluate them in the right sequence each frame.

let uidCounter = 0;
function nextId(prefix) {
  uidCounter += 1;
  return `${prefix}_${uidCounter.toString(36)}`;
}

export class Graph {
  constructor(nodeTypes) {
    this.nodeTypes = nodeTypes;
    this.nodes = new Map();
    this.connections = new Map();
  }

  getNodeDef(node) {
    return this.nodeTypes[node.typeKey];
  }

  findInputPortDef(node, portId) {
    return this.getNodeDef(node).inputs.find((p) => p.id === portId);
  }

  findOutputPortDef(node, portId) {
    return this.getNodeDef(node).outputs.find((p) => p.id === portId);
  }

  addNode(typeKey, x, y, id) {
    const def = this.nodeTypes[typeKey];
    if (!def) throw new Error(`Unknown node type: ${typeKey}`);
    const node = {
      id: id || nextId('node'),
      typeKey,
      x,
      y,
      inputs: {},
      outputs: {},
      state: {},
    };
    for (const out of def.outputs) {
      node.outputs[out.id] = out.default ?? null;
    }
    this.nodes.set(node.id, node);
    return node;
  }

  removeNode(id) {
    this.nodes.delete(id);
    for (const [connId, conn] of this.connections) {
      if (conn.fromNode === id || conn.toNode === id) this.connections.delete(connId);
    }
  }

  // fromNode/fromPort must be an OUTPUT, toNode/toPort must be an INPUT.
  // Inputs only ever accept one wire, so connecting to an already-wired
  // input silently replaces the old wire (matches Game Builder Garage).
  connect(fromNodeId, fromPort, toNodeId, toPort) {
    if (fromNodeId === toNodeId) return null;
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    if (!fromNode || !toNode) return null;

    const outDef = this.findOutputPortDef(fromNode, fromPort);
    const inDef = this.findInputPortDef(toNode, toPort);
    if (!outDef || !inDef) return null;
    if (outDef.type !== inDef.type) return null; // can only wire matching colors

    for (const [connId, conn] of this.connections) {
      if (conn.toNode === toNodeId && conn.toPort === toPort) this.connections.delete(connId);
    }

    const id = nextId('wire');
    const conn = { id, fromNode: fromNodeId, fromPort, toNode: toNodeId, toPort };
    this.connections.set(id, conn);
    return conn;
  }

  disconnect(connId) {
    this.connections.delete(connId);
  }

  getIncoming(nodeId, portId) {
    for (const conn of this.connections.values()) {
      if (conn.toNode === nodeId && conn.toPort === portId) return conn;
    }
    return null;
  }

  // Kahn's algorithm so every node's inputs are already computed by the time
  // it runs. Falls back to insertion order if the child ever wires a loop.
  topoOrder() {
    const remaining = new Map();
    for (const id of this.nodes.keys()) remaining.set(id, 0);
    for (const conn of this.connections.values()) {
      remaining.set(conn.toNode, (remaining.get(conn.toNode) || 0) + 1);
    }

    const queue = [...this.nodes.keys()].filter((id) => remaining.get(id) === 0);
    const order = [];
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      for (const conn of this.connections.values()) {
        if (conn.fromNode !== id) continue;
        remaining.set(conn.toNode, remaining.get(conn.toNode) - 1);
        if (remaining.get(conn.toNode) === 0) queue.push(conn.toNode);
      }
    }

    if (order.length < this.nodes.size) {
      for (const id of this.nodes.keys()) {
        if (!order.includes(id)) order.push(id);
      }
    }
    return order;
  }
}
