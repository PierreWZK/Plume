import { compressFile } from './compress.js';
import { formatBytes } from './format.js';
import { DEFAULT_LEVEL } from './settings.js';

const drop = document.getElementById('drop');
const input = document.getElementById('files');
const results = document.getElementById('results');
const settings = { level: DEFAULT_LEVEL, toWebp: false };

async function handle(file) {
  const item = document.createElement('li');
  item.textContent = `${file.name} · compression…`;
  results.replaceChildren(item);

  const result = await compressFile(file, settings);
  const url = URL.createObjectURL(result.blob);
  item.innerHTML = `
    <img src="${url}" alt="" width="96" height="96">
    <span class="name"></span>
    <span class="sizes">${formatBytes(result.before)} → ${formatBytes(result.after)}</span>
    <span class="gain">${result.kept ? 'Déjà optimisée' : `−${result.gain} %`}</span>
    <a class="download" href="${url}">Télécharger</a>`;
  item.querySelector('.name').textContent = file.name; // nom fourni par l'utilisateur : jamais en HTML
  item.querySelector('.download').download = result.name;
}

input.addEventListener('change', () => input.files[0] && handle(input.files[0]));
drop.addEventListener('dragover', (event) => event.preventDefault());
drop.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) handle(file);
});
