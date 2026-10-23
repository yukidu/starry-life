import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,comparePersons,collapse,parseBirthdate,GRID_LINES,GRID_ORDER,sinaZodiac,zodiac} from '../src/numerology.mjs';

// Oracle is deliberately separate from the application implementation.
// Based on the 2012 original iframe calculator's numGame.generate,
// numGame.addToOne, getAstroIndex and calFrequncy operations.
function originalCalculatorOracle(iso){
  const [year,month,day]=iso.split('-').map(Number);
  const input=`${String(year).padStart(4,'0')}${String(month).padStart(2,'0')}${String(day).padStart(2,'0')}`;
  const digits=[...input].map(Number).filter(Boolean);
  const total=digits.reduce((s,n)=>s+n,0);
  const reduce=n=>{do{n=[...String(n)].reduce((s,c)=>s+Number(c),0);}while(n>=10);return n;};
  const destiny=reduce(total);
  const birthday=reduce(day);
  const dates=[21,20,21,21,22,22,23,24,24,24,23,22];
  const index=(month+10+(day>=dates[month-1]?1:0))%12;
  const zodiacNumber=index<2?index+2:index>10?index-10:index-1;
  const talents=total<10?[total]:[Math.floor(total/10),total%10].filter(Boolean);
  const counts=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));
  const incr=(n,repeat=1)=>{if(n)counts[n]+=repeat;};
  digits.forEach(n=>incr(n));incr(destiny);incr(birthday);incr(zodiacNumber);talents.forEach(n=>incr(n,2));
  return {total,destiny,birthday,zodiacNumber,talents,counts};
}

test('1985-07-03 equals Sina calculator including every source and repeated 3',()=>{
  const p=calculate('1985-07-03');
  assert.equal(p.initial,33);
  assert.equal(p.destiny,6);
  assert.equal(p.destinyMaster,33);
  assert.deepEqual(p.reductionSteps,[33,6]);
  assert.deepEqual(p.layers.birth,[1,9,8,5,7,3]);
  assert.equal(p.birthday,3);
  assert.equal(p.zodiac,'巨蟹座');assert.equal(p.zodiacNumber,4);
  assert.deepEqual(p.talentDigits,[3,3]);
  assert.deepEqual(p.counts,{1:1,2:0,3:6,4:1,5:1,6:1,7:1,8:1,9:1});
  assert.deepEqual(p.missing,[2]);
  assert.deepEqual(p.countBreakdown[3],{birth:1,destiny:0,birthday:1,zodiac:0,talent:4});
  assert.deepEqual(p.connected,['4-5-6','7-8-9','1-4-7','3-6-9','1-5-9','3-5-7','4-8','6-8']);
});

test('nine grid uses top 1-4-7, middle 2-5-8, bottom 3-6-9',()=>{
  assert.deepEqual(GRID_ORDER,[1,4,7,2,5,8,3,6,9]);
  assert.deepEqual(GRID_LINES.filter(x=>x.cells.length===2).map(x=>x.id).sort(),['2-4','2-6','4-8','6-8']);
  assert.equal(GRID_LINES.length,12);
});

test('four published sums and no master cutoff in old calculator',()=>{
  const inputs=[['1976-07-06',36,9],['1993-12-25',32,5],['1984-10-29',34,7],['1973-04-05',29,2]];
  for(const [date,total,destiny] of inputs){const p=calculate(date);assert.equal(p.initial,total);assert.equal(p.destiny,destiny);}
  assert.deepEqual(calculate('1973-04-05').reductionSteps,[29,11,2]);
  assert.equal(calculate('1973-04-05').destinyMaster,11);
  assert.deepEqual(calculate('1984-10-29').birthdaySteps,[29,11,2]);
  assert.equal(calculate('1984-10-29').birthday,2);
});

test('collapse can still show a stopped editorial master for explanation only',()=>{
  assert.equal(collapse(33).number,6);
  assert.equal(collapse(22).number,4);
  assert.equal(collapse(11).number,2);
  assert.equal(collapse(11,{preserveMasters:true}).number,11);
  assert.equal(collapse(29,{preserveMasters:true}).number,11);
});

test('Sina historic zodiac boundary rules (not modern generic zodiac cutoffs)',()=>{
  assert.deepEqual(sinaZodiac(7,3),{name:'巨蟹座',number:4});
  assert.deepEqual(sinaZodiac(7,23),{name:'獅子座',number:5});
  assert.deepEqual(sinaZodiac(3,20),{name:'雙魚座',number:3});
  assert.deepEqual(sinaZodiac(3,21),{name:'牡羊座',number:1});
  assert.equal(zodiac(12,31),'摩羯座');
  assert.equal(sinaZodiac(1,21).number,2);
});

test('independent oracle agrees with implementation for many birthdays',()=>{
  for(const year of [1900,1948,1973,1985,1993,2000,2024]){
    for(const month of [1,2,3,5,7,9,12]){
      for(const day of [3,15,27]){
        const d=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const p=calculate(d),oracle=originalCalculatorOracle(d);
        assert.deepEqual({total:p.initial,destiny:p.destiny,birthday:p.birthday,zodiacNumber:p.zodiacNumber,talents:p.talentDigits,counts:p.counts},oracle,`Sina calculator mismatch on ${d}`);
      }
    }
  }
});

test('date and leap year validation is strict',()=>{
  assert.throws(()=>parseBirthdate('2025-02-29'));
  assert.equal(parseBirthdate('2024-02-29').day,29);
  assert.throws(()=>parseBirthdate('2000-13-01'));
  assert.throws(()=>parseBirthdate('2023-04-31'));
  assert.throws(()=>parseBirthdate('garbage'));
});

test('repeat calculations and comparisons do not leak frequencies across users',()=>{
  const first=calculate('1985-07-03');
  const compare=comparePersons('1985-07-03','1973-04-05');
  assert.equal(compare.left.destiny,6);
  assert.equal(compare.right.destiny,2);
  assert.equal(compare.right.destinyMaster,11);
  assert.deepEqual(calculate('1985-07-03').counts,first.counts);
  assert.ok(compare.commonNumbers.includes(4));
});

test('zero never appears as a grid number',()=>{
  const p=calculate('2000-01-01');
  assert.equal(Object.keys(p.counts).length,9);
  assert.equal(p.present.includes(0),false);
  assert.equal(p.layers.birth.includes(0),false);
});
