import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, STEP, SPEED, DASH_SPEED, pointOnPath, intersectsCircle, dronePosition, laserActive } from '../dist/engine.js';
import { LEVELS } from '../dist/levels.js';
import { sanitizeSave, loadSave, writeSave } from '../dist/storage.js';
import { solve } from './solver.mjs';

test('Each of the six sectors is solvable with real echoes, patrols, and laser timing',async t=>{
  for(let i=0;i<LEVELS.length;i++)await t.test(LEVELS[i].name,()=>{
    const engine=new GameEngine(i),result=solve(engine);
    assert.equal(engine.status,'won');assert.equal(engine.hits,0);assert.equal(engine.collected.size,3);
    assert.ok(result.score>=100);assert.ok(engine.echoes.length<=3);
    console.log(`${LEVELS[i].id}: solved in ${result.time.toFixed(1)}s, ${result.loops} echoes, ${result.score} points`);
  });
});
test('Echo interpolation and endpoint hold preserve the recorded trajectory',()=>{
  const frames=[{x:0,y:0,t:0},{x:10,y:20,t:1},{x:30,y:40,t:2}];
  assert.deepEqual(pointOnPath(frames,.5),{x:5,y:10,t:.5});
  assert.deepEqual(pointOnPath(frames,99),frames[2]);assert.equal(pointOnPath([],0),null);
});
test('Rewind banks shards, resets time, deep-copies the route, and caps the crew at three',()=>{
  const e=new GameEngine();e.start();e.collected.add(0);
  for(let run=0;run<4;run++){for(let i=0;i<20;i++)e.update(STEP,{x:1,y:0});const trace=e.recording;assert.equal(e.rewind(),true);trace[0].x=-99;assert.notEqual(e.echoes.at(-1).frames[0].x,-99);}
  assert.equal(e.echoes.length,3);assert.equal(e.echoes[0].id,2);assert.equal(e.time,0);assert.equal(e.collected.size,1);assert.equal(e.loops,4);
});
test('Pause freezes every gameplay timer and blocked gates stop dashes',()=>{
  const e=new GameEngine();e.start();e.update(STEP,{x:1,y:0});e.pause();const before=JSON.stringify({p:e.player,time:e.time,total:e.totalTime});
  e.update(.05,{x:1,y:0});assert.equal(JSON.stringify({p:e.player,time:e.time,total:e.totalTime}),before);
  e.resume();e.player={x:502,y:300,angle:0};e.dash();for(let i=0;i<20;i++)e.update(STEP,{x:1,y:0});assert.ok(e.player.x<=509.01);assert.equal(e.status,'playing');
});
test('Diagonal movement and dashes have the same speed as cardinal movement',()=>{
  const a=new GameEngine(),b=new GameEngine();a.start();b.start();const start={...a.player};
  a.update(STEP,{x:1,y:0});b.update(STEP,{x:1,y:1});
  const distance=e=>Math.hypot(e.player.x-start.x,e.player.y-start.y);
  assert.ok(Math.abs(distance(a)-distance(b))<1e-8);
  const pa={...a.player},pb={...b.player};a.dash();b.dash();a.update(STEP,{x:1,y:0});b.update(STEP,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(a.player.x-pa.x,a.player.y-pa.y)-Math.hypot(b.player.x-pb.x,b.player.y-pb.y))<1e-8);
});
test('Patrol capture preserves progress; dash grants brief hazard immunity',()=>{
  const e=new GameEngine(1);e.start();e.collected.add(0);e.update(.2,{x:0,y:0});for(let i=0;i<10;i++)e.update(STEP);e.rewind();
  const p=dronePosition(e.level.drones[0],STEP);e.player={...p};e.update(STEP);assert.equal(e.status,'caught');assert.equal(e.hits,1);e.retry();assert.equal(e.status,'playing');assert.equal(e.echoes.length,1);assert.equal(e.collected.size,1);
  e.player={...dronePosition(e.level.drones[0],STEP)};e.dash();e.update(STEP);assert.equal(e.status,'playing');
});
test('Countdown automatically records an echo; malformed deltas cannot corrupt the game',()=>{
  const e=new GameEngine();e.start();e.update(NaN);e.update(-1);assert.equal(e.time,0);
  for(let i=0;i<1202;i++)e.update(STEP);assert.equal(e.loops,1);assert.equal(e.echoes.length,1);assert.ok(e.time<.1);
});
test('A closing gate does not trap a player inside its doorway',()=>{
  const e=new GameEngine();e.start();const g=e.level.gates[0];e.openGates.add(g.id);e.player={x:g.x+20,y:g.y+60,angle:0};e.refreshSwitches();assert.ok(e.openGates.has(g.id));
  for(let i=0;i<35;i++)e.update(STEP,{x:1,y:0});assert.ok(e.player.x>g.x+g.w+11);assert.ok(!e.openGates.has(g.id));
});
test('Stored progress handles invalid JSON, unavailable storage, and tampered unlocks',()=>{
  assert.equal(loadSave({getItem(){return '{oops';}}).unlocked,0);
  assert.equal(writeSave({setItem(){throw Error();}},{}),false);
  assert.equal(sanitizeSave({version:1,unlocked:500,selected:500,results:{}}).unlocked,0);
  const good={score:2000,stars:3,time:35,loops:1,hits:0};
  const result=sanitizeSave({version:1,selected:2,sound:true,results:{'first-echo':good,'crossed-signals':{...good,score:Infinity}}});
  assert.equal(result.unlocked,1);assert.equal(result.selected,1);assert.equal(result.sound,true);assert.equal(Object.keys(result.results).length,1);
});
test('Collision primitives and patrols remain deterministic',()=>{
  assert.ok(intersectsCircle({x:0,y:0,w:40,h:40},44,20,11));assert.ok(!intersectsCircle({x:0,y:0,w:40,h:40},55,20,11));
  const d=LEVELS[1].drones[0];assert.deepEqual(dronePosition(d,3.14),dronePosition(d,3.14));
  assert.equal(laserActive({period:4,on:2,phase:0},1),true);assert.equal(laserActive({period:4,on:2,phase:0},3),false);
});
