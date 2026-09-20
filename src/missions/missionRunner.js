import { MISSIONS } from './missions.js';

const PROGRESS_KEY = 'pgb_mission_progress';
const ATTEMPTS_TO_UNLOCK_HINT = 2;

function loadProgress() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveProgress(completed) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
  } catch {
    // private browsing / storage disabled - progress just won't persist
  }
}

// Drives a mission's lifecycle: clearing the canvas down to that mission's
// starting blocks, checking every frame whether the kid has actually pulled
// off the concept it teaches (not just wired something that looks right),
// and gating the hint behind a couple of tries so it has to be earned.
export class MissionRunner {
  constructor({ graph, runtime, editor, stage, onUpdate }) {
    this.graph = graph;
    this.runtime = runtime;
    this.editor = editor;
    this.stage = stage;
    this.onUpdate = onUpdate;
    this.activeIndex = -1;
    this.attempts = 0;
    this.state = null;
    this.completed = loadProgress();
  }

  get activeMission() {
    return this.activeIndex >= 0 ? MISSIONS[this.activeIndex] : null;
  }

  isHintUnlocked() {
    return this.attempts >= ATTEMPTS_TO_UNLOCK_HINT;
  }

  isCompletedId(id) {
    return this.completed.has(id);
  }

  start(index) {
    const mission = MISSIONS[index];
    if (!mission) return;
    this.activeIndex = index;
    this.attempts = 0;
    this.runtime.loadGraph({ nodes: [], connections: [] });
    this.state = mission.setup({ graph: this.graph, runtime: this.runtime, stage: this.stage }) || {};
    this.editor.renderAll();
    this.onUpdate?.();
  }

  exit() {
    this.activeIndex = -1;
    this.state = null;
    this.onUpdate?.();
  }

  // Call whenever the player completes a wire connection while a mission is
  // active - the closest generic signal we have to "the kid is trying
  // something," whether or not that attempt turns out to be the right one.
  registerAttempt() {
    if (this.activeIndex < 0 || this.completed.has(this.activeMission.id)) return;
    this.attempts += 1;
    this.onUpdate?.();
  }

  tick() {
    const mission = this.activeMission;
    if (!mission || this.completed.has(mission.id)) return;
    const done = mission.isComplete({ graph: this.graph, stage: this.stage, runtime: this.runtime }, this.state);
    if (done) {
      this.completed.add(mission.id);
      saveProgress(this.completed);
      this.onUpdate?.({ justCompleted: mission });
    }
  }
}
