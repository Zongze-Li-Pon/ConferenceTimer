const $ = s => document.querySelector(s);
const els = {
  clock: $('#clock'), bar: $('#bar'), root: $('#root'),
  btnToggle: $('#btnToggle'), btnReset: $('#btnReset'),
  chkLoop: $('#chkLoop'), chkSound: $('#chkSound'),
  durMin: $('#durMin'), durSec: $('#durSec'),
  t1Min: $('#t1Min'), t1Sec: $('#t1Sec'),
  t2Min: $('#t2Min'), t2Sec: $('#t2Sec'),
  cBgNormal: $('#cBgNormal'), cBgT1: $('#cBgT1'), cBgT2: $('#cBgT2'),
  cDigits: $('#cDigits')
};

function clampInt(v, lo, hi){ v=Math.floor(Number(v)||0); if(lo!=null)v=Math.max(lo,v); if(hi!=null)v=Math.min(hi,v); return v; }
function toSec(min,sec){ return clampInt(min,0,1e9)*60 + clampInt(sec,0,59); }
function fmt(s){ const m=Math.floor(s/60), t=s%60; return `${String(m).padStart(2,'0')}:${String(t).padStart(2,'0')}`; }

let total=900, remain=900, running=false, last=performance.now();
let t1=60, t2=10;
let audioCtx=null;

const LS_KEY='conf_timer_v2';
function save(){
  const data={
    loop:els.chkLoop.checked,sound:els.chkSound.checked,
    durMin:els.durMin.value,durSec:els.durSec.value,
    t1Min:els.t1Min.value,t1Sec:els.t1Sec.value,
    t2Min:els.t2Min.value,t2Sec:els.t2Sec.value,
    cBgNormal:els.cBgNormal.value,cBgT1:els.cBgT1.value,cBgT2:els.cBgT2.value,cDigits:els.cDigits.value
  };
  localStorage.setItem(LS_KEY,JSON.stringify(data));
}
function restore(){
  const raw=localStorage.getItem(LS_KEY); if(!raw)return;
  try{const d=JSON.parse(raw);
    els.chkLoop.checked=!!d.loop; els.chkSound.checked=!!d.sound;
    ['durMin','durSec','t1Min','t1Sec','t2Min','t2Sec'].forEach(k=>{if(d[k]!=null)els[k].value=d[k]});
    ['cBgNormal','cBgT1','cBgT2','cDigits'].forEach(k=>{if(d[k])els[k].value=d[k]});
  }catch{}
}

function beep(){
  if(!els.chkSound.checked)return;
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value=880; g.gain.value=0.001;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.4,audioCtx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.4);
    o.stop(audioCtx.currentTime+0.45);
    if(navigator.vibrate)navigator.vibrate(200);
  }catch{}
}

function applyColors(){
  document.documentElement.style.setProperty('--bg-normal',els.cBgNormal.value);
  document.documentElement.style.setProperty('--bg-t1',els.cBgT1.value);
  document.documentElement.style.setProperty('--bg-t2',els.cBgT2.value);
  document.documentElement.style.setProperty('--digits',els.cDigits.value);
}
function applyThresholdBg(){
  let bg=getComputedStyle(document.documentElement).getPropertyValue('--bg-normal');
  if(remain<=t1) bg=getComputedStyle(document.documentElement).getPropertyValue('--bg-t1');
  if(remain<=t2) bg=getComputedStyle(document.documentElement).getPropertyValue('--bg-t2');
  document.body.style.background=bg.trim();
}
function render(){
  els.clock.textContent=fmt(remain);
  els.bar.style.width=`${Math.max(0,remain/total)*100}%`;
  applyThresholdBg();
}

function recomputeFromInputs({resetTimer=false}={}){
  total=Math.max(1,toSec(els.durMin.value,els.durSec.value));
  t1=toSec(els.t1Min.value,els.t1Sec.value);
  t2=toSec(els.t2Min.value,els.t2Sec.value);
  if(t2>t1){[t1,t2]=[t2,t1];}
  applyColors();
  if(resetTimer){remain=Math.min(remain,total);if(!running)remain=total;}
  render(); save();
}

function start(){ if(!running){running=true;last=performance.now();els.btnToggle.textContent='Pause';tick();} }
function pause(){ running=false; els.btnToggle.textContent='Start'; }
function reset(){ pause(); remain=total; render(); }

function tick(){
  if(!running)return;
  const now=performance.now(), dt=(now-last)/1000; last=now;
  if(dt>=1){
    remain=Math.max(0,remain-Math.floor(dt)); render();
    if(remain===0){beep(); if(els.chkLoop.checked){remain=total;render();}else{pause();}}
  }
  requestAnimationFrame(tick);
}

els.btnToggle.onclick=()=>running?pause():start();
els.btnReset.onclick=reset;
[
  els.chkLoop,els.chkSound,
  els.durMin,els.durSec,els.t1Min,els.t1Sec,els.t2Min,els.t2Sec,
  els.cBgNormal,els.cBgT1,els.cBgT2,els.cDigits
].forEach(el=>el.addEventListener('input',()=>recomputeFromInputs({resetTimer:true})));
els.clock.onclick=()=>running?pause():start();

let lastTap=0;
window.addEventListener('touchend',e=>{
  const now=Date.now(); if(now-lastTap<350)e.preventDefault(); lastTap=now;
},{passive:false});

restore(); recomputeFromInputs({resetTimer:true}); render();
