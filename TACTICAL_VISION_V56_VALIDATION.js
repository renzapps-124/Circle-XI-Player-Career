const fs=require('fs');
const vm=require('vm');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');

function extractFunction(name){
  const marker=`function ${name}(`,start=game.indexOf(marker);if(start<0)throw new Error(`Missing ${name}`);const brace=game.indexOf('{',start);let depth=0,quote=null,esc=false;
  for(let i=brace;i<game.length;i++){const ch=game[i];if(quote){if(esc){esc=false;continue}if(ch==='\\'){esc=true;continue}if(ch===quote)quote=null;continue}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return game.slice(start,i+1)}throw new Error(`Unclosed ${name}`)
}
const checks=[];const check=(name,ok)=>checks.push([name,!!ok]);
check('v56 build marker',game.includes("__TACTICAL_TRAINING_VERSION='v56.0-tactical-vision-scan-receive-pressure-loop'"));
check('v56 cache bust',html.includes('game.js?v=56.0.0')&&html.includes('styles.css?v=56.0.0'));
check('new scan receive pass state chain',game.includes("states:['SCENARIO_SETUP','WAITING_FOR_PASS','PRE_RECEIVE_SCAN','FIRST_TOUCH','DECISION_WINDOW','USER_PASS','PASS_RESOLUTION','FEEDBACK','RESET','NEXT_SCENARIO']"));
check('scenario starts off ball with feeder',game.includes("tacticalGiveBall(s,t.passer,'setup');tacticalSetState(s,'WAITING_FOR_PASS'"));
check('incoming pass starts automatically',game.includes("t.state==='WAITING_FOR_PASS'&&!t.deliveryReleased")&&game.includes("tacticalReleaseBall(s,t.passer,s.player,'pass'"));
check('scan is required before receiving not after',game.includes("['WAITING_FOR_PASS','PRE_RECEIVE_SCAN'].includes(t.state)")&&game.includes('NO PRE-RECEIVE SCAN'));
check('scan timing grades exist',['EARLY SCAN','GOOD SCAN','PERFECT SCAN','LATE SCAN'].every(x=>game.includes(x)));
check('vision controls scan information count',game.includes('vision>=82?3:vision>=62?2:1'));
check('pre-receive passing cannot be buffered in vision drill',game.includes("t.drill==='mental'&&t.ownerId!=='user'")&&game.includes('SCAN WITH M BEFORE RECEIVING'));
check('presser interceptor and cover roles exist',game.includes('t.visionRoles={presser,interceptor,covers}')&&game.includes('incomingInterceptorActive'));
check('incoming pass can be intercepted',game.includes('INCOMING PASS INTERCEPTED')&&game.includes('PASS CUT OUT'));
check('press can dispossess slow user',game.includes('DISPOSSESSED · RELEASE EARLIER')&&game.includes('pressContactAge'));
check('pass resolution distinguishes lane interception',game.includes('INTERCEPTED · LANE CLOSED'));
check('quick release and beating press are scored',game.includes('quickRelease')&&game.includes('beatPress')&&game.includes('progressivePasses'));
check('successful repetition automatically continues',game.includes("t.continuationReason='vision-success'")&&game.includes("tacticalSetState(s,'FEEDBACK'"));
check('watchdog covers pass resolution',game.includes("['PASS_RESOLUTION','USER_PASS'].includes(t.state)")&&game.includes('PASS UNREACHED'));
check('permanent pass target assistance hidden in tactical vision',game.includes("t.ownerId==='user'&&(t.drill!=='mental'||performance.now()<t.scanVisibleUntil)"));
check('scan snapshot rather than permanent picture',game.includes('t.scanSnapshot=options.slice')&&game.includes("t.drill==='mental'?(t.scanSnapshot||[]).map"));
check('runtime liveness fallback remains',game.includes("vision-liveness-fallback")&&game.includes("INCOMING PASS STALLED"));

