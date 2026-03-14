const FC      = 'https://gis.franklincountyohio.gov/hosting/rest/services/ParcelFeatures/Parcel_Features/FeatureServer/0/query';
const AUDITOR = 'https://audr-api.franklincountyohio.gov/v1/parcel';
const OVERPASS= 'https://overpass-api.de/api/interpreter';
const NOMINATIM='https://nominatim.openstreetmap.org/search';
const CARD    = 'https://property.franklincountyauditor.com/_web/propertycard/propertycard.aspx?pin=';
const TTL     = 86_400_000;

const KW=['CITY','COLUMBUS','FRANKLIN CO','LAND BANK','METRO PARKS','BOARD OF EDUCATION','LAND REUTILIZATION','CLRC'];

export const RESOURCE_TYPES={
  bus:         {label:'Bus Stop',        icon:'🚌',overpass:'node["highway"="bus_stop"]'},
  laundry:     {label:'Laundromat',      icon:'👕',overpass:'node["shop"="laundry"],node["shop"="dry_cleaning"]'},
  water:       {label:'Drinking Water',  icon:'💧',overpass:'node["amenity"="drinking_water"]'},
  power:       {label:'Charging',        icon:'⚡',overpass:'node["amenity"="charging_station"]'},
  mental_health:{label:'Mental Health',  icon:'🧠',overpass:'node["amenity"="mental_health"],node["amenity"="social_facility"]'},
  toilet:      {label:'Restroom',        icon:'🚻',overpass:'node["amenity"="toilets"]'},
  food_bank:   {label:'Food Bank',       icon:'🥫',overpass:'node["amenity"="food_bank"],node["social_facility"="food_bank"]'},
  shelter:     {label:'Shelter',         icon:'🏠',overpass:'node["social_facility"="shelter"]'},
  dog_park:    {label:'Dog Park',        icon:'🐕',overpass:'node["leisure"="dog_park"]'},
  wifi:        {label:'Free WiFi',       icon:'📶',overpass:'node["internet_access"="wlan"]'},
  hospital:    {label:'Hospital/Clinic', icon:'🏥',overpass:'node["amenity"="hospital"],node["amenity"="clinic"]'},
  pharmacy:    {label:'Pharmacy',        icon:'💊',overpass:'node["amenity"="pharmacy"]'},
};

const LUC={605:'Land Bank/CLRC ⭐',610:'State of Ohio',620:'Franklin County',630:'Township',640:'City of Columbus ⭐⭐',650:'Board of Education',660:'Metro Parks/COTA',670:'Religious/Charitable',680:'Other Exempt',400:'Vacant Commercial',300:'Vacant Industrial',500:'Vacant Residential'};
export const lucLabel=c=>LUC[parseInt(c)]||(parseInt(c)>=600&&parseInt(c)<700?'Exempt Public':`Code ${c}`);
export const riskLevel=(u,o)=>{const c=parseInt(u||0),pub=KW.some(k=>(o||'').toUpperCase().includes(k));if(c===640||c===605)return'low';if(c>=600&&c<700&&pub)return'med';if(pub)return'med';return'high';};
export const riskText=r=>({low:'🟢 LOW',med:'🟡 MED',high:'🔴 HIGH'})[r]||'❓';
export const distMiles=(a,b,c,d)=>{const R=3958.8,dL=(c-a)*Math.PI/180,dO=(d-b)*Math.PI/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};

const cGet=k=>{try{const r=localStorage.getItem(k);if(!r)return null;const{ts,data}=JSON.parse(r);if(Date.now()-ts>TTL){localStorage.removeItem(k);return null;}return data;}catch{return null;}};
const cSet=(k,d)=>{try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}));}catch{}};
const bbox=(lat,lon,mi)=>{const d=mi/69;return{n:lat+d,s:lat-d,e:lon+d/Math.cos(lat*Math.PI/180),w:lon-d/Math.cos(lat*Math.PI/180)};};

export async function findPublicParcels({lat,lon,radiusMiles=0.5,bounds,limit=80}={}){
  // accepts either lat/lon+radius OR leaflet bounds object
  const b=bounds
    ?{w:bounds._southWest?.lng??bounds.w,s:bounds._southWest?.lat??bounds.s,e:bounds._northEast?.lng??bounds.e,n:bounds._northEast?.lat??bounds.n}
    :bbox(lat,lon,radiusMiles);
  const ck=`p_${JSON.stringify(b)}`;
  const cached=cGet(ck);if(cached)return cached;
  const where=KW.map(k=>`OWNERNAME1 LIKE '%${k}%'`).join(' OR ');
  const geo=JSON.stringify({xmin:b.w,ymin:b.s,xmax:b.e,ymax:b.n,spatialReference:{wkid:4326}});
  const p=new URLSearchParams({where,geometry:geo,geometryType:'esriGeometryEnvelope',spatialRel:'esriSpatialRelIntersects',inSR:4326,outFields:'PARCELID,OWNERNAME1,USECD,SITEADDRESS,ACRES,APPRVALUE,SALEYEAR,ZIPCD',returnGeometry:'false',resultRecordCount:limit,f:'json'});
  const r=await fetch(`${FC}?${p}`);
  const d=await r.json();
  if(d.error)throw new Error(d.error.message);
  const out=(d.features||[]).map(f=>{const a=f.attributes;return{parcel_id:a.PARCELID,address:a.SITEADDRESS,owner:a.OWNERNAME1,usecd:a.USECD,luc_label:lucLabel(a.USECD),risk:riskLevel(a.USECD,a.OWNERNAME1),risk_text:riskText(riskLevel(a.USECD,a.OWNERNAME1)),acres:a.ACRES,appraised:a.APPRVALUE,last_sale_year:a.SALEYEAR,zip:a.ZIPCD,property_card:CARD+(a.PARCELID||'')};});
  out.sort((a,b)=>({low:0,med:1,high:2})[a.risk]-({low:0,med:1,high:2})[b.risk]);
  cSet(ck,out);return out;
}

