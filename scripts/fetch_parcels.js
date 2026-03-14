#!/usr/bin/env node
const FC_URL='https://gis.franklincountyohio.gov/hosting/rest/services/ParcelFeatures/Parcel_Features/FeatureServer/0/query';
const PUBLIC_WHERE=["CITY","LAND BANK","METRO PARKS","FRANKLIN CO","BOARD OF EDUCATION","LAND REUTILIZATION"].map(k=>`OWNERNAME1 LIKE '%${k}%'`).join(' OR ');
const LUC={605:'Land Bank/CLRC',610:'State of Ohio',620:'Franklin County',630:'Township',640:'City of Columbus',650:'Board of Education',660:'Metro Parks/COTA',670:'Religious/Charitable',680:'Other Exempt'};
const lucLabel=c=>LUC[parseInt(c)]||(parseInt(c)>=600&&parseInt(c)<700?'Exempt Public':`Code ${c}`);
const risk=u=>{const c=parseInt(u||0);if(c===640||c===605)return'low';if(c>=600&&c<700)return'med';return'high';};

async function fetchPage(offset=0){
  const p=new URLSearchParams({where:PUBLIC_WHERE,outFields:'PARCELID,OWNERNAME1,USECD,SITEADDRESS,ACRES,APPRVALUE,SALEYEAR,ZIPCD',returnGeometry:'true',outSR:'4326',resultOffset:offset,resultRecordCount:1000,f:'geojson'});
  const r=await fetch(`${FC_URL}?${p}`);
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main(){
  const features=[];let offset=0;
  while(true){
    process.stderr.write(`Fetching offset ${offset}...\n`);
    const d=await fetchPage(offset).catch(e=>{process.stderr.write(`Error: ${e.message}\n`);return{features:[]};});
    const batch=d.features||[];
    if(!batch.length)break;
    batch.forEach(f=>{const p=f.properties;p.luc_label=lucLabel(p.USECD);p.risk=risk(p.USECD);p.property_card=`https://property.franklincountyauditor.com/_web/propertycard/propertycard.aspx?pin=${p.PARCELID||''}`;});
    features.push(...batch);
    if(batch.length<1000)break;
    offset+=1000;
    await new Promise(r=>setTimeout(r,300));
  }
  process.stderr.write(`Total: ${features.length} parcels\n`);
  process.stdout.write(JSON.stringify({type:'FeatureCollection',generated:new Date().toISOString(),count:features.length,features}));
}
main().catch(e=>{process.stderr.write(e.stack+'\n');process.exit(1);});
