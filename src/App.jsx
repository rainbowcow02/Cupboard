import React from 'react';
import { groupIntoCoffees, formatDate, parseRecipe } from './lib/coffees.js';

const MAPBOX_PROD_TOKEN = 'pk.eyJ1IjoicmFpbmJvd2NvdzAyIiwiYSI6ImNtcGN0N3pmdjA1MnIyeHB2aDFqa21hdjcifQ.X3TvBj8J2kqQyeRYxzAiAQ';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || MAPBOX_PROD_TOKEN;

// Lazy-load Mapbox GL JS + CSS on first use so it doesn't block initial render.
let _mapboxPromise = null;
function loadMapbox() {
  if (_mapboxPromise) return _mapboxPromise;
  _mapboxPromise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
  return _mapboxPromise;
}

const ORIGIN_COORDS = {
  'Ethiopia':  [8.6,  39.6],
  'Colombia':  [4.5, -74.3],
  'Panama':    [8.9, -79.5],
  'Peru':      [-9.2, -75.0],
  'Guatemala': [15.5, -90.2],
  'Kenya':     [0.0,  37.9],
  'Brazil':    [-14.2, -51.9],
  'Costa Rica':[9.7, -83.8],
  'Bolivia':   [-16.3, -63.6],
  'Honduras':  [15.2, -86.2],
  'Rwanda':    [-1.9,  29.9],
  'Yemen':     [15.5,  48.5],
};

const ORIGIN_FLAGS = {
  'Ethiopia':   '🇪🇹',
  'Colombia':   '🇨🇴',
  'Panama':     '🇵🇦',
  'Peru':       '🇵🇪',
  'Guatemala':  '🇬🇹',
  'Kenya':      '🇰🇪',
  'Brazil':     '🇧🇷',
  'Costa Rica': '🇨🇷',
  'Bolivia':    '🇧🇴',
  'Honduras':   '🇭🇳',
  'Rwanda':     '🇷🇼',
  'Yemen':      '🇾🇪',
};

const cups = [
  {
    id: 1,
    bean: 'Yir­ga­cheffe',
    roaster: 'Onyx Coffee Lab',
    origin: 'Ethiopia',
    process: 'Natural',
    date: 'May 9',
    rating: 5,
    notes: 'Blueberry, jasmine, dark chocolate',
    bagColor: '#C17A3C',
    bagAccent: '#E8A85A',
    bagShape: 2,
    bagImg: 'orange',
  },
  {
    id: 2,
    bean: 'El Pa­raíso',
    roaster: 'Intelligentsia',
    origin: 'Colombia',
    process: 'Washed',
    date: 'May 7',
    rating: 4,
    notes: 'Brown sugar, stone fruit, clean finish',
    bagColor: '#3D6B55',
    bagAccent: '#5A9474',
    bagShape: 1,
    bagImg: 'green',
  },
  {
    id: 3,
    bean: 'Ge­sha Vil­lage',
    roaster: 'Verve Coffee',
    origin: 'Panama',
    process: 'Natural',
    date: 'May 4',
    rating: 5,
    notes: 'Peach, bergamot, honey sweetness',
    bagColor: '#B5836A',
    bagAccent: '#D4A882',
    bagShape: 3,
    bagImg: 'white',
  },
  {
    id: 4,
    bean: 'Hui­la Washed',
    roaster: 'Blue Bottle',
    origin: 'Colombia',
    process: 'Washed',
    date: 'Apr 30',
    rating: 4,
    notes: 'Caramel, red apple, walnut',
    bagColor: '#4A5568',
    bagAccent: '#718096',
    bagShape: 1,
    bagImg: 'blue',
  },
  {
    id: 5,
    bean: 'Ko­chere',
    roaster: 'Sightglass',
    origin: 'Ethiopia',
    process: 'Washed',
    date: 'Apr 26',
    rating: 4,
    notes: 'Lemon verbena, nectarine, floral',
    bagColor: '#7C5C8A',
    bagAccent: '#A07AB0',
    bagShape: 3,
    bagImg: 'white',
  },
  {
    id: 6,
    bean: 'Si­da­ma Honey',
    roaster: 'Counter Culture',
    origin: 'Ethiopia',
    process: 'Honey',
    date: 'Apr 22',
    rating: 3,
    notes: 'Apricot, milk chocolate, round body',
    bagColor: '#8B6340',
    bagAccent: '#B5895C',
    bagShape: 2,
    bagImg: 'orange',
  },
  {
    id: 7,
    bean: 'Nye­ri Pea­berry',
    roaster: 'Ritual Coffee',
    origin: 'Kenya',
    process: 'Washed',
    date: 'Apr 18',
    rating: 5,
    notes: 'Blackcurrant, tomato, bright acidity',
    bagColor: '#2E5B3A',
    bagAccent: '#4A8A5C',
    bagShape: 1,
    bagImg: 'green',
  },
  {
    id: 8,
    bean: 'Bour­bon Nat­ural',
    roaster: 'Heart Coffee',
    origin: 'Guatemala',
    process: 'Natural',
    date: 'Apr 14',
    rating: 4,
    notes: 'Raspberry, caramel, velvety body',
    bagColor: '#C44B2B',
    bagAccent: '#E06840',
    bagShape: 3,
    bagImg: 'orange',
  },
  {
    id: 9,
    bean: 'Cer­ra­do Pulped',
    roaster: 'Stumptown',
    origin: 'Brazil',
    process: 'Pulped Natural',
    date: 'Apr 10',
    rating: 3,
    notes: 'Dark chocolate, hazelnut, low acid',
    bagColor: '#1E3A5F',
    bagAccent: '#2E5A8F',
    bagShape: 2,
    bagImg: 'blue',
  },
  {
    id: 10,
    bean: 'Tar­ra­zú Honey',
    roaster: 'Chromatic Coffee',
    origin: 'Costa Rica',
    process: 'Honey',
    date: 'Apr 6',
    rating: 4,
    notes: 'Brown sugar, peach, silky mouthfeel',
    bagColor: '#D4742A',
    bagAccent: '#F0944A',
    bagShape: 1,
    bagImg: 'orange',
  },
];

// Extra detail per cup (roast level, region, variety, brew log). Keyed by cup.id.
const COFFEE_DETAILS = {
  1: { roastLevel: 'Light', region: 'Yirgacheffe, Gedeo Zone', variety: 'Heirloom',
       brews: [
         { brewer: 'Hario V60', filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 94, beansG: 18, waterMl: 300, date: 'May 9' },
         { brewer: 'Aeropress',  filter: 'Aesir paper',   grind: 'Medium-fine', tempC: 88, beansG: 15, waterMl: 225, date: 'May 8' },
       ] },
  2: { roastLevel: 'Light', region: 'Cauca, Piendamó', variety: 'Castillo · Colombia',
       brews: [
         { brewer: 'Origami',    filter: 'Cafec Abaca',   grind: 'Medium',      tempC: 96, beansG: 20, waterMl: 320, date: 'May 7' },
       ] },
  3: { roastLevel: 'Light', region: 'Volcán, Chiriquí', variety: 'Gesha',
       brews: [
         { brewer: 'Hario V60',     filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 92, beansG: 15, waterMl: 250, date: 'May 4' },
         { brewer: 'Kalita Wave 185', filter: 'Kalita wave', grind: 'Medium',    tempC: 93, beansG: 18, waterMl: 280, date: 'May 2' },
       ] },
  4: { roastLevel: 'Medium-Light', region: 'Huila, Pitalito', variety: 'Caturra · Castillo',
       brews: [
         { brewer: 'Chemex',     filter: 'Chemex bonded', grind: 'Medium-coarse', tempC: 96, beansG: 30, waterMl: 500, date: 'Apr 30' },
       ] },
  5: { roastLevel: 'Light', region: 'Kochere, Yirgacheffe', variety: 'Heirloom',
       brews: [
         { brewer: 'Hario V60',  filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 94, beansG: 18, waterMl: 300, date: 'Apr 26' },
       ] },
  6: { roastLevel: 'Medium', region: 'Sidama, Bensa', variety: 'Heirloom',
       brews: [] },
  7: { roastLevel: 'Light', region: 'Nyeri County', variety: 'SL28 · SL34',
       brews: [
         { brewer: 'Aeropress',  filter: 'Aesir paper',   grind: 'Medium-fine', tempC: 90, beansG: 17, waterMl: 230, date: 'Apr 18' },
       ] },
  8: { roastLevel: 'Medium-Light', region: 'Antigua, Sacatepéquez', variety: 'Bourbon',
       brews: [
         { brewer: 'French Press', filter: 'Metal mesh',  grind: 'Coarse',      tempC: 95, beansG: 30, waterMl: 500, date: 'Apr 14' },
       ] },
  9: { roastLevel: 'Medium-Dark', region: 'Cerrado Mineiro', variety: 'Mundo Novo',
       brews: [
         { brewer: 'Moka Pot',   filter: 'None',          grind: 'Fine',        tempC: 92, beansG: 20, waterMl: 200, date: 'Apr 10' },
       ] },
  10: { roastLevel: 'Medium', region: 'Tarrazú, Los Santos', variety: 'Caturra · Catuaí',
        brews: [
          { brewer: 'Hario V60', filter: 'Hario tabbed', grind: 'Medium-fine', tempC: 93, beansG: 18, waterMl: 300, date: 'Apr 6' },
        ] },
};

