// A short, kid-friendly walkthrough explaining the wiring metaphor before a
// new player gets dropped into the sandbox. Shows automatically once (per
// browser, via localStorage) and can be reopened anytime from the "How to
// Play" button in the header.
import { PortColors } from '../engine/types.js';

const PORT_LEGEND = [
  { type: 'vector2', label: 'Direction' },
  { type: 'object', label: 'Pokémon' },
  { type: 'trigger', label: 'Trigger' },
  { type: 'number', label: 'Number' },
];

const STEPS = [
  {
    emoji: '🎮',
    title: 'Two Worlds, One Game!',
    body: 'The top part is your LIVE GAME — Pikachu moves around and things happen there. The bottom part is your LOGIC BRAIN, where YOU decide what happens by connecting blocks together.',
  },
  {
    emoji: '🔌',
    title: 'If This... Then That!',
    body: 'Every block has colored dots. Drag from one dot to a matching-color dot to wire them together. A wire means "when THIS happens, do THAT" — that’s the trick behind all computer logic!',
    legend: true,
  },
  {
    emoji: '⚡',
    title: "You're the Boss!",
    body: 'Try dragging a new block in from the left, or grab a wire and drop it somewhere new. The best way to learn is to just try things and see what happens!',
  },
];

const SEEN_KEY = 'pgb_onboarding_seen';

export function shouldShowOnboardingAutomatically() {
  try {
    return !window.localStorage.getItem(SEEN_KEY);
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // private browsing / storage disabled - fine, it'll just show again next time
  }
}

function buildLegend() {
  const wrap = document.createElement('div');
  wrap.className = 'onboarding-legend';
  for (const { type, label } of PORT_LEGEND) {
    const item = document.createElement('div');
    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.background = PortColors[type];
    item.appendChild(dot);
    item.appendChild(document.createTextNode(label));
    wrap.appendChild(item);
  }
  return wrap;
}

export function showOnboarding() {
  return new Promise((resolve) => {
    let stepIndex = 0;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const card = document.createElement('div');
    card.className = 'modal-card onboarding-card';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function finish() {
      overlay.remove();
      resolve();
    }

    function render() {
      const step = STEPS[stepIndex];
      const isLast = stepIndex === STEPS.length - 1;

      card.innerHTML = `
        <div class="onboarding-emoji"></div>
        <h2 class="onboarding-title"></h2>
        <p class="onboarding-body"></p>
        <div class="onboarding-legend-slot"></div>
        <div class="onboarding-dots"></div>
        <div class="onboarding-nav">
          <button type="button" class="onboarding-skip">Skip</button>
          <div class="onboarding-nav-right"></div>
        </div>
      `;

      card.querySelector('.onboarding-emoji').textContent = step.emoji;
      card.querySelector('.onboarding-title').textContent = step.title;
      card.querySelector('.onboarding-body').textContent = step.body;

      if (step.legend) {
        card.querySelector('.onboarding-legend-slot').appendChild(buildLegend());
      }

      const dotsEl = card.querySelector('.onboarding-dots');
      STEPS.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `onboarding-dot${i === stepIndex ? ' active' : ''}`;
        dotsEl.appendChild(dot);
      });

      const navRight = card.querySelector('.onboarding-nav-right');
      if (stepIndex > 0) {
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'onboarding-back';
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', () => {
          stepIndex -= 1;
          render();
        });
        navRight.appendChild(backBtn);
      }
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'onboarding-next';
      nextBtn.textContent = isLast ? "Let's Play! ⚡" : 'Next';
      nextBtn.addEventListener('click', () => {
        if (isLast) finish();
        else {
          stepIndex += 1;
          render();
        }
      });
      navRight.appendChild(nextBtn);

      card.querySelector('.onboarding-skip').addEventListener('click', finish);
    }

    render();
  });
}
