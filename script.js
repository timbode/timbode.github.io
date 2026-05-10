document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initOptGraph();
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
// Mean-field iteration on a random graph (MaxCut-style relaxation).
//
// For a graph G = (V, E) with adjacency A_ij ∈ {0, 1} and continuous
// magnetisations m_i ∈ [-1, 1], the mean-field fixed-point map is
//
//     m_i  ←  - tanh ( β  ∑_{j ∈ ∂i}  m_j ) ,
//
// damped to keep transitions visually smooth:
//
//     m_i^{n+1}  =  (1 - α) m_i^n  +  α · ( - tanh ( β ∑ m_j^n ) ) .
//
// The minus sign favours antialignment across edges — the MaxCut
// objective. From a small random seed, iterates polarise into two
// groups: the relaxed cut.
// ──────────────────────────────────────────────────────────────────

function initOptGraph() {
  const svg = document.getElementById('opt-graph');
  if (!svg) return;

  const W = 240, H = 220;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Hand-placed layout — fixed across loads, deliberately a touch
  // asymmetric so it reads as a problem instance rather than a tile.
  const pos = [
    [ 32,  38], [ 92,  22], [158,  30], [212,  58],
    [ 60,  82], [128,  72], [188,  96],
    [ 28, 130], [ 96, 124], [162, 142], [218, 150],
    [ 60, 178], [134, 188], [200, 198],
  ];
  const edges = [
    [0,1],[1,2],[2,3],[0,4],[1,4],[1,5],[2,5],[3,5],[3,6],
    [4,5],[5,6],[4,7],[4,8],[5,8],[6,9],[6,10],
    [7,8],[8,9],[9,10],[7,11],[8,11],[8,12],[9,12],[10,13],[11,12],[12,13],
  ];

  const N = pos.length;
  const adj = pos.map(() => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

  const m = new Float64Array(N);
  const seed = () => { for (let i = 0; i < N; i++) m[i] = 0.08 * (2 * Math.random() - 1); };
  seed();

  const ns = 'http://www.w3.org/2000/svg';
  for (const [a, b] of edges) {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', pos[a][0]);
    line.setAttribute('y1', pos[a][1]);
    line.setAttribute('x2', pos[b][0]);
    line.setAttribute('y2', pos[b][1]);
    line.setAttribute('class', 'edge');
    svg.appendChild(line);
  }
  const nodeEls = new Array(N);
  for (let i = 0; i < N; i++) {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', pos[i][0]);
    c.setAttribute('cy', pos[i][1]);
    c.setAttribute('r', 6);
    c.setAttribute('class', 'node');
    svg.appendChild(c);
    nodeEls[i] = c;
  }

  const render = () => {
    for (let i = 0; i < N; i++) {
      const a = Math.max(0.18, Math.min(1, Math.abs(m[i])));
      nodeEls[i].setAttribute('data-sign', m[i] >= 0 ? 'pos' : 'neg');
      nodeEls[i].style.opacity = a;
    }
  };
  render();

  const ALPHA = 0.55;
  const BETA  = 1.0;
  const STEP_MS = 220;

  const step = () => {
    const next = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let h = 0;
      for (const j of adj[i]) h += m[j];
      next[i] = (1 - ALPHA) * m[i] + ALPHA * (-Math.tanh(BETA * h));
    }
    for (let i = 0; i < N; i++) m[i] = next[i];
    render();
  };

  const converged = () => {
    for (let i = 0; i < N; i++) if (Math.abs(m[i]) < 0.97) return false;
    return true;
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const figure = document.querySelector('.hero-motif');
  if (!figure) return;

  let timer = null;
  const start = () => {
    if (timer) return;
    if (converged()) seed();
    timer = setInterval(step, STEP_MS);
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  figure.addEventListener('mouseenter', start);
  figure.addEventListener('mouseleave', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  figure.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    if (converged()) seed();
    step();
  });
}
