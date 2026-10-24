import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LEVEL, LEVELS, canEncodeWebp, isSupported, isTooLarge, keepSmaller, outputFor, outputName, suggestWebp,
} from '../src/settings.js';

// Un navigateur qui ne sait pas encoder un format renvoie du PNG à la place (cas de Safari pour le WebP)
const canvasThatEncodes = (prefix) => () => ({ toDataURL: () => `${prefix};base64,AAAA` });

test('canEncodeWebp reconnaît un navigateur qui encode le WebP', () => {
  assert.equal(canEncodeWebp(canvasThatEncodes('data:image/webp')), true);
});

test('canEncodeWebp détecte un navigateur qui retombe sur du PNG', () => {
  assert.equal(canEncodeWebp(canvasThatEncodes('data:image/png')), false);
});

const jpeg = { name: 'paysage.jpg', type: 'image/jpeg', size: 2_000_000 };
const png = { name: 'logo.png', type: 'image/png', size: 300_000 };

test('le niveau par défaut est Équilibré', () => {
  assert.equal(DEFAULT_LEVEL, 'balanced');
});

test('chaque niveau a sa qualité d\'encodage', () => {
  assert.equal(LEVELS.quality.quality, 0.9);
  assert.equal(LEVELS.balanced.quality, 0.78);
  assert.equal(LEVELS.light.quality, 0.6);
});

test('sans conversion, le format d\'origine est gardé', () => {
  assert.deepEqual(outputFor(jpeg, { level: 'balanced', toWebp: false }), { type: 'image/jpeg', quality: 0.78 });
});

test('avec conversion, la sortie est en WebP', () => {
  assert.deepEqual(outputFor(png, { level: 'light', toWebp: true }), { type: 'image/webp', quality: 0.6 });
});

test('le nom garde celui d\'origine, suffixé de -plume', () => {
  assert.equal(outputName('paysage.jpg', 'image/jpeg'), 'paysage-plume.jpg');
  assert.equal(outputName('Photo.JPEG', 'image/jpeg'), 'Photo-plume.JPEG');
});

test('le nom prend l\'extension .webp après conversion', () => {
  assert.equal(outputName('logo.png', 'image/webp'), 'logo-plume.webp');
});

test('un nom sans extension reçoit celle du format', () => {
  assert.equal(outputName('capture', 'image/png'), 'capture-plume.png');
});

test('seuls JPEG, PNG et WebP sont acceptés', () => {
  assert.equal(isSupported('image/jpeg'), true);
  assert.equal(isSupported('image/png'), true);
  assert.equal(isSupported('image/webp'), true);
  assert.equal(isSupported('image/gif'), false);
  assert.equal(isSupported('application/pdf'), false);
});

test('une image de plus de 40 Mpx est refusée', () => {
  assert.equal(isTooLarge(8000, 5000), false); // 40 Mpx tout juste
  assert.equal(isTooLarge(8000, 5001), true);
});

test('jamais plus lourd : l\'original gagne s\'il est plus léger ou égal', () => {
  const smaller = { size: 500 };
  const bigger = { size: 900 };
  assert.equal(keepSmaller({ size: 700 }, smaller), smaller);
  assert.deepEqual(keepSmaller({ size: 700 }, bigger), { size: 700 });
  assert.deepEqual(keepSmaller({ size: 700 }, { size: 700 }), { size: 700 });
});

test('un PNG gardé en PNG déclenche le conseil WebP', () => {
  assert.equal(suggestWebp(png, { toWebp: false }), true);
  assert.equal(suggestWebp(png, { toWebp: true }), false);
  assert.equal(suggestWebp(jpeg, { toWebp: false }), false);
});
