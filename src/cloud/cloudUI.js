// Wires the cloud-save toolbar (sign in, save, load, delete) up to Firebase
// and to the running Graph/Runtime/NodeEditor. Kept separate from main.js
// the same way the node editor and palette are, since it's its own concern.
import { onAuthChange, signIn, signOut, saveGame, listSaves, deleteSave } from './firebase.js';
import { showPrompt, showConfirm } from '../ui/modal.js';

export function initCloudUI({ graph, runtime, editor }) {
  const signinBtn = document.getElementById('signin-btn');
  const signedInControls = document.getElementById('signed-in-controls');
  const userNameEl = document.getElementById('user-name');
  const saveBtn = document.getElementById('save-btn');
  const loadSelect = document.getElementById('load-select');
  const deleteBtn = document.getElementById('delete-save-btn');
  const signoutBtn = document.getElementById('signout-btn');
  const statusEl = document.getElementById('cloud-status');

  let currentUser = null;
  let saves = [];

  function setStatus(text) {
    statusEl.textContent = text;
    if (text) setTimeout(() => { if (statusEl.textContent === text) statusEl.textContent = ''; }, 4000);
  }

  function renderSaveOptions() {
    loadSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = saves.length ? 'Load a saved game…' : 'No saved games yet';
    loadSelect.appendChild(placeholder);
    for (const save of saves) {
      const option = document.createElement('option');
      option.value = save.id;
      option.textContent = save.name;
      loadSelect.appendChild(option);
    }
    deleteBtn.hidden = true;
  }

  async function refreshSaves() {
    if (!currentUser) return;
    saves = await listSaves(currentUser.uid);
    renderSaveOptions();
  }

  onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
      signinBtn.hidden = true;
      signedInControls.hidden = false;
      userNameEl.textContent = `👋 ${user.displayName || user.email}`;
      await refreshSaves();
    } else {
      signinBtn.hidden = false;
      signedInControls.hidden = true;
      saves = [];
    }
  });

  signinBtn.addEventListener('click', async () => {
    try {
      await signIn();
    } catch (err) {
      setStatus('Sign-in failed. Try again?');
      console.error(err);
    }
  });

  signoutBtn.addEventListener('click', () => signOut());

  saveBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    const name = await showPrompt('Name this save:', `My Game ${saves.length + 1}`);
    if (!name) return;
    saveBtn.disabled = true;
    try {
      await saveGame(currentUser.uid, name, graph.toJSON());
      await refreshSaves();
      setStatus(`Saved "${name}"!`);
    } catch (err) {
      setStatus('Save failed. Try again?');
      console.error(err);
    } finally {
      saveBtn.disabled = false;
    }
  });

  loadSelect.addEventListener('change', () => {
    const saveId = loadSelect.value;
    deleteBtn.hidden = !saveId;
    if (!saveId) return;
    const save = saves.find((s) => s.id === saveId);
    if (!save) return;
    runtime.loadGraph(save.graph);
    editor.renderAll();
    setStatus(`Loaded "${save.name}"!`);
  });

  deleteBtn.addEventListener('click', async () => {
    if (!currentUser || !loadSelect.value) return;
    const save = saves.find((s) => s.id === loadSelect.value);
    if (!save || !(await showConfirm(`Delete "${save.name}"? This can't be undone.`))) return;
    await deleteSave(currentUser.uid, save.id);
    await refreshSaves();
    setStatus(`Deleted "${save.name}".`);
  });
}
