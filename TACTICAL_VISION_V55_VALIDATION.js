const fs=require('fs');
const vm=require('vm');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');

function extractFunction(name){
  const marker=`function ${name}(`;
  const start=game.indexOf(marker);
  if(start<0)throw new Error(`Missing ${name}`);
  const brace=game.indexOf('{',start);
  let depth=0, quote=null, esc=false, templateDepth=0;
  for(let i=brace;i<game.length;i++){
    const ch=game[i], prev=game[i-1];
    if(quote){
      if(esc){esc=false;continue}
      if(ch==='\\'){esc=true;continue}
      if(ch===quote){quote=null;continue}
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0)return game.slice(start,i+1);
    }
  }
  throw new Error(`Unclosed ${name}`);
}

const checks=[];
const check=(name,ok)=>checks.push([name,!!ok]);
check('v55 marker',game.includes("__TACTICAL_TRAINING_VERSION='v55.0-tactical-vision-continuous-runtime-recovery'"));
check('v55 cache bust',html.includes('game.js?v=55.0.0')&&html.includes('styles.css?v=55.0.0'));
check('scan window can release incoming pass',game.includes("['PRE_RECEIVE','SCAN_WINDOW'].includes(t.state)&&!t.deliveryReleased"));
check('scan release uses one-shot delivery flag',game.includes('t.deliveryReleased=true'));
check('successful pass uses TEAMMATE_CONTROL not a dead outcome',game.includes("tacticalSetState(s,'TEAMMATE_CONTROL'"));
check('successful pass continuation is frame driven',game.includes("t.continuationAt=performance.now()+260")&&game.includes('tacticalBeginNextVisionScenario'));
check('interception uses recover continuation',game.includes("tacticalSetState(s,'RECOVER','PASS INTERCEPTED'"));
check('decision timeout has no hard stop',game.includes("t.continuationReason='vision-decision-timeout'"));
check('runtime frame loop has fault recovery',game.includes('try{const now=performance.now()')&&game.includes('catch(error){tacticalRuntimeRecover'));
check('runtime recovery always reschedules animation frame',game.includes("if(trainingGameState===s&&!s.finishing)s.raf=requestAnimationFrame(updateTacticalTraining)"));
check('teammates use stable tactical IDs',game.includes('p.tacticalId=`tactical-mate-${i}`'));
check('opponents use stable tactical IDs',game.includes('p.tacticalId=`tactical-opponent-${i}`'));
check('ball ownership resolves tactical IDs',game.includes('function tacticalActorToken')&&game.includes('tacticalId===id'));
check('pass release stores stable intended token',game.includes('s.ball.intendedId=intendedToken'));
check('pass resolution stores stable receiver token',game.includes('flight.receiverId=tacticalActorToken(s,actor)'));
check('liveness fallback exists',game.includes("tacticalBeginNextVisionScenario(s,'vision-liveness-fallback')"));

let now=1000;
const events=[];
const context={
  performance:{now:()=>now},
  console,
  window:{},
  trainingGameState:null,
  tacticalStreakMultiplier:()=>1,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  lerp:(a,b,t)=>a+(b-a)*t,
  tacticalScore:(s,p,l)=>events.push(['score',l]),
  tacticalFeedback:(...a)=>events.push(['feedback',...a]),
  tacticalUpdateControlState:()=>{},
  tacticalScheduleScenarioReset:(s,delay,reason)=>{s.tactical.resetQueued=now+delay;s.tactical.resetReason=reason},
  tacticalSetState:(s,state,obj,detail)=>{s.tactical.state=state;s.tactical.stateAge=0;s.tactical.objective=obj;s.tactical.detail=detail;events.push(['state',state])},
  tacticalReleaseBall:(s,actor,target,action,power,lift)=>{s.ball.free=true;s.ball.intendedId=target===s.player?'user':target.tacticalId;s.tactical.ownerId=null;s.tactical.passFlight={startedAt:now,resolved:false};events.push(['release',action]);return true},
  tacticalMoveActor:()=>{},
  tacticalNearestActorToBall:s=>s.tactical.mates?.[0]||null,
  tacticalGiveBall:(s,actor,reason)=>{s.ball.free=false;s.tactical.ownerId=actor===s.player?'user':actor.tacticalId;events.push(['give',reason])},
  tacticalOwner:s=>{
    if(s.tactical.ownerId==='user')return s.player;
    return [...(s.tactical.mates||[]),...(s.tactical.opponents||[])].find(p=>p.tacticalId===s.tactical.ownerId)||null;
  },
  tacticalResolvePassFlight:()=>{},
  tacticalActorToken:(s,a)=>a===s.player?'user':a?.tacticalId||null,
};
vm.createContext(context);
for(const name of ['tacticalBeginNextVisionScenario','tacticalVisionPassWatchdog','tacticalUpdateVision','tacticalOnPossession']){
  vm.runInContext(extractFunction(name),context);
}

