# Circle XI v77.3 — Physical Identity

## Unified body profile
Body Build, Height and Weight now feed one shared physical profile used by Create-a-Pro, Classic Media, match-day player rendering, AI player generation, training player models and physical gameplay calculations.

### Supported builds
- Lean
- Slim
- Balanced
- Athletic
- Powerful
- Stocky

Legacy `Strong` saves migrate to `Powerful` automatically.

## Visual model effects
Height changes torso/leg/arm proportions instead of simply enlarging the entire model. Weight and build change shoulder width, waist, limbs and physical mass. The Classic Media player, match player and training models consume the same physical profile.

## Gameplay effects
The physical profile now contributes small, non-meta modifiers to:
- stride length and cadence
- turning response
- acceleration/deceleration response
- collision radius and collision mass
- momentum in contact
- shielding radius and contact stability
- standing reach and jumping/aerial reach
- goalkeeper dive/reach scaling
- dribble touch spacing
- stamina drain under movement load
- centre of gravity / balance expression

Football ratings remain the primary determinant of quality. Body type changes how a player expresses those ratings rather than providing large direct stat bonuses.

## AI and positional generation
Generated match and training players receive deterministic physical profiles with position-aware height ranges and build distributions, creating more recognisable silhouettes across squads.

## Creator feedback
The Role step now gives a live Physical Identity panel showing:
- comparison to the average height/weight for the chosen position
- Turning
- Shielding
- Contact
- Aerial Reach
- Centre of Gravity
- Stride
- Physical Presence

The body-build icons also react to height/weight selections.

## Career profile
The Profile tab now contains a Physical Profile card with the player's build, height, weight, centre of gravity, stride, physical presence and aerial reach.

## Save compatibility
Existing saves are migrated safely. Missing height/weight values are inferred from build and position, and derived physical values are regenerated instead of permanently storing stale calculations.

## Validation
`VALIDATION_V77_3.txt` records the current runtime checks. The v77.3 QA pass verifies creator impact, profile persistence, Classic Media propagation, physical calculations and startup/runtime stability.
