#!/usr/bin/env node
// Fetches all public parcels from Franklin County, writes GeoJSON to stdout.
// Run by GH Action nightly. Also: node scripts/fetch_parcels.js > data/public_parcels.geojson
// Requires Node 18+

const URL = 'https://gis.franklincountyohio.gov/hosting/rest/services/ParcelFeatures/Parcel_Features/FeatureServer/0/query';
const WHERE = ['CITY','LAND BANK','METRO PARKS','FRANKLIN CO','BOARD OF EDUCATION','LAND REUTILIZATION']
  .map(k=>`OWNERNAME1 LIKE '%${k}%'`).join(' OR ');
const LUC = {605:'Land Bank/CLRC',610:'State of Ohio',620:'Franklin County',630:'Township',640:'City of Columbus',650:'Board of Education',660:'Metro Parks/COTA',670:'Religious/Charitable',680:'Other Exempt'};
const label = c => LUC[parseInt(c)] || (parseInt(c)>=600&&parseInt(c)<700 ? 'Exempt Public' : `Code ${c}`);
const risk  = u => { const c=parseInt(u||0); if(c===640||c===605)return'low'; if(c>=600&&c<700)return'med'; return'high'; };

async function page(offset){
  const p = new URLSearchParams({where:WHERE,outFields:'PARCELID,OWNERNAME1,USECD,SITEADDRESS,ACRES,APPRVALUE,SALEYEAR,ZIPCD',returnGeometry:'true',outSR:'4326',resultOffset:offset,resultRecordCount:1000,f:'geojson'});
  const r = await fetch(`${URL}?${p}`);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main(){
  const features=[]; let offset=0;
  while(true){
    process.stderr.write(`offset ${offset}...\n`);
    const d = await page(offset).catch(e=>{process.stderr.write(`err: ${e.message}\n`);return{features:[]};});
    const batch = d.features||[];
    if(!batch.length) break;
    for(const f of batch){
      const p=f.properties;
      p.luc_label=label(p.USECD);
      p.risk=risk(p.USECD);
      p.property_card=`https://property.franklincountyauditor.com/_web/propertycard/propertycard.aspx?pin=${p.PARCELID||''}`;
    }
    features.push(...batch);
    if(batch.length<1000) break;
    offset+=1000;
    await new Promise(r=>setTimeout(r,350));
  }
  process.stderr.write(`done: ${features.length} parcels\n`);
  process.stdout.write(JSON.stringify({type:'FeatureCollection',generated:new Date().toISOString(),count:features.length,features}));
}

main().catch(e=>{process.stderr.write(e.stack+'\n');process.exit(1);});
