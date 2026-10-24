# Jour 12/30 — Plume, des images légères, sans quitter votre navigateur

> Stack : **JavaScript** (modules, sans framework), **Canvas**, **Web Workers**, **Vite** · hébergement **Coolify** (site statique), sous-domaine `plume.projectp.fr`.
> Durée visée : **2 h 45** pour le MVP, les bonus ensuite.

Ce document est notre contrat : on le suit étape par étape, et toute décision qui s'en écarte est d'abord notée ici.

## 1. Objectif

Alléger des photos pour un site web, vite et sans friction : déposer, choisir un niveau, télécharger. Aucune publicité, aucune étape inutile, aucune image envoyée sur un serveur, et une perte de qualité qui ne se voit pas.

**Pour qui** : quelqu'un qui prépare des images pour un site (indépendant, créateur de site, rédacteur) et qui veut un résultat en quelques secondes.

**Ce qui compte le plus** : la rapidité du parcours et une qualité visuelle préservée.

## 2. Besoins

### Parcours

1. Déposer une ou plusieurs images (glisser-déposer ou bouton), au format JPEG, PNG ou WebP.
2. Choisir le **niveau** : Qualité max, **Équilibré** (par défaut), Poids min. Un texte sous le sélecteur explique l'effet de chaque niveau.
3. Optionnel : activer **Convertir en WebP** (désactivé par défaut ; sinon chaque image garde son format d'origine).
4. Voir, pour chaque image : miniature, poids avant, poids après, gain en %.
5. Télécharger chaque image compressée (le nom garde celui d'origine, suffixé de `-plume`).

Changer le niveau ou l'option WebP recompresse les images déjà déposées.

### Règles de compression

| Niveau | Qualité d'encodage (JPEG et WebP) |
| --- | --- |
| Qualité max | 0,90 |
| Équilibré | 0,78 |
| Poids min | 0,60 |

- **Jamais plus lourd** : si le résultat pèse autant ou plus que l'original, on garde l'original et on l'indique (« déjà optimisée »).
- Les métadonnées (EXIF, dont la position GPS) sont retirées ; l'orientation de la photo est respectée.
- Les dimensions ne changent pas.
- Si le navigateur ne sait pas encoder en WebP, l'option WebP est désactivée et expliquée.

### Interface (direction validée : `docs/direction.html`)

- Palette : Encre `#141414`, Papier `#F3F2EE`, Graphite `#6F6C66`, Rouille `#B4532A` (seul accent).
- Polices : Familjen Grotesk (titres), Newsreader italique (signature), Onest (texte).
- Zone de dépôt ronde, comparateur avant/après dont le rideau suit le défilement vertical (la molette n'est jamais détournée), apparitions douces au défilement, `prefers-reduced-motion` respecté.
- Responsive de 360 px à 1440 px ; cibles tactiles d'au moins 44 px ; focus clavier visible ; contraste AA.

## 3. Hors périmètre

- Redimensionnement, recadrage, retouche.
- Téléchargement groupé en ZIP.
- Format AVIF.
- Compte, historique, serveur ou stockage en ligne.
- Mode hors ligne (PWA).

## 4. Risques

| Risque | Conséquence | Parade |
| --- | --- | --- |
| **PNG** : le Canvas réencode le PNG sans perte, le fichier grossit souvent | Un PNG gardé en PNG ne gagne presque rien | Règle « jamais plus lourd » + message qui propose d'activer WebP ; la compression PNG avec perte (quantification) reste un bonus, qui demande une dépendance |
| Safari n'encode pas le WebP avec `toBlob` (il renvoie un PNG) | Fichier inattendu, plus lourd | Détection au démarrage, option WebP désactivée si absente |
| `OffscreenCanvas` absent dans un worker (anciens navigateurs) | Pas de traitement en arrière-plan | Repli sur le Canvas de la page |
| Très grandes images (> 40 Mpx) | Mémoire saturée, onglet qui plante | Refus au-delà d'une taille fixée, avec un message clair |
| Le rideau avant/après piloté par le défilement gêne | Sensation de défilement détourné | Lié au défilement vertical normal, désactivé si mouvement réduit |

## 5. Stack et commandes

- JavaScript en modules, sans framework ; Vite comme seule dépendance (serveur de développement et build).
- Tests : `node --test` (aucune dépendance), sur la logique pure.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # node --test
npm run build      # site statique dans dist/
npm run preview    # aperçu du build
```

## 6. Structure du projet

```
index.html               La page (outil + présentation)
src/
├── main.js              Branchement de l'interface : dépôt, réglages, liste, téléchargements
├── settings.js          Niveaux, format de sortie, nom du fichier (logique pure)
├── compress.js          Compression d'une image (Canvas / OffscreenCanvas), règle « jamais plus lourd »
├── worker.js            Compression en arrière-plan
├── format.js            Poids lisibles (« 2,4 Mo »), gain en %
└── styles.css
tests/                   Tests node --test de la logique pure
public/                  og.png, robots.txt, sitemap.xml, favicon
assets/images/           Photo libre de droits du comparateur (CREDITS.md)
docs/direction.html      Planche de direction validée
```

## 7. Style de code

Modules ES, fonctions courtes et pures dès que possible, noms en anglais, commentaires en français seulement pour le « pourquoi ».

```js
// Un niveau donne la qualité d'encodage ; le format suit l'original sauf conversion WebP
export function outputFor(file, { level, toWebp }) {
  const type = toWebp ? 'image/webp' : file.type;
  return { type, quality: LEVELS[level].quality };
}
```

## 8. Stratégie de test

- **Unitaires (`node --test`)** : niveaux et formats de sortie, nom du fichier, règle « jamais plus lourd », formatage des poids et du gain.
- **Navigateur (Playwright, vérification à chaque étape d'interface)** : dépôt d'une vraie image, poids avant/après affichés, téléchargement, changement de niveau, option WebP, rendu mobile et ordinateur.
- Chaque étape commence par ses tests ; `npm test` passe avant chaque commit.

## 9. Limites

- **Toujours** : écrire les tests avant le code, lancer `npm test` avant chaque commit, respecter la direction validée, vérifier l'accessibilité (contraste, clavier, mouvement réduit).
- **Demander d'abord** : ajouter une dépendance autre que Vite, sortir du périmètre, modifier la direction artistique.
- **Jamais** : envoyer une image sur un réseau, pousser sur `main`, utiliser une image générée, commiter sans accord.

## 10. Critères de réussite

- [ ] Une photo JPEG de 2 à 5 Mo perd au moins 60 % en « Équilibré » sans défaut visible à 100 %.
- [ ] Aucune requête réseau pendant la compression (onglet Réseau vide).
- [ ] Aucun fichier rendu n'est plus lourd que l'original.
- [ ] 20 images se traitent sans figer la page.
- [ ] L'option WebP n'apparaît active que si le navigateur sait l'encoder.
- [ ] Utilisable au clavier et sur mobile (360 px).
- [ ] `npm test` passe.

## 11. Avant de déclarer le projet terminé

- **Indexation** : `robots.txt`, `sitemap.xml`, balise canonical, JSON-LD `WebApplication` rattachée à ProjectP, lien « 30 jours, 30 projets » vers https://projectp.fr/ dans le pied de page. Vérifier en ligne, puis soumettre `https://plume.projectp.fr/sitemap.xml` dans Google Search Console.
- **Aperçu du lien** : image Open Graph 1200 × 630 aux couleurs de Plume, balises `og:*` / `twitter:card`, vérifiées en ligne.
- **Vitrine** : mise à jour de `30days30projects` (README et `projects.js`) après validation.

## 12. Décisions

1. **PNG** : pas de dépendance de compression avec perte. Un PNG gagne peu ; l'interface le signale et propose d'activer WebP.
2. **Taille maximale** par image : 40 Mpx. Au-delà, refus avec un message clair.
