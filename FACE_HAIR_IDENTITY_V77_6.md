# Circle XI v77.6 — Face & Hair Identity

## Goal
Make the player's face recognisable in close-up contexts and make hair the strongest recognition feature at match distance, while retaining the universal Visual Identity system introduced in v77.5.

## Facial identity
- Head Shape now changes the outer skull/face silhouette in the match player and Classic Media player.
- Jaw selection changes the lower-face width and shape instead of acting as metadata only.
- Eye style changes spacing and shape in close-up rendering.
- Eyebrows now have distinct Natural, Thick, Fine and Arched profiles.
- Nose styles alter width/length in the Classic Media face renderer.
- Facial hair has separate Stubble, Goatee, Short Beard and Full Beard rendering.
- Complexion remains subtle in gameplay and becomes more visible in close-up media contexts.
- Added Hairline choices: Straight, Rounded, Sharp, Widow's Peak, Curved and Receding.

## Hair identity
All 18 creator hairstyles now have a distinct recognition profile:
- Short
- Fade
- Afro
- Braids
- Shaved
- Curly Top
- Cornrows
- Twists
- Mohawk
- Locs
- Low Fade
- High Fade
- Taper
- Waves
- Buzz Cut
- Curls
- Pony Tail
- Long Hair

Low Fade, High Fade, Taper, Waves, Buzz Cut, Curls, Pony Tail and Long Hair no longer fall back to another hairstyle renderer.

## Angle and motion behaviour
- Match hair can respond to front, side and back player orientation.
- Long styles use subtle movement during animated rendering.
- Braids, twists, locs, ponytails and long hair carry stronger movement values.
- Pony Tail was specifically corrected so its front-facing version sits behind the head/shoulder rather than crossing the face.

## Creator UX
- Added a live Face & Hair preview to the Face Studio.
- The preview immediately redraws Head Shape, Jaw, Nose, Eyes, Eyebrows, Hairline, Facial Hair, Complexion, Hairstyle, Hair Colour and Skin Tone.
- It explains `Media Face/Hair Impact` and `Match Readability`.
- Hairstyle cards now show a five-dot match-readability rating.
- Smart/Full Randomise can generate the expanded facial structure and hairline fields.

## Universal continuity
The same saved identity continues to feed:
- Create-a-Pro preview
- Classic Media player
- Career/profile media
- Match player renderer
- Training player renderer through the v77.5 universal identity layer
- Stable generated AI player appearance

Hairline is included in the visual-identity fingerprint and older saves receive the Rounded default during migration when no hairline was previously stored.

## Rendering philosophy
- **Close-up:** prioritise Head Shape, Jaw, Eyes, Brows, Nose, Facial Hair and Hairstyle.
- **Match distance:** prioritise Hairstyle silhouette, Hair Colour, Skin Tone, Body Build and accessories.
- Facial choices do not change football attributes.
- Hairstyle readability is visual information only and does not provide a gameplay bonus.

## QA
`VALIDATION_V77_6.txt` contains the final validation run. The build passed 38/38 checks, including runtime rendering comparisons confirming that sampled hairstyles, head/jaw combinations and facial-hair selections produce visibly different Classic Media output.
