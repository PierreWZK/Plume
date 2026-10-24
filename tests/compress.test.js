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
  assert.equal(result.blob.size, 1000);
  assert.equal(result.blob.type, 'image/jpeg');
  assert.equal(result.name, 'paysage-plume.jpg');
  assert.equal(result.gain, 0);
  assert.equal(result.kept, true);
});

test('l\'original gardé est rendu sans ses métadonnées (M3)', async () => {
  const exif = [...'Exif\0\0GPS-SECRET'].map((c) => c.charCodeAt(0));
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, exif.length + 2, ...exif, 0xff, 0xda, 0, 4, 1, 2, 3, 0xff, 0xd9]);
  const original = new File([jpeg], 'telephone.jpg', { type: 'image/jpeg' });
  const result = await compressFile(original, settings, encodeTo(5000));
  const bytes = Buffer.from(await result.blob.arrayBuffer());
  assert.equal(result.kept, true);
  assert.equal(bytes.includes('GPS-SECRET'), false);
  assert.ok(result.after < original.size);
});
