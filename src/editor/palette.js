// The sidebar of draggable-in-spirit block buttons. Clicking a button spawns
// a fresh instance of that node type onto the Programming Canvas.
const GROUP_LABELS = {
  input: 'Inputs',
  object: 'Pokémon',
  sensor: 'Sensors',
  state: 'Game State',
};

export function buildPalette(container, nodeEditor, nodeTypes) {
  container.innerHTML = '';
  let spawnCount = 0;

  for (const groupKey of Object.keys(GROUP_LABELS)) {
    const defs = Object.entries(nodeTypes).filter(([, def]) => def.category === groupKey);
    if (defs.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'palette-group';
    const heading = document.createElement('h3');
    heading.textContent = GROUP_LABELS[groupKey];
    section.appendChild(heading);

    for (const [key, def] of defs) {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.style.borderColor = def.color;
      btn.title = def.description || '';

      const title = document.createElement('span');
      title.className = 'palette-btn-title';
      title.textContent = def.label;
      btn.appendChild(title);

      if (def.description) {
        const desc = document.createElement('span');
        desc.className = 'palette-btn-desc';
        desc.textContent = def.description;
        btn.appendChild(desc);
      }

      btn.addEventListener('click', () => {
        // Stagger new blocks into open space below the starter graph so
        // they never spawn stacked invisibly on top of an existing block.
        const x = 30 + (spawnCount % 5) * 190;
        const y = 460 + Math.floor(spawnCount / 5) * 40;
        spawnCount += 1;
        nodeEditor.addNode(key, x, y);
      });
      section.appendChild(btn);
    }

    container.appendChild(section);
  }
}
