// Turn flat "cup rows" (one brewed cup each) into coffees, the shape the app
// renders. Rows are the same coffee when bean + roaster match.

export type BagImg = 'white' | 'blue' | 'green' | 'orange';

export interface Cup {
  id: string | number;
  bean: string;
  roaster: string;
  origin?: string;
  process?: string;
  roastLevel?: string;
  region?: string;
  variety?: string;
  notes?: string;
  rating?: number;
  date?: string;
  altitude?: string;
  bagImg?: BagImg;
  brewer?: string;
  filter?: string;
  grind?: string;
  tempC?: number;
  beansG?: number;
  waterMl?: number;
  brewNotes?: string;
  recipeToTest?: string;
  tastingNotes?: string;
}

export interface Brew {
  id: string | number;
  brewer?: string;
  filter?: string;
  grind?: string;
  tempC?: number;
  beansG?: number;
  waterMl?: number;
  date?: string;
  rating?: number;
  notes?: string;
  brewNotes?: string;
  recipeToTest?: string;
  tastingNotes?: string;
}

export interface Coffee {
  id: string;
  bean: string;
  roaster: string;
  origin?: string;
  process?: string;
  roastLevel?: string;
  region?: string;
  variety?: string;
  notes?: string;
  rating?: number;
  date?: string;
  altitude?: string;
  bagImg: BagImg;
  brews: Brew[];
}

export const ORIGIN_FLAGS: Record<string, string> = {
  Ethiopia: '🇪🇹',
  Colombia: '🇨🇴',
  Panama: '🇵🇦',
  Peru: '🇵🇪',
  Guatemala: '🇬🇹',
  Kenya: '🇰🇪',
  Brazil: '🇧🇷',
  'Costa Rica': '🇨🇷',
  Bolivia: '🇧🇴',
  Honduras: '🇭🇳',
  Rwanda: '🇷🇼',
  Yemen: '🇾🇪',
};

