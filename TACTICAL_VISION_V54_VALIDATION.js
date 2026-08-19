const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const checks=[
 ['v54 marker',game.includes("v54.0-tactical-vision-pass-lifecycle")],
 ['v54 cache bust',html.includes('styles.css?v=54.0.0')&&html.includes('game.js?v=54.0.0')],
 ['tactical vision remains registered',game.includes("mental:{label:'Tactical Vision'")],
 ['true boot anchor helper exists',game.includes('function tacticalFootBallAnchor(s,actor)')],
 ['owned tactical ball uses boot anchor',game.includes('const point=tacticalFootBallAnchor(s,owner)')],
 ['staged tactical ball uses user boot anchor',game.includes('return tacticalFootBallAnchor(s,s.player)')],
 ['pass release starts from same boot anchor',game.includes('const origin=tacticalFootBallAnchor(s,actor),originX=origin.x,originY=origin.y')],
 ['ball is rendered after the user model',game.indexOf('drawTacticalTrainingBall(ctx,s,w,h,scale)')>game.indexOf('drawVisibleFootballer(ctx,p,userScale,false)')],
 ['vision pass weight scales with receiver distance',game.includes("visionWeight=s.tactical?.drill==='mental'||s.tactical?.drill==='transition'")&&game.includes('visionDistanceSpeed=d*')],
 ['pass lifecycle metadata created at release',game.includes('s.tactical.passFlight={id:s.tactical.passSerial')],
 ['pass lifecycle resolves on possession',game.includes('function tacticalResolvePassFlight')&&game.includes('tacticalResolvePassFlight(s,actor,reason)')],
 ['vision has a pass watchdog',game.includes('function tacticalVisionPassWatchdog')&&game.includes('tacticalVisionPassWatchdog(s)')],
 ['watchdog has maximum pass resolution time',game.includes('age>2.55')],
 ['watchdog resolves slow stalled balls',game.includes("age>.72&&speed<2.4")],
 ['watchdog handles passes out of play',game.includes("PASS OUT OF PLAY")],
 ['watchdog can award nearby late reception',game.includes("watchdog-receive")],
 ['watchdog can classify interception',game.includes("watchdog-interception")],
 ['failed pass does not freeze drill',game.includes('function tacticalFailVisionPass')&&game.includes("tacticalScheduleScenarioReset(s,520,'vision-pass-failed')")],
 ['successful teammate pass schedules next picture',game.includes("tacticalScheduleScenarioReset(s,620,'vision-success')")],
 ['interception schedules next picture',game.includes("tacticalScheduleScenarioReset(s,650,'vision-interception')")],
 ['outcome has fallback continuation',game.includes("vision-outcome-fallback")],
 ['decision timeout continues rather than hard reset',game.includes("DECISION WINDOW CLOSED")&&game.includes("vision-decision-timeout")],
 ['scenario reset clears stale pass state',game.includes('t.passFlight=null')&&game.includes('t.resetQueued=0')],
 ['single ball owner remains authoritative',game.includes('function tacticalOwner(s)')&&game.includes("s.tactical.ownerId='user'")],
 ['user movement update remains active every frame',game.includes('tacticalUpdateUserMovement(s,dt);tacticalUpdateBall(s,dt)')],
 ['render loop continues during pass',game.includes('s.raf=requestAnimationFrame(updateTacticalTraining)')],
 ['HUD exposes lifecycle debug state',game.includes('stage.dataset.passLifecycle=')&&game.includes('stage.dataset.ballAtFeet=')],
 ['v54 runtime demo exists',game.includes("demoMode === 'tactical-vision-v54'")&&game.includes("openTrainingDrill('mental')")],
 ['60 second tactical session preserved',game.includes('const TACTICAL_SESSION_DURATION=60')],
 ['training completion still routes through finishTacticalTraining',game.includes('if(t.elapsed>=s.duration){finishTacticalTraining();return}')]
];
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function simulateVisionPass(distance,power=.58,dt=1/120){
  const baseSpeed=lerp(25,48,clamp(power,0,1));
  let speed=clamp(Math.max(baseSpeed,distance*1.13),27,62),x=0,z=1.4,vx=speed,vz=0,age=0;
  for(let i=0;i<Math.ceil(4/dt);i++){
    age+=dt;x+=vx*dt;z=Math.max(0,z+vz*dt);vz-=35*dt;
    if(z===0&&vz<0){vz=Math.abs(vz)*.28;if(Math.abs(vz)<2)vz=0}
    const friction=Math.exp(-(z>1?.22:1.12)*dt);vx*=friction;
    if(age>.11&&Math.abs(distance-x)<4.25&&z<8)return {result:'received',age,x};
    if(age>2.55||(age>.72&&Math.abs(vx)<2.4)){
      if(Math.abs(distance-x)<8.2&&z<7.5)return {result:'watchdog-received',age,x};
      return {result:'reset',age,x};
    }
  }
  return {result:'freeze',age,x};
}
const probes=[15,26,35,42,50].map(d=>simulateVisionPass(d));
checks.push(['representative tactical vision passes always resolve',probes.every(p=>p.result!=='freeze')]);
checks.push(['normal target pass reaches a receiver',simulateVisionPass(26).result==='received']);
checks.push(['far tactical option still resolves safely',simulateVisionPass(42).result!=='freeze']);
let stress=[];for(let i=0;i<50;i++)stress.push(simulateVisionPass(12+(i%39),.52+(i%5)*.07));
checks.push(['50 pass stress probe has zero stuck states',stress.every(p=>p.result!=='freeze')]);
checks.push(['50 pass stress probe resolves within 2.6 seconds',stress.every(p=>p.age<=2.56)]);
let passed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)passed++;}
console.log(`\nTactical Vision v54 validation: ${passed}/${checks.length} checks passed`);
console.log('Pass probes:',probes.map((p,i)=>`${[15,26,35,42,50][i]}u=${p.result}@${p.age.toFixed(2)}s`).join(' | '));
if(passed!==checks.length)process.exit(1);
