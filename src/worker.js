// Compression hors de la page : l'interface reste fluide pendant un lot
import { compressFile } from './compress.js';

self.onmessage = async ({ data }) => {
  try {
    const result = await compressFile(data.file, data.settings);
    self.postMessage({ id: data.id, result });
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message });
  }
};
