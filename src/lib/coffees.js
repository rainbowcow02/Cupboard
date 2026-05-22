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
        }))
        .filter(isRealBrew),
    });
  }

  // Newest coffee (by most-recent brew) first, matching the Home shelf order.
  coffees.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return coffees;
}
