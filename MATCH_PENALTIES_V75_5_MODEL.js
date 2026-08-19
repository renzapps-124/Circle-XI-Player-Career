// Models the shipped match-penalty aim + goal geometry to measure outcome rates.
// Pulls the live constants out of game.js so it cannot drift from the code.
const fs = require('fs');
const game = fs.readFileSync(process.argv[2] || 'game.js', 'utf8');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function gaussianRandom() {           // same Box-Muller shape the engine uses
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- constants scraped from game.js ---------------------------------------
// The training drill (performPenaltyTrainingKick) uses the same expression shapes as the
// match, and sits earlier in the file, so anything user-side must be scoped to the match
// function or it silently reads the drill's numbers instead.
const mStart = game.indexOf('takePenaltyTrainingSetPiece(technique=');
if (mStart < 0) throw Error('match penalty function not found');
const matchFn = game.slice(mStart, mStart + 4000);
function num(re, label) {
  const m = game.match(re);
  if (!m) throw Error('could not find ' + label);
  return m.slice(1).map(Number);
}
function numIn(src, re, label) {
  const m = src.match(re);
  if (!m) throw Error('could not find ' + label + ' in the match penalty function');
  return m.slice(1).map(Number);
}
const [GOAL_TOP, GOAL_BOTTOM] = num(/this\.goalTop = (\d+); this\.goalBottom = (\d+)/, 'goal bounds');
const [H] = num(/this\.H = (\d+);/, 'pitch height');
const [CROSSBAR] = num(/const crossbarHeight=(\d+);/, 'crossbar');
let GY_LO, GY_HI;
{
  const m = game.match(/gy=clamp\(this\.H\/2\+visual\*2\*goalHalf\*\(r\.team===0\?1:-1\),this\.goalTop-(\d+),this\.goalBottom\+(\d+)\)/);
  if (m) { GY_LO = +m[1]; GY_HI = +m[2]; }
  else if (/goalTop\+5,this\.goalBottom-5\),d=Math\.hypot\(gx-taker\.x/.test(game)) { GY_LO = -5; GY_HI = -5; }  // pre-change: clamped inside the frame
  else throw Error('could not find gy clamp');
}
const [AI_C0, AI_C1, AI_S0, AI_S1, AI_XLO, AI_XHI] =
  num(/aiAimX=clamp\(\.5\+aiSide\*lerp\(([\d.]+),([\d.]+),penSkill\)\+gaussianRandom\(\)\*lerp\(([\d.]+),([\d.]+),penSkill\),(-?[\d.]+),([\d.]+)\)/, 'ai aimX');
const [AI_Y0, AI_Y1, AI_YS0, AI_YS1, AI_YLO, AI_YHI] =
  num(/aiAimY=clamp\(lerp\(([\d.]+),([\d.]+),penSkill\)\+gaussianRandom\(\)\*lerp\(([\d.]+),([\d.]+),penSkill\),(-?[\d.]+),([\d.]+)\)/, 'ai aimY');
const [Q_STAB, Q_TIME, Q_AIM, Q_PRESS, Q_FLOOR] =
  numIn(matchFn, /quality=clamp\(stability\*([\d.]+)\+timingQ\*([\d.]+)\+aimQ\*([\d.]+)-pressurePenalty\*([\d.]+),([\d.]+),\.998\)/, 'quality mix');
const [ERR_HI, ERR_LO] = numIn(matchFn, /baseError=lerp\(([\d.]+),([\d.]+),quality\)/, 'base error');
const [UX_LO, UX_HI] = numIn(matchFn, /finalAimX=clamp\(aimX\+gaussianRandom\(\)\*baseError,(-?[\d.]+),([\d.]+)\)/, 'user aimX clamp');
const [UY_MULT, UY_LO, UY_HI] = numIn(matchFn, /finalAimY=clamp\(aimY\+gaussianRandom\(\)\*baseError\*([\d.]+),(-?[\d.]+),([\d.]+)\)/, 'user aimY clamp');
let H_TOP, H_BOT, H_OVER;
{
  const m = game.match(/penAimY>=0\?Math\.max\(0,lerp\((\d+),(\d+),penAimY\)\):34\+\(-penAimY\)\*(\d+)/);
  if (m) { H_TOP = +m[1]; H_BOT = +m[2]; H_OVER = +m[3]; }
  else {
    const o = game.match(/const targetHeight=lerp\(r\.type==='freeKick'\?37:(\d+),([\d.]+),/);   // pre-change: linear, capped below the bar
    if (!o) throw Error('could not find height map');
    H_TOP = +o[1]; H_BOT = +o[2]; H_OVER = 0;
  }
}
const [REACH_PEN] = num(/restartSource==='penalty'\?([\d.]+):5\.8/, 'keeper reach penalty');

const GOAL_HALF = (GOAL_BOTTOM - GOAL_TOP) / 2 - 6;
const POST_BAND = 5;      // goal() requires y>goalTop+5 and y<goalBottom-5
const Z_LIMIT = CROSSBAR - 3;
const KEEPER_RATING = 62;   // a typical league goalkeeper

// ---- outcome from a final aim ---------------------------------------------
function outcome(finalAimX, finalAimY, keeperReach, keeperGuessSide) {
  const gy = clamp(H / 2 + (finalAimX - .5) * 2 * GOAL_HALF, GOAL_TOP - GY_LO, GOAL_BOTTOM + GY_HI);
  const z = finalAimY >= 0 ? Math.max(0, lerp(H_TOP, H_BOT, finalAimY)) : H_TOP + (-finalAimY) * H_OVER;
  const insideY = gy > GOAL_TOP + POST_BAND && gy < GOAL_BOTTOM - POST_BAND;
  const insideZ = z < Z_LIMIT;
  const nearPost = Math.abs(gy - GOAL_TOP) <= 5 || Math.abs(gy - GOAL_BOTTOM) <= 5;
  const nearBar = Math.abs(z - CROSSBAR) <= 3.5;
  if (nearPost || nearBar) return "WOODWORK";
  if (!insideY || !insideZ) return "OFF_TARGET";
  // A committed dive leaves the centre open; standing up leaves the corners open.
  const lateral = Math.abs(gy - H / 2), side = Math.sign(gy - H / 2) || 1;
  const bonus = keeperReach - 14;                      // scales down as taker threat rises
  const high = z > 26;                                 // hard to reach up as well as across
  let covered;
  if (keeperGuessSide === 0) covered = lateral < 17 + bonus;
  else if (keeperGuessSide === side) covered = lateral > 10 && lateral < 47 + bonus;
  else covered = false;
  if (covered && high) covered = Math.random() < .55;   // top half is harder to keep out
  return covered ? "SAVE" : "GOAL";
}

function runAi(penRating, n = 40000) {
  const a = penRating, pen = a, comp = a, tech = a, fin = a;
  const penSkill = clamp((pen * .50 + comp * .28 + tech * .14 + fin * .08) / 99, .1, 1);
  const keeperReach = 17 + 55 * .085 - penSkill * REACH_PEN;
  const tally = { GOAL: 0, SAVE: 0, WOODWORK: 0, OFF_TARGET: 0 };
  for (let i = 0; i < n; i++) {
    const side = Math.random() < .5 ? -1 : 1;
    const fx = clamp(.5 + side * lerp(AI_C0, AI_C1, penSkill) + gaussianRandom() * lerp(AI_S0, AI_S1, penSkill), AI_XLO, AI_XHI);
    const fy = clamp(lerp(AI_Y0, AI_Y1, penSkill) + gaussianRandom() * lerp(AI_YS0, AI_YS1, penSkill), AI_YLO, AI_YHI);
    const guess = Math.random() < .24 ? Math.sign(fx - .5) : [-1, 0, 1][Math.floor(Math.random() * 3)];
    tally[outcome(fx, fy, keeperReach, guess)]++;
  }
  return tally;
}

function runUser(penRating, aimX, aimY, timingPerfect, n = 40000) {
  const pen = penRating, comp = penRating, tech = penRating, fin = penRating;
  const stability = clamp((pen * .48 + comp * .30 + tech * .14 + fin * .08) / 100, 0, 1);
  const penSkill = clamp((pen * .50 + comp * .28 + tech * .14 + fin * .08) / 99, .1, 1);
  const keeperReach = 17 + 55 * .085 - penSkill * REACH_PEN;
  const xN = Math.abs(aimX - .5) * 2, yN = Math.abs(aimY - .5) * 2;
  const aimQ = clamp(xN * .70 + yN * .34, 0, 1);
  const timingQ = timingPerfect ? 1 : .62;
  const quality = clamp(stability * Q_STAB + timingQ * Q_TIME + aimQ * Q_AIM - 0 * Q_PRESS, Q_FLOOR, .998);
  const baseError = lerp(ERR_HI, ERR_LO, quality);
  const takerThreat = penRating;
  const tally = { GOAL: 0, SAVE: 0, WOODWORK: 0, OFF_TARGET: 0 };
  for (let i = 0; i < n; i++) {
    const fx = clamp(aimX + gaussianRandom() * baseError, UX_LO, UX_HI);
    const fy = clamp(aimY + gaussianRandom() * baseError * UY_MULT, UY_LO, UY_HI);
    const readChance = clamp(.185 + (KEEPER_RATING - 60) * .0034 - (takerThreat - 60) * .0042, .06, .42);
    let guess = [-1, 0, 1][Math.floor(Math.random() * 3)];
    if (Math.random() < readChance) guess = Math.sign(fx - .5);
    else if (Math.random() < .46) guess = [-1, 0, 1][Math.floor(Math.random() * 3)];
    tally[outcome(fx, fy, keeperReach, guess)]++;
  }
  return tally;
}

const pct = (t) => {
  const n = Object.values(t).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +(v / n * 100).toFixed(1)]));
};

