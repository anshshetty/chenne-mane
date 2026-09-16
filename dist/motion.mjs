import { shellLayout, SHELL_BOARD_RATIO, handPreviewCount } from './shells.mjs?v=13';
// Sample a raised trajectory, with a small landing bounce.
export function flightFrames(from, to, size, rotation = 0, endRotation = rotation + 38) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y),
    lift = Math.max(size * 0.8, Math.min(size * 3, distance * 0.24)),
    points = [];
  const transform = (x, y, angle, scale) =>
    `translate3d(${x - size / 2}px,${y - size / 2}px,0) rotate(${angle}deg) scale(${scale})`;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12,
      arc = Math.sin(t * Math.PI),
      x = from.x + (to.x - from.x) * t,
      y = from.y + (to.y - from.y) * t - lift * arc;
    points.push({
      offset: t * 0.88,
      transform: transform(x, y, rotation + (endRotation - rotation) * t, 1),
      filter: `drop-shadow(1px ${1 + arc * 4}px ${0.5 + arc * 2}px #08050299)`,
      opacity: 1,
    });
  }
  points.push({ offset: 0.94, transform: transform(to.x, to.y - 1, endRotation, 1), opacity: 1 });
  points.push({ offset: 1, transform: transform(to.x, to.y, endRotation, 1), opacity: 1 });
  return points;
}
export class ShellMotion {
  constructor(board, position, pitPrefix = 'pit-') {
    this.pitPrefix = pitPrefix;
    this.board = board;
    this.position = position;
    this.revision = 0;
    this.running = new Set();
    this.flying = new Set();
    this.anchor = null;
    this.layer = document.createElement('div');
    this.layer.className = 'motion-layer';
    this.layer.setAttribute('aria-hidden', 'true');
    this.board.append(this.layer);
    this.carry = document.createElement('div');
    this.carry.className = 'carried-shells';
    this.layer.append(this.carry);
  }
  point(pit) {
    const p = this.position(pit);
    return { x: (this.board.clientWidth * p.x) / 100, y: (this.board.clientHeight * p.y) / 100 };
  }
  hover(pit) {
    const p = this.point(pit);
    return { x: p.x, y: p.y - this.board.clientHeight * 0.18 };
  }
  size() {
    return this.board.clientWidth * SHELL_BOARD_RATIO;
  }
  pilePoint(center, diameter, count, index, seed, kind = 'pit') {
    const p = shellLayout(count, seed, kind)[index];
    return {
      x: center.x + (p.x / 100) * diameter,
      y: center.y + (p.y / 100) * diameter,
      size: this.size(),
      rotation: p.rotation,
    };
  }
  landing(pit, index, count) {
    const pile = this.board.querySelector(`#${this.pitPrefix}${pit} .shells`),
      diameter = Math.min(
        pile?.clientWidth || this.board.clientWidth * 0.0672,
        pile?.clientHeight || this.board.clientWidth * 0.0672,
      );
    return this.pilePoint(this.point(pit), diameter, count, index, pit);
  }
  handPoint(count, index, anchor = this.anchor) {
    const visible = handPreviewCount(count);
    return this.pilePoint(
      anchor,
      this.board.clientWidth * 0.055,
      visible,
      Math.min(index, visible - 1),
      4,
      'hand',
    );
  }
  storePoint(player, count, index) {
    const storeId = this.pitPrefix.replace(/pit-$/, 'store-'),
      store = this.board.querySelector(`#${storeId}${player}`),
      diameter = Math.min(
        store?.clientWidth || this.board.clientWidth * 0.13,
        store?.clientHeight || this.board.clientWidth * 0.13,
      );
    return this.pilePoint(
      {
        x: this.board.clientWidth * (player === 0 ? 0.907 : 0.093),
        y: this.board.clientHeight * 0.49,
      },
      diameter,
      count,
      index,
      player + 18,
      'store',
    );
  }
  sprite(size = this.size()) {
    const img = document.createElement('img');
    img.src = '/assets/cowrie-shell.webp';
    img.alt = '';
    img.draggable = false;
    img.className = 'flying-shell';
    img.style.width = size + 'px';
    img.style.height = size + 'px';
    this.layer.append(img);
    this.flying.add(img);
    return img;
  }
  async animate(el, frames, options) {
    const a = el.animate(frames, options);
    this.running.add(a);
    try {
      await a.finished;
    } catch {
    } finally {
      this.running.delete(a);
    }
  }
  async flight(from, to, duration, delay = 0) {
    const size = from.size || this.size(),
      el = this.sprite(size);
    await this.animate(el, flightFrames(from, to, size, from.rotation || 0, to.rotation ?? 38), {
      duration,
      delay,
      easing: 'linear',
      fill: 'both',
    });
    el.remove();
    this.flying.delete(el);
  }
  held(count, anchor = this.anchor, visible = handPreviewCount(count)) {
    if (anchor) this.anchor = anchor;
    this.carry.replaceChildren();
    if (!count || !visible || !this.anchor) {
      this.carry.hidden = true;
      return;
    }
    this.carry.hidden = false;
    this.carry.style.transform = `translate3d(${this.anchor.x}px,${this.anchor.y}px,0)`;
    for (let i = 0; i < Math.min(visible, handPreviewCount(count)); i++) {
      const p = this.handPoint(count, i, { x: 0, y: 0 }),
        img = document.createElement('img');
      img.src = '/assets/cowrie-shell.webp';
      img.alt = '';
      img.className = 'held-shell';
      img.style.cssText = `width:${p.size}px;height:${p.size}px;transform:translate(${p.x - p.size / 2}px,${p.y - p.size / 2}px) rotate(${p.rotation}deg)`;
      this.carry.append(img);
    }
    const badge = document.createElement('span');
    badge.textContent = String(count);
    badge.style.top = '-10px';
    badge.style.left = this.size() * 1.15 + 'px';
    this.carry.append(badge);
  }
  async pickup(frame, duration, draw) {
    const revision = this.revision,
      target = this.hover(frame.pit),
      visible = handPreviewCount(frame.hand);
    const origins = Array.from({ length: visible }, (_, i) =>
      this.landing(frame.pit, frame.hand - visible + i, frame.hand),
    );
    let arrived = 0;
    this.held(0);
    draw(frame);
    await Promise.all(
      origins.map(async (from, i) => {
        await this.flight(from, this.handPoint(frame.hand, i, target), duration, i * 16);
        if (revision === this.revision) this.held(frame.hand, target, ++arrived);
      }),
    );
    if (revision === this.revision) this.held(frame.hand, target);
  }
  async drop(frame, duration, draw, impact) {
    const revision = this.revision,
      anchor = this.anchor || this.hover(frame.pit),
      count = frame.pits[frame.pit],
      from = this.handPoint(frame.hand + 1, handPreviewCount(frame.hand + 1) - 1, anchor),
      target = this.landing(frame.pit, count - 1, count),
      hover = this.hover(frame.pit);
    this.held(frame.hand, anchor);
    const carryMove = this.carry.hidden
      ? Promise.resolve()
      : this.animate(
          this.carry,
          [
            { transform: `translate3d(${anchor.x}px,${anchor.y}px,0)` },
            { transform: `translate3d(${hover.x}px,${hover.y}px,0)` },
          ],
          { duration: duration * 0.78, easing: 'cubic-bezier(.25,.7,.3,1)', fill: 'none' },
        ).then(() => {
          if (revision === this.revision) {
            this.carry.style.transform = `translate3d(${hover.x}px,${hover.y}px,0)`;
            this.anchor = hover;
          }
        });
    await Promise.all([this.flight(from, target, duration), carryMove]);
    if (revision !== this.revision) return;
    this.held(frame.hand, hover);
    draw(frame);
    impact();
  }
  async capture(frame, player, duration, draw, impact) {
    const revision = this.revision,
      previous = frame.scores[player] - frame.captured,
      origins = Array.from({ length: frame.captured }, (_, i) =>
        this.landing(frame.pit, i, frame.captured),
      );
    let arrived = 0;
    const storeCapacities = { [player]: frame.scores[player] };
    this.held(0);
    const beforeLanding = {
      ...frame,
      storeCapacities,
      scores: frame.scores.map((score, p) => score - (p === player ? frame.captured : 0)),
    };
    draw(beforeLanding);
    await Promise.all(
      origins.map(async (from, i) => {
        await this.flight(
          from,
          this.storePoint(player, frame.scores[player], previous + i),
          duration * 1.35,
          i * 12,
        );
        if (revision !== this.revision) return;
        arrived++;
        draw({
          ...frame,
          storeCapacities,
          scores: frame.scores.map((score, p) => (p === player ? previous + arrived : score)),
        });
      }),
    );
    if (revision !== this.revision) return;
    draw(frame);
    if (frame.captured) impact(true);
  }
  clear() {
    this.revision++;
    for (const a of this.running) a.cancel();
    this.running.clear();
    for (const el of this.flying) el.remove();
    this.flying.clear();
    this.carry.replaceChildren();
    this.carry.hidden = true;
    this.anchor = null;
  }
}
