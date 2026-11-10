const counterparties=[
  {name:'Google',initial:'G',category:'Search · Location',value:1980,risk:'high',control:32,copy:'Reduce location history and ad-personalization access to improve your control score.'},
  {name:'Meta',initial:'M',category:'Social · Behavior',value:2420,risk:'high',control:27,copy:'Review off-platform activity and ad-personalization permissions.'},
  {name:'Amazon',initial:'A',category:'Purchases',value:1450,risk:'medium',control:58,copy:'Limit recommendation-history retention while preserving order services.'},
  {name:'Apple',initial:'A',category:'Device · Health',value:980,risk:'low',control:82,copy:'Review health-sharing permissions and connected applications.'},
  {name:'TikTok',initial:'T',category:'Video · Behavior',value:670,risk:'high',control:30,copy:'Restrict behavioral personalization and off-platform tracking.'},
  {name:'Spotify',initial:'S',category:'Listening activity',value:420,risk:'medium',control:64,copy:'Review personalization and partner-sharing permissions.'}
];
let selected=0;const reduced=new Set();
const $=id=>document.getElementById(id);
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)}
function renderList(){
  $('counterparties').innerHTML=counterparties.map((c,i)=>`<div class="counterparty ${i===selected?'selected':''}" data-i="${i}"><div class="company"><span class="company-badge">${c.initial}</span><strong>${c.name}</strong></div><small class="category">${c.category}</small><span>${money(reduced.has(i)?Math.round(c.value*.72):c.value)}</span><span class="risk ${reduced.has(i)?'low':c.risk}">${reduced.has(i)?'reduced':c.risk}</span></div>`).join('');
  document.querySelectorAll('.counterparty').forEach(el=>el.addEventListener('click',()=>{selected=Number(el.dataset.i);render()}));
}
function render(){
  const c=counterparties[selected];
  const reduction=[...reduced].reduce((sum,i)=>sum+Math.round(counterparties[i].value*.28),0);
  const total=8310-reduction;const score=Math.min(96,61+reduced.size*7);const high=Math.max(0,3-[...reduced].filter(i=>counterparties[i].risk==='high').length);
  $('modeledValue').textContent=money(total);$('heroValue').textContent=money(total);
  $('controlScore').textContent=score;$('heroControl').textContent=score;
  $('controlLabel').textContent=score>80?'Strong':score>67?'Improving':'Moderate';
  $('exposureLabel').textContent=high===0?'Low':high===1?'Moderate':'High';$('riskCount').textContent=`${high} high-risk relationship${high===1?'':'s'}`;$('heroRisk').textContent=high;
  $('consentCount').textContent=10-reduced.size;$('heroCount').textContent=10-reduced.size;
  $('valueDelta').textContent=reduction?`${money(reduction)} modeled exposure reduced`:'Baseline estimate';
  $('actionTitle').textContent=`Review ${c.name} permissions`;$('actionCopy').textContent=c.copy;
  $('reduceButton').disabled=reduced.has(selected);$('reduceButton').textContent=reduced.has(selected)?'Reduction modeled':'Model permission reduction';
  $('actionStatus').textContent=reduced.has(selected)?'Illustrative control action recorded.':'No production action will be taken.';
  renderList();
}
$('reduceButton').addEventListener('click',()=>{reduced.add(selected);render();toast(`${counterparties[selected].name} control scenario modeled`)});
$('exportStatement').addEventListener('click',()=>{
  const payload={product:'DataBearer',statement:'Synthetic prototype',modeledValue:$('modeledValue').textContent,controlScore:$('controlScore').textContent,reducedRelationships:[...reduced].map(i=>counterparties[i].name),disclaimer:'Illustrative synthetic information. Not a claim of realizable monetary value.'};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='databearer-statement.json';a.click();URL.revokeObjectURL(a.href);toast('Synthetic statement exported');
});
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
document.querySelectorAll('.workbench-nav button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.workbench-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');toast(`${btn.textContent} selected — prototype view`)}));
render();
