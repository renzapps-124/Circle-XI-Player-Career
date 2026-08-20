// Regression checks for the v75.7 pass:
//   1. shield / muscled-off-the-ball animations in Protect the Ball
//   2. the career support staff hire screen and its gameplay hooks
// Run: node PROTECT_CONTACT_STAFF_V75_7_VALIDATION.js
const fs = require('fs'), vm = require('vm');
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
// Several of these functions are declared once and then re-assigned later to
// layer career effects on top, so collect every definition of a name.
function bodyFrom(startIndex) {
  const b = game.indexOf('{', startIndex);
  let d = 0, q = null, esc = false;
  for (let i = b; i < game.length; i++) {
    const c = game[i];
    if (q) { if (esc) { esc = false; continue } if (c.charCodeAt(0) === 92) { esc = true; continue } if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; continue }
    if (c === '{') d++; else if (c === '}' && --d === 0) return game.slice(startIndex, i + 1);
  }
  return '';
}
function fnAll(name) {
  const out = [];
  for (const pattern of [`function ${name}(`, `${name}=function(`]) {
    let i = 0;
    while ((i = game.indexOf(pattern, i)) >= 0) { out.push(bodyFrom(i)); i += pattern.length }
  }
  return out.join('\n');
}
const C = [];
const ck = (n, v) => C.push([n, !!v]);

// =========================================================================
// PART 1 - shield and barge animation
// =========================================================================
const renderer = fn('drawTopDownFootballer');
const visualAction = fn('setTrainingVisualAction');
const protectUpd = fn('technicalProtectUpdate');

