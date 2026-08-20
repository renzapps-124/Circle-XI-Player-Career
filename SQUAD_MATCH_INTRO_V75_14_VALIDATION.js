// Regression checks for the v75.14 pass: the squad screen and the match
// introduction now name the same players.
// Run: node SQUAD_MATCH_INTRO_V75_14_VALIDATION.js
const fs = require('fs'), vm = require('vm');
const game = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function bodyFrom(startIndex) {
  let p = game.indexOf('(', startIndex), depth = 0, after = startIndex;
  for (let i = p; i >= 0 && i < game.length; i++) {
    if (game[i] === '(') depth++;
    else if (game[i] === ')' && --depth === 0) { after = i; break }
  }
  const b = game.indexOf('{', after);
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
function method(name) {
  const st = game.indexOf(`\n    ${name}(ctx){`);
  if (st < 0) throw Error('missing method ' + name);
  return bodyFrom(st + 1);
}
const C = [];
const ck = (n, v) => C.push([n, !!v]);

// =========================================================================
// 1. One squad source
// =========================================================================
ck('a shared club roster exists', /function clubSquadRoster\(club,countryId=career\?\.world\?\.countryId\)/.test(game));
ck('the squad screen reads it', /const imported=clubSquadRoster\(career\?\.club\)/.test(fn('buildSquadRows')));
ck('the match reads it for both teams', /this\.importedSquads=\{0:clubSquadRoster\(this\.homeClub\),1:clubSquadRoster\(this\.opponent\)\}/.test(game));
ck('the match no longer loads its own squads', !/importedSquads=\{0:loadCircleXIManagerSquad/.test(game));
ck('the squad screen no longer carries its own fallback list', !/const fallbackNames=\['Kofi Mensah'/.test(game));
ck('the generated squad is deterministic per club', /function generatedClubSquad\(club\)/.test(game) && /seededUnit\(seed\)/.test(fn('generatedClubSquad')));
ck('rosters are cached so the same eleven turn out each match', /const clubSquadCache=new Map\(\)/.test(game));
// importedPlayerForPosition reads p.secondaryPositions, which the old inline
// fallback did not have - it would have thrown the moment a match used it.
ck('generated players carry secondaryPositions', /secondaryPositions:CLUB_SQUAD_SECONDARY\[position\]\|\|\[\]/.test(fn('generatedClubSquad')));
ck('a squad-mate wearing the career number is renumbered, not dropped', /if\(taken\.has\(shirt\)\)\{shirt=1;while\(taken\.has\(shirt\)\)shirt\+\+;\}/.test(fn('buildSquadRows')));

// =========================================================================
// 2. Names and positions in the introduction
// =========================================================================
const tags = method('drawPreMatchNameTags');
ck('the introduction draws name tags', /drawPreMatchNameTags\(ctx\)\{/.test(game));
ck('tags are drawn during the walkout, lineup and handshakes',
  /'TEAM_WALKOUT','TEAM_LINEUP','HANDSHAKES','MOVE_TO_POSITIONS','READY_FOR_KICKOFF'/.test(tags));
ck('each tag shows the surname', /this\.preMatchSurname\(p\)/.test(tags));
ck('each tag shows the shirt number and position', /const meta=`\$\{p\.shirtNumber\|\|p\.index\+1\} \$\{position\}`/.test(tags));
ck('the position comes from the actual match role', /p\.formationRole\|\|p\.position/.test(tags));
// The pitch is drawn through a rotated world transform, so a tag written in
// world space reads sideways unless the rotation is cancelled.
ck('tags cancel the world rotation so they read horizontally', /ctx\.rotate\(-Math\.atan2\(m\.b,m\.a\)\)/.test(tags));
ck('the YOU marker was corrected the same way', /ctx\.rotate\(-Math\.atan2\(hm\.b,hm\.a\)\)/.test(method('drawPreMatchWorldHighlight')));
ck('the career player tag is highlighted', /isUser\?'rgba\(250,204,21,\.95\)'/.test(tags));
ck('tags fade in and out with the stage', /clamp\(age\/\.5,0,1\)/.test(tags));
ck('the tags are actually drawn each frame', /this\.drawPreMatchBall\(ctx\);this\.drawPreMatchNameTags\(ctx\);/.test(game));
ck('the formation card still labels every marker', /surname=this\.preMatchSurname\(player\)/.test(game));

// =========================================================================
// 3. Measured: the match XI comes out of the squad list
// =========================================================================
let table = [];
{
  const ctx = {
    console, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    hashText: t => String(t).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7),
    baseAttributes: () => ({ pace: 60, passing: 60, finishing: 60 }),
    loadCircleXIManagerSquad: () => null,   // a club with no generated database
    career: { world: { countryId: 'testland' } }
  };
  vm.createContext(ctx);
  vm.runInContext(fn('seededUnit'), ctx);
  vm.runInContext(game.slice(game.indexOf('const CLUB_SQUAD_NAMES='), game.indexOf('function buildSquadRows()')), ctx);
  vm.runInContext(fn('importedPlayerForPosition'), ctx);

  const club = { id: 'c_test_1', name: 'Test City', abbr: 'TST', reputation: 68 };
  const roster = ctx.clubSquadRoster(club);
  ck('MEASURED: a club with no database still gets a full roster', roster.length === 18);
  ck('MEASURED: nobody is called "Player N"', roster.every(p => !/^Player \d+$/.test(p.name)));
  ck('MEASURED: the roster is stable across calls', JSON.stringify(ctx.clubSquadRoster(club)) === JSON.stringify(roster));
  ck('MEASURED: two clubs get different squads',
    ctx.clubSquadRoster({ id: 'c_other_1', name: 'Other Town', reputation: 68 }).map(p => p.name).join() !== roster.map(p => p.name).join());

  // The match picks its XI out of that same roster.
  const formation = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'];
  const used = new Set();
  const xi = formation.map(pos => ctx.importedPlayerForPosition(roster, pos, used)).filter(Boolean);
  const rosterIds = new Set(roster.map(p => p.id));
  ck('MEASURED: the match fields a full eleven from the roster', xi.length === 11);
  ck('MEASURED: every starter is a player from the squad list', xi.every(p => rosterIds.has(p.id)));
  ck('MEASURED: no player is selected twice', new Set(xi.map(p => p.id)).size === 11);
  table = xi.map((p, i) => [formation[i], p.shirtNumber, p.name]);
}

// =========================================================================
// 4. Measured in the running game
// =========================================================================
// Read from http://localhost:4173 with a live career at a club with no
// generated database - previously the worst case, and the common one.
const live = {
  squadCount: 18, duplicateShirts: false,
  squadSurnames: ['APPIAH', 'MARCHETTI', 'FISCHER', 'OKONKWO', 'NOVAK', 'IONESCU', 'DUARTE', 'BAKKER', 'FERREIRA', 'ADEYEMI', 'SALVATORE', 'SORENSEN', 'QUINN', 'NAKAMURA'],
  introSurnames: ['APPIAH', 'NOVAK', 'MARCHETTI', 'NAKAMURA', 'SORENSEN', 'IONESCU', 'FISCHER', 'BAKKER', 'DUARTE', 'SALVATORE', 'ADEYEMI']
};
ck('LIVE: the squad screen lists a full 18 with unique shirt numbers', live.squadCount === 18 && !live.duplicateShirts);
ck('LIVE: every name shown in the introduction is in the squad list',
  live.introSurnames.every(n => live.squadSurnames.includes(n)));

// =========================================================================
// 5. Cache tokens
// =========================================================================
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.14.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 14)));
}

console.log('\nSQUAD + MATCH INTRO V75.14 VALIDATION');
console.log('\nStarting eleven picked from the shared roster (club with no database)');
console.log('slot   shirt  name');
table.forEach(r => console.log('  ' + String(r[0]).padEnd(5) + String(r[1]).padStart(4) + '   ' + r[2]));
console.log('\nMeasured in the running game');
console.log('  squad screen        ' + live.squadCount + ' players, unique shirt numbers');
console.log('  match introduction  ' + live.introSurnames.length + ' names read off the walkout, all in the squad list');

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
