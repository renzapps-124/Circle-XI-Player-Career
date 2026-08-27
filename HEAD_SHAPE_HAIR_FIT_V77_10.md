# Circle XI v77.10 – Head Shape Hair Fit

Every hairstyle is now fitted to the skull that is actually drawn, so changing
**Head Shape** in Create Your Player reshapes the hair as well as the face.

## What was wrong

- Hair was sized from a `scale` constant chosen per call site. On the Style tab
  cards that constant produced a cap roughly 76% of the head's width, so every
  style sat as a narrow dome with bare skin showing at the temples.
- The adaptive fit added in v77.7 used its own skull table (`faceFitV777`) whose
  numbers did not match the silhouette `traceFaceSilhouetteV776` draws. Diamond,
  for example, was fitted 1.01 wide against a temple that is actually 0.95.
- Vertical fit was a damped multiplier applied about an arbitrary anchor, so the
  crown never landed on the head's crown — the Classic Media portrait rendered
  its hair as a mass floating above the skull.
- The hairstyle cards were only repainted on hair colour / skin tone / hair
  changes, so picking a new head shape left the previous head in the grid.

## What changed

- `V7710_SKULL` mirrors the silhouette table `traceFaceSilhouetteV776` draws
  with — one source of truth for how wide and tall the head really is.
- Call sites that know their head geometry pass `profile.headFit={cx,cy,rx,ry}`.
  The renderer then anchors the hair on the skull's widest point (the temple
  line) and scales it so the reference cap lands just above the true crown.
  Width therefore tracks `rx * temple`, which is what actually varies per shape:
  Square and Round get wider, boxier hair; Long and Diamond get narrower hair.
- The crown control of the scalp path follows the head shape's own crown
  roundness, so a square head gets a squarer hair crown.
- Per-style proportions are preserved, because each style is normalised against
  the same reference cap: High Fade stays narrow with exposed sides, Afro stays
  a full round mass, Taper keeps its fuller perimeter.
