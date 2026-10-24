import { gainPercent } from './format.js';
import { stripMetadata } from './metadata.js';
import { isTooLarge, keepSmaller, outputFor, outputName } from './settings.js';

// OffscreenCanvas existe dans les workers ; la page utilise un canvas classique
function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  return Object.assign(document.createElement('canvas'), { width, height });
}

const toBlob = (canvas, options) =>
  canvas.convertToBlob
    ? canvas.convertToBlob(options)
    : new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode-failed'))), options.type, options.quality));

/** Réencode l'image avec le Canvas : retire les métadonnées, respecte l'orientation. */
export async function encodeWithCanvas(file, { type, quality }) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (isTooLarge(bitmap.width, bitmap.height)) throw new Error('too-large');
    const canvas = makeCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    return await toBlob(canvas, { type, quality });
  } finally {
    bitmap.close();
  }
}

/** Compresse un fichier selon les réglages ; garde l'original, nettoyé, si le résultat ne gagne rien. */
export async function compressFile(file, settings, encode = encodeWithCanvas) {
  const output = outputFor(file, settings);
  const smaller = keepSmaller(file, await encode(file, output));
  const kept = smaller === file;
  const blob = kept
    ? new Blob([stripMetadata(new Uint8Array(await file.arrayBuffer()), file.type)], { type: file.type })
    : smaller;
  return {
    blob,
    name: outputName(file.name, kept ? file.type : output.type),
    before: file.size,
    after: blob.size,
    gain: gainPercent(file.size, blob.size),
    kept,
  };
}
