const fs=require('fs');

const game=fs.readFileSync('game.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');

const checks=[
  ['performance build marker',game.includes("__MATCH_PERFORMANCE_VERSION='v49.4-adaptive-rendering'")],
  ['low-latency opaque canvas',game.includes("getContext('2d',{alpha:false,desynchronized:true})")],
  ['adaptive DPR cap',game.includes("mode==='High'?1.75:mode==='Low'?1:((this.adaptiveQualityTier||0)>0?1.25:1)")],
  ['frame-time quality budget',game.includes('updatePerformanceBudget(frameTime)')&&game.includes('stats.averageMs>20.5')&&game.includes('stats.averageMs<18')],
  ['bounded simulation catch-up',game.includes("maxSteps=mode==='High'?8:mode==='Low'?3:4")&&game.includes('droppedCatchup++')],
  ['adaptive render throttling',game.includes("renderInterval=(mode==='Low'||(mode==='Auto'&&this.adaptiveQualityTier===0))?1000/30:0")],
  ['HUD refresh throttling',game.includes('nextHudRefreshAt')&&game.includes("performanceMode||'Auto')==='Low'?160:100")],
  ['clock DOM caching',game.includes('if(text===this.lastClockText)return')],
  ['off-camera player culling',game.includes('const visiblePlayers=this.players.filter')],
  ['crowd detail and culling',game.includes("crowdDetail==='Off'")&&game.includes('crowdStep')],
  ['cached screen atmosphere',game.includes('this.screenAtmosphereCache')&&game.includes("document.createElement('canvas')")],
  ['particle detail scaling',game.includes("particleSetting!=='Off'")&&game.includes("particleSetting==='Low'")],
  ['single weather particle pass',!game.includes('for(let i=0;i<120;i++){const seed=(i*97')],
  ['20 FPS replay sampling',/REPLAY_FRAME_INTERVAL\s*=\s*1\s*\/\s*20/.test(game)],
  ['bounded replay history',/REPLAY_BUFFER_FRAMES\s*=\s*480/.test(game)],
  ['idle net replay snapshots skipped',game.includes('nets:netActive?this.snapshotNetPhysics():null')],
  ['replay pruning batched',game.includes('REPLAY_BUFFER_FRAMES+40')&&game.includes('splice(0,40)')],
  ['reduced live-canvas blur cost',css.includes('body[data-performance="Auto"]')&&css.includes('backdrop-filter:none')],
  ['cache-busted game script',html.includes('game.js?v=52.0.0')],
];

let passed=0;
for(const [name,ok] of checks){
  if(ok)passed++;
  console.log(`${ok?'PASS':'FAIL'}: ${name}`);
}
console.log(`\n${passed}/${checks.length} performance checks passed.`);
process.exitCode=passed===checks.length?0:1;
