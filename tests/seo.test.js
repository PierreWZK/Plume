import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const SITE = 'https://plume.projectp.fr/';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

test('la page a son adresse canonique', () => {
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}">`));
});

test('l\'aperçu du lien a son titre, sa description, son adresse et son image 1200 × 630', () => {
  assert.ok(meta('property', 'og:title'));
  assert.ok(meta('property', 'og:description'));
  assert.equal(meta('property', 'og:url'), SITE);
  assert.equal(meta('property', 'og:image'), `${SITE}og.png`);
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.ok(existsSync(new URL('../public/og.png', import.meta.url)));
});

test('les données structurées décrivent une WebApplication rattachée à ProjectP', () => {
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const data = JSON.parse(json);
  assert.equal(data['@type'], 'WebApplication');
  assert.equal(data.url, SITE);
  assert.equal(data.isPartOf.url, 'https://projectp.fr/');
});

test('le pied de page renvoie vers le défi 30 jours, 30 projets', () => {
  assert.match(html, /<footer[\s\S]*href="https:\/\/projectp\.fr\/"[\s\S]*30 jours, 30 projets[\s\S]*<\/footer>/);
});

test('robots.txt autorise l\'indexation et donne le sitemap', () => {
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Allow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${SITE}sitemap.xml`));
});

test('sitemap.xml liste la page d\'accueil', () => {
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, new RegExp(`<loc>${SITE}</loc>`));
});

test('la page a un favicon', () => {
  assert.match(html, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.ok(existsSync(new URL('../public/favicon.svg', import.meta.url)));
});
