# Circle XI Material Icon Upgrade v77.17.0

The uploaded Material Design Icons 4.0.0 pack has been integrated directly into the game.

## What changed
- Added the local `MaterialIconsSharp-Regular.otf` font from the supplied icon ZIP.
- Added a game-wide icon replacement layer for existing emoji, symbol and glyph-based UI icons.
- Added dynamic icon upgrading through a MutationObserver, so icons generated later by career, training, match, replay and results screens are upgraded too.
- Replaces applicable inline SVG UI icons with matching Material Design icons at runtime.
- Keeps charts, performance graphs and crest geometry as SVG because those are diagrams/branding shapes rather than UI icons.
- Club crest marks that previously used emoji now use the closest appropriate Material icon when rendered in game crests.
- Replaced CSS pseudo-element status/check icons with Material Design equivalents.
- Preserved Russo One as the text font; Material Icons Sharp is isolated only to icon elements.

## Examples of semantic replacements
- Football -> `sports_soccer`
- Settings -> `settings`
- Save -> `save`
- Profile -> `person`
- World/country -> `public`
- Training -> `fitness_center`
- Trophy/honours -> `emoji_events`
- Calendar -> `event`
- Inbox -> `inbox`
- Audio -> `volume_up` / `music_note`
- Replay -> `replay`
- Pause/play -> `pause` / `play_arrow`
- Shooting/targets -> `gps_fixed`
- Defending -> `security`
- Stamina -> `battery_full`
- Injury/medical -> `healing` / `local_hospital`
