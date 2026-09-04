import { GameEngine, STEP, DASH_COOLDOWN } from './engine.js';
import { LEVELS } from './levels.js';
import { Renderer } from './renderer.js';
import { AudioSystem } from './audio.js';
import { loadSave, writeSave } from './storage.js';

const $=id=>document.getElementById(id);
let storage=null;try{storage=window.localStorage;}catch{}
const save=loadSave(storage);
const engine=new GameEngine(save.selected);
const renderer=new Renderer($('game'),engine);
const audio=new AudioSystem();
const keys=new Set();
const touch={x:0,y:0,pointer:null};
let primaryAction=()=>{},secondaryAction=()=>{},overlayState='',toastTimeout=0;
let soundWanted=save.sound,unlockingSound=false,lastTick=-1;
const pad=n=>String(n).padStart(2,'0');
const formatTime=n=>n<60?n.toFixed(1)+'s':Math.floor(n/60)+'m '+Math.floor(n%60)+'s';

function persist(){if(!writeSave(storage,save))$('save-note').textContent='Progress lasts for this visit — browser storage unavailable';}
function resetInputs(){keys.clear();touch.x=0;touch.y=0;touch.pointer=null;$('joystick-knob').style.transform='translate(0px,0px)';}
function focusGame(){$('game').focus({preventScroll:true});}
function notify(message){clearTimeout(toastTimeout);$('stage-toast').textContent=message;$('stage-toast').classList.add('visible');toastTimeout=setTimeout(()=>$('stage-toast').classList.remove('visible'),3500);}

