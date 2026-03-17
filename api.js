const FC      = 'https://gis.franklincountyohio.gov/hosting/rest/services/ParcelFeatures/Parcel_Features/FeatureServer/0/query';
const AUDITOR = 'https://audr-api.franklincountyohio.gov/v1/parcel';
const OVERPASS= 'https://overpass-api.de/api/interpreter';
const NOMINATIM='https://nominatim.openstreetmap.org/search';
const CARD    = 'https://audr-apps.franklincountyohio.gov/Redir/Link/Parcel/';
const TTL     = 86_400_000;

// CLASSCD codes and their properties (from Franklin County Auditor)
export const CLASS_CODES = {
  600: {label:'Federal',         color:'#6b7280', risk:'med',   desc:'Federal government property'},
  605: {label:'Land Bank/CLRC',  color:'#2dd4bf', risk:'low',   desc:'County Land Reutilization Corp'},
  610: {label:'State of Ohio',   color:'#58a6ff', risk:'med',   desc:'State of Ohio property'},
  620: {label:'Franklin County', color:'#8b5cf6', risk:'med',   desc:'County-owned property'},
  630: {label:'Township',        color:'#a78bfa', risk:'med',   desc:'Township property'},
  640: {label:'Municipal',       color:'#3fb950', risk:'low',   desc:'City-owned. CPD trespass auth rarely filed'},
  650: {label:'School District', color:'#f85149', risk:'avoid', desc:'Board of Education. AVOID - active enforcement'},
  660: {label:'Metro Parks',     color:'#22c55e', risk:'med',   desc:'Park District public land'},
  670: {label:'School/College',  color:'#f97316', risk:'med',   desc:'College/Academy/Private School'},
  680: {label:'Charity/Hospital',color:'#9ca3af', risk:'med',   desc:'Charitable, Hospital, Homes for Aged'}
};

// Get class info
export const getClassInfo = code => CLASS_CODES[code] || {label:`Code ${code}`, color:'#6b7280', risk:'med', desc:'Unknown'};

// Risk classification based on CLASSCD
export const riskLevel = classcd => getClassInfo(classcd).risk;

export const riskText = r => ({
  low:'🟢 LOW',
  med:'🟡 MED',
  avoid:'🔴 AVOID',
  high:'🔴 HIGH'
}[r] || '❓');

export const riskDescription = r => ({
  low:'City-owned or land bank. CPD trespass auth required, rarely filed.',
  med:'Other public entity. Verify before use.',
  avoid:'School district. Active enforcement - AVOID.',
  high:'Private property. Avoid.'
}[r] || '');