// Offline sample data — the original hardcoded coffees, shaped like the grouped
// Notion result. Used as a fallback when /api/cups is unreachable (e.g. Notion
// not configured yet, or running plain `vite` without the proxy).
function sampleCoffees() {
  return cups.map((c) => {
    const d = COFFEE_DETAILS[c.id] || {};
    return {
      id: c.id,
      bean: c.bean,
      roaster: c.roaster,
      origin: c.origin,
      process: c.process,
      roastLevel: d.roastLevel,
      region: d.region,
      variety: d.variety,
      notes: c.notes,
      rating: c.rating,
      date: c.date,
      bagImg: c.bagImg,
      brews: d.brews || [],
    };
  });
}

// Set by App; consumed by ShelfRow + Explore list-item to open the detail page.
const SelectCupContext = React.createContext(null);

function BagArt({ cup }) {
  const { bagColor, bagAccent, bagShape } = cup;
  const svgStyle = { width: '100%', height: '100%', display: 'block' };

  function LabelText({ x, y }) {
    return (
      <>
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.93)" fontFamily="DM Serif Display, Georgia, serif" fontSize="11">
          {cup.bean}
        </text>
        <text x={x} y={y + 16} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.50)" fontFamily="Avenir, system-ui, sans-serif" fontSize="7" letterSpacing="0.3">
          {cup.roaster}
        </text>
        <text x={x} y={y + 28} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.28)" fontFamily="Avenir, system-ui, sans-serif" fontSize="6" letterSpacing="1.8">
          {cup.process.toUpperCase()}
        </text>
      </>
    );
  }

  // Bag 1 — gusseted stand-up pouch with 3D side panels (103×166)
  if (bagShape === 1) {
    return (
      <svg viewBox="0 0 103 166" xmlns="http://www.w3.org/2000/svg" style={svgStyle} preserveAspectRatio="xMidYMid meet">
        <rect opacity="0.8" y="54" width="85" height="98" fill={bagColor}/>
        <path d="M18 66.5H103L103 166H18.0001L18 66.5Z" fill={bagAccent}/>
        <path d="M0 54L18 65.2V166L0 154.8V54Z" fill={bagColor}/>
        <path opacity="0.8" d="M85 54L103 65.2V166L85 154.8V54Z" fill={bagAccent}/>
        <rect x="15" width="76" height="18" fill={bagAccent}/>
        <path d="M15 18H91L85 54H0L15 18Z" fill={bagColor}/>
        <path d="M15 18H91L103 66.5H18L15 18Z" fill={bagAccent}/>
        <path d="M27.1188 83.1143C27.0539 81.4139 28.4149 80 30.1166 80H91.8834C93.5851 80 94.9461 81.4139 94.8812 83.1143L92.6309 142.114C92.5694 143.726 91.2454 145 89.6331 145H32.3669C30.7546 145 29.4306 143.726 29.3691 142.114L27.1188 83.1143Z" fill="rgba(0,0,0,0.28)"/>
        <path d="M16.5 45L18 66L0 54L16.5 45Z" fill={bagColor}/>
        <LabelText x={61} y={106} />
      </svg>
    );
  }

  // Bag 2 — rounded flat-front pouch (112×150)
  if (bagShape === 2) {
    return (
      <svg viewBox="0 0 112 150" xmlns="http://www.w3.org/2000/svg" style={svgStyle} preserveAspectRatio="xMidYMid meet">
        <path d="M0.314981 6.29962C0.143626 2.87252 2.87611 0 6.3075 0H105.693C109.124 0 111.856 2.87252 111.685 6.29963L104.785 144.3C104.625 147.493 101.99 150 98.7925 150H13.2075C10.0103 150 7.37464 147.493 7.21498 144.3L0.314981 6.29962Z" fill={bagColor}/>
        <path d="M12.1554 45.1479C12.0708 43.435 13.4368 42 15.1517 42H96.8483C98.5632 42 99.9292 43.435 99.8446 45.1479L96.9324 104.148C96.8536 105.745 95.5355 107 93.9361 107H18.0639C16.4645 107 15.1464 105.745 15.0676 104.148L12.1554 45.1479Z" fill="rgba(0,0,0,0.26)"/>
        <path d="M3 11.5C3 11.2239 3.22386 11 3.5 11H108.5C108.776 11 109 11.2239 109 11.5C109 11.7761 108.776 12 108.5 12H3.5C3.22386 12 3 11.7761 3 11.5Z" fill={bagAccent}/>
        <path d="M3 13.5C3 13.2239 3.22386 13 3.5 13H108.5C108.776 13 109 13.2239 109 13.5C109 13.7761 108.776 14 108.5 14H3.5C3.22386 14 3 13.7761 3 13.5Z" fill={bagAccent}/>
        <path d="M3 15.5C3 15.2239 3.22386 15 3.5 15H108.5C108.776 15 109 15.2239 109 15.5C109 15.7761 108.776 16 108.5 16H3.5C3.22386 16 3 15.7761 3 15.5Z" fill={bagAccent}/>
        <text x="56" y="134" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.28)" fontFamily="Avenir, system-ui, sans-serif" fontSize="7" letterSpacing="2">
          {cup.origin.toUpperCase()}
        </text>
        <LabelText x={56} y={68} />
      </svg>
    );
  }

  // Bag 3 — rectangular standup with inset face (100×168)
  return (
    <svg viewBox="0 0 100 168" xmlns="http://www.w3.org/2000/svg" style={svgStyle} preserveAspectRatio="xMidYMid meet">
      <path d="M3.5 0H96.5L100 143.5L96.5 168H3.5L0 143.5L3.5 0Z" fill={bagAccent}/>
      <rect x="7.5" y="9" width="84" height="153" fill={bagColor}/>
      <path d="M10.637 63.1311C10.5623 61.4244 11.9258 60 13.6341 60H85.3659C87.0742 60 88.4377 61.4244 88.363 63.1311L85.7818 122.131C85.7116 123.735 84.3905 125 82.7846 125H16.2154C14.6095 125 13.2884 123.735 13.2182 122.131L10.637 63.1311Z" fill="rgba(0,0,0,0.26)"/>
      <path d="M5.5 13.5C5.5 13.2239 5.72386 13 6 13H93C93.2761 13 93.5 13.2239 93.5 13.5C93.5 13.7761 93.2761 14 93 14H6C5.72386 14 5.5 13.7761 5.5 13.5Z" fill={bagAccent}/>
      <path d="M5.5 15.5C5.5 15.2239 5.72386 15 6 15H93C93.2761 15 93.5 15.2239 93.5 15.5C93.5 15.7761 93.2761 16 93 16H6C5.72386 16 5.5 15.7761 5.5 15.5Z" fill={bagAccent}/>
      <path d="M5.5 17.5C5.5 17.2239 5.72386 17 6 17H93C93.2761 17 93.5 17.2239 93.5 17.5C93.5 17.7761 93.2761 18 93 18H6C5.72386 18 5.5 17.7761 5.5 17.5Z" fill={bagAccent}/>
      <text x="50" y="154" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.28)" fontFamily="Avenir, system-ui, sans-serif" fontSize="7" letterSpacing="2">
        {cup.origin.toUpperCase()}
      </text>
      <LabelText x={50} y={86} />
    </svg>
  );
}

function CupRating({ rating }) {
  if (!rating || rating <= 0) return null;
  const bg = rating >= 4 ? 'rgba(253,203,136,0.6)' : 'rgba(252,153,155,0.6)';
  const cups = Array.from({ length: rating }).map(() => '☕️').join('');
  return (
    <div style={{
      background: bg, borderRadius: 100, padding: '8px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{
        fontFamily: '"Avenir Next Condensed", Avenir, system-ui, sans-serif',
        fontWeight: 600, fontSize: 17, lineHeight: 1.4, letterSpacing: '-0.5px', whiteSpace: 'nowrap',
      }}>{cups}</span>
    </div>
  );
}

// Centered label overlaid on a bag's clear front panel (above the decorative art).
// Sizes are miniature (sub-DS) to fit the bag art; colors are DS tokens.
function BagLabel({ cup, bagWidth = 300 }) {
  const lightBag = cup.bagImg === 'white';
  const ink     = lightBag ? 'text-black' : 'text-pearl';
  const sub     = lightBag ? 'text-grey-dark' : 'text-pearl';
  const divider = lightBag ? 'bg-black/40' : 'bg-pearl/40';

  // Scale proportionally: floors ensure minimum readable size on small (home) bags.
  // At 300px (detail): bean=24px, sub=9px, label=115px.
  // At ~89px (home):   bean=16px, sub=7px,  label=70px  (via Math.max floors).
  const scale        = bagWidth / 300;
  const labelWidth   = Math.max(70,  Math.round(115 * scale));
  const beanFontSize = Math.max(16,  Math.round(24  * scale));
  const subFontSize  = Math.max(7,   Math.round(9   * scale));
  const dividerMy    = Math.max(4,   Math.round(12  * scale));

  return (
    <figcaption
      className={`absolute top-[24%] left-1/2 -translate-x-1/2 flex flex-col items-center text-center pointer-events-none overflow-hidden`}
      style={{ width: `${labelWidth}px` }}
    >
      <h3
        className={`font-condensed font-semibold leading-[1.2] tracking-[-0.9px] w-full break-normal ${ink}`}
        style={{ fontSize: `${beanFontSize}px` }}
      >
        {cup.bean}
      </h3>
      <p
        className={`font-sans font-medium tracking-[0.9px] mt-1 uppercase w-full break-normal ${sub}`}
        style={{ fontSize: `${subFontSize}px` }}
      >
        {cup.roaster}
      </p>
      <hr
        className={`w-[18px] h-px border-0 ${divider}`}
        style={{ marginTop: `${dividerMy}px`, marginBottom: `${dividerMy}px` }}
      />
      <p
        className={`flex items-center justify-center gap-[3px] font-sans font-medium uppercase ${sub}`}
        style={{ fontSize: `${subFontSize}px`, letterSpacing: '0.5px' }}
      >
        <span style={{ fontSize: `${subFontSize + 1.5}px` }}>{ORIGIN_FLAGS[cup.origin]}</span>
        <span>{cup.origin}</span>
      </p>
    </figcaption>
  );
}