const makeState=()=>{
  const player={x:50,y:70,team:0};
  const mate={x:70,y:50,team:0,tacticalId:'tactical-mate-1'};
  const foe={x:55,y:55,team:1,tacticalId:'tactical-opponent-0'};
  const passer={x:24,y:70,team:0,tacticalId:'tactical-mate-0'};
  return {
    duration:60,attempts:0,segments:Array.from({length:5},()=>({attempts:0,success:0})),streak:0,bestStreak:0,multiplier:1,score:0,successes:0,hits:0,mistakes:0,accuracySamples:[],
    player,ball:{free:false,status:'owned',x:24,y:70,z:0,vx:0,vy:0,vz:0},
    tactical:{drill:'mental',state:'PRE_RECEIVE',stateAge:.56,deliveryReleased:false,scanUsed:false,sequence:1,passer,mates:[passer,mate],opponents:[foe],difficulty:{decision:4.8,pressure:.78},metrics:{poor:0,decisions:0,optimal:0,good:0},bestOption:mate,goodOptions:[],ownerId:'tactical-mate-0',resetQueued:0,continuationAt:0,passFlight:null,elapsed:5,xp:{}},
  };
};

// Actual extracted update function: PRE_RECEIVE must release.
{
  const s=makeState();context.tacticalUpdateVision(s,.016);
  check('runtime PRE_RECEIVE advances to RECEIVE',s.tactical.state==='RECEIVE'&&s.tactical.deliveryReleased===true&&s.ball.free===true);
}
// Actual scan bug regression: scanning changes state before delivery, but pass must still launch.
{
  const s=makeState();s.tactical.state='SCAN_WINDOW';s.tactical.stateAge=.21;s.tactical.scanUsed=true;context.tacticalUpdateVision(s,.016);
  check('runtime SCAN_WINDOW still launches incoming ball',s.tactical.state==='RECEIVE'&&s.tactical.deliveryReleased===true&&events.some(e=>e[0]==='release'));
}
// Full decision-success-continuation cycle using extracted functions.
{
  const s=makeState();s.tactical.state='RECEIVE';s.tactical.stateAge=.2;s.tactical.ownerId='user';s.ball.free=false;
  context.tacticalOnPossession(s,s.player,'intended');
  const decisionOk=s.tactical.state==='DECISION';
  s.tactical.state='EXECUTION';s.tactical.stateAge=.4;s.tactical.ownerId='tactical-mate-1';
  context.tacticalOnPossession(s,s.tactical.mates[1],'intended');
  const controlled=s.tactical.state==='TEAMMATE_CONTROL'&&s.tactical.continuationAt>now;
  now=s.tactical.continuationAt+1;
  context.tacticalVisionPassWatchdog(s);
  const continued=s.tactical.state==='NEXT_SCENARIO'&&s.tactical.resetQueued>now;
  check('runtime full successful pass cycle reaches next scenario',decisionOk&&controlled&&continued);
}
// Interception cannot freeze.
{
  const s=makeState();s.tactical.state='EXECUTION';s.tactical.ownerId='tactical-opponent-0';s.ball.free=false;
  context.tacticalOnPossession(s,s.tactical.opponents[0],'interception');
  const recover=s.tactical.state==='RECOVER'&&s.tactical.continuationAt>now;
  now=s.tactical.continuationAt+1;context.tacticalVisionPassWatchdog(s);
  check('runtime interception reaches next scenario',recover&&s.tactical.state==='NEXT_SCENARIO');
}
// 50 repeated extracted state cycles must never stop in execution/team control.
{
  let ok=true;
  for(let i=0;i<50;i++){
    const s=makeState();s.tactical.state='SCAN_WINDOW';s.tactical.stateAge=.25;s.tactical.scanUsed=true;context.tacticalUpdateVision(s,.016);
    if(s.tactical.state!=='RECEIVE'){ok=false;break}
    s.tactical.ownerId='user';s.ball.free=false;context.tacticalOnPossession(s,s.player,'intended');
    if(s.tactical.state!=='DECISION'){ok=false;break}
    s.tactical.state='EXECUTION';s.tactical.ownerId='tactical-mate-1';context.tacticalOnPossession(s,s.tactical.mates[1],'intended');
    if(s.tactical.state!=='TEAMMATE_CONTROL'){ok=false;break}
    now=s.tactical.continuationAt+1;context.tacticalVisionPassWatchdog(s);
    if(s.tactical.state!=='NEXT_SCENARIO'){ok=false;break}
    now+=100;
  }
  check('50 extracted pass cycles produce zero stuck states',ok);
}

let passed=0;
for(const [name,ok] of checks){if(ok){passed++;console.log('PASS',name)}else console.error('FAIL',name)}
console.log(`\nTactical Vision v55 validation: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
