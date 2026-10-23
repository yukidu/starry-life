import {calculate,comparePersons,GRID_LINES,GRID_ORDER} from './numerology.mjs';
import {descriptions,lineDescriptions,zodiacThemes} from './content.mjs';

const $=selector=>document.querySelector(selector);
const htmlEscape =value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeDate =value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';
const gridPos=n=>({x:Math.floor((n-1)/3)*100+50,y:((n-1)%3)*100+50});
let lastResult=null;
let activeLine='';

function svgLines(report){
  return `<svg class="line-overlay" viewBox="0 0 300 300" aria-hidden="true" focusable="false">${GRID_LINES.filter(l=>report.connected.includes(l.id)).map(line=>{
    const points=line.cells.map(gridPos).map(p=>`${p.x},${p.y}`).join(' ');
    return `<polyline points="${points}" class="${activeLine===line.id?'chosen':''}" />`;
  }).join('')}</svg>`;
}
const layerLabels={birth:'先天數',destiny:'命數',birthday:'生日數',zodiac:'星座數',talent:'天賦數'};
// Each number always uses the same orbit colour, including on the reference chart.
const numberColors=Object.freeze({
  1:{color:'#ff9fca',name:'玫瑰星雲'},
  2:{color:'#82d9ff',name:'極光冰藍'},
  3:{color:'#fbd67b',name:'恆星金光'},
  4:{color:'#8eeab9',name:'翡翠星河'},
  5:{color:'#c6a2ff',name:'紫晶次元'},
  6:{color:'#ffad85',name:'赤焰行星'},
  7:{color:'#96b7ff',name:'深空藍鑽'},
  8:{color:'#f48df2',name:'霓虹星環'},
  9:{color:'#c2f7ed',name:'銀河薄荷'}
});

const masterNote=report=>report.destinyMaster?`<p class="master-note">✦ 特殊數 <strong>${report.destinyMaster}</strong> · 最終命數 <strong>${report.destiny}</strong></p>`:'';
function numberSources(report,n){
  return Object.entries(report.countBreakdown[n]).filter(([,count])=>count>0)
    .map(([type,count])=>`${layerLabels[type]} ${count} 次`).join('、')||'目前沒有出現';
}
/** Every occurrence becomes a separate concentric SVG circle around the centred digit.
 * Radii adapt to 1–9 occurrences without overflowing a mobile cell. */
