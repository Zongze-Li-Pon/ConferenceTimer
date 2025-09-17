const clock = document.getElementById('clock');
const toggleBtn = document.getElementById('toggle');
const resetBtn = document.getElementById('reset');
const minsSel = document.getElementById('mins');
const loopChk = document.getElementById('loop');

let total = 15*60, remain = total;
let running = false, last = Date.now();

function fmt(s){
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function render(){
  clock.textContent = fmt(remain);
  if (remain <= 10) clock.style.color = "#f00";
  else if (remain <= 60) clock.style.color = "#ff0";
  else clock.style.color = "#0f8";
}

function tick(){
  if (!running) return;
  const now = Date.now();
  const dt = Math.floor((now - last)/1000);
  if (dt >= 1){
    remain = Math.max(0, remain - dt);
    last = now;
    render();
    if (remain === 0){
      beep();
      if (loopChk.checked){
        remain = total;
        render();
      } else {
        running = false;
        toggleBtn.textContent = "Start";
      }
    }
  }
  requestAnimationFrame(tick);
}

function beep(){
  if (navigator.vibrate) navigator.vibrate(200);
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  osc.type = "sine"; osc.frequency.value = 880;
  osc.connect(audio.destination);
  osc.start(); osc.stop(audio.currentTime+0.3);
}

toggleBtn.onclick = () => {
  running = !running;
  toggleBtn.textContent = running ? "Pause" : "Start";
  last = Date.now();
  tick();
};
resetBtn.onclick = () => {
  running = false;
  remain = total;
  render();
  toggleBtn.textContent = "Start";
};
minsSel.onchange = () => {
  total = parseInt(minsSel.value,10)*60;
  remain = total;
  render();
};
render();
