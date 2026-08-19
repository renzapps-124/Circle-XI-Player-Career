// Regression checks for the v75.10 training-ground run-to-zone pass.
// Run: node TRAINING_GROUND_RUN_V75_10_VALIDATION.js
const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function bodyFrom(startIndex) {
  // Skip the parameter list first: default values like ({vx:0}) contain braces,
  // and naively taking the first '{' would return the default object instead.
  let p = game.indexOf('(', startIndex), depth = 0, afterParams = startIndex;
  for (let i = p; i >= 0 && i < game.length; i++) {
    if (game[i] === '(') depth++;
    else if (game[i] === ')' && --depth === 0) { afterParams = i; break }
  }
  const b = game.indexOf('{', afterParams);
  let d = 0, q = null, esc = false;
  for (let i = b; i < game.length; i++) {
    const c = game[i];
    if (q) { if (esc) { esc = false; continue } if (c.charCodeAt(0) === 92) { esc = true; continue } if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; continue }
    if (c === '{') d++; else if (c === '}' && --d === 0) return game.slice(startIndex, i + 1);
  }
  throw Error('unclosed body');
}
function fn(name) {
  const st = game.indexOf(`function ${name}(`);
  if (st < 0) throw Error('missing function ' + name);
  return bodyFrom(st);
}
const C = [];
const ck = (n, v) => C.push([n, !!v]);
const bind = fn('bindTrainingGround');

// --- 1. clicking a zone starts a run, it does not teleport or open instantly
ck('clicking a facility runs to it', /fac\.forEach\(f=>f\.onclick=e=>\{e\.preventDefault\(\);ground\.focus\(\);runToZone\(f\)\}\)/.test(bind));
ck('the old instant-open click is gone', !/f\.onclick=e=>\{e\.preventDefault\(\);openZone\(f\)\}/.test(bind));
ck('the coach shortcut runs instead of teleporting', /runToZone\(target\)/.test(bind) && !/trainingGroundPosition=\{x:clamp\(Number\(target\.dataset\.x\),4,96\)/.test(bind));
ck('travel state exists', /let trainingGroundTravel=null;/.test(game));
ck('the player stands in front of the zone, not on top of it', /Number\(f\.dataset\.y\)\+9/.test(bind));
ck('clicking the zone you are already at opens it immediately', /if\(travelDistance\(target\)<3\.2\)\{cancelTravel\(\);openZone\(f\);return\}/.test(bind));

// --- 2. the run uses the real movement and animation pipeline
ck('auto-run feeds the same heading the WASD path uses', /dx=\(trainingGroundTravel\.x-trainingGroundPosition\.x\)\/axis/.test(bind));
ck('auto-run corrects for the per-axis percentage scale', /const groundAxisScale=\(\)=>clamp\(\(ground\.clientHeight\|\|1\)\/\(ground\.clientWidth\|\|1\),\.28,1\)/.test(bind));
ck('auto-run drives the same speed profile', /sprinting\?profile\.sprint:profile\.jog/.test(bind));
ck('long trips break into a sprint', /sprint:travelDistance\(target\)>30/.test(bind));
ck('the run animation is the shared footballer renderer', /drawTrainingGroundCareerPlayer\(canvas,motion\)/.test(bind) && /drawVisibleFootballer\(ctx,model,2\.15,false\)/.test(fn('drawTrainingGroundCareerPlayer')));
ck('the stride cadence advances while running', /trainingGroundAnim\+=dt\*\(sprinting\?lerp\(9,13,/.test(bind));
ck('arriving opens the zone', /const arrived=trainingGroundTravel\.facility;cancelTravel\(\);currentSpeed=0;.*openZone\(arrived\)/.test(bind));
ck('a stuck run gives up rather than looping forever', /performance\.now\(\)-trainingGroundTravel\.startedAt>9000/.test(bind));

// --- 3. the player keeps control
ck('manual movement cancels the run', /if\(len\)cancelTravel\(\);/.test(bind));
ck('escape cancels the run', /if\(k==='escape'&&trainingGroundTravel\)\{cancelTravel\(\);return\}/.test(bind));
ck('leaving the training ground clears the run', /function stopTrainingGroundLoop\(\)\{trainingGroundTravel=null;/.test(game));
ck('the prompt names where you are running', /Running to \$\{trainingGroundTravel\.facility/.test(bind));

// --- 4. destination is visible
ck('destination marker styled', /\.ground-facility\.travel-target\{/.test(css));
ck('destination marker pulses', /@keyframes groundTravelPulse/.test(css));
ck('destination class is applied and cleared', /classList\.toggle\('travel-target',x===f\)/.test(bind) && /classList\.remove\('travel-target'\)/.test(bind));

// --- 5. the run actually converges (replay of the steering maths)
let trace = [];
{
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const profile = { jog: 17, sprint: 27, accel: 8, decel: 9, turn: .8 };
  const angleLerp = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
  const run = (from, target, axis) => {
    let pos = { ...from }, facing = -Math.PI / 2, speed = 0, dt = 1 / 60, frames = 0, sprint = Math.hypot(target.x - pos.x, target.y - pos.y) > 30;
    let moving = 0;
    while (frames < 900) {
      const gap = Math.hypot(target.x - pos.x, target.y - pos.y);
      if (gap < 1.8) break;
      const dx = (target.x - pos.x) / axis, dy = target.y - pos.y, len = Math.hypot(dx, dy) || 1;
      const targetSpeed = sprint ? profile.sprint : profile.jog;
      speed = lerp(speed, targetSpeed, 1 - Math.exp(-profile.accel * dt));
      const desired = Math.atan2(dy / len, dx / len);
      facing = angleLerp(facing, desired, 1 - Math.exp(-lerp(7, 13, profile.turn) * dt));
      pos.x = clamp(pos.x + Math.cos(facing) * speed * dt * axis, 3.8, 96.2);
      pos.y = clamp(pos.y + Math.sin(facing) * speed * dt, 7, 94);
      if (speed > 1) moving++;
      frames++;
    }
    return { frames, seconds: +(frames / 60).toFixed(2), gap: +Math.hypot(target.x - pos.x, target.y - pos.y).toFixed(2), movingFrames: moving };
  };
  const cases = [
    ['Near zone (short jog)', { x: 50, y: 84 }, { x: 58, y: 70 }],
    ['Across the complex', { x: 50, y: 84 }, { x: 18, y: 22 }],
    ['Opposite corner', { x: 12, y: 90 }, { x: 88, y: 16 }]
  ];
  trace = cases.map(([label, from, to]) => { const r = run(from, to, .55); return [label, r.seconds + 's', r.gap, r.movingFrames] });
  ck('REPLAY: every run reaches its zone', trace.every(t => Number(t[2]) < 1.8));
  ck('REPLAY: runs take a believable amount of time (0.4s - 8s)', trace.every(t => parseFloat(t[1]) > .4 && parseFloat(t[1]) < 8));
  ck('REPLAY: the model is actually moving for the whole trip', trace.every(t => t[3] > 20));
}

// --- 6. cache tokens
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.10.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 10)));
}

console.log('\nTRAINING GROUND RUN V75.10 VALIDATION');
console.log('\nRun-to-zone convergence (steering replay at 60fps)');
console.log('trip                        time    final gap   moving frames');
trace.forEach(t => console.log(t[0].padEnd(28) + String(t[1]).padStart(5) + String(t[2]).padStart(12) + String(t[3]).padStart(15)));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
