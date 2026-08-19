// Regression checks for v75.3: training fatigue drives match stamina and injury risk.
// Run: node FATIGUE_MATCH_LOAD_V75_3_VALIDATION.js
const fs = require('fs');
const vm = require('vm');
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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.3.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 3)));
}

// ---------------------------------------------------------------- the model
const ctx = { clamp, Math, console, career: null };
ctx.ensureDevelopmentSystem = p => p.__t;
vm.createContext(ctx);
vm.runInContext('const FATIGUE_MATCH_FLOOR=20;', ctx);
vm.runInContext(fn('careerFatigueLoad'), ctx);
vm.runInContext(fn('careerFatigueMatchProfile'), ctx);
const prof = f => ctx.careerFatigueMatchProfile({ __t: { fatigue: f } });

ck('no penalty at or below the fatigue floor',
  prof(0).load === 0 && prof(20).load === 0 && prof(20).ceiling === 100 &&
  prof(20).drain === 1 && prof(20).recovery === 1 && prof(20).injury === 1);
ck('load ramps to 1 at full fatigue', Math.abs(prof(100).load - 1) < 1e-9);
ck('load is monotonic in fatigue', [30, 40, 50, 60, 70, 80, 90, 100].every((f, i, a) => i === 0 || prof(f).load > prof(a[i - 1]).load));
ck('stamina ceiling falls from 100 to 66', prof(0).ceiling === 100 && Math.abs(prof(100).ceiling - 66) < 1e-9);
ck('drain rises to +55%', Math.abs(prof(100).drain - 1.55) < 1e-9);
ck('recovery slows to 62%', Math.abs(prof(100).recovery - .62) < 1e-9);
ck('injury multiplier rises to +85%', Math.abs(prof(100).injury - 1.85) < 1e-9);
ck('mid-range values are sane (fatigue 60)',
  Math.round(prof(60).ceiling) === 83 && Math.abs(prof(60).drain - 1.275) < 1e-3 && Math.abs(prof(60).injury - 1.425) < 1e-3);
ck('missing career yields a neutral profile', (() => {
  const p = ctx.careerFatigueMatchProfile(null);
  return p.load === 0 && p.ceiling === 100 && p.drain === 1 && p.recovery === 1 && p.injury === 1;
})());

// ------------------------------------------------------------ match wiring
ck('match caches the profile per game instance',
  fn('matchCareerFatigue').includes('if(game.__careerFatigue)return game.__careerFatigue;') &&
  fn('matchCareerFatigue').includes('return game.__careerFatigue=careerFatigueMatchProfile('));
ck('no game instance yields a neutral profile', fn('matchCareerFatigue').includes('if(!game)return careerFatigueMatchProfile()'));
ck('Quick Match never inherits career training fatigue', fn('matchCareerFatigue').includes('careerFatigueMatchProfile(game.quick?null:career?.player)'));
ck('the user starts a match at the fatigue ceiling',
  game.includes('attrs, stamina: willBeUser&&career?matchCareerFatigue(this).ceiling:100,'));
ck('only the career player is affected at kickoff', !game.includes('attrs, stamina: 100, hasBall'));
ck('user stamina drain scales with fatigue',
  /const drain=\([^;]*\)\*\(injuryMotion\.active\?1\+injuryMotion\.severity\*\.32:1\)\*matchCareerFatigue\(this\)\.drain;/.test(game));
ck('recovery is slowed and capped by the ceiling',
  game.includes('this.user.stamina = Math.min(cf.ceiling, this.user.stamina + dt * (1.05 + this.user.attrs.stamina * .009) * cf.recovery);'));
ck('nothing still recovers the user to a hardcoded 100',
  !game.includes('this.user.stamina = Math.min(100, this.user.stamina + dt *'));
ck('the v41 physical layer respects the ceiling',
  game.includes('const ceiling=matchCareerFatigue(this).ceiling,used=Math.max(0,pre.stamina-u.stamina)') &&
  game.includes('u.stamina=clamp(pre.stamina+gained*f.sprintRecovery,0,ceiling)'));
ck('in-match injury risk scales for the user only',
  game.includes("risk=clamp((base+contact+fatigue+landing)*(p.isUser?matchCareerFatigue(this).injury:1),.002,.2)"));

