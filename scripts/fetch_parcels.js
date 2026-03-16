#!/usr/bin/env node
// Fetches all public parcels from Franklin County, writes GeoJSON to stdout.
// Run: node scripts/fetch_parcels.js > data/public_parcels.geojson
// Requires Node 18+

const URL = 'https://gis.franklincountyohio.gov/hosting/rest/services/ParcelFeatures/Parcel_Features/FeatureServer/0/query';

// CLASSCD codes for public/exempt parcels
const CLASS_CODES = {
  640: {label:'Municipal',        color:'#3fb950', risk:'low'},
  605: {label:'Land Bank/CLRC',   color:'#2dd4bf', risk:'low'},
  610: {label:'State of Ohio',    color:'#58a6ff', risk:'med'},
  620: {label:'Franklin County',  color:'#8b5cf6', risk:'med'},
  630: {label:'Township',         color:'#a78bfa', risk:'med'},
  650: {label:'School District',  color:'#f85149', risk:'avoid'},
  660: {label:'Metro Parks/COTA', color:'#eab308', risk:'med'},
  670: {label:'Religious/Charity',color:'#6b7280', risk:'med'},
  680: {label:'Other Exempt',     color:'#9ca3af', risk:'med'}
};

// Filter by CLASSCD (6xx codes)
const WHERE = `CLASSCD IN ('640','605','610','620','630','650','660','670','680')`;

function getClassInfo(code) {
  return CLASS_CODES[code] || {label:`Code ${code}`, color:'#6b7280', risk:'med'};
}

async function page(offset) {
  const p = new URLSearchParams({
    where: WHERE,
    outFields: 'PARCELID,OWNERNME1,CLASSCD,CLASSDSCRP,SITEADDRESS,ACRES,TOTVALUEBASE,SALEDATE,ZIPCD',
    returnGeometry: 'true',
    inSR: 4326,
    outSR: '4326',
    resultOffset: offset,
    resultRecordCount: 1000,
    f: 'geojson'
  });
  const r = await fetch(`${URL}?${p}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main() {
  const features = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`offset ${offset}...\n`);
    const d = await page(offset).catch(e => {
      process.stderr.write(`err: ${e.message}\n`);
      return {features: []};
    });
    const batch = d.features || [];
    if (!batch.length) break;

    for (const f of batch) {
      const p = f.properties;
      const info = getClassInfo(p.CLASSCD);
      p.class_label = info.label;
      p.class_color = info.color;
      p.risk = info.risk;
      p.property_card = `https://property.franklincountyauditor.com/_web/propertycard/propertycard.aspx?pin=${p.PARCELID || ''}`;
    }
    features.push(...batch);

    if (batch.length < 1000) break;
    offset += 1000;
    await new Promise(r => setTimeout(r, 350));
  }

  // Count by risk
  const counts = {low: 0, med: 0, avoid: 0, high: 0};
  features.forEach(f => counts[f.properties.risk] = (counts[f.properties.risk] || 0) + 1);

  process.stderr.write(`done: ${features.length} parcels (low:${counts.low} med:${counts.med} avoid:${counts.avoid})\n`);
  process.stdout.write(JSON.stringify({
    type: 'FeatureCollection',
    generated: new Date().toISOString(),
    count: features.length,
    risk_counts: counts,
    features
  }, null, 2));
}

main().catch(e => {
  process.stderr.write(e.stack + '\n');
  process.exit(1);
});
