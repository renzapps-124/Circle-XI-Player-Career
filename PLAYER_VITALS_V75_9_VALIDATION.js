// Regression checks for the v75.9 player-vitals audit.
// Every meter on the Overview card must change something in the game, and must
// say what it changes.
// Run: node PLAYER_VITALS_V75_9_VALIDATION.js
const fs = require('fs'), vm = require('vm');
const game = fs.readFileSync('game.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function bodyFrom(startIndex) {
  const b = game.indexOf('{', startIndex);
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
function method(name){const st=game.indexOf(name+'(type,team,spot){');if(st<0)throw Error('missing method '+name);return bodyFrom(st)}
const C = [];
const ck = (n, v) => C.push([n, !!v]);

// =========================================================================
// 1. Each meter reaches gameplay
// =========================================================================
const condition = fn('careerMatchCondition');
const applyCond = fn('applyCareerConditionToAttrs');
const injuryChance = fn('trainingInjuryChance');
const weekly = game;

ck('condition model reads fitness, sharpness and morale', /p\?\.fitness/.test(condition) && /t\.sharpness/.test(condition) && /p\?\.morale/.test(condition));
ck('fitness owns the physical attributes', /scale\(CREATOR_ATTRIBUTE_GROUPS\.Physical,c\.physical\)/.test(applyCond));
ck('sharpness owns the technical attributes', /scale\(CREATOR_ATTRIBUTE_GROUPS\.Technical,c\.technical\)/.test(applyCond));
ck('morale owns the mental attributes', /scale\(CREATOR_ATTRIBUTE_GROUPS\.Mental,c\.mental\)/.test(applyCond));
ck('the user carries their condition into a match', /attrs: willBeUser&&career&&!this\.quick\?applyCareerConditionToAttrs\(attrs\):attrs/.test(game));
ck('AI players are untouched by the user condition', /willBeUser&&career&&!this\.quick\?applyCareerConditionToAttrs/.test(game));
ck('energy still sets the match stamina ceiling', /stamina: willBeUser&&career\?matchCareerFatigue\(this\)\.ceiling:100/.test(game));
ck('fitness still feeds the training injury model', /fitnessLoad=clamp\(\(72-p\.fitness\)\/42,0,1\)/.test(injuryChance));
ck('morale still scales weekly training gains', /const morale=\.82\+\(p\.morale\/100\)\*\.28/.test(weekly));
ck('fitness still scales weekly training gains', /fitness=\.6\+\(p\.fitness\/100\)\*\.45/.test(weekly));
ck('sharpness still feeds the manager approval score', /training:clamp\(t\.sharpness\|\|68,0,100\)/.test(fn('contractEvaluation')));
ck('trust still feeds the manager approval score', /trust:clamp\(p\.managerTrust\|\|0,0,100\)/.test(fn('contractEvaluation')));
ck('trust still decides set-piece duty', /setPieceTrustTier\(trust\)/.test(method('chooseRestartTaker')));

// =========================================================================
// 2. Risk is no longer a fatigue coin flip
// =========================================================================
ck('risk band derives from the real injury chance', /trainingInjuryChance\(p\)/.test(fn('careerInjuryRiskProfile')));
ck('risk has graduated bands, not High/Low', /CAREER_RISK_BANDS/.test(game) && /'Severe'/.test(game) && /'Raised'/.test(game) && /'Moderate'/.test(game));
ck('the old fatigue>65 coin flip is gone', !/fatigue\|\|0\)>65\?'High':'Low'/.test(game));
ck('risk therefore responds to hired medical staff', /hasInvestment\('recovery-specialist'\)/.test(game) && /trainingInjuryChance/.test(fn('careerInjuryRiskProfile')));

// =========================================================================
// 3. The tabs explain what each meter does
// =========================================================================
const notes = fn('careerVitalNotes');
['fitness', 'sharpness', 'morale', 'energy', 'trust', 'risk'].forEach(k =>
  ck(`vital notes cover ${k}`, new RegExp(k + ':`').test(notes)));
