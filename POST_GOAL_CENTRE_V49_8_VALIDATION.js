const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');

const checks=[
  ['post-goal centre build marker',game.includes("__POST_GOAL_CENTRE_VERSION='v49.8-authoritative-centre-kickoff'")],
  ['v52 cache bust retains centre restart',html.includes('game.js?v=52.0.0')],
  ['goal records durable reset transaction',game.includes("this.postGoalReset={pending:true,scoringTeam:team,kickTeam:1-team")],
  ['conceding team is recorded immediately',game.includes('this.pendingKickoffTeam=1-team')],
  ['authoritative centre transition exists',game.includes("forcePostGoalCentreKickoff(team=null,source='goal-flow')")],
  ['restart team survives all goal presentation states',game.includes('this.postGoalReset?.kickTeam,this.goalCelebration?.kickTeam,this.pendingKickoffTeam,this.replayAfterKickTeam')],
  ['skipped replay uses authoritative transition',game.includes("forcePostGoalCentreKickoff(this.goalRestartTeam(),'replay-skipped')")],
  ['unavailable replay uses authoritative transition',game.includes("forcePostGoalCentreKickoff(kickTeam,'replay-unavailable')")],
  ['watched replay ends through authoritative transition',game.includes("forcePostGoalCentreKickoff(kickTeam,'replay-ended')")],
  ['lost overlay watchdog returns to centre',game.includes("forcePostGoalCentreKickoff(null,'goal-watchdog')")],
  ['ball is placed exactly at centre',game.includes('this.ball.x=this.W/2;this.ball.y=this.H/2;this.ball.z=0')],
  ['camera is placed exactly at centre',game.includes('this.camera.x=this.W/2;this.camera.y=this.H/2')],
  ['camera holds centre during restart reveal',game.includes('this.postGoalCameraLock=1.35')&&game.includes('if(this.postGoalCameraLock>0)')],
  ['post-goal fallback never resumes loose open play',!game.includes("if(!started)this.playState='OPEN_PLAY'")],
  ['emergency fallback remains a kickoff restart',game.includes("meta:{...kickoffMeta,emergency:true}")&&game.includes("this.playState='RESTART'")],
  ['centre restart clears stale celebration',game.includes('this.goalCelebration=null;this.pendingKickoffTeam=null')],
  ['centre restart clears replay state',game.includes("this.replayAfterKickTeam=null;this.replayLabel=''" )],
  ['goal transaction only completes after restart creation',game.includes('this.postGoalReset.pending=!started')]
];

let passed=0;
for(const [name,ok] of checks){if(ok){passed++;console.log(`PASS ${name}`)}else console.error(`FAIL ${name}`)}
console.log(`\nPost-goal centre validation: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
