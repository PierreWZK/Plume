/**
 * Position du rideau avant/après (en %) d'après la place du comparateur dans l'écran :
 * 15 % quand son centre touche le bas, 85 % quand il atteint le milieu. Le défilement reste vertical et libre.
 */
export function curtainPosition({ top, height }, viewportHeight, { reduced = false } = {}) {
  if (reduced) return 50;
  const center = top + height / 2;
  const progress = Math.min(1, Math.max(0, (viewportHeight - center) / (viewportHeight / 2)));
  return Math.round(15 + progress * 70);
}

/** Branche le rideau et les apparitions douces des sections `.reveal`. */
export function initReveal(doc = document) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compare = doc.querySelector('.compare');
  if (compare) {
    const update = () => compare.style.setProperty('--pos', `${curtainPosition(compare.getBoundingClientRect(), innerHeight, { reduced })}%`);
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.2 });
  doc.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}
