// Regression checks for the v75.8 Contract Actions pass.
// Run: node CONTRACT_ACTIONS_V75_8_VALIDATION.js
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
const C = [];
const ck = (n, v) => C.push([n, !!v]);
const renderContract = fn('renderContract');

// =========================================================================
// 1. Talks button now names the week
// =========================================================================
ck('closed window reports the week talks reopen', /nextWeek=week<21\?21:week<39\?39:1/.test(fn('contractNegotiationWindow')));
ck('disabled button shows that week', /Talks open in week \$\{w\.nextWeek\}/.test(renderContract));
ck('disabled button explains itself on hover', /\$\('#requestContractTalks'\)\.title=/.test(renderContract));

// =========================================================================
// 2. Ask Agent for Advice is a real panel, not a browser alert
// =========================================================================
ck('agent advice no longer uses alert()', !/askAgentAdvice'\)\.onclick=\(\)=>alert\(/.test(renderContract));
ck('agent advice toggles an in-game panel', /contractAdviceOpen=!contractAdviceOpen/.test(renderContract));
ck('agent panel is rendered into the contract screen', /insertAdjacentHTML\('beforeend',contractAgentPanelMarkup\(\)\)/.test(renderContract));
ck('agent panel can be closed', /closeAgentAdvice/.test(renderContract) && /closeAgentAdvice/.test(fn('contractAgentPanelMarkup')));
const report = fn('contractAgentReport');
['contractEvaluation', 'contractNegotiationWindow', 'suggestedContractOffer', 'ensureTransferMarket', 'recentRatings']
  .forEach(src => ck(`agent report reads real ${src}`, report.includes(src)));
ck('agent report names the weakest approval component', /weakest\[0\]/.test(report) && /holding the deal back/.test(report));
ck('agent report quantifies the renewal', /offer\.wage-wage/.test(report));
ck('agent report reflects whether an Elite Agent is hired', /hasInvestment\('elite-agent'\)/.test(report));
ck('consulting the agent is logged to contract history', /addContractHistory\('Agent consulted'/.test(renderContract));

// =========================================================================
// 3. Explore Loan Options actually produces loans
// =========================================================================
ck('loan enquiry no longer just posts a canned message', !/body:'Your agent will assess clubs that can promise regular minutes\.'/.test(renderContract));
ck('loan search is limited to once per week', /st\.loanScoutWeek===key/.test(renderContract));
ck('loan offers are stored on the transfer market', /tm\.loanOffers=result\.offers/.test(renderContract));
ck('loan panel is rendered', /insertAdjacentHTML\('beforeend',loanOfferMarkup\(\)\)/.test(renderContract));
ck('loan offers can be accepted', /data-accept-loan/.test(fn('loanOfferMarkup')) && /acceptLoanOffer\(b\.dataset\.acceptLoan\)/.test(renderContract));
const scout = fn('scoutLoanOffers');
ck('loan scouting uses the real club database', /allTransferClubs\(\)/.test(scout));
ck('loan clubs are capped at your own level', /\(c\.reputation\|\|60\)<=myRep\+2/.test(scout));
ck('loan length runs to the end of the season', /clamp\(49-week,6,38\)/.test(scout));
const elig = fn('loanEligibility');
ck('key players are refused a loan', /contractRoleRank\(role\)>=4/.test(elig));
ck('older players are refused a loan', /Number\(p\.age\|\|20\)>28/.test(elig));
ck('short contracts are refused a loan', /current\?\.weeks\|\|104\)<26/.test(elig));
ck('a player already on loan cannot go again', /if\(save\.loan\)return\{ok:false/.test(elig));
ck('loan move reuses the transfer club-move helper', /applyCareerClubMove\(offer\)/.test(fn('acceptLoanOffer')));
ck('permanent transfers use the same helper', /applyCareerClubMove\(offer\)/.test(fn('acceptTransferOffer')));
ck('loan clock runs on the weekly career hook', /settleCareerWage\(career\);tickCareerLoan\(career\)/.test(game));

// =========================================================================
// 4. Stay Focused is no longer an infinite manager-trust button
// =========================================================================
ck('stay focused is limited to once per week', /st\.focusWeek===key/.test(renderContract));
ck('stay focused still rewards the commitment', /managerTrust\|\|0\)\+1\.5/.test(renderContract));
ck('stay focused feeds training sharpness too', /prog\.sharpness=clamp/.test(renderContract));
ck('stay focused is logged to contract history', /addContractHistory\('Focus on football'/.test(renderContract));

// =========================================================================
// 5. Styling
// =========================================================================
ck('agent panel styled', /\.agent-advice-panel\{/.test(css) && /\.agent-report-row\.good\{/.test(css));
ck('elite agent panel is distinguished', /\.agent-advice-panel\.elite\{/.test(css));
ck('loan panel styled', /\.loan-panel\{/.test(css) && /\.loan-offer-card\{/.test(css));

// =========================================================================
// 6. Live replay of the loan lifecycle
// =========================================================================
let lifecycle = [];
{
  const ctx = {
    console, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    cloneData: v => JSON.parse(JSON.stringify(v ?? null)),
    seededUnit: t => (String(t).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 1000) / 999,
    contractRoleRank: r => ['Prospect', 'Reserve', 'Substitute', 'Rotation', 'Regular Starter', 'Key Player'].indexOf(r),
    money: v => 'GBP ' + Math.round(v || 0).toLocaleString('en-GB'),
    escapeMarkup: s => String(s ?? ''),
    crestMarkup: () => '',
    confirm: () => true,
    addContractHistory: (a, d) => { lifecycle.push('history: ' + a) },
    saveCareer: () => {}, renderContract: () => {}, renderHub: () => {},
    loadCircleXIManagerCountry: () => null,
    allTransferClubs: () => ([
      { id: 'lowland', abbr: 'LOW', name: 'Lowland Rovers', reputation: 58, leagueName: 'Second Tier', leagueId: 'second', leagueLevel: 2, primary: '#0ea5e9' },
      { id: 'harbour', abbr: 'HAR', name: 'Harbour Town', reputation: 61, leagueName: 'Second Tier', leagueId: 'second', leagueLevel: 2, primary: '#22c55e' },
      { id: 'moorside', abbr: 'MOO', name: 'Moorside AFC', reputation: 55, leagueName: 'Third Tier', leagueId: 'third', leagueLevel: 3, primary: '#f59e0b' },
      { id: 'giant', abbr: 'GIA', name: 'Giant City', reputation: 92, leagueName: 'Top Flight', leagueId: 'top', leagueLevel: 1, primary: '#ef4444' }
    ]),
    ensureTransferMarket: () => ctx.career.transferMarket,
    ensureContractSystem: (s = ctx.career) => s.contract,
    ensureCareerRecords: () => {}
  };
  ctx.career = {
    careerId: 'test', season: 1, week: 8, clubIndex: 0,
    club: { id: 'home', abbr: 'HOM', name: 'Home United', reputation: 64, primary: '#7c3aed' },
    world: { countryId: 'eng', leagueId: 'first', leagueName: 'First Tier', leagueLevel: 1 },
    league: [{ id: 'home', name: 'Home United' }],
    player: { name: 'Test Player', age: 21, overall: 66, position: 'CM', wage: 2000, status: 'Rotation', morale: 60, managerTrust: 50 },
    contract: { current: { wage: 2000, weeks: 104, role: 'Rotation' }, negotiation: null, history: [], actions: {} },
    transferMarket: { offers: [], loanOffers: [], history: [] },
    messages: [], recentRatings: [7.1, 6.9, 7.4]
  };
  vm.createContext(ctx);
  ['contractRoleLabel', 'loanEligibility', 'scoutLoanOffers', 'applyCareerClubMove', 'acceptLoanOffer', 'tickCareerLoan']
    .forEach(name => vm.runInContext(fn(name), ctx));

  const scouted = ctx.scoutLoanOffers();
  ck('REPLAY: a rotation player is offered loans', scouted.ok && scouted.offers.length > 0);
  ck('REPLAY: no loan club outranks the parent club', scouted.offers.every(o => o.club.reputation <= 64 + 2));
  ck('REPLAY: loan wage is below the parent wage', scouted.offers.every(o => o.wage < 2000));

  ctx.career.transferMarket.loanOffers = scouted.offers;
  const parentName = ctx.career.club.name, target = scouted.offers[0];
  ctx.acceptLoanOffer(target.id);
  ck('REPLAY: accepting a loan moves the club', ctx.career.club.name === target.club.name);
  ck('REPLAY: the parent club is remembered', ctx.career.loan?.parentSnapshot?.club?.name === parentName);
  ck('REPLAY: the loan wage applies while away', ctx.career.player.wage === target.wage);
  ck('REPLAY: a second loan is refused while away', !ctx.loanEligibility(ctx.career).ok);

  const weeks = ctx.career.loan.weeksRemaining;
  let returned = false;
  for (let i = 0; i < weeks; i++) returned = ctx.tickCareerLoan(ctx.career) || returned;
  ck(`REPLAY: the loan expires after its ${weeks} weeks`, returned && ctx.career.loan === null);
  ck('REPLAY: the player returns to the parent club', ctx.career.club.name === parentName);
  ck('REPLAY: the parent wage is restored', ctx.career.player.wage === 2000);
  ck('REPLAY: the parent squad role is restored', ctx.career.contract.current.role === 'Rotation');
  ck('REPLAY: the spell is written into contract history', lifecycle.includes('history: Loan completed'));

  // A key player should be told no.
  ctx.career.contract.current.role = 'Key Player';
  ck('REPLAY: a key player is refused a loan', !ctx.loanEligibility(ctx.career).ok);
  lifecycle = [
    ['Loan offers found', scouted.offers.length],
    ['Loan length (weeks)', weeks],
    ['Wage while on loan', target.wage],
    ['Wage after return', ctx.career.player.wage]
  ];
}

// =========================================================================
// 7. Cache tokens
// =========================================================================
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.8.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 8)));
}

console.log('\nCONTRACT ACTIONS V75.8 VALIDATION');
console.log('\nLoan lifecycle replay (Rotation player, OVR 66, week 8, parent reputation 64)');
lifecycle.forEach(([label, value]) => console.log('  ' + String(label).padEnd(24) + String(value).padStart(8)));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
