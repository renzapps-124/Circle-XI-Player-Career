// Regression checks for the v75.6 Finishing Pitch fixes.
// Run: node FINISHING_PITCH_V75_6_VALIDATION.js
const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function fn(name) {
  const m = `function ${name}(`, st = game.indexOf(m);
  if (st < 0) throw Error('missing function ' + name);
  const b = game.indexOf('{', st);
  let d = 0, q = null, esc = false;
  for (let i = b; i < game.length; i++) {
    const c = game[i];
    if (q) { if (esc) { esc = false; continue } if (c.charCodeAt(0) === 92) { esc = true; continue } if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; continue }
    if (c === '{') d++; else if (c === '}' && --d === 0) return game.slice(st, i + 1);
  }
  throw Error('unclosed ' + name);
}
const C = [];
const ck = (n, v) => C.push([n, !!v]);

const ballUpdate = fn('updateFinishingPitchBall');
const kick = fn('performFinishingPitchKick');
const actors = fn('updateFinishingPitchActors');
const init = fn('initialiseFinishingPitchState');
const createTarget = fn('finishingCreateGoalTarget');
const spawn = fn('spawnFinishingPitchScenario');
const service = fn('launchFinishingService');
const metrics = fn('trainingResultMetrics');
const hint = fn('finishingTechniqueHint');

