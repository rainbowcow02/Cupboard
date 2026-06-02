# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

## Design & Visual Consistency

**Always use shared theme tokens.** Never hardcode colors, font names, or font sizes. Import them from `../shared/theme.ts`. Using raw hex values or string font names causes parity drift against the web app.

---

## Mobile ↔ Web Parity

Before writing any mobile code for a feature that already exists in the web app:
1. Read the equivalent web component in `../web/src/`
2. Read `../shared/theme.ts` for shared token reference
3. Check `../docs/mobile-parity.md` for current parity status

Before declaring a feature done:
- Compare the mobile implementation against the web source: color tokens, spacing/padding, typography, interactive behaviors, and data fields rendered
- List any discrepancies found and whether they were fixed
- Update `../docs/mobile-parity.md` with current ✅ / ❌ / ⚠️ status

Run `/check-parity` for a systematic deep-dive comparison at any time.

---

## Package Installation

Before adding any new npm package, check if it contains native code (requires native modules or `pod install`). If it does, stop and ask before installing — a new EAS build will be required and the existing dev build will break.

---

## TypeScript

Never use `any`. If you need to work around a type, use `unknown` or write a proper type. If `any` is truly unavoidable, add a comment explaining why.

---

## Code Quality

Run `npx expo lint` before declaring any task done. Fix all errors before finishing.

---

## Component Structure & Accessibility

- Use the right component for the job: `Pressable` for buttons, `FlatList` for lists, `TextInput` for inputs — not a generic `View` with `onPress`.
- Add `accessibilityRole` to all `Pressable`, list, and header elements.
- Add `accessibilityLabel` to interactive elements that don't have visible descriptive text.
- Name `StyleSheet` entries descriptively (e.g. `headerRow`, `beanName`, `avatarCircle`) — not generically (e.g. `container`, `wrapper`, `text`).
- No inline styles for static values. Static styles belong in `StyleSheet.create()`. Inline styles are only acceptable for values computed at runtime from props or state (e.g. `style={{ opacity: isActive ? 1 : 0.4 }}`).
- When the same visual pattern appears in more than one place, extract it as a named component in `src/components/` rather than duplicating JSX.
