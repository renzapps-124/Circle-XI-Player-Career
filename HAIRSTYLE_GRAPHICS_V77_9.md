# Circle XI v77.9.1 – Hairstyle Graphics Overhaul

This update rebuilds the hairstyle graphics around distinct rendering families rather than reusing the same cap, circles, and vertical-line primitives.

## Rendering families
- Scalp close: Shaved, Buzz Cut, Waves
- Short texture: Short
- Fade family: Fade, Low Fade, High Fade, Taper
- Curl volume: Curly Top, Curls, Afro
- Scalp braids: Cornrows, Braids
- Rope styles: Twists, Locs
- Centre strip: Mohawk
- Flowing hair: Long Hair
- Tied hair: Pony Tail

## Improvements by style
- Short: lower micro-texture rather than long spikes.
- Fade: compact textured top with a clearly reduced side silhouette.
- Low Fade: fuller side shape with the fade transition kept low.
- High Fade: narrower top footprint and much more exposed sides.
- Taper: preserves more side hair and only tightens the perimeter.
- Shaved: skin-linked stubble texture with no solid helmet cap.
- Buzz Cut: even micro-stubble across the scalp.
- Waves: close haircut first, with lower-contrast 360 wave rows.
- Afro: unified rounded mass with micro-curl texture and irregular edge curls.
- Curly Top: compact top-only curl crown rather than a full round blob.
- Curls: coherent medium curl silhouette with overlapping micro-curls.
- Cornrows: rows run along the scalp from hairline toward the crown/rear.
- Braids: scalp roots remain visible and hanging braids sit mainly at the sides.
- Twists: short rope-like clumps sit around the crown instead of falling over the face.
- Locs: fewer, thicker rounded locs with varied lengths and a clearer central face area.
- Mohawk: rebuilt as a continuous textured centre strip, not a triangular horn.
- Pony Tail: pulled-back crown, central tie logic, and tapered dynamic tail.
- Long Hair: broad layered side/rear masses with internal strand texture and clearer face framing.

## Style tab
All 18 hairstyle cards now use the real portrait renderer for their thumbnails. The same renderer family feeds the Classic Media player, while the simplified companion renderer feeds Match and Training.

## Compatibility
The hairstyle names and save fields are unchanged, so existing saves automatically use the improved graphics.
