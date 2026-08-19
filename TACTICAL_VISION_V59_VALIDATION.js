const fs=require('fs'),vm=require('vm');
const game=fs.readFileSync('game.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles.css','utf8');
function fn(name){const m=`function ${name}(`,st=game.indexOf(m);if(st<0)throw Error(name);const b=game.indexOf('{',st);let d=0,q=null,e=false;for(let i=b;i<game.length;i++){const c=game[i];if(q){if(e){e=false;continue}if(c==='\\'){e=true;continue}if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return game.slice(st,i+1)}throw Error('unclosed '+name)}
const C=[];const ck=(n,v)=>C.push([n,!!v]);
ck('v59 marker',game.includes("v59.0-tactical-vision-full-match-passing"));
ck('cache bust',html.includes('game.js?v=59.0.0')&&html.includes('styles.css?v=59.0.0'));
ck('match combo mapping shared exactly',fn('tacticalMatchPassCombo').includes("ij:{id:'loftedPass'")&&fn('tacticalMatchPassCombo').includes("ik:{id:'liftedThrough'")&&fn('tacticalMatchPassCombo').includes("jk:{id:'drivenPass'"));
ck('all six controlled pass profiles', ['pass','through','cross','drivenPass','loftedPass','liftedThrough'].every(x=>fn('tacticalPassActionProfile').includes(`action==='${x}'`)||x==='pass'));
ck('keyboard uses hold release lifecycle',game.includes("tacticalBeginVisionPassInput(s,k)")&&game.includes("tacticalEndVisionPassInput(s,k)"));
ck('single pass waits until key up in vision',game.includes("if(s.tactical?.drill==='mental'&&['j','k','i'].includes(k))tacticalBeginVisionPassInput(s,k);else tacticalUserAction(s,k)"));
ck('first time combo queue stores action',fn('tacticalQueueVisionPass').includes('bufferedAction={action,power,control,primaryKey'));
ck('buffered action preserves pass type',fn('tacticalConsumeBufferedAction').includes('buffer.action')&&fn('tacticalConsumeBufferedAction').includes('{firstTime:true'));
ck('execution accepts full pass list',fn('tacticalExecuteUserAction').includes("const passActions=['pass','through','cross','drivenPass','loftedPass','liftedThrough']"));
ck('release understands lifted through',fn('tacticalReleaseBall').includes("['through','liftedThrough']")&&fn('tacticalReleaseBall').includes("['cross','loftedPass','liftedThrough']"));
ck('release marks driven and lofted physics',fn('tacticalReleaseBall').includes('s.ball.lofted=loftedLike')&&fn('tacticalReleaseBall').includes('s.ball.driven=drivenLike'));
ck('target selection understands pass families',fn('tacticalChoosePassTarget').includes("['through','liftedThrough']")&&fn('tacticalChoosePassTarget').includes("['loftedPass','liftedThrough','cross']"));
ck('control dock shows combo help',game.includes('J+K DRIVEN · J+I LOFTED · K+I LIFTED THROUGH'));
ck('combo visual styling exists',css.includes('tactical-vision-combo-active')&&css.includes('.tactical-pass-combo-hints'));
ck('scan copy teaches complete pass controls',fn('tacticalPerformScan').includes('J+K / J+I / K+I combinations'));
ck('receipt copy teaches match toolkit',game.includes('J pass · K through · I high/cross · J+K driven · J+I lofted · K+I lifted through'));
ck('team kit v58 preserved',fn('tacticalCreateSquad').includes('applyTacticalTrainingKit(p,teamKit,0)')&&fn('tacticalCreateSquad').includes('applyTacticalTrainingKit(p,oppositionKit,1)'));

let now=1000;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const x={performance:{now:()=>now},clamp,lerp,console,window:{},setTimeout:(f)=>{f();return 0},clearTimeout:()=>{},tacticalUpdateControlState:()=>{},tacticalFeedback:()=>{},tacticalFootBallAnchor:(s,a)=>({x:a.x,y:a.y+3.5,z:0}),tacticalGiveBall:(s,a)=>{s.tactical.ownerId='user';s.player.hasBall=true;s.ball.free=false},tacticalExecuteUserAction:(s,a,p,m)=>{s.__exec={a,p,m};return true}};vm.createContext(x);
for(const n of ['tacticalMatchPassCombo','tacticalPassActionLabel','tacticalPassActionProfile','tacticalQueueVisionPass','tacticalBeginVisionPassInput','tacticalEndVisionPassInput'])vm.runInContext(fn(n),x);
ck('J+K resolves driven pass',x.tacticalMatchPassCombo('j','k')?.id==='drivenPass');
ck('J+I resolves lofted pass',x.tacticalMatchPassCombo('j','i')?.id==='loftedPass');
ck('K+I resolves lifted through',x.tacticalMatchPassCombo('k','i')?.id==='liftedThrough');
ck('shot combos excluded from vision passing',x.tacticalMatchPassCombo('j','l')===null&&x.tacticalMatchPassCombo('k','l')===null);
ck('lofted pass has clear lift',x.tacticalPassActionProfile('loftedPass',.6).lift>10);
ck('lifted through has clear lift',x.tacticalPassActionProfile('liftedThrough',.6).lift>9);
ck('driven pass remains grounded',x.tacticalPassActionProfile('drivenPass',.8).lift===0);

function ownedState(){return{player:{x:50,y:70,hasBall:true},ball:{x:50,y:73.5,z:0,vx:0,vy:0,free:false,intendedId:null,releaseAge:0},tactical:{drill:'mental',ownerId:'user',scanUsed:true,passInput:null,lastInputAt:0},keys:new Set()}}
{const s=ownedState();x.tacticalBeginVisionPassInput(s,'j');now+=180;x.tacticalEndVisionPassInput(s,'j');ck('single J executes ground pass on release',s.__exec?.a==='pass'&&s.__exec.p>.08)}
{const s=ownedState();now+=200;x.tacticalBeginVisionPassInput(s,'j');now+=50;x.tacticalBeginVisionPassInput(s,'k');now+=140;x.tacticalEndVisionPassInput(s,'k');ck('held J+K executes driven pass once',s.__exec?.a==='drivenPass'&&s.__exec.m.control==='J+K')}
{const s=ownedState();now+=200;x.tacticalBeginVisionPassInput(s,'j');now+=40;x.tacticalBeginVisionPassInput(s,'i');now+=100;x.tacticalEndVisionPassInput(s,'i');ck('held J+I executes lofted pass',s.__exec?.a==='loftedPass')}
{const s=ownedState();now+=200;x.tacticalBeginVisionPassInput(s,'k');now+=40;x.tacticalBeginVisionPassInput(s,'i');now+=100;x.tacticalEndVisionPassInput(s,'i');ck('held K+I executes lifted through',s.__exec?.a==='liftedThrough')}
{const s=ownedState();s.player.hasBall=false;s.ball.free=true;s.ball.intendedId='user';s.ball.x=40;s.ball.y=55;s.tactical.ownerId=null;now+=200;x.tacticalBeginVisionPassInput(s,'k');x.tacticalBeginVisionPassInput(s,'i');now+=100;x.tacticalEndVisionPassInput(s,'i');ck('incoming K+I queues lifted through first-time',s.tactical.bufferedAction?.action==='liftedThrough'&&s.tactical.bufferedAction?.control==='K+I')}


{let ok=true;const patterns=[['j',null,'pass'],['k',null,'through'],['i',null,'cross'],['j','k','drivenPass'],['j','i','loftedPass'],['k','i','liftedThrough']];for(let n=0;n<60;n++){const [a,b,expected]=patterns[n%patterns.length],st=ownedState();now+=130;x.tacticalBeginVisionPassInput(st,a);if(b){now+=35;x.tacticalBeginVisionPassInput(st,b)}now+=95;x.tacticalEndVisionPassInput(st,b||a);if(st.__exec?.a!==expected){ok=false;break}}ck('60-cycle mixed passing stress test',ok)}

let pass=0;for(const [n,v] of C){console.log(v?'PASS':'FAIL',n);if(v)pass++}
console.log(`\nTactical Vision v59: ${pass}/${C.length} checks passed`);if(pass!==C.length)process.exit(1);
