// Regression checks for v75.5: match penalty rebalance.
// Run: node MATCH_PENALTIES_V75_5_VALIDATION.js
const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const C = [];
const ck = (n, v) => C.push([n, !!v]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.5.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 5)));
}

// ---- pull the live constants so the checks cannot drift from the code ------
// performPenaltyTrainingKick (the training drill) uses the same expression shapes and
// sits earlier in the file, so anything user-side must be scoped to the match function
// or it silently reads the drill's numbers instead.
const mStart = game.indexOf('takePenaltyTrainingSetPiece(technique=');
if (mStart < 0) throw Error('match penalty function not found');
const matchFn = game.slice(mStart, mStart + 4000);
function grab(re, label) {
  const m = game.match(re);
  if (!m) throw Error('could not find ' + label);
  return m.slice(1).map(Number);
}
function grabIn(src, re, label) {
  const m = src.match(re);
  if (!m) throw Error('could not find ' + label + ' in the match penalty function');
  return m.slice(1).map(Number);
}
const [GOAL_TOP, GOAL_BOTTOM] = grab(/this\.goalTop = (\d+); this\.goalBottom = (\d+)/, 'goal bounds');
const [PITCH_H] = grab(/this\.H = (\d+);/, 'pitch height');
const [CROSSBAR] = grab(/const crossbarHeight=(\d+);/, 'crossbar');
const [GY_LO, GY_HI] = grab(/this\.goalTop-(\d+),this\.goalBottom\+(\d+)\),d=Math\.hypot\(gx-taker\.x/, 'gy clamp');
const [H_TOP, H_BOT, H_OVER] = grab(/penAimY>=0\?Math\.max\(0,lerp\((\d+),(\d+),penAimY\)\):34\+\(-penAimY\)\*(\d+)/, 'height map');
const [ERR_HI, ERR_LO] = grabIn(matchFn, /baseError=lerp\(([\d.]+),([\d.]+),quality\)/, 'base error');
const [UX_LO, UX_HI] = grabIn(matchFn, /finalAimX=clamp\(aimX\+gaussianRandom\(\)\*baseError,(-?[\d.]+),([\d.]+)\)/, 'user aimX clamp');
const [UY_MULT, UY_LO, UY_HI] = grabIn(matchFn, /finalAimY=clamp\(aimY\+gaussianRandom\(\)\*baseError\*([\d.]+),(-?[\d.]+),([\d.]+)\)/, 'user aimY clamp');
const [Q_STAB, Q_TIME, Q_AIM] = grabIn(matchFn, /quality=clamp\(stability\*([\d.]+)\+timingQ\*([\d.]+)\+aimQ\*([\d.]+)-pressurePenalty/, 'quality mix');
const [AI_C0, AI_C1, AI_S0, AI_S1, AI_XLO, AI_XHI] =
  grab(/aiAimX=clamp\(\.5\+aiSide\*lerp\(([\d.]+),([\d.]+),penSkill\)\+gaussianRandom\(\)\*lerp\(([\d.]+),([\d.]+),penSkill\),(-?[\d.]+),([\d.]+)\)/, 'ai aimX');
const [AI_Y0, AI_Y1, AI_YS0, AI_YS1, AI_YLO, AI_YHI] =
  grab(/aiAimY=clamp\(lerp\(([\d.]+),([\d.]+),penSkill\)\+gaussianRandom\(\)\*lerp\(([\d.]+),([\d.]+),penSkill\),(-?[\d.]+),([\d.]+)\)/, 'ai aimY');
const [READ_BASE, READ_GK, READ_TAKER, READ_LO, READ_HI] =
  grab(/const readChance=clamp\(([\d.]+)\+\(keeperRating-60\)\*([\d.]+)-\(takerThreat-60\)\*([\d.]+),([\d.]+),([\d.]+)\)/, 'keeper read');
const [REACH_PEN] = grab(/restartSource==='penalty'\?([\d.]+):5\.8/, 'keeper reach penalty');

const GOAL_HALF = (GOAL_BOTTOM - GOAL_TOP) / 2 - 6;
const gyFor = fx => clamp(PITCH_H / 2 + (fx - .5) * 2 * GOAL_HALF, GOAL_TOP - GY_LO, GOAL_BOTTOM + GY_HI);
const zFor = fy => fy >= 0 ? Math.max(0, lerp(H_TOP, H_BOT, fy)) : H_TOP + (-fy) * H_OVER;

// ---- 1. a penalty can now actually miss -----------------------------------
ck('goal-line target is no longer clamped inside the frame', GY_LO > 0 && GY_HI > 0);
ck('a wide aim clears the post', gyFor(UX_LO) < GOAL_TOP + 5 && gyFor(UX_HI) > GOAL_BOTTOM - 5);
ck('the user aim clamps allow leaving the frame', UX_LO < 0 && UX_HI > 1 && UY_LO < 0);
ck('the AI aim clamps allow leaving the frame', AI_XLO < 0 && AI_XHI > 1 && AI_YLO < 0);
ck('a high overhit clears the crossbar', zFor(UY_LO) > CROSSBAR);
ck('a deliberate top-corner aim still stays under the bar', zFor(0) < CROSSBAR - 3 && zFor(.05) < CROSSBAR - 5);
ck('a deliberate low aim stays on the deck', zFor(1) < 6);
ck('height mapping is continuous at the frame edge', Math.abs(zFor(0) - zFor(-0.0001)) < .05);
ck('height never goes negative or NaN across the whole aim range',
  Array.from({ length: 200 }, (_, i) => zFor(UY_LO + (UY_HI - UY_LO) * i / 199)).every(z => Number.isFinite(z) && z >= 0));
ck('goal-line target stays finite across the whole aim range',
  Array.from({ length: 200 }, (_, i) => gyFor(UX_LO + (UX_HI - UX_LO) * i / 199)).every(v => Number.isFinite(v)));

// ---- 2. lower ratings spray it more ---------------------------------------
ck('error band is far wider at the bottom than the top', ERR_HI / ERR_LO > 15);
// How many standard deviations a corner-aimed kick sits from the near post.
const sigmasToPost = (stability) => {
  const aimQ = .65, timingQ = 1, aimX = .16;
  const q = clamp(stability * Q_STAB + timingQ * Q_TIME + aimQ * Q_AIM, .14, .998);
  const err = lerp(ERR_HI, ERR_LO, q);
  const postAimX = .5 - (PITCH_H / 2 - (GOAL_TOP + 5)) / (2 * GOAL_HALF);   // aim that lands on the post
  return (aimX - postAimX) / err;
};
ck('a poor taker is close enough to the post to hit it or miss', sigmasToPost(.30) < 2.5);
ck('an elite taker is far enough from the post to stay on target', sigmasToPost(.99) > 6);
ck('rating meaningfully changes how close to disaster the kick is', sigmasToPost(.99) / sigmasToPost(.30) > 3);
ck('AI scatter shrinks with skill', lerp(AI_S0, AI_S1, .1) > lerp(AI_S0, AI_S1, 1) * 3);
ck('AI height scatter shrinks with skill', lerp(AI_YS0, AI_YS1, .1) > lerp(AI_YS0, AI_YS1, 1) * 2.5);

// ---- 3. placement is rewarded ---------------------------------------------
ck('where you aim now counts for more than it did', Q_AIM >= .22);
ck('a corner aim beats a diving keeper on width', (() => {
  const corner = Math.abs(gyFor(.16) - PITCH_H / 2);
  const centre = Math.abs(gyFor(.5) - PITCH_H / 2);
  return corner > 40 && centre < 2;
})());
ck('keeper reads the side less often than before', READ_BASE < .23 && READ_HI < .50);
ck('a strong taker suppresses the read more than before', READ_TAKER > .003);
ck('a strong taker pushes the keeper reach down further', REACH_PEN > 4.4);

// ---- 4. AI takers (opponents and team-mates share this branch) ------------
ck('a weak AI taker now aims wider than it used to', AI_C0 > .20);
ck('an elite AI taker aims into the corner but off the post', AI_C1 > .40 && gyFor(.5 + AI_C1) < GOAL_BOTTOM - 8);
ck('AI aims lower on average as skill rises', AI_Y0 > AI_Y1);
ck('the AI penalty branch derives its side from r.team, so it serves both sides', (() => {
  const i = game.indexOf("const a=taker.attrs||{},penSkill=clamp(((a.penalties||55)*.50");
  if (i < 0) return false;
  const body = game.slice(i, i + 1400);
  return body.includes('r.team===0?this.W+16:-16') && body.includes('(r.team===0?1:-1)');
})());
ck('the AI taker is whoever the restart nominated, not a fixed player',
  game.includes('const a=taker.attrs||{},penSkill='));

// ---- 5. nothing else about the restart pipeline changed shape -------------
ck('penalty still routes through the shared restart kick plan', game.includes("r.type==='penalty'?penaltySkill:"));
ck('free kicks kept their own height mapping', /r\.type==='freeKick'\?lerp\(37,3\.5,penAimY\)/.test(game));
ck('free kick lift ceiling untouched', /r\.type==='freeKick'\?190:152/.test(game));
ck('keeper still only reads penalties from the taker aim', game.includes('matchPenaltyKeeperRead(finalAimX,r.taker)'));

let pass = 0;
for (const [n, v] of C) { console.log(v ? 'PASS' : 'FAIL', n); if (v) pass++ }
console.log(`\nMatch penalties v75.5: ${pass}/${C.length} checks passed`);
if (pass !== C.length) process.exit(1);
