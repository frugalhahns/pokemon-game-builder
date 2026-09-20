// Small styled stand-ins for window.prompt()/confirm() - native browser
// dialogs can't be styled to match the app and block page scripts while
// open, which also makes them awkward to test. Both build their markup on
// demand and resolve a promise when the user responds.
function buildOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const card = document.createElement('div');
  card.className = 'modal-card';
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  return { overlay, card };
}

export function showPrompt(message, defaultValue = '') {
  return new Promise((resolve) => {
    const { overlay, card } = buildOverlay();
    card.innerHTML = `
      <p class="modal-message"></p>
      <input type="text" class="modal-input" />
      <div class="modal-actions">
        <button type="button" class="modal-cancel">Cancel</button>
        <button type="button" class="modal-ok">OK</button>
      </div>
    `;
    card.querySelector('.modal-message').textContent = message;
    const input = card.querySelector('.modal-input');
    input.value = defaultValue;

    const finish = (result) => {
      overlay.remove();
      resolve(result);
    };
    card.querySelector('.modal-ok').addEventListener('click', () => finish(input.value.trim() || null));
    card.querySelector('.modal-cancel').addEventListener('click', () => finish(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(input.value.trim() || null);
      if (e.key === 'Escape') finish(null);
    });
    input.focus();
    input.select();
  });
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    const { overlay, card } = buildOverlay();
    card.innerHTML = `
      <p class="modal-message"></p>
      <div class="modal-actions">
        <button type="button" class="modal-cancel">Cancel</button>
        <button type="button" class="modal-ok modal-danger">Delete</button>
      </div>
    `;
    card.querySelector('.modal-message').textContent = message;
    const finish = (result) => {
      overlay.remove();
      resolve(result);
    };
    card.querySelector('.modal-ok').addEventListener('click', () => finish(true));
    card.querySelector('.modal-cancel').addEventListener('click', () => finish(false));
  });
}
