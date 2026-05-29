# Cupboard iOS App — React Native + Expo Port

## Context
Cupboard is a working Vite + React web app (phone mockup at 393×852px) backed by a Vercel serverless API that reads/writes to a Notion database. The goal is to port it to a real iOS app using React Native + Expo, starting with a personal TestFlight install and optionally shipping to the App Store later.

The Vercel backend stays untouched — the mobile app calls the same `/api/cups` endpoints with an absolute URL.

Both apps live in a **monorepo** so a single Claude session can read both codebases simultaneously — enabling the mobile build to stay consistent with web patterns, naming, and data flow without manual cross-referencing. See the [web app PRD](./Cupboard%20PRD.md) for product-level feature specs.

### Monorepo structure
```
Cupboard/
  web/               ← current web app (Vite + React + Vercel API)
  mobile/            ← new Expo project
  shared/
    lib/
      coffees.ts     ← single copy, imported by both apps
    assets/          ← bag-*.png, shelf-*.png (no duplication)
    theme.ts         ← colors and fonts, single source of truth
  docs/
    Cupboard PRD.md
    iOS App - Implementation Plan.md
```

**One-time Vercel config:** Set Root Directory to `web/` in Vercel project Settings → General so the serverless API continues to deploy correctly after the reorganization.

---

## Pre-Work (2–3 hrs, do before Weekend 1)

1. **Apple Developer Program** — enroll at developer.apple.com ($99/yr). Allow 24–48 hrs for payment to process.
2. **Install tooling:**
   ```
   npm install -g expo-cli eas-cli
   eas login
   xcode-select --install
   ```
3. Install **Expo Go** on your iPhone (for early testing before EAS builds)

---

## Weekend 1 — Scaffold, Navigation, Design Tokens, Home Shelf

**Goal:** App opens on your phone showing the coffee shelf with bag art.

### 1. Reorganize into monorepo, then create Expo project

First, move the existing web app into a `web/` subfolder:
```
mkdir web && mv src api public index.html vite.config.js tailwind.config.js postcss.config.js package.json package-lock.json web/
mkdir -p shared/lib shared/assets docs
mv "Cupboard PRD.md" "iOS App - Implementation Plan.md" docs/
```

Then scaffold the mobile app:
```
npx create-expo-app@latest mobile --template blank-typescript
```
Install deps:
```
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar @react-native-async-storage/async-storage expo-font @expo-google-fonts/dm-serif-display
```

### 2. File structure
```
mobile/
  app/
    _layout.tsx              ← root layout
    (tabs)/
      _layout.tsx            ← tab navigator (4 tabs)
      index.tsx              ← Home shelf
      explore.tsx            ← Map
      log.tsx                ← Log Cup
      beans.tsx              ← Beans (placeholder)
    coffee/[id].tsx          ← Detail (modal stack)
  src/
    components/              ← Bag, BagLabel, ShelfRow, GlassCard, BrewCard, RatingInput
    lib/
      api.ts                 ← fetch wrapper with absolute Vercel URL
      cache.ts               ← AsyncStorage wrapper (TTL-based)
    hooks/useCoffees.ts      ← fetch + cache hook → { coffees, loading, refresh }

shared/
  lib/
    coffees.ts               ← imported by both web and mobile
  assets/                    ← bag-*.png, shelf-*.png (referenced by both)
  theme.ts                   ← design tokens (colors, fonts)
```

### 3. Design tokens — `shared/theme.ts`
Extract colors from `web/tailwind.config.js` into `shared/theme.ts`: pearl, moss, burgundy, blossomPink, chardonnay, greyDark, greyLight. Both apps import from here — web via a Tailwind plugin or direct import, mobile directly.
Fonts: `DMSerifDisplay_400Regular` (via expo-google-fonts), `'Avenir'` and `'AvenirNextCondensed-Medium'` (iOS system fonts, no load needed).

### 4. Home shelf screen
- Port `ShelvesStart`, `ShelfContinued`, `ShelfRow`, `Bag`, `BagLabel` from `web/src/App.jsx`
- `<div>` → `<View>`, `<img>` → `<Image>`, `<p>` → `<Text>`
- Shelf scales to screen: `const scale = useWindowDimensions().width / 370`
- Skip `BagArt` SVG for now — use `bag-*.png` images directly (web app does too)
- Outer scroll: `<ScrollView>`, filter pills: `<ScrollView horizontal>`

---

## Weekend 2 — Data Layer, Log Cup, Cup Detail

**Goal:** Real Notion data loads; you can log a new cup and view its detail.

### 1. Data layer
- `src/lib/api.ts` — `fetchCups()`, `createCup()`, `updateCup()`, `deleteCup()` all call `https://your-app.vercel.app/api/...`
- Store the base URL in `app.config.js` `extra` field, read via `expo-constants`
- `shared/lib/coffees.ts` — direct port of `web/src/lib/coffees.js`, add TS types. `groupIntoCoffees`, `bagImgFor`, `coffeeId`, `formatDate` all work identically. Both apps import from here.
- `src/lib/cache.ts` — AsyncStorage with 5-min TTL. On launch: serve cache instantly, refresh in background. Offline = serve stale cache. No cache + no network = show sample data (already in `coffees.js`).

