import { gainPercent } from './format.js';
import { isTooLarge, keepSmaller, outputFor, outputName } from './settings.js';

/** Réencode l'image avec le Canvas : retire les métadonnées, respecte l'orientation. */
export async function encodeWithCanvas(file, { type, quality }) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (isTooLarge(bitmap.width, bitmap.height)) throw new Error('too-large');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode-failed'))), type, quality));
  } finally {
    bitmap.close();
  }
}

/** Compresse un fichier selon les réglages ; garde l'original si le résultat ne gagne rien. */
export async function compressFile(file, settings, encode = encodeWithCanvas) {
  const output = outputFor(file, settings);
  const blob = keepSmaller(file, await encode(file, output));
  const kept = blob === file;
  return {
    blob,
    name: outputName(file.name, kept ? file.type : output.type),
    before: file.size,
    after: blob.size,
    gain: gainPercent(file.size, blob.size),
    kept,
  };
}
