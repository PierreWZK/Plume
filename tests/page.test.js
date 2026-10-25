import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const has = (pattern) => assert.match(html, pattern);

test('la logique retrouve tous ses éléments (ids inchangés)', () => {
  for (const id of ['drop', 'files', 'settings', 'level-hint', 'webp', 'webp-hint', 'status', 'results']) {
    has(new RegExp(`id="${id}"`));
  }
  has(/<input type="file" id="files"[^>]*multiple/);
  has(/name="level" value="balanced" checked/);
  has(/class="compare"/);
});

test('l\'en-tête a la marque, une navigation vers les sections et un bouton qui ouvre le choix de fichiers', () => {
  has(/<header[\s\S]*class="brand"[\s\S]*<\/header>/);
  has(/<nav aria-label="Principale">[\s\S]*href="#outil"[\s\S]*href="#confidentialite"[\s\S]*<\/nav>/);
  has(/<label for="files" class="cta">/);
});

test('le héros a le titre, l\'accroche, trois atouts et la scène de dépôt', () => {
  has(/<h1>Des photos plus légères\.<em>Sans rien envoyer\.<\/em><\/h1>/);
  has(/class="points"[\s\S]*Rapide[\s\S]*Privé[\s\S]*Net/);
  const stage = html.slice(html.indexOf('class="stage"'), html.indexOf('</section>', html.indexOf('class="stage"')));
  for (const part of ['id="drop"', 'class="compare"', 'class="gain-card"', 'class="file-card"']) assert.ok(stage.includes(part), part);
});

test('les sections outil et confidentialité existent, avec des chiffres mesurés', () => {
  has(/<section[^>]*id="outil"/);
  has(/<section(?=[^>]*id="confidentialite")(?=[^>]*class="dark")[^>]*>/);
  has(/−62 %/);
  has(/40 Mpx/);
});
