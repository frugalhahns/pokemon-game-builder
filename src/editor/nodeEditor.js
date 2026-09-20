// The Programming Canvas: renders the Graph as draggable boxes with colored
// input/output dots, lets the child drag a wire from one dot to another, and
// deletes nodes/wires on selection + Delete. Port positions are computed
// analytically from a node's (x, y) instead of measuring the DOM, so wires
// stay glued to their ports even mid-drag.
const NODE_WIDTH = 170;
const HEADER_H = 30;
const ROW_H = 26;

export class NodeEditor {
  constructor({ graph, nodeLayer, wireLayer, portColors, onAddNode, onRemoveNode, onConnect }) {
    this.graph = graph;
    this.nodeLayer = nodeLayer;
    this.wireLayer = wireLayer;
    this.portColors = portColors;
    this.onAddNode = onAddNode;
    this.onRemoveNode = onRemoveNode;
    this.onConnect = onConnect;

    this.selectedNodeId = null;
    this.selectedWireId = null;
    this.dragState = null;

    this.nodeLayer.addEventListener('mousedown', (e) => {
      if (e.target === this.nodeLayer) {
        this.selectedNodeId = null;
        this.selectedWireId = null;
        this.renderAll();
      }
    });
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('mouseup', (e) => this._onMouseUp(e));
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
  }

  addNode(typeKey, x, y) {
    const node = this.graph.addNode(typeKey, x, y);
    this.onAddNode?.(node);
    this.renderAll();
    return node;
  }

  removeSelected() {
    if (this.selectedWireId) {
      this.graph.disconnect(this.selectedWireId);
      this.selectedWireId = null;
      this.renderAll();
      return;
    }
    if (this.selectedNodeId) {
      const node = this.graph.nodes.get(this.selectedNodeId);
      if (node) {
        this.onRemoveNode?.(node);
        this.graph.removeNode(node.id);
      }
      this.selectedNodeId = null;
      this.renderAll();
    }
  }

  portPosition(node, portId, isInput) {
    const def = this.graph.getNodeDef(node);
    const idx = isInput
      ? def.inputs.findIndex((p) => p.id === portId)
      : def.inputs.length + def.outputs.findIndex((p) => p.id === portId);
    return {
      x: node.x + (isInput ? 0 : NODE_WIDTH),
      y: node.y + HEADER_H + ROW_H * idx + ROW_H / 2,
    };
  }

  renderAll() {
    this._renderNodes();
    this._renderWires();
  }

  _renderNodes() {
    this.nodeLayer.innerHTML = '';
    for (const node of this.graph.nodes.values()) {
      this.nodeLayer.appendChild(this._buildNodeEl(node));
    }
  }

  _buildNodeEl(node) {
    const def = this.graph.getNodeDef(node);
    const el = document.createElement('div');
    el.className = `node${node.id === this.selectedNodeId ? ' selected' : ''}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${NODE_WIDTH}px`;
    el.dataset.id = node.id;

    const header = document.createElement('div');
    header.className = 'node-header';
    header.style.background = def.color;
    header.textContent = def.label;
    header.addEventListener('mousedown', (e) => this._startNodeDrag(e, node));
    el.appendChild(header);

    const body = document.createElement('div');
    body.className = 'node-body';
    for (const p of def.inputs) body.appendChild(this._buildPortRow(node, p, true));
    for (const p of def.outputs) body.appendChild(this._buildPortRow(node, p, false));
    el.appendChild(body);

    return el;
  }

