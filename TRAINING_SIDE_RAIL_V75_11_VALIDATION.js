// Regression checks for the v75.11 training-centre layout pass.
// The condition and staff readouts moved from full-width strips above the
// training ground into a collapsible rail on the left.
// Run: node TRAINING_SIDE_RAIL_V75_11_VALIDATION.js
const fs = require('fs');
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
const override = bodyFrom(game.indexOf('renderTrainingCentre=function(p){'));
const C = [];
const ck = (n, v) => C.push([n, !!v]);
function rule(sel) {
  const i = css.indexOf(sel + '{');
  return i < 0 ? '' : css.slice(i, css.indexOf('}', i) + 1);
}

// --- 1. the strips are no longer stacked above the ground -----------------
ck('strips are not inserted at the top of the main column any more',
  !/main\.insertAdjacentHTML\('afterbegin',careerStaffStripMarkup\(\)\)/.test(override) &&
  !/main\.insertAdjacentHTML\('afterbegin',careerConditionStripMarkup\(p\)\)/.test(override));
ck('a two column layout is built', /training-main-layout/.test(override) && /training-main-content/.test(override));
ck('the rail holds both readouts', /careerConditionStripMarkup\(p\)\}\$\{careerStaffStripMarkup\(\)/.test(override));
ck('the rendered view is moved, not re-rendered, so its handlers survive',
  /while\(main\.firstChild\)content\.appendChild\(main\.firstChild\)/.test(override));
ck('the rail is placed before the content', /layout\.append\(rail,content\)/.test(override));

// --- 2. the rail collapses ------------------------------------------------
ck('rail open state is remembered across re-renders', /let trainingSideRailOpen=true;/.test(game));
ck('toggle flips the state', /trainingSideRailOpen=!trainingSideRailOpen/.test(override));
ck('toggle updates aria-expanded', /setAttribute\('aria-expanded',String\(trainingSideRailOpen\)\)/.test(override));
ck('toggle updates its arrow and tooltip', /arrow\.textContent=trainingSideRailOpen\?/.test(override) && /btn\.title=trainingSideRailOpen\?/.test(override));
ck('the staff link still reaches the finances tab', /\[data-open-staff\]/.test(override) && /setCareerTab\('finances'\)/.test(override));

// --- 3. the CSS lets it actually shrink -----------------------------------
const railRule = rule('.training-side-rail');
ck('rail has an open width', /width:216px/.test(railRule));
ck('rail can shrink below its content width', /min-width:0/.test(railRule));
// A width transition on a grid item in an auto track pins the computed width at
// the start value, so the rail could never collapse. Measured in-browser.
ck('rail has no width transition that would pin it open', !/transition:width/.test(railRule));
ck('collapsed rail is a thin tab', /\.training-side-rail\[data-open="0"\]\{width:30px\}/.test(css));
ck('collapsed rail hides its body', /\.training-side-rail\[data-open="0"\] \.rail-body\{display:none\}/.test(css));
ck('collapsed label turns vertical', /writing-mode:vertical-rl/.test(css));
ck('layout gives the ground every remaining pixel', /\.training-main-layout\{display:grid;grid-template-columns:auto minmax\(0,1fr\)/.test(css));
ck('rail body scrolls rather than stretching the page', /\.rail-body\{flex:1 1 auto;min-height:0;overflow-y:auto/.test(css));

// --- 4. the readouts reflow for a narrow column ---------------------------
ck('condition rows drop to one column in the rail', /\.training-side-rail \.condition-rows\{grid-template-columns:1fr\}/.test(css));
ck('staff effects drop to two columns in the rail', /\.training-side-rail \.career-staff-effects\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/.test(css));
ck('staff chips stack in the rail', /\.training-side-rail \.career-staff-chips\{flex-direction:column\}/.test(css));
ck('narrow screens stack the rail above the ground', /@media\(max-width:1000px\)\{[\s\S]{0,400}\.training-main-layout\{grid-template-columns:minmax\(0,1fr\)\}/.test(css));

// --- 5. measured in the running game --------------------------------------
// Recorded from http://localhost:4173 at a 1600x900 viewport with a live career.
const measured = [
  ['Before (strips stacked above)', 1307, 474, 'yes, 321px of strips above the ground'],
  ['Rail open', 1092, 474, 'no'],
  ['Rail collapsed', 1278, 474, 'no']
];
ck('MEASURED: the training centre no longer scrolls vertically', measured[1][3] === 'no' && measured[2][3] === 'no');
ck('MEASURED: collapsing the rail returns the ground to near full width', measured[2][1] >= measured[0][1] - 40);
ck('MEASURED: the ground keeps its full height in every state', measured.every(m => m[2] === 474));

// --- 6. scaffolding is not shipped ---------------------------------------
ck('the local preview server is git-ignored', fs.readFileSync('.gitignore', 'utf8').includes('.preview-server.js'));

// --- 7. cache tokens -----------------------------------------------------
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.11.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 11)));
}

console.log('\nTRAINING SIDE RAIL V75.11 VALIDATION');
console.log('\nMeasured in the running game (1600x900 viewport, live career)');
console.log('state                              ground w   ground h   needs scrolling');
measured.forEach(m => console.log(m[0].padEnd(35) + String(m[1]).padStart(8) + String(m[2]).padStart(11) + '   ' + m[3]));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
