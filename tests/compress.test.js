import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressFile } from '../src/compress.js';

const photo = new File([new Uint8Array(1000)], 'paysage.jpg', { type: 'image/jpeg' });
const settings = { level: 'balanced', toWebp: false };
// Faux encodeur : le Canvas n'existe pas dans Node, on contrôle la taille produite
const encodeTo = (size, calls = []) => async (file, output) => {
  calls.push(output);
  return new Blob([new Uint8Array(size)], { type: output.type });
};

test('compressFile encode avec le format et la qualité du niveau choisi', async () => {
  const calls = [];
  await compressFile(photo, settings, encodeTo(300, calls));
  assert.deepEqual(calls, [{ type: 'image/jpeg', quality: 0.78 }]);
});

test('compressFile rend le fichier compressé, son nom et le gain', async () => {
  const result = await compressFile(photo, settings, encodeTo(260));
  assert.equal(result.blob.size, 260);
  assert.equal(result.name, 'paysage-plume.jpg');
  assert.equal(result.before, 1000);
  assert.equal(result.after, 260);
  assert.equal(result.gain, 74);
  assert.equal(result.kept, false);
});

test('compressFile garde l\'original quand la compression ne gagne rien', async () => {
  const result = await compressFile(photo, { level: 'balanced', toWebp: true }, encodeTo(1200));
  assert.equal(result.blob, photo);
  assert.equal(result.name, 'paysage-plume.jpg');
  assert.equal(result.gain, 0);
  assert.equal(result.kept, true);
});
