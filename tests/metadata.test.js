import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripMetadata, jpegOrientation } from '../src/metadata.js';

const bytes = (...parts) => new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)));
const segment = (marker, ...payload) => {
  const body = bytes(...payload);
  return [0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 0xff, ...body];
};
// EXIF big-endian : orientation (0x0112) puis un faux bloc GPS (0x8825)
const exif = (orientation) => segment(0xe1, 'Exif', [0, 0], 'MM', [0, 0x2a, 0, 0, 0, 8], [0, 2],
  [0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0],
  [0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0x2a], [0, 0, 0, 0], 'GPS-SECRET');
const scan = [0xff, 0xda, 0, 4, 1, 2, 9, 8, 7, 0xff, 0xd9]; // SOS + données + EOI

function photo(orientation) {
  return bytes([0xff, 0xd8], segment(0xe0, 'JFIF', [0]), exif(orientation), segment(0xfe, 'commentaire'), scan);
}
const contains = (haystack, text) => Buffer.from(haystack).includes(Buffer.from(text));

test('jpegOrientation lit l\'orientation EXIF', () => {
  assert.equal(jpegOrientation(photo(6)), 6);
  assert.equal(jpegOrientation(bytes([0xff, 0xd8], scan)), 1);
});

test('un JPEG perd son EXIF (GPS compris) et son commentaire, sans toucher à l\'image', () => {
  const clean = stripMetadata(photo(1), 'image/jpeg');
  assert.equal(contains(clean, 'GPS-SECRET'), false);
  assert.equal(contains(clean, 'commentaire'), false);
  assert.equal(contains(clean, 'Exif'), false);
  assert.equal(contains(clean, 'JFIF'), true);
  assert.deepEqual([...clean.slice(-scan.length)], scan);
  assert.ok(clean.length < photo(1).length);
});

test('un JPEG tourné garde seulement son orientation', () => {
  const clean = stripMetadata(photo(6), 'image/jpeg');
  assert.equal(contains(clean, 'GPS-SECRET'), false);
  assert.equal(jpegOrientation(clean), 6);
});

test('un PNG perd ses blocs texte et EXIF, garde ses blocs d\'image', () => {
  const chunk = (type, data) => {
    const body = bytes(data);
    return [0, 0, 0, body.length, ...bytes(type), ...body, 0, 0, 0, 0];
  };
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const png = bytes(signature, chunk('IHDR', 'header'), chunk('tEXt', 'Author\0Moi'), chunk('eXIf', 'GPS-SECRET'),
    chunk('IDAT', 'pixels'), chunk('IEND', ''));
  const clean = stripMetadata(png, 'image/png');
  assert.equal(contains(clean, 'GPS-SECRET'), false);
  assert.equal(contains(clean, 'Author'), false);
  assert.equal(contains(clean, 'IHDR'), true);
  assert.equal(contains(clean, 'pixels'), true);
  assert.equal(contains(clean, 'IEND'), true);
});

test('un fichier qui ne ressemble pas à son format reste tel quel', () => {
  const junk = bytes('pas une image');
  assert.equal(stripMetadata(junk, 'image/jpeg'), junk);
  assert.equal(stripMetadata(junk, 'image/webp'), junk);
});
