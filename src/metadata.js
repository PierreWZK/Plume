// Retire les métadonnées d'un fichier sans le réencoder : utilisé quand l'original est gardé
// (la compression ne gagnait rien), pour qu'il ne garde ni position GPS ni infos de l'appareil.

const JPEG_DROPPED = new Set([0xe1, 0xed, 0xfe]); // APP1 (EXIF, XMP), APP13 (IPTC), commentaire
const PNG_DROPPED = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;

/** Parcourt les segments d'un JPEG jusqu'aux données de l'image ; s'arrête si le fichier est mal formé. */
function* jpegSegments(b) {
  let pos = 2;
  while (pos + 4 <= b.length && b[pos] === 0xff) {
    const marker = b[pos + 1];
    if (marker === 0xda) return yield { marker, start: pos, end: b.length, scan: true };
    const end = pos + 2 + ((b[pos + 2] << 8) | b[pos + 3]);
    if (end > b.length) return;
    yield { marker, start: pos, end };
    pos = end;
  }
}

/** Orientation EXIF d'un JPEG (1 = droite, ou absente). */
export function jpegOrientation(b) {
  if (!isJpeg(b)) return 1;
  for (const { marker, start, end } of jpegSegments(b)) {
    const t = start + 10; // début des données TIFF, après « Exif\0\0 »
    if (marker !== 0xe1 || end < t + 8 || String.fromCharCode(...b.slice(start + 4, start + 8)) !== 'Exif') continue;
    const little = b[t] === 0x49;
    const u16 = (o) => (little ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
    const u32 = (o) => (little ? u16(o) + u16(o + 2) * 65536 : u16(o) * 65536 + u16(o + 2));
    const ifd = t + u32(t + 4);
    for (let i = 0; i < u16(ifd) && ifd + 2 + i * 12 + 12 <= end; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === 0x0112) return u16(entry + 8);
    }
  }
  return 1;
}

// Bloc EXIF minimal qui ne contient que l'orientation : sans lui, une photo prise de côté s'afficherait tournée
const orientationOnly = (o) => new Uint8Array([
  0xff, 0xe1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8,
  0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, 0, 0, 0, 0,
]);

function stripJpeg(b) {
  const orientation = jpegOrientation(b);
  const parts = [b.slice(0, 2)];
  let inserted = orientation === 1;
  let complete = false;
  for (const { marker, start, end, scan } of jpegSegments(b)) {
    if (!inserted && marker !== 0xe0) {
      parts.push(orientationOnly(orientation));
      inserted = true;
    }
    if (!JPEG_DROPPED.has(marker)) parts.push(b.slice(start, end));
    complete = Boolean(scan);
  }
  return complete ? concat(parts) : b;
}

function stripPng(b) {
  const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!SIGNATURE.every((v, i) => b[i] === v)) return b;
  const parts = [b.slice(0, 8)];
  let pos = 8;
  while (pos + 12 <= b.length) {
    const length = ((b[pos] << 24) >>> 0) + (b[pos + 1] << 16) + (b[pos + 2] << 8) + b[pos + 3];
    const type = String.fromCharCode(...b.slice(pos + 4, pos + 8));
    const end = pos + 12 + length;
    if (end > b.length) return b;
    if (!PNG_DROPPED.has(type)) parts.push(b.slice(pos, end));
    pos = end;
  }
  return concat(parts);
}

/** Copie du fichier sans ses métadonnées ; rendu tel quel si le format est inconnu ou le fichier mal formé. */
export function stripMetadata(bytes, type) {
  if (type === 'image/jpeg' && isJpeg(bytes)) return stripJpeg(bytes);
  if (type === 'image/png') return stripPng(bytes);
  // shortcut: un WebP gardé tel quel conserve ses éventuels blocs EXIF/XMP ; à traiter si des WebP d'appareil photo arrivent
  return bytes;
}
