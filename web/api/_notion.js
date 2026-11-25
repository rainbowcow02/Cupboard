// Shared Notion helpers for the serverless API routes.
// Underscore-prefixed: Vercel treats this as a module, not an HTTP route.
import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  // Pin the classic API so databases.query keeps its documented behavior.
  notionVersion: '2022-06-28',
});

export const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export function notionConfigured() {
  return Boolean(process.env.NOTION_TOKEN && DATABASE_ID);
}

// ───────────────────────────────────────────────────────────────────────────
// COLUMN MAPPING — each value is the EXACT name of the column in the Notion
// "Recipes" database (one row = one brewed cup). The GET route warns in the
// server log if any of these names isn't found on a row.
// ───────────────────────────────────────────────────────────────────────────
export const COLUMNS = {
  bean:       'Bean',
  roaster:    'Roaster',
  origin:     'Country',      // multi-select; option names are flag-prefixed
  process:    'Processing',
  roastLevel: 'Roast',
  region:     'Region',
  variety:    'Variety',
  notes:      'Notes',        // short comma-separated tasting notes → chips
  rating:     'Rating ',      // NOTE: trailing space in the real column name
  date:       'Date',         // title column — holds the brew date
  brewer:     'Dripper',
  grinder:    'Grinder',
  filter:     'Filter',
  grind:      'Grind size',
  tempC:      'Water temp',   // select, e.g. "93C/199F"
  beansG:       'Amt beans',      // select, e.g. "12g"
  waterMl:      'Amt water 💧',   // select, e.g. "190ml"
  altitude:     'Altitude',
  brewNotes:    'Brew Notes',
  recipeToTest: 'Recipe to test', // free-form paragraph: pour structure + brew time
  tastingNotes: 'Tasting notes',  // detailed per-brew tasting notes (distinct from short Notes chips)
};

// ─── Property readers — tolerant of whichever Notion property type a column is.
function readText(prop) {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':        return prop.title.map((t) => t.plain_text).join('');
    case 'rich_text':    return prop.rich_text.map((t) => t.plain_text).join('');
    case 'select':       return prop.select?.name || '';
    case 'status':       return prop.status?.name || '';
    case 'multi_select': return prop.multi_select.map((s) => s.name).join(', ');
    case 'number':       return prop.number != null ? String(prop.number) : '';
    case 'date':         return prop.date?.start || '';
    case 'formula':
      return prop.formula?.string
        ?? (prop.formula?.number != null ? String(prop.formula.number) : '');
    case 'rollup':
      return (prop.rollup?.array || []).map(readText).filter(Boolean).join(', ');
    default:             return '';
  }
}

function readNumber(prop) {
  if (!prop) return null;
  if (prop.type === 'number') return prop.number;
  if (prop.type === 'formula' && prop.formula?.type === 'number') return prop.formula.number;
  const n = parseFloat(readText(prop));
  return Number.isNaN(n) ? null : n;
}

function readDate(prop) {
  if (!prop) return '';
  if (prop.type === 'date') return prop.date?.start || '';
  return readText(prop);
}

// "Rating " is a select of ☕ repeated 1–5 times → a 1–5 number.
function readRating(prop) {
  return (readText(prop).match(/☕/g) || []).length;
}

// "Country" multi-select option names are flag-prefixed ("🇷🇼 Rwanda").
// Strip the flag so the value matches ORIGIN_COORDS / ORIGIN_FLAGS keys.
function readCountry(prop) {
  const raw = prop?.multi_select?.[0]?.name || readText(prop);
  return raw.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').trim();
}

// One-time warning if a mapped column name isn't present on a Notion page.
let _warned = false;
function warnMissingColumns(properties) {
  if (_warned) return;
  _warned = true;
  for (const [field, colName] of Object.entries(COLUMNS)) {
    if (!(colName in properties)) {
      console.warn(
        `[notion] COLUMNS.${field} → "${colName}" not found on the database. ` +
        `Edit api/_notion.js COLUMNS to match the real column name.`,
      );
    }
  }
}

// Notion page → flat "cup row" the app consumes (one brewed cup).
export function rowToCup(page) {
  const p = page.properties || {};
  warnMissingColumns(p);
  const c = COLUMNS;
  return {
    id:         page.id,
    // Brew dates are day-only; creation time orders same-day brews.
    createdAt:  page.created_time || '',
    bean:       readText(p[c.bean]).trim(),
    roaster:    readText(p[c.roaster]),
    origin:     readCountry(p[c.origin]),
    process:    readText(p[c.process]),
    roastLevel: readText(p[c.roastLevel]),
    region:     readText(p[c.region]),
    variety:    readText(p[c.variety]),
    notes:      readText(p[c.notes]),
    rating:     readRating(p[c.rating]),
    date:       readDate(p[c.date]).trim(),
    brewer:     readText(p[c.brewer]),
    grinder:    readText(p[c.grinder]),
    filter:     readText(p[c.filter]),
    grind:      readText(p[c.grind]),
    tempC:      readNumber(p[c.tempC]),
    beansG:       readNumber(p[c.beansG]),
    waterMl:      readNumber(p[c.waterMl]),
    altitude:     readText(p[c.altitude]),
    brewNotes:    readText(p[c.brewNotes]),
    recipeToTest: readText(p[c.recipeToTest]),
    tastingNotes: readText(p[c.tastingNotes]),
  };
}

