# Cupboard Mobile — Web Parity Tracker

Tracks feature and visual parity between the web app and the Expo mobile app. Updated after each work session.

---

## Work Batches

**Batch 1 — Tab bar** *(do first — structural, affects z-ordering and bottom padding everywhere)*
- `_layout.tsx`: floating glass pill + custom SVG icons

**Batch 2 — Home visual regressions** *(most visible on first open)*
- `index.tsx`: page header (title + avatar), shelf side margins, bag `resizeMode` fix
- Filter/sort: ported in a later session (see Home table below)

**Batch 3 — Explore functional fixes** *(all quick, makes the tab usable)*
- `explore.tsx`: bottom sheet above tab bar, remove pin dimming, flyTo reliability, date format, bag thumbnails with labels
- `BeanMarker.tsx`: SVG coffee bean map pin
- `BagLabel.tsx`: proportional label sizing for small thumbnails

**Batch 4 — Coffee Detail polish** *(fast one-liners + one heavier item)*
- `Card.tsx`: shared white card shell for detail, origin, and brew cards
- `BrewCard.tsx`: ☕ cup rating, Dripper/Filter row padding
- `[id].tsx`: back button padding, roaster/bean spacing, scroll bottom padding
- `[id].tsx`: origin mini-map *(most complex — defer if time-constrained)*

**Deferred — Feature work** *(separate focused sessions)*
- Log missing fields (brewNotes, recipeToTest, tastingNotes, altitude)
- Beans tab (carousel + Top Recipes)

---

## Parity Table

Status key: ✅ done · ❌ missing · ⚠️ partial · — not applicable

### Tab Bar

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| Floating glass pill design | ✅ | ✅ | 1 | Tab bar hovers above content as an opaque rounded pill (`#f7f7f7`) with drop shadow; bottom scrim fades content behind it — intentional move from frosted glass for web-readable contrast |
| Custom SVG icons | ✅ | ✅ | 1 | Each tab shows a clean line-drawn icon (shelf, pin, mug, bean) instead of emoji; active icon fills in moss green |
| Active tab highlight | ✅ | ⚠️ | 1 | The active tab label turns Vintage Burgundy and sits inside a soft Blossom Pink tinted highlight within the pill — pill + burgundy label done; SVG icons don't change fill/color on active state |
| Tab order (Home → Explore → Log Cup → Beans) | ✅ | ✅ | — | Tabs appear left-to-right in correct order matching Figma and web |
| Tab labels | ✅ | ✅ | — | Labels read "Home", "Explore", "Log Cup", "Beans" matching web and Figma exactly |
| Tab width (72px fixed) | ✅ | ✅ | — | Each tab is 72px wide (fixed), matching web; pill hugs content with no excess glass on the right |
| Active pill dimensions | ✅ | ✅ | — | Active pill is 76px wide with a 64px step per tab, matching web |
| Tab gap (−8px overlap) | ✅ | ✅ | — | Non-last tabs have marginRight: −8px; tabs visually overlap by 8px matching Figma |
| Pill horizontal padding | ✅ | ✅ | — | Pill has 2px horizontal padding each side, matching web's `padding: 0 2px` |

### Home

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| "Cupboard" title + avatar header | ✅ | ✅ | 2 | Top of screen shows "Cupboard" in serif display font on the left and a moss-green circle with "L" on the right |
| Shelf side margins | ✅ | ✅ | 2 | Shelf image has ~16px of pearl background visible on each side; doesn't bleed to screen edges |
| Bag images not cropped | ✅ | ✅ | 2 | Full bag silhouette is visible in its shelf slot; no bag appears clipped or zoomed-in |
| Sort: Recent / A-Z + direction | ✅ | ✅ | — | A sort pill near the header lets you toggle Recent vs A-Z and flip the direction (chevron flips, 0.15s); shelf reorders instantly |
| Filter: Country + Process + Roast | ✅ | ✅ | — | Filter bottom sheet has three grouped multi-select lists (with country flags); drag grabber up to expand, drag down at collapsed to dismiss, drag down at expanded to collapse; backdrop tap dismisses; each active dimension renders as a text pill truncated at 200px with inline ✕ |
| Bottom chrome scrim (Home + Explore) | ✅ | ✅ | — | 118px pearl→chardonnay gradient at screen bottom behind tab bar, matching web `bottomnav-gradient` |

### Explore

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| SVG coffee bean map pins | ✅ | ✅ | 3 | Map pins show a small coffee bean icon instead of the ☕ emoji; looks crisp at all zoom levels |
| No pin dimming on select | ✅ | ✅ | 3 | Tapping a pin highlights it pink but all other pins stay fully opaque — map stays readable |
| flyTo brings pin above bottom sheet | ✅ | ✅ | 3 | Tapping any pin always animates the map so that pin is centered in the visible area above the sheet, not hidden behind it |
| Bottom sheet above tab bar | ✅ | ✅ | 3 | The bottom sheet's grabber and content are fully visible above the floating tab bar; shared opaque surface tokens match filter sheet |
| Bottom sheet content-hugging (pin selected) | ✅ | ✅ | — | Single-coffee pin: one snap at exact content height. Multi-coffee pin: expands to hug full list height (capped at near-full screen); scrolls only when list exceeds screen. "All coffees" keeps 3-tier peek / ~45% / near-full snaps |
| Bottom chrome scrim | ✅ | ✅ | — | Pearl→chardonnay gradient at bottom of map screen, behind tab bar |
| Date format ("May 9") | ✅ | ✅ | 3 | Dates in the explore list read "May 9" style instead of "2025-05-09" |
| Bag thumbnails show label text | ✅ | ✅ | 3 | Each row in the sheet shows the colored bag with bean name and roaster text overlaid, matching the style on the home shelf |

