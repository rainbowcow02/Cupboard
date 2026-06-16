# Product Spec: Cupboard

**Version:** 0.1 — Initial Draft  
**Platform:** iOS (mobile-first)  
**Status:** Concept / Pre-development  
**Author:** Lindsay

---

## 1\. Overview

**Cupboard** is a personal iOS app for specialty coffee (and eventually matcha) enthusiasts who already track their brewing recipes obsessively — but want a more visual, delightful way to experience that data. Think of it as a *beautiful shelf for your brewing life*: somewhere between a tasting journal, a recipe archive, and a coffee passport. Each cup gets its own little home.

It is a companion to an existing Notion-based tracking practice — serving as the aesthetic, mobile-friendly front-end for data you already own.

---

## 2\. Problem Statement

Specialty coffee nerds (and matcha nerds) invest significant time logging hyper-detailed brew recipes. But spreadsheets and databases are optimized for *input and analysis* — not for *reflection, discovery, or joy*. There's no great way to:

- Flip through your cups like a photo album or field journal  
- Quickly recall your best brew for a specific bean  
- Visualize where your beans came from on a map  
- Ask "what should I try next?" without manually re-reading your data

---

## 3\. Target User

**Primary:** The spreadsheet-level coffee nerd who cares about grind size, water temp, bloom time, and dose to 0.1g precision. They already *have* the data. They want a more beautiful relationship with it.

**Secondary (future):** Matcha drinkers with equally detailed preparation logs.

Not targeting: Casual drinkers, beginners, or people who want the app to *replace* a recipe logger.

---

## 4\. Design Direction

**Aesthetic:** Modern elegant with pops of joy — think a Muji notebook that occasionally winks at you. Clean typography, generous whitespace, subtle animations. Color is used purposefully: to signal freshness, highlight favorites, or bring warmth to a bean's origin story.

**Feel:** Browsing your cups should feel like scanning a beautiful wooden shelf — each cup in its own cubby, waiting to be picked up and examined.

