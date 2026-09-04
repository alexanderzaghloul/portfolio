// Time-expanded A* plans actual routes against switches, moving patrols, and lasers.
// This is a test helper; no solver or skip-level code ships in the browser.
import { TILE, WIDTH, HEIGHT } from '../dist/levels.js';
import { SPEED, PLAYER_RADIUS, intersectsCircle, pointOnPath, dronePosition, laserActive, segmentDistance } from '../dist/engine.js';
const DT=TILE/SPEED;
class Heap{
  constructor(){this.a=[];}
  push(n){let i=this.a.length;this.a.push(n);while(i>0){const p=(i-1)>>1;if(this.a[p].f<=n.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=n;}
  pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(true){let c=i*2+1;if(c>=this.a.length)break;if(c+1<this.a.length&&this.a[c+1].f<this.a[c].f)c++;if(this.a[c].f>=last.f)break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return first;}
  get size(){return this.a.length;}
}
const center=(x,y)=>({x:(x+.5)*TILE,y:(y+.5)*TILE});
export function plan(engine,goal){
  const level=engine.level,startX=Math.floor(engine.player.x/TILE),startY=Math.floor(engine.player.y/TILE),goalX=Math.floor(goal.x/TILE),goalY=Math.floor(goal.y/TILE),startTime=engine.time;
  const maxK=Math.floor((level.time-startTime-.08)/DT),queue=new Heap(),seen=new Set();
  const heuristic=(x,y)=>Math.abs(x-goalX)+Math.abs(y-goalY);
  queue.push({x:startX,y:startY,k:0,f:heuristic(startX,startY),parent:null});
  function safe(x,y,time){
    const p={x,y};if(level.walls.some(w=>intersectsCircle(w,x,y,PLAYER_RADIUS+1)))return false;
    const entities=[p,...engine.echoes.map(e=>pointOnPath(e.frames,time))];
    const active=new Set(level.plates.filter(s=>entities.some(e=>Math.hypot(s.x-e.x,s.y-e.y)<25)).map(s=>s.id));
    if(level.gates.some(g=>!g.needs.every(id=>active.has(id))&&intersectsCircle(g,x,y,PLAYER_RADIUS+1)))return false;
    if(level.drones.some(d=>{const q=dronePosition(d,time);return Math.hypot(q.x-x,q.y-y)<PLAYER_RADIUS+20;}))return false;
    if(level.lasers.some(l=>laserActive(l,time)&&segmentDistance(p,l.a,l.b)<PLAYER_RADIUS+6))return false;
    return true;
  }
  let expanded=0;
  while(queue.size){
    const n=queue.pop(),key=`${n.x},${n.y},${n.k}`;if(seen.has(key))continue;seen.add(key);expanded++;
    if(n.x===goalX&&n.y===goalY){const path=[];for(let p=n;p.parent;p=p.parent)path.push(center(p.x,p.y));return path.reverse();}
    if(n.k>=maxK)continue;
    for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1],[0,0]]){
      const x=n.x+dx,y=n.y+dy;if(x<1||x>=WIDTH/TILE-1||y<1||y>=HEIGHT/TILE-1)continue;
      const nextKey=`${x},${y},${n.k+1}`;if(seen.has(nextKey))continue;
      const a=center(n.x,n.y);let clear=true;
      for(let s=1;s<=15;s++){const f=s/15;if(!safe(a.x+dx*TILE*f,a.y+dy*TILE*f,startTime+(n.k+f)*DT)){clear=false;break;}}
      if(clear)queue.push({x,y,k:n.k+1,f:n.k+1+heuristic(x,y),parent:n});
    }
  }
  throw new Error(`No timed path in ${level.id} from ${startX},${startY} to ${goalX},${goalY} at ${startTime.toFixed(2)}s (${expanded} states)`);
}
export function follow(engine,path){
  for(const target of path){
    const start={...engine.player},dx=target.x-start.x,dy=target.y-start.y,length=Math.hypot(dx,dy),duration=length<.1?DT:length/SPEED;
    let remaining=duration;
    while(remaining>1e-8&&engine.status==='playing'){
      const dt=Math.min(1/60,remaining);engine.update(dt,{x:length<.1?0:dx/length,y:length<.1?0:dy/length});remaining-=dt;
    }
    if(engine.status==='won')return;
    if(engine.status!=='playing')throw new Error(`Simulation ${engine.status} in ${engine.level.id} at ${engine.time.toFixed(2)}s`);
    if(Math.hypot(engine.player.x-target.x,engine.player.y-target.y)>.1)throw new Error('Path hit a closed wall or gate');
  }
}
export function solve(engine){
  engine.start();
  for(const plate of engine.level.plates){follow(engine,plan(engine,plate));if(!engine.activePlates.has(plate.id))throw new Error('Switch did not activate');engine.rewind();}
  // Nearest reachable shard ordering avoids unnecessary long routes in the final loop.
  while(engine.collected.size<engine.level.shards.length){
    const candidates=engine.level.shards.map((p,i)=>({p,i})).filter(({i})=>!engine.collected.has(i));
    const routes=[];for(const c of candidates){try{routes.push({...c,path:plan(engine,c.p)});}catch{}}
    routes.sort((a,b)=>a.path.length-b.path.length);
    if(!routes.length)throw new Error(`No reachable shard in ${engine.level.id}`);
    follow(engine,routes[0].path);
  }
  follow(engine,plan(engine,engine.level.exit));
  if(engine.status!=='won')throw new Error('No extraction');return engine.result;
}