### Coffee Detail

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| Bean name in Avenir Condensed | ✅ | ✅ | — | Bean names use Avenir Condensed everywhere (detail hero, explore list, shelf labels) — intentional DS choice |
| Roaster/bean name spacing | ✅ | ✅ | 4 | Roaster name and bean name have comfortable vertical breathing room; roaster reads as a clear sub-label |
| Back button top padding | ✅ | ❌ | 4 | Back chevron sits clearly below the status bar with visible padding above it; doesn't feel crammed into the top edge |
| Card readability (detail / origin / brew) | ✅ | ✅ | 4 | All coffee detail cards use shared `Card` with solid white fill — text clearly legible on pearl background |
| Card visual style | ✅ | ✅ | 4 | Mobile uses solid white cards matching brew recipe cards; web glass sheen deferred |
| ☕ cup rating (not stars) | ✅ | ✅ | 4 | Brew ratings show a colored pill with ☕️ emoji cups via the shared `CupRating` component (`src/components/CupRating.tsx`), backed by the `cupRatingScale` token in `shared/theme.ts`. Each rating 1–5 has its own tinted pill (1 grey · 2 beige · 3 fern · 4 pink · 5 grape) per Figma "cup rating badge"; web mirrors the same scale |
| Dripper/Filter row padding | ✅ | ✅ | 4 | Dripper and Filter paper labels align with the padding of all other detail rows; no longer sit flush against the card edge |
| BrewCard default/expanded states | ✅ | ✅ | — | Collapsed card leads with truncated burgundy Thoughts highlight, stats, and brew time; "See more" reveals grinder, equipment, pours, tasting notes (bold Smell:/Taste:), and Reflections (bold Thoughts:/To Try:); expand/collapse uses pour-reveal accordion animation (mobile-only) |
| BrewCard pour structure (Recipe to test) | ✅ | ✅ | — | Free-form `recipeToTest` text parses into Bloom/P1/P2… rows with amount + technique columns via shared `parseRecipe()` in `shared/lib/coffees.ts`; raw recipe fallback when parsing fails |
| BrewCard notes left-aligned | ✅ | ✅ | 4 | Tasting notes, brew notes, and recipe fallback body text are left-aligned block prose, not right-aligned like label-value rows |
| Origin mini-map | ✅ | ✅ | 4 | A small inset map (~120px tall) below the origin rows shows a zoomed-out view centered on the bean's country of origin |
| Bag hero size + shadow | ✅ | ✅ | 4 | Hero bag is 300×300 with drop shadow matching web |
| Section spacing (36px / 8px) | ✅ | ✅ | 4 | Section container gap 36px; section header-to-content gap 8px |

### Log Cup

Mobile intentionally diverges from web here. Web is a single flat "coffee + brew" form. Mobile now uses a **bean-first, recipe-aware flow**: (1) pick the bean (search your cupboard or add a new coffee), (2) choose how to brew — same recipe again, tweak an existing recipe, or new recipe, (3) log the cup. The form fields underneath reuse the shared `BrewForm`/`createCup` data model so saved data is identical to web.

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| Bean-first log flow | ❌ | ✅ | — | Log tab opens on a clean hero — "What are we brewing today?" in large serif — with two options beneath: "Choose a coffee" (→ searchable cupboard list) and "Add a new coffee" (→ new-coffee form); tapping a bean advances the flow instead of showing a flat form |
| Recipe choice step | ❌ | ✅ | — | After picking a bean with existing recipes, mobile asks: "Same recipe again", "Tweak a recipe", or "New recipe" — each routing to the appropriate next step |
| Repeat-recipe quick log | ❌ | ✅ | — | "Same recipe again" → pick a past brew → a read-only recipe summary (brewer, ratio, grind, temp, parsed pour steps) with just Date + Rating to fill in, then Save |
| Tweak-recipe flow | ❌ | ✅ | — | "Tweak a recipe" → pick a past brew → `BrewForm` pre-filled with that recipe's values (including pour structure) so the user can adjust before saving a new cup |
| New-recipe flow | ❌ | ✅ | — | "New recipe" (or any bean with no recipes yet) → blank `BrewForm` for a fresh pour structure, ratio, and temperature |
| New coffee step | ❌ | ✅ | — | "+ New coffee" → bean detail form (bean, roaster, country, process, roast, region, variety, tasting notes) → continues into the new-recipe `BrewForm` |
| Back navigation through steps | ❌ | ✅ | — | A Back affordance in the log header steps backward through bean → choice → recipe pick → form without losing the selected bean |
| Brew notes field | ✅ | ❌ | Deferred | A multiline text field in the Brew section for freeform notes about the brew session |
| Tasting notes field | ✅ | ❌ | Deferred | A multiline text field for per-brew tasting impressions, distinct from the bean-level comma-separated notes |
| Recipe to test field | ✅ | ✅ | — | Multiline "Pour structure" field in `BrewForm` (new/tweak steps); saved data renders as parsed pour cards on the detail screen and as a read-only summary in the repeat-recipe quick log |
| Altitude field | ✅ | ❌ | Deferred | A text input in the Bean section for origin altitude (e.g. "1800–2200 masl"); appears in the origin detail card |

### Beans Tab

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| "Working on" carousel | ✅ | ❌ | Future | The 3 most recently brewed coffees appear as a swipeable stacked card carousel at the top of the tab |
| Top Recipes section (4+ stars) | ✅ | ❌ | Future | Brews rated 4–5 ☕ are grouped by roast level with selectable pills; each shows a compact recipe card with key brew params |
