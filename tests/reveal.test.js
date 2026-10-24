import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curtainPosition } from '../src/reveal.js';

const viewport = 1000;
const height = 400;

test('le rideau est à 15 % tant que le centre du comparateur est sous le bas de l\'écran', () => {
  assert.equal(curtainPosition({ top: 800, height }, viewport), 15); // centre au bas de l'écran
  assert.equal(curtainPosition({ top: 1000, height }, viewport), 15);
});

test('le rideau est à 85 % quand le centre du comparateur atteint le milieu de l\'écran', () => {
  assert.equal(curtainPosition({ top: 300, height }, viewport), 85);
  assert.equal(curtainPosition({ top: -400, height }, viewport), 85);
});

test('le rideau avance avec le défilement entre les deux', () => {
  assert.equal(curtainPosition({ top: 550, height }, viewport), 50); // centre aux trois quarts
});

test('le rideau reste au milieu si le mouvement réduit est demandé', () => {
  assert.equal(curtainPosition({ top: 1000, height }, viewport, { reduced: true }), 50);
});
