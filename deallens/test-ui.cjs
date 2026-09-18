// Headless controller checks. These do not replace visual browser testing.
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const nodes=new Map();
class Element{
 constructor(){this.value='';this.hidden=false;this.disabled=false;this.innerHTML='';this.textContent='';}
 set value(v){this._value=String(v)} get value(){return this._value}
 set id(v){this._id=v;nodes.set(v,this)} get id(){return this._id}
 append(){} addEventListener(){} click(){this.clicked=true}
}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const [,id]of html.matchAll(/id="([^"]+)"/g)){const e=new Element();e.id=id;}
const article=new Element();const downloads=[];
const context={DealLens:require('./model.js'),document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(),querySelector:s=>s==='article'?article:null},Blob,URL:{createObjectURL:b=>(downloads.push(b),'blob:test'),revokeObjectURL(){}},setTimeout:fn=>fn(),console};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),context);
const get=id=>nodes.get(id);
(async()=>{
 assert.match(get('metrics').innerHTML,/345.00/);
 assert.match(get('fundingChart').innerHTML,/40.0%/);
 assert.match(get('epsChart').innerHTML,/Standalone buyer/);
 assert.match(get('snapshot').innerHTML,/0.00 percentage points/);
 get('stockPct').value='90';get('cashPct').value='30';vm.runInContext('refresh()',context);
 assert.equal(article.hidden,true);assert.equal(get('memo').disabled,true);
 get('reset').onclick();assert.equal(article.hidden,false);
 get('downside').onclick();assert.equal(Number(get('realization').value),35);
 get('reset').onclick();get('save').onclick();
 const json=await downloads.at(-1).text();assert.equal(JSON.parse(json).assumptions.premium,25);
 await get('load').onchange({target:{files:[{size:json.length,text:async()=>json}],value:'x'}});
 assert.equal(get('error').hidden,true);
 get('csv').onclick();assert.match(await downloads.at(-1).text(),/133.650000/);
 get('memo').onclick();assert.match(await downloads.at(-1).text(),/345.00/);
 get('loadButton').onclick();assert.equal(get('load').clicked,true);
 console.log('PASS controller: initial outputs, charts, validation, stress/reset, JSON round trip, CSV and memo exports, load button');
})().catch(e=>{console.error(e);process.exit(1)});
