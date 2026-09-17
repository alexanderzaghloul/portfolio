const assert=require('node:assert/strict');const {defaults:d,calculate:c,sensitivity}=require('./model.js');
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name)}function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`)}
test('Hand-calculated default equity and funding',()=>{let r=c(d);near(r.equity,300);near(r.stock,120);near(r.cash,60);near(r.debt,120);near(r.ev,345);near(r.sourceCheck,0)});
test('Hand-calculated default net income and EPS',()=>{let r=c(d);near(r.recurringNI,133.65);near(r.totalShares,104.8);near(r.eps,133.65/104.8);near(r.yearOneEPS,128.65/104.8)});
test('All-stock funding issues shares without debt or cash',()=>{let r=c({...d,stockPct:100,cashPct:0});near(r.newShares,12);near(r.debt,0);near(r.cash,0)});
test('All-debt funding creates no dilution',()=>{let r=c({...d,stockPct:0,cashPct:0});near(r.newShares,0);near(r.debt,300)});
test('All-cash funding creates lost interest',()=>{let r=c({...d,stockPct:0,cashPct:100});near(r.debt,0);near(r.lostInterest,12)});
test('Synergies improve EPS',()=>assert.ok(c({...d,synergies:20}).eps>c({...d,synergies:0}).eps));
test('Fees change year one but not recurring EPS',()=>{near(c({...d,fees:100}).eps,c(d).eps);assert.ok(c({...d,fees:100}).yearOneEPS<c(d).yearOneEPS)});
test('Invalid funding rejected',()=>assert.throws(()=>c({...d,stockPct:90,cashPct:20})));
test('Nonfinite and zero denominators rejected',()=>{assert.throws(()=>c({...d,buyerPrice:0}));assert.throws(()=>c({...d,targetNI:NaN}));});
test('Negative target earnings supported',()=>assert.ok(c({...d,targetNI:-10}).eps<c(d).eps));
test('Break-even calculation produces zero accretion when positive',()=>{let a={...d,targetNI:1,realization:100};let r=c(a);near(c({...a,synergies:r.breakEven}).accretion,0)});
test('100 percent tax returns unavailable break-even',()=>assert.equal(c({...d,tax:100}).breakEven,null));
test('Sensitivity contains 25 recalculated cases',()=>{let s=sensitivity(d);assert.equal(s.length,5);assert.equal(s.flatMap(x=>x.cells).length,25);near(s[0].cells[0],c({...d,premium:0,synergies:0}).accretion)});
console.log(`${n} model checks passed`);
