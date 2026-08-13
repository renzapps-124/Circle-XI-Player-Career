# Kick Animation Improvements

Visual-only upgrade to the procedural top-down kick system. Gameplay timing, power, accuracy and physics are unchanged.

## Changes

### Phase curves
- Backswing now builds more progressively then holds shape into the strike window
- Strike phase has a sharper peak with a brief impact snap at contact
- Follow-through uses a longer, softer deceleration so the leg does not snap back

### Pose amplification
- Reach, backswing and plant values increased on power, driven, finesse, cross, corner, free-kick and goal-kick profiles for clearer readability at match camera distances
- Plant foot loads earlier and stays grounded longer for a more stable base
- Impact extension adds a short extra leg drive exactly at the contact frame

### Body and arms
- Stronger body coil: players lean back into the wind-up then drive through the ball
- Arm counter-balance is more dynamic (balance arm rises higher on the backswing; kicking-side arm tucks then drives)

### Distinct techniques
- Volleys, half-volleys and bicycle kicks have higher leg lift and clearer airborne shapes
- Chip / scoop variants show a more pronounced under-ball lift and plant shift
- Outside-foot, rabona, toe-poke, stretch and falling shots use more exaggerated dedicated poses
- Finesse and curled deliveries open the body and ankle more noticeably

### Timing
- Power, driven, goal-kick and free-kick contact windows start slightly later so the backswing is visible longer
- Moving kicks retain a little more of the run cycle so first-time and running strikes feel continuous

These changes make every major kick type easier to read while keeping the fluid locomotion blend from the existing animation layer.

## Finesse curve direction fix (follow-up)

Finesse shots previously bent the wrong way relative to the open-body aim and preferred foot.

- Player path: inverted `bendDirection` and the matching launch offset so the ball still starts slightly against the bend (outward flight → curl back into the target = classic C-shape).
- AI path: same sign correction on `curveDirection`.
- Coordinate system is y-down; the Magnus force sign is now consistent with that for finesse curl.

Power, contact timing and animation profiles are unchanged by this fix.

## Knuckleball late-dip staging

Knuckle shots now use the existing `curveProfile` (kind: `'knuckle'`) in the ball flight solver:

- **Early flight** (~0–42% of duration): dip multiplier stays low (~0.22→0.55) so the ball holds a flatter trajectory
- **Mid flight** (~42–72%): dip ramps up (~0.55→1.15)
- **Late flight** (~72–100%): dip peaks (~1.15→1.55) with the profile `lateDip` factor — the classic “falls off a table” drop
- Residual side-curve is forced to **0** on knuckle strikes (player and AI) so the ball reads as near-zero spin
- Trail points are tagged `kind: 'knuckle'` for distinct rendering if needed

Finesse curve staging is unchanged. Animation profiles and selection rules are unchanged.

## Realistic match sounds

### Goal — crowd eruption (`crowdGoal`)
Replaced the thin single noise+tone with a layered stadium roar:
- Deep low-pass rumble (stadium bed)
- Mid band-pass mass cheer (crowd voices)
- High “whoa”/yell layer
- Rising sawtooth/triangle cheer tones
- Sustained cheer tail after the peak

Home goals are slightly louder than away goals (existing intensity scaling kept).

### Woodwork — post / crossbar (`woodwork`)
Replaced pure sine “beeps” with a percussive impact:
- Sharp high-pass crack
- Wooden body thud (band-pass noise)
- Metallic sheen
- Short triangular fundamental + sine ring + low resonance

Crossbar uses higher frequencies than the post. The old competing `beep()` call on woodwork was removed so the new impact is clear.

### Net (`net`)
Slightly richer mesh snap + soft billow so goal strikes sit better under the crowd roar.

## Advanced procedural audio

Upgraded the Web Audio synthesis stack (still sample-free):

### Noise colours
- White, **pink**, and **brown** noise buffers
- Filter cutoffs can **move** during a burst (bright crack → darker body)

