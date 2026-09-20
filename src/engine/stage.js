// The Live Sandbox Stage: owns every spawned Pokémon "game object" (just
// position + radius + sprite key), draws them each frame, and answers the
// simple physical questions node logic needs (are these two touching?).
import { drawSprite } from './sprites.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class Stage {
  constructor(canvas, scoreEl, overlayEl) {
    this.canvas = canvas;
    this.ctx2d = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.overlayEl = overlayEl;
    this.objects = new Map();
    this.gameOver = false;
    this.nextObjId = 0;
  }

  spawnObject({ sprite, x, y, radius }) {
    const id = `obj_${this.nextObjId}`;
    this.nextObjId += 1;
    const obj = { id, sprite, x, y, radius, spawnX: x, spawnY: y };
    this.objects.set(id, obj);
    return obj;
  }

  removeObject(id) {
    this.objects.delete(id);
  }

  getObject(id) {
    return this.objects.get(id) || null;
  }

  moveObject(id, dir, dt) {
    const obj = this.objects.get(id);
    if (!obj) return;
    const speed = 180; // pixels per second
    obj.x = clamp(obj.x + dir.x * speed * dt, obj.radius, this.canvas.width - obj.radius);
    obj.y = clamp(obj.y + dir.y * speed * dt, obj.radius, this.canvas.height - obj.radius);
  }

  resetObject(id, x, y) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.x = x;
      obj.y = y;
    }
  }

  isColliding(a, b) {
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    return dist < (a.radius + b.radius) * 0.8;
  }

  setScore(value) {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${value}`;
  }

  setGameOver(value) {
    this.gameOver = value;
    if (this.overlayEl) this.overlayEl.hidden = !value;
  }

  reset() {
    this.setGameOver(false);
    for (const obj of this.objects.values()) {
      obj.x = obj.spawnX;
      obj.y = obj.spawnY;
    }
  }

  render() {
    const ctx = this.ctx2d;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#eafbe7';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (const obj of this.objects.values()) {
      drawSprite(ctx, obj.sprite, obj.x, obj.y, obj.radius);
    }
  }
}