// ------------------------------------------------------- training injuries
const ctx2 = { clamp, Math, console, career: { injuryDoubt: null } };
ctx2.ensureDevelopmentSystem = p => p.__t;
vm.createContext(ctx2);
vm.runInContext(fn('trainingInjuryChance'), ctx2);
const chance = (f, intensity, fitness = 90) =>
  ctx2.trainingInjuryChance({ fitness, __t: { fatigue: f, intensity, focus: 'technical' } }, intensity);

ck('training fatigue now starts biting at 30, not 48', fn('trainingInjuryChance').includes('clamp((t.fatigue-30)/70,0,1)'));
ck('training injury risk has a squared high-fatigue term',
  /Math\.pow\(fatigueLoad,2\)\*\(intensity==='intense'\?\.022:\.012\)/.test(fn('trainingInjuryChance')));
ck('low fatigue leaves the old baseline untouched',
  Math.abs(chance(0, 'normal') - .0045) < 1e-9 && Math.abs(chance(0, 'intense') - .021) < 1e-9);
ck('training injury risk is monotonic in fatigue',
  [0, 20, 40, 60, 80, 100].every((f, i, a) => i === 0 || chance(f, 'normal') >= chance(a[i - 1], 'normal')));
ck('high fatigue more than doubles normal-intensity risk', chance(100, 'normal') > chance(0, 'normal') * 2);
ck('fatigue matters at every intensity now',
  chance(100, 'light') > chance(0, 'light') * 2 && chance(100, 'intense') > chance(0, 'intense') * 3);
ck('risk stays inside the original safety clamp',
  [0, 50, 100].every(f => ['light', 'normal', 'intense'].every(i => chance(f, i) >= .001 && chance(f, i) <= .09)));
ck('very high fatigue can cause a severe training injury on its own',
  fn('sustainTrainingInjury').includes("severe=(t.intensity==='intense'&&t.fatigue>68)||t.fatigue>82"));

// ------------------------------------------------------------------- the UI
ck('match HUD exposes the locked-out stamina tail', html.includes('id="staminaCeiling"'));
ck('HUD element is tracked and updated', game.includes("staminaCeiling:$('#staminaCeiling')") && game.includes('ui.staminaCeiling.style.width=lost'));
ck('locked stamina tail is styled', css.includes('.stamina-stat .meter i.stamina-ceiling'));
ck('training ground explains the fatigue cost', /function trainingFatigueEffectText\(/.test(game));
ck('effect text names all three consequences',
  fn('trainingFatigueEffectText').includes('Match stamina capped at') &&
  fn('trainingFatigueEffectText').includes('burns') &&
  fn('trainingFatigueEffectText').includes('injury risk +'));
ck('effect text is hidden when fatigue is harmless', fn('trainingFatigueEffectText').includes("if(f.load<=0)return ''"));
ck('fatigue meter carries the explanation as a tooltip',
  game.includes("trainingGroundMeter('FATIGUE',fatigue,fatigueTone,fatigueEffect||'No match penalty at this fatigue level')"));
ck('effect line is styled by tone', css.includes('.tg-fatigue-effect[data-tone="bad"]'));

// ---------------------------------------- stale deferred callbacks (found while testing)
ck("no deferred training callback fires without a session identity check",
  !game.includes("setTimeout(()=>{if(trainingGameState)"));
ck("recordTrainingAction defers against its own session",
  fn("recordTrainingAction").includes("if(trainingGameState===s)spawnControlledTarget()") &&
  fn("recordTrainingAction").includes("if(trainingGameState===s)finishControlledTraining()") &&
  fn("recordTrainingAction").includes("if(trainingGameState===s)spawnFinishingPitchScenario()"));
ck("controlled-target spawner ignores sessions that run their own scenarios",
  fn("spawnControlledTarget").includes("if(!Number.isFinite(Number(s.targetIndex)))return;"));
ck("preset lookup can never index with NaN",
  fn("spawnControlledTarget").includes("safeIdx=Number.isFinite(idx)?Math.abs(Math.trunc(idx)):0,pos=arr[safeIdx%arr.length]||arr[0]"));

let pass = 0;
for (const [n, v] of C) { console.log(v ? 'PASS' : 'FAIL', n); if (v) pass++ }
console.log(`\nFatigue match load v75.3: ${pass}/${C.length} checks passed`);
if (pass !== C.length) process.exit(1);