// ─── Writing ────────────────────────────────────────────────────────────────

// Country → flag, so writes use the flag-prefixed option names the DB already
// has (rather than creating bare-name duplicates).
const COUNTRY_FLAGS = {
  Bolivia: '🇧🇴', Brazil: '🇧🇷', Colombia: '🇨🇴', 'Costa Rica': '🇨🇷',
  Ethiopia: '🇪🇹', Guatemala: '🇬🇹', Honduras: '🇭🇳', Kenya: '🇰🇪',
  Panama: '🇵🇦', Peru: '🇵🇪', Rwanda: '🇷🇼', Yemen: '🇾🇪',
};

// Notion caps a single rich-text object at 2,000 characters, so longer notes
// are split across several objects (rowToCup joins them back on read).
const RICH_TEXT_CHUNK = 2000;

export function richText(s) {
  if (!s) return [];
  const text = String(s);
  const chunks = [];
  for (let i = 0; i < text.length; i += RICH_TEXT_CHUNK) {
    chunks.push({ text: { content: text.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

function multiSelect(s) {
  return String(s || '')
    .split(',').map((x) => x.trim()).filter(Boolean)
    .map((name) => ({ name }));
}

// App cup → Notion page properties. Numbers are formatted into the select-
// string conventions the database uses ("12g", "190ml", "93C/199F").
//
// A field that is missing (or undefined / '') is left out, so PATCH leaves it
// untouched. A field sent as `null` is an explicit clear: the column is emptied.
// The mobile app sends `null` when a user deletes a value in an edit form.
export function cupToProperties(cup) {
  const c = COLUMNS;
  const props = {};
  const setText = (col, v) => {
    if (v) props[col] = { rich_text: richText(v) };
    else if (v === null) props[col] = { rich_text: [] };
  };
  const setSelect = (col, v) => {
    if (v) props[col] = { select: { name: String(v) } };
    else if (v === null) props[col] = { select: null };
  };
  const setMultiSelect = (col, v) => {
    if (v) props[col] = { multi_select: multiSelect(v) };
    else if (v === null) props[col] = { multi_select: [] };
  };
  const hasNumber = (v) => v != null && v !== '';

  if (cup.date) {
    // The title column holds a Notion date mention, which renders relatively
    // ("@Today", "@Jan 1, 2026"). Write a date mention for ISO dates; fall
    // back to plain text for anything that isn't a plain ISO date. The title
    // is never cleared.
    const d = String(cup.date).trim();
    props[c.date] = /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? { title: [{ type: 'mention', mention: { type: 'date', date: { start: d } } }] }
      : { title: richText(d) };
  }
  setText(c.bean, cup.bean);
  setText(c.notes, cup.notes);
  setSelect(c.roaster, cup.roaster);
  setSelect(c.process, cup.process);
  setSelect(c.roastLevel, cup.roastLevel);
  setSelect(c.brewer, cup.brewer);
  setSelect(c.grinder, cup.grinder);
  setSelect(c.filter, cup.filter);
  setSelect(c.grind, cup.grind);

  setMultiSelect(c.variety, cup.variety);
  setMultiSelect(c.region, cup.region);
  if (cup.origin) {
    // Flag-prefixed option names ("🇮🇳 India") match the options the DB
    // already has, rather than creating bare-name duplicates.
    const flag = COUNTRY_FLAGS[cup.origin];
    props[c.origin] = { multi_select: [{ name: flag ? `${flag} ${cup.origin}` : cup.origin }] };
  } else if (cup.origin === null) {
    props[c.origin] = { multi_select: [] };
  }

  if (cup.rating) props[c.rating] = { select: { name: '☕️'.repeat(cup.rating) } };
  else if (cup.rating === null) props[c.rating] = { select: null };

  if (hasNumber(cup.beansG)) props[c.beansG] = { select: { name: `${cup.beansG}g` } };
  else if (cup.beansG === null) props[c.beansG] = { select: null };
  if (hasNumber(cup.waterMl)) props[c.waterMl] = { select: { name: `${cup.waterMl}ml` } };
  else if (cup.waterMl === null) props[c.waterMl] = { select: null };
  if (hasNumber(cup.tempC)) {
    const f = Math.round(Number(cup.tempC) * 9 / 5 + 32);
    props[c.tempC] = { select: { name: `${cup.tempC}C/${f}F` } };
  } else if (cup.tempC === null) {
    props[c.tempC] = { select: null };
  }

  // Free-form text columns — read back by rowToCup but historically never
  // written, so they stayed empty in Notion. All map to `text` properties.
  setText(c.altitude, cup.altitude);
  setText(c.recipeToTest, cup.recipeToTest);
  setText(c.brewNotes, cup.brewNotes);
  setText(c.tastingNotes, cup.tastingNotes);
  return props;
}

// Pass Notion's rate-limit status through so clients know a retry will help;
// every other Notion failure stays a 502.
export function notionErrorStatus(err) {
  return err?.status === 429 ? 429 : 502;
}
