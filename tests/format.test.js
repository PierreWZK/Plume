import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, gainPercent, progressMessage } from '../src/format.js';

test('progressMessage annonce l\'avancement d\'un lot', () => {
  assert.equal(progressMessage(1, 3), '1 image traitée sur 3…');
  assert.equal(progressMessage(2, 3), '2 images traitées sur 3…');
});

test('progressMessage annonce la fin du lot', () => {
  assert.equal(progressMessage(3, 3), '3 images traitées sur 3. Prêtes à télécharger.');
  assert.equal(progressMessage(1, 1), '1 image traitée sur 1. Prête à télécharger.');
});

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