function Bag({ cup, style, onClick }) {
  if (cup.skeleton) {
    return (
      <div className="animate-pulse" style={{ borderRadius: 6, background: 'rgba(0,0,0,0.07)', flexShrink: 0, ...style }} />
    );
  }
  const bagWidth = typeof style?.width === 'number' ? style.width : 300;
  return (
    <figure onClick={onClick} style={{ position: 'relative', flexShrink: 0, margin: 0, cursor: onClick ? 'pointer' : 'default', ...style }}>
      <img src={`assets/bag-${cup.bagImg}.webp`} alt={cup.bean}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      <BagLabel cup={cup} bagWidth={bagWidth} />
    </figure>
  );
}

const SKELETON_CELLS = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}`, skeleton: true }));

function ShelfRow({ type, leftCup, rightCup }) {
  const onSelect = React.useContext(SelectCupContext);
  const click = (cup) => (cup && onSelect ? () => onSelect(cup.id) : undefined);

  if (type === 'tall') {
    return (
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 143, height: 224, flexShrink: 0 }}>
          {leftCup && <Bag cup={leftCup} onClick={click(leftCup)} style={{ position: 'absolute', left: 27, top: 41, width: 89, height: 183 }} />}
        </div>
        <div style={{ position: 'relative', width: 145, height: 224, flexShrink: 0 }}>
          {rightCup && <Bag cup={rightCup} onClick={click(rightCup)} style={{ position: 'absolute', left: 28, top: 43, width: 88, height: 181 }} />}
        </div>
      </div>
    );
  }

  if (type === 'normal') {
    return (
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 143, height: 200, flexShrink: 0 }}>
          {leftCup && <Bag cup={leftCup} onClick={click(leftCup)} style={{ position: 'absolute', left: 27, top: 18, width: 89, height: 183 }} />}
        </div>
        <div style={{ position: 'relative', width: 145, height: 200, flexShrink: 0 }}>
          {rightCup && <Bag cup={rightCup} onClick={click(rightCup)} style={{ position: 'absolute', left: 29, top: 18, width: 88, height: 183 }} />}
        </div>
      </div>
    );
  }

  // open shelf — bags are bottom-aligned, no cubby container
  return (
    <div style={{ display: 'flex', height: 194, alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 48px' }}>
      {leftCup
        ? <Bag cup={leftCup} onClick={click(leftCup)} style={{ width: 88, height: 181 }} />
        : <div style={{ width: 88 }} />}
      {rightCup
        ? <Bag cup={rightCup} onClick={click(rightCup)} style={{ width: 89, height: 183 }} />
        : <div style={{ width: 89 }} />}
    </div>
  );
}

function ShelvesStart({ cells }) {
  const c = [...cells, ...Array(8).fill(null)].slice(0, 8);
  return (
    <div style={{ position: 'relative', width: '100%', height: 998 }}>
      <img src="assets/shelf-v2-whole.webp" alt=""
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 370, height: 998, display: 'block' }} />
      <div style={{ position: 'absolute', left: 40, top: 37, width: 320, display: 'flex', flexDirection: 'column', gap: 38, zIndex: 2 }}>
        <ShelfRow type="tall"   leftCup={c[0]} rightCup={c[1]} />
        <ShelfRow type="normal" leftCup={c[2]} rightCup={c[3]} />
        <ShelfRow type="open"   leftCup={c[4]} rightCup={c[5]} />
        <ShelfRow type="normal" leftCup={c[6]} rightCup={c[7]} />
      </div>
      <img src="assets/shelf-v2-frame.webp" alt=""
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 370, height: 998, zIndex: 5, pointerEvents: 'none' }} />
    </div>
  );
}

function ShelfContinued({ cells }) {
  const c = [...cells, ...Array(6).fill(null)].slice(0, 6);
  return (
    <div style={{ position: 'relative', width: '100%', height: 733 }}>
      <img src="assets/shelfcontinue-v2-whole.webp" alt=""
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 370, height: 733, display: 'block' }} />
      <div style={{ position: 'absolute', left: 36, top: 31, width: 320, display: 'flex', flexDirection: 'column', gap: 38, zIndex: 2 }}>
        <ShelfRow type="normal" leftCup={c[0]} rightCup={c[1]} />
        <ShelfRow type="open"   leftCup={c[2]} rightCup={c[3]} />
        <ShelfRow type="normal" leftCup={c[4]} rightCup={c[5]} />
      </div>
      <img src="assets/shelfcontinue-v2-frame.webp" alt=""
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 370, height: 733, zIndex: 5, pointerEvents: 'none' }} />
    </div>
  );
}

function SortChevron({ flipped }) {
  return (
    <svg width="9" height="6" viewBox="0 0 9 6" fill="currentColor"
      style={{ flexShrink: 0, transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M0 0L9 0L4.5 6Z" />
    </svg>
  );
}

function FilterCheckbox({ checked }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
      border: '1.5px solid', borderColor: checked ? 'transparent' : '#cca68c',
      background: checked ? '#fc999b' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.15s ease, border-color 0.15s ease',
    }}>
      <svg width="12" height="9" viewBox="0 0 12 9" fill="none"
        style={{
          opacity: checked ? 1 : 0,
          transform: checked ? 'scale(1)' : 'scale(0.4)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FilterSheet({ filterKey, coffees, activeValues = [], onSelect, onClose, isClosing }) {
  const FIELD = { country: 'origin', process: 'process', roast: 'roastLevel' };
  const TITLE = { country: 'Country', process: 'Processing', roast: 'Roast' };
  const field = FIELD[filterKey];
  const values = React.useMemo(() => {
    const all = coffees.map(c => c[field]).filter(Boolean);
    return [...new Set(all)].sort();
  }, [coffees, field]);

  const toggle = (val) => {
    const next = activeValues.includes(val)
      ? activeValues.filter(v => v !== val)
      : [...activeValues, val];
    onSelect(next);
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 99,
        animation: isClosing
          ? 'backdropOut 0.18s ease-in forwards'
          : 'backdropIn 0.22s ease-out forwards',
      }} />
      <div style={{
        position: 'absolute', bottom: 118, left: 16, right: 16,
        borderRadius: '34px', zIndex: 100, overflow: 'hidden', isolation: 'isolate',
        animation: isClosing
          ? 'filterSheetOut 0.18s ease-in forwards'
          : 'filterSheetIn 0.22s ease-out forwards',
        willChange: 'opacity, transform',
      }}>
        {/* Liquid Glass fill */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', boxShadow: '0px 8px 40px rgba(0,0,0,0.12)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', background: 'rgb(255,255,255)', mixBlendMode: 'color-dodge' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', background: 'rgba(245,245,245,0.6)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0) 50%)', pointerEvents: 'none' }} />
        {/* Content */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div onClick={onClose} style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '5px', background: '#ccc', borderRadius: '100px' }} />
          </div>
          {/* Header: title + clear button */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 12px 24px' }}>
            <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: '22px', color: '#000', letterSpacing: '-0.23px', lineHeight: 1.4, margin: 0, flex: 1 }}>
              {TITLE[filterKey]}
            </p>
            <button onClick={() => onSelect([])} aria-label="Clear filter" style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#78788029', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '17px', fontWeight: 510, color: '#727272',
              lineHeight: 1, cursor: 'pointer', flexShrink: 0,
              opacity: activeValues.length > 0 ? 1 : 0,
              transform: activeValues.length > 0 ? 'scale(1)' : 'scale(0.5)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              pointerEvents: activeValues.length > 0 ? 'auto' : 'none',
            }}>✕</button>
          </div>
          {/* Options */}
          <div className="scrollable" style={{ overflowY: 'auto', maxHeight: '280px', paddingBottom: '16px' }}>
            {values.map((val, i) => {
              const isActive = activeValues.includes(val);
              const flag = filterKey === 'country' ? (ORIGIN_FLAGS[val] || '') : '';
              return (
                <button key={val} onClick={() => toggle(val)} style={{
                  display: 'flex', width: '100%', alignItems: 'center', gap: '10px',
                  padding: '14px 20px 14px 24px', background: 'none', border: 'none',
                  borderTop: i === 0 ? '1px solid #E7E7E7' : 'none',
                  borderBottom: '1px solid #E7E7E7',
                  cursor: 'pointer', boxSizing: 'border-box', textAlign: 'left',
                  fontFamily: 'Avenir, system-ui, sans-serif', fontSize: '17px', fontWeight: 500,
                  color: '#000', WebkitTapHighlightColor: 'transparent',
                }}>
                  {flag && <span style={{ flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>{flag}</span>}
                  <span style={{ flex: 1, textAlign: 'left' }}>{val}</span>
                  <FilterCheckbox checked={isActive} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function CupboardShelves({
  cells,
  homeSortMode = 'recent', setHomeSortMode,
  homeSortDir  = 'desc',   setHomeSortDir,
  homeFilters  = {},       setHomeFilters, setFilterSheet,
}) {
  const processedCells = React.useMemo(() => {
    if (cells.some(c => c.skeleton)) return cells;
    let result = [...cells];
    if (homeSortMode === 'az') {
      result.sort((a, b) => (a.bean || '').localeCompare(b.bean || ''));
      if (homeSortDir === 'desc') result.reverse();
    } else {
      if (homeSortDir === 'asc') result.reverse();
    }
    if (homeFilters.country?.length) result = result.filter(c => homeFilters.country.includes(c.origin));
    if (homeFilters.process?.length) result = result.filter(c => homeFilters.process.includes(c.process));
    if (homeFilters.roast?.length)   result = result.filter(c => homeFilters.roast.includes(c.roastLevel));
    return result;
  }, [cells, homeSortMode, homeSortDir, homeFilters]);

  const startCells = processedCells.slice(0, 8);
  const overflow   = processedCells.slice(8);
  const groups = [];
  for (let i = 0; i < overflow.length; i += 6) groups.push(overflow.slice(i, i + 6));

  const [pressedPill, setPressedPill] = React.useState(null);

  const handleSortChip = (key) => {
    if (homeSortMode === key) {
      setHomeSortDir?.(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setHomeSortMode?.(key);
      setHomeSortDir?.(key === 'recent' ? 'desc' : 'asc');
    }
  };

  const pillStyle = (active) => ({
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', borderRadius: '100px',
    border: active ? '1px solid #fc999b' : '1px solid #cca68c',
    background: active ? '#fc999b' : 'transparent',
    color: active ? '#ffffff' : '#000000',
    fontFamily: 'Avenir, system-ui, sans-serif',
    fontWeight: 500, fontSize: '15px', lineHeight: 1.1,
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
    transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
  });

  const pressedStyle = (key) => ({
    transform: pressedPill === key ? 'scale(0.95)' : 'scale(1)',
    transition: pressedPill === key
      ? 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.08s ease'
      : 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease',
  });

  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{
        display: 'flex', gap: '8px', padding: '0 24px 12px',
        overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {[{ key: 'recent', label: 'recent' }, { key: 'az', label: 'a-z' }].map(chip => {
          const active = homeSortMode === chip.key;
          const flipped = active && (
            (chip.key === 'recent' && homeSortDir === 'asc') ||
            (chip.key === 'az'     && homeSortDir === 'desc')
          );
          return (
            <button key={chip.key} onClick={() => handleSortChip(chip.key)}
              onPointerDown={() => setPressedPill(chip.key)}
              onPointerUp={() => setPressedPill(null)}
              onPointerLeave={() => setPressedPill(null)}
              style={{ ...pillStyle(active), ...pressedStyle(chip.key), whiteSpace: 'nowrap' }}>
              {chip.label}<SortChevron flipped={flipped} />
            </button>
          );
        })}
        {[{ key: 'country', label: 'country' }, { key: 'process', label: 'process' }, { key: 'roast', label: 'roast' }].map(chip => {
          const activeVals = homeFilters[chip.key] || [];
          const hasFilter = activeVals.length > 0;
          const pillText = hasFilter ? activeVals.map(v => v.toLowerCase()).join(', ') : chip.label;
          return (
            <button key={chip.key} onClick={() => setFilterSheet?.(chip.key)}
              onPointerDown={() => setPressedPill(chip.key)}
              onPointerUp={() => setPressedPill(null)}
              onPointerLeave={() => setPressedPill(null)}
              style={{
                ...pillStyle(hasFilter),
                ...pressedStyle(chip.key),
                maxWidth: hasFilter ? '200px' : undefined,
                overflow: 'hidden',
              }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0 }}>
                {pillText}
              </span>
              <span
                  role="button"
                  aria-label={`Clear ${chip.label} filter`}
                  onClick={(e) => { e.stopPropagation(); setHomeFilters?.(prev => ({ ...prev, [chip.key]: [] })); }}
                  style={{
                    display: 'flex', alignItems: 'center', flexShrink: 0, fontSize: '12px',
                    opacity: hasFilter ? 0.85 : 0,
                    width: hasFilter ? undefined : 0,
                    overflow: 'hidden',
                    transform: hasFilter ? 'scale(1)' : 'scale(0.5)',
                    transition: 'opacity 0.18s ease, transform 0.18s ease, width 0.18s ease',
                    pointerEvents: hasFilter ? 'auto' : 'none',
                  }}
                >✕</span>
            </button>
          );
        })}
      </div>
      <ShelvesStart cells={startCells} />
      {groups.map((group, i) => <ShelfContinued key={i} cells={group} />)}
    </div>
  );
}

function createBeanIcon(count, isSelected, isDimmed) {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'gap:4px',
    'padding:6px 8px 7px',
    'border-radius:100px',
    'box-sizing:border-box',
    'white-space:nowrap',
    'cursor:pointer',
    isSelected
      ? 'background:#fc999b;filter:drop-shadow(0 2px 4px rgba(102,8,8,0.15))'
      : 'background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.15)',
    isDimmed ? 'opacity:0.45' : '',
  ].join(';');
  const textColor = isSelected ? '#ffffff' : '#5d0505';
  el.innerHTML =
    `<img src="assets/Coffee-Bean Streamline Plump.svg" width="17" height="17" alt="" style="display:block;flex-shrink:0;">` +
    `<span style="font-family:Avenir,system-ui,sans-serif;font-weight:500;font-size:15px;line-height:1.1;color:${textColor};">${count}</span>`;
  return el;
}

function ExploreScreen({ cups }) {
  const onSelectCup = React.useContext(SelectCupContext);
  const [selectedOrigin, setSelectedOrigin] = React.useState(null);
  const [sheetExpanded, setSheetExpanded]   = React.useState(false);
  const mapContainerRef  = React.useRef(null);
  const mapInstanceRef   = React.useRef(null);
  const markersRef       = React.useRef({});
  const originEverSet    = React.useRef(false);

  const originGroups = React.useMemo(() =>
    cups.reduce((acc, cup) => {
      acc[cup.origin] = acc[cup.origin] || [];
      acc[cup.origin].push(cup);
      return acc;
    }, {}),
  [cups]);

  const filteredCups = selectedOrigin
    ? cups.filter(c => c.origin === selectedOrigin)
    : cups;

  // Initialise map once on mount
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    loadMapbox().then(() => {
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw',
        projection: 'mercator',
        center: [-25, 2],
        zoom: 1.5,
        minZoom: 1.5,
        maxZoom: 5,
        maxBounds: [[-180, -85], [180, 85]],
        scrollZoom: false,
        attributionControl: false,
      });

      map.on('load', () => {
        const bounds = new mapboxgl.LngLatBounds();

        Object.entries(originGroups).forEach(([origin, bags]) => {
          const coords = ORIGIN_COORDS[origin];
          if (!coords) return;
          const lngLat = [coords[1], coords[0]];
          const el = createBeanIcon(bags.length, false, false);
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedOrigin(prev => (prev === origin ? null : origin));
          });
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(lngLat)
            .addTo(map);
          markersRef.current[origin] = marker;
          bounds.extend(lngLat);
        });

        // Fit all origins in view, padding for the bottom sheet
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 314 + 60, left: 60, right: 60 },
          maxZoom: 2,
          animate: false,
        });
      });

      map.on('click', () => setSelectedOrigin(null));

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Update marker icons when selection changes
  React.useEffect(() => {
    Object.entries(markersRef.current).forEach(([origin, marker]) => {
      const count      = originGroups[origin]?.length || 0;
      const isSelected = selectedOrigin === origin;
      const isDimmed   = selectedOrigin !== null && !isSelected;
      const newEl = createBeanIcon(count, isSelected, isDimmed);
      newEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedOrigin(prev => (prev === origin ? null : origin));
      });
      const oldEl = marker.getElement();
      oldEl.replaceWith(newEl);
      marker._element = newEl;
    });
  }, [selectedOrigin]);

  const NAV_H        = 118;  // 20px bottom + 90px pill height + 8px clearance
  const PEEK_HEIGHT  = Math.floor(852 * 0.28); // 28% of phone height — header + ~1.5 rows
  const MAX_SHEET_H  = Math.floor(852 * 0.4); // 40% of phone height
  const ROW_H        = 104;  // 16+16 padding + 72px bag
  const HEADER_H     = 84;   // grabber ~16px + toolbar 58px + pb 10px

  const sheetHeight = selectedOrigin !== null
    ? Math.min(HEADER_H + filteredCups.length * ROW_H + 16, MAX_SHEET_H)
    : sheetExpanded ? MAX_SHEET_H : PEEK_HEIGHT;

  // Sync map camera padding with sheet height
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ padding: { bottom: sheetHeight + NAV_H, top: 0, left: 0, right: 0 }, duration: 320 });
  }, [sheetHeight]);

  // Fly to selected origin, or back to world view (skip initial mount)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (selectedOrigin) {
      originEverSet.current = true;
      const coords = ORIGIN_COORDS[selectedOrigin];
      if (!coords) return;
      map.flyTo({ center: [coords[1], coords[0]], zoom: 4, duration: 900, essential: true });
    } else if (originEverSet.current) {
      const bounds = new mapboxgl.LngLatBounds();
      Object.values(ORIGIN_COORDS).forEach(c => bounds.extend([c[1], c[0]]));
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 314 + 60, left: 60, right: 60 },
        maxZoom: 2,
        duration: 700,
      });
    }
  }, [selectedOrigin]);

  return (
    <div style={{ flex: 1, position: 'relative' }}>

      {/* Map — overflow:hidden here clips Leaflet tiles; explicit zIndex creates a stacking
           context so Leaflet's internal panes (z 200–700) stay below the bottom sheet */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div ref={mapContainerRef} style={{ height: '100%' }} />
      </div>

      {/* Zoom controls — sibling of bottom sheet so they share the same stacking context
           and both sit above the nav bar */}
      <div style={{
        position: 'absolute',
        bottom: `${sheetHeight + NAV_H + 14}px`,
        right: '16px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'bottom 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {[{ sym: '+', action: () => mapInstanceRef.current?.zoomIn() },
          { sym: '−', action: () => mapInstanceRef.current?.zoomOut() }].map(({ sym, action }) => (
          <button
            key={sym}
            onClick={action}
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(0,0,0,0.15)',
              borderRadius: '12px',
              fontFamily: 'Avenir, system-ui, sans-serif',
              fontSize: '26px',
              fontWeight: 500,
              color: '#cca68c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              padding: 0,
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* bottomsheet */}
      <div data-name="bottomsheet" style={{
        position: 'absolute',
        bottom: `${NAV_H}px`,
        left: 16,
        right: 16,
        height: `${sheetHeight}px`,
        borderRadius: '34px',
        transition: 'height 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
        overflow: 'hidden',
        isolation: 'isolate',
      }}>
        {/* Fill + Shadow */}
        <div data-name="Fill + Shadow" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34px',
          boxShadow: '0px 8px 40px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', background: 'rgb(255,255,255)', mixBlendMode: 'color-dodge' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', background: 'rgba(245,245,245,0.6)' }} />
        </div>

        {/* Glass Effect */}
        <div data-name="Glass Effect" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)',
          pointerEvents: 'none',
        }} />

        {/* Bottomsheet (inner content column) */}
        <div data-name="Bottomsheet" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>

          {/* Header */}
          <div data-name="Header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '10px', flexShrink: 0, width: '100%' }}>

            {/* Grabber */}
            <div data-name="Grabber" onClick={() => setSheetExpanded(e => !e)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '16px', paddingTop: '5px', flexShrink: 0, cursor: 'pointer' }}>
              <div data-name="Grabber" style={{ width: '36px', height: '5px', background: '#ccc', borderRadius: '100px', flexShrink: 0 }} />
            </div>

            {/* Title + Controls */}
            <div data-name="Title + Controls" style={{ display: 'flex', alignItems: 'center', paddingLeft: '24px', paddingRight: '16px', width: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
              {/* Text */}
              <div data-name="Text" style={{ display: 'flex', flexDirection: 'column', flex: '1 0 0', height: '58px', justifyContent: 'center', alignItems: 'flex-start', minWidth: 0 }}>
                <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: '22px', color: '#000', letterSpacing: '-0.23px', lineHeight: 1.4, margin: 0 }}>
                  {selectedOrigin ? `${ORIGIN_FLAGS[selectedOrigin] || ''} ${selectedOrigin}` : 'All coffees'}
                </p>
                <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#6b6b6b', lineHeight: 1.5, margin: 0, whiteSpace: 'nowrap' }}>
                  {(() => {
                    const coffeeCount = filteredCups.length;
                    const countryCount = selectedOrigin ? 1 : Object.keys(originGroups).length;
                    return `${coffeeCount} ${coffeeCount === 1 ? 'coffee' : 'coffees'} · ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`;
                  })()}
                </p>
              </div>
              {selectedOrigin && (
                <button
                  onClick={() => setSelectedOrigin(null)}
                  aria-label="Clear filter"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#78788029',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    fontSize: '17px',
                    fontWeight: 510,
                    color: '#727272',
                    lineHeight: 1,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div data-name="Content" style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', overflow: 'hidden', borderBottomLeftRadius: '34px', borderBottomRightRadius: '34px' }}>
            {/* slot */}
            <div data-name="slot" className="scrollable" style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
              <div data-name="list-collection" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {filteredCups.map((cup, i) => (
                  <div key={cup.id} data-name="list-item" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: '100%' }}>
                    <div data-name="item-card" onClick={() => onSelectCup?.(cup.id)} style={{ display: 'flex', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '4px', paddingRight: '24px', boxSizing: 'border-box', cursor: 'pointer' }}>
                      <div data-name="coffeebag-med" style={{ width: '72px', height: '72px', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        <div data-name="bag-white" style={{ position: 'absolute', top: '50%', left: 'calc(50% - 0.5px)', transform: 'translate(-50%, -50%)', width: '31px', height: '64px', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: '50%', left: 'calc(50% + 0.49px)', transform: 'translate(-50%, -50%)', width: '36px', height: '74px' }}>
                            <img src={`assets/bag-${cup.bagImg}.webp`} alt={cup.bean} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', width: '200px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <p style={{ fontFamily: '"Avenir Next Condensed", Avenir, system-ui, sans-serif', fontWeight: 600, fontSize: '17px', color: '#000', letterSpacing: '-0.5px', lineHeight: 1.4, margin: 0 }}>{cup.bean}</p>
                        <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: '13px', color: '#6b6b6b', lineHeight: 1.5, margin: 0 }}>{cup.roaster}</p>
                        <div data-name="Country" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: '13px', color: '#6b6b6b' }}>
                          <span>{ORIGIN_FLAGS[cup.origin]}</span>
                          <span>{cup.origin}</span>
                        </div>
                      </div>
                      <p style={{ flex: '1 0 0', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: '13px', color: '#6b6b6b', lineHeight: 1.5, textAlign: 'right', margin: 0 }}>{formatDate(cup.date)}</p>
                    </div>
                    {i < filteredCups.length - 1 && (
                      <div data-name="divider" style={{ width: '100%', height: '0.5px', background: '#e7e7e7', flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const TAB_ICONS = {
  home:   'assets/Coffee-Mug Streamline Plump.svg',
  search: 'assets/Location-Heart-Pin Streamline Plump.svg',
  add:    'assets/Book-1 Streamline Plump.svg',
  beans:  'assets/Coffee-Bean Streamline Plump.svg',
};

function TabIcon({ type, active }) {
  return (
    <img
      src={TAB_ICONS[type]}
      alt=""
      width="30"
      height="30"
      style={{ display: 'block', width: '30px', height: '30px' }}
    />
  );
}

function FormSectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: 13, color: '#6b6b6b',
      letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px',
    }}>{children}</p>
  );
}

// The "Log Cup" tab — a full form to log a brand-new coffee + its first brew.
function LogCupScreen({ onSaved, onDone }) {
  const blank = {
    bean: '', roaster: '', origin: '', process: '', roastLevel: '',
    region: '', variety: '', notes: '',
    brewer: '', filter: '', grind: '', beansG: '', waterMl: '', tempC: '',
    date: new Date().toISOString().slice(0, 10), rating: 0,
  };
  const [form, setForm] = React.useState(blank);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (saving) return;
    if (!form.bean.trim()) { setError('Add a coffee name (Bean) first.'); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/cups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Save failed (HTTP ${r.status})`);
      }
      await onSaved();
      setForm(blank);
      onDone();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9eddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 8px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 32, color: '#000', margin: 0, lineHeight: 1, letterSpacing: '-0.5px' }}>
          Log a Cup
        </h1>
        <button onClick={save} disabled={saving} style={{
          background: saving ? '#b9a99a' : '#5d0505', color: '#f9eddd', border: 'none',
          borderRadius: 100, padding: '10px 20px', cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 14, fontWeight: 800,
        }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 140px' }}>
        {error && (
          <div style={{
            background: 'rgba(252,153,155,0.22)', borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 13, fontWeight: 500, color: '#5d0505',
          }}>{error}</div>
        )}

        <FormSectionLabel>Coffee</FormSectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 26 }}>
          <FormField label="Bean">
            <input style={FIELD_INPUT} value={form.bean} onChange={set('bean')} placeholder="Gitega 861" />
          </FormField>
          <FormField label="Roaster">
            <input style={FIELD_INPUT} value={form.roaster} onChange={set('roaster')} placeholder="H&S Coffee Roasters" />
          </FormField>
          <FormField label="Country">
            <input style={FIELD_INPUT} value={form.origin} onChange={set('origin')} placeholder="Rwanda" />
          </FormField>
          <div style={{ display: 'flex', gap: 10 }}>
            <FormField label="Process">
              <input style={FIELD_INPUT} value={form.process} onChange={set('process')} placeholder="Washed" />
            </FormField>
            <FormField label="Roast">
              <input style={FIELD_INPUT} value={form.roastLevel} onChange={set('roastLevel')} placeholder="Light" />
            </FormField>
          </div>
          <FormField label="Region">
            <input style={FIELD_INPUT} value={form.region} onChange={set('region')} placeholder="Nyamagabe" />
          </FormField>
          <FormField label="Variety">
            <input style={FIELD_INPUT} value={form.variety} onChange={set('variety')} placeholder="Red Bourbon" />
          </FormField>
          <FormField label="Tasting notes">
            <input style={FIELD_INPUT} value={form.notes} onChange={set('notes')} placeholder="Red Apple, Peach, Hibiscus" />
          </FormField>
        </div>

        <FormSectionLabel>Brew</FormSectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Brewer">
            <input style={FIELD_INPUT} value={form.brewer} onChange={set('brewer')} placeholder="Hario V60" />
          </FormField>
          <FormField label="Filter">
            <input style={FIELD_INPUT} value={form.filter} onChange={set('filter')} placeholder="Cafec Light" />
          </FormField>
          <FormField label="Grind size">
            <input style={FIELD_INPUT} value={form.grind} onChange={set('grind')} placeholder="14" />
          </FormField>
          <div style={{ display: 'flex', gap: 10 }}>
            <FormField label="Beans (g)">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.beansG} onChange={set('beansG')} placeholder="18" />
            </FormField>
            <FormField label="Water (ml)">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.waterMl} onChange={set('waterMl')} placeholder="300" />
            </FormField>
            <FormField label="Temp °C">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.tempC} onChange={set('tempC')} placeholder="94" />
            </FormField>
          </div>
          <FormField label="Date">
            <input style={FIELD_INPUT} type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Rating">
            <RatingInput value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ flex: 1, background: '#f9eddd', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '118px' }}>
      <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: '17px', lineHeight: 1.4, letterSpacing: '-0.5px', color: '#6b6b6b', margin: 0 }}>
        Loading…
      </p>
    </div>
  );
}

