const C=window.PROJECT;
document.documentElement.style.setProperty("--accent",C.accent);
document.title=C.name+" — Alexander Zaghloul";
document.querySelector("#mark").textContent=C.mark;
document.querySelector("#name").textContent=C.name;
document.querySelector("#type").textContent=C.type;
document.querySelector("#headline").textContent=C.headline;
document.querySelector("#summary").textContent=C.summary;
document.querySelector("#workspace-name").textContent=C.workspace;
const values=[...C.metrics];
const metricRoot=document.querySelector("#metrics");
const tableRoot=document.querySelector("#rows");
const labels=document.querySelectorAll(".range-value");
const sliders=[...document.querySelectorAll("input[type=range]")];
function fmt(n,m){if(m.format==="money")return "$"+Math.round(n).toLocaleString();if(m.format==="percent")return Math.round(n)+"%";if(m.format==="score")return Math.round(n)+"/100";return Math.round(n).toLocaleString()}
function update(){
  const intensity=Number(sliders[0].value)/100,control=Number(sliders[1].value)/100;
  labels[0].textContent=Math.round(intensity*100)+"%";labels[1].textContent=Math.round(control*100)+"%";
  metricRoot.innerHTML=values.map((m,i)=>{const mult=i%2===0?(0.72+intensity*.5):(0.72+control*.45);const n=m.base*mult;return '<div class="metric"><span>'+m.label+'</span><strong>'+fmt(n,m)+'</strong><small>'+m.trend+'</small></div>'}).join("");
  tableRoot.innerHTML=C.rows.map((r,i)=>{const score=Math.min(99,Math.round(r.score*(.72+control*.4)+(i%2?intensity*5:0)));const state=score>76?"Controlled":score>55?"Review":"Attention";return '<tr><td><b>'+r.name+'</b></td><td>'+r.category+'</td><td>'+score+'/100</td><td><span class="state"><i></i>'+state+'</span></td><td>'+r.action+'</td></tr>'}).join("");
  draw(intensity,control);
  document.querySelector("#scenario-note").textContent=C.note.replace("{intensity}",Math.round(intensity*100)).replace("{control}",Math.round(control*100));
}
function draw(a,b){const pts=C.series.map((v,i)=>Math.max(7,Math.min(94,v*(.75+a*.3)+(b*8*Math.sin(i*.8)))));const w=600,h=220,step=w/(pts.length-1);const path=pts.map((v,i)=>(i?"L":"M")+" "+(i*step).toFixed(1)+" "+(h-v*2).toFixed(1)).join(" ");document.querySelector("#line").setAttribute("d",path);document.querySelector("#area").setAttribute("d",path+" L "+w+" "+h+" L 0 "+h+" Z")}
sliders.forEach(s=>s.addEventListener("input",update));update();
function toast(t){const el=document.querySelector("#toast");el.textContent=t;el.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>el.classList.remove("show"),2200)}
document.querySelector("#run").addEventListener("click",()=>{sliders[0].value=Math.max(20,Math.min(95,Number(sliders[0].value)+(Math.random()>.5?8:-6)));update();toast("Scenario recalculated with synthetic inputs.")});
document.querySelector("#reset").addEventListener("click",()=>{sliders[0].value=C.defaults[0];sliders[1].value=C.defaults[1];update();toast("Prototype reset.")});
document.querySelector("#export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({project:C.name,synthetic:true,scenario:{intensity:sliders[0].value,control:sliders[1].value},generated:new Date().toISOString()},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=C.slug+"-synthetic-snapshot.json";a.click();URL.revokeObjectURL(a.href);toast("Synthetic snapshot exported.")});
