# Circle XI v77.8 – Hairstyle Authenticity

## Style tab UX
- Removed the Front / Side / Top manual preview controls.
- Removed the previous adaptive view block from the Style tab.
- Did **not** add the proposed Style Impact panel.
- Added an automatic multi-context hairstyle preview showing Classic Media, Match, Training and Replay representations together.
- Hairstyle cards now expose compact texture and motion tags alongside match readability.

## Upgraded hairstyles

### Afro
- Fuller, more natural rounded volume.
- Irregular curl-cluster perimeter instead of a smooth helmet-like blob.
- Dense curl texture in Classic Media and profile/replay contexts.
- Simplified but recognisable rounded top-down footprint in Match and Training.
- Subtle bounce only; the base remains anchored to the skull.

### Waves
- Rebuilt as a close-cut hairstyle rather than a generic Fade variant.
- Low volume and strong skull conformity.
- Multiple curved ripple/wave bands across the crown.
- Cleaner side fade and hairline behaviour.
- Distinct from Buzz Cut and Fade in both portrait and match renderers.

### Curls
- Replaced simple circular bumps with layered curl clusters.
- Added visible curl loops/rings in close-up rendering.
- More irregular crown shape and medium-volume top-down silhouette.
- Subtle bounce during animated contexts.

### Long Hair
- Rebuilt from multiple layered rear/side strands.
- Directional strand highlights and darker depth layers.
- Hair hangs and flows rather than expanding as one solid shape.
- Match/Training footprint shows rear length clearly.
- Movement affects loose sections while the scalp remains fixed.

### Pony Tail
- Rebuilt as pulled-back scalp hair + tie point + multi-strand tail.
- Tail is rendered behind the head and tapers naturally.
- Individual tail strands move together during running/animated contexts.
- Close-up renderer shows pulled-back strand direction toward the tie.
- Match renderer preserves a recognisable rear-tail silhouette.

## Shared visual identity
The upgraded render functions are the same functions consumed by the Classic Media renderer, Match player renderer, Training player renderer, Profile/media scenes and replay/close-up contexts. A hairstyle change therefore updates all appropriate player representations from one visual identity value.

## Version
- `game.js?v=77.8.0`
- `styles.css?v=77.8.0`
- Visual identity runtime tag: `v77.8-hairstyle-authenticity`
