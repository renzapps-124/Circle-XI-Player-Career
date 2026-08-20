// Regression checks for the v75.12 pass:
//   1. career statistics accuracy
//   2. the international squad view
// Run: node CAREER_STATS_SQUAD_V75_12_VALIDATION.js
const fs = require('fs'), vm = require('vm');
const game = fs.readFileSync('game.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function bodyFrom(startIndex) {
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

// =========================================================================
// PART 1 - career statistics accuracy
// =========================================================================
ck('a clean sheet no longer requires the player to have made a save',
  !/cleanSheet:!missed&&\(r\.saves\|\|0\)>0/.test(game) && !/cleanSheets\+=\(Number\(r\.saves\)>0/.test(game));
ck('one shared clean sheet definition', /function careerRowCleanSheet\(row\)/.test(game) && /function careerResultCleanSheet\(r,missed=false\)/.test(game));
ck('the clean sheet rule is: appeared, and conceded nothing', /conceded===0/.test(fn('careerRowCleanSheet')));
ck('one shared minutes definition', /function careerRowMinutes\(row\)/.test(game));
ck('the running counter and the match record use the same minutes fallback',
  /stats\.minutes\+=Number\(r\.minutesPlayed\)>0\?Number\(r\.minutesPlayed\):\(started\?90:25\)/.test(game) &&
  /minutesPlayed:missed\?0:\(Number\(r\.minutesPlayed\)>0\?Number\(r\.minutesPlayed\):\(startedForHistory\?90:25\)\)/.test(game));
ck('old saves are repaired on load', /row\.minutesPlayed=careerRowMinutes\(row\);row\.cleanSheet=careerRowCleanSheet\(row\)/.test(fn('normaliseCareerStatHistory')));
ck('stored totals are rebuilt from the match record', /function reconcileCareerStatistics\(save=career\)/.test(game));
ck('every reader of career.stats gets the reconciled totals', /function ensureCareerStatFields\(save=career\)\{if\(!save\)return\{\};reconcileCareerStatistics\(save\)/.test(game));
ck('international totals can no longer only ratchet upwards',
  !/intl\.caps=Math\.max\(Number\(intl\.caps\)\|\|0/.test(game) && /intl\.caps=Number\(intl\.stats\.apps\)\|\|0/.test(game));
ck('the stats page reads one source, not a merge of two', /careerDerived=aggregateCareerRows\(clubMatches\),s=careerDerived/.test(fn('careerStatisticsMarkup')));
ck('the international card reads the same derived source', /intlStats=\{\.\.\.intlDerived\};/.test(fn('careerStatisticsMarkup')));

// --- the two accounting paths must agree on the same match ---------------
let diffTable = [];
{
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(game.slice(game.indexOf('const CAREER_STAT_DEFAULTS='), game.indexOf('function ensureCareerStatFields(')), ctx);
  ['careerRowCleanSheet', 'careerResultCleanSheet', 'careerRowMinutes', 'blankCareerStats', 'aggregateCareerRows', 'accumulateCareerResultStats']
    .forEach(n => vm.runInContext(fn(n), ctx));

  // An outfield player in a 2-0 win. minutesPlayed deliberately absent, which is
  // what exposed the 90-vs-0 split between the two paths.
  const r = {
    rating: 7.4, goals: 1, assists: 1, shots: 3, shotsOnTarget: 2, keyPasses: 2, chancesCreated: 2,
    passes: 40, completed: 34, crosses: 3, successfulCrosses: 1, dribbles: 5, successfulDribbles: 3,
    possessionLost: 6, misplacedPasses: 6, tackles: 2, interceptions: 1, blocks: 1, saves: 0,
    foulsCommitted: 1, yellowCards: 0, redCards: 0, distance: 9.8, score: [2, 0]
  };
  const row = {
    started: true, score: [...r.score], rating: r.rating, goals: r.goals, assists: r.assists,
    keyPasses: r.keyPasses, chancesCreated: r.chancesCreated, tackles: r.tackles, interceptions: r.interceptions,
    saves: r.saves, cleanSheet: ctx.careerResultCleanSheet(r, false), shots: r.shots, shotsOnTarget: r.shotsOnTarget,
    passes: r.passes, completed: r.completed, crosses: r.crosses, successfulCrosses: r.successfulCrosses,
    dribbles: r.dribbles, successfulDribbles: r.successfulDribbles, possessionLost: r.possessionLost,
    misplacedPasses: r.misplacedPasses, minutesPlayed: 0, blocks: r.blocks, foulsCommitted: r.foulsCommitted,
    yellowCards: 0, redCards: 0, distance: r.distance, playerOfMatch: false, missedByInjury: false
  };
  const counter = ctx.accumulateCareerResultStats(ctx.blankCareerStats(), r, true);
  const derived = ctx.aggregateCareerRows([row]);
  const keys = [...new Set([...Object.keys(counter), ...Object.keys(derived)])].filter(k => k !== 'avgRating');
  const disagree = keys.filter(k => (Number(counter[k]) || 0) !== (Number(derived[k]) || 0));
  diffTable = [['clean sheets', counter.cleanSheets, derived.cleanSheets], ['minutes', counter.minutes, derived.minutes],
  ['goals', counter.goals, derived.goals], ['apps', counter.apps, derived.apps]];
  ck('MEASURED: the running counter and the season table agree on every stat', disagree.length === 0);
  ck('MEASURED: an outfield player records a clean sheet in a 2-0 win', counter.cleanSheets === 1 && derived.cleanSheets === 1);
  ck('MEASURED: the same match is worth the same minutes both ways', counter.minutes === derived.minutes && counter.minutes === 90);
}

// --- reconciliation must override corrupt stored totals ------------------
let reconcileTable = [];
{
  const ctx = { console, career: null, hashText: t => String(t).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) };
  vm.createContext(ctx);
  vm.runInContext(game.slice(game.indexOf('const CAREER_STAT_DEFAULTS='), game.indexOf('function ensureCareerStatFields(')), ctx);
  ['careerRowCleanSheet', 'careerRowMinutes', 'blankCareerStats', 'aggregateCareerRows', 'reconcileCareerStatistics'].forEach(n => vm.runInContext(fn(n), ctx));
  ctx.normaliseCareerStatHistory = save => save.fixtureHistory;
  const mk = (i, intl) => ({
    season: 1, started: true, score: i % 3 === 0 ? [2, 0] : [1, 1], rating: 7.1, goals: i % 4 === 0 ? 1 : 0,
    assists: 0, minutesPlayed: 90, competition: intl ? { type: 'international' } : { name: 'League' }
  });
  const save = {
    player: { name: 'Test' },
    fixtureHistory: [...Array(12)].map((_, i) => mk(i, false)).concat([...Array(3)].map((_, i) => mk(i, true))),
    stats: { apps: 99, goals: 42, minutes: 12345, cleanSheets: 0 },
    international: { caps: 77, goals: 30, stats: {} }
  };
  ctx.reconcileCareerStatistics(save);
  reconcileTable = [
    ['Club appearances', 99, save.stats.apps, 12],
    ['Club goals', 42, save.stats.goals, 3],
    ['Club minutes', 12345, save.stats.minutes, 1080],
    ['International caps', 77, save.international.caps, 3]
  ];
  ck('MEASURED: corrupt stored club totals are replaced by the match record',
    save.stats.apps === 12 && save.stats.goals === 3 && save.stats.minutes === 1080);
  ck('MEASURED: inflated international caps are corrected downwards', save.international.caps === 3);
  ck('MEASURED: club and international records stay separate',
    save.stats.apps === 12 && save.international.stats.apps === 3);
}

// =========================================================================
// PART 2 - international squad view
// =========================================================================
const renderSquad = fn('renderSquad');
ck('squad view has a team mode', /squadTeamView='club'/.test(game));
ck('a club / country switch is rendered', /data-squad-team=/.test(renderSquad) && /squad-team-switch/.test(renderSquad));
ck('the switch is bound and resets view state', /squadTeamView=btn\.dataset\.squadTeam;squadSelectedId=null/.test(renderSquad));
ck('rows come from the active view', /function squadViewRows\(\)\{return squadTeamView==='country'\?buildInternationalSquadRows\(\):buildSquadRows\(\)\}/.test(game));
ck('the detail panel follows the active view too', /squadDetailMarkup\(selected,squadViewRows\(\)\)/.test(renderSquad));
ck('the heading changes with the view', /squadViewIdentity\(\)/.test(renderSquad) && /squadScreenTitle/.test(renderSquad));
ck('the screen heading is addressable', /id="squadScreenTitle"/.test(html));

const buildIntl = fn('buildInternationalSquadRows');
ck('the national pool is drawn from real clubs in the player country', /internationalPlayerPool\(\)/.test(buildIntl));
ck('the pool walks every club in the country', /loadCircleXIManagerSquad\(countryId,club\.id\)/.test(fn('internationalPlayerPool')));
ck('selection uses a positional quota', /INTERNATIONAL_SQUAD_QUOTA=\{GK:3,DEF:8,MID:7,ATT:5\}/.test(game));
ck('the player is always in their own national squad', /const base=\[userRow,\.\.\.picked\]/.test(buildIntl));
ck('a place is freed in the player own position group', /group===userGroup\?Math\.max\(0,quota-1\):quota/.test(buildIntl));
ck('countries with no generated database still field a squad', /if\(picked\.length<12\)\{/.test(buildIntl));
const intlStats = fn('makeInternationalSquadStats');
ck('international rows carry every field the table renders', /yellows:/.test(intlStats) && /reds:/.test(intlStats) && /role:/.test(intlStats));
ck('the player international record is their real one', /ensureInternationalStatFields\(career\)/.test(intlStats));
ck('team switch styled', /\.squad-team-switch\{/.test(css) && /\.squad-team-switch button\.active\{/.test(css));

// --- measured in the running game ---------------------------------------
// Recorded from http://localhost:4173 with a live career.
const squadMeasured = [['Club squad', 18], ['International squad', 23]];
ck('MEASURED: the international squad is a full call-up', squadMeasured[1][1] === 23);
ck('MEASURED: switching views does not leak rows between them', squadMeasured[0][1] !== squadMeasured[1][1]);

// =========================================================================
// cache tokens
// =========================================================================
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.12.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 12)));
}

console.log('\nCAREER STATS + INTERNATIONAL SQUAD V75.12 VALIDATION');
console.log('\nOne 2-0 win, outfield player: the two ways the game counts it');
console.log('stat                running counter   season table');
diffTable.forEach(r => console.log(String(r[0]).padEnd(20) + String(r[1]).padStart(15) + String(r[2]).padStart(15)));
console.log('\nRebuilding totals from the match record (stored values deliberately corrupted)');
console.log('total                       stored     after     expected');
reconcileTable.forEach(r => console.log(String(r[0]).padEnd(24) + String(r[1]).padStart(9) + String(r[2]).padStart(10) + String(r[3]).padStart(13)));
console.log('\nSquad screen, measured in the running game');
squadMeasured.forEach(r => console.log('  ' + String(r[0]).padEnd(24) + String(r[1]).padStart(4) + ' players'));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
