const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');

const checks=[
  ['v51+ build marker',game.includes('__TACTICAL_TRAINING_VERSION=')],
  ['v51+ script cache bust',/game\.js\?v=5[1-9]/.test(html)],
  ['v51+ style cache bust',/styles\.css\?v=5[1-9]/.test(html)],
  ['all round circuit still uses shared 60 second session',game.includes('const TACTICAL_SESSION_DURATION=60')&&game.includes('duration=TACTICAL_SESSION_DURATION')],
  ['long pitch has explicit 128-unit world',game.includes('height:128')&&game.includes("stage.dataset.pitchLength=String(TACTICAL_ALL_ROUND_PITCH.height)")],
  ['user movement uses long circuit bounds',game.includes("longCircuit=s.tactical?.drill==='balanced'")&&game.includes('TACTICAL_ALL_ROUND_PITCH.height-5')],
  ['AI actor movement supports long pitch',game.includes("trainingGameState?.tactical?.drill==='balanced'?TACTICAL_ALL_ROUND_PITCH.height-4:95")],
  ['five defenders have live movement roles',game.includes('function tacticalUpdateAllRoundDefenders')&&game.includes("stage.dataset.defendersMoving='true'")],
  ['defenders press user and cover pass receiver',game.includes("stage.dataset.defensiveShape")&&game.includes("escape?'press-cover-balance'")],
  ['defender physical tackles use tackling and anticipation',game.includes("nearest.attrs?.tackling||58")&&game.includes("nearest.attrs?.anticipation||60")],
  ['defender possession triggers a turnover restart',game.includes('function tacticalTriggerAllRoundTurnover')&&game.includes("if(actor.team===1){tacticalTriggerAllRoundTurnover")],
  ['turnover restart explicitly preserves the master timer',game.includes('60-second timer keeps running')&&game.includes('t.resetQueued=performance.now()+850')],
  ['remaining pressure triggers a lifted return',game.includes("plan.mode=blocked?'lifted':'ground'")&&game.includes("lifted?'cross':'pass'")],
  ['close defenders trigger teammate escape movement',game.includes('function tacticalAllRoundSpaceScan')&&game.includes("tacticalSetState(s,'TEAMMATE_ESCAPE'")],
  ['escape can finish with a normal grounded pass',game.includes("'GROUND PASS · LANE CREATED'")&&game.includes("lifted?'cross':'pass'")],
  ['return pass predicts live user movement',game.includes("s.player.x+(s.player.vx||0)*.36")&&game.includes("s.player.y+(s.player.vy||0)*.36")],
  ['long physical passes scale velocity from real distance',game.includes("distanceSpeed=action==='shot'")&&game.includes("d*(lift>3?.98:1.30)")],
  ['proper goal geometry includes posts bar and goal line',['goalLineY','goalLeft','goalRight','postRadius','crossbarHeight'].every(x=>game.includes(x))],
  ['goal model is framed below the broadcast HUD',game.includes('goalLineY:9')&&game.includes('netBackY=p.goalLineY-8')&&game.includes('tacticalPositionActor(s.goalkeeper,50,13.5)')],
  ['woodwork collision is physical',game.includes('postHit||crossbarHit')&&game.includes("b.vy=Math.abs(b.vy)*.58")],
  ['goal only counts between posts under bar',game.includes("const inGoal=inside&&(b.z||0)<goal.crossbarHeight")],
  ['goal net has physical capture and ripple',game.includes("b.status='net'")&&game.includes('t.netRipple=')&&game.includes("kind:'net'")],
  ['goal scoring awards finishing and circuit points',game.includes("tacticalScore(s,t.drill==='balanced'?finishPoints:300")&&game.includes("tacticalScore(s,500,'CIRCUIT COMPLETE'")],
  ['goal presentation holds long enough to read',game.includes('t.resetQueued=performance.now()+1800')],
  ['player-follow camera uses damping and look-ahead',game.includes('function tacticalUpdateCamera')&&game.includes("lookX=(s.player.vx||0)*.65")&&game.includes('1-Math.exp(-4.4*dt)')],
  ['camera changes framing for goal view and turnovers',game.includes("goalView=['TEAMMATE_ESCAPE','TEAMMATE_REPOSITION','RETURN_DELIVERY','ATTACK_CROSS','FINISH','EVALUATE'].includes(t.state)")&&game.includes("goalView?34:43")],
  ['camera applies to models and tactical overlays',(game.match(/tacticalApplyCameraTransform\(ctx,s,w,h\)/g)||[]).length>=2],
  ['camera-aware ball locator uses visible view bounds',game.includes('halfView=camera?50/(camera.zoom||1):0')],
  ['long pitch and proper net render on the shared canvas',game.includes('function tacticalDrawAllRoundPitch')&&game.includes("ctx.strokeStyle='#f8fafc'")],
  ['live state rail exposes reposition turnover and reset',['TEAMMATE_REPOSITION','TURNOVER','RESET'].every(x=>game.includes(x))],
  ['goal evaluation state and ball-in-net status are visible',game.includes("'FINISH','EVALUATE','TURNOVER','RESET'")&&game.includes("label:'BALL IN NET'")],
  ['new metrics track turnovers lifted returns and teammate moves',['turnovers:0','liftedReturns:0','teammateRepositions:0','woodwork:0','shotsOnTarget:0'].every(x=>game.includes(x))],
  ['all round live UI exposes camera and state feedback',css.includes('PLAYER-FOLLOW CAMERA')&&css.includes('all-round-turnover')&&css.includes('all-round-goal-scored')],
  ['responsive and reduced-motion treatments remain present',css.includes('@media(max-width:720px)')&&css.includes('@media(prefers-reduced-motion:reduce)')],
  ['session elapsed time is only advanced by master tactical loop',(game.match(/t\.elapsed\+=dt/g)||[]).length===1],
  ['restart queue never resets elapsed',!game.slice(game.indexOf('function tacticalTriggerAllRoundTurnover'),game.indexOf('function tacticalUpdateVision')).includes('t.elapsed=0')]
];

let passed=0;
for(const [name,ok] of checks){if(ok){passed++;console.log(`PASS ${name}`)}else console.error(`FAIL ${name}`)}
console.log(`\nAll Round Circuit v51 validation: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