ck('renderer derives the contact side from actionVariant', /const contactSide = p\.actionVariant === 'left' \? -1 : 1;/.test(renderer));
ck('shield engages on the action blend so it can be held', /const shieldEngage = isShield \? entryBlend : 0;/.test(renderer));
ck('shield has a live brace tremor', /const shieldBrace = isShield \?/.test(renderer));
ck('barge is a one-shot shove with a recovery tail', /const bargeShove = isStumble \?/.test(renderer) && /const bargeRecover = isStumble \?/.test(renderer));
ck('barge no longer uses the symmetric head bob', !/if \(isStumble\) \{ headX \+= Math\.sin\(actionProgress \* Math\.PI\) \* 1\.8/.test(renderer));
ck('head turns towards the contact', /if \(isStumble\) \{ headX \+= contactSide \* bargeShove/.test(renderer) && /if \(isShield\) \{ headX \+= contactSide \* shieldEngage/.test(renderer));
ck('torso braces into the defender / is knocked off balance', /reactionLean = isStumble \? contactSide\*\(2\.05\+bargeShove\*3\.5\)/.test(renderer) && /isShield \? contactSide\*\(1\.95\+shieldBrace\)/.test(renderer));
ck('near arm comes across to hold the defender off', /const near = side === contactSide \? 1 : -1;/.test(renderer));
ck('barge throws both arms out to catch balance', /const lead = side === contactSide \? 1 : -1;/.test(renderer));
// The legs were the missing half of both poses before this pass.
const legPose = renderer.slice(renderer.indexOf('const legPose = side =>'), renderer.indexOf('const drawLeg = side =>'));
ck('shield now has a wide braced leg base', /if \(isShield\) \{[\s\S]*?kneeY -= 1\.8\*shieldEngage;/.test(legPose));
ck('barge now drags the trailing leg', /if \(isStumble\) \{[\s\S]*?const trailing = side === contactSide \? -1 : 1;/.test(legPose));

ck('visual action bridge accepts a variant and a length', /function setTrainingVisualAction\(action,variantOverride=null,lengthOverride=0\)/.test(game));
ck('shield / stumble / shoulder are mapped', /shield:'shield',stumble:'stumble',shoulder:'shoulder'/.test(visualAction));
ck('shield / stumble / shoulder have durations', /shield:\.60,stumble:\.92,shoulder:\.46/.test(visualAction));
ck('variant override is honoured', /variant:variantOverride\|\|\(/.test(visualAction));

ck('protect drill holds the shield stance while shielding', /if\(shield\)setTrainingVisualAction\('shield',contactVariant,\.6\)/.test(protectUpd));
ck('protect drill plays the barge when the ball is lost', /setTrainingVisualAction\('stumble',contactVariant,\.92\)/.test(protectUpd));
ck('the marker leans in while the duel is live', /def\.action='jockey';def\.actionTimer=\.24/.test(protectUpd));
ck('the marker shoulder-barges on the win', /def\.action='shoulder';def\.actionTimer=\.46/.test(protectUpd));
ck('losing the ball physically shoves the user', /s\.player\.x=clamp\(s\.player\.x\+awayX\*2\.4,4,96\)/.test(protectUpd));
ck('the ball runs loose towards the defender', /s\.ball\.free=true;.*s\.ball\.vx=-awayX\*17/.test(protectUpd));
ck('the loose ball is not snapped back to the feet during reset', /if\(t\.phase==='reset'\)technicalBallPhysics\(s,dt\)/.test(protectUpd));
ck('reset gives the barge time to play out', /t\.resetAt=performance\.now\(\)\+1050/.test(protectUpd));
ck('shield glow styled', /\[data-technical-shield="on"\]/.test(css));
ck('barge shake styled', /@keyframes technicalBargeShake/.test(css));

// --- live replay of the duel ---------------------------------------------
{
  let now = 1000, actions = [], defActions = [], scored = 0;
  const x = {
    performance: { now: () => now }, console,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)), lerp: (a, b, t) => a + (b - a) * t,
    technicalDifficultyProfile: () => ({ pressure: 1, space: 1, assist: 1 }),
    technicalAttributes: () => ({ strength: 55, balance: 55, firstTouch: 55 }),
    technicalScore: () => { scored++ },
    technicalSetFeedback: () => {}, technicalSetObjective: () => {},
    technicalSetupProtect: s => { s.technical.phase = 'shield'; s.technical.pressure = 0; s.technical.hold = 0; s.technical.stationary = 0 },
    technicalSetStageState: () => {}, technicalContactShake: () => {},
    defensiveBallContactAnchor: (p, side = 0) => ({ x: (p?.x || 50) + (side || 0) * .8, y: (p?.y || 50) + 2.9 }),
    technicalBallPhysics: (st, d) => { const b = st.ball; if (!b?.free) return; b.x += (b.vx || 0) * d; b.y += (b.vy || 0) * d },
    setTrainingVisualAction: (a, variant) => { actions.push({ a, variant, at: now }) }
  };
  vm.createContext(x);
  vm.runInContext(fn('technicalBallAnchor'), x);
  vm.runInContext(protectUpd, x);

  // Defender parked on a motionless user who is holding the shield button.
  const s = {
    player: { x: 50, y: 59, dir: -Math.PI / 2, vx: 0, vy: 0 }, ball: { x: 50, y: 55, z: 0, free: false },
    keys: new Set([' ']),
    technical: { phase: 'shield', pressure: 0, hold: 0, stationary: 0, variant: 0, metrics: { duelsWon: 0, successfulTurns: 0 }, defender: { x: 50, y: 62, vx: 0, vy: 0, dir: 0 } }
  };
  const ballBefore = { x: s.ball.x, y: s.ball.y };
  for (let i = 0; i < 40; i++) { now += 16; x.technicalProtectUpdate(s, 1 / 60) }
  const shieldFrames = actions.filter(a => a.a === 'shield').length;
  ck('REPLAY: the shield stance is held every frame of a live duel', shieldFrames >= 30);
  ck('REPLAY: the shielded ball is tucked to one side of the boots', Math.abs(s.ball.x - s.player.x) > .5 && Math.abs(s.ball.y - (s.player.y + 2.9 - 2.2)) < .01);
  defActions.push(s.technical.defender.action);
  ck('REPLAY: the marker is jockeying during the duel', s.technical.defender.action === 'jockey');

  // Now let the pressure build until the duel is lost.
  s.keys.delete(' ');
  const playerBefore = { x: s.player.x, y: s.player.y };
  for (let i = 0; i < 400 && !actions.some(a => a.a === 'stumble'); i++) { now += 16; x.technicalProtectUpdate(s, 1 / 60) }
  const barge = actions.find(a => a.a === 'stumble');
  ck('REPLAY: losing the ball plays the barge animation', !!barge);
  ck('REPLAY: the barge carries a contact side', barge && ['left', 'right'].includes(barge.variant));
  ck('REPLAY: the user is physically shoved off the ball', Math.hypot(s.player.x - playerBefore.x, s.player.y - playerBefore.y) > 1.5);
  ck('REPLAY: the ball comes loose', s.ball.free === true);
  const towardsDefender = (s.technical.defender.y - s.player.y) * (s.ball.vy || 0) + (s.technical.defender.x - s.player.x) * (s.ball.vx || 0);
  ck('REPLAY: the loose ball travels towards the defender', towardsDefender > 0);
  ck('REPLAY: the marker shoulder-barges', s.technical.defender.action === 'shoulder');
  ck('REPLAY: the loose ball keeps rolling instead of snapping to the feet', (() => {
    const at = { x: s.ball.x, y: s.ball.y };
    for (let i = 0; i < 6; i++) { now += 16; x.technicalProtectUpdate(s, 1 / 60) }
    return Math.hypot(s.ball.x - at.x, s.ball.y - at.y) > .2;
  })());
}

// =========================================================================
// PART 2 - career support staff
// =========================================================================
const financeMarkup = fn('financeInvestmentMarkup');
const bindFinance = fn('bindFinanceUpgrades');
const offer = fn('suggestedContractOffer');
const counter = fn('submitContractCounter');

// The defect in the screenshot: the staff name inherited the dark-theme body
// colour on a near-white card, so every name was invisible.
ck('finance centre sets its own ink for its light cards', /\.career-finance-centre\{color:#0f172a\}/.test(css));
ck('staff names are explicitly coloured', /\.investment-grid article b\{color:#0f172a/.test(css));
ck('ledger labels are explicitly coloured', /\.finance-ledger span b\{color:#1e293b/.test(css));
ck('body colour really is the light one that caused it', /body\{[^}]*color:#cbd5e1/.test(css));

ck('the filter row opens on All, matching what is shown', /class="active" data-investment-filter="All"/.test(financeMarkup) && !/class="\$\{i===0\?'active':''\}"/.test(financeMarkup));
ck('hired staff can be released', /data-release-investment/.test(financeMarkup) && /data-release-investment/.test(bindFinance));
ck('releasing removes the weekly cost', /f\.staff=f\.staff\.filter\(id=>id!==item\.id\)/.test(bindFinance));

// Every hire must actually do something. Before this pass the Elite Agent was a
// GBP 9,000 purchase with a GBP 650 weekly cost and no effect anywhere.
const HOOKS = {
  'technical-coach': ['addAttributeDevelopment'],
  'finishing-coach': ['addAttributeDevelopment'],
  'psychologist': ['addAttributeDevelopment', 'careerStaffMoraleSwing'],
  'nutritionist': ['trainingInjuryChance', 'careerStaffRecovery'],
  'recovery-specialist': ['trainingInjuryChance', 'careerStaffRecovery'],
  'tactical-analyst': ['renderFixturePanel'],
  'elite-agent': ['careerStaffAgentEdge'],
  'home-gym': ['addAttributeDevelopment']
};
const ids = [...game.matchAll(/\{id:'([a-z-]+)',icon:/g)].map(m => m[1]);
ck('all eight staff ids found', ids.length === 8);
for (const [id, fns] of Object.entries(HOOKS)) {
  const wired = fns.some(name => fnAll(name).includes("hasInvestment('" + id + "')"));
  ck(`${id} is wired into gameplay`, wired);
}
ck('no staff id is left unhooked', ids.every(id => HOOKS[id]));

ck('morale protection reaches the post-match swing', /careerStaffMoraleSwing\(\(r\.score\[0\]>r\.score\[1\]\?4/.test(game));
ck('recovery bonus reaches the weekly recovery focus', /t\.fatigue=clamp\(t\.fatigue-careerStaffRecovery\(22,p\),0,100\)/.test(game));
ck('recovery bonus reaches the recovery drill', /t\.fatigue=clamp\(t\.fatigue-careerStaffRecovery\(recoveryAmount\),0,100\)/.test(game));
ck('agent improves the club offer', /careerStaffAgentEdge\(\)/.test(offer));
ck('agent softens counteroffer resistance', /agentEdge=careerStaffAgentEdge\(\)/.test(counter));
// v75.11: the strip moved from a full-width band above the ground into the
// collapsible player-status rail on the left of the training centre.
ck('staff strip is injected into the training centre', /careerStaffStripMarkup\(\)/.test(game) && /training-side-rail/.test(game));
ck('staff strip links back to the hire screen', /data-open-staff/.test(fn('careerStaffStripMarkup')) && /setCareerTab\('finances'\)/.test(game));
ck('staff strip is styled for the dark training centre', /\.career-staff-strip\{/.test(css) && /\.career-staff-effects\{/.test(css));

// --- what the Elite Agent is actually worth ------------------------------
let offerTable = [];
{
  const ctx = {
    console, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    CONTRACT_ROLES: ['Prospect', 'Reserve', 'Substitute', 'Rotation', 'Regular Starter', 'Key Player'],
    contractRoleRank: r => Math.max(0, ctx.CONTRACT_ROLES.indexOf(r)),
    ensureContractSystem: () => ({ current: { wage: 4200 } }),
    contractEvaluation: () => ({ score: 71 }),
    career: { player: { age: 24, overall: 74, position: 'CM', managerTrust: 80, attrs: { finishing: 70 } } },
    careerStaffAgentEdge: () => ctx.__agent
  };
  ctx.contractRoleRank = r => Math.max(0, ctx.CONTRACT_ROLES.indexOf(r));
  vm.createContext(ctx);
  vm.runInContext(offer, ctx);
  ctx.__agent = 0; const plain = ctx.suggestedContractOffer();
  ctx.__agent = 1; const agent = ctx.suggestedContractOffer();
  offerTable = [
    ['Weekly wage', plain.wage, agent.wage],
    ['Signing bonus', plain.signingBonus, agent.signingBonus],
    ['Appearance bonus', plain.appearanceBonus, agent.appearanceBonus],
    ['Goal bonus', plain.goalBonus, agent.goalBonus],
    ['Contract weeks', plain.weeks, agent.weeks]
  ];
  ck('OFFER: the agent raises every headline term', offerTable.every(([, a, b]) => b > a));
  ck('OFFER: the agent lifts the squad role', ctx.CONTRACT_ROLES.indexOf(agent.role) > ctx.CONTRACT_ROLES.indexOf(plain.role));
}

// --- cache tokens ---------------------------------------------------------
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.7.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 7)));
}

console.log('\nPROTECT CONTACT + CAREER STAFF V75.7 VALIDATION');
console.log('\nElite Agent contract offer (evaluation 71, current wage 4,200)');
console.log('term                 without agent   with agent');
offerTable.forEach(([label, a, b]) => console.log(
  label.padEnd(21) + String(a.toLocaleString('en-GB')).padStart(13) + String(b.toLocaleString('en-GB')).padStart(13)));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