// ─── Coffee Detail Page ──────────────────────────────────────────────────────

function OriginMap({ country }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const coords = ORIGIN_COORDS[country];

  React.useEffect(() => {
    if (!containerRef.current || !coords || mapRef.current) return;
    let cancelled = false;

    loadMapbox().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/rainbowcow02/cmpbsoxbv002n01qhe2v56lsw',
        center: [coords[1], coords[0]],
        zoom: 4.5,
        interactive: false,
        attributionControl: false,
      });
      map.on('load', () => {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;top:0;left:0;display:flex;align-items:center;justify-content:center;padding:6px 8px 7px;border-radius:100px;background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.15);';
        el.innerHTML = `<img src="assets/Coffee-Bean Streamline Plump.svg" width="17" height="17" alt="" style="display:block;">`;
        new mapboxgl.Marker({ element: el }).setLngLat([coords[1], coords[0]]).addTo(map);
      });
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [country]);

  if (!coords) return null;
  return <div ref={containerRef} style={{ width: '100%', height: '120px', borderRadius: '30px', overflow: 'hidden' }} />;
}

function DetailSection({ title, action, onAction, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontWeight: 400, fontSize: 22, color: '#000', margin: 0, lineHeight: 1.4, letterSpacing: '-0.23px' }}>{title}</h2>
        {action && (
          <button onClick={onAction} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 12, color: '#5d0505', cursor: 'pointer', lineHeight: 1.1 }}>
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function GlassCard({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'relative', borderRadius: 34, overflow: 'hidden', isolation: 'isolate', boxShadow: '0px 8px 40px rgba(0,0,0,0.12)', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {/* Fill + Shadow — matches bottomsheet */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 34, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 34, background: 'rgb(255,255,255)', mixBlendMode: 'color-dodge' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 34, background: 'rgba(245,245,245,0.6)' }} />
      </div>
      {/* Glass Effect — blur + sheen */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 34, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, paddingBottom: last ? 16 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: last ? 0 : 16 }}>
        <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', flexShrink: 0 }}>{label}</span>
        <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', textAlign: 'right', lineHeight: 1.5 }}>
          {value || '—'}
        </span>
      </div>
      {!last && <div style={{ height: '0.5px', background: '#E7E7E7' }} />}
    </div>
  );
}

