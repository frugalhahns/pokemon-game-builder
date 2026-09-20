// Turns held keyboard keys into a normalized D-Pad direction vector, the way
// a real controller's D-Pad would report movement to a Controller Input block.
export class InputManager {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }

  getDPadVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) y += 1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }
}
