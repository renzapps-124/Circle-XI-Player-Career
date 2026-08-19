const fs=require('fs');
const path=require('path');
const root=__dirname;
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
  ['v52 runtime marker',game.includes("v52.0-intelligent-aerial-circuit")],
  ['v52 cache busting',html.includes('styles.css?v=52.0.0')&&html.includes('game.js?v=52.0.0')],
  ['profile exposes intelligent aerial identity',game.includes("identity:'INTELLIGENT AERIAL CIRCUIT'")],
  ['state rail contains teammate escape',game.includes("'TEAMMATE_ESCAPE'")],
  ['state rail contains attack cross',game.includes("'ATTACK_CROSS'")],
  ['space scan evaluates multiple candidates',game.includes('function tacticalAllRoundSpaceScan')&&game.includes('offsets=[[0,-4]')],
  ['space scan scores pressure',game.includes('pressure*2.25')],
  ['space scan scores passing-lane clearance',game.includes('lane*1.65')],
  ['teammate always enters escape phase',game.includes("mode:'escape'")&&game.includes("tacticalSetState(s,'TEAMMATE_ESCAPE'")],
  ['teammate shields during escape',game.includes('t.teammateShielding=true')&&game.includes('protectedCarrier=t.teammateShielding')],
  ['teammate has second escape movement',game.includes("'SECOND MOVEMENT · DEFENDER COMMITTED'")],
  ['escape phase has a hard deadline',game.includes('releaseDeadline:now+2400')],
  ['lane is reassessed after movement',game.includes('function tacticalResolveAllRoundReturn')&&game.includes("plan.mode=blocked?'lifted':'ground'")],
  ['blocked floor selects lifted return',game.includes("blocked?'LIFTED PASS AFTER ESCAPE'")],
  ['clear floor selects grounded return',game.includes("'GROUND PASS · LANE CREATED'")],
  ['defenders use press-cover balance',game.includes("stage.dataset.defensiveShape=finishing?'staggered-opening':escape?'press-cover-balance'")],
  ['finishing shape deliberately staggers',game.includes('const user=s.player,carrier=')&&game.includes('finishing=[')],
  ['defenders retain live movement',game.includes("stage.dataset.defendersMoving='true'")],
  ['defender tackle reach is controlled',game.includes('distance<2.25')&&game.includes(',.08,.34)')],
  ['attacking interception radius is reduced',game.includes('fairAttackingLane')&&game.includes('baseRadius*.72')],
  ['lifted return opens aerial window',game.includes('t.aerialFinishWindow=true')],
  ['aerial controls can be queued',game.includes('function tacticalQueueAllRoundFinish')&&game.includes('ATTACK THE BALL')],
  ['J selects header',game.includes("{j:'header',k:'volley',l:'auto'}")],
  ['K selects volley',game.includes("k:'volley'")],
  ['L selects contextual auto finish',game.includes("l:'auto'")],
  ['I lets the ball drop',game.includes("'CONTROL SELECTED · LET THE BALL DROP'")],
  ['aerial contact uses ball height',game.includes("requested==='auto'?(z>=3.8?'header':z>=1.55?'volley':'firstTime')")],
  ['header animation is used',game.includes("setTrainingVisualAction(technique==='firstTime'?'shot':technique)")],
  ['aerial quality uses player attributes',game.includes("(a.technique||55)*.36+(a.finishing||55)*.36")],
  ['header metric exists',game.includes('headers:0')&&game.includes("?'headers':")],
  ['volley metric exists',game.includes('volleys:0')&&game.includes("?'volleys':")],
  ['first-time metric exists',game.includes('firstTimeShots:0')],
  ['header awards 750 points',game.includes('header:750')],
  ['volley awards 850 points',game.includes('volley:850')],
  ['first-time finish awards 650 points',game.includes('firstTime:650')],
  ['perfect aerial contact awards 200',game.includes("tacticalScore(s,200,'PERFECT CONTACT'")],
  ['keeper dive begins after contact',game.includes('function tacticalBeginAllRoundKeeperDive')],
  ['keeper uses shot-side and height',game.includes('gk.gkDiveSide=side')&&game.includes('gk.gkDiveHeight=height')],
  ['keeper has reaction step',game.includes('d.age<d.reaction')&&game.includes("gk.action='setPieceReady'")],
  ['keeper moves through a dive arc',game.includes('function tacticalUpdateAllRoundKeeper')&&game.includes('Math.sin(p*Math.PI)*.38')],
  ['clean aerial finish beats keeper reach',game.includes('b.forcedKeeperMiss=quality>=.42')&&game.includes('saveChance=b.forcedKeeperMiss?0:')],
  ['goal copy names aerial technique',game.includes("technique==='header'?'HEADER · GOAL'")&&game.includes("technique==='volley'?'VOLLEY · GOAL'")],
  ['overlay teaches aerial controls',game.includes("'J HEADER · K VOLLEY · L AUTO'")],
  ['control dock labels change contextually',game.includes("{j:['HEADER','Attack high ball'],k:['VOLLEY','Meet it in flight']")],
  ['v52 escape UI styling exists',css.includes('v52.0 · Intelligent escape movement')&&css.includes('all-round-space-scan')],
  ['v52 aerial UI styling exists',css.includes('all-round-attack-cross')&&css.includes('allRoundAerialReady')],
  ['v52 keeper UI styling exists',css.includes('all-round-keeper-dive')&&css.includes('KEEPER DIVING')],
  ['60-second master session preserved',game.includes('const TACTICAL_SESSION_DURATION=60')],
  ['A+ remains the maximum grade',game.includes("return score>=5500?'A+'")] 
];
let passed=0;
for(const [name,ok] of checks){if(ok){passed++;console.log(`PASS ${name}`)}else console.error(`FAIL ${name}`)}
console.log(`\nV52 All Round Circuit: ${passed}/${checks.length} checks passed`);
if(passed!==checks.length)process.exit(1);
