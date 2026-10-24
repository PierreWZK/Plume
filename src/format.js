const UNITS = ['o', 'Ko', 'Mo', 'Go'];

/** Poids lisible en français : « 512 o », « 1,5 Ko », « 2,4 Mo ». */
export function formatBytes(bytes) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: digits })} ${UNITS[unit]}`;
}

/** Annonce lue par les lecteurs d'écran pendant et après un lot. */
export function progressMessage(done, total) {
  const images = `${done} image${done > 1 ? 's' : ''} traitée${done > 1 ? 's' : ''} sur ${total}`;
  if (done < total) return `${images}…`;
  return `${images}. Prête${total > 1 ? 's' : ''} à télécharger.`;
}

/** Gain en pourcentage entier, 0 s'il n'y a rien à gagner. */
export function gainPercent(before, after) {
  if (before <= 0 || after >= before) return 0;
  return Math.round((1 - after / before) * 100);
}