- Hairline choice now shifts the hair along the face and controls how far it
  wraps toward the temples (Receding pulls back, Widow's Peak sits lower).
- Head shape, jaw and hairline changes repaint the hairstyle cards.

Call sites without head geometry — the in-match and training player renderers —
keep their existing placement, so gameplay visuals are unchanged.

## Art fixes this exposed

Fitting the hair to the full skull made several latent art bugs visible; they
are fixed rather than hidden by an undersized cap:

- **Fade / Low Fade / High Fade / Taper**: the fade line was a full circle of
  radius ~22 whose bottom fell across the eyes. It is now a shallow transition
  curve at the sides, positioned per fade height.
- **Waves**: the ripple rows fanned out 14 units below the cap and striped the
  forehead. They are now nested arcs contained by the crown.
- **Locs / Braids / Long Hair**: the innermost strands hung from points inside
  the face and covered the cheeks. They now part at the temples and frame it.
- **Curly Top**: the part-transparent cap under the curl crown read as a light
  headband; it is now opaque hair.
- **Scalp path**: the front hairline dip used two absolute pixel constants tuned
  for portrait scale (h≈30) but reused at top-down match scale (h≈2.4), where
  they overshot the cap by 50%. Both are now a share of the cap height.
- **Top-down match view**: hair reached only a third of the way over the skull
  and the hairline detail was drawn at the back of the head. The cap now runs
  from the back of the skull forward to a proper forehead crescent.

## Full scalp coverage

Fitting a style's own art to the head still left bare skull at the temples and above
the ears, because no style's art was drawn against a real head outline. Every style
that is meant to cover the scalp now gets a base layer traced from the same
silhouette the face is drawn with, clipped to that style's hairline and side height
(`V7710_SIDE_COVER`). Because the base *is* the head path, it cannot leave a gap or
overhang at any head shape, and the style art then supplies all the texture, volume
and silhouette on top.

Shaved and Mohawk are excluded - both deliberately show scalp.

Follow-on art fixes:

- **Afro**: the mass hung ten units below its anchor, which put its lower curls over
  the eyebrows once fitted to the real head. It now ends at a hairline.
- **Fade family**: the fade transition curve dipped onto bare forehead. It now sits
  inside the hair, where the faded sides actually meet the longer top.
- **Mohawk**: the faint cap over the shaved sides left a hard line across the
  forehead; the crest now stands on its own.

## Beards

Facial hair had the same class of problem as the hair, plus a worse one: it was
authored against a face layout the renderer does not draw.

- It placed the moustache at `0.29 ry` and its mouth line at `0.37 ry`, while
  `drawFaceFeaturesV776` draws the mouth at `0.67 ry`. Every beard therefore sat a
  third of a face too high - the moustache landed on the nose bridge and the beard
  read as a mask up to the eyes.
- It was sized from `faceFitV777`, whose chin width comes from the **jaw style
  alone** and ignores head shape entirely. The silhouette takes its chin from the
  **head shape** (Oval .58 -> Square .88), so a square chin was bearded at .60.
- Its sideburn anchor was `temple * 0.91`, applied at cheek height where the face
  is much wider, leaving a bare strip down the side of every face.

Beards are now built from the real landmarks and **clipped to the same silhouette
the face is drawn with**, then filled from that silhouette path. Because the face
path is the source of truth, a beard cannot overhang a narrow face or leave bare
skin on a wide one, at any head shape or jaw:

- **Stubble** - low-alpha shadow over the jaw and chin.
- **Goatee** - chin patch wrapping the mouth, its width taken from the head
  shape's chin, so a square chin carries a wider goatee than a diamond one.
- **Short Beard** - tight to the skin, beard line starting low on the cheek.
- **Full Beard** - runs up to the sideburns and carries its own volume just
  outside the skin line (`inflate`), so it hangs slightly below the jaw.

Short Beard, Full Beard and Goatee also get a lip patch so the mouth reads through
the beard rather than being painted over.

## Removed hairstyles

**Pony Tail** is withdrawn as an option. It is gone from the hairstyle list, the
Style tab cards and the creator select. Careers saved with it are migrated to Long
Hair when their visual identity resolves, so no save renders a style that can no
longer be selected. The mapping is `window.__CXI_V7710.retiredHair`.

The creator now offers 17 hairstyles.

## Removed creator section

The **Animation Identity** block ("Movement and set-piece style") is removed from
the Style step of Create Your Player, along with its five controls: running style,
shooting style, goal celebration, free-kick stance and penalty run-up.

Removing the markup alone would have blocked the creator, so the code that depended
on those inputs went with it:

- The step 3 validation list required all five. With the inputs gone
  `creatorFieldValue` returned empty and the Style step could never pass.
- The Randomise button assigned straight into `#goalCelebration` without a guard,
  which would have thrown once the element was removed.
- The five ids are dropped from `V77_PRESET_IDS`, so saved presets no longer carry
  fields the creator cannot set.
- The now-unused `.v77-animation-identity` rule is dropped from the stylesheet.

The underlying values are **kept in the player model**, defaulting through
`V775_VISUAL_DEFAULTS` (Balanced run, Compact shot, Arms Out, Balanced stance,
Standard run-up). Match, training and media renderers that read them are unaffected,
generated players still vary them, and existing careers keep whatever they saved.

## Top bar reduced to a home link

The sticky header bar is gone. What remains is the Circle XI logo and name alone,
pinned top-left, and clicking it returns to the home screen from anywhere.

- The bar chrome is removed everywhere it was painted - two separate `.topbar`
  rules carried a background gradient, bottom border, shadow and backdrop blur.
- The career summary strip and the sound shortcut are removed from the header.
  Sound is still toggled in **Settings -> Match sounds**, which drives the same
  `settings.sound` value.
- `.topbar` keeps `position:fixed`, because every screen sizes to `100dvh` and
  pads 72-78px to clear it; making it flow inline would have re-laid-out every
  screen. It now takes `pointer-events:none` with `pointer-events:auto` on the
  brand, so the empty strip no longer intercepts clicks meant for the content
  beneath it.
- The brand already carried `data-nav="menu"`; its `aria-label` now names the
  destination, and it has a visible focus ring and hover state.

Three unguarded lookups would have thrown once the elements were gone -
`#topCareerSummary` (read on every screen change) and `#muteBtn` - and are guarded.

## Compatibility

Save fields are unchanged and every remaining hairstyle name is unchanged, so
existing careers pick up the fitted rendering automatically. Careers saved with
Pony Tail resolve to Long Hair.

## Version

- `game.js?v=77.10.0`
- `styles.css?v=77.10.0`
- Visual identity runtime tag: `v77.10-head-shape-hair-fit`
- Feature flag: `window.__CXI_V7710`