### Shared bus
- `DynamicsCompressor` on a master bus so layered goal/impact sounds glue and don’t clip

### Modal woodwork
- Post/crossbar use **modal synthesis** (inharmonic partials with independent decays) plus a short noise transient

### Kicks / net / grass / whistle
- Velocity-style brightness via moving filters
- Punch envelopes (brief attack overshoot)
- Whistle has a short noise “breath” onset
- Per-play randomisation (±freq/volume) to avoid identical repeats

### Reactive crowd
- Multi-band continuous ambience (brown low / pink mid / pink high)
- Goal one-shots call `swellCrowdAmbience` for a second-wave roar
- `crowdReaction` drives **spectral tilt** (high energy early, settles into mid/low)

All sounds still respect `settings.sound` and the existing `playMatchSound` API.

## Goal net animation & physics

Upgraded the spring-mass goal nets:

### Physics
- Mesh resolution **12×25** (was 9×19) for finer folds
- Deeper goal bag (44 units depth)
- **Structural + shear springs** (diagonal links) for cloth-like deformation
- Soft interior anchor so the bag can billow; stiffer edges
- Gravity hang bias on deeper rows
- Lower interior damping so **ripples travel** across the mesh
- Impact uses a **core bulge + secondary ring** impulse so energy radiates outward
- Mass per node (heavier at depth/edges) for more natural motion
- Longer active window after a goal (up to ~3.4s)

### Visuals
- Strand **line width and alpha** respond to local stretch
- Expanding **ripple rings** at the impact point
- Soft **highlight** on the stretched impact region
- Bag fill and ground shadow grow with deformation energy
- Front posts/support depth matched to the deeper bag

### Ball
- Nestles deeper on power shots; chips hang slightly higher
- Small random vertical settle + downward dip after contact

## Net collision sounds

Goal and side-net impacts now use layered, section-aware synthesis:

1. **Mesh snap** — bright high-pass transient  
2. **Strand rattle** — mid bandpass pink/white layers  
3. **Bag billow** — low brown body  
4. **Soft resonance** — low triangle/sine (not metallic)  
5. **Secondary settle** — delayed quiet rustle when the ball is in the bag  

Variants differ for **side net**, **roof**, **corner**, **lower**, and **standard** hits. External side-net misses stay thinner and skip the deep bag thump. Strength scales all layers.

## Net material acoustics

Goal net audio now follows soft mesh material behaviour:

1. **Velocity-tilted snap** — high-pass transient; cutoff rises with impact strength  
2. **Granular strand cascade** — `soundGrainCloud` of short pink/white grains (irregular multi-strand rattle)  
3. **Bag billow** — brown low-pass air displacement (skipped on external side-net)  
4. **Settle grains** — delayed quiet cloud after the main hit  
5. **Energy-driven micro-rustle** — sparse grain bursts while the spring mesh is still moving  

Section recipes differ for side / roof / corner / lower. Granular helper is shared for future texture use.

## Match rating: fouls won & dribbling

- **Foul won**: rating +0.09 (standard), +0.11 (serious), +0.14 (penalty). Feedback shown.
- **Beat a defender** (skill / close dribble): +0.10 (was +0.06).
- **Progressive carries**: +0.028 open, +0.045 under pressure (was +0.012 / +0.022); up to 12 rewards per spell.

## Role-weighted rating mistakes

### Missed shots (off target → goal kick)
Base **−0.08** (−0.05 header, −0.16 penalty), then × role:
- **AM / CAM**: ×1.55
- **Attacker** (ST/CF/RW/LW): ×1.45
- **Other midfielder**: ×1.10
- **Others**: ×1.00

Only counts clear off-target attempts (not saves/blocks on target). Tracks `shotsOffTarget`.

### Misplaced passes
Base **−0.055** (dangerous **−0.10**), then × role:
- **AM / CAM**: ×1.55
- **Midfielder** (CM/DM/…): ×1.40
- **Attacker**: ×1.05
- **Others**: ×1.00

Feedback labels include “(AM)” / “(mid)” when relevant.