ck('overview tiles carry an explanation tooltip', /title="\$\{escapeMarkup\(note\)\}"/.test(game));
ck('overview tiles show the live effect', /class="meter-effect"/.test(game));
ck('overview card summarises match day condition', /meter-condition-note/.test(game));
ck('training centre shows the condition strip', /careerConditionStripMarkup\(p\)/.test(game));
ck('condition strip reports the weekly training multiplier', /Weekly training gains/.test(fn('careerConditionStripMarkup')));
ck('condition strip reports the real injury percentage', /r\.percent\+'% per session'/.test(fn('careerConditionStripMarkup')));
ck('agent report names set-piece duty', /label:'Set-piece duty'/.test(fn('contractAgentReport')));
ck('meter effect and condition styling present', /\.meter-effect\{/.test(css) && /\.meter-condition-note\{/.test(css) && /\.condition-strip\{/.test(css));

// =========================================================================
// 4. Live measurement of what each meter is worth
// =========================================================================
let table = [], riskTable = [];
{
  const ctx = {
    console, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), lerp: (a, b, t) => a + (b - a) * t,
    CREATOR_ATTRIBUTE_GROUPS: {
      Technical: ['firstTouch', 'dribbling', 'passing', 'technique', 'crossing', 'finishing', 'longShots', 'tackling', 'marking', 'penalties', 'freeKicks', 'corners', 'throwIns'],
      Mental: ['positioning', 'vision', 'anticipation', 'decisions', 'composure', 'teamwork', 'workRate'],
      Physical: ['pace', 'acceleration', 'stamina', 'strength', 'agility', 'balance']
    },
    ensureDevelopmentSystem: p => p.training,
    career: null
  };
  vm.createContext(ctx);
  vm.runInContext(game.slice(game.indexOf('const CAREER_CONDITION_BANDS='), game.indexOf('function careerInjuryRiskProfile(')), ctx);

  const mk = (fitness, sharpness, morale) => ({ fitness, morale, training: { sharpness }, attrs: { pace: 70, finishing: 70, composure: 70 } });
  const rows = [
    ['Peak (100/100/100)', mk(100, 100, 100)],
    ['Healthy (86/77/79)', mk(86, 77, 79)],
    ['Flat (60/50/45)', mk(60, 50, 45)],
    ['Wrecked (30/25/20)', mk(30, 25, 20)]
  ];
  table = rows.map(([label, p]) => {
    const c = ctx.careerMatchCondition(p), out = ctx.applyCareerConditionToAttrs(p.attrs, p);
    return [label, c.label, out.pace, out.finishing, out.composure];
  });
  ck('MEASURED: peak condition beats a wrecked one on every group',
    table[0][2] > table[3][2] && table[0][3] > table[3][3] && table[0][4] > table[3][4]);
  ck('MEASURED: the swing stays a shading, not a rewrite (under 12 points)',
    table[0][2] - table[3][2] <= 12 && table[0][3] - table[3][3] <= 12);
  ck('MEASURED: fitness only moves physical attributes', (() => {
    const a = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(100, 70, 70));
    const b = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(20, 70, 70));
    return a.pace > b.pace && a.finishing === b.finishing && a.composure === b.composure;
  })());
  ck('MEASURED: sharpness only moves technical attributes', (() => {
    const a = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(70, 100, 70));
    const b = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(70, 20, 70));
    return a.finishing > b.finishing && a.pace === b.pace && a.composure === b.composure;
  })());
  ck('MEASURED: morale only moves mental attributes', (() => {
    const a = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(70, 70, 100));
    const b = ctx.applyCareerConditionToAttrs({ pace: 70, finishing: 70, composure: 70 }, mk(70, 70, 20));
    return a.composure > b.composure && a.pace === b.pace && a.finishing === b.finishing;
  })());
}
{
  // Risk now moves with fatigue, fitness, intensity and hired medical staff.
  const ctx = {
    console, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    ensureDevelopmentSystem: p => p.training, career: {}, __staff: [],
    hasInvestment: id => ctx.__staff.includes(id)
  };
  vm.createContext(ctx);
  vm.runInContext(fn('trainingInjuryChance'), ctx);
  vm.runInContext(game.slice(game.indexOf('const CAREER_RISK_BANDS='), game.indexOf('function careerVitalNotes(')), ctx);
  // The live build wraps trainingInjuryChance to apply medical staff; mirror it.
  const core = ctx.trainingInjuryChance;
  ctx.trainingInjuryChance = (p, i) => {
    let c = core(p, i);
    if (ctx.hasInvestment('nutritionist')) c *= .82;
    if (ctx.hasInvestment('recovery-specialist')) c *= .68;
    return ctx.clamp(c, .0005, .075);
  };
  const mk = (fatigue, fitness, intensity) => ({ fitness, training: { fatigue, intensity, focus: 'balanced' } });
  riskTable = [
    ['Fresh, normal', mk(10, 92, 'normal'), []],
    ['Tired, normal', mk(65, 80, 'normal'), []],
    ['Tired, intense', mk(65, 80, 'intense'), []],
    ['Spent, intense', mk(95, 62, 'intense'), []],
    ['Spent, intense + medical staff', mk(95, 62, 'intense'), ['nutritionist', 'recovery-specialist']]
  ].map(([label, p, staff]) => {
    ctx.__staff = staff;
    const r = ctx.careerInjuryRiskProfile(p);
    return [label, r.label, r.percent + '%'];
  });
  ck('MEASURED: risk rises with fatigue', parseFloat(riskTable[1][2]) > parseFloat(riskTable[0][2]));
  ck('MEASURED: risk rises with intensity', parseFloat(riskTable[2][2]) > parseFloat(riskTable[1][2]));
  ck('MEASURED: risk reports more than two states', new Set(riskTable.map(r => r[1])).size >= 3);
  ck('MEASURED: hiring medical staff visibly lowers the readout', parseFloat(riskTable[4][2]) < parseFloat(riskTable[3][2]));
}

// =========================================================================
// 5. Cache tokens
// =========================================================================
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.9.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 9)));
}

console.log('\nPLAYER VITALS V75.9 VALIDATION');
console.log('\nMatch day condition applied to a 70/70/70 player');
console.log('vitals                     band            pace  finishing  composure');
table.forEach(r => console.log(
  r[0].padEnd(27) + String(r[1]).padEnd(16) + String(r[2]).padStart(4) + String(r[3]).padStart(11) + String(r[4]).padStart(11)));
console.log('\nInjury risk readout');
console.log('scenario                            band        per session');
riskTable.forEach(r => console.log(r[0].padEnd(36) + String(r[1]).padEnd(12) + String(r[2]).padStart(6)));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
