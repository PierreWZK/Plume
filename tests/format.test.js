import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, gainPercent } from '../src/format.js';

test('formatBytes affiche les petits fichiers en octets', () => {
  assert.equal(formatBytes(0), '0 o');
  assert.equal(formatBytes(512), '512 o');
});

test('formatBytes passe en Ko avec une virgule décimale', () => {
  assert.equal(formatBytes(1536), '1,5 Ko');
});

test('formatBytes passe en Mo au-delà de 1024 Ko', () => {
  assert.equal(formatBytes(2.4 * 1024 * 1024), '2,4 Mo');
});

test('formatBytes arrondit sans décimale à partir de 100', () => {
  assert.equal(formatBytes(612 * 1024), '612 Ko');
});

test('gainPercent donne le gain arrondi en pourcentage', () => {
  assert.equal(gainPercent(1000, 260), 74);
});

test('gainPercent vaut 0 sans gain ni fichier', () => {
  assert.equal(gainPercent(1000, 1000), 0);
  assert.equal(gainPercent(0, 0), 0);
});
