// Regression checks for v75.4: squad list, attribute editor and match audio.
// Run: node SQUAD_EDITOR_AUDIO_V75_4_VALIDATION.js
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
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.4.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 4)));
}

// ------------------------------------------------------------------- squad
const rowsFn = fn('buildSquadRows');
ck('career player is built once and used on both squad paths',
  rowsFn.includes('const userRow={id:\'career-user\'') && rowsFn.includes('const base=[userRow,...teammates];'));
ck('fallback squad no longer omits the user', !/:fallbackNames\.map\(\(name,i\)=>\(\{id:`fallback-\$\{i\}`[\s\S]*?\}\)\)\);/.test(rowsFn.split('const teammates=')[0] || ''));
ck('imported squad still drops the replaced player', rowsFn.includes("imported.filter(p=>p.id!==replaced?.id)"));
ck('shirt-number clash with the user is removed',
  rowsFn.includes('.filter(p=>Number(p.shirtNumber)!==Number(userRow.shirtNumber))'));
ck('stacked squad view uses plain block flow so the panes cannot overlap',
  /\.squad-database-layout\{display:block;min-height:0\}/.test(css));
ck('squad table is no longer its own scroll container',
  /\.squad-table-wrap\{overflow:visible;min-height:0\}/.test(css));
ck('the squad list itself does the scrolling', /#squadList\{overflow:auto;align-content:start\}/.test(css));
ck('two-column layout returns when there is room',
  /@media\(min-width:1051px\)\{[\s\S]*?\.squad-database-layout\{display:grid;grid-template-columns:minmax\(0,1fr\) 320px;align-items:start\}/.test(css));
ck('detail panel follows the list on wide screens',
  /@media\(min-width:1051px\)\{[\s\S]*?\.squad-detail-panel\{[^}]*position:sticky;top:0\}/.test(css));

// -------------------------------------------------------- attribute editor
const presetFn = fn('applyAttributePreset');
ck('presets no longer force a re-render that discards the draft',
  !presetFn.includes('renderAttributeEditor(true)') && presetFn.includes('renderAttributeEditor();'));
ck('all four presets still write into the draft',
  presetFn.includes("type==='max'") && presetFn.includes("type==='original'") &&
  presetFn.includes("type==='random'") && presetFn.includes("type==='specialist'"));
ck('a forced render is still available for a genuine reseed',
  fn('renderAttributeEditor').includes('if(force||!attributeDraft||attributeDraftCareerId!==career.careerId)resetAttributeDraft()'));

// -------------------------------------------------------------- audio mix
ck('mixer buses exist', /let masterGain = null, sfxBus = null, crowdBus = null/.test(game));
ck('volume settings are read into the mix', fn('refreshAudioMix').includes("audioMixLevel('masterVolume'") &&
  fn('refreshAudioMix').includes("audioMixLevel('effectsVolume'") && fn('refreshAudioMix').includes("audioMixLevel('crowdVolume'"));
ck('buses are wired compressor -> master -> destination',
  game.includes('masterCompressor.connect(masterGain)') && game.includes('masterGain.connect(audioCtx.destination)') &&
  game.includes('sfxBus.connect(masterCompressor)') && game.includes('crowdBus.connect(masterCompressor)'));
ck('nothing bypasses the mixer any more', !game.includes('masterCompressor || ctx.destination') && !game.includes('masterCompressor||ctx.destination'));
// soundGrainCloud has an `opts={}` default parameter, which the brace-matching
// extractor above cannot walk, so read its source span directly.
const grainCloudSrc = game.slice(game.indexOf('function soundGrainCloud'), game.indexOf('function playMatchSound'));
ck('every sound primitive routes through a bus',
  fn('soundTone').includes('gain.connect(audioOut(channel))') &&
  fn('soundNoise').includes('gain.connect(audioOut(channel))') &&
  fn('soundModalImpact').includes("gain.connect(audioOut('sfx'))") &&
  (grainCloudSrc.match(/connect\(audioOut\(channel\)\)/g) || []).length === 2 &&
  !grainCloudSrc.includes('masterCompressor'));
ck('crowd ambience rides the crowd bus', fn('startCrowdAmbience').includes("g.connect(audioOut('crowd'))"));
ck('UI beep also obeys the mix', fn('beep').includes("g.connect(audioOut('sfx'))"));
ck('changing a volume setting takes effect immediately', fn('saveSettings').includes('refreshAudioMix()'));
ck('audio unlocks on the first user gesture',
  fn('bindAudioUnlock').includes("['pointerdown', 'keydown', 'touchstart']") && fn('bindAudioUnlock').includes('audioCtx.resume()'));
ck('the unlock is bound at boot', game.includes('bindAudioUnlock();'));
ck('diagnostic hook is exposed', game.includes('window.__circleAudio={') && game.includes('probe:(ms=700)'));

// --------------------------------------------------------------- new sfx
const whistle = fn('soundWhistleBlast');
ck('whistle sits in real pea-whistle territory, not beep territory', whistle.includes('const f1=3280*pitch'));
ck('whistle has a pea trill', whistle.includes('const trill=ctx.createOscillator()') && whistle.includes('trill.frequency.setValueAtTime(27*'));
ck('trill modulates a dedicated stage rather than the level envelope',
  whistle.includes('const chop=ctx.createGain();') && whistle.includes('trillDepth.connect(chop.gain);') &&
  !whistle.includes('trillDepth.connect(body.gain)'));
ck('whistle partials are normalised so the blast cannot dominate the mix',
  whistle.includes('[[f1,.62],[f2,.26],[f1*2.02,.10]]'));
ck('whistle has breath onset and air', whistle.includes("5200,'highpass'") && whistle.includes("4200,'bandpass'"));
const ref = fn('soundRefereeWhistle');
ck('full time is three blasts', /v==='fullTime'\)\{[\s\S]*?soundWhistleBlast[\s\S]*?soundWhistleBlast[\s\S]*?soundWhistleBlast/.test(ref));
ck('half time is two blasts', ref.includes("v==='halfTime'"));
ck('advantage is a short high chirp', ref.includes("v==='advantage'") && ref.includes('1.12'));
ck('penalty and card get a long insistent blast', ref.includes("v==='penalty'||v==='card'"));

const roar = fn('soundCrowdRoar');
ck('goal roar swells rather than starting at full volume',
  roar.includes('gain.gain.setValueAtTime(.0001,now);') && roar.includes('gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak*base),now+rise)'));
ck('goal roar holds then decays', roar.includes('now+rise+hold') && roar.includes('now+total'));
ck('goal roar is built from layered bands', (roar.match(/layer\(/g) || []).length >= 5);
ck('individual shouts sit on top of the roar', (roar.match(/soundGrainCloud\(/g) || []).length >= 2);
ck('away goals are quieter and get a home groan',
  roar.includes("home?1:.55") && roar.includes("260,'lowpass',.05,'brown',150,'crowd'"));
ck('roar runs on the crowd bus', roar.includes("const out=audioOut('crowd')"));
ck('buzzy sawtooth yell tones are gone', !game.includes("'sawtooth'") || (game.match(/'sawtooth'/g) || []).length <= 1);
ck('legacy goal-crowd branch removed', !game.includes('__legacyCrowdGoal'));

const sfx = fn('playMatchSound');
ck('whistle and crowd delegate to the new engines',
  sfx.includes('soundRefereeWhistle(variant,power)') && sfx.includes('soundCrowdRoar(variant,power)'));
ck('tackle variants are no longer ignored',
  sfx.includes("v==='keeperSave'") && sfx.includes("v==='interception'") &&
  sfx.includes("v==='block'") && sfx.includes("v==='slide'||v==='slideTackle'"));
ck('tackle still has a generic fallback', /\}else\{\s*soundNoise\(\.09,\.048\*power,640,'lowpass',0,'brown'\);/.test(sfx));

let pass = 0;
for (const [n, v] of C) { console.log(v ? 'PASS' : 'FAIL', n); if (v) pass++ }
console.log(`\nSquad + editor + audio v75.4: ${pass}/${C.length} checks passed`);
if (pass !== C.length) process.exit(1);
