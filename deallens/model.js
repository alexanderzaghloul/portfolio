/* DealLens: illustrative full-year acquisition model. USD millions except per-share data. */
(function(root){
'use strict';
const defaults={buyerNI:120,buyerShares:100,buyerPrice:25,targetNI:18,targetShares:20,targetPrice:12,targetDebt:60,targetCash:15,targetEBITDA:35,premium:25,stockPct:40,cashPct:20,interest:7,cashYield:4,tax:25,synergies:12,realization:75,amortization:4,fees:5};
function validate(a){
 for(const k of Object.keys(defaults)) if(typeof a[k]!=='number'||!Number.isFinite(a[k])) throw Error('Enter a finite number for '+k);
 for(const k of ['buyerShares','buyerPrice','targetShares','targetPrice','targetEBITDA','buyerNI']) if(a[k]<=0)throw Error(k+' must be greater than zero.');
 for(const k of ['targetDebt','targetCash','synergies','amortization','fees','interest','cashYield'])if(a[k]<0)throw Error(k+' cannot be negative.');
 for(const k of ['stockPct','cashPct','tax','realization'])if(a[k]<0||a[k]>100)throw Error(k+' must be between 0 and 100.');
 if(a.stockPct+a.cashPct>100)throw Error('Stock and existing-cash financing cannot exceed 100%.');
 if(a.premium<0)throw Error('This prototype requires a nonnegative premium.');
}
function calculate(a){
 validate(a);
 const equity=a.targetShares*a.targetPrice*(1+a.premium/100),ev=equity+a.targetDebt-a.targetCash;
 const stock=equity*a.stockPct/100,cash=equity*a.cashPct/100,debt=equity-stock-cash,newShares=stock/a.buyerPrice;
 const realizedSynergies=a.synergies*a.realization/100,interestExpense=debt*a.interest/100,lostInterest=cash*a.cashYield/100;
 const adjustments=(realizedSynergies-interestExpense-lostInterest-a.amortization)*(1-a.tax/100);
 const recurringNI=a.buyerNI+a.targetNI+adjustments,totalShares=a.buyerShares+newShares,standaloneEPS=a.buyerNI/a.buyerShares;
 const eps=recurringNI/totalShares,yearOneEPS=(recurringNI-a.fees)/totalShares;
 const needAfterTax=standaloneEPS*newShares-a.targetNI;
 const breakEven=a.tax===100?null:Math.max(0,needAfterTax/(1-a.tax/100)+interestExpense+lostInterest+a.amortization);
 const rows=[['Buyer net income',a.buyerNI],['Target net income',a.targetNI],['Realized synergies, after tax',realizedSynergies*(1-a.tax/100)],['New debt interest, after tax',-interestExpense*(1-a.tax/100)],['Lost cash interest, after tax',-lostInterest*(1-a.tax/100)],['Incremental amortization, after tax',-a.amortization*(1-a.tax/100)],['Recurring pro forma net income',recurringNI],['One-time fees, no tax benefit assumed',-a.fees],['Year-one pro forma net income',recurringNI-a.fees]];
 return {equity,ev,multiple:ev/a.targetEBITDA,stock,cash,debt,newShares,totalShares,realizedSynergies,interestExpense,lostInterest,recurringNI,standaloneEPS,eps,yearOneEPS,accretion:eps/standaloneEPS-1,yearOneAccretion:yearOneEPS/standaloneEPS-1,breakEven,sourceCheck:stock+cash+debt-equity,rows};
}
function sensitivity(a){return [0,10,20,30,40].map(premium=>({premium,cells:[0,5,10,15,20].map(synergies=>calculate({...a,premium,synergies}).accretion)}));}
const api={defaults,calculate,sensitivity};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DealLens=api;
})(typeof globalThis!=='undefined'?globalThis:this);
