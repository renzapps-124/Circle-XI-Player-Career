const fs=require('fs'),vm=require('vm');
const game=fs.readFileSync('game.js','utf8'),html=fs.readFileSync('index.html','utf8');
function fn(name){const m=`function ${name}(`,st=game.indexOf(m);if(st<0)throw Error(name);const b=game.indexOf('{',st);let d=0,q=null,e=false;for(let i=b;i<game.length;i++){const c=game[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return game.slice(st,i+1)}throw Error('unclosed '+name)}
const C=[];const ck=(n,v)=>C.push([n,!!v]);
ck('v58 marker',game.includes("v58.0-tactical-vision-passing-team-kit-clarity"));
ck('cache bust',html.includes('game.js?v=58.0.0')&&html.includes('styles.css?v=58.0.0'));
ck('shared team kit function',game.includes('function tacticalTrainingTeamKit()'));
ck('opposition kit function',game.includes('function tacticalOppositionTrainingKit()'));
ck('team kit applied to all mates',fn('tacticalCreateSquad').includes('applyTacticalTrainingKit(p,teamKit,0)'));
ck('opposition kit consistent',fn('tacticalCreateSquad').includes('applyTacticalTrainingKit(p,oppositionKit,1)'));
ck('mental targets only team mates',fn('tacticalChoosePassTarget').includes("source=t.drill==='mental'?(t.mates||[]):(s.teammates||[])"));
ck('direction priority strengthened',fn('tacticalChoosePassTarget').includes("directionWeight=t.drill==='mental'?(inputLen>.2||remembered?122:86):50"));
ck('pass aim memory',fn('tacticalChoosePassTarget').includes('t.passAimDir')&&fn('tacticalChoosePassTarget').includes('t.passAimAt'));
ck('persistent mental pass target',fn('tacticalDrawOverlay').includes("if(t.ownerId==='user')")&&fn('tacticalDrawOverlay').includes("PASS TARGET · J"));
ck('team identity rings',fn('drawTrainingSharedEngine').includes("s.tactical?.drill==='mental'")&&fn('drawTrainingSharedEngine').includes("t.team===0?'rgba(103,232,249,.82)'"));
ck('correct intended token comparison',fn('tacticalUpdateBall').includes("b.intendedId===tacticalActorToken(s,nearest)"));
ck('live ball at feet recovery',fn('tacticalUserAction').includes('liveBallAtFeet=s.ball.free')&&fn('tacticalUserAction').includes("s.ball.intendedId==='user'"));
ck('rejection diagnostic',fn('tacticalUserAction').includes('PASS_REJECTED_OWNER')&&fn('tacticalUserAction').includes('__tacticalVisionPassDiagnostic'));
ck('passing labels clarified',fn('tacticalUpdateControlState').includes('GROUND PASS')&&fn('tacticalUpdateControlState').includes('LOFTED PASS'));

let now=1000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const career={player:{attrs:{vision:80,decisions:80,composure:80,firstTouch:82,technique:78,balance:72,strength:65,passing:86},position:'CM'},club:{primary:'#034694'}};
const x={performance:{now:()=>now},console,career,window:{},document:{querySelectorAll:()=>[]},setTimeout:f=>{f();return 0},clearTimeout:()=>{},clamp,lerp,$:()=>null,trainingKitPalette:()=>({primary:'#171b2d',secondary:'#034694',shorts:'#0b1020',socks:'#f1f5f9',accent:'#034694'}),createTrainingTeammate:i=>({name:'T'+i,x:0,y:0,vx:0,vy:0,dir:0,team:0,isGoalkeeper:false,attrs:{firstTouch:70}}),tacticalStreakMultiplier:()=>1,tacticalFeedback:()=>{},tacticalUpdateControlState:()=>{},tacticalScore:()=>{},tacticalSetState:(s,state)=>{s.tactical.state=state;s.tactical.stateAge=0},tacticalScheduleScenarioReset:()=>{},tacticalFootBallAnchor:(s,a)=>({x:a.x,y:a.y+3.4,z:0}),setTrainingVisualAction:()=>{},playMatchSound:()=>{},trainingGameState:null};
vm.createContext(x);
for(const n of ['distancePointToSegment','tacticalActorToken','tacticalTrainingTeamKit','tacticalOppositionTrainingKit','applyTacticalTrainingKit','tacticalCreateSquad','tacticalChoosePassTarget'])vm.runInContext(fn(n),x);
x.tacticalOwner=s=>s.tactical.ownerId==='user'?s.player:[...(s.tactical.mates||[]),...(s.tactical.opponents||[])].find(p=>p.tacticalId===s.tactical.ownerId)||null;
const squad=x.tacticalCreateSquad();
ck('all AI teammates same primary',squad.mates.every(p=>p.primary===squad.mates[0].primary));
ck('all AI teammates same shorts/socks',squad.mates.every(p=>p.shorts===squad.mates[0].shorts&&p.socks===squad.mates[0].socks));
ck('AI teammates match user training palette',squad.mates.every(p=>p.primary==='#171b2d'&&p.secondary==='#034694'&&p.shorts==='#0b1020'&&p.socks==='#f1f5f9'));
ck('opponents share contrasting kit',squad.opponents.every(p=>p.primary===squad.opponents[0].primary&&p.primary!==squad.mates[0].primary&&p.team===1));

function targetState(){const p={x:50,y:70,team:0,dir:-Math.PI/2};const m=[{x:25,y:70,team:0,tacticalId:'left'},{x:75,y:70,team:0,tacticalId:'right'},{x:50,y:40,team:0,tacticalId:'forward'},{x:50,y:86,team:0,tacticalId:'back'}];const o=[{x:60,y:60,team:1,tacticalId:'o1'},{x:40,y:58,team:1,tacticalId:'o2'}];return{player:p,keys:new Set(),teammates:[...m,...o],tactical:{drill:'mental',ownerId:'user',mates:m,opponents:o,difficulty:{assist:.58},bestOption:m[2],highlightedPassTarget:null}}}
{const s=targetState();s.keys.add('d');ck('right input selects right teammate',x.tacticalChoosePassTarget(s,'pass')?.tacticalId==='right')}
{const s=targetState();s.keys.add('a');ck('left input selects left teammate',x.tacticalChoosePassTarget(s,'pass')?.tacticalId==='left')}
{const s=targetState();s.keys.add('w');ck('up input selects forward teammate',x.tacticalChoosePassTarget(s,'pass')?.tacticalId==='forward')}
{const s=targetState();s.keys.add('s');ck('down input selects back teammate',x.tacticalChoosePassTarget(s,'pass')?.tacticalId==='back')}
{const s=targetState();s.keys.add('d');x.tacticalChoosePassTarget(s,'pass');s.keys.clear();now+=300;ck('aim direction persists briefly',x.tacticalChoosePassTarget(s,'pass')?.tacticalId==='right')}

let pass=0;for(const [n,v] of C){console.log(v?'PASS':'FAIL',n);if(v)pass++}
console.log(`\nTactical Vision v58: ${pass}/${C.length} checks passed`);if(pass!==C.length)process.exit(1);