export async function findNearbyResources({lat,lon,radiusMeters=800,types}={}){
  const keys=types||Object.keys(RESOURCE_TYPES);
  const ck=`r_${lat.toFixed(4)}_${lon.toFixed(4)}_${radiusMeters}_${keys.join(',')}`;
  const cached=cGet(ck);if(cached)return cached;
  const queries=keys.flatMap(k=>(RESOURCE_TYPES[k]?.overpass||'').split(',').map(q=>`${q}(around:${radiusMeters},${lat},${lon});`));
  const ql=`[out:json][timeout:25];(${queries.join('')});out center tags;`;
  const r=await fetch(OVERPASS,{method:'POST',body:'data='+encodeURIComponent(ql)});
  const d=await r.json();
  const out=(d.elements||[]).map(e=>{
    const rl=e.lat||e.center?.lat,ro=e.lon||e.center?.lon,t=e.tags||{};
    let type='other',icon='📍';
    if(t.highway==='bus_stop'){type='bus';icon='🚌';}
    else if(t.shop==='laundry'||t.shop==='dry_cleaning'){type='laundry';icon='👕';}
    else if(t.amenity==='drinking_water'){type='water';icon='💧';}
    else if(t.amenity==='charging_station'){type='power';icon='⚡';}
    else if(t.amenity==='toilets'){type='toilet';icon='🚻';}
    else if(t.amenity==='food_bank'||t.social_facility==='food_bank'){type='food_bank';icon='🥫';}
    else if(t.social_facility==='shelter'){type='shelter';icon='🏠';}
    else if(t.leisure==='dog_park'){type='dog_park';icon='🐕';}
    else if(t.internet_access==='wlan'){type='wifi';icon='📶';}
    else if(t.amenity==='hospital'||t.amenity==='clinic'){type='hospital';icon='🏥';}
    else if(t.amenity==='pharmacy'){type='pharmacy';icon='💊';}
    else if(t.amenity==='mental_health'||t.healthcare||t.amenity==='social_facility'){type='mental_health';icon='🧠';}
    return{type,icon,name:t.name||RESOURCE_TYPES[type]?.label||type,lat:rl,lon:ro,address:[t['addr:housenumber'],t['addr:street']].filter(Boolean).join(' ')||null,tags:t,dist_miles:rl?distMiles(lat,lon,rl,ro):null};
  });
  out.sort((a,b)=>(a.dist_miles||99)-(b.dist_miles||99));
  cSet(ck,out);return out;
}

export async function scoreLocation({lat,lon,needs=[]}){
  const[parcels,resources]=await Promise.all([findPublicParcels({lat,lon,radiusMiles:0.25}),findNearbyResources({lat,lon,radiusMeters:1200})]);
  const nm={laundry:['laundry'],laundromat:['laundry'],bus:['bus'],transit:['bus'],water:['water'],power:['power'],charging:['power'],battery:['power'],mental:['mental_health'],'mental health':['mental_health'],toilet:['toilet'],restroom:['toilet'],bathroom:['toilet'],food:['food_bank'],shelter:['shelter'],dog:['dog_park'],wifi:['wifi'],internet:['wifi'],hospital:['hospital'],clinic:['hospital'],pharmacy:['pharmacy']};
  const breakdown=needs.map(need=>{
    const types=Object.entries(nm).find(([k])=>need.toLowerCase().includes(k))?.[1]||[];
    const matches=resources.filter(r=>types.includes(r.type));
    const closest=matches[0]||null;
    return{need,met:matches.length>0,closest_dist_miles:closest?.dist_miles?.toFixed(2)||null,closest_name:closest?.name||null,count_nearby:matches.length};
  });
  const best=parcels.find(p=>p.risk==='low');
  const score=Math.round((best?40:0)+(needs.length>0?60*(breakdown.filter(b=>b.met).length/needs.length):60));
  return{score,has_public_land:!!best,best_parcel:best||null,breakdown,parcels,resources};
}

export async function geocode(query){
  const q=query.toLowerCase().includes('columbus')?query:`${query}, Columbus OH`;
  const p=new URLSearchParams({format:'json',q,countrycodes:'us',limit:1});
  const r=await fetch(`${NOMINATIM}?${p}`,{headers:{'Accept-Language':'en','User-Agent':'Sprawlmap/1.0 humanitarian-tool'}});
  const d=await r.json();
  if(!d.length)return null;
  return{lat:parseFloat(d[0].lat),lon:parseFloat(d[0].lon),display_name:d[0].display_name};
}

export async function getParcelDetail(pin){
  const r=await fetch(`${AUDITOR}/${encodeURIComponent(pin)}`);
  if(!r.ok)throw new Error(`Auditor API ${r.status}`);
  return r.json();
}

export async function dispatch(name,args){
  switch(name){
    case'findPublicParcels':  return findPublicParcels(args);
    case'findNearbyResources':return findNearbyResources(args);
    case'scoreLocation':      return scoreLocation(args);
    case'getParcelDetail':    return getParcelDetail(args.pin);
    case'geocode':            return geocode(args.query);
    default:throw new Error(`Unknown tool: ${name}`);
  }
}