function BrewCard({ brew, onClick }) {
  const ratio = `1:${(brew.waterMl / brew.beansG).toFixed(1)}`;
  const parsed = parseRecipe(brew.recipeToTest);
  const stats = [
    { label: 'Beans', value: `${brew.beansG}g` },
    { label: 'Water', value: `${brew.waterMl}ml` },
    { label: 'Ratio', value: ratio },
    { label: 'Grind', value: brew.grind },
    { label: 'Temp',  value: `${brew.tempC}°C` },
  ];
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 34, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
      {/* Header: date + rating pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <span style={{ fontFamily: '"Avenir Next Condensed", Avenir, system-ui, sans-serif', fontWeight: 600, fontSize: 17, color: '#000', letterSpacing: '-0.5px', lineHeight: 1.4 }}>
          {formatDate(brew.date)}
        </span>
        <CupRating rating={brew.rating} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 24px', boxSizing: 'border-box' }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b' }}>{label}</span>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: 17, color: '#000', letterSpacing: '-0.5px', lineHeight: 1.4 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Equipment rows */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ height: '0.5px', background: '#E7E7E7' }} />
      </div>
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', flexShrink: 0 }}>Dripper</span>
          <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', textAlign: 'right' }}>{brew.brewer || '—'}</span>
        </div>
        <div style={{ height: '0.5px', background: '#E7E7E7' }} />
      </div>
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', flexShrink: 0 }}>Filter paper</span>
          <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', textAlign: 'right' }}>{brew.filter || '—'}</span>
        </div>
      </div>

      {parsed ? (
        <>
          {parsed.pours.length > 0 && (
            <>
              <div style={{ paddingLeft: 24, paddingRight: 24 }}>
                <div style={{ height: '0.5px', background: '#E7E7E7' }} />
              </div>
              <div style={{ padding: '16px 24px' }}>
                {parsed.pours.map(({ step, amount, technique }) => (
                  <div key={step} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 50, flexShrink: 0, fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', lineHeight: 1.5 }}>{step}</span>
                    <span style={{ width: 60, flexShrink: 0, fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: 17, color: '#000', letterSpacing: '-0.5px', lineHeight: 1.4 }}>{amount}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', lineHeight: 1.5 }}>{technique}</span>
                  </div>
                ))}
                {parsed.agitation && (
                  <div style={{ marginTop: 6, fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', lineHeight: 1.5, paddingTop: 6, borderTop: '0.5px solid #E7E7E7' }}>
                    {parsed.agitation}
                  </div>
                )}
              </div>
            </>
          )}
          {parsed.brewTime && (
            <>
              <div style={{ paddingLeft: 24, paddingRight: 24 }}>
                <div style={{ height: '0.5px', background: '#E7E7E7' }} />
              </div>
              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b' }}>Brew time</span>
                  <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: 17, color: '#000', letterSpacing: '-0.5px', lineHeight: 1.4 }}>{parsed.brewTime}</span>
                </div>
              </div>
            </>
          )}
        </>
      ) : brew.recipeToTest && (
        <>
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{ height: '0.5px', background: '#E7E7E7' }} />
          </div>
          <div style={{ padding: '16px 24px' }}>
            <span style={{ display: 'block', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', marginBottom: 8 }}>Recipe</span>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{brew.recipeToTest}</span>
          </div>
        </>
      )}

      {brew.tastingNotes && (
        <>
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{ height: '0.5px', background: '#E7E7E7' }} />
          </div>
          <div style={{ padding: '16px 24px' }}>
            <span style={{ display: 'block', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', marginBottom: 8 }}>Tasting notes</span>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{brew.tastingNotes}</span>
          </div>
        </>
      )}

      {brew.brewNotes && (
        <>
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{ height: '0.5px', background: '#E7E7E7' }} />
          </div>
          <div style={{ padding: '16px 24px' }}>
            <span style={{ display: 'block', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: '#6b6b6b', marginBottom: 8 }}>Brew notes</span>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 400, fontSize: 15, color: '#6b6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{brew.brewNotes}</span>
          </div>
        </>
      )}
    </div>
  );
}

