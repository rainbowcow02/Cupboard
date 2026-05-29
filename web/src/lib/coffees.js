// Turn flat "cup rows" (one brewed cup each) into coffees, the shape the app
// renders. Rows are the same coffee when bean + roaster match.

const BAG_IMGS = ['white', 'blue', 'green', 'orange'];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Stable bag artwork for a coffee, derived from its identity — so each coffee
// always shows the same bag without storing it in Notion.
export function bagImgFor(bean, roaster) {
  return BAG_IMGS[hashString(`${bean}|${roaster}`) % BAG_IMGS.length];
}

// Stable id for a coffee — a slug of bean + roaster.
export function coffeeId(bean, roaster) {
  return `${bean}|${roaster}`.trim().toLowerCase().replace(/\s+/g, '-');
}

// Display a date as "Mon D" (e.g. "May 22"). Passes through anything that
// doesn't parse as a date (so existing values like "May 9" stay untouched).
export function formatDate(s) {
  if (!s) return '';
  const trimmed = String(s).trim();
  const isISO = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  // Anchor ISO dates at noon so the day doesn't shift across timezones.
  const d = new Date(isISO ? `${trimmed.slice(0, 10)}T12:00:00` : trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Comparable value for a date string ("May 9", ISO, etc). Unknown formats
// sort last.
function dateValue(d) {
  if (!d) return -Infinity;
  const t = Date.parse(d);
  return Number.isNaN(t) ? -Infinity : t;
}

function isRealBrew(b) {
  return Boolean(b.brewer || b.beansG || b.waterMl || b.grind);
}

// Group cup rows into coffees. Coffee-level fields come from the most-recent
// row; `brews` lists every brewed cup for that coffee, newest first.
export function groupIntoCoffees(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = coffeeId(row.bean, row.roaster);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const coffees = [];
  for (const [id, group] of groups) {
    const sorted = [...group].sort((a, b) => dateValue(b.date) - dateValue(a.date));
    const latest = sorted[0];
    coffees.push({
      id,
      bean: latest.bean,
      roaster: latest.roaster,
      origin: latest.origin,
      process: latest.process,
      roastLevel: latest.roastLevel,
      region: latest.region,
      variety: latest.variety,
      notes: latest.notes,
      rating: latest.rating,
      date: latest.date,
      altitude: latest.altitude,
      bagImg: bagImgFor(latest.bean, latest.roaster),
      brews: sorted
        .map((r) => ({
          id: r.id,
          brewer: r.brewer,
          filter: r.filter,
          grind: r.grind,
          tempC: r.tempC,
          beansG: r.beansG,
          waterMl: r.waterMl,
          date: r.date,
          rating: r.rating,
          notes: r.notes,
          brewNotes: r.brewNotes,
          recipeToTest: r.recipeToTest,
          tastingNotes: r.tastingNotes,
        }))
        .filter(isRealBrew),
    });
  }

  // Newest coffee (by most-recent brew) first, matching the Home shelf order.
  coffees.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return coffees;
}

// Parse freeform recipe text into structured pour steps + brew time + agitation style.
// Handles: "bloom → 50g gentle swirl, p1 → 100, p2 → 150, gentle pours/no agitation"
// Returns { pours: [{ step, amount, technique }], brewTime, agitation } or null.
export function parseRecipe(text) {
  if (!text) return null;

  // Brew time — handles "5:11 min", "6 min", "11+ min", "4:15min", strips trailing notes
  const brewTimeMatch = text.match(/(?:•\s*)?brew\s*time[:\s]+([^\n(]{2,15})/i);
  const brewTime = brewTimeMatch
    ? brewTimeMatch[1].replace(/[?!(].*$/, '').trim()
    : null;

  // Bloom duration — search a window around the word "bloom" for a time value
  let bloomDuration = null;
  const bloomIdx = text.toLowerCase().indexOf('bloom');
  if (bloomIdx !== -1) {
    const win = text.slice(Math.max(0, bloomIdx - 30), bloomIdx + 60);
    const dm = win.match(/(\d+(?::\d+)?)\s*(min(?:utes?)?|sec(?:onds?)?)/i);
    if (dm) bloomDuration = `${dm[1]} ${dm[2].toLowerCase().startsWith('s') ? 'sec' : 'min'}`;
  }

  // Pour steps
  const pours = [];
  const re = /\b(bloom|p(\d+))\s*[-→>]+\s*(\d+\s*(?:g|ml)?)\s*([^,→\n]*)/gi;
  let m;
  let lastMatchEnd = -1;
  while ((m = re.exec(text)) !== null) {
    const step = m[2] ? `P${m[2]}` : 'Bloom';
    const rawAmt = m[3].trim();
    const amount = /^\d+$/.test(rawAmt) ? `${rawAmt}ml` : rawAmt;
    let technique = m[4].trim();
    if (step === 'Bloom' && bloomDuration) {
      technique = technique ? `${technique}, ${bloomDuration}` : bloomDuration;
    }
    pours.push({ step, amount, technique });
    lastMatchEnd = re.lastIndex;
  }

  // Global agitation style — text after the last pour step, before first period
  let agitation = null;
  if (pours.length > 0 && lastMatchEnd >= 0) {
    const tail = text.slice(lastMatchEnd);
    const ag = tail.match(/^,?\s*(.+?)(?=\.\s|\.$|\n|$)/);
    if (ag) {
      const candidate = ag[1].trim();
      if (
        /agitat|pours?\s+(with|no|gentle|low)|gentle\s+pour|low\s+agit|all\s+agit|circular/i.test(candidate) &&
        !/cafec|filter|grinder|dripper|switch|chemex/i.test(candidate)
      ) {
        agitation = candidate;
      }
    }
  }

  return (pours.length || brewTime) ? { pours, brewTime, agitation } : null;
}
