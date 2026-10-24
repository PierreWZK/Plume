# Plan de réalisation : Plume

Référence : [CAHIER_DES_CHARGES.md](../CAHIER_DES_CHARGES.md) · direction validée : [docs/direction.html](../docs/direction.html).

## Vue d'ensemble

Un compresseur d'images 100 % navigateur : dépôt, trois niveaux, option WebP, poids avant/après, téléchargement. On construit d'abord la logique pure (testée avec `node --test`), puis un parcours complet sur une image, puis le lot, les réglages et les erreurs, et enfin l'habillage de la direction validée.

## Décisions d'architecture

- **Pas de framework** : modules ES ; Vite sert seulement au développement et au build.
- **Logique pure séparée du DOM** (`format.js`, `settings.js`) : c'est elle que testent `node --test`.
- **Compression** : `createImageBitmap` (respecte l'orientation) puis `canvas.toBlob(type, qualité)` ; dans un worker avec `OffscreenCanvas` si possible, sinon sur la page.
- **Jamais plus lourd** : on compare les tailles et on garde l'original si le résultat ne gagne rien.
- **Interface vérifiée avec Playwright** à chaque étape qui touche l'écran.

## Graphe des dépendances

```
1 Projet + tests ─► 2 Logique pure ─► 3 Parcours une image ─► 4 Lot + worker
                                                   │
                                                   ├─► 5 Réglages ─► 6 Erreurs
                                                   └─► 7 Habillage ─► 8 Mouvement ─► 9 Accessibilité ─► 10 Fin de projet
```

## Étapes

### Étape 1 · Projet et tests (S)
Mettre en place `package.json` (scripts `dev`, `build`, `preview`, `test` = `node --test`), Vite en dépendance de développement, un `index.html` minimal, et `src/format.js` (poids lisibles, gain en %) avec ses premiers tests.
- **Terminé quand** : `npm test` passe (au moins 4 tests de `format.js`) et `npm run build` produit `dist/`.
- Fichiers : `package.json`, `index.html`, `src/format.js`, `tests/format.test.js`, `.gitignore`.

### Étape 2 · Logique de compression pure (S)
`src/settings.js` : les 3 niveaux, le format de sortie (`outputFor`), le nom `-plume`, le refus au-delà de 40 Mpx, la règle « jamais plus lourd » (`keepSmaller`), le conseil WebP pour un PNG.
- **Terminé quand** : chaque règle du cahier (section 2) a son test et `npm test` passe.
- Fichiers : `src/settings.js`, `tests/settings.test.js`.

### Étape 3 · Parcours complet sur une image (M)
Déposer une image → la compresser (`src/compress.js`, sur la page) → afficher miniature, poids avant/après, gain → la télécharger.
- **Terminé quand** : avec Playwright, une vraie photo JPEG déposée affiche un gain d'au moins 60 % en « Équilibré » et le téléchargement donne un fichier `-plume.jpg` plus léger.
- Fichiers : `index.html`, `src/main.js`, `src/compress.js`, `src/styles.css`.

**Point d'étape A (après 1-3)** : `npm test` vert, build OK, parcours d'une image vérifié, revue avec vous.

### Étape 4 · Plusieurs images, en arrière-plan (M)
Dépôt multiple, une ligne par image, compression dans `src/worker.js` (`OffscreenCanvas`), repli sur la page si absent.
- **Terminé quand** : 20 images se traitent sans figer la page (le défilement reste fluide pendant le traitement, vérifié avec Playwright) et aucune requête réseau n'apparaît.
- Fichiers : `src/worker.js`, `src/compress.js`, `src/main.js`.

### Étape 5 · Réglages (S)
Sélecteur Qualité max / Équilibré / Poids min avec texte d'aide, interrupteur WebP ; tout changement recompresse les images déposées. Détection de l'encodage WebP : interrupteur désactivé et expliqué si absent.
- **Terminé quand** : changer de niveau change les poids affichés ; WebP produit des `.webp` ; la détection a son test unitaire ; vérifié avec Playwright.
- Fichiers : `index.html`, `src/main.js`, `src/settings.js`, `tests/settings.test.js`.

### Étape 6 · Cas limites et messages (S)
Fichier non image ou format non pris en charge, image au-delà de 40 Mpx, image « déjà optimisée », PNG qui gagne peu (conseil WebP).
- **Terminé quand** : chaque cas affiche son message près de l'image concernée, sans bloquer les autres ; tests unitaires et vérification Playwright.
- Fichiers : `src/main.js`, `src/settings.js`, `tests/settings.test.js`.

**Point d'étape B (après 4-6)** : l'outil est complet sur le fond, revue avec vous.

### Étape 7 · Habillage selon la direction (M)
Palette, polices (Familjen Grotesk, Newsreader, Onest), héro, zone de dépôt ronde, sélecteur et interrupteur stylés, liste des résultats, responsive 360 → 1440 px.
- **Terminé quand** : captures Playwright à 375 px et 1440 px conformes à la planche, contrôle `impeccable detect` sans alerte.
- Fichiers : `index.html`, `src/styles.css`.

### Étape 8 · Comparateur et mouvement (S)
Section de présentation avec le comparateur avant/après dont le rideau suit le défilement vertical, apparitions douces, `prefers-reduced-motion` respecté ; photo libre de droits créditée.
- **Terminé quand** : le rideau bouge au défilement sans détourner la molette, rien ne bouge en mouvement réduit (vérifié avec Playwright), `CREDITS.md` présent.
- Fichiers : `index.html`, `src/reveal.js`, `src/styles.css`, `CREDITS.md`.

### Étape 9 · Accessibilité et finitions (S)
Parcours entier au clavier, focus visible, libellés ARIA, annonces des résultats (`aria-live`), contraste AA, cibles de 44 px.
- **Terminé quand** : dépôt (via le bouton), réglages et téléchargement se font au clavier seul ; aucune alerte de contraste.
- Fichiers : `index.html`, `src/main.js`, `src/styles.css`.

**Point d'étape C (après 7-9)** : site complet, revue avec vous.

### Étape 10 · Fin de projet (S)
Image Open Graph aux couleurs de Plume, balises `og:*` / `twitter:card`, canonical, JSON-LD `WebApplication` (ProjectP), `robots.txt`, `sitemap.xml`, lien « 30 jours, 30 projets » dans le pied de page, README final avec capture.
- **Terminé quand** : toutes les balises sont présentes dans `dist/index.html` après `npm run build` ; le README a sa capture. (Vérification en ligne et Search Console après déploiement.)
- Fichiers : `index.html`, `public/og.png`, `public/robots.txt`, `public/sitemap.xml`, `README.md`.

## Risques et parades

| Risque | Impact | Parade |
| --- | --- | --- |
| Compression navigateur moins efficace que prévu | Élevé | Traité dès l'étape 3, mesuré sur une vraie photo |
| Safari sans encodage WebP | Moyen | Détection (étape 5) |
| Worker indisponible | Faible | Repli sur la page (étape 4) |
| PNG qui gagne peu | Faible | Conseil WebP (étape 6), décidé avec vous |

## Questions ouvertes

Aucune.
