import { compressFile } from './compress.js';
import { CONCURRENCY, processBatch } from './batch.js';
import { formatBytes, progressMessage } from './format.js';
import { createPool } from './pool.js';
import { initReveal } from './reveal.js';
import { LEVELS, canEncodeWebp, errorMessage, isSupported, suggestWebp } from './settings.js';

initReveal();

const drop = document.getElementById('drop');
const input = document.getElementById('files');
const results = document.getElementById('results');
const status = document.getElementById('status');
const form = document.getElementById('settings');
const levelHint = document.getElementById('level-hint');
const webp = document.getElementById('webp');
const webpHint = document.getElementById('webp-hint');

let lastFiles = [];
let run = 0; // un changement de réglage pendant un lot rend ses résultats obsolètes

const readSettings = () => ({ level: form.elements.level.value, toWebp: webp.checked });

function updateHints() {
  levelHint.textContent = LEVELS[form.elements.level.value].hint;
  if (!webp.disabled) {
    webpHint.textContent = webp.checked
      ? 'Activé : toutes les images sortent en WebP, plus léger.'
      : "Désactivé : chaque image garde son format d'origine.";
  }
}

if (!canEncodeWebp()) {
  webp.disabled = true;
  webpHint.textContent = 'Votre navigateur ne sait pas créer de WebP : chaque image garde son format.';
}
updateHints();
form.addEventListener('change', () => {
  updateHints();
  if (lastFiles.length) handle(lastFiles);
});

// CONCURRENCY workers ; sans worker, ou si un worker plante, la page prend le relais
const workers = typeof Worker === 'undefined'
  ? []
  : Array.from({ length: CONCURRENCY }, () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }));
const runInPool = createPool(workers, ({ file, settings }) => compressFile(file, settings));
const compress = (file, settings) => runInPool({ file, settings });

// Adresses blob: du lot affiché, libérées quand il est remplacé
let urls = [];

function render(item, file, result, settings) {
  const url = URL.createObjectURL(result.blob);
  urls.push(url);
  const tip = suggestWebp(file, settings) && !webp.disabled
    ? '<p class="tip">Astuce : un PNG gagne peu. Activez «&nbsp;Convertir en WebP&nbsp;» pour l\'alléger vraiment.</p>'
    : '';
  item.innerHTML = `
    <img src="${url}" alt="" width="96" height="96">
    <span class="name"></span>
    <span class="sizes">${formatBytes(result.before)} → ${formatBytes(result.after)}</span>
    <span class="gain">${result.kept ? 'Déjà optimisée' : `−${result.gain} %`}</span>
    <a class="download" href="${url}">Télécharger</a>${tip}`;
  // Noms fournis par l'utilisateur : jamais dans le HTML
  item.querySelector('.name').textContent = file.name;
  item.querySelector('.download').download = result.name;
  item.querySelector('.download').setAttribute('aria-label', `Télécharger ${result.name}`);
}

// Un format refusé devient une erreur de son image, sans bloquer les autres
const checkedCompress = (file, options) =>
  isSupported(file.type) ? compress(file, options) : Promise.reject(new Error('unsupported'));

function renderError(item, file, code) {
  item.classList.add('error');
  item.innerHTML = '<span class="name"></span><span class="message"></span>';
  item.querySelector('.name').textContent = file.name;
  item.querySelector('.message').textContent = errorMessage(code);
}

async function handle(files) {
  const current = ++run;
  const settings = readSettings();
  lastFiles = [...files];
  const items = lastFiles.map((file) => {
    const item = document.createElement('li');
    item.textContent = `${file.name} · en attente…`;
    return item;
  });
  results.replaceChildren(...items);

  const outcomes = await processBatch(lastFiles, settings, checkedCompress, (done, total) => {
    if (current === run) status.textContent = progressMessage(done, total);
  });
  if (current !== run) return;
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls = [];
  outcomes.forEach((outcome, i) => {
    if (outcome.error) renderError(items[i], lastFiles[i], outcome.error);
    else render(items[i], lastFiles[i], outcome, settings);
  });
}

input.addEventListener('change', () => input.files.length && handle(input.files));
drop.addEventListener('dragover', (event) => {
  event.preventDefault();
  drop.classList.add('over');
});
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (event) => {
  event.preventDefault();
  drop.classList.remove('over');
  if (event.dataTransfer.files.length) handle(event.dataTransfer.files);
});
