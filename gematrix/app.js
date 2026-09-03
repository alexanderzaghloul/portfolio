import {HEBREW,WORDS,calculate,findMatches} from './engine.mjs';

const $=id=>document.getElementById(id);
const input=$('word-input');
const memory={hebrew:'אהבה',english:'EXCEL'};
let mode='hebrew';
const palette=['#a6c9ed','#d8b57e','#7fa4ca','#edf3fa','#7295b6','#b8d3ea'];
const presets={hebrew:[['אהבה','Love'],['חי','Life'],['שלום','Peace'],['אקסל','Excel ↗']],english:[['EXCEL','Excel'],['HERITAGE','Heritage'],['CURIOSITY','Curiosity'],['ALEXANDER','Alexander']]};

function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function selectWord(word){input.value=word;render();}
function buildPresets(){
  $('presets').replaceChildren();
  for(const [word,label] of presets[mode]){const button=el('button','preset',label);button.type='button';button.dataset.word=word;button.addEventListener('click',()=>selectWord(word));$('presets').append(button);}
}
function setMode(next){memory[mode]=input.value;mode=next;input.value=memory[mode];input.lang=mode==='hebrew'?'he':'en';input.placeholder=mode==='hebrew'?'מילה משלך':'A word of your own';$('input-label').textContent=mode==='hebrew'?'Enter a Hebrew word or phrase':'Enter an English word or phrase';$('keyboard-details').hidden=mode!=='hebrew';buildPresets();render();}
function ring(letters,total){
  const group=$('ring-segments');group.replaceChildren();if(!total)return;
  let offset=0; const circumference=2*Math.PI*110;
  // Every arc is proportional to its letter’s contribution to the sum.
  for(const [i,item] of letters.entries()){
    const fraction=item.value/total;
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx','150');circle.setAttribute('cy','150');circle.setAttribute('r','110');circle.setAttribute('fill','none');circle.setAttribute('stroke',palette[i%palette.length]);circle.setAttribute('stroke-width','7');circle.setAttribute('stroke-dasharray',`${Math.max(fraction*circumference-2,0.2)} ${circumference}`);circle.setAttribute('stroke-dashoffset',String(-offset*circumference));
    group.append(circle);offset+=fraction;
  }
}
function wordBlock(word,name,meaning){const block=el('div','connection-word');const h=el('strong','',word);h.dir='rtl';h.lang='he';block.append(h,el('span','',name+' · '+meaning));return block;}
function connection(result,entry){
  const card=$('connection-card');card.replaceChildren();card.className='connection-card';
  if(result.normalized==='אקסל'||(mode==='english'&&result.normalized==='EXCEL')){
    card.classList.add('excel-connection');
    const visual=el('div','connection-visual excel-values');
    const he=wordBlock('אקסל','Hebrew spelling','191');
    const en=el('div','connection-word');en.append(el('strong','english-word','EXCEL'),el('span','','English A1–Z26 · 49'));
    visual.append(he,el('span','connection-link','↔'),en);
    const copy=el('div','connection-copy');copy.append(el('p','eyebrow','A LITTLE EXPERIMENT FOR EXCEL'),el('h3','','One name. Two alphabets.'),el('p','','אקסל adds up to 191 in standard Hebrew gematria. EXCEL gives 5 + 24 + 3 + 5 + 12 = 49 in English A1–Z26. Different alphabets, different rules—and a reason to be curious.'),el('small','','אקסל is an illustrative transliteration, not a translation. Other spellings give other values.'));
    card.append(visual,copy);return;
  }
  const matches=mode==='hebrew'?findMatches(result.total,result.normalized):[];
  if(matches.length){
    const match=matches[0];const visual=el('div','connection-visual');
    const first=wordBlock(result.normalized,entry?.name||'Your word',entry?.meaning||'Hebrew');
    const middle=el('div','shared-value');middle.append(el('span','',String(result.total)),el('small','','shared value'));
    const second=el('button','match-word');second.type='button';second.setAttribute('aria-label',`Explore ${match.name}, ${match.meaning}`);second.append(wordBlock(match.word,match.name,match.meaning));second.addEventListener('click',()=>selectWord(match.word));
    visual.append(first,middle,second);
    const copy=el('div','connection-copy');copy.append(el('p','eyebrow','DIFFERENT WORDS. A SHARED NUMBER.'));
    if(result.total===13){copy.append(el('h3','','Love, meet one.'),el('p','','Ahava (love) and echad (one) both add up to 13. Two distinct ideas, connected by the same number. What does that connection bring to mind?'));}
    else {copy.append(el('h3','',`${entry?.meaning||'Your word'}, meet ${match.meaning.toLowerCase()}.`),el('p','',`Both words add up to ${result.total}. Their meanings are different; the shared value gives you a starting point for a question of your own.`));}
    copy.append(el('small','','A numerical connection invites reflection; it does not establish meaning.'));card.append(visual,copy);return;
  }
  const visual=el('div','connection-visual suggestion-visual');const prompt=el('span','suggestion-symbol',mode==='hebrew'?'א ↔ ב':'A ↔ א');visual.append(prompt);
  const copy=el('div','connection-copy');copy.append(el('p','eyebrow',mode==='hebrew'?'KEEP THE QUESTION OPEN':'A DIFFERENT LENS'));
  if(!result.letters.length){copy.append(el('h3','','Start with a word.'),el('p','','Type a word above, or choose an example to see its letters, total, and possible connections.'));}
  else if(mode==='english'){copy.append(el('h3','','An English letter-number experiment.'),el('p','','This total uses the position of each English letter, A = 1 through Z = 26. Switch to Hebrew to explore gematria and the curated word connections.'));}
  else {copy.append(el('h3','','Every word is a starting point.'),el('p','','There isn’t another word with this total in this small, curated collection. That doesn’t mean a connection doesn’t exist. Try love and one, or light and secret.'));}
  const actions=el('div','connection-actions');for(const [word,label] of [['אהבה','Explore love & one'],['אור','Explore light & secret']]){const b=el('button','text-button',label+' ↗');b.type='button';b.addEventListener('click',()=>{if(mode!=='hebrew'){document.querySelector('input[value="hebrew"]').checked=true;setMode('hebrew');}selectWord(word);});actions.append(b);}copy.append(actions);card.append(visual,copy);
}
function render(){
  memory[mode]=input.value;
  const r=calculate(input.value,mode);
  const entry=mode==='hebrew'?WORDS.find(x=>x.word===r.normalized):null;
  $('word-context').textContent=entry?entry.name+' · '+entry.meaning:r.letters.length?(mode==='hebrew'?'Your own connection starts here.':'English letter positions · A = 1, Z = 26'):'A little curiosity goes a long way.';
  $('input-note').textContent=r.unsupported?`${r.unsupported} ${r.unsupported===1?'letter is':'letters are'} outside the selected alphabet and excluded. ${mode==='hebrew'?'Use Hebrew letters, or switch to English.':'Use English letters, or switch to Hebrew.'}`:mode==='hebrew'?'Spaces, vowel marks, punctuation, and digits don’t change the total.':'Spaces, punctuation, and digits don’t change the total. Accented Latin letters use their base letter.';
  $('input-note').classList.toggle('input-warning',r.unsupported>0);
  $('total-value').textContent=r.letters.length?r.total.toLocaleString():'—';
  $('total-value').classList.toggle('large-total',r.total>=1000);
  $('result-word').textContent=r.normalized||'Your word goes here';$('result-word').lang=mode==='hebrew'?'he':'en';
  $('result-method').textContent=mode==='hebrew'?'STANDARD GEMATRIA':'ENGLISH LETTER VALUES';
  $('alphabet-name').textContent=mode==='hebrew'?'Hebrew':'English';
  $('method-name').textContent=mode==='hebrew'?'Standard · 1–400':'Ordinal · A1–Z26';
  $('result-footnote').textContent=mode==='hebrew'?'The ring shows each letter’s share of the total.':'A separate English experiment, inspired by letter values.';
  $('letter-count').textContent=r.letters.length+' '+(r.letters.length===1?'letter':'letters');
  const tiles=$('letter-tiles');tiles.replaceChildren();tiles.dir=mode==='hebrew'?'rtl':'ltr';
  r.letters.forEach((item,i)=>{const tile=el('div','letter-tile');tile.style.setProperty('--letter-color',palette[i%palette.length]);tile.setAttribute('aria-label',`${item.name}, ${item.letter}, value ${item.value}`);const glyph=el('strong','letter-glyph',item.letter);glyph.lang=mode==='hebrew'?'he':'en';tile.append(glyph,el('span','letter-name',item.name),el('span','letter-value',String(item.value)));tiles.append(tile);});
  if(!r.letters.length)tiles.append(el('p','empty-letters','Your letter breakdown will appear here.'));
  $('equation').textContent=r.letters.length?r.letters.map(x=>x.value).join(' + ')+' = '+r.total:'No letters counted yet.';
  for(const b of $('presets').children){const selected=b.dataset.word===r.normalized;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));}
  ring(r.letters,r.total);connection(r,entry);
}

for(const radio of document.querySelectorAll('input[name="mode"]'))radio.addEventListener('change',()=>setMode(radio.value));
input.addEventListener('input',render);
$('clear-input').addEventListener('click',()=>{input.value='';render();input.focus();});
function insert(text){const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;if(input.value.length-(end-start)+text.length>input.maxLength)return;input.setRangeText(text,start,end,'end');render();input.focus();}
for(const [letter,value,name] of HEBREW){
  const button=el('button','key',letter);button.type='button';button.lang='he';button.setAttribute('aria-label',`${name}, ${value}`);button.title=`${name} · ${value}`;button.addEventListener('click',()=>insert(letter));$('keyboard').append(button);
  const cell=el('div','alphabet-cell');cell.append(el('b','',letter),el('span','',String(value)));$('alphabet-table').append(cell);
}
$('keyboard-space').addEventListener('click',()=>insert(' '));
$('keyboard-backspace').addEventListener('click',()=>{const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');render();input.focus();});
const dialog=$('method-dialog');
for(const id of ['method-open','footer-method'])$(id).addEventListener('click',()=>dialog.showModal());
$('method-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
buildPresets();render();