function updateSoundButton(){
  $('sound').setAttribute('aria-pressed',String(soundWanted));
  $('sound').setAttribute('aria-label',soundWanted?'Turn sound off':'Turn sound on');
  $('sound').title=soundWanted?'Turn sound off (M)':'Turn sound on (M)';
  $('sound-waves').setAttribute('d',soundWanted?'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'m16 9 6 6m0-6-6 6');
}
async function unlockAudio(){
  if(!soundWanted||audio.enabled||unlockingSound)return;
  unlockingSound=true;const ok=await audio.enable();unlockingSound=false;
  if(!soundWanted){audio.disable();return;}
  if(!ok){soundWanted=false;save.sound=false;updateSoundButton();persist();notify('Audio is unavailable in this browser.');return;}
  if(engine.status==='playing')audio.startMusic();
}
async function toggleSound(){
  soundWanted=!soundWanted;save.sound=soundWanted;updateSoundButton();persist();
  if(soundWanted){await unlockAudio();audio.play('switch');}else audio.disable();
}

function buildSidebar(){
  const l=engine.level;
  $('sector-number').textContent=pad(engine.index+1);$('mission-title').textContent=l.name;
  $('mission-brief').textContent=l.brief;$('security-label').textContent=l.difficulty.toUpperCase();
  $('objectives').replaceChildren(...l.route.map(label=>{const li=document.createElement('li');li.textContent=label;return li;}));
  $('hint').textContent=l.hint;$('hint').hidden=true;$('hint-button').innerHTML='REVEAL HINT <span aria-hidden="true">+</span>';$('hint-button').setAttribute('aria-expanded','false');
  $('timeline-end').textContent=l.time+'s';$('timeline-middle').textContent=(l.time/2)+'s';
  $('sector-selector').replaceChildren(...LEVELS.map((level,i)=>{
    const b=document.createElement('button');b.className='sector-button'+(i===engine.index?' selected':'')+(save.results[level.id]?' completed':'');
    b.disabled=i>save.unlocked;b.setAttribute('aria-label',`Sector ${i+1}: ${level.name}${save.results[level.id]?', completed':''}${b.disabled?', locked':''}`);
    b.title=b.disabled?'Complete the previous sector':level.name;b.setAttribute('aria-current',i===engine.index?'step':'false');
    if(b.disabled)b.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="9" width="10" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>';else b.textContent=pad(i+1);
    b.addEventListener('click',()=>selectSector(i));return b;
  }));
  const count=Object.keys(save.results).length;$('campaign-count').textContent=pad(count)+' / 06';
  $('campaign-bars').replaceChildren(...LEVELS.map(l=>{const i=document.createElement('i');if(save.results[l.id])i.className='complete';return i;}));
  $('echo-slots').replaceChildren(...Array.from({length:3},(_,i)=>{const div=document.createElement('div');div.className='echo-slot';div.innerHTML=`<span class="echo-icon" aria-hidden="true">◇</span><span class="echo-label">ECHO ${pad(i+1)}</span><span class="echo-state">EMPTY</span>`;return div;}));
}
function selectSector(index){
  if(index>save.unlocked)return;resetInputs();audio.stopMusic();engine.setLevel(index);renderer.fx=[];renderer.flash=0;
  save.selected=index;persist();overlayState='';lastTick=-1;
  $('stage-toast').classList.remove('visible');buildSidebar();syncHUD();syncOverlay();
}
function startRun(){engine.start();unlockAudio();audio.startMusic();syncOverlay();focusGame();if(window.innerWidth<641)$('stage').scrollIntoView({block:'center',behavior:renderer.reduced?'auto':'smooth'});}
function pauseGame(){if(engine.status==='playing'){engine.pause();resetInputs();audio.stopMusic();syncOverlay();}}
function resumeGame(){engine.resume();unlockAudio();audio.startMusic();syncOverlay();focusGame();}
function rewind(){if(engine.status!=='playing')return;const full=engine.echoes.length===3;if(engine.rewind()){notify(full?'Timeline reset · oldest echo replaced':'Echo recorded · your past is moving');focusGame();}}
function dash(){if(engine.status==='playing'){engine.dash();focusGame();}}
function replay(){selectSector(engine.index);startRun();}

function openModal(id){
  const modal=$(id);if(modal.open)return;
  modal.dataset.resume=engine.status==='playing'?'true':'false';
  if(engine.status==='playing')pauseGame();modal.showModal();resetInputs();
}
for(const modal of document.querySelectorAll('dialog')){
  modal.addEventListener('close',()=>{if(modal.dataset.resume==='true'&&engine.status==='paused')resumeGame();});
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
  for(const b of modal.querySelectorAll('[data-close]'))b.addEventListener('click',()=>modal.close());
}

function setOverlay({tag,symbol,title,description,primary,action,secondary,secondAction,footnote='',stats=null}){
  $('overlay-tag').textContent=tag;$('overlay-symbol').textContent=symbol;
  $('overlay-title').innerHTML=title;$('overlay-description').innerHTML=description;
  $('primary-action').innerHTML=`<span>${primary}</span><span aria-hidden="true">↗</span>`;primaryAction=action;
  $('secondary-action').hidden=!secondary;$('secondary-action').textContent=secondary||'';secondaryAction=secondAction||(()=>{});
  $('overlay-footnote').textContent=footnote;$('overlay-footnote').hidden=!footnote;
  $('result-stats').hidden=!stats;
  if(stats)$('result-stats').replaceChildren(...stats.map(([label,value])=>{const div=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;div.append(strong,span);return div;}));
}
function syncOverlay(){
  const status=engine.status;if(status===overlayState)return;overlayState=status;
  $('overlay').hidden=status==='playing';$('overlay-content').className='overlay-content '+status;
  if(status==='playing')return;
  resetInputs();audio.stopMusic();
  const l=engine.level;
  if(status==='ready')setOverlay({tag:`SECTOR ${pad(engine.index+1)} · ${l.difficulty.toUpperCase()}`,symbol:'◈',title:engine.index===0?'Meet your<br><em>past self.</em>':l.name.replace(/ (\S+)$/,'<br><em>$1.</em>'),description:engine.index===0?'Leave an echo on a switch.<br>Let your past open the way forward.':l.brief,primary:engine.index===0?'ENTER THE ARCHIVE':'BEGIN THE HEIST',action:startRun,footnote:engine.index===0?'SIX SECTORS · A CREW OF ONE':l.kicker});
  if(status==='paused')setOverlay({tag:'TIMELINE SUSPENDED',symbol:'Ⅱ',title:'Take your<br><em>time.</em>',description:'Your echoes are right where you left them.',primary:'RESUME HEIST',action:resumeGame,secondary:'Restart this sector',secondAction:()=>openModal('restart-dialog'),footnote:'ESC TO RESUME'});
  if(status==='caught')setOverlay({tag:'SECURITY INTERCEPT',symbol:'⊗',title:'Signal<br><em>lost.</em>',description:'Your echoes and shards are safe.<br>Try the loop again. Watch the red patrols.',primary:'RETRY THE LOOP',action:()=>{engine.retry();unlockAudio();audio.startMusic();syncOverlay();focusGame();},secondary:'Restart this sector',secondAction:()=>openModal('restart-dialog'),footnote:'TIP: DASH THROUGH ACTIVE LASERS AND PATROLS'});
  if(status==='won'){
    const final=engine.index===LEVELS.length-1,r=engine.result;
    setOverlay({tag:final?'THE ARCHIVE IS YOURS':'SECTOR '+pad(engine.index+1)+' · COMPLETE',symbol:'★'.repeat(r.stars)+'☆'.repeat(3-r.stars),title:final?'You stole<br><em>tomorrow.</em>':'Light<br><em>secured.</em>',description:final?'Six sectors. One thief. A whole crew of echoes.':`Next: ${LEVELS[engine.index+1].name}.`,primary:final?'PLAY AGAIN':'NEXT SECTOR',action:()=>{selectSector(final?0:engine.index+1);startRun();},secondary:'Replay this sector',secondAction:replay,stats:[['SCORE',r.score.toLocaleString()],['ECHOES',String(r.loops)],['TIME',formatTime(r.time)]]});
  }
  if(status==='caught'||status==='won')$('primary-action').focus({preventScroll:true});
}

function syncHUD(){
  const e=engine,l=e.level,remaining=Math.max(0,l.time-e.time),playing=e.status==='playing';
  $('shard-count').textContent=e.collected.size;$('timer').textContent=remaining.toFixed(1);$('timer').classList.toggle('urgent',remaining<5);
  $('status-label').textContent=({ready:'AWAITING ENTRY',playing:'HEIST IN PROGRESS',paused:'TIMELINE PAUSED',caught:'SIGNAL LOST',won:'EXTRACTION COMPLETE'})[e.status];
  $('status-dot').className='status-dot'+(playing?' playing':'');
  $('echo-count').textContent=e.echoes.length+' / 3';
  [...$('echo-slots').children].forEach((slot,i)=>{
    const echo=e.echoes[i],active=!!echo;slot.classList.toggle('active',active);
    slot.querySelector('.echo-icon').textContent=active?'◈':'◇';
    const state=!echo?'EMPTY':e.time>=echo.duration?'HOLDING':'REPLAY';
    slot.querySelector('.echo-state').textContent=state;slot.setAttribute('aria-label',`Echo ${i+1}: ${state.toLowerCase()}`);
  });
  $('loop-count').textContent='LOOP '+pad(e.loops+1);$('timeline-label').textContent=playing?'RECORDING YOUR TRACE':e.status==='won'?'TIMELINE COMPLETE':e.status==='paused'?'RECORDING PAUSED':'TIMELINE READY';
  $('record-light').classList.toggle('active',playing);
  const pct=Math.min(100,e.time/l.time*100)+'%';$('timeline-record').style.width=pct;$('timeline-playhead').style.left=pct;
  const cooldown=e.cooldown/DASH_COOLDOWN;$('dash-meter').style.opacity=String(1-cooldown*.8);$('touch-dash').classList.toggle('cooling',cooldown>0);
  $('dash').disabled=!playing||e.cooldown>0;$('rewind').disabled=!playing;$('touch-dash').disabled=!playing||e.cooldown>0;$('touch-rewind').disabled=!playing;
  $('pause').disabled=e.status==='ready'||e.status==='caught'||e.status==='won';$('pause').setAttribute('aria-label',e.status==='paused'?'Resume game':'Pause game');
  const tick=Math.ceil(remaining);if(playing&&tick<=5&&tick!==lastTick){audio.play('tick');lastTick=tick;}
  if(remaining>5)lastTick=-1;
}

function handleEvents(){
  for(const event of engine.drainEvents()){
    renderer.event(event);audio.play(event.type);
    if(event.type==='win'){
      const best=save.results[engine.level.id];if(!best||event.score>best.score)save.results[engine.level.id]={...engine.result};
      save.unlocked=Math.max(save.unlocked,Math.min(LEVELS.length-1,engine.index+1));persist();buildSidebar();
    }
    if(event.type==='rewind'){lastTick=-1;if(!document.querySelector('.stage-toast.visible'))notify('Loop reset · your echo is on the move');}
    if(event.type==='collect'&&engine.collected.size===engine.level.shards.length)notify('All light secured · reach OUT to extract');
  }
  syncOverlay();
}

$('primary-action').addEventListener('click',()=>primaryAction());$('secondary-action').addEventListener('click',()=>secondaryAction());
$('sound').addEventListener('click',toggleSound);
$('pause').addEventListener('click',()=>engine.status==='paused'?resumeGame():pauseGame());
for(const id of ['guide-top','guide-bottom'])$(id).addEventListener('click',()=>openModal('guide-dialog'));
$('about-button').addEventListener('click',()=>openModal('about-dialog'));
$('restart-side').addEventListener('click',()=>openModal('restart-dialog'));
$('confirm-restart').addEventListener('click',()=>{$('restart-dialog').dataset.resume='false';$('restart-dialog').close();replay();});
$('hint-button').addEventListener('click',()=>{const expanded=$('hint').hidden;$('hint').hidden=!expanded;$('hint-button').setAttribute('aria-expanded',String(expanded));$('hint-button').innerHTML=expanded?'HIDE HINT <span aria-hidden="true">−</span>':'REVEAL HINT <span aria-hidden="true">+</span>';});
$('hint-button').setAttribute('aria-controls','hint');
$('rewind').addEventListener('click',rewind);$('dash').addEventListener('click',dash);
$('touch-rewind').addEventListener('pointerdown',event=>{event.preventDefault();rewind();});$('touch-dash').addEventListener('pointerdown',event=>{event.preventDefault();dash();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this browser.');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});

const movementCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
document.addEventListener('keydown',event=>{
  if(event.metaKey||event.ctrlKey||event.altKey||document.querySelector('dialog[open]'))return;
  const code=event.code;
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if((code==='Space'||code==='Enter')&&event.target.closest('button,a'))return;
  if(movementCodes.includes(code)){event.preventDefault();keys.add(code);return;}
  if(['Space','ShiftLeft','ShiftRight','Escape','KeyP','KeyR','KeyM'].includes(code))event.preventDefault();
  if(event.repeat)return;
  if(code==='Space'){if(engine.status==='playing')rewind();else if(engine.status==='ready')startRun();}
  if(code==='ShiftLeft'||code==='ShiftRight')dash();
  if(code==='Escape'||code==='KeyP'){if(engine.status==='paused')resumeGame();else pauseGame();}
  if(code==='KeyR')openModal('restart-dialog');
  if(code==='KeyM')toggleSound();
});
document.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{resetInputs();pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInputs();pauseGame();audio.stopMusic();}});

const joystick=$('joystick');
function updateJoystick(event){const r=joystick.getBoundingClientRect(),dx=event.clientX-r.left-r.width/2,dy=event.clientY-r.top-r.height/2,limit=r.width*.31,length=Math.hypot(dx,dy),scale=length>limit?limit/length:1;touch.x=length<5?0:dx*scale/limit;touch.y=length<5?0:dy*scale/limit;$('joystick-knob').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
joystick.addEventListener('pointerdown',event=>{if(engine.status!=='playing'||touch.pointer!==null)return;event.preventDefault();touch.pointer=event.pointerId;joystick.setPointerCapture(event.pointerId);updateJoystick(event);unlockAudio();});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===touch.pointer){event.preventDefault();updateJoystick(event);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,event=>{if(event.pointerId===touch.pointer){touch.pointer=null;touch.x=0;touch.y=0;$('joystick-knob').style.transform='translate(0px,0px)';}});
function inputVector(){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);if(!x&&!y){x=touch.x;y=touch.y;}return {x,y};}

let lastFrame=0,accumulator=0,lastHUD=0;
function frame(now){
  const elapsed=lastFrame?Math.min((now-lastFrame)/1000,.1):0;lastFrame=now;
  if(engine.status==='playing'){
    accumulator+=elapsed;while(accumulator>=STEP){engine.update(STEP,inputVector());accumulator-=STEP;if(engine.status!=='playing'){accumulator=0;break;}}
  }else accumulator=0;
  handleEvents();renderer.draw(now);if(now-lastHUD>70){syncHUD();lastHUD=now;}
  requestAnimationFrame(frame);
}
if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
buildSidebar();updateSoundButton();syncHUD();syncOverlay();requestAnimationFrame(frame);
