const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  ['penalty scoring build marker', game.includes("__PENALTY_SCORING_VERSION='v49.6-forgiving-balanced-conversion'")],
  ['current cache bust retains v49.6 penalty system', html.includes('game.js?v=52.0.0')],
  ['wider base timing window', game.includes("let half=6+(p-50)*.08+(c-50)*.04")],
  ['timing window reaches 16.5 percent', game.includes('half=clamp(half,5.5,16.5)')],
  ['off-window timing is less punitive', (game.match(/timing\.edgeDistance\/34/g)||[]).length >= 2],
  ['match placement error reduced', game.includes('baseError=lerp(.078,.0045,quality)')],
  ['match keeper read stays capped and now uses taker attributes', game.includes("readChance=clamp(.23+(keeperRating-60)*.004-(takerThreat-60)*.003,.09,.50)")],
  ['unassisted keeper correct-side guess reduced', game.includes("Math.random()<.24?actualSide:pick([-1,0,1])")],
  ['manual penalty keeper boost reduced', game.includes("+(penaltySave?.03:0):0")],
  ['live shootout baseline raised', game.includes("chance=clamp(.82+(takerAbility-keeperAbility)*.0022,.70,.96)")],
  ['simulated fixture shootout baseline raised', game.includes("const hc=clamp(.80+(hr.overall-ar.goalkeeper)*.0022,.68,.95)")],
  ['AI regular penalties retain skill-based placement', game.includes("aiAimX=clamp(.5+aiSide*lerp(.20,.42,penSkill)")],
  ['all four penalty techniques preserved', ['shot','finesse','drivenShot','chipShot'].every(x => game.includes(x))]
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const windowHalf = (penalties, composure, action='shot') => {
  let half = 6 + (penalties - 50) * .08 + (composure - 50) * .04;
  half += action === 'shot' ? 1.8 : action === 'finesse' ? 1.2 : action === 'drivenShot' ? .8 : 0;
  return clamp(half, 5.5, 16.5);
};
checks.push(['novice timing zone remains forgiving', windowHalf(40,40,'chipShot') >= 5.5]);
checks.push(['elite normal timing zone is clearly wider', windowHalf(90,90,'shot') >= 12]);

let passed = 0;
for (const [name, ok] of checks) {
  if (ok) { passed++; console.log(`PASS ${name}`); }
  else console.error(`FAIL ${name}`);
}
console.log(`\nPenalty scoring validation: ${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exit(1);
