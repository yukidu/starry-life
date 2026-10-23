/**
 * Starry Life numerology calculations.
 * Rules verified against Sina's actual 2012 calculator script (the iframe on
 * https://astro.sina.com.cn/z/numberology/), not just the editorial articles.
 * Cultural/entertainment interpretations only, not scientific assessments.
 */
export const MASTER_NUMBERS = Object.freeze([11,22,33]);
export const GRID_ORDER = Object.freeze([1,4,7,2,5,8,3,6,9]);
export const GRID_LINES = Object.freeze([
  { id:'1-2-3', cells:[1,2,3], title:'思考與表達線' },
  { id:'4-5-6', cells:[4,5,6], title:'組織與行動線' },
  { id:'7-8-9', cells:[7,8,9], title:'經驗與理想線' },
  { id:'1-4-7', cells:[1,4,7], title:'自我實踐線' },
  { id:'2-5-8', cells:[2,5,8], title:'感受與協作線' },
  { id:'3-6-9', cells:[3,6,9], title:'創造與願景線' },
  { id:'1-5-9', cells:[1,5,9], title:'信念與延伸線' },
  { id:'3-5-7', cells:[3,5,7], title:'反思與探索線' },
  { id:'2-4', cells:[2,4], title:'靈巧線' },
  { id:'2-6', cells:[2,6], title:'和平線' },
  { id:'4-8', cells:[4,8], title:'秩序與成果線' },
  { id:'6-8', cells:[6,8], title:'責任與企圖線' },
]);

export function parseBirthdate(value) {
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('請選擇完整的西元出生日期');
  const [year, month, day] = value.split('-').map(Number);
  if(year<1 || year>9999 || month<1 || month>12 || day<1 || day>31) throw new Error('日期不正確');
  const valid = new Date(0);valid.setFullYear(year,month-1,day);valid.setHours(0,0,0,0);
  if(valid.getFullYear()!==year || valid.getMonth()!==month-1 || valid.getDate()!==day) throw new Error('日期不正確，請重新選擇');
  return {year,month,day,iso:value};
}

/** Track intermediate totals. The Sina *calculator* reduces all the way to 1–9.
 * Option preserveMasters is kept to make editorial 11/22/33 comparisons explicit. */
export function collapse(n,{preserveMasters=false}={}) {
  if(!Number.isSafeInteger(n)||n<0) throw new Error('數字格式不正確');
  const steps=[n];
  while(n>9 && !(preserveMasters && MASTER_NUMBERS.includes(n))){
    n=String(n).split('').reduce((sum,d)=>sum+Number(d),0);
    steps.push(n);
  }
  return {number:n,steps};
}

/** Sina original code: numGame.getAstroIndex, including its historic cusp dates. */
const ZODIAC_ORDER=['水瓶座','雙魚座','牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座'];
const ZODIAC_CUTOFF=[21,20,21,21,22,22,23,24,24,24,23,22];
export function sinaZodiac(month,day){
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>31)throw new Error('生日不正確');
  const thisSigns=[11,0,1,2,3,4,5,6,7,8,9,10];
  const nextSigns=[0,1,2,3,4,5,6,7,8,9,10,11];
  const index=day>=ZODIAC_CUTOFF[month-1]?nextSigns[month-1]:thisSigns[month-1];
  const number=index<2?index+2:index>10?index-10:index-1;
  return {name:ZODIAC_ORDER[index],number};
}
export function zodiac(month,day){return sinaZodiac(month,day).name;}

function firstMaster(steps){return steps.find(n=>MASTER_NUMBERS.includes(n))??null;}
function tally(layers){
  const breakdown=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,{birth:0,destiny:0,birthday:0,zodiac:0,talent:0}]));
  for(const [layer,values] of Object.entries(layers)){
    for(const n of values){if(n>=1&&n<=9)breakdown[n][layer]+=layer==='talent'?2:1;}
  }
  return {
    breakdown,
    counts:Object.fromEntries(Object.entries(breakdown).map(([n,pieces])=>[n,Object.values(pieces).reduce((a,b)=>a+b,0)])),
    rawCounts:Object.fromEntries(Object.entries(breakdown).map(([n,pieces])=>[n,pieces.birth])),
  };
}

export function calculate(rawDate){
  const date=parseBirthdate(rawDate);
  const digits=rawDate.replaceAll('-','').split('').map(Number);
  const initial=digits.reduce((a,b)=>a+b,0);
  const destiny=collapse(initial);
  const birthday=collapse(date.day);
  const star=sinaZodiac(date.month,date.day);
  // Sina displays each digit of the *first sum* as the talent number,
  // and calls calFrequncy twice for each of those digits.
  const talentDigits=initial<10?[initial]:[Math.floor(initial/10),initial%10].filter(n=>n!==0);
  const layers={birth:digits.filter(n=>n!==0),destiny:[destiny.number],birthday:[birthday.number],zodiac:[star.number],talent:talentDigits};
  const {counts,rawCounts,breakdown}=tally(layers);
  const present=Object.keys(counts).filter(k=>counts[k]>0).map(Number);
  const missing=Object.keys(counts).filter(k=>counts[k]===0).map(Number);
  const repeated=Object.entries(counts).filter(([,v])=>v>=2).map(([k,v])=>({number:Number(k),count:v}));
  const connected=GRID_LINES.filter(line=>line.cells.every(n=>counts[n]>0)).map(l=>l.id);
  return {
    date,rawDate,digits,initial,destiny:destiny.number,destinyMaster:firstMaster(destiny.steps),reductionSteps:destiny.steps,
    birthday:birthday.number,birthdayMaster:firstMaster(birthday.steps),birthdaySteps:birthday.steps,
    zodiac:star.name,zodiacNumber:star.number,talentDigits,layers,
    counts,rawCounts,countBreakdown:breakdown,present,missing,repeated,connected,
  };
}

export function comparePersons(a,b){
  const left=calculate(a),right=calculate(b);
  const intersection=left.present.filter(n=>right.present.includes(n));
  const complement=left.missing.filter(n=>right.present.includes(n));
  return {left,right,commonNumbers:intersection,complementNumbers:complement,sharedLines:left.connected.filter(id=>right.connected.includes(id))};
}
export function formatSteps(initial){return collapse(initial).steps.join(' → ');}