**Visual inspiration:** A physical cup display shelf (like a collector's curio cabinet) — each cell framing a single object. Sparse, intentional, warm natural tones with pops of personality from the cups themselves.

**UI References to explore:** Letterboxd (for the "collection" feel), Vivino (for producer/origin info), Locket (for the intimacy), Field Notes (for the journal texture).

---

## 5\. Core Concepts / Data Model

| Concept | Description |
| :---- | :---- |
| **Cup** | A single brew event. Has a date, recipe used, notes, photo, rating. |
| **Recipe** | A specific set of parameters used to brew (dose, grind, ratio, time, temp, etc.). Linked to a bean. |
| **Bean** | A specific coffee product — roaster, origin, process, varietal, roast date. |
| **(Future) Matcha** | A specific matcha product — farm, cultivar, grade, harvest date. |

A **Cup** is an *instance* of brewing a **Recipe** using a **Bean**. This three-layer model mirrors how Lindsay already thinks about her coffee.

---

## 5b. Notion Field Audit

Your Notion table is a **single flat table** — each row is one cup, with bean info, recipe params, and tasting notes all embedded in the same record. The app's three-layer model (Bean → Recipe → Cup) will be derived from this, not imported directly.

| Notion Field | Type | Maps To | V1? |
| :---- | :---- | :---- | :---- |
| Date | Date | Cup | ✅ Essential |
| Rating | Stars | Cup | ✅ Essential |
| Bean | Text | Bean name | ✅ Essential |
| Roaster | Select | Bean | ✅ Essential |
| Roast | Select (Light, Medium-Light, etc.) | Bean | ✅ Essential |
| Processing | Select (Washed, Natural, etc.) | Bean | ✅ Essential |
| Notes | Text (flavor descriptors) | Bean | ✅ Essential |
| Country | Select | Bean | ✅ Essential (map) |
| Region | Text | Bean | ✅ Essential (map) |
| Dripper | Select | Recipe | ✅ Essential |
| Grind size | Number | Recipe | ✅ Essential |
| Water temp | Number | Recipe | ✅ Essential |
| Amt beans | Number | Recipe | ✅ Essential |
| Amt water | Number | Recipe | ✅ Essential |
| Ratio | Text | Recipe | ✅ Essential |
| Tasting notes | Long text | Cup | ✅ Essential |
| Brew notes | Long text | Cup | ✅ Essential |
| Filter | Select | Recipe | ⏳ Nice to have |
| Variety | Text | Bean | ⏳ Nice to have |
| Altitude | Text | Bean | ⏳ Nice to have |
| Recipe to test | Long free text | Recipe (raw) | ⏳ Nice to have — complex to display |

**Key insight:** Because it's one flat table, the app will derive bean groupings client-side — all rows with the same Bean \+ Roaster are treated as the same bean profile. Data is confirmed clean and consistent, so this is a non-issue.

**Display approach for Cup Detail:**

- Structured recipe params (water temp, dose, ratio, grind size, dripper, filter) displayed as a clean visual recipe card — the hero of the screen  
- Tasting notes, Brew notes, and Recipe to test shown as supplementary free text below — collapsible or secondary hierarchy

---

## 6\. Features — V1 (Coffee Only)

### 6.1 Cup Collection View

- A visual gallery of all logged cups — the home screen / "shelf"  
- Each cup card shows: bean name, roaster, date brewed, thumbnail photo (user-uploaded or auto-fetched package image), star rating  
- Sort/filter by: date, rating, bean, roaster, brew method  
- "Favorites" surface: a curated view of your highest-rated cups by bean

### 6.2 Cup Detail View

- Full recipe parameters displayed aesthetically (not as a table — more like a recipe card or spec sheet)  
- User-uploaded photo of the cup  
- Tasting notes  
- Rating  
- Link to the bean's profile

### 6.3 Bean Profile

- Package image (auto-fetched from the internet based on roaster \+ bean name, with ability to override manually)  
- Origin info: country, region, farm, process, varietal  
- All cups brewed with this bean, with quick stats (avg rating, number of brews)  
- Map pin showing origin location

### 6.4 Map View

- Two distinct, toggleable layers:  
  - **Bean Origins** — pins at the farm/region level; tap to see bean name, roaster, avg cup rating  
  - **Roaster Locations** — pins at the roastery's home city; tap to see roaster name \+ beans you've tried from them  
- Both layers can be shown simultaneously or individually  
- Visual delight: a "passport stamp" feel for origins you've brewed from

### 6.5 Notion Sync / Import

- Connect to Notion via OAuth  
- Map Notion database columns to Brew Companion fields (one-time setup)  
- Initial full import; subsequent syncs pull new/updated records  
- Read-only sync from Notion → app (Notion is the permanent source of truth)  
- This is an intentional decision for a personal project: Notion is the power tool, the app is the beautiful front-end. No two-way sync needed.

### 6.6 Photo Management

- Upload photos per cup from camera roll or camera  
- Auto-cropped to a consistent aspect ratio for grid consistency  
- If no cup photo uploaded: use fetched package image as fallback

### 6.7 Package Image Fetching

- On Notion sync, attempt to auto-fetch a package image for each bean using a Roaster \+ Bean name search query (e.g. "Devoción Botica de Cafe Wild Forest coffee bag")  
- Strategy: Bing Image Search API or Google Custom Search API — best-effort, first confident result used  
- If no image found or confidence is low: show a placeholder coffee bag silhouette illustration (minimal line-art style, consistent with app aesthetic)  
- User can manually override with a photo from their camera roll at any time

---

## 7\. Features — V2 / Future Considerations

### 7.1 Matcha Vertical

- Separate (but parallel) data model: matcha product, cultivar, grade, preparation method  
- Same collection/map/favorite views adapted for matcha

### 7.2 AI Brew Assistant

- Ask questions in natural language: *"What grind size works best with my light roasts?"* or *"What should I adjust to get less bitterness from this bean?"*  
- Surface insights: *"You rated pour-overs with this bean 20% higher than AeroPress"*  
- Recipe optimization suggestions based on your own historical data  
- Powered by Claude API with your brew data as context

### 7.3 In-App Record Creation

- Add new cups and recipes directly in the app (not just via Notion sync)  
- Design challenge: how to make dense recipe forms feel light on mobile  
- Potential solution: progressive disclosure (quick-add first, full details optional), smart defaults from past recipes

### 7.4 Social / Sharing

- Share a "cup card" as an image (Instagram-ready)  
- Public profile with your collection (opt-in)

---

## 8\. Technical Considerations

| Area | Notes |
| :---- | :---- |
| **Platform** | React Native + Expo — see [iOS App - Implementation Plan.md](./iOS%20App%20-%20Implementation%20Plan.md) |
| **Data source** | Notion API (read-only sync via OAuth) |
| **Image fetching** | Web scraping or product image APIs to auto-fetch bean package photos |
| **Map** | MapKit (iOS native) or Mapbox |
| **AI integration** | Anthropic Claude API (future) |
| **Auth** | Sign in with Apple |
| **Storage** | Local-first with iCloud backup; Notion as upstream source |

---

## 9\. Out of Scope (V1)

- Android  
- Web app  
- Matcha (future vertical)  
- Two-way Notion sync (writing back to Notion)  
- In-app cup or recipe logging  
- Social features  
- Barcode scanning of bean bags  
- Timer / in-brew tooling

---

## 10\. Open Questions

1. **Image auto-fetch reliability:** Roaster websites are inconsistent. What's the fallback UX when no image is found? Options: placeholder illustration, the bean name in large typography, or let the user upload manually.

*Resolved:*

- ~~Image auto-fetch reliability~~ — Hybrid approach: auto-fetch via image search API on sync, fallback to coffee bag silhouette placeholder illustration if nothing found. Manual override always available.  
- ~~Notion field mapping complexity~~ — Field audit complete. See Section 5b.  
- ~~Bean deduplication~~ — Data is clean and consistent. Non-issue.  
- ~~Matcha timing~~ — Matcha is a future vertical, not in V1. Coffee only to start.  
- ~~In-app logging~~ — V1 is browse-only. All data entry happens in Notion.

---

## 11\. Success Metrics (Personal / V1)

- Lindsay uses the app to browse her cup history at least 3x/week  
- Import from Notion works reliably with \<5 minutes of setup  
- Map view covers all beans in current collection  
- Feels meaningfully better than opening Notion on mobile

---

*This is a living document. Treat it as a starting point, not a contract.*  

---

## 12\. To Do

- [ ] **Custom app icons for dev/preview builds** — create badged icon variants (1024×1024 PNG) so dev and preview builds are visually distinct from production on the home screen. Update `eas.json` to set `APP_VARIANT=preview` for the preview profile, and update `app.config.js` to select the correct icon asset per variant.

- [ ] **Fix mobile load performance** — app loads slowly on mobile due to three issues:
  1. Unoptimized PNG assets (~18 MB total): convert shelf and bag images to WebP at quality 80–85 for an estimated 60–75% size reduction
  2. Mapbox GL JS (~1 MB) loaded synchronously in `<head>`, blocking first render — add `defer` and/or lazy-load only when Explore tab is opened
  3. SVG nav icons are 100–200 KB each (600 KB total) — replace with simpler/smaller versions
