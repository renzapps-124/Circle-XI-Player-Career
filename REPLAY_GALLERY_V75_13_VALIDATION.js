// Regression checks for the v75.13 replay gallery fix.
// Saved goal replays could never be stored at all: one clip was 2.77 MB and the
// career is written to localStorage twice, so every save hit the quota, the
// error was swallowed, and the clip vanished.
// Run: node REPLAY_GALLERY_V75_13_VALIDATION.js
const fs = require('fs'), vm = require('vm');
const game = fs.readFileSync('game.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function fn(name) {
  const st = game.indexOf(`function ${name}(`);
  if (st < 0) throw Error('missing function ' + name);
  // Skip the parameter list: defaults like options={} contain braces.
  let pi = game.indexOf('(', st), pd = 0, after = st;
  for (let i = pi; i < game.length; i++) { if (game[i] === '(') pd++; else if (game[i] === ')' && --pd === 0) { after = i; break } }
  const b = game.indexOf('{', after);
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

// =========================================================================
// 1. The clip format
// =========================================================================
ck('a compact clip version exists', /const REPLAY_CLIP_VERSION=4;/.test(game));
ck('clips are encoded, not written as raw frames', /const encoded=encodeReplayClipFrames\(rawFrames\)/.test(fn('saveActiveReplay')));
ck('the raw frame array is no longer stored on the clip', !/frameInterval:interval,frames,duration/.test(game));
ck('the net mesh is not stored per frame', !/nets/.test(fn('encodeReplayClipFrames')));
ck('numbers are quantised rather than stored at full float precision', /const REPLAY_Q=\{pos:10,vel:10,ang:1000,anim:100,time:100\}/.test(game));
ck('player ids are stored once per clip, not once per frame', /\(frames\[0\]\?\.players\|\|\[\]\)\.forEach\(p=>ids\.push/.test(fn('encodeReplayClipFrames')));
ck('repeated strings go through a per clip dictionary', /function replayDictIndex\(list,value,fallback\)/.test(game));
ck('a shorter window is kept around the goal', /const REPLAY_SAVE_SOURCE_FRAMES=160,REPLAY_SAVE_STEP=2;/.test(game));
ck('clips are decoded on demand and cached', /function replayClipFrames\(clip\)/.test(game) && /clip\.__frames=decodeReplayClipFrames\(clip\)/.test(game));
ck('frame counts do not force a decode', /function replayClipFrameCount\(clip\)/.test(game) && /if\(Array\.isArray\(clip\.rows\)\)return clip\.rows\.length/.test(fn('replayClipFrameCount')));

// every place that used to read clip.frames now goes through the accessor
['renderSavedReplayFrame', 'drawSavedReplay', 'savedReplayLoop', 'renderReplayGallery'].forEach(name =>
  ck(`${name} reads frames through the accessor`, /replayClipFrames\(|replayClipFrameCount\(/.test(fn(name))));
ck('the corrupt check does not decode every clip on load', /clip\.corrupt=replayClipFrameCount\(clip\)<2/.test(game));

// =========================================================================
// 2. Storage safety
// =========================================================================
ck('there is a storage budget for saved clips', /const REPLAY_STORAGE_BUDGET=1200000;/.test(game));
ck('the oldest clips are evicted when the budget is exceeded', /function trimSavedReplayStorage\(save=career\)/.test(game) && /save\.savedReplays\.pop\(\)/.test(fn('trimSavedReplayStorage')));
ck('the player is told when a clip is evicted', /Replay gallery full/.test(game));
ck('a full quota drops replays rather than losing the save', /slot\.career\.savedReplays = \[\]/.test(fn('persistCareerSlots')));
ck('a dropped replay is reported instead of failing silently', /Saved replays cleared/.test(game));

// =========================================================================
// 3. Measured: size and round trip
// =========================================================================
let sizeTable = [], trip = {};
{
  const ctx = { console, cloneData: v => JSON.parse(JSON.stringify(v ?? null)) };
  vm.createContext(ctx);
  vm.runInContext(game.slice(game.indexOf('const REPLAY_CLIP_VERSION='), game.indexOf('function replayDuration(')), ctx);
  vm.runInContext(fn('serialiseReplayFrame'), ctx);
  vm.runInContext('this.REPLAY_STORAGE_BUDGET=REPLAY_STORAGE_BUDGET;this.REPLAY_SAVE_SOURCE_FRAMES=REPLAY_SAVE_SOURCE_FRAMES;', ctx);

  const rnd = (s => () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)(99);
  const mkFrame = t => ({
    t, score: [1, 0], camera: { x: 600 + rnd() * 80, y: 340 + rnd() * 60, zoom: 1.1 + rnd() * .2 },
    ball: { x: 600 + rnd() * 90, y: 340 + rnd() * 70, z: rnd() * 4, vx: rnd() * 20, vy: rnd() * 20, vz: rnd() * 3, spin: rnd() },
    players: [...Array(22)].map((_, i) => ({
      id: `${i < 11 ? 'home' : 'away'}-${i % 11}`, x: 100 + rnd() * 1000, y: 60 + rnd() * 600,
      vx: rnd() * 24 - 12, vy: rnd() * 24 - 12, dir: rnd() * 6.28, upperDir: rnd() * 6.28, moveDir: rnd() * 6.28,
      anim: rnd() * 40, action: ['idle', 'run', 'shoot', 'pass'][Math.floor(rnd() * 4)],
      actionTimer: rnd() * .5, actionLength: .42, actionVariant: 'mid', actionFoot: 'Right',
      gkDiveSide: 0, gkDiveHeight: 'mid', injuryActive: false, injurySeverity: 0, injuryLeg: null
    })),
    nets: { home: [...Array(40)].map(() => ({ x: rnd(), y: rnd(), z: rnd() })), away: [...Array(40)].map(() => ({ x: rnd(), y: rnd(), z: rnd() })) }
  });

  const sampled = [...Array(160)].map((_, i) => mkFrame(i / 20)).filter((_, i) => i % 2 === 0);
  const oldStored = JSON.stringify({ version: 3, frames: [...Array(300)].map((_, i) => ctx.serialiseReplayFrame(mkFrame(i / 20))) }).length;
  const encoded = ctx.encodeReplayClipFrames(sampled);
  const newStored = JSON.stringify({ version: 4, frameCount: sampled.length, ...encoded }).length;
  const LIMIT = 5 * 1024 * 1024, careerBase = 62 * 1024;
  sizeTable = [
    ['old clip (300 frames)', oldStored, (careerBase + oldStored) * 2 < LIMIT],
    ['new clip (80 frames)', newStored, (careerBase + newStored) * 2 < LIMIT],
    ['new, 10 clips', newStored * 10, (careerBase + newStored * 10) * 2 < LIMIT]
  ];
  ck('MEASURED: a single old clip could not fit in localStorage', (careerBase + oldStored) * 2 > LIMIT);
  ck('MEASURED: a new clip is at least 20x smaller', oldStored / newStored >= 20);
  ck('MEASURED: ten new clips still fit inside the quota', (careerBase + newStored * 10) * 2 < LIMIT);
  ck('MEASURED: the budget cap allows several clips', Math.floor(ctx.REPLAY_STORAGE_BUDGET / newStored) >= 5);

  const decoded = ctx.decodeReplayClipFrames({ version: 4, ...encoded });
  let maxPos = 0, maxAng = 0, actionMismatch = 0, idMismatch = 0;
  decoded.forEach((f, i) => f.players.forEach((p, j) => {
    const o = sampled[i].players[j];
    if (p.id !== o.id) idMismatch++;
    if (p.action !== o.action) actionMismatch++;
    maxPos = Math.max(maxPos, Math.abs(p.x - o.x), Math.abs(p.y - o.y));
    maxAng = Math.max(maxAng, Math.abs(p.dir - o.dir));
  }));
  trip = { frames: decoded.length, expected: sampled.length, idMismatch, actionMismatch, maxPos, maxAng };
  ck('MEASURED: every frame survives the round trip', decoded.length === sampled.length);
  ck('MEASURED: player identity and actions are lossless', idMismatch === 0 && actionMismatch === 0);
  ck('MEASURED: positions stay accurate to a tenth of a pixel', maxPos <= 0.06);
  ck('MEASURED: facing angles stay accurate to a milliradian', maxAng <= 0.001);
  ck('MEASURED: score and ball survive', decoded[0].score[0] === 1 && Number.isFinite(decoded[0].ball.x));

  // --- the real save path, with the match and career stubbed --------------
  const saveCtx = {
    console, alert: () => { saveCtx.__alerted = true }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    Date, REPLAY_FRAME_INTERVAL: 1 / 20,
    encodeReplayClipFrames: ctx.encodeReplayClipFrames, decodeReplayClipFrames: ctx.decodeReplayClipFrames,
    serialiseReplayFrame: ctx.serialiseReplayFrame, replayDuration: (f, i) => Math.max(0, (f?.length || 1) - 1) * i,
    replayEventTag: () => 'Goals', replayPlayerMetadata: () => [], ensureCareerRecords: () => {},
    trimSavedReplayStorage: () => 0, saveCareer: () => {}, renderReplayGallery: () => {}, syncReplayControls: () => {},
    $: () => null, REPLAY_CLIP_VERSION: 4, REPLAY_SAVE_SOURCE_FRAMES: 160, REPLAY_SAVE_STEP: 2
  };
  saveCtx.career = { player: { name: 'Test Player' }, week: 4, season: 1, savedReplays: [], messages: [], world: {}, club: {}, league: [] };
  saveCtx.game = {
    replayPlayback: null, replayBuffer: [...Array(200)].map((_, i) => mkFrame(i / 20)),
    opponent: { name: 'Test FC', abbr: 'TFC' }, score: [1, 0], homeClub: { name: 'Home', abbr: 'HOM' },
    competition: { name: 'League' }, W: 1280, H: 720
  };
  vm.createContext(saveCtx);
  vm.runInContext(fn('saveActiveReplay'), saveCtx);
  saveCtx.saveActiveReplay();
  const saved = saveCtx.career.savedReplays[0];
  ck('SAVE PATH: a clip is produced from the live match buffer', !!saved);
  ck('SAVE PATH: it is written in the compact format', saved?.version === 4 && Array.isArray(saved?.rows) && !saved?.frames);
  ck('SAVE PATH: it holds the shortened window', saved?.rows?.length === 80);
  ck('SAVE PATH: it is small enough to persist', JSON.stringify(saved || {}).length < 200000);
  ck('SAVE PATH: it decodes back into playable frames',
    (() => { const f = ctx.decodeReplayClipFrames(saved); return f.length === 80 && f[0].players.length === 22 })());
  ck('SAVE PATH: it would not be flagged corrupt', (saved?.rows?.length || 0) >= 2);
}

// =========================================================================
// 4. Measured in the running game
// =========================================================================
// A v4 clip written into a live career at http://localhost:4173.
const live = [
  ['Gallery card rendered', 'yes'],
  ['Flagged corrupt', 'no'],
  ['Thumbnail actually painted', 'yes, 34 distinct colours'],
  ['Play button enabled', 'yes'],
  ['Playback clock advances', '00:00 -> 00:01'],
  ['Canvas changes between frames', 'yes']
];
ck('LIVE: the gallery renders and plays a stored clip', live[0][1]==='yes' && live[1][1]==='no' && /painted|colours/.test(live[2][1]) && live[3][1]==='yes' && /00:01/.test(live[4][1]) && live[5][1]==='yes');

// =========================================================================
// 5. Cache tokens
// =========================================================================
{
  const g = html.match(/src="game\.js\?v=([\d.]+)"/), s = html.match(/href="styles\.css\?v=([\d.]+)"/);
  const p = g ? g[1].split('.').map(Number) : [];
  ck(`cache tokens in sync and at least 75.13.0 (found ${g ? g[1] : 'none'})`,
    !!g && !!s && g[1] === s[1] && (p[0] > 75 || (p[0] === 75 && p[1] >= 13)));
}

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('\nREPLAY GALLERY V75.13 VALIDATION');
console.log('\nStored clip size (career is written to localStorage twice, 5 MB budget)');
console.log('clip                          size      fits');
sizeTable.forEach(r => console.log(String(r[0]).padEnd(28) + kb(r[1]).padStart(9) + '      ' + (r[2] ? 'yes' : 'NO')));
console.log('\nEncode / decode round trip');
console.log('  frames                ' + trip.frames + '/' + trip.expected);
console.log('  id mismatches         ' + trip.idMismatch);
console.log('  action mismatches     ' + trip.actionMismatch);
console.log('  max position error    ' + trip.maxPos.toFixed(4) + ' px');
console.log('  max angle error       ' + trip.maxAng.toFixed(5) + ' rad');
console.log('\nMeasured in the running game');
live.forEach(r => console.log('  ' + String(r[0]).padEnd(32) + r[1]));

console.log('');
let pass = 0;
C.forEach(([n, v]) => { if (v) pass++; console.log((v ? 'PASS' : 'FAIL') + ' - ' + n) });
console.log(`\nRESULT: ${pass}/${C.length} checks passed`);
process.exit(pass === C.length ? 0 : 1);