## Immersion: set-piece theatre, fatigue, injury continuity

### Set-piece theatre
- Crowd **hushes** during free-kick / penalty / corner setup (ambience bands lowered)
- **Wall fidgeting** — small live shifts while waiting
- **GK ready sway** on the line, facing the ball
- On strike: **crowd swell** + partial roar (`triggerSetPieceStrikeAtmosphere`)

### Fatigue body language
- Stronger tired **stride shortening** and **slower cadence**
- More **forward lean** when exhausted
- **Slower turning** as stamina drops
- Larger accuracy penalty from low energy (pass/shot)
- AI outfield speed falls off harder when tired

### Injury continuity (doubt)
- On recovery, `career.injuryDoubt` lasts ~2 training sessions / matches
- Training **gains reduced** (~45–75% depending on severity)
- Training **injury risk raised** while doubt is active
- Caution banner on the training screen
- Clears after sessions (message: “Full confidence restored”)

## Corner crowd noise

Corners no longer use the free-kick hush. Instead:

- **Setup**: ambience rises (anticipation); short crowd swell when the corner is awarded/set
- **Waiting**: rolling murmur with light peaks every ~1.15s
- **Delivery**: stronger swell + fuller crowd layer on the cross than other set pieces

## Custom celebration animations

User-controlled goal poses now have distinct body / arm / leg motion:

| Key | Variant | Motion |
|-----|---------|--------|
| **J** | armsUp | Full raise + light hop pulse |
| **K** | kneeSlide | Drop onto knees, arms wide, feet trail |
| **L** | slide | Side-on full slide, trail/lead legs |
| **U** | jump | Vertical hop |
| **I** | shirtPull | Hands to chest/badge |
| **O** | fistPump | One arm punch skyward |

Body transforms, arm endpoints, and leg joints are variant-specific for readability in top-down view.

## Celebration pack (selected upgrades)

1. **Combo poses** — queue next pose while one plays (`COMBO…` cue)
2. **Hold J** — tap arms-up, hold for charged jump
3. **Directional slides** — K/L face current velocity
4. **F high-five** — nearest teammate joins arms-up
5. **Flag plant** — run to a corner flag for plant + crowd swell
8. **Name + score sting** — event banner with scorer and scoreline
9. **Confetti / turf** — on slides, jumps, flag plant
10. **Camera flashes** — stand flashes on big moments
12. **Rivalry shush** — ear-cup near opposition end when rivalry flagged
13. **First career goal** — longer window + special banner
14. **Hat-trick** — longer window; **H** ball-raise
15. **Home/away roar** — stronger home swell, quieter away
17. **Keeper reactions** — conceding GK frustration; scoring GK joins last-minute winners
18. **Bench spill** — stronger bench reaction on winner/equaliser
20. **Skip quality** — tap Space soft end, hold for instant skip (progress bar)

## Set-piece animation: wall jump & corner jostle

### Wall jump (free kicks)
- Wall players crouch slightly in ready/whistle phase
- On strike: staggered collective **jump** pose (`celebrationVariant: jump`)

### Corner box crowd
- Attackers drift and weave toward corner run targets while waiting
- Markers track their man with offset jostle
- Soft separation when rivals get too close
- On delivery: attackers dart toward attack points

## Animation pack: slides, intercepts, GK saves

### 30 — Slide length
- Duration, reach, delay, and commit impulse scale with **stamina** and **relative speed**
- Longer slides throw more turf; body lean scales with `slideLen`

### 34 — Interception stretch
- User interceptions trigger a short **lunging tackle/stretch** pose toward the ball

### 38 — Dive arcs by height
- High saves: taller arc, more extension
- Low saves: flatter arc, collapsed hips/knees
- Mid: default curve

### 39 — Parry vs hold
- **Parry**: hands push/tip outward
- **Hold/catch**: hands gather toward chest

### 41 — Recovery scramble
- After sprawling dives/smothers, GK **scrambles up** (stumble + small movement) or settles to ready
