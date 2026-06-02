Perform a systematic mobile ↔ web parity check for the feature or component specified (or the most recently worked-on feature if none is specified).

## Steps

1. **Identify the mobile component(s)** involved — look in `mobile/app/` and `mobile/src/components/`

2. **Find the web equivalent** — look in `../web/src/` for the matching page, component, or section

3. **Read the shared theme** — open `../shared/theme.ts` to have color tokens, font names, and spacing values on hand

4. **Read the parity tracker** — open `../docs/mobile-parity.md` to see current status for this feature

5. **Compare systematically** across these dimensions:
   - **Color tokens** — does mobile use the same theme values as web, or are there hardcoded hex values?
   - **Typography** — same font family, weight, and size for equivalent text elements?
   - **Spacing & padding** — do margins, gaps, and padding match the web layout?
   - **Data fields** — does mobile render all the same fields and content the web shows?
   - **Interactive behaviors** — same tap targets, press states, and feedback?
   - **Visual language** — icons, ratings display (☕ cups), image sizing, card opacity

6. **Output a discrepancy list** — for each mismatch, note:
   - What the web does
   - What mobile currently does
   - Priority: high (visible on first look) / medium / low

7. **Update `../docs/mobile-parity.md`** — mark each checked item with current ✅ / ❌ / ⚠️ status based on what you found

## Output format

```
## Parity check: [Feature name]

### Discrepancies found
| Item | Web | Mobile | Priority |
|---|---|---|---|
| ... | ... | ... | high/med/low |

### Already matching
- ...

### Parity tracker updated
- [list of items whose status changed]
```
