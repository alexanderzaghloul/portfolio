'use strict';
/* Canada provider payment engine. All time differences use UTC calendar dates. */
const KPI = (() => {
 const DAY=86400000, required=['Unit','Voucher','AcctgDate','PaymentDate','PaymentSelectionStatus','BaseGrossAmount','Descr'];
 function csv(text){
  text=text.replace(/^\uFEFF/,'');let out=[],row=[],value='',quote=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){value+='"';i++;}else if(quote){quote=false;}else if(value===''){quote=true;}else throw Error('Unexpected quote in CSV record '+(out.length+1));}
   else if(c===','&&!quote){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))out.push(row);row=[];value='';}else value+=c;
  }if(quote)throw Error('Unclosed quote in CSV. Please use the original PeopleSoft export.');if(value||row.length){row.push(value);if(row.some(x=>x.trim()))out.push(row);}return out;
 }
 function day(value){value=String(value||'').trim();if(!value)return null;let m=value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/),y,mo,d;if(m){y=+m[3];mo=+m[1];d=+m[2];}else{m=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)throw Error('Unrecognized date');y=+m[1];mo=+m[2];d=+m[3];}const t=Date.UTC(y,mo-1,d),dt=new Date(t);if(dt.getUTCFullYear()!==y||dt.getUTCMonth()+1!==mo||dt.getUTCDate()!==d)throw Error('Invalid calendar date');return t/DAY;}
 function cents(value){const s=String(value??'').trim().replace(/,/g,'');if(!/^[+-]?\d+(\.\d{1,2})?$/.test(s))throw Error('Invalid CAD base amount');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n))throw Error('Amount exceeds supported precision');return n;}
 function ingest(text,asOf,name,id){const a=day(asOf);if(a===null)throw Error('Choose an as-of date.');const table=csv(text);if(!table.length)throw Error('The file is empty.');const headers=table.shift().map(x=>x.trim());if(new Set(headers).size!==headers.length)throw Error('Duplicate column headers.');const missing=required.filter(x=>!headers.includes(x));if(missing.length)throw Error('Missing columns: '+missing.join(', '));const cols=Object.fromEntries(headers.map((h,i)=>[h,i]));const rows=[],seen=new Set(),counts={raw:0,other:0,canceled:0,closed:0,duplicates:0};
  for(let i=0;i<table.length;i++){const cells=table[i];counts.raw++;if(cells.length!==headers.length)throw Error('Column count mismatch at source record '+(i+2));const get=k=>(cells[cols[k]]||'').trim();if(get('Unit')!=='CA01'){counts.other++;continue;}const status=get('PaymentSelectionStatus');if(status==='Canceled'||status==='Closed'){counts[status.toLowerCase()]++;continue;}const signature=JSON.stringify(cells);if(seen.has(signature))counts.duplicates++;else seen.add(signature);let amount;try{amount=cents(get('BaseGrossAmount'));}catch(e){throw Error(e.message+' at source record '+(i+2));}let start=null,end=null,reasons=[];for(const [field,set] of [['AcctgDate',v=>start=v],['PaymentDate',v=>end=v]]){try{set(day(get(field)));}catch(e){reasons.push(field+': '+e.message);}}
   if(start===null)reasons.push('Missing PS entry date');if(start!==null&&start>a)reasons.push('PS entry after as-of');if(end!==null&&end>a)reasons.push('Payment after as-of');if(status==='Paid'&&end===null)reasons.push('Paid without payment date');if(status!=='Paid'&&end!==null)reasons.push('Payment date on non-paid status');const paid=status==='Paid'&&end!==null;const days=start===null?null:(paid?end:a)-start;if(days!==null&&days<0)reasons.push('Negative duration');
   rows.push({row:i+2,month:start===null?'Date review':new Date(start*DAY).toISOString().slice(0,7),program:get('Descr')||'(Blank program)',days,paid:paid&&!reasons.length,review:reasons.length>0,cents:amount,status,reason:reasons.join('; ')});
  }if(!rows.length)throw Error('No active CA01 records remain after exclusions.');return {name,id,asOf,rows,counts,loadedAt:new Date().toISOString()};
 }
 function type(r,target){return r.review?'review':r.status!=='Paid'?(r.days>target?'unpaid':'pending'):(r.days>target?'late':'within');}
 function stats(rows,target){let s={n:rows.length,paid:0,sum:0,yes:0,no:0,review:0,unpaid:0,overdue:0,cents:0,outsideCents:0,overdueCents:0},durations=[];for(const r of rows){s.cents+=r.cents;if(r.review)s.review++;else if(r.days<=target)s.yes++;else{s.no++;s.outsideCents+=r.cents;}if(r.status!=='Paid'){s.unpaid++;if(!r.review&&r.days>target){s.overdue++;s.overdueCents+=r.cents;}}if(r.paid){s.paid++;s.sum+=r.days;durations.push(r.days);}}
  durations.sort((a,b)=>a-b);s.mean=s.paid?s.sum/s.paid:null;s.median=s.paid?(durations[Math.floor((s.paid-1)/2)]+durations[Math.floor(s.paid/2)])/2:null;s.p90=s.paid?durations[Math.ceil(s.paid*.9)-1]:null;s.rate=s.yes+s.no?s.yes/(s.yes+s.no):null;return s;
 }
 function monthly(rows,t){return [...new Set(rows.map(r=>r.month))].sort().map(month=>({month,...stats(rows.filter(r=>r.month===month),t)}));}
 return {csv,day,cents,ingest,type,stats,monthly};
})();
if(typeof module!=='undefined')module.exports=KPI;
