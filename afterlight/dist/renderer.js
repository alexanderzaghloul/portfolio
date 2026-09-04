import { WIDTH, HEIGHT, TILE } from './levels.js';
import { dronePosition, laserActive, DASH_COOLDOWN } from './engine.js';
const C={floor:'#101d15',line:'#263b2b',wall:'#273c2c',edge:'#4c6748',amber:'#f2bd74',mint:'#88d9b3',red:'#fa817a',white:'#edf3dc'};
const TAU=Math.PI*2;
export class Renderer {
  constructor(canvas,engine){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.engine=engine;this.fx=[];this.flash=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.last=0;this.wallClock=0;this.ratio=1;this.levelIndex=-1;this.background=document.createElement('canvas');this.background.width=WIDTH;this.background.height=HEIGHT;this.resize();}
  resize(){const ratio=Math.min(2,window.devicePixelRatio||1);if(this.ratio!==ratio||this.canvas.width!==WIDTH*ratio){this.ratio=ratio;this.canvas.width=WIDTH*ratio;this.canvas.height=HEIGHT*ratio;this.ctx.setTransform(ratio,0,0,ratio,0,0);}}
  glow(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
  diamond(ctx,x,y,r,fill,stroke){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  text(ctx,t,x,y,size=12,color='#82977b',align='center'){ctx.font=`${size}px "Courier New",monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(t,x,y);}
  prepareBackground(){
    const c=this.background.getContext('2d'),l=this.engine.level;
    c.fillStyle=C.floor;c.fillRect(0,0,WIDTH,HEIGHT);
    const ambience=c.createRadialGradient(WIDTH*.57,HEIGHT*.48,30,WIDTH*.5,HEIGHT*.5,650);ambience.addColorStop(0,'#1d342233');ambience.addColorStop(1,'#060e0966');c.fillStyle=ambience;c.fillRect(0,0,WIDTH,HEIGHT);
    for(let row=1;row<15;row++)for(let col=1;col<23;col++){
      const t=(row*19+col*31)%11;
      c.fillStyle=t<3?'#17291c':'#13231a';c.globalAlpha=.45;c.fillRect(col*TILE+2,row*TILE+2,TILE-4,TILE-4);c.globalAlpha=1;
      c.fillStyle='#38503655';c.fillRect(col*TILE-1,row*TILE-1,2,2);
    }
    c.strokeStyle='#51674a25';c.lineWidth=1;
    for(let x=80;x<WIDTH-40;x+=160){c.beginPath();c.moveTo(x,40);c.lineTo(x,HEIGHT-40);c.stroke();}
    for(let y=80;y<HEIGHT-40;y+=160){c.beginPath();c.moveTo(40,y);c.lineTo(WIDTH-40,y);c.stroke();}
    // Circuit lines visualize which pressure switch operates each gate.
    for(const g of l.gates)for(const id of g.needs){
      const p=l.plates.find(p=>p.id===id);if(!p)continue;
      c.strokeStyle='#83986826';c.lineWidth=2;c.setLineDash([3,8]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,g.y+g.h/2);c.lineTo(g.x+g.w/2,g.y+g.h/2);c.stroke();c.setLineDash([]);
    }
    l.walls.forEach(w=>this.wall(c,w));
    for(let i=2;i<=22;i+=2)this.text(c,String(i).padStart(2,'0'),i*TILE+20,20,9,'#71826b');
    for(let i=2;i<15;i+=2)this.text(c,String(i).padStart(2,'0'),20,i*TILE+20,9,'#71826b');
    this.text(c,'HELIX / '+String(this.engine.index+1).padStart(2,'0'),WIDTH-75,HEIGHT-20,9,'#71826b');
    this.text(c,'RESTRICTED AREA',150,HEIGHT-20,9,'#71826b');
    this.levelIndex=this.engine.index;
  }
  wall(c,w){
    c.fillStyle='#040b0666';c.fillRect(w.x+5,w.y+7,w.w,w.h);
    c.fillStyle='#1e3021';c.fillRect(w.x,w.y,w.w,w.h);
    c.fillStyle=C.wall;c.fillRect(w.x+2,w.y+2,w.w-4,Math.max(0,w.h-7));
    c.strokeStyle='#496143';c.lineWidth=1;c.strokeRect(w.x+2.5,w.y+2.5,w.w-5,w.h-7);
    c.strokeStyle='#637851';c.globalAlpha=.6;c.beginPath();c.moveTo(w.x+5,w.y+4);c.lineTo(w.x+w.w-5,w.y+4);c.stroke();c.globalAlpha=1;
    c.fillStyle='#0b170c55';
    if(w.w>w.h){for(let x=w.x+17;x<w.x+w.w-10;x+=40)c.fillRect(x,w.y+14,10,3);}else{for(let y=w.y+17;y<w.y+w.h-10;y+=40)c.fillRect(w.x+14,y,3,10);}
  }
  event(event){
    if(event.type==='rewind')this.flash=1;
    if(event.type==='collect'||event.type==='win'){
      const {x,y}=event.type==='win'?this.engine.player:event;
      const n=this.reduced?5:event.type==='win'?60:22;
      for(let i=0;i<n;i++){const a=i/n*TAU,sp=40+((i*37)%150);this.fx.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.8+(i%3)*.2,max:1.2,color:event.type==='win'?C.mint:C.amber});}
    }
  }
  draw(now){
    const dt=Math.min(.04,(now-this.last)/1000||0);this.last=now;this.wallClock=now/1000;
    this.resize();if(this.levelIndex!==this.engine.index)this.prepareBackground();
    const c=this.ctx,e=this.engine,l=e.level,t=e.status==='ready'?this.wallClock*.45:e.time;
    c.setTransform(this.ratio,0,0,this.ratio,0,0);c.drawImage(this.background,0,0);
    this.drawExtraction(c,l.exit,e.collected.size===l.shards.length,t);
    this.drawSpawn(c,l.spawn);
    l.gates.forEach(g=>this.drawGate(c,g,e.openGates.has(g.id),t));
    l.plates.forEach(p=>this.drawPlate(c,p,e.activePlates.has(p.id),t));
    l.shards.forEach((s,i)=>{if(!e.collected.has(i))this.drawShard(c,s,t+i*.7);});
    l.lasers.forEach(laser=>this.drawLaser(c,laser,t));
    l.drones.forEach(d=>this.drawDrone(c,d,t));
    this.drawEchoes(c,t);
    this.drawPlayer(c,e.player,t);
    for(let i=this.fx.length-1;i>=0;i--){const p=this.fx[i];p.life-=dt;if(p.life<=0){this.fx.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;c.globalAlpha=p.life/p.max;c.fillStyle=p.color;c.fillRect(p.x,p.y,3,3);}
    c.globalAlpha=1;
    if(this.flash>0){if(!this.reduced){c.fillStyle=`rgba(136,217,179,${this.flash*.18})`;c.fillRect(0,0,WIDTH,HEIGHT);c.strokeStyle=`rgba(136,217,179,${this.flash*.7})`;c.lineWidth=2;const rad=(1-this.flash)*1100;c.beginPath();c.arc(l.spawn.x,l.spawn.y,rad,0,TAU);c.stroke();}this.flash=Math.max(0,this.flash-dt*2.2);}
    if(e.status==='caught'){c.fillStyle='#fa817a13';c.fillRect(0,0,WIDTH,HEIGHT);}
  }
  drawSpawn(c,s){c.strokeStyle='#81997570';c.lineWidth=1;c.setLineDash([4,4]);c.strokeRect(s.x-24,s.y-24,48,48);c.setLineDash([]);this.text(c,'IN',s.x,s.y+36,10,'#8c9f7e');}
  drawExtraction(c,p,ready,t){
    this.glow(c,p.x,p.y,80,ready?'#88d9b32b':'#6b947916');
    c.save();c.translate(p.x,p.y);c.strokeStyle=ready?C.mint:'#658564';c.lineWidth=1.5;c.strokeRect(-27,-27,54,54);c.fillStyle=ready?'#88d9b316':'#1d38271a';c.fillRect(-25,-25,50,50);
    c.lineWidth=3;for(const [x,y,sx,sy]of[[-28,-28,1,1],[28,-28,-1,1],[-28,28,1,-1],[28,28,-1,-1]]){c.beginPath();c.moveTo(x,y+sy*10);c.lineTo(x,y);c.lineTo(x+sx*10,y);c.stroke();}
    this.text(c,'OUT',0,0,14,ready?C.mint:'#91aa86');
    if(ready&&!this.reduced){c.globalAlpha=.3+Math.sin(t*4)*.2;c.strokeRect(-34,-34,68,68);c.globalAlpha=1;}
    c.restore();this.text(c,ready?'EXTRACT':'LOCKED',p.x,p.y+41,9,ready?C.mint:'#73926f');
  }
  drawPlate(c,p,active,t){
    const color=active?C.mint:C.amber;
    this.glow(c,p.x,p.y,55,active?'#88d9b324':'#f2bd7413');
    c.fillStyle=active?'#294535':'#303423';c.strokeStyle=active?'#88d9b399':'#ad91536e';c.lineWidth=1;c.fillRect(p.x-24,p.y-24,48,48);c.strokeRect(p.x-24,p.y-24,48,48);
    c.beginPath();c.arc(p.x,p.y,18,0,TAU);c.stroke();c.lineWidth=2;c.strokeStyle=color;
    c.beginPath();c.arc(p.x,p.y,22,active?0:-Math.PI/2,active?TAU:Math.PI*.5);c.stroke();
    this.text(c,p.id,p.x,p.y,19,color);
    this.text(c,active?'LINKED':'HOLD',p.x,p.y+37,9,active?C.mint:'#c0a471');
  }
  drawGate(c,g,open,t){
    c.fillStyle=open?'#88d9b311':'#f2bd741a';c.fillRect(g.x,g.y,g.w,g.h);
    c.strokeStyle=open?'#88d9b354':'#e4ad65';c.lineWidth=2;
    if(open){c.setLineDash([3,9]);c.strokeRect(g.x+4,g.y+4,g.w-8,g.h-8);c.setLineDash([]);}
    else{
      c.strokeRect(g.x+3,g.y+3,g.w-6,g.h-6);c.lineWidth=3;c.shadowBlur=this.reduced?0:10;c.shadowColor='#f2bd7444';
      const vertical=g.h>g.w;
      for(let n=13;n<(vertical?g.h:g.w)-8;n+=15){c.beginPath();if(vertical){c.moveTo(g.x+7,g.y+n);c.lineTo(g.x+g.w-7,g.y+n+5);}else{c.moveTo(g.x+n,g.y+7);c.lineTo(g.x+n+5,g.y+g.h-7);}c.stroke();}c.shadowBlur=0;
    }
    c.fillStyle=open?'#254832':'#3d3b24';c.fillRect(g.x+g.w/2-13,g.y+g.h/2-11,26,22);
    this.text(c,open?'✓':g.needs.join(''),g.x+g.w/2,g.y+g.h/2,11,open?C.mint:C.amber);
  }
  drawShard(c,s,t){
    const pulse=this.reduced?1:1+Math.sin(t*3)*.1;
    this.glow(c,s.x,s.y,47,'#f2bd742b');c.save();c.translate(s.x,s.y);c.lineWidth=1;
    this.diamond(c,0,0,17*pulse,null,'#f2bd7444');this.diamond(c,0,0,10,C.amber,'#ffdfa7');
    c.fillStyle='#fff5d4';c.beginPath();c.moveTo(0,-8);c.lineTo(0,5);c.lineTo(-6,0);c.closePath();c.fill();c.restore();
  }
  drawLaser(c,l,t){
    const on=laserActive(l,t);c.strokeStyle=on?C.red:'#8e55574a';c.lineWidth=on?3:1;c.setLineDash(on?[]:[4,6]);
    if(on&&!this.reduced){c.shadowColor=C.red;c.shadowBlur=13;}
    c.beginPath();c.moveTo(l.a.x,l.a.y);c.lineTo(l.b.x,l.b.y);c.stroke();c.setLineDash([]);c.shadowBlur=0;
    for(const p of[l.a,l.b]){c.fillStyle=on?'#d58a7c':'#70524c';c.fillRect(p.x-5,p.y-5,10,10);c.fillStyle='#faddc7';c.fillRect(p.x-2,p.y-2,4,4);}
  }
  drawDrone(c,d,t){
    const p=dronePosition(d,t);
    c.strokeStyle='#e77b7924';c.lineWidth=1;c.setLineDash([2,7]);c.beginPath();d.points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();c.setLineDash([]);
    this.glow(c,p.x,p.y,45,'#fa817a21');c.strokeStyle='#fa817a65';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,21,0,TAU);c.stroke();
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);this.diamond(c,0,0,13,'#773e37',C.red);c.fillStyle='#ffd2bc';c.fillRect(-3,-3,6,6);c.strokeStyle=C.red;c.beginPath();c.moveTo(15,-5);c.lineTo(20,0);c.lineTo(15,5);c.stroke();c.restore();
  }
  drawEchoes(c,t){
    const e=this.engine;
    e.echoes.forEach((echo,index)=>{
      const path=echo.frames;c.globalAlpha=.2;c.strokeStyle=C.mint;c.lineWidth=1.5;c.setLineDash([2,6]);c.beginPath();
      for(let i=0;i<path.length;i+=8){const p=path[i];if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.stroke();c.setLineDash([]);c.globalAlpha=1;
    });
    e.echoPositions().forEach((p,index)=>{
      this.glow(c,p.x,p.y,36,'#88d9b316');c.lineWidth=1.5;
      this.diamond(c,p.x,p.y,14,'#88d9b326',C.mint);this.diamond(c,p.x,p.y,7,null,'#b3eacc');
      c.strokeStyle='#88d9b344';c.setLineDash([3,5]);c.beginPath();c.arc(p.x,p.y,22,0,TAU);c.stroke();c.setLineDash([]);
      this.text(c,'E'+(index+1),p.x,p.y-31,10,C.mint);
    });
  }
  drawPlayer(c,p,t){
    const e=this.engine;
    if(e.recording.length>1){c.strokeStyle=e.dashLeft>0?'#f2bd74aa':'#cbd6b448';c.lineWidth=e.dashLeft>0?6:2;c.beginPath();const history=e.recording.slice(-15);history.forEach((f,i)=>i?c.lineTo(f.x,f.y):c.moveTo(f.x,f.y));c.stroke();}
    this.glow(c,p.x,p.y,e.dashLeft>0?70:48,e.dashLeft>0?'#f2bd7455':'#e7efb821');
    c.strokeStyle=e.dashLeft>0?C.amber:'#dce6b849';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,19,0,TAU);c.stroke();
    if(e.cooldown>0){c.strokeStyle=C.amber;c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,20,-Math.PI/2,-Math.PI/2+TAU*(1-e.cooldown/DASH_COOLDOWN));c.stroke();}
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);this.diamond(c,0,0,13,C.white,'#fffde8');c.fillStyle='#4c6748';c.beginPath();c.moveTo(7,0);c.lineTo(-3,-4);c.lineTo(-3,4);c.closePath();c.fill();c.restore();
    if(e.status==='ready')this.text(c,'YOU',p.x,p.y-32,10,C.white);
  }
}