console.log(`geometry: goal ${GOAL_TOP}-${GOAL_BOTTOM}, crossbar ${CROSSBAR}, gy clamp -${GY_LO}/+${GY_HI}, keeper reach penalty ${REACH_PEN}`);
console.log('\nAI TAKER (opponents and team-mates use this same branch)');
console.log('rating |  GOAL |  SAVE |  WOOD |  OFF');
for (const r of [30, 45, 60, 75, 90, 99]) {
  const p = pct(runAi(r));
  console.log(String(r).padStart(6), '|', String(p.GOAL).padStart(5), '|', String(p.SAVE).padStart(5), '|', String(p.WOODWORK).padStart(5), '|', String(p.OFF_TARGET).padStart(5));
}
console.log('\nUSER, aimed into a corner (aimX .16 / aimY .24), perfect timing');
console.log('rating |  GOAL |  SAVE |  WOOD |  OFF');
for (const r of [30, 45, 60, 75, 90, 99]) {
  const p = pct(runUser(r, .16, .24, true));
  console.log(String(r).padStart(6), '|', String(p.GOAL).padStart(5), '|', String(p.SAVE).padStart(5), '|', String(p.WOODWORK).padStart(5), '|', String(p.OFF_TARGET).padStart(5));
}
console.log('\nUSER, aimed straight down the middle (aimX .5 / aimY .5), perfect timing');
console.log('rating |  GOAL |  SAVE |  WOOD |  OFF');
for (const r of [30, 60, 90]) {
  const p = pct(runUser(r, .5, .5, true));
  console.log(String(r).padStart(6), '|', String(p.GOAL).padStart(5), '|', String(p.SAVE).padStart(5), '|', String(p.WOODWORK).padStart(5), '|', String(p.OFF_TARGET).padStart(5));
}
console.log('\nUSER, corner aim but mistimed');
console.log('rating |  GOAL |  SAVE |  WOOD |  OFF');
for (const r of [30, 60, 90]) {
  const p = pct(runUser(r, .16, .24, false));
  console.log(String(r).padStart(6), '|', String(p.GOAL).padStart(5), '|', String(p.SAVE).padStart(5), '|', String(p.WOODWORK).padStart(5), '|', String(p.OFF_TARGET).padStart(5));
}
