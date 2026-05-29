import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Exploration metadata ────────────────────────────────────────────────────
// Edit this block for each new exploration.

export const EXPLORATION = {
  brand: 'Cupboard',
  title: 'Bean Hero Carousel',
  subtitle: '5 layout & interaction paradigms for the home screen hero',
};

export const VARIANTS = [
  {
    num: 1,
    name: 'Stacked Deck',
    pros: ['Tactile — mirrors physical card habits', 'Single focus, no distraction', 'Swipe is universally understood'],
    cons: ['Stack depth not obvious at a glance', 'No quick scan of all options'],
    bestFor: 'Discovery — when serendipity matters',
  },
  {
    num: 2,
    name: 'Cinematic Scroll',
    pros: ['Full-bleed visuals command attention', 'Scale contrast is instant orientation', 'Elegant with strong photography'],
    cons: ['Needs great imagery to shine', 'Non-linear nav is harder'],
    bestFor: 'Feature hero sections with rich imagery',
  },
  {
    num: 3,
    name: 'Shelf View',
    pros: ['Shows full inventory at a glance', 'Expandable detail without modals', 'Low visual noise by default'],
    cons: ['Thumbnails too small for text', 'Detail panel competes for space'],
    bestFor: 'Collection browsers — overview + detail together',
  },
  {
    num: 4,
    name: 'Vertical Ticker',
    pros: ['Dense — multiple items at once', 'Auto-advance conveys recency naturally', 'Pause-on-hover gives user control'],
    cons: ['Less discoverable interaction', 'Hard to jump non-sequentially'],
    bestFor: 'Recent activity feeds and time-ordered lists',
  },
  {
    num: 5,
    name: 'Spatial Grid',
    pros: ['3D depth creates instant "wow"', 'Arc framing gives spatial context', 'Drag physics feel premium'],
    cons: ['Higher cognitive load — unconventional', 'Small cards limit text legibility'],
    bestFor: 'Immersive moments — onboarding or hero features',
  },
];

// ─── HTML generation ─────────────────────────────────────────────────────────