const BAG_IMGS: BagImg[] = ['white', 'blue', 'green', 'orange'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function bagImgFor(bean: string, roaster: string): BagImg {
  return BAG_IMGS[hashString(`${bean}|${roaster}`) % BAG_IMGS.length];
}

export function coffeeId(bean: string, roaster: string): string {
  return `${bean}|${roaster}`.trim().toLowerCase().replace(/\s+/g, '-');
}

export function formatDate(s: string | null | undefined): string {
  if (!s) return '';
  const trimmed = String(s).trim();
  const isISO = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  const d = new Date(isISO ? `${trimmed.slice(0, 10)}T12:00:00` : trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dateValue(d: string | undefined): number {
  if (!d) return -Infinity;
  const t = Date.parse(d);
  return Number.isNaN(t) ? -Infinity : t;
}

function isRealBrew(b: Brew): boolean {
  return Boolean(b.brewer || b.beansG || b.waterMl || b.grind);
}

export function groupIntoCoffees(rows: Cup[]): Coffee[] {
  const groups = new Map<string, Cup[]>();
  for (const row of rows) {
    const key = coffeeId(row.bean, row.roaster);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const coffees: Coffee[] = [];
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

  coffees.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return coffees;
}

export interface PourStep {
  step: string;
  amount: string;
  technique: string;
}

export interface Recipe {
  pours: PourStep[];
  brewTime: string | null;
  agitation: string | null;
}

export function parseRecipe(text: string | null | undefined): Recipe | null {
  if (!text) return null;

  const brewTimeMatch = text.match(/(?:•\s*)?brew\s*time[:\s]+([^\n(]{2,15})/i);
  const brewTime = brewTimeMatch
    ? brewTimeMatch[1].replace(/[?!(].*$/, '').trim()
    : null;

  let bloomDuration: string | null = null;
  const bloomIdx = text.toLowerCase().indexOf('bloom');
  if (bloomIdx !== -1) {
    const win = text.slice(Math.max(0, bloomIdx - 30), bloomIdx + 60);
    const dm = win.match(/(\d+(?::\d+)?)\s*(min(?:utes?)?|sec(?:onds?)?)/i);
    if (dm) bloomDuration = `${dm[1]} ${dm[2].toLowerCase().startsWith('s') ? 'sec' : 'min'}`;
  }

  const pours: PourStep[] = [];
  const re = /\b(bloom|p(\d+))\s*[-→>]+\s*(\d+\s*(?:g|ml)?)\s*([^,→\n]*)/gi;
  let m: RegExpExecArray | null;
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

  let agitation: string | null = null;
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

// Sample data for Weekend 1 — used when API is not yet connected.
// These are the same coffees shown in the web prototype.
export const sampleCups: Cup[] = [
  { id: 1, bean: 'Yirgacheffe', roaster: 'Onyx Coffee Lab', origin: 'Ethiopia', process: 'Natural', date: 'May 9', rating: 5, notes: 'Blueberry, jasmine, dark chocolate', roastLevel: 'Light', region: 'Yirgacheffe, Gedeo Zone', variety: 'Heirloom', brewer: 'Hario V60', filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 94, beansG: 18, waterMl: 300 },
  { id: 2, bean: 'El Paraíso', roaster: 'Intelligentsia', origin: 'Colombia', process: 'Washed', date: 'May 7', rating: 4, notes: 'Brown sugar, stone fruit, clean finish', roastLevel: 'Light-Medium', region: 'Huila', variety: 'Caturra', brewer: 'Chemex', filter: 'Chemex bonded', grind: 'Medium', tempC: 96, beansG: 30, waterMl: 500 },
  { id: 3, bean: 'Gesha Village', roaster: 'Verve Coffee', origin: 'Panama', process: 'Natural', date: 'May 4', rating: 5, notes: 'Peach, bergamot, honey sweetness', roastLevel: 'Light', region: 'Boquete', variety: 'Gesha', brewer: 'Hario V60', filter: 'Cafec Light', grind: '14', tempC: 93, beansG: 18, waterMl: 300 },
  { id: 4, bean: 'Huila Washed', roaster: 'Blue Bottle', origin: 'Colombia', process: 'Washed', date: 'Apr 30', rating: 4, notes: 'Caramel, red apple, walnut', roastLevel: 'Medium', region: 'Huila', variety: 'Colombia', brewer: 'Aeropress', filter: 'Aesir paper', grind: 'Medium-fine', tempC: 88, beansG: 15, waterMl: 225 },
  { id: 5, bean: 'Kochere', roaster: 'Sightglass', origin: 'Ethiopia', process: 'Washed', date: 'Apr 26', rating: 4, notes: 'Lemon verbena, nectarine, floral', roastLevel: 'Light', region: 'Yirgacheffe Zone', variety: 'Heirloom', brewer: 'Hario V60', filter: 'Hario tabbed', grind: '13', tempC: 94, beansG: 18, waterMl: 300 },
  { id: 6, bean: 'Sidama Honey', roaster: 'Counter Culture', origin: 'Ethiopia', process: 'Honey', date: 'Apr 22', rating: 3, notes: 'Apricot, milk chocolate, round body', roastLevel: 'Light-Medium', region: 'Sidama Zone', variety: 'Heirloom', brewer: 'Chemex', filter: 'Chemex bonded', grind: 'Medium', tempC: 95, beansG: 30, waterMl: 500 },
  { id: 7, bean: 'Nyeri Peaberry', roaster: 'Ritual Coffee', origin: 'Kenya', process: 'Washed', date: 'Apr 18', rating: 5, notes: 'Blackcurrant, tomato, bright acidity', roastLevel: 'Light', region: 'Nyeri County', variety: 'SL28', brewer: 'Hario V60', filter: 'Cafec Light', grind: '13', tempC: 95, beansG: 18, waterMl: 300 },
  { id: 8, bean: 'Bourbon Natural', roaster: 'Heart Coffee', origin: 'Guatemala', process: 'Natural', date: 'Apr 14', rating: 4, notes: 'Raspberry, caramel, velvety body', roastLevel: 'Light-Medium', region: 'Huehuetenango', variety: 'Bourbon', brewer: 'Hario V60', filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 93, beansG: 18, waterMl: 300 },
  { id: 9, bean: 'Cerrado Pulped', roaster: 'Stumptown', origin: 'Brazil', process: 'Pulped Natural', date: 'Apr 10', rating: 3, notes: 'Dark chocolate, hazelnut, low acid', roastLevel: 'Medium', region: 'Cerrado Mineiro', variety: 'Catuaí', brewer: 'Chemex', filter: 'Chemex bonded', grind: 'Medium-coarse', tempC: 92, beansG: 35, waterMl: 600 },
  { id: 10, bean: 'Tarrazú Honey', roaster: 'Chromatic Coffee', origin: 'Costa Rica', process: 'Honey', date: 'Apr 6', rating: 4, notes: 'Brown sugar, peach, silky mouthfeel', roastLevel: 'Light-Medium', region: 'Tarrazú', variety: 'Caturra', brewer: 'Aeropress', filter: 'Aesir paper', grind: 'Medium', tempC: 88, beansG: 18, waterMl: 240 },
];

export function sampleCoffees(): Coffee[] {
  return groupIntoCoffees(sampleCups);
}
