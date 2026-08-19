const fs=require('fs');
const source=fs.readFileSync('game.js','utf8');
const checks=[
  ['close-control touch style',"touchStyle==='close'"],
  ['sprint touch style',"touchStyle==='sprint'"],
  ['cut touch style',"touchStyle==='cut'"],
  ['shield touch style',"p.shielding?'shield'"],
  ['receive touch style',"touchStyle==='receive'"],
  ['attribute-led control quality','p.attrs.dribbling||55'],
  ['first-touch attribute contributes','p.attrs.firstTouch||55'],
  ['pressure selects touch behavior','nearestPressure<42'],
  ['turn rate selects cut behavior','turnAmount>.32'],
  ['active foot follows gait','activeFoot=stride>=0?1:-1'],
  ['visual carry is owner scoped','existing.ownerId!==p.id'],
  ['visual carry uses speed-limited contact correction','maxStep=(96+speed*.28)*dt'],
  ['visual carry eases toward contacts','1-Math.exp(-dt*'],
  ['chest control variant',"return'chest-control'"],
  ['thigh control variant',"'thigh-control'"],
  ['sole trap variant',"return'sole-trap'"],
  ['outside turn variant',"return'outside-turn'"],
  ['running touch variant',"'running-touch'"],
  ['preferred/incoming foot selection','Math.abs(lateral)>.24'],
  ['first-touch visual snapshot','p.firstTouchVisual={variant,quality,pressure'],
  ['chest body pose',"firstTouchVariant.includes('chest')"],
  ['thigh leg pose',"firstTouchVariant.includes('thigh')"],
  ['sole-trap boot pose',"firstTouchVariant.includes('sole')"],
  ['outside-foot boot pose',"firstTouchVariant.includes('outside')"],
  ['running reception pose',"firstTouchVariant.includes('running')"],
  ['screen-correct aerial lift','controlledReception?z*.52'],
  ['touch-upgrade demo router','touch-upgrade-'],
  ['close-control demo mode',"mode==='close'"],
  ['sprint demo mode',"mode==='sprint'"],
  ['cut demo mode',"mode==='cut'"],
  ['ground reception demo','CUSHIONED FIRST TOUCH'],
  ['aerial reception demo',"mode==='aerial'"]
].map(([name,needle])=>({name,pass:source.includes(needle)}));
const result={version:'49.3',passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,checks};
console.log(JSON.stringify(result,null,2));
if(result.failed)process.exit(1);