function numberOrbits(number,count,{legend=false}={}){
  const rings=Array.from({length:count},(_,i)=>{
    const step=count>6?Math.min(5,31/(count-1)):7;
    const r=(18+i*step).toFixed(2);
    return `<circle class="orbit-ring" cx="60" cy="60" r="${r}" data-ring-index="${i+1}" />`;
  }).join('');
  return `<span class="orbit-symbol orbit-tone-${number} ${count?'has-rings':'no-rings'} ${legend?'sample':''}">
    <svg class="orbit-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${rings}</svg>
    <span class="orbit-digit">${number}</span></span>`;
}
function colorLegend(){
  return `<section class="color-reference" aria-labelledby="color-legend-title">
    <div class="panel-head"><span class="mini-label">COLOR / INDEX</span><h3 id="color-legend-title">九色星環對照</h3><p>每個數字的顏色固定。以下用 3 圈示範，實際圈數依你的計算結果顯示。</p></div>
    <div class="color-reference-grid">${Array.from({length:9},(_,i)=>i+1).map(n=>`<div class="color-swatch orbit-tone-${n}">${numberOrbits(n,3,{legend:true})}<div><strong>${n} · ${numberColors[n].name}</strong><small>3 層示範星環</small></div></div>`).join('')}</div>
    <p class="legend-footnote">◎ 1 個數字出現 1 次＝1 圈；數字本身始終在最中心。</p>
  </section>`;
}
function grid(report){
  return `<div class="grid-stage"><div class="number-grid">${svgLines(report)}${GRID_ORDER.map(n=>{
    const count=report.counts[n],derived=count>0&&report.rawCounts[n]===0;
    return `<button type="button" class="number-cell orbit-tone-${n} ${count?'lit':''} ${derived?'derived':''}" data-number="${n}" aria-label="數字${n}，總共出現${count}次，${count}個同心圓；${htmlEscape(numberSources(report,n))}" title="${htmlEscape(numberSources(report,n))}">${numberOrbits(n,count)}<small>${count?`${count} 圈 · ${numberColors[n].name}`:'未出現'}</small></button>`;
  }).join('')}</div></div>`;
}
function detailReport(report){
  const details=descriptions[report.destiny];
  const birthDigits=report.layers.birth.join('、');
  const talentDigits=report.talentDigits.join('、');
  return `<section class="personal-report" aria-labelledby="report-heading">
    <div class="mission-complete"><span><i class="status-light"></i> LIFE SIGNAL DECODED</span><span>${htmlEscape(report.rawDate)} / ANALYSIS COMPLETE</span></div>
    <div class="result-console">
      <div class="result-top"><div class="result-top-title"><span class="mini-label">YOUR CORE FREQUENCY</span><h2 id="report-heading">你的主命數</h2><p>你是 <em>${htmlEscape(details.title)}</em></p></div><div class="life-number">${report.destiny}<span class="digit-caption">LIFE / PATH</span></div>${masterNote(report)}<p class="tagline">${htmlEscape(details.keywords)}</p></div>
      <div class="result-console-detail"><span class="mini-label">SIGNAL SUMMARY / 05 SOURCES</span><h3>五種頻率，<br><em>構成你的星圖。</em></h3><div class="report-totals"><div><strong class="birth-values">${birthDigits}</strong><span>先天數</span></div><div><strong>${report.destiny}</strong><span>命數</span></div><div><strong>${report.birthday}</strong><span>生日數</span></div><div><strong>${report.zodiacNumber}</strong><span>星座數 · ${htmlEscape(report.zodiac)}</span></div><div><strong>${talentDigits}</strong><span>天賦數 · ${report.initial}</span></div></div><p class="reduction">生命數計算：${htmlEscape(report.reductionSteps.join(' → '))}</p></div>
    </div>
    <div class="result-navigation" role="group" aria-label="個人報告分頁"><span class="result-navigation-label">EXPLORE /</span><button type="button" class="result-tab selected" data-panel="rings" aria-pressed="true">◎ 九宮星環</button><button type="button" class="result-tab" data-panel="paths" aria-pressed="false">⌁ 星光連線</button><button type="button" class="result-tab" data-panel="colors" aria-pressed="false">◈ 九色圖例</button><button type="button" class="result-tab" data-panel="insights" aria-pressed="false">✦ 深度解讀</button></div>
    <div class="report-panels">
      <section class="report-pane" data-report-pane="rings"><div class="pane-heading"><div><span class="mini-label">01 / COSMIC COORDINATES</span><h3>九宮星環儀</h3><p>每次出現形成一圈，數字始終置中。選取星環，閱讀來源。</p></div><div class="pane-counter"><strong>${report.present.length}<span>/9</span></strong><small>活躍數字</small></div></div><div class="ring-reading"><div class="ring-stage">${grid(report)}</div><div class="ring-explain"><div class="ring-explain-badge">◉ INSPECTOR / 探測器</div><div id="number-note" class="number-note" aria-live="polite">點選星環上的任一數字，即可查看來源、出現次數與其象徵。</div><div class="ring-count"><strong>${Math.max(...Object.values(report.counts))}</strong><span>本次單一數字最多出現圈數</span></div><p>排列保持 <b>1／4／7</b>、<b>2／5／8</b>、<b>3／6／9</b>。每個彩色同心圓代表一次出現。</p><p>算法採用「先天數、命數、生日數、星座數、天賦數」五類來源。天賦數中每個數字各計兩次，0 不列入。</p></div></div></section>
      <section class="report-pane" data-report-pane="paths" hidden><div class="pane-heading"><div><span class="mini-label">02 / SIGNAL CONNECTIONS</span><h3>星光航線</h3><p>下方可選擇全部 12 種連線，查看是否被你的數字點亮。</p></div><div class="pane-counter"><strong>${report.connected.length}<span>/12</span></strong><small>已形成連線</small></div></div><div class="line-chips">${GRID_LINES.map(l=>`<button type="button" data-line="${l.id}" class="line-chip ${report.connected.includes(l.id)?'available':'inactive'}" aria-pressed="false"><span>${l.id}</span><small>${report.connected.includes(l.id)?'✦ 已點亮':'○ 尚未形成'}</small></button>`).join('')}</div><div id="line-note" class="line-note" aria-live="polite">點選航線名稱，查看形成條件及專屬解讀。</div></section>
      <section class="report-pane" data-report-pane="colors" hidden>${colorLegend()}</section>
      <section class="report-pane" data-report-pane="insights" hidden><div class="pane-heading"><div><span class="mini-label">04 / PERSONAL INTERPRETATION</span><h3>生命檔案</h3><p>這些文字可以用作自我探索的提問，不是命運的定論。</p></div></div><div class="insight-grid"><article class="glass-tile"><div class="tile-symbol">01</div><h3>個性與天賦</h3><p>${htmlEscape(details.strength)}</p></article><article class="glass-tile"><div class="tile-symbol">02</div><h3>生命課題</h3><p>${htmlEscape(details.challenge)}</p></article><article class="glass-tile"><div class="tile-symbol">03</div><h3>職涯靈感</h3><p>${htmlEscape(details.career)}。選擇仍應考慮能力、興趣與環境。</p></article><article class="glass-tile"><div class="tile-symbol">04</div><h3>愛情與關係</h3><p>${htmlEscape(details.relation)}</p></article><article class="glass-tile"><div class="tile-symbol">05</div><h3>星座組合</h3><p>${htmlEscape(report.zodiac)}（星座數 ${report.zodiacNumber}）在傳統占星中常連結「${htmlEscape(zodiacThemes[report.zodiac])}」。</p></article><article class="glass-tile"><div class="tile-symbol">06</div><h3>數字缺口與重複</h3><p>未出現：${report.missing.join('、')||'無'}。${report.repeated.length?`重複：${report.repeated.map(x=>`${x.number}（${x.count} 次）`).join('、')}。`:'沒有重複的數字。'}這不是能力缺陷。</p></article></div><div class="self-care"><h3>照顧自己，是所有星旅的起點</h3><p>生日數字無法推斷疾病或健康風險；重視睡眠、活動與支持性人際關係。</p></div></section>
    </div>
    <div class="report-actions"><button id="save-report" class="secondary-btn" type="button">✧ 儲存到本機</button><button id="export-report" class="secondary-btn" type="button">↓ 下載文字報告</button><button id="share-report" class="secondary-btn" type="button">↗ 分享網站</button><button id="delete-report" class="text-btn" type="button">清除本機儲存資料</button></div><p class="fineprint" id="save-status" role="status">計算只在目前裝置完成，除非選擇儲存，否則不會保存生日。</p>
  </section>`;
}
function switchReportPanel(panel){
  document.querySelectorAll('[data-panel]').forEach(b=>{
    const active=b.dataset.panel===panel;
    b.classList.toggle('selected',active);
    b.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('[data-report-pane]').forEach(pane=>{pane.hidden=pane.dataset.reportPane!==panel;});
}
function renderResult(report){
  lastResult=report;activeLine='';$('#result').innerHTML=detailReport(report);$('#result').hidden=false;
  $('#pair-a').value=report.rawDate; playUiSound('reveal',report.destiny);
  $('#result').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function renderLine(lineId){
  const line=GRID_LINES.find(l=>l.id===lineId);
  const on=lastResult.connected.includes(lineId);
  activeLine=on?lineId:'';
  document.querySelectorAll('[data-line]').forEach(el=>{
    el.setAttribute('aria-pressed',String(el.dataset.line===lineId));
    el.classList.toggle('selected',el.dataset.line===lineId);
  });
  $('#line-note').innerHTML=`<b>${htmlEscape(line.title)} (${line.id})</b><p>${on?'✦ 已形成':'○ 尚未形成'}：必須同時包含 ${line.cells.join('、')}。${htmlEscape(lineDescriptions[lineId])}</p>`;
  playUiSound('line',line.cells.length);
}
function makeReportText(report){
  const d=descriptions[report.destiny];
  return [`繁星生命靈數｜個人星圖`,`生日：${report.rawDate}`,`命數：${report.destiny}｜${d.title}`,
    `特殊數：${report.destinyMaster||'無'}`,`命數化約：${report.reductionSteps.join(' → ')}`,
    `先天數：${report.layers.birth.join('、')}`,`生日數：${report.birthday}`,
    `星座：${report.zodiac}，星座數：${report.zodiacNumber}`,
    `天賦數：${report.initial}（${report.talentDigits.join('、')}；每個數字各計兩次）`,
    `九宮排列：1、4、7／2、5、8／3、6、9`,
    `九宮出現次數：${Object.entries(report.counts).map(([k,v])=>`${k}:${v}`).join('、')}`,
    `各數字來源：${Object.keys(report.counts).map(n=>`${n}＝${numberSources(report,n)}`).join('；')}`,
    `缺數：${report.missing.join('、')||'無'}`,`形成連線：${report.connected.join('、')||'無'}`,
    `個性與天賦：${d.strength}`,`成長方向：${d.challenge}`,`職涯靈感：${d.career}`,
    `人際關係：${d.relation}`,`註：數字學為民俗娛樂與反思工具，非科學預測或健康判斷。`,
    `https://life.starry.phd/`].join('\n');
}
function downloadReport(text,file){const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

$('#calc-form').addEventListener('submit',event=>{event.preventDefault();try{$('#form-error').hidden=true;renderResult(calculate($('#birthdate').value));}catch(err){$('#form-error').textContent=err.message;$('#form-error').hidden=false;}});
$('#demo').addEventListener('click',()=>{$('#birthdate').value='1993-12-25';$('#calc-form').requestSubmit()});
$('#result').addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target||!lastResult)return;
  if(target.dataset.panel){switchReportPanel(target.dataset.panel);playUiSound('select',2);return;}
  if(target.dataset.number){const n=Number(target.dataset.number),count=lastResult.counts[n];playUiSound('select',n);$('#number-note').innerHTML=`<strong>數字 ${n} · ${descriptions[n].title}</strong><p>${count?'總計 '+count+' 次（'+htmlEscape(numberSources(lastResult,n))+'）。':'五類數字中沒有這顆星。'}${htmlEscape(descriptions[n].strength)}</p>`;return;}
  if(target.dataset.line){renderLine(target.dataset.line);return;}
  if(target.id==='save-report'){
    try{localStorage.setItem('starry-life:birthdate',lastResult.rawDate);$('#save-status').textContent='已儲存到目前裝置的瀏覽器，可隨時清除。';}catch{$('#save-status').textContent='此瀏覽器不允許本機儲存，請使用下載功能。';}
  }
  if(target.id==='delete-report'){try{localStorage.removeItem('starry-life:birthdate');}catch{} $('#save-status').textContent='已清除本機儲存資料（不影響目前星圖顯示）。';}
  if(target.id==='export-report')downloadReport(makeReportText(lastResult),`繁星生命靈數-${lastResult.rawDate}.txt`);
  if(target.id==='share-report'){try{if(navigator.share)await navigator.share({title:'繁星生命靈數',text:'一起看看你的宇宙生命星圖',url:'https://life.starry.phd/'});else{await navigator.clipboard.writeText('https://life.starry.phd/');$('#save-status').textContent='已複製網站連結。';}}catch(err){if(err.name!=='AbortError')$('#save-status').textContent='無法直接分享，請複製網址：https://life.starry.phd/';}}
});
$('#pair-form').addEventListener('submit',event=>{
  event.preventDefault();try{
    $('#pair-error').hidden=true;
    const {left,right,commonNumbers,complementNumbers,sharedLines}=comparePersons($('#pair-a').value,$('#pair-b').value);
    const common=commonNumbers.length?commonNumbers.join('、'):'無';
    $('#pair-result').innerHTML=`<div class="pair-results"><div class="pair-numbers"><div><span>第一位</span><strong>${left.destiny}</strong><p>${htmlEscape(descriptions[left.destiny].title)}${left.destinyMaster?`（特殊數 ${left.destinyMaster}）`:``}</p></div><div class="pair-heart">✧</div><div><span>第二位</span><strong>${right.destiny}</strong><p>${htmlEscape(descriptions[right.destiny].title)}${right.destinyMaster?`（特殊數 ${right.destinyMaster}）`:``}</p></div></div><h3>你們的共鳴觀察</h3><p>共同出現的數字：<b>${common}</b>。</p><p>第一位沒有、第二位出現的數字：<b>${complementNumbers.join('、')||'無'}</b>。可以把這些差異當作認識彼此的聊天題目，而不是優劣或配對分數。</p><p>共同形成的星光連線：<b>${sharedLines.join('、')||'無'}</b>。</p><p>相處小提醒：${htmlEscape(descriptions[left.destiny].relation)} ${htmlEscape(descriptions[right.destiny].relation)}</p><small>沒有科學方法能靠生日預測兩個人的關係是否成功。</small></div>`;
    $('#pair-result').hidden=false; playUiSound('reveal',left.destiny+right.destiny);
  }catch(err){$('#pair-error').textContent=err.message;$('#pair-error').hidden=false;}
});

// Prevent future dates using the local clock (no server transmission).
const today = new Date();
const localToday = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
for (const el of document.querySelectorAll('input[type=date]')) el.max = localToday;

// Load a previously consented local birthday; never auto-run or transmit.
try{const saved=safeDate(localStorage.getItem('starry-life:birthdate')||'');if(saved)$('#birthdate').value=saved;}catch{}
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}