let now=1000;const events=[];
const career={player:{attrs:{vision:86,decisions:84,composure:81,firstTouch:84,technique:82,balance:74,strength:67,passing:88}}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const context={performance:{now:()=>now},console,career,window:{},document:{querySelectorAll:()=>[]},setTimeout:(fn)=>0,clearTimeout:()=>{},clamp,lerp,
  $:()=>null,tacticalStreakMultiplier:()=>1,tacticalFeedback:(...a)=>events.push(['feedback',...a]),tacticalUpdateControlState:()=>{},
  tacticalScore:(s,p,label,q,success)=>{events.push(['score',label,p,success]);if(success)s.score=(s.score||0)+Math.max(0,p);else s.mistakes=(s.mistakes||0)+1},
  tacticalSetState:(s,state,obj,detail)=>{s.tactical.state=state;s.tactical.stateAge=0;s.tactical.objective=obj;s.tactical.detail=detail;events.push(['state',state])},
  tacticalScheduleScenarioReset:(s,delay,reason)=>{s.tactical.resetQueued=now+delay;s.tactical.resetReason=reason},
  tacticalFootBallAnchor:(s,a)=>({x:a.x,y:a.y+3.4,z:0}),
  tacticalReleaseBall:(s,actor,target,action)=>{s.tactical.ownerId=null;s.ball.free=true;s.ball.status='released';s.ball.x=actor.x;s.ball.y=actor.y;s.ball.intendedId=target===s.player?'user':target.tacticalId;s.ball.intendedTeam=target.team??0;s.ball.releaseAge=0;s.ball.incomingSpeed=32;s.tactical.passFlight={startedAt:now,resolved:false};events.push(['release',action]);return true},
  tacticalMoveActor:(p,x,y,dt,speed)=>{const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*speed*dt;p.y+=dy/d*speed*dt;events.push(['move',p.tacticalId])},
  tacticalNearestActorToBall:s=>[s.player,...s.tactical.mates,...s.tactical.opponents].sort((a,b)=>Math.hypot(a.x-s.ball.x,a.y-s.ball.y)-Math.hypot(b.x-s.ball.x,b.y-s.ball.y))[0],
  tacticalResolvePassFlight:(s,a)=>{if(s.tactical.passFlight)s.tactical.passFlight.resolved=true},
  tacticalUpdateHud:()=>{},beep:()=>{},trainingGameState:null
};
vm.createContext(context);
for(const name of ['distancePointToSegment','tacticalVisionAssessOptions','tacticalVisionBuildScanSnapshot','tacticalVisionSetDefenderRoles','tacticalVisionDecisionWindow','tacticalVisionIncomingProgress','tacticalBeginNextVisionScenario','tacticalFailVisionPass','tacticalVisionPassWatchdog','tacticalOnPossession','tacticalPerformScan','tacticalUpdateVision']) vm.runInContext(extractFunction(name),context);
context.tacticalActorToken=(s,a)=>a===s.player?'user':a?.tacticalId||null;
context.tacticalOwner=s=>{if(s.tactical.ownerId==='user')return s.player;return [...s.tactical.mates,...s.tactical.opponents].find(x=>x.tacticalId===s.tactical.ownerId)||null};
context.tacticalGiveBall=(s,a,reason)=>{s.ball.free=false;s.tactical.ownerId=a===s.player?'user':a.tacticalId;s.player.hasBall=a===s.player;context.tacticalOnPossession(s,a,reason)};

function makeState(){
  const player={x:50,y:70,team:0,hasBall:false};
  const mates=[{x:24,y:71,team:0,tacticalId:'m0'},{x:76,y:67,team:0,tacticalId:'m1'},{x:36,y:40,team:0,tacticalId:'m2'},{x:67,y:34,team:0,tacticalId:'m3'}];
  const foes=[{x:42,y:57,team:1,tacticalId:'o0'},{x:59,y:58,team:1,tacticalId:'o1'},{x:48,y:48,team:1,tacticalId:'o2'},{x:72,y:47,team:1,tacticalId:'o3'},{x:28,y:49,team:1,tacticalId:'o4'}];
  const s={player,ball:{free:false,status:'owned',x:24,y:71,z:0,vx:0,vy:0,vz:0},score:0,mistakes:0,tactical:{drill:'mental',state:'WAITING_FOR_PASS',stateAge:.3,sequence:1,deliveryReleased:false,scanUsed:false,scanVisibleUntil:0,scanSnapshot:[],scanDanger:[],mates,opponents:foes,difficulty:{pressure:.78,decision:4.8,assist:.58},dynamicIntensity:1,metrics:{firstTouches:0,passes:0,scans:0,perfectScans:0,noScans:0,decisions:0,optimal:0,good:0,poor:0,quickRelease:0,beatPress:0,progressivePasses:0,dispossessed:0,incomingInterceptions:0},ownerId:'m0',passer:mates[0],goodOptions:[],passFlight:null,resetQueued:0,continuationAt:0,xp:{}}};
  context.tacticalVisionAssessOptions(s);context.tacticalVisionSetDefenderRoles(s,2);return s;
}

// 1: feeder releases and user must scan while pass is live.
{
  const s=makeState();context.tacticalUpdateVision(s,.016);check('runtime feeder enters PRE_RECEIVE_SCAN',s.tactical.state==='PRE_RECEIVE_SCAN'&&s.ball.free&&s.ball.intendedId==='user');
  s.ball.x=38;s.ball.y=70;s.tactical.stateAge=.25;now+=300;context.tacticalPerformScan(s);check('runtime scan during incoming pass is recorded',s.tactical.scanUsed&&['GOOD SCAN','PERFECT SCAN','EARLY SCAN','LATE SCAN'].includes(s.tactical.scanGrade)&&s.tactical.scanSnapshot.length>=1);
  context.tacticalGiveBall(s,s.player,'intended');check('runtime reception after scan opens decision window',s.tactical.state==='DECISION_WINDOW'&&s.tactical.receiveAt===now);
}
// 2: no scan never freezes; it records a miss then still allows decision.
{
  const s=makeState();context.tacticalUpdateVision(s,.016);now+=500;context.tacticalGiveBall(s,s.player,'intended');check('runtime no-scan reception continues',s.tactical.state==='DECISION_WINDOW'&&s.tactical.metrics.noScans===1);
}
// 3: successful pass reaches feedback then next scenario.
{
  const s=makeState();context.tacticalUpdateVision(s,.016);s.tactical.scanUsed=true;now+=400;context.tacticalGiveBall(s,s.player,'intended');s.tactical.passReleasedAt=now+500;s.tactical.state='PASS_RESOLUTION';s.tactical.ownerId=null;s.ball.free=true;s.tactical.bestOption=s.tactical.mates[1];now+=600;context.tacticalGiveBall(s,s.tactical.mates[1],'intended');const feedback=s.tactical.state==='FEEDBACK'&&s.tactical.continuationAt>now;now=s.tactical.continuationAt+1;context.tacticalVisionPassWatchdog(s);check('runtime successful repetition restarts automatically',feedback&&s.tactical.state==='NEXT_SCENARIO'&&s.tactical.resetQueued>now);
}
// 4: outgoing interception resolves into feedback.
{
  const s=makeState();s.tactical.state='PASS_RESOLUTION';s.tactical.ownerId=null;s.ball.free=true;context.tacticalGiveBall(s,s.tactical.opponents[1],'interception');check('runtime outgoing interception cannot freeze',s.tactical.state==='FEEDBACK'&&s.tactical.continuationReason==='vision-interception');
}
// 5: incoming interception resolves into feedback.
{
  const s=makeState();context.tacticalUpdateVision(s,.016);context.tacticalGiveBall(s,s.tactical.opponents[0],'interception');check('runtime incoming interception cannot freeze',s.tactical.state==='FEEDBACK'&&s.tactical.metrics.incomingInterceptions===1);
}
// 6: close presser eventually dispossesses a user who refuses to pass.
{
  const s=makeState();s.tactical.state='DECISION_WINDOW';s.tactical.stateAge=.4;s.tactical.ownerId='user';s.player.hasBall=true;const p=s.tactical.visionRoles.presser;p.x=s.player.x+1;p.y=s.player.y+1;s.tactical.pressContactAge=.6;context.tacticalUpdateVision(s,.016);check('runtime press can dispossess slow user',s.tactical.state==='FEEDBACK'&&s.tactical.metrics.dispossessed===1);
}
// 7: decision watchdog ends a held-ball repetition.
{
  const s=makeState();s.tactical.state='DECISION_WINDOW';s.tactical.stateAge=5;s.tactical.ownerId='user';s.player.hasBall=true;s.tactical.decisionDeadline=1.6;s.tactical.visionRoles.presser.x=30;s.tactical.visionRoles.presser.y=30;context.tacticalUpdateVision(s,.016);check('runtime decision timeout cannot freeze',s.tactical.state==='FEEDBACK'&&s.tactical.continuationReason==='vision-decision-timeout');
}
// 8: scan assistance scales with vision.
{
  const counts=[];for(const v of [50,70,90]){career.player.attrs.vision=v;const s=makeState();counts.push(context.tacticalVisionBuildScanSnapshot(s).length)}career.player.attrs.vision=86;check('runtime vision rating expands scan snapshot',counts[0]===1&&counts[1]===2&&counts[2]===3);
}
// 9: 50 scan-receive-pass cycles all reach a reset state.
{
  let ok=true;for(let i=0;i<50;i++){const s=makeState();context.tacticalUpdateVision(s,.016);s.ball.x=42;s.ball.y=70;now+=200;context.tacticalPerformScan(s);now+=250;context.tacticalGiveBall(s,s.player,'intended');if(s.tactical.state!=='DECISION_WINDOW'){ok=false;break}s.tactical.passReleasedAt=now+400;s.tactical.state='PASS_RESOLUTION';s.tactical.ownerId=null;s.ball.free=true;s.tactical.bestOption=s.tactical.mates[1];now+=450;context.tacticalGiveBall(s,s.tactical.mates[1],'intended');if(s.tactical.state!=='FEEDBACK'){ok=false;break}now=s.tactical.continuationAt+1;context.tacticalVisionPassWatchdog(s);if(s.tactical.state!=='NEXT_SCENARIO'){ok=false;break}now+=100}check('50 repeated scan receive pass cycles have zero stuck states',ok);
}

let passed=0;for(const [n,ok] of checks){if(ok){passed++;console.log('PASS',n)}else console.error('FAIL',n)}console.log(`\nTactical Vision v56 validation: ${passed}/${checks.length} checks passed`);if(passed!==checks.length)process.exit(1);
