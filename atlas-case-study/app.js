const data=[
{id:"AP-1048",region:"us",control:"Invoice-to-payment match",age:12,owner:"J. Chen",status:"Open"},
{id:"AR-2191",region:"ca",control:"Missing remittance",age:19,owner:"M. Singh",status:"Open"},
{id:"CL-8814",region:"us",control:"Source-date gap",age:8,owner:"R. Diaz",status:"Review"},
{id:"AP-1062",region:"ca",control:"Duplicate reference",age:3,owner:"A. Brooks",status:"Resolved"},
{id:"AR-2240",region:"us",control:"Unmapped client",age:27,owner:"S. Patel",status:"Open"},
{id:"CL-8841",region:"ca",control:"Status conflict",age:6,owner:"J. Chen",status:"Review"},
{id:"AP-1093",region:"us",control:"Provider-date outlier",age:2,owner:"M. Singh",status:"Resolved"},
{id:"AR-2267",region:"ca",control:"Collection lag",age:14,owner:"R. Diaz",status:"Open"}];
const baseline=data.map(x=>({...x}));
let rows=data.map(x=>({...x}));
const region=document.querySelector("#region"),body=document.querySelector("#rows"),metrics=document.querySelector("#metrics");
function current(){return region.value==="all"?rows:rows.filter(r=>r.region===region.value)}
function render(){const d=current(),open=d.filter(x=>x.status!=="Resolved"),avg=Math.round(d.reduce((a,b)=>a+b.age,0)/Math.max(d.length,1)),coverage=Math.round(d.filter(x=>x.owner).length/Math.max(d.length,1)*100);metrics.innerHTML=[["Records in view",d.length,"synthetic queue"],["Open exceptions",open.length,open.length?"actionable":"clear"],["Average age",avg+" days","priority lens"],["Owner coverage",coverage+"%","assigned"]].map(x=>'<div class="metric"><small>'+x[0]+'</small><b>'+x[1]+'</b><span>'+x[2]+'</span></div>').join("");body.innerHTML=d.map(r=>'<tr><td><b>'+r.id+'</b></td><td>'+r.region.toUpperCase()+'</td><td>'+r.control+'</td><td>'+r.age+'d</td><td>'+r.owner+'</td><td><span class="pill '+(r.status==="Resolved"?"resolved":"open")+'">'+r.status+'</span></td></tr>').join("");document.querySelector("#queue-count").textContent=open.length+" require review";document.querySelector("#badge").textContent=open.length;draw(d);rings(coverage,Math.max(42,100-open.length*9),Math.max(50,100-avg*2))}
function draw(d){const svg=document.querySelector("#chart"),vals=[13,18,14,22,19,27,21,Math.max(8,Math.round(d.reduce((a,b)=>a+b.age,0)/Math.max(d.length,1)))],w=700,h=230,step=w/(vals.length-1),path=vals.map((v,i)=>(i?"L":"M")+" "+i*step+" "+(h-v*6)).join(" ");svg.innerHTML='<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9274ff" stop-opacity=".35"/><stop offset="1" stop-color="#9274ff" stop-opacity="0"/></linearGradient></defs><g stroke="rgba(255,255,255,.07)"><path d="M0 40H700M0 95H700M0 150H700M0 205H700"/></g><path d="'+path+' L700 230 L0 230Z" fill="url(#fill)"/><path d="'+path+'" fill="none" stroke="#9274ff" stroke-width="4"/>'}
function rings(a,b,c){document.querySelector("#rings").innerHTML=[["Owner coverage",a],["Control pass",b],["Age health",c]].map(x=>'<div class="ring-row"><div class="ring" style="--p:'+x[1]+'%"><b>'+x[1]+'%</b></div><span>'+x[0]+'</span></div>').join("")}
function toast(t){const e=document.querySelector("#toast");e.textContent=t;e.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>e.classList.remove("show"),2200)}
region.addEventListener("change",render);
document.querySelector("#reconcile").addEventListener("click",()=>{rows=rows.map((r,i)=>i%3===0?{...r,status:"Resolved",age:Math.max(1,r.age-5)}:r);render();toast("12 synthetic controls evaluated; queue updated.")});
document.querySelector("#reset").addEventListener("click",()=>{rows=baseline.map(x=>({...x}));region.value="all";render();toast("Synthetic queue reset.")});
document.querySelector("#export").addEventListener("click",()=>{const csv=["record,region,control,age_days,owner,status",...current().map(r=>[r.id,r.region,'"'+r.control+'"',r.age,r.owner,r.status].join(","))].join("\n");const b=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="atlas-synthetic-exception-queue.csv";a.click();URL.revokeObjectURL(a.href);toast("Synthetic queue exported.")});
render();
