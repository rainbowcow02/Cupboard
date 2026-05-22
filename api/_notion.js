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
  filter:     'Filter',
  grind:      'Grind size',
  tempC:      'Water temp',   // select, e.g. "93C/199F"
  beansG:     'Amt beans',    // select, e.g. "12g"
  waterMl:    'Amt water 💧', // select, e.g. "190ml"
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
    filter:     readText(p[c.filter]),
    grind:      readText(p[c.grind]),
    tempC:      readNumber(p[c.tempC]),
    beansG:     readNumber(p[c.beansG]),
    waterMl:    readNumber(p[c.waterMl]),
  };
}
