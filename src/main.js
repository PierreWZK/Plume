import { compressFile } from './compress.js';
import { CONCURRENCY, processBatch } from './batch.js';
import { formatBytes } from './format.js';
import { DEFAULT_LEVEL, isSupported } from './settings.js';

const drop = document.getElementById('drop');
const input = document.getElementById('files');
const results = document.getElementById('results');
const settings = { level: DEFAULT_LEVEL, toWebp: false };

// Une compression par worker, au plus CONCURRENCY à la fois : un worker libre est toujours disponible
function makeCompressor() {
  if (typeof Worker === 'undefined') return compressFile;
  const idle = Array.from({ length: CONCURRENCY }, () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }));
  const pending = new Map();
  let nextId = 0;
  for (const worker of idle) {
    worker.onmessage = ({ data }) => {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      idle.push(worker);
      data.error ? reject(new Error(data.error)) : resolve(data.result);
    };
  }
  return (file, options) => new Promise((resolve, reject) => {
    const worker = idle.pop();
    const id = nextId++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, file, settings: options });
  });
}

const compress = makeCompressor();

function render(item, file, result) {
  const url = URL.createObjectURL(result.blob);
  item.innerHTML = `
    <img src="${url}" alt="" width="96" height="96">
    <span class="name"></span>
    <span class="sizes">${formatBytes(result.before)} → ${formatBytes(result.after)}</span>
    <span class="gain">${result.kept ? 'Déjà optimisée' : `−${result.gain} %`}</span>
    <a class="download" href="${url}" download="${result.name}">Télécharger</a>`;
  item.querySelector('.name').textContent = file.name; // nom fourni par l'utilisateur : jamais en HTML
}

async function handle(files) {
  const accepted = [...files].filter((file) => isSupported(file.type));
  const items = accepted.map((file) => {
    const item = document.createElement('li');
    item.textContent = `${file.name} · en attente…`;
    return item;
  });
  results.replaceChildren(...items);

  await processBatch(accepted, settings, compress, (done, total) => {
    results.setAttribute('aria-label', `${done} sur ${total} images traitées`);
  }).then((outcomes) => outcomes.forEach((outcome, i) => {
    outcome.error
      ? (items[i].textContent = `${accepted[i].name} · erreur : ${outcome.error}`)
      : render(items[i], accepted[i], outcome);
  }));
}

input.addEventListener('change', () => input.files.length && handle(input.files));
drop.addEventListener('dragover', (event) => event.preventDefault());
drop.addEventListener('drop', (event) => {
  event.preventDefault();
  if (event.dataTransfer.files.length) handle(event.dataTransfer.files);
});
