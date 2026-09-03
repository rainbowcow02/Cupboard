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
- Log missing fields (altitude)
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
| One bag asset per coffee | ❌ | ✅ | — | Each coffee shows exactly one bag image. Mobile's `bag-blue-{lrg,sm}.png` were re-exported to strip a green bag baked in behind them (and an orange one under the small variant); `bag-blue-sm.png` was re-padded to 269×552 so it aligns with its siblings under `contentFit="contain"`. Web's `bag-blue.png` / `bag-blue.webp` still carry the original stacked export (green rows 11–19 and 1218–1222 on the 600×1234 canvas) — copy the clean mobile export over when picked up |
| Bag label sizing floors | ✅ | ✅ | — | `BagLabel`'s non-small floors match web's `BagLabel` (`web/src/App.jsx`): `labelWidth` `Math.max(70, …)` and `beanFontSize` `Math.max(16, …)`, so the ~89px home bag resolves to a 70px label box at 16px on both. Mobile had drifted to 60/15, which left a long single word ("Watermelon" = 62.6pt in Avenir Next Condensed at 16pt) wider than the box and forced a mid-word break — a stray "n" on its own line. Mobile's sub-80px `small` branch (Explore/Log thumbnails, no width floor, 8px font floor) stays mobile-only; web renders no bag that small |
| Long name + long roaster label lift | ❌ | ✅ | — | **Mobile-only divergence.** When a bean name hits its 4-line clamp *and* the roaster wraps to 3 lines, the whole label block moves from `top: 24%` to `top: 10.75%` (24px higher on the 181pt shelf bag) so the divider and origin stay on the bag face instead of landing on the bottom seal. Mobile measures wrapped lines via `onTextLayout`; web's `BagLabel` (`web/src/App.jsx`) has no equivalent and instead clips the overflow with `overflow-hidden`. Porting to web needs a separate measurement approach |

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
| Region metadata when country selected | ❌ | ✅ | — | Country bottom sheet subtitle reads "N coffees · N regions" instead of the redundant "1 country"; each row shows the coffee's region instead of repeating the already-known country flag/name. Mobile-only for now — web `App.jsx` (~line 1034) still shows the old "1 country" subtitle and per-row country label |