function CoffeeDetailScreen({ cup, onBack, onRefresh }) {
  const tastingNotes = (cup.notes || '').split(',').map(n => n.trim()).filter(Boolean);
  const brews = cup.brews || [];
  const [addingBrew, setAddingBrew] = React.useState(false);
  const [editingBrew, setEditingBrew] = React.useState(null);
  const [closing, setClosing] = React.useState(false);
  const EXIT_MS = 320;

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onBack, EXIT_MS);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60, background: '#f9eddd',
      display: 'flex', flexDirection: 'column',
      animation: closing
        ? `slideOutToBottom ${EXIT_MS}ms cubic-bezier(0.32, 0.72, 0, 1) forwards`
        : 'slideInFromBottom 360ms cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      {/* Status-bar spacer */}
      <div style={{ height: 44, flexShrink: 0 }} />

      {/* Content area — back button floats over scroll */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Back button */}
        <div style={{ position: 'absolute', top: 0, left: 8, zIndex: 10 }}>
          <button onClick={dismiss} aria-label="Back" style={{
            width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <path d="M12 2L3 11L12 20" stroke="#5d0505" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="scrollable" style={{ height: '100%', overflowY: 'auto', paddingBottom: 48 }}>

          {/* Bag hero — centered 300×300 */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24, paddingBottom: 24 }}>
            <div style={{ position: 'relative', width: 300, height: 300, filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.18))' }}>
              <img src={`assets/bag-${cup.bagImg}.webp`} alt={cup.bean}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              <BagLabel cup={cup} bagWidth={300} />
            </div>
          </div>

          {/* Page title block */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 15, color: '#355c44', lineHeight: 1.1, margin: 0 }}>
              {cup.roaster}
            </p>
            <p style={{ fontFamily: '"Avenir Next Condensed", Avenir, system-ui, sans-serif', fontWeight: 600, fontSize: 48, color: '#000', lineHeight: 1, letterSpacing: '-0.48px', margin: 0 }}>
              {cup.bean}
            </p>
          </div>

          {/* Sections */}
          <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* Details card — no section header */}
            <GlassCard>
              <DetailRow label="Roast"   value={cup.roastLevel} />
              <DetailRow label="Process" value={cup.process} />
              <DetailRow label="Variety" value={cup.variety} last />
            </GlassCard>

            {/* Tasting notes */}
            {tastingNotes.length > 0 && (
              <DetailSection title="Tasting notes">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tastingNotes.map(n => (
                    <span key={n} style={{
                      padding: '8px 14px', borderRadius: 100,
                      background: 'rgba(252,153,155,0.22)',
                      fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13,
                      color: '#5d0505',
                    }}>{n}</span>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Origin */}
            <DetailSection title="Origin">
              <GlassCard>
                <DetailRow label="Country"  value={`${ORIGIN_FLAGS[cup.origin] || ''} ${cup.origin}`} />
                <DetailRow label="Region"   value={cup.region} last={!cup.altitude} />
                {cup.altitude && <DetailRow label="Altitude" value={cup.altitude} last />}
                <div style={{ padding: '0 24px 24px' }}>
                  <OriginMap country={cup.origin} />
                </div>
              </GlassCard>
            </DetailSection>

            {/* Brew recipes */}
            <DetailSection title="Brew recipes" action="+ Add" onAction={() => setAddingBrew(true)}>
              {brews.length === 0 ? (
                <GlassCard>
                  <p style={{
                    fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500, fontSize: 13,
                    color: '#6b6b6b', margin: 0, padding: '24px', textAlign: 'center', lineHeight: 1.5,
                  }}>
                    No brew recipes yet. Tap "+ Add" to log one.
                  </p>
                </GlassCard>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {brews.map((b, i) => (
                    <BrewCard key={b.id || i} brew={b}
                      onClick={b.id ? () => setEditingBrew(b) : undefined} />
                  ))}
                </div>
              )}
            </DetailSection>

            <div style={{ height: 16 }} />
          </div>
        </div>
      </div>

      {(addingBrew || editingBrew) && (
        <BrewForm
          coffee={cup}
          brew={editingBrew}
          onClose={() => { setAddingBrew(false); setEditingBrew(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ─── Brew form ───────────────────────────────────────────────────────────────

const FIELD_INPUT = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14,
  border: '0.5px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.7)',
  fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 15, fontWeight: 500,
  color: '#000', outline: 'none',
};

function FormField({ label, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{
        display: 'block', fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 500,
        fontSize: 11, color: '#6b6b6b', letterSpacing: '0.8px', textTransform: 'uppercase',
        marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  );
}

function RatingInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 44 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)}
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', lineHeight: 0 }}>
          <svg width="22" height="22" viewBox="0 0 9 9">
            <polygon points="4.5,0.5 5.6,3.2 8.5,3.4 6.4,5.3 7.1,8.1 4.5,6.6 1.9,8.1 2.6,5.3 0.5,3.4 3.4,3.2"
              fill={n <= value ? '#355c44' : 'none'}
              stroke={n <= value ? '#355c44' : '#d9d9d9'} strokeWidth="0.75" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// Slide-up form to log a new brewed cup of an existing coffee. The coffee-level
// fields are copied from `coffee`; the user fills in just the brew details.
// ISO yyyy-mm-dd for an <input type="date">, falling back to today.
function toDateInput(value) {
  const today = new Date().toISOString().slice(0, 10);
  if (!value) return today;
  const m = /^\d{4}-\d{2}-\d{2}/.exec(String(value).trim());
  return m ? m[0] : today;
}

// Slide-up form to log a new brewed cup of an existing coffee, or edit/delete
// an existing brew. The coffee-level fields are carried from `coffee`; the user
// fills in just the brew details.
function BrewForm({ coffee, brew, onClose, onSaved }) {
  const editing = !!brew;
  const [form, setForm] = React.useState(() => ({
    brewer: brew?.brewer || '', filter: brew?.filter || '', grind: brew?.grind || '',
    beansG: brew?.beansG ?? '', waterMl: brew?.waterMl ?? '', tempC: brew?.tempC ?? '',
    date: toDateInput(brew?.date), rating: brew?.rating || 0,
  }));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [closing, setClosing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const EXIT_MS = 320;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const dismiss = () => {
    if (closing || saving) return;
    setClosing(true);
    setTimeout(onClose, EXIT_MS);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const brewFields = {
        brewer: form.brewer, filter: form.filter, grind: form.grind,
        beansG: form.beansG, waterMl: form.waterMl, tempC: form.tempC,
        date: form.date, rating: form.rating,
      };
      const r = editing
        ? await fetch(`/api/cups/${brew.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brewFields),
          })
        : await fetch('/api/cups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bean: coffee.bean, roaster: coffee.roaster, origin: coffee.origin,
              process: coffee.process, roastLevel: coffee.roastLevel,
              region: coffee.region, variety: coffee.variety, notes: coffee.notes,
              ...brewFields,
            }),
          });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Save failed (HTTP ${r.status})`);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (saving) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/cups/${brew.id}`, { method: 'DELETE' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Delete failed (HTTP ${r.status})`);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70, background: '#f9eddd',
      display: 'flex', flexDirection: 'column',
      animation: closing
        ? `slideOutToBottom ${EXIT_MS}ms cubic-bezier(0.32, 0.72, 0, 1) forwards`
        : 'slideInFromBottom 360ms cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      <div style={{ height: 44, flexShrink: 0 }} />

      {/* Header: Cancel · title · Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', flexShrink: 0 }}>
        <button onClick={dismiss} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 15, fontWeight: 500, color: '#6b6b6b',
        }}>Cancel</button>
        <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 19, color: '#000', margin: 0 }}>
          {editing ? 'Edit Brew' : 'New Brew'}
        </p>
        <button onClick={save} disabled={saving} style={{
          background: 'none', border: 'none', padding: 0,
          cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 15, fontWeight: 800,
          color: saving ? '#b9a99a' : '#5d0505',
        }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 48px' }}>
        <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 13, fontWeight: 500, color: '#6b6b6b', margin: '0 0 20px' }}>
          Brew recipe for <span style={{ color: '#000', fontWeight: 700 }}>{coffee.bean}</span> · {coffee.roaster}
        </p>

        {error && (
          <div style={{
            background: 'rgba(252,153,155,0.22)', borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 13, fontWeight: 500, color: '#5d0505',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Brewer">
            <input style={FIELD_INPUT} value={form.brewer} onChange={set('brewer')} placeholder="Hario V60" />
          </FormField>
          <FormField label="Filter">
            <input style={FIELD_INPUT} value={form.filter} onChange={set('filter')} placeholder="Cafec Light" />
          </FormField>
          <FormField label="Grind size">
            <input style={FIELD_INPUT} value={form.grind} onChange={set('grind')} placeholder="14" />
          </FormField>
          <div style={{ display: 'flex', gap: 10 }}>
            <FormField label="Beans (g)">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.beansG} onChange={set('beansG')} placeholder="18" />
            </FormField>
            <FormField label="Water (ml)">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.waterMl} onChange={set('waterMl')} placeholder="300" />
            </FormField>
            <FormField label="Temp °C">
              <input style={FIELD_INPUT} type="number" inputMode="decimal" value={form.tempC} onChange={set('tempC')} placeholder="94" />
            </FormField>
          </div>
          <FormField label="Date">
            <input style={FIELD_INPUT} type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Rating">
            <RatingInput value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
          </FormField>
        </div>

        {editing && (
          <button onClick={remove} disabled={saving} style={{
            marginTop: 28, width: '100%', padding: '12px', borderRadius: 14,
            border: '0.5px solid rgba(93,5,5,0.25)', background: 'transparent',
            cursor: saving ? 'default' : 'pointer',
            fontFamily: 'Avenir, system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: '#5d0505',
          }}>
            {confirmDelete ? 'Tap again to delete this brew' : 'Delete brew'}
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = React.useState('home');
  const [prevTab, setPrevTab] = React.useState(null);
  const [direction, setDirection] = React.useState(1);
  const [selectedCupId, setSelectedCupId] = React.useState(null);
  const [homeSortMode, setHomeSortMode] = React.useState('recent');
  const [homeSortDir,  setHomeSortDir]  = React.useState('desc');
  const [homeFilters,  setHomeFilters]  = React.useState({ country: [], process: [], roast: [] });
  const [filterSheet,        setFilterSheet]        = React.useState(null);
  const [filterSheetClosing, setFilterSheetClosing] = React.useState(false);

  const closeFilterSheet = React.useCallback(() => {
    setFilterSheetClosing(true);
    setTimeout(() => { setFilterSheet(null); setFilterSheetClosing(false); }, 200);
  }, []);

  const [coffees, setCoffees] = React.useState(() => {
    try {
      const cached = localStorage.getItem('cupboard-coffees');
      return cached ? groupIntoCoffees(JSON.parse(cached)) : null;
    } catch { return null; }
  });

  // Load coffees from the Notion proxy. Reusable so writes can refresh. Falls
  // back to bundled sample data only on the first load (Notion not configured,
  // or running plain `vite`); a failed refresh keeps whatever is already shown.
  const loadCoffees = React.useCallback(() => {
    return fetch('/api/cups')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const cups = data.cups || [];
        try { localStorage.setItem('cupboard-coffees', JSON.stringify(cups)); } catch {}
        setCoffees(groupIntoCoffees(cups));
      })
      .catch((err) => {
        console.warn('[Cupboard] /api/cups unavailable:', err.message);
        setCoffees((prev) => prev ?? sampleCoffees());
      });
  }, []);

  React.useEffect(() => { loadCoffees(); }, [loadCoffees]);

  const selectedCup = (coffees && selectedCupId != null)
    ? coffees.find(c => c.id === selectedCupId)
    : null;

  const TAB_ORDER = ['home', 'search', 'add', 'beans'];

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const oldIdx = TAB_ORDER.indexOf(activeTab);
    const newIdx = TAB_ORDER.indexOf(newTab);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setPrevTab(activeTab);
    setActiveTab(newTab);
    setTimeout(() => setPrevTab(null), 320);
  };

  function BeansScreen() {
    return (
      <div style={{ flex: 1, background: '#f9eddd', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '118px' }}>
        <p style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontWeight: 800, fontSize: '17px', lineHeight: 1.4, letterSpacing: '-0.5px', color: '#6b6b6b', margin: 0 }}>
          Coming soon!
        </p>
      </div>
    );
  }

  const renderScreen = (tabId) => {
    if (tabId === 'home') return (
      <div style={{ position: 'relative', height: '100%' }}>
        <div className="scrollable" style={{ height: '100%', overflowY: 'auto', paddingBottom: '88px' }}>
          <div style={{ padding: '16px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: '38px', color: '#000000', margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>
              Cupboard
            </h1>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#355c44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontSize: '20px', fontWeight: 600, color: '#f9eddd', lineHeight: 1 }}>L</span>
            </div>
          </div>
          <CupboardShelves
            cells={coffees ?? SKELETON_CELLS}
            homeSortMode={homeSortMode} setHomeSortMode={setHomeSortMode}
            homeSortDir={homeSortDir}   setHomeSortDir={setHomeSortDir}
            homeFilters={homeFilters}   setHomeFilters={setHomeFilters}  setFilterSheet={setFilterSheet}
          />
          <div style={{ height: '28px' }} />
        </div>
        {filterSheet && (
          <FilterSheet
            filterKey={filterSheet}
            coffees={coffees ?? []}
            activeValues={homeFilters[filterSheet] || []}
            onSelect={(vals) => setHomeFilters(prev => ({ ...prev, [filterSheet]: vals }))}
            onClose={closeFilterSheet}
            isClosing={filterSheetClosing}
          />
        )}
      </div>
    );
    if (!coffees) return <LoadingScreen />;
    if (tabId === 'search') return <ExploreScreen cups={coffees} />;
    if (tabId === 'add') return <LogCupScreen onSaved={loadCoffees} onDone={() => handleTabChange('home')} />;
    if (tabId === 'beans') return <BeansScreen />;
    return null;
  };

  const activeIdx = TAB_ORDER.indexOf(activeTab);

  return (
    <SelectCupContext.Provider value={setSelectedCupId}>
    <div className="phone-wrap">
      {/* Phone shell */}
      <div className="phone-shell" style={{
        width: '393px',
        height: '852px',
        background: '#f9eddd',
        borderRadius: '50px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}>
        {/* Dynamic Island */}
        <div className="mock-island" style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '126px',
          height: '37px',
          background: '#0A0A0A',
          borderRadius: '20px',
          zIndex: 50,
        }} />

        {/* Screen content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#f9eddd',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div className="mock-statusbar" style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '24px',
            paddingRight: '24px',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Avenir, system-ui, sans-serif', fontSize: '13px', fontWeight: 500, color: '#000000', flex: '0 0 auto' }}>9:41</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: '0 0 auto' }}>
              <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                {[0,1,2,3].map(i => (
                  <rect key={i} x={i*4.5} y={12-(i+1)*3} width="3" height={(i+1)*3} rx="1" fill="#000000" />
                ))}
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M1 4.5C3.5 2 6.5 0.75 8 0.75C9.5 0.75 12.5 2 15 4.5" stroke="#000000" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M3.5 7C5 5.5 6.5 4.75 8 4.75C9.5 4.75 11 5.5 12.5 7" stroke="#000000" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M6 9.5C6.8 8.7 7.3 8.5 8 8.5C8.7 8.5 9.2 8.7 10 9.5" stroke="#000000" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="8" cy="11.25" r="1" fill="#000000"/>
              </svg>
              <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
                <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="#000000" strokeWidth="1"/>
                <rect x="2" y="2" width="18" height="8" rx="1.5" fill="#000000"/>
                <path d="M23.5 4V8C24.5 7.5 25 6.9 25 6C25 5.1 24.5 4.5 23.5 4Z" fill="#000000"/>
              </svg>
            </div>
          </div>

          {/* Screen content with directional slide transitions */}
          <div style={{ position: 'relative', overflow: 'hidden', flex: 1, minHeight: 0 }}>
            {prevTab && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                display: 'flex', flexDirection: 'column',
                animation: `${direction > 0 ? 'slideOutToLeft' : 'slideOutToRight'} 300ms cubic-bezier(0.32, 0.72, 0, 1) forwards`,
              }}>
                {renderScreen(prevTab)}
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', flexDirection: 'column',
              animation: prevTab ? `${direction > 0 ? 'slideInFromRight' : 'slideInFromLeft'} 300ms cubic-bezier(0.32, 0.72, 0, 1) forwards` : 'none',
            }}>
              {renderScreen(activeTab)}
            </div>
          </div>

          {/* bottomnav-gradient — Figma node 694:64 */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '118px',
            background: 'linear-gradient(to bottom, rgba(249,237,221,0), rgba(253,203,136,0.6))',
            pointerEvents: 'none',
            zIndex: 50,
          }} />

          {/* Bottom tab bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '393px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingBottom: '34px',
            paddingTop: '16px',
            paddingLeft: '25px',
            paddingRight: '25px',
            boxSizing: 'border-box',
            zIndex: 50,
          }}>
            {/* Tabs pill */}
            <div style={{
              flex: '1 0 0',
              minWidth: 0,
              position: 'relative',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
            }}>
              {/* BG: Fill + Shadow + Glass Effect */}
              <div style={{ position: 'absolute', inset: '-4px', borderRadius: '296px', overflow: 'hidden', boxShadow: '0px 8px 40px 0px rgba(0,0,0,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)' }} />
                <div style={{ position: 'absolute', inset: 0, background: '#ddd', mixBlendMode: 'color-burn' }} />
                <div style={{ position: 'absolute', inset: 0, background: '#f7f7f7', mixBlendMode: 'darken' }} />
              </div>
              {/* Sliding active pill */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '76px',
                borderRadius: '100px',
                background: 'rgba(252, 153, 155, 0.5)',
                transform: `translateX(${activeIdx * 64}px)`,
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'none',
              }} />
              {[
                { id: 'home',   icon: 'home',   label: 'Home' },
                { id: 'search', icon: 'search', label: 'Explore' },
                { id: 'add',    icon: 'add',    label: 'Log Cup' },
                { id: 'beans',  icon: 'beans',  label: 'Beans' },
              ].map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    width: '72px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '6px',
                    paddingBottom: '7px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    marginRight: i < 3 ? '-8px' : '0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'relative', width: '30px', height: '30px', flexShrink: 0,
                    transform: activeTab === tab.id ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                  }}>
                    <TabIcon type={tab.icon} active={activeTab === tab.id} />
                  </div>
                  <span style={{
                    fontFamily: 'Avenir, system-ui, sans-serif',
                    fontSize: '12px',
                    color: '#5d0505',
                    fontWeight: 500,
                    lineHeight: 1.1,
                    letterSpacing: '0',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    textAlign: 'center',
                    width: '100%',
                    transition: 'color 0.2s ease',
                  }}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Search button (visual placeholder) */}
            <div style={{
              width: '59px',
              height: '59px',
              position: 'relative',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* BG: Fill + Shadow + Glass Effect */}
              <div style={{ position: 'absolute', inset: '-4px', borderRadius: '296px', overflow: 'hidden', boxShadow: '0px 8px 40px 0px rgba(0,0,0,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)' }} />
                <div style={{ position: 'absolute', inset: 0, background: '#ddd', mixBlendMode: 'color-burn' }} />
                <div style={{ position: 'absolute', inset: 0, background: '#f7f7f7', mixBlendMode: 'darken' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="#5d0505" strokeWidth="2.2" strokeLinecap="round"/>
                  <path d="M16.5 16.5L21 21" stroke="#5d0505" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Coffee Detail overlay — covers screen content + tab bar when a bag is selected */}
          {selectedCup && (
            <CoffeeDetailScreen cup={selectedCup} onBack={() => setSelectedCupId(null)} onRefresh={loadCoffees} />
          )}
        </div>
      </div>
    </div>
    </SelectCupContext.Provider>
  );
}

export default App;
