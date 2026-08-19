// Regression checks for the v75.1 training-session playthrough audit.
// Run: node TRAINING_PLAYTHROUGH_V75_1_VALIDATION.js
const fs=require('fs'),vm=require('vm');
const game=fs.readFileSync('game.js','utf8'),html=fs.readFileSync('index.html','utf8');
function fn(name){const m=`function ${name}(`,st=game.indexOf(m);if(st<0)throw Error(name);const b=game.indexOf('{',st);let d=0,q=null,e=false;for(let i=b;i<game.length;i++){const c=game[i];if(q){if(e){e=false;continue}if(c.charCodeAt(0)===92){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return game.slice(st,i+1)}throw Error('unclosed '+name)}
const C=[];const ck=(n,v)=>C.push([n,!!v]);

{
  // match the real asset tags, not the v52 compatibility comment
  const g=html.match(/src="game\.js\?v=([\d.]+)"/),s=html.match(/href="styles\.css\?v=([\d.]+)"/);
  const parts=g?g[1].split('.').map(Number):[];
  const ok=!!g&&!!s&&g[1]===s[1]&&(parts[0]>75||(parts[0]===75&&parts[1]>=1));
  ck(`cache tokens in sync and at least 75.1.0 (found ${g?g[1]:'none'})`,ok);
}

// --- 1. Protect the Ball: contest is gated on a live duel -------------------
const protect=fn('technicalProtectUpdate');
ck('protect: duelLive flag derived from phase', /const duelLive=t\.phase==='shield'\|\|t\.phase==='turn'/.test(protect));
ck('protect: contact requires a live duel', protect.includes('contact=duelLive&&l<5.4'));
ck('protect: loss is gated on duelLive', protect.includes('if(duelLive&&t.pressure>=1)'));
ck('protect: duel loss clears pressure/hold/stationary', /if\(duelLive&&t\.pressure>=1\)\{t\.pressure=0;t\.hold=0;t\.stationary=0;/.test(protect));
ck('protect: reset gate still present', protect.includes("if(t.phase==='reset'&&performance.now()>=t.resetAt)technicalSetupProtect(s)"));

// --- 2. First Touch Escape: the service phase has a watchdog ----------------
const setupFT=fn('technicalSetupFirstTouch'),ft=fn('technicalFirstTouchUpdate');
ck('first touch: setup stamps serviceAt', setupFT.includes("t.phase='service';t.serviceAt=performance.now();"));
ck('first touch: watchdog measures service age', ft.includes('const svcAge=(performance.now()-(t.serviceAt||performance.now()))/1000'));
ck('first touch: watchdog covers out-of-pitch service', ft.includes('svcOut=s.ball.x<2||s.ball.x>98||s.ball.y<2||s.ball.y>98'));
ck('first touch: watchdog covers a dead out-of-reach ball', ft.includes('svcDead=Math.hypot(s.ball.vx||0,s.ball.vy||0)<2.5'));
ck('first touch: watchdog resets the scenario with a scored miss', /if\(svcOut\|\|svcAge>5\|\|\(svcDead&&svcAge>1\.6\)\)\{technicalScore\(s,0,'SERVICE MISSED[^']*',\.15,false\);t\.phase='reset'/.test(ft));
ck('first touch: reception cannot fire after a watchdog reset', ft.includes("if(t.phase==='service'&&Math.hypot(s.ball.x-s.player.x,s.ball.y-s.player.y)<4.7&&s.ball.z<9)"));

// --- 3. Modal class cleanup -------------------------------------------------
const close=fn('closeTrainingDrill'),open=fn('openTrainingDrillCore');
for(const cls of ['passing-academy-live','passing-academy-ui','gym-bench-ui','race-ui','tactical-training-ui','tactical-setup','tactical-live-session'])
  ck(`close clears ${cls}`, close.includes(`'${cls}'`));
ck('open clears passing-academy-live before setup', open.includes("classList.remove('swim-live-session','penalty-live-session','corner-live-session','defensive-live-session','passing-academy-live'"));
ck('every class the modal can gain is cleared on close',(()=>{
  const gained=new Set();
  for(const m of open.matchAll(/#trainingGameModal'\)\.classList\.toggle\('([a-z0-9-]+)'/g))gained.add(m[1]);
  const cleared=new Set([...close.matchAll(/'([a-z0-9-]+)'/g)].map(m=>m[1]));
  return [...gained].every(c=>cleared.has(c));
})());

// --- 4. The rule that made the leak fatal still only fires on a live session -
const css=fs.readFileSync('styles.css','utf8');
ck('start button is only disabled by live-session classes',
  /#trainingGameModal\.passing-academy-live #startTrainingGame/.test(css));

// --- 5. Live behaviour of the protect-the-ball contest ----------------------
// Replays the duel maths outside the browser to prove the runaway loop is gone.
{
  let now=1000,scored=0,recoveries=0;
  const x={performance:{now:()=>now},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,console,
    technicalDifficultyProfile:()=>({pressure:1,space:1,assist:1}),
    technicalAttributes:()=>({strength:55,balance:55,firstTouch:55}),
    technicalScore:()=>{scored++},
    technicalSetFeedback:()=>{},technicalSetObjective:()=>{},
    technicalSetupProtect:s=>{recoveries++;s.technical.phase='shield';s.technical.pressure=0;s.technical.hold=0;s.technical.stationary=0},
    // the boot-line anchor needs the live stage rect, so stand in for it with
    // the same shape: a small lateral offset plus a downward drop to the feet
    defensiveBallContactAnchor:(p,side=0)=>({x:(p?.x||50)+(side||0)*.8,y:(p?.y||50)+2.9}),
    // shield / barge presentation hooks - no gameplay effect, so stub them out
    setTrainingVisualAction:()=>{},technicalSetStageState:()=>{},technicalContactShake:()=>{},
    technicalBallPhysics:(st,d)=>{const b=st.ball;if(!b?.free)return;b.x+=(b.vx||0)*d;b.y+=(b.vy||0)*d}};
  vm.createContext(x);vm.runInContext(fn('technicalBallAnchor'),x);vm.runInContext(protect,x);
  // Defender parked on top of a motionless, unshielded user: the worst case.
  const s={player:{x:50,y:59,dir:-Math.PI/2,vx:0,vy:0},ball:{x:50,y:55,z:0},keys:new Set(),
    technical:{phase:'shield',pressure:0,hold:0,stationary:0,variant:0,metrics:{duelsWon:0,successfulTurns:0},
      defender:{x:50,y:62,vx:0,vy:0,dir:0}}};
  for(let i=0;i<600;i++){now+=16;x.technicalProtectUpdate(s,1/60)}   // 10 simulated seconds
  ck('protect: no per-frame failure spam over 10s', scored>0&&scored<20);
  ck('protect: scenario recycles instead of locking in reset', recoveries>0&&scored-recoveries<=1);
}

let pass=0;for(const [n,v] of C){console.log(v?'PASS':'FAIL',n);if(v)pass++}
console.log(`\nTraining playthrough v75.1: ${pass}/${C.length} checks passed`);
if(pass!==C.length)process.exit(1);
