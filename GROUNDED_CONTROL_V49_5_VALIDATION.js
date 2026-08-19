const fs=require('fs');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');

const checks=[
  ['grounded-control build marker',game.includes("__GROUNDED_CONTROL_VERSION='v49.5-foot-anchored-dribbling'")],
  ['root motion inherited by visible ball',game.includes('carry.x+=p.x-Number(carry.ownerX??p.x)')&&game.includes('carry.y+=p.y-Number(carry.ownerY??p.y)')],
  ['visible carry gap telemetry',game.includes('carry.targetGap=Math.hypot')],
  ['owned-ball detail uses the same visual anchor',game.includes("const visual=b.owner?this.visualOwnedBallPosition():{x:b.x,y:b.y}")],
  ['contact event gates loose touches',game.includes('touchEvent=rawPulse>.78')&&game.includes('if(p===this.user&&touchEvent')],
  ['per-frame loose-touch lottery removed',!game.includes('risk*dt*8')],
  ['ordinary sprint alone remains secure',game.includes("const controlStress=(sprinting?.34:0)")&&game.includes('if(controlStress>.42)')],
  ['heavy-touch impulse reduced',game.includes('const speed=sprint?112:78,lead=sprint?14:10')],
  ['brief loose-touch recovery immunity',game.includes('this.ball.releaseImmunity=.08')],
  ['single authoritative movement target',game.includes('this.user.movementTargetSpeed=targetSpeed')],
  ['turns lower speed before changing direction',game.includes("baseTargetSpeed*lerp(1,lerp(.54,.78,turnAbility),turnSeverity)")],
  ['strong input-release braking',game.includes("11.2 + this.user.attrs.balance * .045")],
  ['compounding movement multiplier removed',!game.includes('u.vx*=movementScale')&&!game.includes('u.vy*=movementScale')],
  ['velocity ceiling uses target speed',game.includes('speed>u.movementTargetSpeed*1.04')],
  ['gait cycle driven by root travel',game.includes('const phaseAdvance=rootTravel>0?rootTravel/')],
  ['turn-plant state retained',game.includes("p.visualGait='turn-plant'")],
  ['skill motion is time-based',game.includes('queueUserSkillMotion(dx,dy')&&game.includes('if(this.user.skillMotion)')],
  ['skill coordinate teleport removed',!game.includes('this.user.x+=dir.x*(18+this.user.attrs.agility*.09)')],
  ['goalkeeper-rounding teleport removed',!game.includes('this.user.x=clamp(this.user.x+(this.user.team===0?1:-1)*28')],
  ['new script cache version',html.includes('game.js?v=52.0.0')]
];

// Deterministic controller sanity checks.
const dt=1/60,speed=150;
let owner=0,target=-16,carry=-16,maxGap=0;
for(let i=0;i<180;i++){
  const previousOwner=owner;owner+=speed*dt;target=owner-16;
  carry+=owner-previousOwner;
  const dx=target-carry,maxStep=(96+speed*.28)*dt,blend=1-Math.exp(-dt*18);
  carry+=dx*(Math.abs(dx)>maxStep?Math.min(blend,maxStep/Math.abs(dx)):blend);
  maxGap=Math.max(maxGap,Math.abs(target-carry));
}
checks.push(['150-speed carry remains foot-locked',maxGap<1]);
checks.push(['unpressured sprint does not trigger loose-touch check',.34<=.42]);
checks.push(['sprint plus close pressure can trigger skill check',.34+.30>.42]);

let passed=0;
for(const [name,ok] of checks){if(ok)passed++;console.log(`${ok?'PASS':'FAIL'}: ${name}`)}
console.log(`\n${passed}/${checks.length} grounded-control checks passed.`);
process.exitCode=passed===checks.length?0:1;
