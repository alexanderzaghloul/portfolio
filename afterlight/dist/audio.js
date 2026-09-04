// All sound is synthesized locally. No samples, remote requests, or autoplay.
export class AudioSystem {
  constructor(){this.enabled=false;this.ctx=null;this.master=null;this.ambient=null;this.interval=null;this.beat=0;}
  async enable(){
    try{
      if(!this.ctx){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return false;this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.28;this.master.connect(this.ctx.destination);}
      await this.ctx.resume();this.enabled=true;return true;
    }catch{return false;}
  }
  disable(){this.enabled=false;this.stopMusic();if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
  tone(freq,duration=.1,type='sine',volume=.3,delay=0,endFreq=null){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  play(type){
    if(type==='collect'){[587.33,880,1174.66].forEach((f,i)=>this.tone(f,.25,'sine',.22,i*.06));}
    if(type==='rewind'){this.tone(850,.45,'triangle',.3,0,75);this.tone(660,.55,'sine',.16,.05,55);}
    if(type==='dash')this.tone(160,.18,'triangle',.13,0,720);
    if(type==='switch'){this.tone(392,.15,'sine',.14);this.tone(587,.18,'sine',.12,.07);}
    if(type==='caught'){this.tone(180,.4,'sawtooth',.09,0,55);this.tone(120,.35,'triangle',.13,.1,45);}
    if(type==='win'){[293.66,369.99,440,587.33,739.99,880].forEach((f,i)=>this.tone(f,.6,'sine',.22,i*.1));}
    if(type==='start'||type==='retry'){this.tone(293.66,.2,'sine',.2);this.tone(440,.4,'sine',.2,.12);}
    if(type==='tick')this.tone(880,.04,'sine',.08);
  }
  startMusic(){if(this.interval||!this.enabled)return;this.interval=window.setInterval(()=>{if(!this.enabled)return;const notes=[146.83,0,220,0,174.61,0,196,220];const f=notes[this.beat++%notes.length];if(f)this.tone(f,.85,'sine',.055);if(this.beat%4===0)this.tone(73.42,1.7,'sine',.065);},550);}
  stopMusic(){if(this.interval){clearInterval(this.interval);this.interval=null;}}
}
