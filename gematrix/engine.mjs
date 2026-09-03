export const HEBREW = [
  ['א',1,'Aleph'],['ב',2,'Bet'],['ג',3,'Gimel'],['ד',4,'Dalet'],['ה',5,'He'],['ו',6,'Vav'],['ז',7,'Zayin'],['ח',8,'Het'],['ט',9,'Tet'],['י',10,'Yod'],['כ',20,'Kaf'],['ל',30,'Lamed'],['מ',40,'Mem'],['נ',50,'Nun'],['ס',60,'Samekh'],['ע',70,'Ayin'],['פ',80,'Pe'],['צ',90,'Tsadi'],['ק',100,'Qof'],['ר',200,'Resh'],['ש',300,'Shin'],['ת',400,'Tav'],['ך',20,'Final kaf'],['ם',40,'Final mem'],['ן',50,'Final nun'],['ף',80,'Final pe'],['ץ',90,'Final tsadi']
];
const lookup = new Map(HEBREW.map(([letter,value,name])=>[letter,{letter,value,name}]));
export const WORDS = [
  {word:'אהבה',name:'Ahava',meaning:'Love'}, {word:'אחד',name:'Echad',meaning:'One'},
  {word:'חי',name:'Chai',meaning:'Life'}, {word:'שלום',name:'Shalom',meaning:'Peace'},
  {word:'אמת',name:'Emet',meaning:'Truth'}, {word:'אור',name:'Or',meaning:'Light'},
  {word:'רז',name:'Raz',meaning:'Secret'}, {word:'יין',name:'Yayin',meaning:'Wine'},
  {word:'סוד',name:'Sod',meaning:'Secret'}, {word:'לב',name:'Lev',meaning:'Heart'},
  {word:'טוב',name:'Tov',meaning:'Good'}, {word:'תורה',name:'Torah',meaning:'Torah'},
  {word:'ישראל',name:'Yisrael',meaning:'Israel'},
  {word:'אקסל',name:'Excel',meaning:'Illustrative Hebrew transliteration'}
];
export function calculate(text,mode='hebrew') {
  const source = String(text).normalize('NFKD');
  const letters=[]; let unsupported=0;
  for(const char of source) {
    if(mode==='hebrew' && lookup.has(char)) letters.push({...lookup.get(char)});
    else if(mode==='english' && /^[a-z]$/i.test(char)) {const letter=char.toUpperCase();letters.push({letter,value:letter.charCodeAt(0)-64,name:letter});}
    else if(/\p{L}/u.test(char)) unsupported++;
  }
  return {letters,total:letters.reduce((sum,x)=>sum+x.value,0),normalized:letters.map(x=>x.letter).join(''),unsupported};
}
export function findMatches(total,current) {
  if(!total) return [];
  return WORDS.filter(item=>item.word!==current && calculate(item.word).total===total);
}
