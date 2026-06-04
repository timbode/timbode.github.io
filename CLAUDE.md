# CLAUDE.md — timbode.github.io

Tim Bode's personal website. Vanilla HTML / CSS / JS, deployed via GitHub Pages. Tim is a
quantum-optimization researcher at FZ Jülich (PGI-12) and the prospective founder of
**Quicopt** (https://quicopt.com), a quantum-inspired optimization spin-off out of the
institute. The site presents him as founder + group leader first, working physicist
second.

## Workflow

- **Files:** `index.html`, `style.css`, `script.js`. No build step, no framework.
- **Local preview:** `python3 -m http.server 8765`, then http://localhost:8765. The server
  occasionally dies between sessions — restart it. Don't sleep waiting for it.
- **Deploy:** `git push origin main`. GitHub Pages serves directly from the repo.
- **Sandbox:** `/sandbox/` holds prototype variants from `frontend-design` agent runs.
  Not deployed to production but reachable locally for comparison.

## Design system

The aesthetic is **"monograph / scholar-builder"**: off-white paper, single ink-blue accent,
Newsreader serif body, Inter for UI, JetBrains Mono for status / dates / §-numbers, Caveat
(handwriting) for the status block key labels. The page should read like a chapter book, not
a CV or a startup landing page. Light theme only.

Design tokens live as CSS custom properties at `:root` in `style.css`. Don't introduce new
colors or fonts without a good reason — coherence is part of the identity.

### Section heads (centered italic)

```html
<header class="section-head">
  <span class="section-num">§ III</span>
  <h2>Talks</h2>
</header>
```

Roman numerals (I–V), in mono with wide letter-spacing, above an italic Newsreader title at
42 px. **§1 Quicopt is the exception** — its `h2` contains an `<img>` of the Quicopt logo
(`.quicopt-headline`), not text. Do not put the logo in a side column.

### Section dividers

Short centered hairline rules: `<hr class="divider" aria-hidden="true">`. Inserted between
hero/§1, §1/§2, §2/§3, §3/§4. **Not** between §4/§5 — the `.supervision-note` acts as the
divider there. **Not** after §5.

We tried ornamental fleuron-and-diamond glyphs (Variant B prototype) and Tim found them too
subtle to register; we explicitly walked back to hairlines. Don't reintroduce ornaments.

### Drop-caps

Used in `.bio` (hero) and `.section-lede` (§1, §2). Implemented as
`<span class="dropcap">X</span>` at the start of the paragraph, with `position: relative;
padding-left: 3.5em` on the parent. The `.dropcap` itself is `position: absolute;
width: 0.9em; text-align: right`, so glyphs of varying widths (M, Q, P) all anchor their
**right edge** at the same x-coordinate — gap to body text stays constant regardless of
letter.

**Do not use `::first-letter`.** We tried that; the float-based wrap meant line 4 onwards
broke block alignment, and Tim hated it. If you add a new dropcap, follow the span pattern.

### Hero graph (`#opt-graph`)

The SVG runs a damped mean-field iteration on a hand-laid 14-node random graph. **This is a
generic visual prop, NOT representative of Tim's actual algorithms or Quicopt's IP.** The
math is textbook stat-mech and lives in `script.js` only because it's textbook. Do not
caption or describe it in a way that ties it to Tim's published work, MaOA, or Quicopt —
Tim explicitly corrected an earlier draft that did so.

First-paint behaviour: small random init → run 10 mean-field iterations over ~2.5 s →
freeze. Hovering the figure replays it (re-randomises if previously converged). Mobile: tap
to step.

### Status block (hero)

A `<dl class="status-block">` with `<div class="status-row">` wrappers grouping `<dt>`/`<dd>`
pairs. Styled as a **graph-paper card**: ink-blue grid background (`background-image` with two
`linear-gradient` layers at 24 px pitch), subtle box shadow, a faint vertical margin line
via `::before`. Keys (`dt`) use Caveat cursive at 19 px; values (`dd`) use JetBrains Mono at
15 px. Both share `line-height: 24px` and `align-items: baseline` so text sits on the grid
lines. `padding-top: 8px` on the card calibrates the first baseline to land on a grid line.

On mobile the rows allow wrapping (`flex-wrap: wrap`) and fonts scale down slightly. **Do not
revert this to a `<pre>` block** with manually aligned spaces; long values overflowed every
phone width and the dl/dt/dd structure is the fix.

### Footer Hamiltonian

Renders the problem Hamiltonian *H*<sub>*Z*</sub> = − Σ<sub>*i*<*j*</sub> *J*<sub>*ij*</sub>
*Z*<sub>*i*</sub>*Z*<sub>*j*</sub> − Σ<sub>*i*</sub> *h*<sub>*i*</sub> *Z*<sub>*i*</sub> on
the left in serif italic, copyright on the right in mono. Notation comes from Tim's
*Phys. Rev. A* 111, 032411 (arXiv:2411.07646): **capital Z** as the Pauli operator, not
σ<sup>z</sup>.

## Content rules

### Quicopt verticals (§1)

The lede says Quicopt targets problems that **established solvers** handle poorly (not
"classical solvers" — Tim changed this deliberately). The verticals are no longer enumerated
inline in the lede; they live on quicopt.com. Source of truth:
`~/Documents/projects/websites/quicopt_website/composables/useI18n.ts`. Current verticals:

- multi-supplier BOM sourcing (electronics)
- AC optimal power flow (power systems)
- blending and pooling (process & metals)
- native higher-order binary optimization (QUBO / PUBO / HUBO)

Differentiator: **runs on standard hardware, no QPU required.** If you update copy on
either site, check the other first.

### Status block content

Current values:
- **now** — *scaling Quicopt toward spin-off*
- **research** — *quantum and quantum-inspired optimization* (no "algorithms" at the end)
- **open to** — *pilot projects with industry*

Tim's **founding team is settled** — do not put "founding-team conversations" or similar in
the `open to` line. Tim has explicitly rejected boastful counts (e.g. "3 papers in pipeline
(2026)"); keep status lines factual and modest.

### Research lede (§2)

Tim publishes across non-equilibrium field theory, mean-field optimization, beyond-mean-field
corrections, with sidelines into stochastic processes (*J. Phys. A*) and experimental photon
condensation (*Science*). First-, last-, and sole-author contributions exist in his record.

**Tim's birth name was Lappe.** Pre-2022 papers carry that byline. When bolding "self" in
the publication list, **both Bode and Lappe must be bolded**.

### Supervision note

Sits between §4 Awards and §5 Contact, deliberately as an aside (not a §-numbered section).
Tim is not currently taking thesis students because Quicopt is ramping toward spin-off.
Tone: courteous, honest, leaves a door cracked. Do not promote it back into a numbered
section.

## How to be careful

### Don't extrapolate paper contents

Twice during the rework, copy I generated described Tim's papers based on titles alone, and
both times Tim had to correct it:

- I captioned the *Phys. Rev. A* 111 figure as "fidelity vs. schedule depth" — it actually
  shows an easy and a hard spin-glass instance side by side.
- I claimed the mean-field iteration in `script.js` is in Tim's *PRX Quantum* MaOA paper —
  it isn't.

If you need to describe the *content* of a Tim paper (figure, equation, method, claim),
either fetch the paper (`https://arxiv.org/html/<id>` via WebFetch) and quote what's
actually there, or stay deliberately generic and let Tim fill in specifics. **Never infer
from a paper's title what the paper contains.**

### Multi-line replace_all eats indentation

Several times, bulk edits have eaten the leading 4 spaces of `<section>` tags inside
`<main>`. After any wide-net edit, sanity-check with:

```bash
grep -nE '^<section|^    <section' index.html
```

All sections inside `<main>` should match the second pattern.

### Stale id selectors after renames

When renaming an SVG/element id, search the CSS for the old id (mobile rules in particular
hide in the `@media` block). We shipped a dead `#spin-grid` mobile rule once after renaming
the hero SVG to `#opt-graph`.

## Memory

Project-specific memory lives outside the repo at:
`~/.claude/projects/-Users-t-bode-Documents-projects-websites-timbode-github-io/memory/`.

Currently:

- `feedback_no_extrapolation_about_user_work.md` — the don't-infer-paper-contents rule.
- `user_birth_name.md` — Bode / Lappe equivalence.

When you learn a durable preference or rule from Tim, add it to both `MEMORY.md` (the index)
and to this file if it shapes how the site is maintained.
