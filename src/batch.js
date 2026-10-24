// Nombre de compressions simultanées : assez pour occuper le processeur, pas assez pour saturer la mémoire
export const CONCURRENCY = 3;

/**
 * Compresse un lot dans l'ordre des fichiers, CONCURRENCY à la fois.
 * Une image en erreur ne bloque pas les autres : elle reçoit `error`.
 */
export async function processBatch(files, settings, compress, onProgress = () => {}) {
  const results = new Array(files.length);
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < files.length) {
      const index = next++;
      const file = files[index];
      try {
        results[index] = await compress(file, settings);
      } catch (error) {
        results[index] = { name: file.name, error: error.message };
      }
      onProgress(++done, files.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
  return results;
}
