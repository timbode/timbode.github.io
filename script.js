document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initHeroMotif();
});

// ──────────────────────────────────────────────────────────────────
// Mobile menu
// ──────────────────────────────────────────────────────────────────

function initMobileMenu() {
  const button = document.querySelector('.mobile-menu-button');
  const menu = document.querySelector('.nav-links');
  if (!button || !menu) return;

  button.addEventListener('click', () => {
    button.classList.toggle('active');
    menu.classList.toggle('active');
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      button.classList.remove('active');
      menu.classList.remove('active');
    });
  });
}

// ──────────────────────────────────────────────────────────────────
// Smooth in-page navigation
// ──────────────────────────────────────────────────────────────────

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ──────────────────────────────────────────────────────────────────
// Hero motif
//
// On every page load the hero shows one of two drawings, chosen at
// random: a spin-lattice plate or a Bloch sphere. Each has a single
// movement that plays on hover (or tap) and settles on leave. Both are
// generic textbook pictures with illustrative numbers; they do not
// depict a particular algorithm.
// ──────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const HERO_MOTIFS = [
  { draw: drawSpinLattice, label: 'An eight-by-eight lattice of up and down spins with a domain wall' },
  { draw: drawBlochSphere, label: 'A Bloch sphere with a qubit state spiralling to the pole' },
];

/**
 * Pick one hero motif at random, draw it and wire hover / tap.
 */
function initHeroMotif() {
  const figure = document.querySelector('.hero-motif');
  const svg = document.getElementById('hero-motif');
  if (!figure || !svg) return;

  const motif = HERO_MOTIFS[Math.floor(Math.random() * HERO_MOTIFS.length)];
  svg.setAttribute('aria-label', motif.label);
  const { play, rewind } = motif.draw(svg);

  figure.addEventListener('mouseenter', play);
  figure.addEventListener('mouseleave', rewind);
  figure.addEventListener('click', play);
}

// ── shared drawing helpers ───────────────────────────────────────

/**
 * Create an SVG element with attributes and append it to a parent.
 *
 * @param {Element} parent  Element the new node is appended to.
 * @param {string} tag      SVG tag name, e.g. "path".
 * @param {Object} attrs    Attribute name → value.
 * @returns {SVGElement}    The created element.
 */
function svgEl(parent, tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.appendChild(el);
  return el;
}

/**
 * Polyline path data through screen points.
 *
 * @param {number[][]} points  [[x, y], ...] in SVG units.
 * @returns {string}           SVG path data "M… L…".
 */
