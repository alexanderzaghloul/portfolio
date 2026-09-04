(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const ui = {
    score: document.getElementById('score'), highScore: document.getElementById('highScore'), combo: document.getElementById('combo'),
    health: document.getElementById('healthBar'), dash: document.getElementById('dashBar'), wave: document.getElementById('waveLabel'),
    menu: document.getElementById('menu'), pause: document.getElementById('pause'), gameOver: document.getElementById('gameOver'),
    finalScore: document.getElementById('finalScore'), runSummary: document.getElementById('runSummary'),
    start: document.getElementById('startBtn'), restart: document.getElementById('restartBtn')
  };

  const keys = new Set();
  let stars = Array.from({length: 120}, () => ({x: Math.random()*W, y: Math.random()*H, z: Math.random(), s: Math.random()*1.8+.2}));
  let state;
  let lastTime = performance.now();
  const hiKey = 'neonVoidHighScore';
  let highScore = +(localStorage.getItem(hiKey) || 0);
  ui.highScore.textContent = pad(highScore);

  function reset() {
    state = {
      running: true, paused: false, t: 0, score: 0, combo: 1, comboTimer: 0,
      wave: 1, waveTimer: 0, spawnTimer: 0, shardTimer: 1.5,
      shake: 0, flash: 0, gameOver: false,
      player: { x: W*.5, y: H*.72, r: 13, speed: 330, hp: 100, dash: 100, vx: 0, vy: 0, inv: 0, trail: [] },
      enemies: [], shards: [], particles: [], rings: []
    };
    updateUI();
  }

  function startGame() {
    reset();
    ui.menu.classList.remove('active');
    ui.gameOver.classList.remove('active');
    lastTime = performance.now();
  }

  function endGame() {
    state.gameOver = true; state.running = false;
    const score = Math.floor(state.score);
    if (score > highScore) { highScore = score; localStorage.setItem(hiKey, highScore); ui.highScore.textContent = pad(highScore); }
    ui.finalScore.textContent = pad(score);
    const w = state.wave;
    ui.runSummary.textContent = w >= 8 ? `Elite run. You survived to Wave ${String(w).padStart(2,'0')}.` : w >= 5 ? `Strong run. The grid broke at Wave ${String(w).padStart(2,'0')}.` : `The void caught you on Wave ${String(w).padStart(2,'0')}.`;
    ui.gameOver.classList.add('active');
  }

  function dash() {
    if (!state?.running || state.paused || state.player.dash < 35) return;
    const p = state.player;
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx--;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx++;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy--;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy++;
    if (!dx && !dy) dy = -1;
    const len = Math.hypot(dx,dy) || 1; dx/=len; dy/=len;
    p.x += dx*86; p.y += dy*86; p.x = clamp(p.x, 32, W-32); p.y = clamp(p.y, 38, H-60);
    p.dash -= 35; p.inv = .28; state.shake = 7;
    state.rings.push({x:p.x,y:p.y,r:10,a:1});
    burst(p.x,p.y,22,'#50f7ff',220);
  }

  function spawnEnemy() {
    const margin = 60;
    const side = Math.floor(Math.random()*4);
    let x, y;
    if (side===0) {x=Math.random()*W; y=-margin;} else if(side===1){x=W+margin;y=Math.random()*H;} else if(side===2){x=Math.random()*W;y=H+margin;} else {x=-margin;y=Math.random()*H;}
    const roll = Math.random();
    const type = roll < .13 + Math.min(state.wave*.01,.14) ? 'hunter' : roll < .33 ? 'orbiter' : 'chaser';
    const base = 92 + state.wave*10;
    state.enemies.push({x,y,r:type==='hunter'?18:14, type, speed:base*(type==='hunter'?1.23:type==='orbiter'?.92:1), phase:Math.random()*6.28, age:0, near:false});
  }

  function spawnShard() {
    state.shards.push({x:80+Math.random()*(W-160), y:85+Math.random()*(H-190), r:8, age:0, life:8});
  }

  function burst(x,y,n,color,speed=150) {
    for (let i=0;i<n;i++) {
      const a=Math.random()*Math.PI*2, v=Math.random()*speed;
      state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.45+Math.random()*.6,max:1,color,size:1+Math.random()*3});
    }
  }

  function update(dt) {
    if (!state?.running || state.paused) return;
    state.t += dt; state.waveTimer += dt; state.spawnTimer -= dt; state.shardTimer -= dt; state.flash = Math.max(0,state.flash-dt*3); state.shake = Math.max(0,state.shake-dt*20);
    const p = state.player;
    p.inv = Math.max(0,p.inv-dt); p.dash = Math.min(100,p.dash+22*dt);

    if (state.waveTimer > 18) { state.wave++; state.waveTimer = 0; state.flash = .55; state.rings.push({x:W/2,y:H/2,r:80,a:1}); }
    const spawnRate = Math.max(.22, .86 - state.wave*.055);
    if (state.spawnTimer <= 0) { spawnEnemy(); state.spawnTimer = spawnRate * (.7 + Math.random()*.7); }
    if (state.shardTimer <= 0) { spawnShard(); state.shardTimer = 3.2 + Math.random()*2.6; }

    let dx=0,dy=0;
    if(keys.has('ArrowLeft')||keys.has('KeyA')) dx--;
    if(keys.has('ArrowRight')||keys.has('KeyD')) dx++;
    if(keys.has('ArrowUp')||keys.has('KeyW')) dy--;
    if(keys.has('ArrowDown')||keys.has('KeyS')) dy++;
    const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
    p.vx += (dx*p.speed-p.vx)*Math.min(1,dt*11); p.vy += (dy*p.speed-p.vy)*Math.min(1,dt*11);
    p.x=clamp(p.x+p.vx*dt,28,W-28); p.y=clamp(p.y+p.vy*dt,35,H-54);
    p.trail.unshift({x:p.x,y:p.y,a:1}); if(p.trail.length>18)p.trail.pop(); p.trail.forEach((t,i)=>t.a=1-i/p.trail.length);

    for(const e of state.enemies){
      e.age += dt;
      let tx=p.x-e.x, ty=p.y-e.y; const d=Math.hypot(tx,ty)||1; tx/=d;ty/=d;
      if(e.type==='orbiter'){ const swirl=Math.sin(e.age*2.8+e.phase); const ox=-ty*swirl, oy=tx*swirl; tx+=ox*.85;ty+=oy*.85; }
      if(e.type==='hunter' && e.age%2.2<.5){ tx*=1.7;ty*=1.7; }
      e.x += tx*e.speed*dt; e.y += ty*e.speed*dt;
      const dist=Math.hypot(e.x-p.x,e.y-p.y);
      if(dist < p.r+e.r && p.inv<=0){ p.hp-=24; p.inv=.85; state.shake=14; state.flash=.85; burst(p.x,p.y,28,'#ff456b',260); e.dead=true; state.combo=1; state.comboTimer=0; if(p.hp<=0) endGame(); }
      else if(!e.near && dist < p.r+e.r+28 && dist > p.r+e.r+5){ e.near=true; state.combo=Math.min(9,state.combo+1);state.comboTimer=2.1;state.score+=80*state.combo; burst(e.x,e.y,6,'#a36cff',70); }
    }
    state.enemies=state.enemies.filter(e=>!e.dead && e.x>-140&&e.x<W+140&&e.y>-140&&e.y<H+140);

    for(const s of state.shards){ s.age+=dt; const d=Math.hypot(s.x-p.x,s.y-p.y); if(d<32){ s.dead=true; state.score+=250*state.combo; p.hp=Math.min(100,p.hp+7); p.dash=Math.min(100,p.dash+22); state.combo=Math.min(9,state.combo+1);state.comboTimer=2.5;burst(s.x,s.y,20,'#50f7ff',180); } if(s.age>s.life)s.dead=true; }
    state.shards=state.shards.filter(s=>!s.dead);

    state.comboTimer-=dt; if(state.comboTimer<=0)state.combo=1;
    state.score += dt*(16 + state.wave*2.3)*state.combo;

    for(const q of state.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;q.vy*=.985;q.life-=dt;}
    state.particles=state.particles.filter(q=>q.life>0);
    for(const r of state.rings){r.r+=260*dt;r.a-=1.4*dt;} state.rings=state.rings.filter(r=>r.a>0);
    for(const s of stars){s.y += (20+s.z*45)*dt; if(s.y>H){s.y=-3;s.x=Math.random()*W;}}
    updateUI();
  }

  function updateUI(){ if(!state)return; ui.score.textContent=pad(Math.floor(state.score));ui.combo.textContent='x'+state.combo;ui.health.style.width=state.player.hp+'%';ui.dash.style.width=state.player.dash+'%';ui.wave.textContent='WAVE '+String(state.wave).padStart(2,'0'); }

  function draw(){
    ctx.save();
    const sx=(Math.random()-.5)*(state?.shake||0), sy=(Math.random()-.5)*(state?.shake||0); ctx.translate(sx,sy);
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#070b20');g.addColorStop(1,'#02040c');ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,H+40);
    drawGrid();
    ctx.fillStyle='#91a8dd'; for(const s of stars){ctx.globalAlpha=.18+s.z*.55;ctx.fillRect(s.x,s.y,s.s,s.s);}ctx.globalAlpha=1;
    if(state){
      for(const r of state.rings){ctx.strokeStyle=`rgba(80,247,255,${r.a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();}
      for(const s of state.shards) drawShard(s);
      for(const e of state.enemies) drawEnemy(e);
      drawPlayer(state.player);
      for(const q of state.particles){ctx.globalAlpha=Math.max(0,q.life);ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,q.size,q.size);}ctx.globalAlpha=1;
      if(state.flash>0){ctx.fillStyle=`rgba(141,116,255,${state.flash*.15})`;ctx.fillRect(0,0,W,H);}
    }
    vignette(); ctx.restore();
  }

  function drawGrid(){
    ctx.save();ctx.translate(W/2,H*.62);ctx.strokeStyle='rgba(80,247,255,.075)';ctx.lineWidth=1;
    const horizon=-180;
    for(let i=-16;i<=16;i++){ctx.beginPath();ctx.moveTo(i*38,H*.5);ctx.lineTo(i*12,horizon);ctx.stroke();}
    for(let y=0;y<16;y++){const t=y/16, yy=horizon+(t*t)*(H*.72);ctx.beginPath();ctx.moveTo(-W,yy);ctx.lineTo(W,yy);ctx.stroke();}
    ctx.restore();
  }
  function drawPlayer(p){
    for(let i=p.trail.length-1;i>=0;i--){const t=p.trail[i];ctx.globalAlpha=t.a*.19;ctx.fillStyle='#50f7ff';ctx.beginPath();ctx.arc(t.x,t.y,p.r*(.45+t.a*.35),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2);ctx.shadowBlur=24;ctx.shadowColor=p.inv>0?'#ffffff':'#50f7ff';ctx.fillStyle=p.inv>0&&Math.floor(p.inv*20)%2===0?'#fff':'#50f7ff';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(13,13);ctx.lineTo(0,8);ctx.lineTo(-13,13);ctx.closePath();ctx.fill();ctx.fillStyle='#091227';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,8);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawEnemy(e){
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.age*(e.type==='hunter'?2.2:1.2));ctx.shadowBlur=18;ctx.shadowColor=e.type==='hunter'?'#ff456b':'#a36cff';ctx.strokeStyle=e.type==='hunter'?'#ff456b':'#a36cff';ctx.fillStyle=e.type==='hunter'?'rgba(255,69,107,.15)':'rgba(163,108,255,.12)';ctx.lineWidth=2;
    const sides=e.type==='hunter'?4:6;ctx.beginPath();for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2-Math.PI/2, rr=e.r*(i%2?0.78:1);const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawShard(s){const pulse=1+Math.sin(s.age*5)*.16;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.age*1.8);ctx.scale(pulse,pulse);ctx.shadowBlur=22;ctx.shadowColor='#50f7ff';ctx.fillStyle='#bffcff';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(8,0);ctx.lineTo(0,11);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}
  function vignette(){const v=ctx.createRadialGradient(W/2,H/2,H*.18,W/2,H/2,H*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.62)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
  function pad(n){return String(n).padStart(6,'0');}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  function loop(now){const dt=Math.min(.033,(now-lastTime)/1000);lastTime=now;update(dt);draw();requestAnimationFrame(loop);} requestAnimationFrame(loop);

  addEventListener('keydown', e => {keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Space')dash();if(e.code==='KeyP'&&state?.running){state.paused=!state.paused;ui.pause.classList.toggle('active',state.paused);lastTime=performance.now();}});
  addEventListener('keyup',e=>keys.delete(e.code));
  ui.start.addEventListener('click',startGame); ui.restart.addEventListener('click',startGame);
})();
