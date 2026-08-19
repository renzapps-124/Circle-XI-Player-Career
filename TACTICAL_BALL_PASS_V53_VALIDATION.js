const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const checks=[
  ['v53+ marker',game.includes("v53.0-visible-ball-reliable-teammate-passing")||game.includes("v54.0-tactical-vision-pass-lifecycle")],
  ['v53+ cache bust',/styles\.css\?v=5[3-9]/.test(html)&&/game\.js\?v=5[3-9]/.test(html)],
  ['canonical tactical ball point',game.includes('function tacticalCanonicalBallPoint')],
  ['dedicated tactical ball draw',game.includes('function drawTacticalTrainingBall')&&game.includes('drawTacticalTrainingBall(ctx,s,w,h,scale)')],
  ['tactical ball renders after user',game.indexOf('if(isAdvancedTacticalTrainingDrill())drawTacticalTrainingBall')>game.indexOf('drawVisibleFootballer(ctx,p,userScale,false)')],
  ['staged ball uses user position',game.includes("ball:{free:false,status:'staged',x:start.x,y:start.y-3")],
  ['owned ball uses canonical anchor',game.includes('const point=tacticalCanonicalBallPoint(s);s.ball.x=point.x;s.ball.y=point.y')],
  ['pass begins at boot',game.includes('originReach=actor===s.player?3.15:2.85')||game.includes('const origin=tacticalFootBallAnchor(s,actor)')],
  ['moving receiver lead',game.includes("leadTime=action==='through'?.30:action==='cross'?.20:.14")],
  ['receiver lock metadata',game.includes('receiverLockAge=.34')&&game.includes('intendedTeam=')],
  ['intended receiver gets priority',game.includes("if(intended&&intendedDistance<intendedRadius")&&game.includes("tacticalGiveBall(s,intended,'intended')")],
  ['defender interceptions preserved',game.includes("'interception'")&&game.includes('isOpponentInterception')],
  ['aim uses current movement direction',game.includes('inputX=')&&game.includes('inputLen>.2?Math.atan2(inputY,inputX):s.player.dir')],
  ['same team receiver filter',game.includes("filter(p=>p.team===0&&!p.isGoalkeeper")],
  ['highlighted pass target',game.includes('highlightedPassTarget')&&game.includes("'J · PASS TARGET'" )],
  ['J pass confirmation',game.includes('→ TEAMMATE')],
  ['ownership repair across tactical drills',game.includes("'tactical-owner-recovery'")&&game.includes('POSSESSION CONFIRMED · PASS READY')],
  ['completed pass confirmation',game.includes('TEAMMATE RECEIVED THE PASS')],
  ['HUD exposes ball visibility',game.includes("stage.dataset.ballVisible='true'")],
  ['HUD exposes pass target',game.includes('stage.dataset.passTarget=')],
  ['v53 target styling',css.includes('data-pass-target')&&css.includes('data-ball-state')],
  ['v53 demo route',game.includes("demoMode === 'tactical-pass-v53'")]
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
console.log(`\nTactical ball/pass v53: ${pass}/${checks.length} checks passed`);
if(pass!==checks.length)process.exit(1);
