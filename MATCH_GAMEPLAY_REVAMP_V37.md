# Match Gameplay Revamp V37

V37 brings the match engine closer to the mechanics used in training and makes fouls, aerial play, set pieces and defending easier to read.

## Match flow
- Fouls now pass through reaction, referee-decision and regroup stages before restart setup.
- Restart players are given time to settle rather than immediately snapping to the free-kick state.

## Shared 3D ball physics
- Lifted passes, chipped shots, crosses, corners and free kicks use X/Y/Z velocity with shared gravity.
- Ball height, launch power, spin, drag, bounce and ground resistance are stored on the match ball.
- Button-hold power uses a capped curve so longer holds add meaningful pace/height without unlimited velocity.
- Ground and aerial receiving continue to use the physical ball position rather than a fake fixed arc.

## Crossing and directional animation
- Crossing uses a stronger plant step, hip/shoulder rotation, backswing, boot-contact and follow-through profile.
- Player facing follows movement direction for user and AI.
- Major left/right reversals briefly use a turn/plant transition instead of an instantaneous visual flip.

## Throw-ins
- AI throw-in receivers receive a longer protected decision window and are encouraged to play back inside.
- Safe targets are biased farther infield to reduce immediate repeat throw-ins.

## Corners and free kicks
- Match free kicks use Free Kick Training-derived Curl, Topspin Dip, Knuckle, Low Driven and Normal flight profiles.
- Match corners use Corner Training-derived Inswing, Outswing, Driven, Floated and Near-Post Whip profiles.
- AI corners are deliveries into attacking areas, not deliberate shots from the flag.
- Aerial defenders use the existing landing/duel logic to attack or clear the cross.
- Free-kick walls use hands-down/protective poses.

## Defending controls
- I: Pressure / controlled close-down.
- J: Call nearest suitable teammate to pressure. V37 locks the command to that selected teammate for the press window.
- K: Contextual block with foot, knee, shot-block or body-block animation depending on ball height/speed.
- L: Slide tackle with committed contact and recovery behaviour.

## Physios
- Match physios retain the shared modern footballer body/model renderer with dedicated medical colours, badge/accessories and medical staff behaviour.