function polyline(points) {
  return points.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/**
 * Clamp a number to [0, 1].
 *
 * @param {number} u  Any number.
 * @returns {number}  u clamped to [0, 1].
 */
function clamp01(u) {
  return Math.max(0, Math.min(1, u));
}

/**
 * Smooth ease-in-out on [0, 1].
 *
 * @param {number} u  Progress in [0, 1].
 * @returns {number}  Eased progress in [0, 1].
 */
function easeInOut(u) {
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

/**
 * A scalar tween: animates `value` toward a target and calls `render(value)`
 * on every frame. A new `set()` or `to()` interrupts the running tween.
 */
class Tween {
  /**
   * @param {number} initial            Starting value.
   * @param {function(number)} render   Called with the current value each frame.
   */
  constructor(initial, render) {
    this.value = initial;
    this.render = render;
    this.frame = null;
    render(initial);
  }

  /**
   * Jump to a value without animation.
   *
   * @param {number} value  New value.
   */
  set(value) {
    cancelAnimationFrame(this.frame);
    this.value = value;
    this.render(value);
  }

  /**
   * Animate toward `target` over `ms` milliseconds.
   *
   * @param {number} target  Final value.
   * @param {number} ms      Duration; under reduced motion the value jumps.
   */
  to(target, ms) {
    cancelAnimationFrame(this.frame);
    if (REDUCED_MOTION || ms <= 0) { this.set(target); return; }
    const start = this.value, t0 = performance.now();
    const tick = now => {
      const u = Math.min(1, (now - t0) / ms);
      this.value = start + (target - start) * easeInOut(u);
      this.render(this.value);
      if (u < 1) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}

// ── motif 1: spin-lattice plate ──────────────────────────────────

/**
 * An 8×8 Ising configuration: per row, the first column whose spin points
 * down (the domain wall), before and after the hover movement, plus a few
 * isolated spins that point against their domain until the wall passes.
 */
const LATTICE = {
  size: 8, cell: 28, origin: 28,
  wallStart: [2, 3, 3, 4, 4, 3, 3, 2],
  wallEnd:   [5, 5, 6, 6, 6, 6, 5, 5],
  defects:   [[1, 6], [5, 1], [6, 4]],          // [row, column]
};

/**
 * Domain-wall column per row at movement progress u. Rows start one after
 * another, so the wall advances from the top down.
 *
 * @param {number} u  Progress in [0, 1].
 * @returns {number[]} First down-pointing column for each row.
 */
function latticeWalls(u) {
  return LATTICE.wallStart.map((start, row) => {
    const rowProgress = clamp01((u - 0.05 * row) / 0.6);
    return start + Math.floor(rowProgress * (LATTICE.wallEnd[row] - start + 0.999));
  });
}

/**
 * Orientation of one spin, given its row's wall and whether the isolated
 * defects are still present.
 *
 * @param {number} row         Row index.
 * @param {number} col         Column index.
 * @param {number} wall        First down-pointing column in this row.
 * @param {boolean} defects    True while the defects have not yet healed.
 * @returns {boolean}          True if the spin points up.
 */
function latticeSpinUp(row, col, wall, defects) {
  const isDefect = defects && LATTICE.defects.some(([r, c]) => r === row && c === col);
  return (col < wall) !== isDefect;
}

/**
 * Draw the lattice plate: a double-ruled frame, 8×8 arrow glyphs and the
 * dashed domain wall. Hover moves the wall right and heals the defects.
 *
 * @param {SVGSVGElement} svg  Empty target svg.
 * @returns {{play: function, rewind: function}}  Hover handlers.
 */
function drawSpinLattice(svg) {
  const { size, cell, origin } = LATTICE;
  svg.setAttribute('viewBox', '0 0 280 280');
  svgEl(svg, 'rect', { x: 15, y: 15, width: 250, height: 250, class: 'plate-outer' });
  svgEl(svg, 'rect', { x: 20, y: 20, width: 240, height: 240, class: 'plate-inner' });

  const glyphs = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => {
    const g = svgEl(svg, 'g', { transform: `translate(${origin + cell * (col + 0.5)} ${origin + cell * (row + 0.5)})` });
    return svgEl(g, 'path', { d: 'M0,8 V-6 M-4,-2.5 L0,-8 L4,-2.5', class: 'lattice-spin' });
  }));
  const wallPath = svgEl(svg, 'path', { class: 'lattice-wall' });

  const render = u => {
    const walls = latticeWalls(u);
    const defects = u < 0.35;
    walls.forEach((wall, row) => glyphs[row].forEach((glyph, col) => {
      glyph.style.transform = latticeSpinUp(row, col, wall, defects) ? 'rotate(0deg)' : 'rotate(180deg)';
    }));
    wallPath.setAttribute('d', polyline(walls.flatMap((wall, row) => [
      [origin + cell * wall, origin + cell * row],
      [origin + cell * wall, origin + cell * (row + 1)],
    ])));
  };
  const progress = new Tween(0, render);
  return { play: () => progress.to(1, 2400), rewind: () => progress.to(0, 1400) };
}

// ── motif 2: Bloch sphere ────────────────────────────────────────

/** Orthographic camera for the Bloch sphere (angles in radians). */
const BLOCH_VIEW = { cx: 140, cy: 132, radius: 92, azimuth: -0.6, elevation: 0.3 };

/**
 * Project a point on the unit sphere to the screen.
 *
 * @param {number[]} point  [x, y, z] with x² + y² + z² = 1.
 * @returns {{x: number, y: number, depth: number}}  Screen position; depth ≥ 0 faces the viewer.
 */
function blochProject([x, y, z]) {
  const { cx, cy, radius, azimuth: a, elevation: e } = BLOCH_VIEW;
  const xTurned = x * Math.cos(a) - y * Math.sin(a);
  const yTurned = x * Math.sin(a) + y * Math.cos(a);
  return {
    x: cx + radius * xTurned,
    y: cy - radius * (yTurned * Math.sin(e) + z * Math.cos(e)),
    depth: -yTurned * Math.cos(e) + z * Math.sin(e),
  };
}

/**
 * Split a curve on the sphere into the parts facing the viewer and the
 * parts behind the sphere.
 *
 * @param {number[][]} points  Consecutive points [x, y, z] on the sphere.
 * @returns {{front: string, back: string}}  SVG path data for each side.
 */
function splitByDepth(points) {
  const runs = { front: [], back: [] };
  let side = null, run = [];
  for (const p of points.map(blochProject)) {
    const s = p.depth >= 0 ? 'front' : 'back';
    if (s !== side && run.length) { runs[side].push(polyline(run)); run = [run[run.length - 1]]; }
    side = s;
    run.push([p.x, p.y]);
  }
  if (run.length) runs[side].push(polyline(run));
  return { front: runs.front.join(' '), back: runs.back.join(' ') };
}

/**
 * Point on the precession spiral from the equator to |0⟩.
 *
 * @param {number} u  Progress in [0, 1].
 * @returns {number[]} [x, y, z] on the unit sphere.
 */
function spiralPoint(u) {
  const theta = (Math.PI / 2) * (1 - Math.pow(u, 0.8)) + 0.07 * u;   // polar angle, π/2 → 0.07
  const phi = 0.4 + 2 * Math.PI * 3.25 * u;                          // azimuth, 3¼ turns
  return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
}

/**
 * Great circle on the unit sphere, sampled.
 *
 * @param {function(number): number[]} at  Angle t ↦ point [x, y, z].
 * @returns {number[][]}                    181 points for t ∈ [0, 2π].
 */
function greatCircle(at) {
  return Array.from({ length: 181 }, (_, k) => at(2 * Math.PI * k / 180));
}

/**
 * Draw the Bloch sphere: outline, equator and one meridian (dashed where
 * hidden), the z axis with |0⟩ and |1⟩, and the state's spiral trace. Hover
 * replays the spiral from the equator.
 *
 * @param {SVGSVGElement} svg  Empty target svg.
 * @returns {{play: function, rewind: function}}  Hover handlers.
 */
function drawBlochSphere(svg) {
  const { cx, cy, radius } = BLOCH_VIEW;
  svg.setAttribute('viewBox', '0 0 280 260');
  svgEl(svg, 'circle', { cx, cy, r: radius, class: 'bloch-outline' });
  for (const circle of [greatCircle(t => [Math.cos(t), Math.sin(t), 0]), greatCircle(t => [Math.sin(t), 0, Math.cos(t)])]) {
    const { front, back } = splitByDepth(circle);
    svgEl(svg, 'path', { d: back, class: 'bloch-back' });
    svgEl(svg, 'path', { d: front, class: 'bloch-front' });
  }
  const north = blochProject([0, 0, 1]), south = blochProject([0, 0, -1]);
  svgEl(svg, 'line', { x1: south.x, y1: south.y, x2: north.x, y2: north.y, class: 'bloch-axis' });
  svgEl(svg, 'text', { x: north.x, y: north.y - 10, class: 'bloch-label', 'text-anchor': 'middle' }).textContent = '|0⟩';
  svgEl(svg, 'text', { x: south.x, y: south.y + 20, class: 'bloch-label', 'text-anchor': 'middle' }).textContent = '|1⟩';

  const traceBack = svgEl(svg, 'path', { class: 'bloch-trace-back' });
  const traceFront = svgEl(svg, 'path', { class: 'bloch-trace' });
  const vector = svgEl(svg, 'line', { x1: cx, y1: cy, class: 'bloch-vector' });
  const halo = svgEl(svg, 'circle', { r: 7, class: 'bloch-halo' });
  const tip = svgEl(svg, 'circle', { r: 3.2, class: 'bloch-tip' });
  svgEl(svg, 'circle', { cx, cy, r: 2, class: 'bloch-center' });

  const render = u => {
    const samples = Math.max(2, Math.round(u * 400));
    const trace = Array.from({ length: samples }, (_, k) => spiralPoint(u * k / (samples - 1)));
    const { front, back } = splitByDepth(trace);
    traceFront.setAttribute('d', front);
    traceBack.setAttribute('d', back);
    const p = blochProject(spiralPoint(u));
    vector.setAttribute('x2', p.x);
    vector.setAttribute('y2', p.y);
    for (const c of [halo, tip]) { c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); }
  };
  const replay = new Tween(1, render);
  return { play: () => { replay.set(0); replay.to(1, 3400); }, rewind: () => replay.to(1, 400) };
}
