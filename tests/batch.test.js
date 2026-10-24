import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processBatch } from '../src/batch.js';

const file = (name, size = 1000) => new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
const settings = { level: 'balanced', toWebp: false };
// Faux traitement : chaque image pèse la moitié, sauf « lourde.jpg » qui échoue
const fakeCompress = async (f) => {
  if (f.name === 'lourde.jpg') throw new Error('too-large');
  return { name: f.name, before: f.size, after: f.size / 2 };
};

test('processBatch rend les résultats dans l\'ordre des fichiers', async () => {
  const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')];
  const results = await processBatch(files, settings, fakeCompress);
  assert.deepEqual(results.map((r) => r.name), ['a.jpg', 'b.jpg', 'c.jpg']);
});

test('processBatch ne lance jamais plus de 3 compressions à la fois', async () => {
  let running = 0;
  let peak = 0;
  const slow = async (f) => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, 5));
    running--;
    return { name: f.name, before: 1, after: 1 };
  };
  const files = Array.from({ length: 20 }, (_, i) => file(`${i}.jpg`));
  await processBatch(files, settings, slow);
  assert.equal(peak, 3);
});

test('processBatch signale la progression après chaque image', async () => {
  const seen = [];
  await processBatch([file('a.jpg'), file('b.jpg')], settings, fakeCompress, (done, total) => seen.push([done, total]));
  assert.deepEqual(seen, [[1, 2], [2, 2]]);
});

test('processBatch isole l\'erreur d\'une image sans bloquer les autres', async () => {
  const files = [file('a.jpg'), file('lourde.jpg'), file('c.jpg')];
  const results = await processBatch(files, settings, fakeCompress);
  assert.equal(results[0].name, 'a.jpg');
  assert.equal(results[1].error, 'too-large');
  assert.equal(results[1].name, 'lourde.jpg');
  assert.equal(results[2].name, 'c.jpg');
});

test('processBatch garde le nom de sortie calculé par la compression', async () => {
  const rename = async (f) => ({ name: f.name.replace('.jpg', '-plume.webp'), before: 1, after: 1 });
  const [result] = await processBatch([file('a.jpg')], settings, rename);
  assert.equal(result.name, 'a-plume.webp');
});

test('processBatch accepte un lot vide', async () => {
  assert.deepEqual(await processBatch([], settings, fakeCompress), []);
});