function variantCard(v) {
  const prosHtml = v.pros.map(p => `
            <div class="note-row">
              <span class="note-chip pro">✓</span>
              <span>${p}</span>
            </div>`).join('');

  const consHtml = v.cons.map(c => `
            <div class="note-row">
              <span class="note-chip con">✗</span>
              <span>${c}</span>
            </div>`).join('');

  return `
      <div class="variant-card">
        <div class="card-header">
          <span class="variant-num">${v.num}</span>
          <span class="variant-name">${v.name}</span>
        </div>
        <div class="card-body">
          <div class="phone-stage">
            <div class="phone-frame">
              <div class="scale-wrapper">
                <iframe
                  src="variant-${v.num}.html"
                  width="390"
                  height="844"
                  scrolling="no"
                  frameborder="0"
                  title="Variant ${v.num} — ${v.name}"
                ></iframe>
              </div>
              <div class="iframe-overlay"></div>
            </div>
          </div>
          <div class="notes">
            ${prosHtml}
            ${consHtml}
            <div class="best-for">
              <span class="best-for-label">Best for</span>
              <span>${v.bestFor}</span>
            </div>
          </div>
        </div>
      </div>`;
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const slug = toSlug(EXPLORATION.title);
const isOddCount = VARIANTS.length % 2 === 1;
const regularCards = (isOddCount ? VARIANTS.slice(0, -1) : VARIANTS).map(variantCard).join('\n      ');
const lastCard = isOddCount
  ? `<div class="last-odd-row">\n        ${variantCard(VARIANTS[VARIANTS.length - 1])}\n      </div>`
  : '';

const date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const count = VARIANTS.length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EXPLORATION.brand} — ${EXPLORATION.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:           #f4f4f4;
      --surface:      #ffffff;
      --surface-2:    #f9f9f9;
      --border:       #e5e5e5;
      --text-1:       #111111;
      --text-2:       #555555;
      --text-3:       #999999;
      --accent:       #355c44;
      --pro:          #166534;
      --pro-bg:       #f0fdf4;
      --pro-border:   #bbf7d0;
      --con:          #991b1b;
      --con-bg:       #fef2f2;
      --con-border:   #fecaca;
      --gold:         #92400e;
      --gold-bg:      #fffbeb;
      --gold-border:  #fde68a;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: auto; }

    body {
      background: var(--bg);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      color: var(--text-1);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Sticky header ── */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 52px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: var(--accent);
    }

    .header-divider {
      width: 1px;
      height: 14px;
      background: var(--border);
    }

    .header-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-1);
    }

    .header-meta {
      font-size: 12px;
      font-weight: 400;
      color: var(--text-2);
    }

    /* ── Page body ── */
    .page-body {
      padding: 52px 80px 96px;
    }

    .page-intro {
      max-width: 1300px;
      margin: 0 auto 48px;
    }

    .page-eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 10px;
    }

    .page-title {
      font-size: 36px;
      font-weight: 700;
      color: var(--text-1);
      line-height: 1.1;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-size: 15px;
      font-weight: 400;
      color: var(--text-2);
      line-height: 1.6;
    }

    /* ── Grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px 40px;
      max-width: 1300px;
      margin: 0 auto;
    }

    .last-odd-row {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
    }

    .last-odd-row .variant-card {
      max-width: 630px; /* matches one column at max-width */
    }

    /* ── Variant card ── */
    .variant-card {
      border-radius: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }

    .variant-num {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-2);
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    .variant-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-1);
      line-height: 1;
    }

    /* ── Card body: phone left, notes right ── */
    .card-body {
      display: flex;
      align-items: stretch;
    }

    /* ── Phone frame: scaled iframe ── */
    .phone-stage {
      flex-shrink: 0;
      width: 326px; /* 254px frame + 36px padding each side */
      padding: 28px 36px;
      background: var(--surface-2);
      border-right: 1px solid var(--border);
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    /* Outer clip container — matches the 65% scaled dimensions of 390×844 */
    .phone-frame {
      width: 254px;   /* 390 × 0.65 */
      height: 549px;  /* 844 × 0.65 */
      border-radius: 29px; /* 44px × 0.65 */
      overflow: hidden;
      position: relative;
      border: 1px solid #d0d0d0;
      box-shadow:
        0 2px 12px rgba(0,0,0,0.1),
        0 1px 3px rgba(0,0,0,0.06);
    }

    /* Inner wrapper: full size, scaled down to fit the phone-frame clip */
    .scale-wrapper {
      width: 390px;
      height: 844px;
      transform: scale(0.65);
      transform-origin: top left;
    }

    .scale-wrapper iframe {
      display: block;
      border: none;
    }

    .iframe-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    /* ── Notes ── */
    .notes {
      flex: 1;
      padding: 20px 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .note-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 17px;
      font-weight: 400;
      color: var(--text-1);
      line-height: 1.45;
    }

    .note-chip {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      border: 1px solid transparent;
    }

    .note-chip.pro {
      background: var(--pro-bg);
      border-color: var(--pro-border);
      color: var(--pro);
    }
    .note-chip.con {
      background: var(--con-bg);
      border-color: var(--con-border);
      color: var(--con);
    }

    .best-for {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 15px;
      font-weight: 400;
      color: var(--gold);
      padding: 9px 12px;
      margin-top: 4px;
      background: var(--gold-bg);
      border-radius: 8px;
      border: 1px solid var(--gold-border);
      line-height: 1.45;
    }

    .best-for-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-3);
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 72px;
      font-size: 12px;
      font-weight: 400;
      color: var(--text-3);
    }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="header-left">
      <span class="header-brand">${EXPLORATION.brand}</span>
      <div class="header-divider"></div>
      <span class="header-title">${EXPLORATION.title}</span>
    </div>
    <span class="header-meta">${count} variants · ${date}</span>
  </header>

  <div class="page-body">
    <div class="page-intro">
      <div class="page-eyebrow">Design Exploration</div>
      <h1 class="page-title">${EXPLORATION.title}</h1>
      <p class="page-subtitle">${EXPLORATION.subtitle}</p>
    </div>

    <div class="grid">
      ${regularCards}
      ${lastCard}
    </div>

    <div class="footer">${EXPLORATION.brand} · ${date}</div>
  </div>

  <script>
    // Wheel events over an iframe get swallowed by the iframe's browsing context
    // even with a DOM overlay on top. Forward them explicitly to the outer window.
    document.querySelectorAll('.iframe-overlay').forEach(function(el) {
      el.addEventListener('wheel', function(e) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: 'instant' });
      }, { passive: false });
    });
  </script>

</body>
</html>`;

const outFilename = `${slug}-comparison.html`;
const outPath = path.resolve(__dirname, outFilename);
fs.writeFileSync(outPath, html);
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`✓ Saved → ${outFilename} (${sizeKB} KB)`);
console.log('  Run: node serve-and-open.js');
