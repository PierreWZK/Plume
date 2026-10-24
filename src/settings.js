export const LEVELS = {
  quality: { label: 'Qualité max', quality: 0.9, hint: 'Fichiers un peu plus lourds, aucune perte visible.' },
  balanced: { label: 'Équilibré', quality: 0.78, hint: 'Le meilleur compromis pour le web.' },
  light: { label: 'Poids min', quality: 0.6, hint: 'Fichiers très légers, légère perte possible.' },
};

export const DEFAULT_LEVEL = 'balanced';

// Au-delà, le Canvas risque de saturer la mémoire de l'onglet
export const MAX_PIXELS = 40_000_000;

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const isSupported = (type) => type in EXTENSIONS;

export const isTooLarge = (width, height) => width * height > MAX_PIXELS;

/** Format et qualité de sortie : le format d'origine, sauf conversion WebP. */
export function outputFor(file, { level, toWebp }) {
  return { type: toWebp ? 'image/webp' : file.type, quality: LEVELS[level].quality };
}

/** « paysage.jpg » → « paysage-plume.jpg » ; l'extension suit le format de sortie s'il a changé. */
export function outputName(name, type) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : '';
  const sameFormat = EXTENSIONS[type] === ext.toLowerCase().replace('jpeg', 'jpg');
  return `${base}-plume.${sameFormat ? ext : EXTENSIONS[type]}`;
}

/** Jamais plus lourd : le résultat ne remplace l'original que s'il pèse moins. */
export const keepSmaller = (original, compressed) => (compressed.size < original.size ? compressed : original);

const ERRORS = {
  'too-large': 'Image trop grande : plus de 40 mégapixels.',
  unsupported: 'Format non pris en charge : JPG, PNG ou WEBP uniquement.',
};

/** Message affiché sous l'image ; une erreur inconnue vient du décodage. */
export const errorMessage = (code) => ERRORS[code] ?? 'Image illisible ou endommagée.';

/** Le navigateur sait-il produire du WebP ? Sinon il renvoie du PNG à la place (Safari). */
export function canEncodeWebp(makeCanvas = () => document.createElement('canvas')) {
  return makeCanvas().toDataURL('image/webp').startsWith('data:image/webp');
}

/** Un PNG réencodé en PNG gagne peu : on propose WebP. */
export const suggestWebp = (file, { toWebp }) => file.type === 'image/png' && !toWebp;
