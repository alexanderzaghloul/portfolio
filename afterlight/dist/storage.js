import { LEVELS } from './levels.js';
export const SAVE_KEY='afterlight-v1';
export function sanitizeSave(value){
  const clean={version:1,unlocked:0,selected:0,sound:false,results:{}};
  if(!value||value.version!==1)return clean;
  clean.sound=value.sound===true;
  for(const level of LEVELS){
    const r=value.results?.[level.id];
    if(r&&['score','stars','time','loops','hits'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0)&&r.score<=3000&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3){clean.results[level.id]={score:r.score,stars:r.stars,time:r.time,loops:r.loops,hits:r.hits};}
  }
  // Reconstruct unlocks from contiguous completed sectors, never from an unchecked index.
  while(clean.unlocked<LEVELS.length-1&&clean.results[LEVELS[clean.unlocked].id])clean.unlocked++;
  if(Number.isInteger(value.selected))clean.selected=Math.max(0,Math.min(clean.unlocked,value.selected));
  return clean;
}
export function loadSave(storage){try{return sanitizeSave(JSON.parse(storage.getItem(SAVE_KEY)));}catch{return sanitizeSave(null);}}
export function writeSave(storage,value){try{storage.setItem(SAVE_KEY,JSON.stringify(value));return true;}catch{return false;}}