### 2. Log Cup screen
- Port `LogCupScreen` from `web/src/App.jsx`
- `<input>` → `<TextInput>`, `inputMode="decimal"` → `keyboardType="decimal-pad"`
- `<input type="date">` → `DateTimePicker` from `@react-native-community/datetimepicker`
- Wrap in `<KeyboardAwareScrollView>` (install `react-native-keyboard-aware-scroll-view`)
- POST call unchanged, just use absolute URL

### 3. Cup Detail screen (`app/coffee/[id].tsx`)
- Expo Router modal stack handles slide-up animation natively — no custom CSS needed
- `backdropFilter: blur()` → `<BlurView intensity={60} tint="light">` from `expo-blur`
- Drop `mixBlendMode` — use semi-transparent `backgroundColor` instead (visually close enough)
- Skip `OriginMap` mini-map for now (add in Weekend 3)
- `BrewForm` ports same as Log Cup form

---

## Weekend 3 — Explore Map + Bottom Sheet

**Goal:** Map screen shows origin markers; bottom sheet filters the list.

### 1. Map — use `@rnmapbox/maps`
```
npx expo install @rnmapbox/maps
```
Add to `app.json` plugins: `["@rnmapbox/maps", {"RNMapboxMapsDownloadToken": "sk.your-secret-token"}]`

Use the same Mapbox style URL and `VITE_MAPBOX_TOKEN`. `ORIGIN_COORDS` and `ORIGIN_FLAGS` constants port directly from `web/src/App.jsx`.

Replace imperative `document.createElement` markers with declarative `<MapboxGL.MarkerView>` containing a `<BeanMarker>` React Native component.

### 2. Bottom sheet — use `@gorhom/bottom-sheet`
```
npx expo install @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated
```
Snap points: `['28%', '40%']` — matches web app's `PEEK_HEIGHT` / `MAX_SHEET_H`. Replace all custom height/animation logic with the library's declarative API.

**Note:** `@rnmapbox/maps` requires a Development Build — cannot use Expo Go after this point. Run:
```
eas build --platform ios --profile development
```
Install the dev build once, then use `npx expo start --dev-client` for fast JS reloads.

---

## Getting It On Your Phone (TestFlight)

**No App Store review needed for personal use.** Internal testers install immediately.

### Steps (~2–3 hrs first time)
1. `eas build:configure` → creates `eas.json`, set `"distribution": "internal"`
2. `eas build --platform ios --profile production` (15–30 min cloud build)
3. Upload `.ipa` via **Transporter** (free Mac App Store) to App Store Connect
4. Create the app in App Store Connect (bundle ID must match `app.json`)
5. Add yourself as internal tester in TestFlight
6. Install via the TestFlight app on your iPhone

**OTA updates:** Most day-to-day changes (UI, logic, no new native modules) can push without a new build:
```
eas update --branch production --message "your change"
```

---

## App Store Submission (When Ready)

**Review time:** 24–48 hrs for new apps; usually same-day for updates.

**What you need before submitting:**
- [ ] App icon: 1024×1024 PNG, no transparency, no rounded corners
- [ ] Screenshots: at least iPhone 6.9" (iPhone 15 Pro Max size)
- [ ] Support URL (GitHub page or Notion page is fine)
- [ ] Privacy Policy URL (use a free generator — required since app touches user data)
- [ ] Age rating: 4+ (no mature content, no purchases)

**What does NOT change:**
- Vercel backend stays as-is
- Notion integration stays as-is
- No extra device permissions needed (no camera, no user location)

Submit via: `eas submit --platform ios`

---

## Keeping Web + iOS in Sync

The two codebases evolve independently but share a product spec and backend. Three things to keep mirrored:

| What | Web source | Mobile equivalent |
|------|-----------|-------------------|
| Data schema | `api/_notion.js` | `src/lib/coffees.ts` |
| Design tokens | `tailwind.config.js` | `src/theme.ts` |
| Utility logic | `src/lib/coffees.js` | `src/lib/coffees.ts` |

When you change any of these on one side, update the other. New features go to the web app first (faster iteration), then get ported to mobile.

---

## Key Reference Files

| What | Path |
|------|------|
| All screens + components | `web/src/App.jsx` |
| Shared utility functions | `shared/lib/coffees.ts` |
| Data schema (field names/types) | `web/api/_notion.js` |
| Design tokens | `shared/theme.ts` |
| Bag + shelf images | `shared/assets/` |

---

## Web → React Native Translation Cheatsheet

| Web | React Native |
|-----|------|
| `<div>`, `<p>`, `<span>` | `<View>`, `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<TouchableOpacity>` |
| `overflow: auto` scroll | `<ScrollView>` |
| `backdropFilter: blur()` | `<BlurView>` (expo-blur) |
| CSS keyframe animation | react-native-reanimated |
| `vh` / `vw` | `useWindowDimensions()` |
| Google Fonts `<link>` | `expo-font` + `useFonts()` |
| Mapbox GL JS (CDN) | `@rnmapbox/maps` |
| `document.createElement` | Declarative JSX |

---

## Verification Checkpoints

- **Weekend 1:** `npx expo start` → scan QR with Expo Go → shelf renders with real bag images
- **Weekend 2:** Log a new cup → appears in Notion and on the shelf; kill app, reopen → loads from cache
- **Weekend 3:** Explore map shows origin markers → tap origin → bottom sheet filters correctly
- **TestFlight:** Install on iPhone, walk all 4 tabs, log a cup while offline → syncs when back online
