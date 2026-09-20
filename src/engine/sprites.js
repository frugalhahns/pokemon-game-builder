// Real sprite art is loaded live from the PokeAPI sprites repository
// (github.com/PokeAPI/sprites), a community-maintained mirror of the
// official in-game sprites - see the "About the sprites" section in the
// README for why these are fetched at runtime instead of being committed
// to this (public) repo. If a sprite hasn't finished loading yet, or the
// fetch fails (e.g. no internet connection), drawSprite() falls back to a
// simple hand-drawn placeholder shape below so the game never breaks.

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawGeneric(ctx, x, y, r) {
  ctx.fillStyle = '#94a3b8';
  circle(ctx, x, y, r);
}

function drawPikachu(ctx, x, y, r) {
  ctx.fillStyle = '#fde047';
  circle(ctx, x, y, r);
  poly(ctx, [
    [x - r * 0.9, y - r * 0.5],
    [x - r * 0.35, y - r * 0.55],
    [x - r * 0.55, y - r * 1.35],
  ]);
  poly(ctx, [
    [x + r * 0.9, y - r * 0.5],
    [x + r * 0.35, y - r * 0.55],
    [x + r * 0.55, y - r * 1.35],
  ]);
  ctx.fillStyle = '#1f2937';
  poly(ctx, [
    [x - r * 0.62, y - r * 1.0],
    [x - r * 0.5, y - r * 1.02],
    [x - r * 0.55, y - r * 1.3],
  ]);
  poly(ctx, [
    [x + r * 0.62, y - r * 1.0],
    [x + r * 0.5, y - r * 1.02],
    [x + r * 0.55, y - r * 1.3],
  ]);
  ctx.fillStyle = '#f87171';
  circle(ctx, x - r * 0.55, y + r * 0.12, r * 0.18);
  circle(ctx, x + r * 0.55, y + r * 0.12, r * 0.18);
  ctx.fillStyle = '#1f2937';
  circle(ctx, x - r * 0.24, y - r * 0.05, r * 0.09);
  circle(ctx, x + r * 0.24, y - r * 0.05, r * 0.09);
}

function drawCharmander(ctx, x, y, r) {
  ctx.fillStyle = '#fb923c';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.45, r * 0.5, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  poly(ctx, [
    [x - r * 0.15, y - r * 0.9],
    [x + r * 0.15, y - r * 0.9],
    [x, y - r * 1.5],
  ]);
  ctx.fillStyle = '#1f2937';
  circle(ctx, x - r * 0.25, y - r * 0.1, r * 0.09);
  circle(ctx, x + r * 0.25, y - r * 0.1, r * 0.09);
}

function drawGengar(ctx, x, y, r) {
  ctx.fillStyle = '#a855f7';
  circle(ctx, x, y + r * 0.1, r);
  poly(ctx, [
    [x - r * 0.5, y - r * 0.85],
    [x - r * 0.2, y - r * 0.85],
    [x - r * 0.4, y - r * 1.3],
  ]);
  poly(ctx, [
    [x + r * 0.5, y - r * 0.85],
    [x + r * 0.2, y - r * 0.85],
    [x + r * 0.4, y - r * 1.3],
  ]);
  ctx.fillStyle = '#ef4444';
  poly(ctx, [
    [x - r * 0.4, y - r * 0.15],
    [x - r * 0.15, y - r * 0.35],
    [x - r * 0.1, y - r * 0.05],
  ]);
  poly(ctx, [
    [x + r * 0.4, y - r * 0.15],
    [x + r * 0.15, y - r * 0.35],
    [x + r * 0.1, y - r * 0.05],
  ]);
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y + r * 0.35);
  ctx.quadraticCurveTo(x, y + r * 0.75, x + r * 0.45, y + r * 0.35);
  ctx.stroke();
}

const PLACEHOLDER_SPRITES = {
  pikachu: drawPikachu,
  charmander: drawCharmander,
  gengar: drawGengar,
};

// National Pokédex numbers for the sprite CDN lookup.
const POKEDEX_ID = {
  pikachu: 25,
  charmander: 4,
  gengar: 94,
};

const imageCache = new Map();
function getSpriteImage(key) {
  if (!imageCache.has(key)) {
    const id = POKEDEX_ID[key];
    const img = new Image();
    if (id) img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    imageCache.set(key, img);
  }
  return imageCache.get(key);
}

export function drawSprite(ctx, key, x, y, r) {
  const img = getSpriteImage(key);
  ctx.save();
  if (img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false; // keep the pixel-art look crisp when scaled up
    const size = r * 2.3;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else {
    const fn = PLACEHOLDER_SPRITES[key] || drawGeneric;
    fn(ctx, x, y, r);
  }
  ctx.restore();
}