// Resource types for Overpass queries
export const RESOURCE_TYPES = {
  // Transit
  bus:          {label:'Bus Stop',        icon:'🚌', overpass:'node["highway"="bus_stop"]'},

  // Basic Needs
  water:        {label:'Drinking Water',  icon:'💧', overpass:'node["amenity"="drinking_water"]'},
  toilet:       {label:'Restroom',        icon:'🚻', overpass:'node["amenity"="toilets"]'},
  shelter:      {label:'Shelter',         icon:'🏠', overpass:'node["social_facility"="shelter"]'},
  food_bank:    {label:'Food Bank',       icon:'🥫', overpass:'node["amenity"="food_bank"],node["social_facility"="food_bank"]'},

  // Health
  hospital:     {label:'Hospital/Clinic', icon:'🏥', overpass:'node["amenity"="hospital"],node["amenity"="clinic"]'},
  pharmacy:     {label:'Pharmacy',        icon:'💊', overpass:'node["amenity"="pharmacy"]'},
  mental_health:{label:'Mental Health',   icon:'🧠', overpass:'node["amenity"="mental_health"],node["amenity"="social_facility"],node["healthcare"="counselling"]'},
  library:      {label:'Library',         icon:'📚', overpass:'node["amenity"="library"]'},

  // Utilities
  laundry:      {label:'Laundromat',      icon:'👕', overpass:'node["shop"="laundry"],node["shop"="dry_cleaning"]'},
  power:        {label:'Charging',        icon:'⚡', overpass:'node["amenity"="charging_station"]'},
  wifi:         {label:'Free WiFi',       icon:'📶', overpass:'node["internet_access"="wlan"]'},

  // Parks/Recreation
  dog_park:     {label:'Dog Park',        icon:'🐕', overpass:'node["leisure"="dog_park"],way["leisure"="dog_park"]'},

  // Public Safety
  police:       {label:'Police Station',  icon:'🚔', overpass:'node["amenity"="police"]'},

  // Fast Food (cheap eats with apps)
  mcdonalds:    {label:'McDonald\'s',     icon:'🍔', overpass:'node["amenity"="fast_food"]["brand"="McDonald\'s"],node["name"~"McDonald"]'},
  speedway:     {label:'Speedway',        icon:'⛽', overpass:'node["brand"="Speedway"],node["amenity"="fuel"]["name"~"Speedway"]'},
  sheetz:       {label:'Sheetz',          icon:'🛒', overpass:'node["brand"="Sheetz"],node["amenity"="fuel"]["name"~"Sheetz"]'},

  // Grocery Stores
  aldi:         {label:'Aldi',            icon:'🛒', overpass:'node["shop"="supermarket"]["brand"~"ALDI"],node["name"~"ALDI"]'},
  kroger:       {label:'Kroger',          icon:'🛒', overpass:'node["shop"="supermarket"]["brand"~"Kroger"],node["name"~"Kroger"]'},
  dollar_store: {label:'Dollar Store',    icon:'💵', overpass:'node["shop"="variety_store"],node["name"~"Dollar Tree"],node["name"~"Dollar General"],node["name"~"Family Dollar"]'},

  // Big Box Stores
  big_lots:     {label:'Big Lots',        icon:'📦', overpass:'node["shop"="variety_store"]["brand"~"Big Lots"],node["name"~"Big Lots"]'},
  walmart:      {label:'Walmart',         icon:'🏬', overpass:'node["shop"="supermarket"]["brand"~"Walmart"],node["shop"="department_store"]["brand"~"Walmart"],node["name"~"Walmart"]'},
  target:       {label:'Target',          icon:'🎯', overpass:'node["shop"="department_store"]["brand"~"Target"],node["name"~"Target"]'},

  // Thrift/Second-hand
  thrift:       {label:'Thrift Store',    icon:'👕', overpass:'node["shop"="charity"],node["shop"="second_hand"],node["name"~"Goodwill"],node["name"~"Salvation Army"]'},

  // Scrap/Recycling (for cash)
  scrap_yard:   {label:'Scrap Yard',      icon:'♻️', overpass:'node["industrial"="scrapyard"],node["recycling:type"="scrap_metal"],node["name"~"scrap"]i'},
  recycling:    {label:'Recycling Center',icon:'♻️', overpass:'node["amenity"="recycling"]'},
  pawn_shop:    {label:'Pawn Shop',       icon:'💰', overpass:'node["shop"="pawnbroker"]'},

  // Buy/Sell
  used_clothes: {label:'Buy Used Clothes',icon:'👗', overpass:'node["shop"="clothes"]["second_hand"="yes"],node["name"~"Plato"],node["name"~"Clothes Mentor"]'},
  electronics:  {label:'Electronics Buy', icon:'📱', overpass:'node["shop"="electronics"],node["name"~"GameStop"],node["name"~"Best Buy"]'},

  // Housing (dumpster diving opportunities)
  apartments:   {label:'Apartment Complex',icon:'🏢', overpass:'way["building"="apartments"],node["building"="apartments"],relation["building"="apartments"]'},
};

