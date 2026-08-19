const fs = require('fs');
const path = require('path');

const root = __dirname;
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const checks = [];
const check = (name, pass) => {
  checks.push({ name, pass: !!pass });
  if (!pass) throw new Error(`Validation failed: ${name}`);
};

const requiredStates = [
  'STADIUM_ESTABLISH', 'FORMATION_REVEAL', 'USER_SPOTLIGHT',
  'TUNNEL_READY', 'TEAM_WALKOUT', 'TEAM_LINEUP', 'HANDSHAKES',
  'MOVE_TO_POSITIONS', 'READY_FOR_KICKOFF'
];
requiredStates.forEach(state => check(`state ${state}`, source.includes(`id:'${state}'`)));

const formations = [
  '4-3-3', '4-2-3-1', '4-4-2', '4-1-4-1', '4-3-2-1',
  '4-1-2-1-2', '3-4-3', '3-5-2', '5-4-1', '5-3-2', '5-2-3'
];
const libraryStart = source.indexOf('this.formationLibrary={');
const libraryEnd = source.indexOf('\n      };', libraryStart);
const library = source.slice(libraryStart, libraryEnd);
formations.forEach(name => {
  const start = library.indexOf(`'${name}':[`);
  const end = library.indexOf('\n        ]', start);
  const slots = start >= 0 && end > start ? (library.slice(start, end).match(/\{pos:/g) || []).length : 0;
  check(`${name} has eleven shared slots`, slots === 11);
});

check('normalised and kickoff coordinates share formation slots', source.includes('nx:slot.x/this.W') && source.includes('kickoffX:slot.x'));
check('presentation reads match formation arrays', source.includes('shape=this.formationsByTeam?.[team]'));
check('presentation maps actual players by formation slot', source.includes('players.find(p=>p.formationSlot===slot.slotIndex)'));
check('created player role uses match formation role', source.includes("position=u?.formationRole||u?.position"));
check('created player receives YOU highlight', source.includes("ctx.fillText('YOU'"));
check('walkout reuses active match players', source.includes("const active=this.players.filter(p=>!p.sentOff&&p.onPitch!==false&&!p.substituted)"));
check('referee and assistants have procession paths', source.includes('officialPaths') && source.includes('c.officialPaths.get(o)'));
check('referee carries visible match ball', source.includes('drawPreMatchBall(ctx)') && source.includes('const carrier=c.officials?.[0]'));
check('visible movement is speed limited', source.includes('const step=Math.min(d,speed*dt)'));
check('walkout uses waypoint paths', source.includes('followPreMatchPath(actor,path'));
check('jog to tactical home positions', source.includes("{x:p.homeX,y:p.homeY},dt,225,'jog'"));
check('handshake animation pose exists', source.includes("action === 'handshake'") && source.includes('if(isHandshake)'));
check('handshakes use paired home and away players', source.includes('const handshakePairs=[]') && source.includes('home,away,contact:'));
check('each pair shares an exact contact point', source.includes("contact:{x:this.W/2,y:(homeLine.y+awayLine.y)/2}"));
check('handshake wave is staggered by pair', source.includes('delay:i*.145'));
check('handshake has reach contact shake release and move-on phases', ['reaching','contacting','shaking','releasing','movingOn'].every(token => source.includes(token)));
check('handshake motion uses eased reach and release', source.includes('pose=easeInOut((t-.20)/.18)') && source.includes('1-easeInOut((t-.72)/.14)'));
check('paired actors face and look at one another', source.includes('look=Math.atan2(partner.y-p.y,partner.x-p.x)'));
check('handshake adds weight shift head nod and wrist pose', source.includes('handshakeLean') && source.includes('handshakeNod') && source.includes("ctx.rotate((p.handshakeSide||1)*.12"));
check('handshake pose data is removed during cleanup', source.includes('delete p.handshakePose') && source.includes('delete p.handshakePhase'));
check('presentation input is intercepted', source.includes("if(this.matchCeremony.type==='preMatch')"));
check('first skip advances a stage', source.includes('c.lastSkipAt=now;this.advancePreMatchState()'));
check('second skip performs complete cleanup', source.includes('now-(c.lastSkipAt||-999)<900') && source.includes('this.finishPreMatchPresentation(true)'));
check('controls are marked locked during presentation', source.includes("matchScreen.dataset.matchControls='locked'"));
check('controls are enabled only during finish cleanup', source.includes("matchScreen.dataset.matchControls='enabled'"));
check('kickoff setup follows presentation cleanup', source.includes('this.setupKickoff(this.firstHalfKickoffTeam)'));
check('full, short, and off settings are present', html.includes('id="matchPresentationSetting"') && html.includes('value="Short"') && html.includes('value="Off"'));
check('full presentation is the default', source.includes("matchPresentation: 'Full'"));
check('gameplay HUD is hidden during presentation', css.includes('.match-screen.pre-match-active .match-hud'));
check('demo capture route is included for visual regression', source.includes("demoMode === 'pre-match-presentation'"));
check('broadcast formation card replaces the legacy renderer', source.includes('drawPreMatchFormationCardLegacy') && source.includes('drawPreMatchFormationCard(ctx,team,x,y,w,h,revealProgress)'));
check('formation preview uses responsive wide and stacked layouts', source.includes('const wide=w>=900') && source.includes('awayY=wide?80:homeY+cardH+gap'));
check('home and away formations reveal sequentially', source.includes("homeReveal=clamp((c.stateAge-.15)/2.55") && source.includes("awayReveal=clamp((c.stateAge-1.45)/2.65"));
check('players reveal by goalkeeper defence midfield and attack units', source.includes("const rank=pos=>pos==='GK'") && source.includes('unit*.16'));
check('player markers show shirt numbers surnames and roles', source.includes('shirt=player?.shirtNumber') && source.includes("isUser?'YOU':slot.pos"));
check('created player marker has gold pulse and YOU label', source.includes("isUser?'#facc15'") && source.includes("isUser?'YOU'"));
check('captain and condition marker support is present', source.includes('player?.isCaptain||player?.captain') && source.includes('player?.injury||player?.injured'));
check('club header shows crest kits home away formation and manager', source.includes("team===0?'HOME':'AWAY'") && source.includes('tactical.manager') && source.includes("ctx.fillStyle=secondary"));
check('pitch has mowing stripes glow direction and full markings', source.includes('for(let stripe=0;stripe<8;stripe++') && source.includes("ctx.fillText('ATTACK'"));
check('tactical identity uses actual match profiles', source.includes('this.teamTactics?.[team]') && source.includes('tactical.press') && source.includes('tactical.tempo'));
check('formation matchup insights derive from actual slot roles', source.includes('preMatchMatchupInsights()') && source.includes('this.formationsByTeam?.[team]'));
check('created-player spotlight uses the real rendered model', source.includes('drawPreMatchUserSpotlight') && source.includes('drawVisibleFootballer(ctx,{...u'));
check('player spotlight shows foot natural role and manager instruction', source.includes("`${String(foot).toUpperCase()} FOOT`") && source.includes("NATURAL ${natural}") && source.includes('MANAGER INSTRUCTION'));
check('labelled macro-stage progress replaces anonymous dots', source.includes("label:'MATCHDAY'") && source.includes("label:'FORMATIONS'") && source.includes("label:'KICKOFF'"));
check('formation cards slide outward into the next presentation phase', source.includes('exit*120') && source.includes('c.stateDuration-.72'));

const result = { version: '49.2', passed: checks.length, failed: checks.filter(item => !item.pass).length, checks };
console.log(JSON.stringify(result, null, 2));
