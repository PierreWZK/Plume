# Plume · Des images légères, sans quitter votre navigateur

> Jour 12 du défi **30 jours, 30 projets** · JavaScript · Canvas · Web Workers · ⏳ **À venir**

Plume réduit le poids de vos photos pour le web. Vous déposez vos images, vous choisissez un niveau de compression, puis vous téléchargez le résultat. Tout se passe dans votre navigateur : aucune image n'est envoyée sur un serveur.

## Fonctionnalités

- Dépôt de plusieurs images (JPEG, PNG, WebP) par glisser-déposer ou sélection.
- Trois niveaux : **Qualité max**, **Équilibré** (par défaut), **Poids min**.
- Format d'origine conservé par défaut ; une option permet de convertir en WebP, plus léger.
- Poids avant et après, gain en pourcentage pour chaque image.
- Téléchargement image par image.

## Lancer en local

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitaires
```

## Mise en ligne

Prévue sur Coolify : **https://plume.projectp.fr**.

## Stack

JavaScript, Canvas, Web Workers. Aucune dépendance côté serveur.

## Avant de déclarer le projet terminé

- **Indexation** : `robots.txt`, `sitemap.xml`, balise canonical, données structurées JSON-LD (`WebApplication` rattachée à ProjectP) et lien « 30 jours, 30 projets » vers https://projectp.fr/ dans le pied de page. Vérifier en ligne, puis soumettre `https://plume.projectp.fr/sitemap.xml` dans Google Search Console.
- **Aperçu du lien** : image Open Graph stylisée 1200 × 630 aux couleurs du projet et balises `og:*` / `twitter:card`, vérifiées en ligne.
- **Vitrine** : la mise à jour de `30days30projects` (README et `projects.js`) se fait après validation.