// Hardcoded Columbus-specific resources
export const HARDCODED_RESOURCES = [
  {type:'shelter',name:'Faith Mission Men\'s Shelter',address:'315 N 6th St',lat:39.9689,lon:-82.9955},
  {type:'shelter',name:'Faith Mission Women\'s Shelter',address:'620 N 4th St',lat:39.9712,lon:-82.9988},
  {type:'shelter',name:'Open Shelter',address:'24 W Starre St',lat:39.9587,lon:-83.0021,notes:'Year-round low-barrier'},
  {type:'shelter',name:'Community Shelter Board',address:'195 N Grant Ave',lat:39.9638,lon:-82.9927,notes:'Coordinated entry'},
  {type:'food_bank',name:'Mid-Ohio Foodbank',address:'3960 Brookham Dr',lat:40.0142,lon:-82.9294},
  {type:'food_bank',name:'Faith Mission Food Pantry',address:'315 N 6th St',lat:39.9689,lon:-82.9955},
  {type:'water',name:'Columbus Metropolitan Library - Main',address:'96 S Grant Ave',lat:39.9621,lon:-82.9898,notes:'Restrooms + water'},
  {type:'water',name:'Columbus Metropolitan Library - Franklinton',address:'1061 W Town St',lat:39.9592,lon:-83.0254},
  {type:'water',name:'Columbus Metropolitan Library - Martin Luther King',address:'1600 E Long St',lat:39.9634,lon:-82.9746},
  {type:'mental_health',name:'ADAMH Board',address:'447 E Broad St',lat:39.9631,lon:-82.9865,notes:'Crisis services'},
  {type:'mental_health',name:'Netcare Access',address:'199 S Central Ave',lat:39.9602,lon:-83.0007,notes:'24/7 crisis'},
];

// Haversine distance in miles
export const distMiles = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Get centroid of a GeoJSON polygon
export const getCentroid = (geometry) => {
  if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) return null;
  const coords = geometry.coordinates[0];
  const n = coords.length;
  let sumLat = 0, sumLon = 0;
  for (const c of coords) {
    sumLon += c[0];
    sumLat += c[1];
  }
  return { lat: sumLat / n, lon: sumLon / n };
};

// LocalStorage cache helpers
const cacheGet = k => {
  try {
    const r = localStorage.getItem(k);
    if (!r) return null;
    const {ts, data} = JSON.parse(r);
    if (Date.now() - ts > TTL) { localStorage.removeItem(k); return null; }
    return data;
  } catch { return null; }
};
const cacheSet = (k, d) => {
  try { localStorage.setItem(k, JSON.stringify({ts: Date.now(), data: d})); } catch {}
};

// Bounding box from center + radius
const bboxFromCenter = (lat, lon, mi) => {
  const d = mi / 69;
  return {
    n: lat + d,
    s: lat - d,
    e: lon + d / Math.cos(lat * Math.PI / 180),
    w: lon - d / Math.cos(lat * Math.PI / 180)
  };
};

