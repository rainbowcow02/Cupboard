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
// COLUMN MAPPING — set each value to the EXACT name of the matching column in
// the Notion table. These are best-guess defaults; confirm them against the
// real database (the GET route warns in the server log about any name that
// isn't found on a row).
// ───────────────────────────────────────────────────────────────────────────
export const COLUMNS = {
  bean:       'Bean',          // Title column (the coffee's name)
  roaster:    'Roaster',
  origin:     'Origin',        // country — must match a key in ORIGIN_COORDS
  process:    'Process',
  roastLevel: 'Roast',
  region:     'Region',
  variety:    'Variety',
  notes:      'Tasting Notes', // multi-select or text
  rating:     'Rating',        // number 1–5
  date:       'Date',          // brew date
  brewer:     'Brewer',
  filter:     'Filter',
  grind:      'Grind',
  tempC:      'Water Temp',    // number, °C
  beansG:     'Beans',         // number, grams
  waterMl:    'Water',         // number, ml
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
    bean:       readText(p[c.bean]),
    roaster:    readText(p[c.roaster]),
    origin:     readText(p[c.origin]),
    process:    readText(p[c.process]),
    roastLevel: readText(p[c.roastLevel]),
    region:     readText(p[c.region]),
    variety:    readText(p[c.variety]),
    notes:      readText(p[c.notes]),
    rating:     readNumber(p[c.rating]) || 0,
    date:       readDate(p[c.date]),
    brewer:     readText(p[c.brewer]),
    filter:     readText(p[c.filter]),
    grind:      readText(p[c.grind]),
    tempC:      readNumber(p[c.tempC]),
    beansG:     readNumber(p[c.beansG]),
    waterMl:    readNumber(p[c.waterMl]),
  };
}
