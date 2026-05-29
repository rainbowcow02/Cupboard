# /prototype

Build N self-contained HTML interaction prototypes exploring different layout and
interaction paradigms for a given UI problem, then assemble and serve a live comparison
page where all variants run simultaneously as animated iframes.

---

## When to use

Invoke `/prototype [topic]` whenever Lindsay wants to explore "what should this
interaction feel like?" across multiple distinct approaches before deciding. Good inputs:
- `/prototype "bag detail card"`
- `/prototype "log cup flow"`
- `/prototype "onboarding sequence"`

---

## Design system tokens (always apply these)

```css
--pearl:    #f9eddd;   /* page/card background */
--moss:     #355c44;   /* primary accent, active states, CTA */
--beige:    #cca68c;   /* warm secondary */
--burgundy: #5d0505;   /* links, roaster labels, secondary text accents */
--pink:     #fc999b;   /* highlights, selection */
--gold:     #fdcb88;   /* warm accent, "best for" callouts */
--black:    #000000;   /* primary text */
--grey-dk:  #6b6b6b;   /* secondary text */
--grey-lt:  #d9d9d9;   /* dividers, disabled */
```

Fonts: **DM Serif Display** (headings, display) + **Avenir / Avenir Next** (body, UI)

| Style      | Font              | Size  | Weight |
|------------|-------------------|-------|--------|
| Page title | DM Serif Display  | 38px  | 400    |
| H1         | DM Serif Display  | 28px  | 400    |
| H2         | DM Serif Display  | 22px  | 400    |
| H3         | Avenir Heavy      | 21px  | 800    |
| H4         | Avenir Heavy      | 17px  | 800    |
| Body       | Avenir Medium     | 15px  | 500    |
| Meta       | Avenir Medium     | 13px  | 500    |
| Caption    | Avenir Medium     | 12px  | 500    |

Card radius: **34px**. Button radius: **296px** pill. Shadow: `0px 8px 40px rgba(0,0,0,0.12)`.

---

## Prototype requirements

Each variant must be a **self-contained HTML file** (`variant-1.html` through `variant-N.html`):

- No external dependencies except fonts via Google Fonts CDN and optionally
  popmotion via CDN for spring physics
- Viewport locked to **390×844** (iPhone 15 Pro) — set `width=390` in the meta viewport tag
- `overflow: hidden` on body — no internal scrollbars
- **Auto-plays its key interaction on load** in a loop via `setInterval` so it can be
  observed without any user input (demo mode)
- All colors via CSS custom properties (copy the token block above)
- Satisfying, fluid motion — use CSS transitions with cubic-bezier easing or spring
  physics for anything interactive

### ⚠️ Critical: never call `scrollIntoView()` inside a variant

`scrollIntoView()` inside an iframe propagates to the parent page and causes the
comparison page to jump. If you need to scroll within a variant's horizontal shelf
or list, use `scrollLeft` / `scrollTop` directly on the container element instead.

### What makes a good variant set

The variants should explore **genuinely different paradigms** — not just visual
reskins of the same pattern. Think about:
- Spatial metaphor (stack, shelf, arc, list, grid)
- Interaction model (swipe, scroll, tap-to-expand, hover, drag-to-rotate)
- Information density (one at a time vs. many at once)
- Motion role (is animation decorative or does it carry meaning?)

Aim for variety across: how many items are visible, what the primary gesture is,
and whether focus is explicit or ambient.

---

## Comparison page

After writing the variant HTML files, update **`build-comparison.js`**:

1. Set `EXPLORATION.brand`, `EXPLORATION.title`, and `EXPLORATION.subtitle` to describe this exploration
2. Replace the `VARIANTS` array with one entry per variant:

```js
{
  num: 1,
  name: 'Short name',         // 2–3 words
  pros: ['...', '...', '...'],  // 3 items
  cons: ['...', '...'],         // 2 items
  bestFor: 'One-line use case',
}
```

Then run:
```sh
node build-comparison.js && node serve-and-open.js
```

The comparison page will:
- Open automatically in your default browser at `http://localhost:3000/{slug}-comparison.html` where `{slug}` is derived from `EXPLORATION.title` (e.g. "Log Cup Flow" → `log-cup-flow-comparison.html`)
- Show a sticky header with exploration title + variant count + date
- Lay out variants in a 2-column grid of white cards (last variant centered if odd count)
- Embed each variant as a live iframe — all animations run simultaneously
- Show pro/con annotations in a 2-column layout within each card
- Highlight "Best for" with a gold callout

### Scroll-jacking fix (already in place)

The comparison page includes an overlay div + `wheel` event forwarder on every iframe.
This prevents the browser from routing scroll events into the iframes, so the outer page
scrolls freely. **Do not remove this pattern when regenerating the page.**

```html
<!-- In each .iframe-wrap: -->
<div class="iframe-overlay"></div>

<!-- At bottom of <body>: -->
<script>
  document.querySelectorAll('.iframe-overlay').forEach(function(el) {
    el.addEventListener('wheel', function(e) {
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: 'instant' });
    }, { passive: false });
  });
</script>
```

---

## File inventory

| File | Purpose |
|------|---------|
| `variant-N.html` | Self-contained prototype (one per variant) |
| `build-comparison.js` | Generates `cupboard-carousel-comparison.html` |
| `serve-and-open.js` | Serves all files on port 3000 + opens browser |
| `run-all.sh` | Convenience: install deps + build + serve |

---

## Workflow summary

1. Write `variant-1.html` through `variant-N.html`
2. Update `EXPLORATION` and `VARIANTS` in `build-comparison.js`
3. Run `node build-comparison.js`
4. Run `node serve-and-open.js`
5. Hard-refresh in browser (`Cmd+Shift+R`) if the server was already running
