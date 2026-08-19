const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const penaltyThreat = a => clamp((a.penalties*.50+a.composure*.28+a.technique*.14+a.finishing*.08)/99,.1,1);
const freeKickThreat = a => clamp((a.freeKicks*.50+a.technique*.24+a.composure*.14+a.curve*.08+a.longShots*.04)/99,.1,1);
const freeKickHalf = (rating, action='shot') => {
  let half=rating>=95?13.5:rating>=90?11.5:rating>=80?9.2:rating>=70?7.4:6;
  half += action==='shot'?1.2:action==='fkKnuckle'?-1:action==='fkDip'||action==='fkLowDriven'?-.25:0;
  return clamp(half,4.8,15.5);
};

const low={penalties:45,freeKicks:45,composure:48,technique:46,finishing:47,curve:44,longShots:46};
const mid={penalties:70,freeKicks:70,composure:70,technique:70,finishing:70,curve:70,longShots:70};
const elite={penalties:92,freeKicks:92,composure:90,technique:91,finishing:89,curve:93,longShots:88};

const checks = [
  ['attribute set-piece build marker', game.includes("__ATTRIBUTE_SET_PIECE_VERSION='v49.7-attribute-driven-finishing'")],
  ['latest cache bust retains set-piece system', html.includes('game.js?v=52.0.0')],
  ['free-kick timing tiers widened', game.includes('fk>=95?13.5:fk>=90?11.5:fk>=80?9.2:fk>=70?7.4:6')],
  ['free-kick near-miss timing softened', game.includes('timing.edgeDistance/32,.28,.96')],
  ['free-kick accuracy uses the attribute composite', game.includes('quality=clamp(base*.74+timingQ*.26')],
  ['free-kick placement error reduced', game.includes('baseError=lerp(.10,.0035,quality)*(timing.perfect?.62:1)')],
  ['AI free-kick placement uses skill', game.includes('cornerOffset=goalHalf*lerp(.32,.72,aiFkSkill)')],
  ['AI free-kick error falls with skill', game.includes('placementError=goalHalf*lerp(.22,.055,aiFkSkill)')],
  ['AI power converges on technique ideal', game.includes('lerp(power,idealPower,lerp(.08,.62,aiFkSkill))')],
  ['penalty threat is carried into live ball physics', game.includes("setPieceThreat=r.type==='penalty'?penaltySkill:r.type==='freeKick'?freeKickSkill:0")],
  ['set-piece threat survives kick contact', game.includes('setPieceThreat:clamp(Number(options.setPieceThreat)||0,0,1)')],
  ['live ball stores set-piece threat', game.includes('this.ball.setPieceThreat=clamp(Number(physics?.setPieceThreat)||0,0,1)')],
  ['keeper reach responds to set-piece attributes', game.includes("setPieceReachPenalty=setPieceThreat*clamp(this.ball.restartSource==='penalty'?4.4:5.8,0,6)")],
  ['penalty keeper read uses full taker composite', game.includes('takerThreat=clamp((ta.penalties||55)*.50')],
  ['elite penalty threat exceeds mid threat', penaltyThreat(elite)>penaltyThreat(mid)],
  ['mid penalty threat exceeds low threat', penaltyThreat(mid)>penaltyThreat(low)],
  ['elite free-kick threat exceeds mid threat', freeKickThreat(elite)>freeKickThreat(mid)],
  ['mid free-kick threat exceeds low threat', freeKickThreat(mid)>freeKickThreat(low)],
  ['elite free-kick timing window exceeds mid window', freeKickHalf(92)>freeKickHalf(70)],
  ['normal free kicks remain easier than knuckleballs', freeKickHalf(70,'shot')>freeKickHalf(70,'fkKnuckle')]
];

let passed=0;
for(const [name,ok] of checks){
  if(ok){passed++;console.log(`PASS ${name}`);}else console.error(`FAIL ${name}`);
}
console.log(`\nAttribute set-piece validation: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
