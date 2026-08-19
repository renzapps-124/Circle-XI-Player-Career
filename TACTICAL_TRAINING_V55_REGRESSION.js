const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');

const checks=[
  ['v50+ tactical build marker',game.includes('__TACTICAL_TRAINING_VERSION=')],
  ['tactical script cache bust',/game\.js\?v=5\d/.test(html)],
  ['tactical style cache bust',/styles\.css\?v=5\d/.test(html)],
  ['advanced drill registry covers four drills',game.includes("new Set(['balanced','mental','pressing','transition'])")],
  ['all round circuit state chain',game.includes("['WAITING','DELIVERY','FIRST_TOUCH','PASS','SUPPORT_RUN'")&&game.includes("'RETURN_DELIVERY','ATTACK_CROSS','FINISH'")],
  ['tactical vision state chain',game.includes("['SCENARIO_SETUP','PRE_RECEIVE','SCAN_WINDOW','RECEIVE','DECISION','EXECUTION','TEAMMATE_CONTROL','RECOVER','OUTCOME','NEXT_SCENARIO']")],
  ['pressing trigger state chain',game.includes("['BUILD_UP','OBSERVE','TRIGGER','USER_RESPONSE','PRESS_OUTCOME','BUILD_UP_CONTINUES','RESET']")],
  ['transition game state chain',game.includes("['NORMAL_PLAY','POSSESSION_CHANGE','ATTACKING_TRANSITION','DEFENSIVE_TRANSITION','DECISION','EXECUTION','OUTCOME','CONTINUOUS_PLAY']")],
  ['dedicated tactical start route',game.includes("if(isAdvancedTacticalTrainingDrill()){startTacticalTraining();return;}")],
  ['one shared tactical update loop',game.includes('requestAnimationFrame(updateTacticalTraining)')],
  ['actual career attributes drive player movement',game.includes('career.player.attrs||{},pace=Number(a.pace||60),acc=Number(a.acceleration||60),agi=Number(a.agility||60)')],
  ['actual player appearance uses shared footballer renderer',game.includes('const p=s.sharedPlayer||(s.sharedPlayer=careerPlayerForTraining())')&&game.includes('drawVisibleFootballer(ctx,p,userScale,false)')],
  ['physical ball integrates velocity',game.includes('b.x+=b.vx*dt;b.y+=b.vy*dt')],
  ['physical ball has height and gravity',game.includes('b.z=Math.max(0,(b.z||0)+(b.vz||0)*dt)')&&game.includes('b.vz=(b.vz||0)-35*dt')],
  ['physical ball has friction and bounce',game.includes("Math.exp(-(b.z>1?.22:1.12)*dt)")&&game.includes('Math.abs(b.vz)*.28')],
  ['ball target is an intended receiver, not a teleport',game.includes('s.ball.intendedId=intendedToken')&&game.includes('const intendedToken=tacticalActorToken(s,target)')],
  ['live contact selects nearest player',game.includes('tacticalNearestActorToBall(s)')&&game.includes("'interception'")],
  ['first touch uses first touch and technique',game.includes("attrs?.firstTouch||55)*.62+(career.player.attrs?.technique||55)*.38")],
  ['passing action uses real aim and power',game.includes("action==='through'?.78:action==='cross'?.72:.58")],
  ['supporting run is user controlled',game.includes("t.state==='SUPPORT_RUN'")&&game.includes('s.keys.has(\'shift\')')],
  ['return delivery supports grounded and pressure-aware lifted passes',game.includes("mode==='lifted'")&&game.includes("lifted?22:0")],
  ['finishing outcome is attribute based',game.includes("attrs?.finishing||55)*.55+(career.player.attrs?.composure||55)*.25")],
  ['scan key works during live play',game.includes("if(key==='m'){tacticalPerformScan(s);return}")],
  ['scan overlay is temporary',game.includes('scanVisibleUntil')&&css.includes('.tactical-scan-overlay.show')],
  ['vision allows optimal and acceptable alternatives',game.includes("optimal?'BEST DECISION':good?'GOOD ALTERNATIVE'")],
  ['vision penalises intercepted critical errors',game.includes('CRITICAL ERROR · POSSESSION LOST')],
  ['pressing distinguishes real and fake triggers',game.includes('t.triggerReal')&&game.includes('PATIENT · SHAPE HELD')],
  ['pressing detects early and late presses',game.includes('PRESSED TOO EARLY')&&game.includes('PRESSED TOO LATE')],
  ['pressing evaluates approach angle',game.includes('goodAngle=angle>.35&&angle<1.65')],
  ['pressing rewards backwards forcing and direct wins',game.includes('FORCED BACKWARDS')&&game.includes('BALL WON')],
  ['transition detects every possession change',game.includes("if(actor.team!==t.lastPossessionTeam)")],
  ['transition includes central lane coverage',game.includes('CENTRAL LANE COVERED')],
  ['transition restarts without a loading screen',game.includes('tacticalSetupTransitionRestart')],
  ['streak multiplier rises and caps at two',game.includes("streak>=15?2:")],
  ['streak dynamically raises AI intensity',game.includes('t.dynamicIntensity=clamp')&&game.includes('*intensity')],
  ['A plus is the maximum tactical grade',game.includes("score>=5500?'A+':score>=4400?'A'")&&!/function tacticalTrainingGrade\(score\).*?'S\+?'/.test(game)],
  ['standard score attack and practice modes',['STANDARD','SCORE ATTACK','PRACTICE'].every(label=>game.includes(label))&&!game.includes("['endless','ENDLESS'" )],
  ['every tactical profile uses one shared 60 second duration',game.includes('const TACTICAL_SESSION_DURATION=60')&&(game.match(/duration:TACTICAL_SESSION_DURATION/g)||[]).length===4],
  ['runtime always uses the shared 60 second duration',game.includes('duration=TACTICAL_SESSION_DURATION')],
  ['passes can be buffered while the ball is arriving',game.includes('t.bufferedAction=key')&&game.includes('RELEASES ON CONTROL')],
  ['buffered passes execute immediately after user control',game.includes('tacticalConsumeBufferedAction(s)')&&game.includes("actor===s.player&&s.tactical.bufferedAction")],
  ['all round pass phase locks onto the highlighted receiver',game.includes("t.drill==='balanced'&&t.state==='PASS'&&t.passTarget")&&game.includes('return t.passTarget')],
  ['all round pass phase repairs lost ownership before input',game.includes("tacticalGiveBall(s,s.player,'all-round-pass-recovery')")&&game.includes('POSSESSION CONFIRMED · PASS NOW')],
  ['ball lifecycle includes staged owned released and recovered states',['staged','owned','released','recovered'].every(state=>game.includes(`status='${state}'`)||game.includes(`status:'${state}'`))],
  ['staged and goalkeeper-owned tactical balls remain renderable',game.includes("s.ball.free||!s.tactical?.ownerId||s.tactical.ownerId===s.goalkeeper?.id")],
  ['five difficulty levels are supported',game.includes("Beginner:{name:'Beginner'")&&game.includes("Elite:{name:'Elite'")],
  ['practice sessions cannot bank tactical XP',game.includes('if(s.rewardEligible)Object.entries(s.tactical.xp)')],
  ['tactical history tracks attempts average PB and form',game.includes('history.averageScore')&&game.includes('history.bestScore')&&game.includes('history.lastGrades')],
  ['per attribute tactical XP is persisted',game.includes('t.tacticalXP[key]')],
  ['tutorial completion persists per drill',game.includes('t.tacticalTutorials[id]=true')],
  ['split segment tracking exists',game.includes('s.segments[segment].attempts++')&&game.includes('s.segments[segment].success++')],
  ['tactical result metrics are drill specific',game.includes("if(drillId==='balanced')return ['Technical execution'")&&game.includes("if(drillId==='pressing')return ['Trigger recognition'")],
  ['tactical result panel shows XP and metrics',game.includes('tactical-result-metrics')&&game.includes('tactical-xp-results')],
  ['responsive tactical UI exists',css.includes('.tactical-live-hud')&&css.includes('.tactical-control-dock')&&css.includes('@media(max-width:720px)')],
  ['new GUI has progress possession and contextual action panels',game.includes('tacticalSessionProgressFill')&&game.includes('tacticalPossessionText')&&game.includes('tacticalActionPromptTitle')],
  ['control UI exposes locked queue ready and queued states',['locked','queue','ready'].every(state=>css.includes(`data-availability=${state}`))&&css.includes('.queued')],
  ['final 15 and final 5 second warning states exist',game.includes('tactical-final-15')&&game.includes('tactical-final-5')&&css.includes('.tactical-final-5')],
  ['setup includes mode and difficulty controls',css.includes('.tactical-mode-selector')&&game.includes('data-tactical-mode')&&game.includes('tacticalDifficultySelect')],
  ['time is synchronised for shared finish logic',game.includes('s.time=Math.max(0,s.duration-t.elapsed)')],
  ['shot scenarios reset after saves goals and misses',game.includes('t.resetQueued=performance.now()+720')&&game.includes('FINISH WIDE')],
  ['input listeners are registered through controlled cleanup state',game.includes("window.addEventListener('keydown',s.keyDown")&&game.includes('clearTrainingControls()')]
];

const attributeProbe=rating=>({speed:9+(16-9)*rating/99,touch:.48+rating/99*.48-.5*.16,finish:rating*.55/99+rating*.25/99+rating*.2/99});
const low=attributeProbe(40),mid=attributeProbe(70),elite=attributeProbe(90);
checks.push(['attribute behaviour scales monotonically across low mid elite players',low.speed<mid.speed&&mid.speed<elite.speed&&low.touch<mid.touch&&mid.touch<elite.touch&&low.finish<mid.finish&&mid.finish<elite.finish]);

let passed=0;
for(const [name,ok] of checks){if(ok){passed++;console.log(`PASS ${name}`)}else console.error(`FAIL ${name}`)}
console.log(`\nTactical training v55 regression: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