// Quiet, synthesised notes only; no third-party audio, no autoplay, no network traffic.
// The browser creates an audio context after the user's first direct interaction.
let soundOn=false;
let soundContext;
function playUiSound(kind='tap',seed=1){
  if(!soundOn||window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const AudioConstructor=window.AudioContext||window.webkitAudioContext;
  if(!AudioConstructor) return;
  try{
    soundContext??=new AudioConstructor();
    if(soundContext.state==='suspended') void soundContext.resume();
    const now=soundContext.currentTime;
    const notes=kind==='reveal'?[0,4,7]:kind==='line'?[0,7]:[0];
    notes.forEach((note,i)=>{
      const osc=soundContext.createOscillator();const envelope=soundContext.createGain();
      const duration=kind==='reveal'?.32:.17;
      const start=now+i*.07;
      const frequency=220*Math.pow(2,(seed%12+note+12)/12);
      osc.type=kind==='reveal'?'sine':'triangle';osc.frequency.setValueAtTime(frequency,start);
      envelope.gain.setValueAtTime(.0001,start);
      envelope.gain.exponentialRampToValueAtTime(.023,start+.025);
      envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(envelope).connect(soundContext.destination);
      osc.start(start);osc.stop(start+duration+.01);
    });
  }catch{ /* Unsupported/blocked audio must never interrupt the calculator. */ }
}
const soundButtons=document.querySelectorAll('#sound-toggle, #sound-toggle-mobile');
soundButtons.forEach(button=>button.addEventListener('click',()=>{
  soundOn=!soundOn;
  soundButtons.forEach(item=>{
    item.setAttribute('aria-pressed',String(soundOn));
    item.querySelector('.sound-toggle-label').textContent=soundOn?'開啟':'關閉';
  });
  if(soundOn)playUiSound('tap',5);
}));


// Three exclusive screens, one app: the buttons work on mobile and desktop.
const SCREEN_MAP=Object.freeze({atlas:'atlas',bond:'bond',codex:'codex'});
function navigateTo(view,{track=true,focus=false}={}){
  if(!SCREEN_MAP[view])view='atlas';
  document.querySelectorAll('[data-screen]').forEach(s=>{s.hidden=s.dataset.screen!==view;});
  document.querySelectorAll('[data-view]').forEach(button=>{
    const selected=button.dataset.view===view;
    button.classList.toggle('active',selected);
    if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  if(track&&location.hash!==`#${view}`)history.pushState({view},'',`#${view}`);
  window.scrollTo({top:0,behavior:'instant'});
  if(focus){const h=document.querySelector(`[data-screen="${view}"] h1`);h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true});}
  playUiSound('select',view.length);
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-view]');
  if(button){navigateTo(button.dataset.view,{focus:true});return;}
  const link=event.target.closest?.('[data-view-link]');
  if(link){event.preventDefault();navigateTo(link.dataset.viewLink,{focus:false});}
});
window.addEventListener('popstate',()=>navigateTo(location.hash.slice(1),{track:false}));
const initialView=location.hash.slice(1);
navigateTo(SCREEN_MAP[initialView]?initialView:'atlas',{track:false});