  _buildPortRow(node, portDef, isInput) {
    const row = document.createElement('div');
    row.className = `port-row ${isInput ? 'input' : 'output'}`;
    row.dataset.port = portDef.id;
    row.dataset.dir = isInput ? 'in' : 'out';

    const dot = document.createElement('span');
    dot.className = 'port-dot';
    dot.style.background = this.portColors[portDef.type] || '#94a3b8';
    dot.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this._startWireDrag(e, node, portDef.id, isInput);
    });

    const label = document.createElement('span');
    label.className = 'port-label';
    label.textContent = portDef.label;

    if (isInput) {
      row.appendChild(dot);
      row.appendChild(label);
    } else {
      row.appendChild(label);
      row.appendChild(dot);
    }
    return row;
  }

  _renderWires() {
    const svg = this.wireLayer;
    svg.innerHTML = '';
    for (const conn of this.graph.connections.values()) {
      const fromNode = this.graph.nodes.get(conn.fromNode);
      const toNode = this.graph.nodes.get(conn.toNode);
      if (!fromNode || !toNode) continue;
      const p1 = this.portPosition(fromNode, conn.fromPort, false);
      const p2 = this.portPosition(toNode, conn.toPort, true);
      const portDef = this.graph.findOutputPortDef(fromNode, conn.fromPort);
      const path = this._wirePath(p1, p2, this.portColors[portDef.type]);
      path.style.pointerEvents = 'stroke';
      path.style.cursor = 'pointer';
      if (conn.id === this.selectedWireId) path.classList.add('wire-selected');
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedWireId = conn.id;
        this.selectedNodeId = null;
        this.renderAll();
      });
      svg.appendChild(path);
    }

    if (this.dragState?.type === 'wire') {
      const anchor = this.dragState.fromNode
        ? this.portPosition(this.dragState.fromNode, this.dragState.fromPort, false)
        : this.portPosition(this.dragState.toNode, this.dragState.toPort, true);
      const cursor = this.dragState.cursor || anchor;
      const portDef = this.dragState.fromNode
        ? this.graph.findOutputPortDef(this.dragState.fromNode, this.dragState.fromPort)
        : this.graph.findInputPortDef(this.dragState.toNode, this.dragState.toPort);
      svg.appendChild(this._wirePath(anchor, cursor, this.portColors[portDef.type], true));
    }
  }

  _wirePath(p1, p2, color, dashed) {
    const dx = Math.max(40, Math.abs(p2.x - p1.x) * 0.5);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`);
    path.setAttribute('stroke', color || '#64748b');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    if (dashed) path.setAttribute('stroke-dasharray', '6,4');
    path.setAttribute('class', 'wire-path');
    return path;
  }

  _startNodeDrag(e, node) {
    e.preventDefault();
    e.stopPropagation();
    this.selectedNodeId = node.id;
    this.selectedWireId = null;
    this.dragState = {
      type: 'node',
      node,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
    };
    this.renderAll();
  }

  _startWireDrag(e, node, portId, isInput) {
    e.preventDefault();
    if (isInput) {
      const conn = this.graph.getIncoming(node.id, portId);
      if (conn) {
        // grabbing an already-wired input detaches it and lets you re-aim it
        this.graph.disconnect(conn.id);
        const source = this.graph.nodes.get(conn.fromNode);
        this.dragState = { type: 'wire', fromNode: source, fromPort: conn.fromPort };
        this.renderAll();
        return;
      }
      this.dragState = { type: 'wire', toNode: node, toPort: portId };
    } else {
      this.dragState = { type: 'wire', fromNode: node, fromPort: portId };
    }
  }

  _onMouseMove(e) {
    if (!this.dragState) return;
    if (this.dragState.type === 'node') {
      const { node, startX, startY, origX, origY } = this.dragState;
      node.x = Math.max(0, origX + (e.clientX - startX));
      node.y = Math.max(0, origY + (e.clientY - startY));
      this.renderAll();
    } else if (this.dragState.type === 'wire') {
      const rect = this.nodeLayer.getBoundingClientRect();
      this.dragState.cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this._renderWires();
    }
  }

  _onMouseUp(e) {
    if (this.dragState?.type === 'wire') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const portRow = el?.closest?.('.port-row');
      const nodeEl = el?.closest?.('.node');
      if (portRow && nodeEl) {
        const targetNode = this.graph.nodes.get(nodeEl.dataset.id);
        const targetPort = portRow.dataset.port;
        const targetIsInput = portRow.dataset.dir === 'in';
        if (targetNode) {
          let conn = null;
          if (this.dragState.fromNode && targetIsInput) {
            conn = this.graph.connect(this.dragState.fromNode.id, this.dragState.fromPort, targetNode.id, targetPort);
          } else if (this.dragState.toNode && !targetIsInput) {
            conn = this.graph.connect(targetNode.id, targetPort, this.dragState.toNode.id, this.dragState.toPort);
          }
          if (conn) this.onConnect?.(conn);
        }
      }
    }
    this.dragState = null;
    this.renderAll();
  }

  _onKeyDown(e) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (this.selectedNodeId || this.selectedWireId) {
      e.preventDefault();
      this.removeSelected();
    }
  }
}
