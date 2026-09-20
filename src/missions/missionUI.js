import { MISSIONS } from './missions.js';

export function initMissionsUI({ missionRunner, onExitToFreePlay }) {
  const missionsBtn = document.getElementById('missions-btn');
  const bar = document.getElementById('mission-bar');
  let hintVisible = false;

  function renderBar() {
    const mission = missionRunner.activeMission;
    if (!mission) {
      bar.hidden = true;
      hintVisible = false;
      return;
    }
    bar.hidden = false;
    const isDone = missionRunner.isCompletedId(mission.id);
    const hintUnlocked = missionRunner.isHintUnlocked();

    bar.innerHTML = `
      <div class="mission-info">
        <span class="mission-emoji"></span>
        <div>
          <div class="mission-title"></div>
          <div class="mission-blurb"></div>
          <p class="mission-hint-text" hidden></p>
        </div>
      </div>
      <div class="mission-actions">
        <span class="mission-done" hidden>✅ Complete!</span>
        <button type="button" class="mission-hint-btn"></button>
        <button type="button" class="mission-next-btn" hidden>Next ▶</button>
        <button type="button" class="mission-exit-btn">Exit</button>
      </div>
    `;

    bar.querySelector('.mission-emoji').textContent = mission.emoji;
    bar.querySelector('.mission-title').textContent = `${mission.title} — ${mission.concept}`;
    bar.querySelector('.mission-blurb').textContent = mission.blurb;

    const hintTextEl = bar.querySelector('.mission-hint-text');
    hintTextEl.textContent = mission.hint;
    hintTextEl.hidden = !hintVisible;

    const hintBtn = bar.querySelector('.mission-hint-btn');
    hintBtn.textContent = hintUnlocked ? (hintVisible ? '💡 Hide Hint' : '💡 Show Hint') : '🔒 Hint (keep trying!)';
    hintBtn.disabled = !hintUnlocked;
    hintBtn.addEventListener('click', () => {
      hintVisible = !hintVisible;
      renderBar();
    });

    if (isDone) {
      bar.querySelector('.mission-done').hidden = false;
      const nextBtn = bar.querySelector('.mission-next-btn');
      nextBtn.hidden = false;
      const nextIndex = missionRunner.activeIndex + 1;
      nextBtn.textContent = nextIndex < MISSIONS.length ? 'Next Mission ▶' : 'All Done! 🎉';
      nextBtn.addEventListener('click', () => {
        if (nextIndex < MISSIONS.length) {
          missionRunner.start(nextIndex);
        } else {
          missionRunner.exit();
          onExitToFreePlay();
        }
        renderBar();
      });
    }

    bar.querySelector('.mission-exit-btn').addEventListener('click', () => {
      missionRunner.exit();
      onExitToFreePlay();
      renderBar();
    });
  }

  function openMissionSelect() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const card = document.createElement('div');
    card.className = 'modal-card mission-select-card';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    card.innerHTML = `
      <p class="modal-message">🎯 Pick a Mission</p>
      <div class="mission-list"></div>
      <div class="modal-actions"><button type="button" class="modal-cancel">Close</button></div>
    `;

    const list = card.querySelector('.mission-list');
    MISSIONS.forEach((mission, index) => {
      const done = missionRunner.isCompletedId(mission.id);
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'mission-list-item';
      item.innerHTML = `
        <span class="mission-list-emoji"></span>
        <span class="mission-list-text">
          <span class="mission-list-title"></span>
          <span class="mission-list-concept"></span>
        </span>
        <span class="mission-list-check">${done ? '✅' : ''}</span>
      `;
      item.querySelector('.mission-list-emoji').textContent = mission.emoji;
      item.querySelector('.mission-list-title').textContent = mission.title;
      item.querySelector('.mission-list-concept').textContent = mission.concept;
      item.addEventListener('click', () => {
        missionRunner.start(index);
        overlay.remove();
        renderBar();
      });
      list.appendChild(item);
    });

    card.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());
  }

  missionsBtn.addEventListener('click', openMissionSelect);
  missionRunner.onUpdate = renderBar;
  renderBar();
}
