// Regression checks for the v75.2 Training Centre rework.
// Run: node TRAINING_CENTRE_V75_2_VALIDATION.js
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

{
  // match the real asset tags, not the v52 compatibility comment
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.2.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 2)));
}

// --- 1. Schedule and Records tabs are gone --------------------------------
const render = fn('renderTrainingCentre');
ck('nav lists only Training Ground and Development',
  /const nav=\[\['ground','[^']*','Training Ground'\],\['development','[^']*','Development'\]\];/.test(render));
ck('no schedule nav entry', !render.includes("'Schedule'"));
ck('no records nav entry', !render.includes("'Records'"));
ck('schedule render branch removed', !render.includes("activeTrainingCentreView==='schedule'"));
ck('records render branch removed', !render.includes("activeTrainingCentreView==='records'"));
ck('the two undefined markup helpers are no longer called',
  !game.includes('trainingScheduleMarkup') && !game.includes('trainingRecordsMarkup'));
ck('stale views redirect to the training ground',
  render.includes("['today','activities','schedule','records'].includes(activeTrainingCentreView)"));
ck('orphaned schedule bindings removed',
  !game.includes('data-training-plan-slot') && !game.includes('data-locate-planned'));
ck('dead schedule/records header selectors removed from css',
  !css.includes('.schedule-centre>header') && !css.includes('.records-centre>header'));

// --- 2. Training Ground command bar --------------------------------------
const markup = fn('trainingGroundMarkup');
ck('command bar replaces the old stacked header', markup.includes('class="tg-bar"'));
ck('old status strip removed', !markup.includes('training-ground-status'));
ck('old keyboard row removed', !markup.includes('training-ground-key'));
ck('session pips rendered', markup.includes('class="tg-pips"') && markup.includes("i<remaining?'live':'used'"));
ck('fatigue and sharpness use graded meters',
  markup.includes("trainingGroundMeter('FATIGUE'") && markup.includes("trainingGroundMeter('SHARPNESS'"));
ck('meter tone thresholds defined',
  /fatigueTone=fatigue>70\?'bad':fatigue>42\?'warn':'good'/.test(markup) &&
  /sharpTone=sharp>78\?'good':sharp>55\?'warn':'bad'/.test(markup));
ck('intensity control is reachable again', markup.includes('id="trainingIntensitySelect"'));
ck('difficulty control is reachable again', markup.includes('id="trainingDifficultySelect"'));
ck('intensity is disabled while training is locked', /id="trainingIntensitySelect" \$\{locked\?'disabled':''\}/.test(markup));
ck('existing change handlers still bound', render.includes("#trainingIntensitySelect") && render.includes("#trainingDifficultySelect"));

// --- 3. Coach strip / lock strip -----------------------------------------
ck('coach recommendation strip rendered', markup.includes('class="tg-coach"'));
ck('coach strip offers walk-there and play-now', markup.includes('data-ground-goto=') && markup.includes('data-ground-quick='));
ck('locked careers show a lock strip instead', markup.includes('class="tg-lock"') && markup.includes('TRAINING RESTRICTED'));
ck('lock reason covers injury, retirement and international duty',
  /career\.injury\?`Recovering from \$\{career\.injury\.name\}`:career\.retired\?'Career complete':career\.phase==='international'/.test(markup));

// --- 4. Explorer + facility markers --------------------------------------
ck('facility markers show a drill count', markup.includes('drill${drills.length===1?\'\':\'s\'}'));
ck('coach facility is tagged', markup.includes("isPick?' coach-pick':''"));
ck('in-pitch legend replaces the chrome row', markup.includes('class="tg-legend"'));
ck('explorer flexes to fill available height', /\.training-ground-wrap \.training-ground-explorer\{flex:1/.test(css));
ck('coach pick badge styled', css.includes('.ground-facility.coach-pick:after'));

// --- 5. Zone panel -------------------------------------------------------
const bind = fn('bindTrainingGround');
ck('zone panel shows personal bests', bind.includes('No personal best yet') && bind.includes('PB ${best.toLocaleString()}'));
ck('zone panel grades a personal best', bind.includes('trainingGradeForScore(best)'));
ck('zone panel tags the coach pick', bind.includes("isPick?' coach-pick':''"));
ck('zone panel explains career vs practice mode', bind.includes('zone-session-state') && bind.includes('Practice mode.'));
ck('sim is gated on a career session being available', bind.includes("data-ground-sim=\"${id}\" ${canReward?'':'disabled'}"));
// v75.10: the player now runs to the zone instead of teleporting, and the zone
// opens on arrival inside the travel step rather than immediately.
ck('walk-there moves the player and opens the zone', bind.includes('[data-ground-goto]') && bind.includes('runToZone(target)') && bind.includes('openZone(arrived)'));
ck('play-now launches the recommended drill', bind.includes('[data-ground-quick]') && bind.includes('openTrainingDrill(b.dataset.groundQuick)'));

// --- 6. Animation loop leak ----------------------------------------------
ck('loop handle is module scoped', /let trainingGroundLoop=0;/.test(game));
ck('stopTrainingGroundLoop cancels the active loop',
  fn('stopTrainingGroundLoop').includes('cancelAnimationFrame(trainingGroundLoop)'));
ck('each bind stops the previous loop first',
  /function bindTrainingGround\(root\)\{\s*stopTrainingGroundLoop\(\);/.test(bind));
ck('loop self-terminates when its explorer is detached',
  bind.includes('if(!ground.isConnected){stopTrainingGroundLoop();return}'));
ck('no local raf variable survives in the binder', !/let raf=0/.test(bind));
ck('drill launches stop the loop rather than a stale handle',
  bind.includes('stopTrainingGroundLoop();openTrainingDrill(') && !bind.includes('cancelAnimationFrame(raf)'));

// --- 7. Helpers ----------------------------------------------------------
ck('facility lookup helper exists', /function trainingGroundFacilityFor\(/.test(game));
ck('zone drill helper exists', /function trainingGroundZoneDrills\(/.test(game));
ck('coach pick helper exists', /function trainingGroundCoachPick\(/.test(game));
ck('meter helper clamps to 0-100', fn('trainingGroundMeter').includes('clamp(Math.round(value),0,100)'));

let pass = 0;
for (const [n, v] of C) { console.log(v ? 'PASS' : 'FAIL', n); if (v) pass++ }
console.log(`\nTraining Centre v75.2: ${pass}/${C.length} checks passed`);
if (pass !== C.length) process.exit(1);