// Find public parcels within bounds, with optional CLASSCD filter
export async function findPublicParcels({
  lat, lon,
  radiusMiles = 0.5,
  bounds,
  limit = 200,
  includeGeometry = true,
  classFilter = ['600','605','610','620','630','640','650','660','670','680'], // all public classes
  gpsLat = null, // for distance calculation
  gpsLon = null
} = {}) {
  const b = bounds
    ? {w: bounds._southWest?.lng ?? bounds.w, s: bounds._southWest?.lat ?? bounds.s, e: bounds._northEast?.lng ?? bounds.e, n: bounds._northEast?.lat ?? bounds.n}
    : bboxFromCenter(lat, lon, radiusMiles);

  const ck = `p_${JSON.stringify(b)}_${includeGeometry}_${classFilter.join(',')}`;
  const cached = cacheGet(ck);
  if (cached) {
    // Recalculate distances with current GPS
    return cached.map(p => ({
      ...p,
      dist_miles: gpsLat && gpsLon && p.centroid ? distMiles(gpsLat, gpsLon, p.centroid.lat, p.centroid.lon) : null,
      dist_label: gpsLat && gpsLon && p.centroid ? distMiles(gpsLat, gpsLon, p.centroid.lat, p.centroid.lon)?.toFixed(2) + ' mi' : null
    }));
  }

  // Build WHERE clause for CLASSCD filter
  const classWhere = classFilter.length > 0
    ? `CLASSCD IN (${classFilter.map(c => `'${c}'`).join(',')})`
    : '1=0'; // nothing if no filter

  const geo = JSON.stringify({xmin: b.w, ymin: b.s, xmax: b.e, ymax: b.n, spatialReference: {wkid: 4326}});
  const p = new URLSearchParams({
    where: classWhere,
    geometry: geo,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: 4326,
    outFields: 'PARCELID,OWNERNME1,CLASSCD,CLASSDSCRP,SITEADDRESS,ACRES,TOTVALUEBASE,SALEDATE,ZIPCD',
    returnGeometry: includeGeometry ? 'true' : 'false',
    outSR: '4326',
    resultRecordCount: limit,
    f: 'geojson'
  });

  const r = await fetch(`${FC}?${p}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);

  const out = (d.features || []).map(f => {
    const a = f.properties;
    const classInfo = getClassInfo(a.CLASSCD);
    const centroid = f.geometry ? getCentroid(f.geometry) : null;
    const saleYear = a.SALEDATE ? new Date(a.SALEDATE).getFullYear() : null;

    return {
      parcel_id: a.PARCELID,
      address: a.SITEADDRESS,
      owner: a.OWNERNME1,
      classcd: a.CLASSCD,
      class_label: classInfo.label,
      class_color: classInfo.color,
      class_desc: a.CLASSDSCRP,
      risk: classInfo.risk,
      risk_text: riskText(classInfo.risk),
      risk_desc: classInfo.desc,
      acres: a.ACRES,
      appraised: a.TOTVALUEBASE,
      last_sale_year: saleYear,
      zip: a.ZIPCD,
      property_card: CARD + (a.PARCELID || ''),
      geometry: f.geometry || null,
      centroid,
      dist_miles: gpsLat && gpsLon && centroid ? distMiles(gpsLat, gpsLon, centroid.lat, centroid.lon) : null
    };
  });

  // Add distance label
  out.forEach(p => {
    p.dist_label = p.dist_miles !== null ? p.dist_miles.toFixed(2) + ' mi' : null;
  });

  cacheSet(ck, out);

  return out;
}

// Sort parcels by different criteria
export const sortParcels = (parcels, sortBy = 'risk', gpsLat = null, gpsLon = null) => {
  const sorted = [...parcels];

  switch (sortBy) {
    case 'distance':
      if (gpsLat && gpsLon) {
        sorted.sort((a, b) => (a.dist_miles || 999) - (b.dist_miles || 999));
      }
      break;
    case 'risk':
      const riskOrder = {low: 0, med: 1, avoid: 2, high: 3};
      sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
      break;
    case 'acres':
      sorted.sort((a, b) => (b.acres || 0) - (a.acres || 0));
      break;
    case 'class':
      sorted.sort((a, b) => (a.classcd || '').localeCompare(b.classcd || ''));
      break;
  }

  return sorted;
};

// Find nearby resources via Overpass + hardcoded
export async function findNearbyResources({lat, lon, radiusMeters=800, types}={}) {
  const keys = types || Object.keys(RESOURCE_TYPES);
  const ck = `r_${lat.toFixed(4)}_${lon.toFixed(4)}_${radiusMeters}_${keys.join(',')}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  const queries = keys.flatMap(k =>
    (RESOURCE_TYPES[k]?.overpass || '').split(',').map(q => `${q}(around:${radiusMeters},${lat},${lon});`)
  );
  const ql = `[out:json][timeout:25];(${queries.join('')});out center tags;`;

  const r = await fetch(OVERPASS, {method: 'POST', body: 'data=' + encodeURIComponent(ql)});
  const d = await r.json();

  const osmResults = (d.elements || []).map(e => {
    const rl = e.lat || e.center?.lat, ro = e.lon || e.center?.lon;
    const t = e.tags || {};
    const name = (t.name || '').toLowerCase();
    const brand = (t.brand || '').toLowerCase();
    let type = 'other', icon = '📍';

    // Basic needs
    if (t.highway === 'bus_stop') { type = 'bus'; icon = '🚌'; }
    else if (t.amenity === 'drinking_water') { type = 'water'; icon = '💧'; }
    else if (t.amenity === 'toilets') { type = 'toilet'; icon = '🚻'; }
    else if (t.social_facility === 'shelter') { type = 'shelter'; icon = '🏠'; }
    else if (t.amenity === 'food_bank' || t.social_facility === 'food_bank') { type = 'food_bank'; icon = '🥫'; }

    // Health
    else if (t.amenity === 'hospital' || t.amenity === 'clinic') { type = 'hospital'; icon = '🏥'; }
    else if (t.amenity === 'pharmacy') { type = 'pharmacy'; icon = '💊'; }
    else if (t.amenity === 'mental_health' || t.healthcare || t.amenity === 'social_facility') { type = 'mental_health'; icon = '🧠'; }
    else if (t.amenity === 'library') { type = 'library'; icon = '📚'; }

    // Utilities
    else if (t.shop === 'laundry' || t.shop === 'dry_cleaning') { type = 'laundry'; icon = '👕'; }
    else if (t.amenity === 'charging_station') { type = 'power'; icon = '⚡'; }
    else if (t.internet_access === 'wlan') { type = 'wifi'; icon = '📶'; }

    // Parks
    else if (t.leisure === 'dog_park') { type = 'dog_park'; icon = '🐕'; }

    // Public safety
    else if (t.amenity === 'police') { type = 'police'; icon = '🚔'; }

    // Fast food / gas stations with food
    else if (t.amenity === 'fast_food' && (name.includes('mcdonald') || brand.includes('mcdonald'))) { type = 'mcdonalds'; icon = '🍔'; }
    else if ((t.amenity === 'fuel' || t.shop === 'convenience') && (name.includes('speedway') || brand.includes('speedway'))) { type = 'speedway'; icon = '⛽'; }
    else if ((t.amenity === 'fuel' || t.shop === 'convenience') && (name.includes('sheetz') || brand.includes('sheetz'))) { type = 'sheetz'; icon = '🛒'; }

    // Grocery
    else if (t.shop === 'supermarket' && (name.includes('aldi') || brand.includes('aldi'))) { type = 'aldi'; icon = '🛒'; }
    else if (t.shop === 'supermarket' && (name.includes('kroger') || brand.includes('kroger'))) { type = 'kroger'; icon = '🛒'; }
    else if (t.shop === 'variety_store' || name.includes('dollar tree') || name.includes('dollar general') || name.includes('family dollar')) { type = 'dollar_store'; icon = '💵'; }

    // Big box
    else if (name.includes('big lots') || brand.includes('big lots')) { type = 'big_lots'; icon = '📦'; }
    else if (name.includes('walmart') || brand.includes('walmart')) { type = 'walmart'; icon = '🏬'; }
    else if (name.includes('target') || brand.includes('target')) { type = 'target'; icon = '🎯'; }

    // Thrift
    else if (t.shop === 'charity' || t.shop === 'second_hand' || name.includes('goodwill') || name.includes('salvation army')) { type = 'thrift'; icon = '👕'; }

    // Scrap/recycling
    else if (t.industrial === 'scrapyard' || t['recycling:type'] === 'scrap_metal' || name.includes('scrap')) { type = 'scrap_yard'; icon = '♻️'; }
    else if (t.amenity === 'recycling') { type = 'recycling'; icon = '♻️'; }
    else if (t.shop === 'pawnbroker') { type = 'pawn_shop'; icon = '💰'; }

    // Buy/sell
    else if ((t.shop === 'clothes' && t.second_hand === 'yes') || name.includes('plato') || name.includes('clothes mentor')) { type = 'used_clothes'; icon = '👗'; }
    else if (t.shop === 'electronics' || name.includes('gamestop') || name.includes('best buy')) { type = 'electronics'; icon = '📱'; }

    // Housing
    else if (t.building === 'apartments' || t.landuse === 'residential') { type = 'apartments'; icon = '🏢'; }

    return {
      type, icon,
      type_label: RESOURCE_TYPES[type]?.label || type,
      name: t.name || RESOURCE_TYPES[type]?.label || type,
      lat: rl, lon: ro,
      address: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') || null,
      tags: t,
      dist_miles: rl ? distMiles(lat, lon, rl, ro) : null,
      source: 'osm'
    };
  });

  const radiusMiles = radiusMeters / 1609;
  const hardcodedResults = HARDCODED_RESOURCES.filter(h => {
    const d = distMiles(lat, lon, h.lat, h.lon);
    return d <= radiusMiles;
  }).map(h => ({
    ...h,
    icon: RESOURCE_TYPES[h.type]?.icon || '📍',
    type_label: RESOURCE_TYPES[h.type]?.label || h.type,
    dist_miles: distMiles(lat, lon, h.lat, h.lon),
    source: 'hardcoded'
  }));

  const out = [...osmResults, ...hardcodedResults];
  out.sort((a, b) => (a.dist_miles || 99) - (b.dist_miles || 99));

  cacheSet(ck, out);
  return out;
}

// Score a location against user needs
export async function scoreLocation({lat, lon, needs=[]}) {
  const [parcels, resources] = await Promise.all([
    findPublicParcels({lat, lon, radiusMiles: 0.25, gpsLat: lat, gpsLon: lon}),
    findNearbyResources({lat, lon, radiusMeters: 1200})
  ]);

  const needMap = {
    laundry: ['laundry'], laundromat: ['laundry'],
    bus: ['bus'], transit: ['bus'],
    water: ['water'],
    power: ['power'], charging: ['power'], battery: ['power'],
    mental: ['mental_health'], 'mental health': ['mental_health'],
    toilet: ['toilet'], restroom: ['toilet'], bathroom: ['toilet'],
    food: ['food_bank'],
    shelter: ['shelter'],
    dog: ['dog_park'],
    wifi: ['wifi'], internet: ['wifi'],
    hospital: ['hospital'], clinic: ['hospital'],
    pharmacy: ['pharmacy'],
    library: ['library']
  };

  const breakdown = needs.map(need => {
    const types = Object.entries(needMap).find(([k]) => need.toLowerCase().includes(k))?.[1] || [];
    const matches = resources.filter(r => types.includes(r.type));
    const closest = matches[0] || null;
    return {
      need,
      met: matches.length > 0,
      closest_dist_miles: closest?.dist_miles?.toFixed(2) || null,
      closest_name: closest?.name || null,
      count_nearby: matches.length
    };
  });

  const best = parcels.find(p => p.risk === 'low');
  const score = Math.round(
    (best ? 40 : 0) +
    (needs.length > 0 ? 60 * (breakdown.filter(b => b.met).length / needs.length) : 60)
  );

  return {score, has_public_land: !!best, best_parcel: best || null, breakdown, parcels, resources};
}

// Geocode address
export async function geocode(query) {
  const q = query.toLowerCase().includes('columbus') ? query : `${query}, Columbus OH`;
  const p = new URLSearchParams({format: 'json', q, countrycodes: 'us', limit: 1});
  const r = await fetch(`${NOMINATIM}?${p}`, {
    headers: {'Accept-Language': 'en', 'User-Agent': 'Sprawlmap/1.0 humanitarian-tool'}
  });
  const d = await r.json();
  if (!d.length) return null;
  return {lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), display_name: d[0].display_name};
}

// Get parcel detail from Auditor API
export async function getParcelDetail(pin) {
  const r = await fetch(`${AUDITOR}/${encodeURIComponent(pin)}`);
  if (!r.ok) throw new Error(`Auditor API ${r.status}`);
  return r.json();
}

// Tool dispatcher for LLM agents
export async function dispatch(name, args) {
  switch (name) {
    case 'findPublicParcels':   return findPublicParcels(args);
    case 'findNearbyResources': return findNearbyResources(args);
    case 'scoreLocation':       return scoreLocation(args);
    case 'getParcelDetail':     return getParcelDetail(args.pin);
    case 'geocode':             return geocode(args.query);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}
