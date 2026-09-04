import { LEVELS, WIDTH, HEIGHT } from './levels.js';
export const STEP = 1 / 60;
export const MAX_ECHOES = 3;
export const PLAYER_RADIUS = 11;
export const SPEED = 176;
export const DASH_SPEED = 455;
export const DASH_DURATION = .22;
export const DASH_COOLDOWN = 1.5;
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function intersectsCircle(rect,x,y,r=PLAYER_RADIUS) {
  const cx=clamp(x,rect.x,rect.x+rect.w),cy=clamp(y,rect.y,rect.y+rect.h);
  return (x-cx)**2+(y-cy)**2 < r*r;
}
export function pointOnPath(frames,time) {
  if(!frames.length)return null;
  if(time<=frames[0].t)return frames[0];
  if(time>=frames.at(-1).t)return frames.at(-1);
  let lo=0,hi=frames.length-1;
  while(lo+1<hi){const m=(lo+hi)>>1;if(frames[m].t<=time)lo=m;else hi=m;}
  const a=frames[lo],b=frames[hi],f=(time-a.t)/(b.t-a.t);
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,t:time};
}
export function dronePosition(drone,time) {
  // A mirrored path makes every patrol deterministic in both directions.
  const points=[...drone.points,...drone.points.slice(1,-1).reverse(),drone.points[0]];
  const lengths=points.slice(1).map((b,i)=>dist(points[i],b));
  const total=lengths.reduce((a,b)=>a+b,0);
  if(!total)return {...points[0],angle:0};
  let d=((time+drone.phase)*drone.speed)%total;
  for(let i=0;i<lengths.length;i++){
    if(d<=lengths[i]){const a=points[i],b=points[i+1],f=lengths[i]?d/lengths[i]:0;return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
    d-=lengths[i];
  }
  return {...points[0],angle:0};
}
export function laserActive(laser,time) { return (time+laser.phase)%laser.period < laser.on; }
export function segmentDistance(p,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
  const t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export class GameEngine {
  constructor(index=0) { this.events=[]; this.setLevel(index); }
  setLevel(index) {
    if(!Number.isInteger(index)||!LEVELS[index])throw new RangeError('Unknown sector');
    this.index=index;this.level=LEVELS[index];this.status='ready';this.echoes=[];this.collected=new Set();
    this.totalTime=0;this.loops=0;this.hits=0;this.serial=0;this.events=[];this.result=null;
    this.resetLoop();
  }
  resetLoop() {
    this.player={...this.level.spawn,angle:0};this.time=0;this.dashLeft=0;this.cooldown=0;this.lastDir={x:1,y:0};
    this.recording=[{...this.player,t:0}];this.activePlates=new Set();this.openGates=new Set();
    this.refreshSwitches();
  }
  emit(type,data={}) { this.events.push({type,...data}); }
  drainEvents() { const e=this.events;this.events=[];return e; }
  start() { if(this.status==='ready'){this.status='playing';this.emit('start');} }
  pause() { if(this.status==='playing'){this.status='paused';this.emit('pause');} }
  resume() { if(this.status==='paused')this.status='playing'; }
  retry() { if(this.status==='caught'){this.resetLoop();this.status='playing';this.emit('retry');} }
  rewind() {
    if(this.status!=='playing'||this.time<.15)return false;
    this.echoes.push({id:++this.serial,frames:this.recording.map(f=>({...f})),duration:this.time});
    if(this.echoes.length>MAX_ECHOES)this.echoes.shift();
    this.loops++;this.resetLoop();this.emit('rewind');return true;
  }
  echoPositions() { return this.echoes.map(e=>({...pointOnPath(e.frames,this.time),id:e.id,holding:this.time>=e.duration})); }
  refreshSwitches() {
    const entities=[this.player,...this.echoPositions()];
    const previous=this.activePlates;
    this.activePlates=new Set(this.level.plates.filter(p=>entities.some(e=>dist(e,p)<25)).map(p=>p.id));
    const previouslyOpen=this.openGates;
    this.openGates=new Set(this.level.gates.filter(g=>g.needs.every(id=>this.activePlates.has(id))||(previouslyOpen?.has(g.id)&&intersectsCircle(g,this.player.x,this.player.y))).map(g=>g.id));
    if(previous && [...this.activePlates].some(id=>!previous.has(id)))this.emit('switch');
  }
  solids() { return [...this.level.walls,...this.level.gates.filter(g=>!this.openGates.has(g.id))]; }
  isBlocked(x,y) { return this.solids().some(r=>intersectsCircle(r,x,y)); }
  move(dx,dy) {
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/5));
    for(let n=0;n<steps;n++){
      const x=this.player.x+dx/steps;
      if(!this.isBlocked(x,this.player.y))this.player.x=clamp(x,PLAYER_RADIUS,WIDTH-PLAYER_RADIUS);
      const y=this.player.y+dy/steps;
      if(!this.isBlocked(this.player.x,y))this.player.y=clamp(y,PLAYER_RADIUS,HEIGHT-PLAYER_RADIUS);
    }
  }
  dash() {
    if(this.status!=='playing'||this.cooldown>0)return false;
    this.dashLeft=DASH_DURATION;this.cooldown=DASH_COOLDOWN;this.emit('dash');return true;
  }
  capture() {
    this.hits++;this.status='caught';this.dashLeft=0;this.emit('caught');
  }
  update(dt,input={x:0,y:0}) {
    if(this.status!=='playing')return;
    if(!Number.isFinite(dt)||dt<=0)return;
    // Smaller collision substeps and a bounded simulation delta prevent tunneling.
    dt=Math.min(dt,.05);
    this.time+=dt;this.totalTime+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    this.refreshSwitches();
    let x=Number.isFinite(input.x)?input.x:0,y=Number.isFinite(input.y)?input.y:0;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    if(length>.05){const normalizedLength=Math.hypot(x,y);this.lastDir={x:x/normalizedLength,y:y/normalizedLength};this.player.angle=Math.atan2(y,x);}
    const dashing=this.dashLeft>0;
    if(dashing){x=this.lastDir.x;y=this.lastDir.y;}
    this.move(x*(dashing?DASH_SPEED:SPEED)*dt,y*(dashing?DASH_SPEED:SPEED)*dt);
    this.dashLeft=Math.max(0,this.dashLeft-dt);
    this.refreshSwitches();
    this.recording.push({x:this.player.x,y:this.player.y,t:this.time});
    this.level.shards.forEach((s,i)=>{if(!this.collected.has(i)&&dist(s,this.player)<24){this.collected.add(i);this.emit('collect',{x:s.x,y:s.y});}});
    if(!dashing){
      const hitDrone=this.level.drones.some(d=>dist(dronePosition(d,this.time),this.player)<PLAYER_RADIUS+18);
      const hitLaser=this.level.lasers.some(l=>laserActive(l,this.time)&&segmentDistance(this.player,l.a,l.b)<PLAYER_RADIUS+4);
      if(hitDrone||hitLaser){this.capture();return;}
    }
    if(this.collected.size===this.level.shards.length&&dist(this.player,this.level.exit)<26){
      this.status='won';
      const score=Math.max(100,Math.round(3000-this.totalTime*8-this.loops*85-this.hits*180));
      const stars=this.hits===0&&this.totalTime<=this.level.par?3:this.hits<=2?2:1;
      this.result={score,stars,time:this.totalTime,loops:this.loops,hits:this.hits};
      this.emit('win',{...this.result});return;
    }
    if(this.time>=this.level.time)this.rewind();
  }
}