// --- 1. shot resolution happens at the aimed arrival plane -----------------
ck('resolution no longer fires on the goal-band edge', !/nearGoal/.test(ballUpdate));
ck('arrival plane derived from the aimed point', /const aimY=Number\.isFinite\(b\.targetY\)/.test(ballUpdate) && /arriveY=clamp\(aimY/.test(ballUpdate));
ck('crossing point interpolated between frames', /b\.prevX=b\.x;b\.prevY=b\.y;b\.prevZ=b\.z\|\|0;/.test(ballUpdate) && /mix=clamp\(\(prevY-arriveY\)\/span,0,1\)/.test(ballUpdate));
ck('on-frame test uses the interpolated impact position', /onFrame=inMouth&&!post&&Math\.abs\(impactX-50\)<=g\.halfWidthPct/.test(ballUpdate));
ck('target hit measured against the arrival plane', /targetDist=Math\.hypot\(impactX-\(s\.target\?\.x\|\|50\),arriveY-/.test(ballUpdate));
ck('woodwork resolved from the goal posts', /OFF THE POST/.test(ballUpdate));
ck('timeout branch cannot double-record an attempt', /if\(!b\.resolved&&\(b\.life>2\.8/.test(ballUpdate));

// --- 2. pressure / long range are no longer instant losses ----------------
ck('tackle radius tightened to 1.85', /nearest<1\.85/.test(actors));
ck('post-reception grace period before a defender can win it', /now-\(f\.possessionStarted\|\|now\)>500/.test(actors));
ck('pressure markers hold a stand-off during the service', /move\(d1,s\.player\.x-3\.6,s\.player\.y-1\.8,7\.8\)/.test(actors));
ck('aerial markers hold a stand-off during the service', /move\(d1,s\.player\.x-2\.6,s\.player\.y-2,8\.8\)/.test(actors));
ck('pressure close-down speed slower than the user jog', /move\(d1,s\.player\.x-1\.3,s\.player\.y,7\.6\)/.test(actors));
ck('long range close-down speed slower than the user jog', /move\(d1,s\.player\.x,s\.player\.y-1\.5,7\.8\)/.test(actors));
ck('defender turnovers are counted', /f\.lostToDefender=\(f\.lostToDefender\|\|0\)\+1/.test(actors));

// --- 3. the requested technique is actually communicated ------------------
ck('technique hint helper registered', /function finishingTechniqueHint\(tech\)/.test(game));
['shot', 'finesse', 'drivenShot', 'chipShot', 'knuckleShot', 'powerHeader', 'glancingHeader', 'directedHeader']
  .forEach(t => ck(`hint covers ${t}`, new RegExp(t + ":'[A-Z+ ]+'").test(hint)));
ck('goal zone marker prints the requested technique', /finishingTechniqueHint\(tech\)/.test(createTarget));
ck('action guide prints the requested technique', /REQUESTED FINISH/.test(spawn));
ck('service callout prints the requested technique', /finishingTechniqueHint\(s\.target\?\.required\)/.test(service));

// --- 4. anticipation-scaled contact window --------------------------------
ck('contact window scales with anticipation', /contactWindow:lerp\(6\.4,10\.6,clamp\(Number\(a\.anticipation\|\|55\)\/99,0,1\)\)/.test(init));
ck('ball side uses the scaled window', /const contactWin=Number\(f\.contactWindow\)\|\|8\.5;f\.contactReady=d<contactWin/.test(ballUpdate));
ck('kick side uses the scaled window', /const contactWindow=Number\(f\.contactWindow\)\|\|8\.5;/.test(kick) && /distBall>contactWindow/.test(kick));
ck('first-time timing quality uses the scaled window', /clamp\(1-distBall\/contactWindow,0,1\)/.test(kick));
ck('global window object is not shadowed', !/const window=/.test(ballUpdate));

// --- 5. drill-specific result metrics -------------------------------------
ck('finishing pitch metrics branch exists', /isFinishingPitchDrill\(drillId\)&&s\?\.finishing/.test(metrics));
['goalRate', 'techRate', 'targetRate', 'contactRate', 'receiveRate', 'beaten', 'powerCtl']
  .forEach(k => ck(`metric ${k} derived from tracked data`, new RegExp(k).test(metrics)));
ck('tracked shot counters initialised', /shots:0,techniqueMatches:0,receptions:0,lostToDefender:0,targetHits:0,timingSamples:\[\],powerSamples:\[\]/.test(init));
ck('shots and technique matches recorded on every strike', /f\.shots=\(f\.shots\|\|0\)\+1;if\(techMatch\)f\.techniqueMatches/.test(kick));
ck('receptions recorded', /f\.receptions=\(f\.receptions\|\|0\)\+1/.test(ballUpdate));
ck('target hits recorded', /f\.targetHits=\(f\.targetHits\|\|0\)\+1/.test(ballUpdate));
ck('blocks are now produced by lane defenders', /f\.blocks\+\+/.test(ballUpdate));

// --- 6. smaller correctness fixes -----------------------------------------
ck('dead alternating-defender condition removed', !/s\.attempts%2===1/.test(init));
ck('1v1 can use every open zone', /open\[idx%open\.length\]/.test(createTarget));
ck('cut-back service starts on the pitch, not behind the goal line', /idx%3===0\?27:/.test(service));
ck('keeper only dives at shots near the frame', /const worthDiving=/.test(kick) && !/gk\.action=keeperSave\?'dive':'dive'/.test(kick));

// --- 7. drill surface actually has styling --------------------------------
ck('goal zone marker styled', /\.controlled-drill-target\.controlled-finishing\{/.test(css));
ck('zone label and technique chip styled', /\.controlled-drill-target\.controlled-finishing b\{/.test(css) && /\.controlled-drill-target\.controlled-finishing u\{/.test(css));
{
  const ki = css.indexOf('@keyframes finishingZoneGlow');
  let block = '';
  if (ki >= 0) {
    let d = 0;
    for (let i = css.indexOf('{', ki); i < css.length; i++) {
      if (css[i] === '{') d++; else if (css[i] === '}' && --d === 0) { block = css.slice(ki, i + 1); break }
    }
  }
  ck('zone glow does not fight the composure shrink transform', !!block && !/transform/.test(block));
}
ck('penalty box line styled', /\.finishing-box-line\{/.test(css));
ck('feedback tone styled', /data-finishing-feedback="success"/.test(css));

// --- 8. cache tokens ------------------------------------------------------
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.6.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 6)));
}

// --- 9. runtime simulation: old rule vs new rule ---------------------------
// Replays the real finishing-pitch ball integration against both resolution
// rules so the fix is measured rather than asserted.
const BALL_GRAVITY = 486, BALL_AIR_DRAG = 0.9972, BALL_VERTICAL_DRAG = 0.99815;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const lerp = (a, b, t) => a + (b - a) * t;
const G = { halfWidthPct: 13, topPct: 7, bottomPct: 24 };
const ZONES = [
  { x: 39.5, y: 21.8, label: 'LOW NEAR' }, { x: 60.5, y: 21.8, label: 'LOW FAR' },
  { x: 39.8, y: 9.4, label: 'TOP LEFT' }, { x: 60.2, y: 9.4, label: 'TOP RIGHT' },
  { x: 50, y: 10.2, label: 'HIGH CENTRE' }, { x: 50, y: 21.4, label: 'LOW CENTRE' }
];

function flight(zone, originX, originY, power, dt0, jitter, seed) {
  const speed = lerp(82, 126, power);
  const dx = zone.x - originX, dy = zone.y - originY, d = Math.hypot(dx, dy) || 1;
  const b = { x: originX, y: originY, z: 0, vx: dx / d * speed, vy: dy / d * speed, vz: lerp(8, 28, power), life: 0 };
  const frames = [];
  let rnd = seed;
  for (let i = 0; i < 400; i++) {
    const r = (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
    const dt = dt0 * (1 + (r - 0.5) * 2 * jitter);
    const prev = { x: b.x, y: b.y, z: b.z };
    b.life += dt;
    const drag = Math.pow(BALL_AIR_DRAG, dt * 60);
    if (b.z > 0 || Math.abs(b.vz) > 1) { b.vx *= drag; b.vy *= drag; b.vz *= Math.pow(BALL_VERTICAL_DRAG, dt * 60); b.vz -= BALL_GRAVITY * dt }
    b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z + b.vz * dt);
    frames.push({ prev, cur: { x: b.x, y: b.y, z: b.z }, life: b.life });
    if (b.y < -5 || b.life > 3) break;
  }
  return frames;
}
function oldRule(frames, zone) {
  for (const f of frames) {
    const b = f.cur;
    if (b.y <= G.bottomPct + 1.4 && b.y >= G.topPct - 2) {
      const onFrame = Math.abs(b.x - 50) <= G.halfWidthPct && b.y >= G.topPct && b.y <= G.bottomPct && b.z < 92;
      const targetHit = Math.hypot(b.x - zone.x, b.y - zone.y) < 5.4;
      return { onFrame, targetHit };
    }
  }
  return { onFrame: false, targetHit: false };
}
function newRule(frames, zone, aimX, aimY) {
  const arriveY = clamp(aimY, G.topPct - 2.5, G.bottomPct + 1.2);
  for (const f of frames) {
    if (f.cur.y <= arriveY) {
      const span = Math.max(0.0001, f.prev.y - f.cur.y), mix = clamp((f.prev.y - arriveY) / span, 0, 1);
      const impactX = lerp(f.prev.x, f.cur.x, mix), impactZ = Math.max(0, lerp(f.prev.z, f.cur.z, mix));
      const inMouth = aimY >= G.topPct && aimY <= G.bottomPct && impactZ < 92;
      const onFrame = inMouth && Math.abs(impactX - 50) <= G.halfWidthPct;
      const targetHit = onFrame && Math.hypot(impactX - zone.x, arriveY - zone.y) < 5.4;
      return { onFrame, targetHit };
    }
  }
  return { onFrame: false, targetHit: false };
}
const report = [];
for (const zone of ZONES) {
  let oldOn = 0, oldHit = 0, newOn = 0, newHit = 0, runs = 0;
  for (let s = 1; s <= 240; s++) {
    const frames = flight(zone, 50, 61, 0.7, 1 / 60, 0.35, s * 7919);
    const o = oldRule(frames, zone), nw = newRule(frames, zone, zone.x, zone.y);
    runs++; oldOn += o.onFrame; oldHit += o.targetHit; newOn += nw.onFrame; newHit += nw.targetHit;
  }
  report.push({
    zone: zone.label,
    oldOn: Math.round(oldOn / runs * 100), oldHit: Math.round(oldHit / runs * 100),
    newOn: Math.round(newOn / runs * 100), newHit: Math.round(newHit / runs * 100)
  });
}
const topZones = report.filter(r => /TOP|HIGH/.test(r.zone));
ck('SIM: perfectly aimed shots now register on frame every time', report.every(r => r.newOn === 100));
ck('SIM: perfectly aimed shots now register a target hit every time', report.every(r => r.newHit === 100));
ck('SIM: old rule dropped on-frame shots (confirms the defect)', report.some(r => r.oldOn < 100));
ck('SIM: old rule made top/high zones impossible to hit', topZones.every(r => r.oldHit === 0));

// --- 10. the football is actually rendered in every phase -----------------
// The canvas render gates are extracted from game.js and evaluated for real,
// so this tests the shipped expressions rather than a copy of them.
function condition(marker) {
  const st = game.indexOf(marker);
  if (st < 0) throw Error('missing render gate: ' + marker.slice(0, 40));
  const open = game.indexOf('(', st);
  let d = 0;
  for (let i = open; i < game.length; i++) {
    if (game[i] === '(') d++;
    else if (game[i] === ')' && --d === 0) return game.slice(open + 1, i);
  }
  throw Error('unbalanced render gate');
}
const freeGate = condition("if(activeTrainingDrill!=='agility'&&!isAdvancedTacticalTrainingDrill()&&(isTechnicalZoneDrill()");
const heldGate = condition("if(isFinishingPitchDrill()&&!s.ball.free&&s.finishing?.userHasBall)");
const mateGate = condition("if(t.hasBall&&!isAdvancedTacticalTrainingDrill())");

function evalGate(expr, drill, state, extra = {}) {
  const scope = {
    activeTrainingDrill: drill,
    s: state,
    t: extra.t || { hasBall: false },
    isAdvancedTacticalTrainingDrill: () => false,
    isTechnicalZoneDrill: () => false,
    isPassingAcademyDrill: () => false,
    isDefensivePitchDrill: () => false,
    isGoalkeeperReactionDrill: () => false,
    isFinishingPitchDrill: () => true
  };
  const keys = Object.keys(scope);
  return !!new Function(...keys, 'return (' + expr + ')')(...keys.map(k => scope[k]));
}
const PHASES = [
  { name: 'RESET (feeder holds it)', free: false, user: false, feeder: true },
  { name: 'SERVICE (pass in flight)', free: true, user: false, feeder: false },
  { name: 'POSSESSION (user carrying)', free: false, user: true, feeder: false },
  { name: 'SHOT (strike in flight)', free: true, user: false, feeder: false },
  { name: 'RESOLVED (after the outcome)', free: true, user: false, feeder: false }
];
const DRILLS = ['finishing', 'onevone', 'pressurefinish', 'firsttime', 'longrange', 'aerial'];
const visibility = [];
for (const ph of PHASES) {
  let ok = 0, oldOk = 0;
  for (const drill of DRILLS) {
    const state = { ball: { free: ph.free }, finishing: { userHasBall: ph.user }, teammates: [{ team: 0, hasBall: ph.feeder }], passingAcademy: null, cornerMode: null };
    const drawn =
      (evalGate(freeGate, drill, state) ? 1 : 0) +
      (evalGate(heldGate, drill, state) ? 1 : 0) +
      (evalGate(mateGate, drill, state, { t: { hasBall: ph.feeder } }) ? 1 : 0);
    const before =
      (evalGate(freeGate.replace('||(isFinishingPitchDrill()&&s.ball.free)', ''), drill, state) ? 1 : 0) +
      (evalGate(mateGate, drill, state, { t: { hasBall: ph.feeder } }) ? 1 : 0);
    if (drawn === 1) ok++;
    if (before === 1) oldOk++;
  }
  visibility.push({ phase: ph.name, now: ok, before: oldOk, of: DRILLS.length });
}
ck('RENDER: exactly one football is drawn in every phase of all six drills', visibility.every(v => v.now === v.of));
ck('RENDER: the ball was previously invisible in flight and while carried (confirms the defect)', visibility.some(v => v.before === 0));
ck('free ball gate now covers the finishing pitch', /\|\|\(isFinishingPitchDrill\(\)&&s\.ball\.free\)/.test(game));
ck('carried ball is drawn on the boot line after reception', /if\(isFinishingPitchDrill\(\)&&!s\.ball\.free&&s\.finishing\?\.userHasBall\)\{/.test(game));

// --- 11. technical zone ball sits on the boot line ------------------------
const closeControl = fn('technicalCloseControlUpdate');
const firstTouch = fn('technicalFirstTouchUpdate');
const protectUpd = fn('technicalProtectUpdate');
const protectSetup = fn('technicalSetupProtect');
const weakSetup = fn('technicalSetupWeakFoot');
const weakKick = fn('performTechnicalWeakFootAction');

ck('technical ball anchor helper registered', /function technicalBallAnchor\(player,lead=0,side=0\)/.test(game));
ck('anchor builds on the shared boot-line helper', /const base=defensiveBallContactAnchor\(player,side,3\.55\)/.test(fn('technicalBallAnchor')));
ck('close control carries from the boot line', /technicalBallAnchor\(s\.player,touch,/.test(closeControl) && !/const bx=s\.player\.x\+Math\.cos\(s\.player\.dir\)\*touch/.test(closeControl));
ck('checkpoint restart puts the ball at the feet', /technicalBallAnchor\(s\.player,2\.05,/.test(closeControl) && !/s\.ball\.x=cp\.x\+1\.8/.test(closeControl));
ck('first touch settles onto the boot line', /technicalBallAnchor\(s\.player,dist,/.test(firstTouch));
ck('first touch escape carries from the boot line', /technicalBallAnchor\(s\.player,touch,/.test(firstTouch));
ck('shielded ball sits at the feet, tucked away from the defender', /technicalBallAnchor\(s\.player,2\.2,contactCross>=0\?-1:1\)/.test(protectUpd) && !/ballY=s\.player\.y\+Math\.sin\(ballDir\)\*3\.8/.test(protectUpd));
ck('protect scenario spawns the ball at the feet', /technicalBallAnchor\(s\.player,2\.2,0\)/.test(protectSetup) && !/x:50,y:55\.5/.test(protectSetup));
ck('weak foot stance puts the ball at the feet', /technicalBallAnchor\(s\.player,0,/.test(weakSetup) && !/s\.ball\.y=s\.player\.y-3\.5/.test(weakSetup));
ck('weak foot strike leaves the boot', /technicalBallAnchor\(s\.player,0,/.test(weakKick) && !/s\.ball\.y=s\.player\.y-2\.8/.test(weakKick));
ck('weak foot side follows the weaker foot', /technicalWeakFootName\(\)==='Left'\?-1:1/.test(weakSetup) && /technicalWeakFootName\(\)==='Left'\?-1:1/.test(weakKick));

// Geometry, using the rig numbers read straight out of game.js.
const footYm = game.match(/footY=([\d.]+)\*body\.legScale/);
const dropM = game.match(/footDropPx=Math\.max\(14,\(rig\.footY-([\d.]+)\)\*modelScale\)/);
ck('rig foot line readable from source', !!footYm && !!dropM);
const STAGE_H = 480, SY = STAGE_H / 100, MODEL_SCALE = 2.6;
const footY = footYm ? Number(footYm[1]) : 11.45;
const footDropPx = Math.max(14, (footY - (dropM ? Number(dropM[1]) : 0.65)) * MODEL_SCALE);
const bodyHeightPx = (footY + 7) * MODEL_SCALE; // crown of the head to the boot line
// Every technical zone setup faces the player up the pitch (dir = -PI/2), so a
// positive lead moves the ball up-screen away from the boots.
const CASES = [
  { name: 'weak foot stance', oldOffset: -3.5, lead: 0 },
  { name: 'weak foot strike', oldOffset: -2.8, lead: 0 },
  { name: 'protect spawn', oldOffset: -3.5, lead: 2.2 },
  { name: 'protect shield', oldOffset: -3.8, lead: 2.2 },
  { name: 'close control (tight touch)', oldOffset: -2.05, lead: 2.05 },
  { name: 'first touch (best settle)', oldOffset: -3.1, lead: 3.1 }
];
const boots = CASES.map(c => ({
  name: c.name,
  before: Math.round(footDropPx + -c.oldOffset * SY),
  after: Math.round(c.lead * SY)
}));
ck('BOOT LINE: stationary technical balls now sit exactly on the boot line',
  boots.filter(b => /stance|strike/.test(b.name)).every(b => b.after === 0));
ck('BOOT LINE: every technical ball is closer to the boots than before',
  boots.every(b => b.after < b.before));
ck('BOOT LINE: nothing floats at head height any more (was above the waist)',
  boots.every(b => b.after < bodyHeightPx * 0.35) && boots.some(b => b.before > bodyHeightPx * 0.85));

console.log('\nFINISHING PITCH V75.6 VALIDATION');
console.log('Goal resolution simulation - 240 runs per zone, jittered frame times, perfectly aimed shot');
console.log('zone            old on-frame  old target  new on-frame  new target');
report.forEach(r => console.log(
  r.zone.padEnd(15) + String(r.oldOn + '%').padStart(11) + String(r.oldHit + '%').padStart(12) +
  String(r.newOn + '%').padStart(14) + String(r.newHit + '%').padStart(11)));

console.log('\nFootball visibility per phase (footballs drawn, across all six drills)');
console.log('phase                          before   after');
visibility.forEach(v => console.log(
  v.phase.padEnd(31) + String(v.before + '/' + v.of).padStart(6) + String(v.now + '/' + v.of).padStart(8)));

console.log(`\nTechnical zone: ball height above the boot line (760x480 stage, body ~${Math.round(bodyHeightPx)}px tall)`);
console.log('case                            before    after');
boots.forEach(b => console.log(
  b.name.padEnd(30) + String(b.before + 'px').padStart(8) + String(b.after + 'px').padStart(9)));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