### Coffee Detail

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| Bean name in Avenir Condensed | ✅ | ✅ | — | Bean names use Avenir Condensed everywhere (detail hero, explore list, shelf labels) — intentional DS choice |
| Roaster/bean name spacing | ✅ | ✅ | 4 | Roaster name and bean name have comfortable vertical breathing room; roaster reads as a clear sub-label |
| Back button top padding | ✅ | ✅ | 4 | Back chevron sits clearly below the status bar with visible padding above it; doesn't feel crammed into the top edge |
| Card readability (detail / origin / brew) | ✅ | ✅ | 4 | All coffee detail cards use shared `Card` with solid white fill — text clearly legible on pearl background |
| Card visual style | ✅ | ✅ | 4 | Mobile uses solid white cards matching brew recipe cards; web glass sheen deferred |
| ☕ cup rating (not stars) | ✅ | ✅ | 4 | Brew ratings show a colored pill with ☕️ emoji cups via the shared `CupRating` component (`src/components/CupRating.tsx`), backed by the `cupRatingScale` token in `shared/theme.ts`. Each rating 1–5 has its own tinted pill (1 grey · 2 beige · 3 fern · 4 pink · 5 grape) per Figma "cup rating badge"; web mirrors the same scale |
| Dripper/Filter row padding | ✅ | ✅ | 4 | Dripper and Filter paper labels align with the padding of all other detail rows; no longer sit flush against the card edge |
| BrewCard default/expanded states | ✅ | ⚠️ | — | Collapsed card leads with truncated burgundy Thoughts highlight, stats, and brew time; "See more" reveals grinder, equipment, pours, tasting notes (bold Smell:/Taste:), and Brew Notes (bold Thoughts:/To Try: parsed when present, else raw text), sourced solely from the Notion "Brew Notes" column — the separate "Reflections" column/field has been retired app-wide (`web/api/_notion.js`, `shared/lib/coffees.ts`). **Mobile-only enhancement, not a parity gap:** web's `BrewCard` (`web/src/App.jsx`) renders Brew Notes as a plain unparsed text block with no Thoughts:/To Try: structure or burgundy highlight; expand/collapse uses pour-reveal accordion animation (mobile-only) |
| `*word*` inline bold rendering | ❌ | ✅ | — | Text wrapped in single asterisks (typed as literal syntax in the note fields — never transformed live, matching the "-" → "•" storage convention) renders bold via `src/lib/inlineBold.tsx`, applied everywhere `BrewCard.tsx` renders Thoughts/To Try, Smell/Taste, and the pour-note/recipe-fallback text. **Mobile-only enhancement:** web's `BrewCard` (`web/src/App.jsx`) renders these fields as plain unparsed text with no inline markdown support |
| BrewCard pour structure (Recipe to test) | ✅ | ✅ | — | Free-form `recipeToTest` text parses into Bloom/P1/P2… rows with amount + technique columns via shared `parseRecipe()` in `shared/lib/coffees.ts`; raw recipe fallback when parsing fails. `parseRecipe` now (a) tolerates inline filler between a step keyword and its arrow so e.g. "Bloom 1:30m -> 60" parses as a Bloom row instead of being dropped, and (b) captures *all* remaining text after the last pour as a general `note` (was previously gated to agitation-flavored phrasing only, silently dropping anything else, e.g. a second "Timer glitched…" sentence) — both fixes apply identically on web since it re-exports the same `shared/lib/coffees.ts` |
| BrewCard notes left-aligned | ✅ | ✅ | 4 | Tasting notes, brew notes, and recipe fallback body text are left-aligned block prose, not right-aligned like label-value rows |
| Origin mini-map | ✅ | ✅ | 4 | A small inset map (~120px tall) below the origin rows shows a zoomed-out view centered on the bean's country of origin. **Mobile-only refinement:** the Origin card/section on `app/coffee/[beanId].tsx` is now hidden entirely when a bean has neither `region` nor `origin`; the map's pin label (accessibility text on native, visible text on the Expo-web stub) prefers `region` and falls back to `origin` (country) when no region is set. Web's production `OriginMap` (`web/src/App.jsx`) has no equivalent label and is unaffected — pin coordinates on both platforms are still keyed by country only, since no per-region coordinate data exists |
| Bag hero size + shadow | ✅ | ✅ | 4 | Hero bag is 300×300 with drop shadow matching web |
| Section spacing (36px / 8px) | ✅ | ✅ | 4 | Section container gap 36px; section header-to-content gap 8px |
| "+ Add" link treatment | ⚠️ | ✅ | — | Every inline "+ Add …" text action now renders through the shared `src/components/AddLink.tsx`, styled from the `links.small` token in `shared/theme.ts` plus burgundy (Avenir 13 / weight 800 — exact DS "Small link" — with 4px vertical padding, 8px hitSlop, 0.6 pressed opacity) — the "+ Add" in the Brew recipes section header on `app/coffee/[beanId].tsx` and "+ Add pour" / "+ Add note" in `PourStructureField`. **Deliberate divergence from web:** web's `DetailSection` action (`web/src/App.jsx`) is Avenir 12 / weight 500, which read noticeably lighter than the recipe-form add links; mobile standardizes on the bolder of the two |
| Edit bean details | ❌ | ✅ | — | White "Edit" pill top-right (opposite the glass back button) opens `EditBeanStep`, a full-screen sheet reusing the shared `BeanFields` (same field set as `NewBeanStep`, pre-filled from the coffee). Save PATCHes the bean fields across every cup of that bean via `updateBeanDetails`; renaming bean/roaster re-points the screen at the new derived id. Mobile-only — web has no bean-edit flow |
| Add-a-recipe from a bean | ❌ | ✅ | — | "+ Add" in the Brew recipes section opens the Log flow's own `RecipeIterationScreen` (base `null`) as a sheet over the bean page — the same "Set a recipe" title, `BeanCard` header and "Log this cup" button the flow uses — rather than a second, separately-built new-brew form. `BrewForm` (`app/coffee/BrewForm.tsx`) is now only the edit-a-brew sheet. Both sheets, plus `EditBeanStep`, stack through the shared `surfaces/SheetOverlay` |
| Sheet header chrome (edit brew / add recipe) | ❌ | ✅ | — | Sheets opened over the bean page carry the same floating chrome as the Log flow's form steps via `LogFormScaffold`'s new `leadingIcon` prop: a glass X on the left (`GlassCloseButton` — an X drawn on `BackButton`'s 22-unit grid so its ink, stroke weight and size match the back chevron, in the same frosted circle via the extracted `surfaces/GlassCircle`) since these are dismissed rather than navigated back from, with the title block sitting in the scroll content below the chrome as on `NewBeanStep`. Replaces the old inline Cancel / centered-title / Save text row on `BrewForm`, whose Save is now a `HeaderPillButton`. Mobile-only — web has no equivalent sheet chrome |

### Log Cup

Mobile intentionally diverges from web here. Web is a single flat "coffee + brew" form. Mobile uses a **consolidated, cupboard-first flow** (overhauled 2026-06): the Log tab opens directly on the cupboard list ("What are we brewing?" + subtle "Add"), tapping a bean drops straight into an editable recipe screen where you pick a recent recipe as a base and tweak any field — changed fields show a "was X" hint against the base. Saved data reuses the shared `BrewFieldSet`/`createCup` model so it stays identical to web. Field selectors (`ComboBoxField`) open a bottom sheet anchored over the tab bar showing existing options first; the keyboard only rises when the search field is tapped.

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| Cupboard-first log home | ❌ | ✅ | — | Log tab opens on `LogHomeScreen`: a list of bean cards (bag · name · roaster · flag+origin · date) with a floating "Search your cupboard" pill docked 8px above the tab bar that only raises the keyboard on tap |
| Collapsing brew CTA header | ❌ | ✅ | — | "What are we brewing today?" is the content CTA (Avenir Heavy 21px / H3, centered) placed lower on the page for breathing room; a fixed top bar keeps the "Add" pill, and once the CTA scrolls past it the collapsed DM Serif 17px title fades into the bar — matches Figma `987:2889` |
| Recipe iteration screen | ❌ | ✅ | — | Tapping a bean → `RecipeIterationScreen`: a horizontal strip of recent recipe cards (base selector) above an editable `BrewFieldSet`; picking a base prefills the form, Date defaults to today, Rating empty, then "Log this cup". Shares the `RecipeBeanHeader` ("Set a recipe" title + description + tappable `BeanCard` + divider) with `SetRecipeScreen` so the two steps lead with an identical header/coffee card (Figma `1011:3392`) |
| Previous-value diff hints | ❌ | ✅ | — | Editing a field that differs from the chosen base recipe shows a burgundy "was 18 g" hint beneath it (via `FieldDiffHint`), so it's obvious what changed for this test; unchanged fields show no hint |
| First-cup blank form | ❌ | ✅ | — | A bean with no recipes yet skips the recipe strip and shows a blank editable `BrewFieldSet` directly |
| New coffee (manual) | ❌ | ✅ | — | "Add" → `NewBeanStep` → continues into the iteration form. **Empty states intentionally diverge from web (2026-06):** mobile uses a warm question/phrase voice ("Who's the roaster?", "Where was it sourced?", "How was it processed?", "What's the roast-level?", "Know the region?", "Which varietal?"; tasting notes keeps an example, "e.g. Rose Tea, Oolong, Cantalope"), whereas web seeds concrete example values ("H&S Coffee Roasters", "Washed", "Light", "Nyamagabe", "Red Bourbon"). Bean stays "Add bean name". |
| Add coffee via link | ❌ | ✅ | — | "Add from a link" in the new-coffee form → paste a roaster URL → `/api/extract-bean` pulls bean/origin/process/notes via Claude → review/edit in the standard new-bean form → save (needs `ANTHROPIC_API_KEY` set in Vercel) |
| Field selector sheets (options-first) | ❌ | ✅ | — | `ComboBoxField` opens a detached bottom sheet floating over the tab bar (like the Home filter sheet) listing existing options with the keyboard down; typing to search or add a new value is the secondary action |
| Recipe field pickers | ❌ | ✅ | — | In `BrewFieldSet`, Brewer, **Grinder** (new field above Grind size), and Filter use single-select `ComboBoxField`s sourced from distinct values across the user's logged brews (`distinctBrewValues`). Grind size, Beans (g), Water (ml), and Temp °C also use `ComboBoxField`, with options = only the values the user has actually logged (`distinctBrewValues`, ordered numerically); tapping the search field opens the device number pad (`keyboardType="decimal-pad"`) to add a new value. **Mobile-only — web has no recipe-entry form at all**, only the read-only `BrewCard` display. `grinder` flows through `brewFieldsPayload` → `createCup` (`Cup.grinder`). Empty states use the same question/phrase voice as the new-coffee form ("Which brewer?", "Which filter?", "Which grinder?", "What grind size?") with playful emoji-suffixed prompts on the numeric fields ("Amount of coffee? 🫘", "Amount of water? 💧", "How hot? 🔥"); web uses example values ("Hario V60", "18", "300"). Row labels are bold (Avenir Heavy, was 600) and fields/dropdowns are tighter (row gap 10 was 14, field padding-vertical 10 was 12, min row height 43 was 46) — matches Figma `1068:8537` |
| Pour structure layout | ❌ | ✅ | — | `PourStructureField` rows sit directly under Temperature with no group header, each showing its own bold label at the standard 92px column width so rows align with the fields above: "Bloom", "Pour 1", "Pour 2", "Pour 3" on screen (internally still serialized as `P1`/`P2`… to match `parseRecipe()`'s grammar and the compact `P1` pills `BrewCard` renders), a wider 80px amount field + flex "Notes" field per row, and a trailing "+ Add pour" / "+ Add note" link row. Layout matches Figma `1068:10290` (bold "Note" label + flex note field, placeholder "Agitation, timing, etc.") when shown. **Mobile-only UX divergence from the static Figma mock:** the free-form pour note is hidden behind "+ Add note" for a brand-new recipe and only auto-revealed when editing/duplicating a recipe that already has one, and the field is a single line by default that grows with typed content rather than a fixed-height box |
| Brew time field | ✅ (read-only display) | ✅ | — | New standalone "Brew time" row in `BrewFieldSet` — a manually-typed field (e.g. "3:20") with a fixed "min" suffix inside the input, not a `ComboBoxField` picker. Stored inside the same `recipeToTest` "Recipe to test" Notion column as the pour structure (appended as `Brew time: 3:20 min`) via `serializePourStructure`/`pourFormFromRecipeText` in `src/lib/pourStructure.ts`, so it round-trips through the same `parseRecipe()` grammar `BrewCard`'s Brew time row already reads |
| Back navigation through steps | ❌ | ✅ | — | A Back affordance in the log header returns from iterate / new-bean / add-via-link to the cupboard home without losing context |
| Recipe to test field | ❌ | ✅ | — | Structured "Pour structure" builder (Bloom/P1/P2/P3 + add pour + brew time) in `BrewFieldSet`, serialized to the same `recipeToTest` sentence web/Notion expect; saved data renders as parsed pour cards on the detail screen. Web has no entry form for this field at all (display-only) |
| Brew notes field | ✅ | ✅ | — | `BrewFieldSet`'s "Brew notes" row is a `StructuredNotesField`: one bordered box split into "Thoughts" and "To Try" sub-inputs (placeholder text matches the Figma labels exactly) so the user never hand-types the `Thoughts:`/`To Try:` markers — serialized via `serializeBrewNotes` in `src/lib/notesStructure.ts`, the same grammar `BrewCard`'s `parseBrewNotes` (now imported from that shared lib instead of duplicated locally) already renders as a bold-labeled block. Matches Figma `1068:8537` |
| Tasting notes field | ✅ | ✅ | — | Same structured pattern as Brew notes: "Smell" and "Taste" sub-inputs in one `StructuredNotesField`, serialized via `serializeTastingNotes`/`parseTastingNotes` (`src/lib/notesStructure.ts`), distinct from the bean-level comma-separated notes. Matches Figma `1068:8537` |
| Note auto-format shortcuts (bullet · arrow) | ❌ | ✅ | — | Typing "- " at the start of a line in the Pour note, Tasting notes (Smell/Taste), or Brew notes (Thoughts/To Try) fields auto-converts to "• "; typing "->" anywhere in those fields auto-converts to "→" — via `src/lib/textAutoFormat.ts` + `src/hooks/useAutoFormatTextInput.ts`, wired into `PourStructureField.tsx` and `StructuredNotesField.tsx`. **Mobile-only enhancement:** web (`web/src/App.jsx`) has no equivalent live-typing behavior on its note `<textarea>`s |
| Altitude field (input) | ✅ | ❌ | Deferred | A text input in the new-coffee form for origin altitude; the value already renders in the origin detail card when present |
| Rating field (input) | ⚠️ (5-star) | ✅ | — | `BrewFieldSet`'s Rating row uses `CupRatingField`, a `ComboBoxField`-style dropdown: the trigger shows the current value as the same tinted ☕️ cup pill as the read-only `CupRating` badge (or "Not yet rated"), and tapping it opens a detached sheet listing all 5 cup pills (5→1) with a checkmark on the active one and a header "Clear" to unset — matches Figma "rating" component `1076:10756`. Replaces the old star `RatingInput`, which is now mobile-only removed. **Web still shows 5 clickable stars** (`RatingInput` in `web/src/App.jsx`) — not ported in this pass |

### Beans Tab

| Item | Web | Mobile | Batch | Success looks like |
|---|---|---|---|---|
| "Working on" carousel | ✅ | ❌ | Future | The 3 most recently brewed coffees appear as a swipeable stacked card carousel at the top of the tab |
| Top Recipes section (4+ stars) | ✅ | ❌ | Future | Brews rated 4–5 ☕ are grouped by roast level with selectable pills; each shows a compact recipe card with key brew params |
