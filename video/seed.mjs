const B='http://localhost:3001/api';
let tok;
// Dates relative to today in Copenhagen, so the build works on any day
const dk = d => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Copenhagen' });
const day = n => dk(new Date(Date.now() + n * 86400000));
const TODAY = day(0), YDAY = day(-1), OLD = day(-27);
async function api(p,m='GET',b){const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(p+' '+r.status+' '+t);return t?JSON.parse(t):null}
const reg=await api('/auth/register','POST',{email:'mia@studio-demo.dk',name:'Mia Holm',password:'demo1234'});
tok=reg.token;
const types={};
for(const n of ['Design','3D render','Print','Web']) types[n]=(await api('/task-types','POST',{name:n})).id;
// archived old job (for suggestions)
const old=await api('/tasks','POST',{name:'24098 Bølgen – Årsrapport',color:'#f07c28'});
await api('/tasks/'+old.id,'PATCH',{task_type_id:types['Design']});
await api('/entries','POST',{task_id:old.id,date:OLD,start_time:'09:00',end_time:'12:30',seconds:12600,committed:1});
await api('/tasks/'+old.id,'DELETE');
const jobs=[
 ['24117 Havnehuset – Katalog','Design'],
 ['24122 Nordlys – Kampagne','Web'],
 ['24130 Fjordbryg – Etiketter','Print'],
 ['24135 Kronborg Living – Visualisering','3D render'],
 ['24141 Saltværk – Website','Web'],
];
const id={};
for(const [n,t] of [...jobs].reverse()){const k=await api('/tasks','POST',{name:n});await api('/tasks/'+k.id,'PATCH',{task_type_id:types[t]});id[n.slice(0,5)]=k.id;}
const E=[
 ['24117',YDAY,'08:02','10:31',8943,1],['24122',YDAY,'10:40','12:05',5122,1],['24130',YDAY,'12:35','14:50',8104,1],['24141',YDAY,'14:55','16:12',4620,1],['24117',YDAY,'16:15','17:02',2771,1],
 ['24117',TODAY,'07:48','09:12',5051,0],['24135',TODAY,'09:14','09:46',1927,0],
];
for(const [j,date,start_time,end_time,seconds,committed] of E) await api('/entries','POST',{task_id:id[j],date,start_time,end_time,seconds,committed});
await api('/notes','POST',{title:'Havnehuset – korrektur',content:'Kunden ønsker nyt forsidefoto. Tjek farveprofil før tryk.',color:'orange',pinned:1});
await api('/notes','POST',{title:'Fjordbryg etiketter',content:'Stansekontur fra trykkeriet kommer torsdag.',color:'green'});
await api('/notes','POST',{title:'Kronborg Living',content:'Render 3 vinkler i 4K – leveres fredag kl. 12.',color:'blue'});
console.log(JSON.stringify({id,types}));
