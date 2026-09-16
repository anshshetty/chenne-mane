export const SHELL_BOARD_RATIO = 0.027;
export const HAND_PREVIEW_LIMIT = 4;
export const handPreviewCount = (count) => Math.min(count, HAND_PREVIEW_LIMIT);
const layouts = new Map();
// A shell keeps its physical size. Each new shell settles over the existing
// pile; neither the older shells nor their positions depend on the total.
export function shellLayout(count, seed = 0, kind = 'pit') {
  if (!Number.isInteger(count) || count < 0 || count > 56)
    throw new RangeError('A pile must contain 0–56 shells.');
  const key = `${count}:${seed}:${kind}`;
  if (layouts.has(key)) return layouts.get(key);
  const first =
    kind === 'hand'
      ? [
          [-10, -7],
          [10, -5],
          [-7, 10],
          [10, 10],
        ]
      : [
          [-16, -13],
          [15, -12],
          [-13, 17],
          [17, 15],
        ];
  const turn = ((seed % 7) - 3) * 0.09;
  const result = Array.from({ length: count }, (_, i) => {
    let x, y;
    if (i < first.length) [x, y] = first[i];
    else {
      const angle = i * 2.399963229728653 + seed * 0.31,
        radius = kind === 'store' ? 19 + ((i * 7) % 18) : 17 + ((i * 5) % 11);
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }
    return {
      x: x * Math.cos(turn) - y * Math.sin(turn),
      y: x * Math.sin(turn) + y * Math.cos(turn),
      rotation: (i * 83 + seed * 47 + 19) % 360,
    };
  });
  layouts.set(key, result);
  return result;
}
export const shellStyle = (p, index) =>
  `--sx:${p.x}%;--sy:${p.y}%;--shell-ratio:${SHELL_BOARD_RATIO};--rot:${p.rotation}deg;--z:${index}`;
export const shellHTML = (count, seed = 0) =>
  shellLayout(count, seed)
    .map(
      (p, i) =>
        `<img class="shell" src="/assets/cowrie-shell.webp" alt="" draggable="false" style="${shellStyle(p, i)}">`,
    )
    .join('');
export function patchPile(container, count, seed = 0, capacity = count) {
  const layout = shellLayout(
      capacity,
      seed,
      container.classList.contains('store') ? 'store' : 'pit',
    ),
    existing = Array.from(container.querySelectorAll(':scope > .shell'));
  if (count > capacity || count < 0 || !Number.isInteger(count))
    throw new RangeError('Visible shells must fit their pile.');
  for (let i = existing.length - 1; i >= count; i--) existing[i].remove();
  for (let i = 0; i < count; i++) {
    let img = existing[i];
    if (!img) {
      img = document.createElement('img');
      img.className = 'shell';
      img.src = '/assets/cowrie-shell.webp';
      img.alt = '';
      img.draggable = false;
      container.append(img);
    }
    img.style.cssText = shellStyle(layout[i], i);
  }
}
