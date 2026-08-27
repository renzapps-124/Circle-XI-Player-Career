# Circle XI v77.5 — Universal Visual Identity

## Purpose
V77.5 makes the Create-a-Pro Appearance choices authoritative throughout the game instead of treating them as creator-only cosmetics. A single `visualIdentity` record is now resolved for the player and reused by Career Media, Match Day, Training and generated AI footballers.

## Authoritative appearance fields
The profile carries skin tone, hairstyle and colour, head shape, jaw, nose, eyes, eyebrows, facial hair, complexion, body build, height, weight, boot model and colours, shirt number, sleeves, shirt fit, sock height, wrist tape, match accessories, running style, shooting style, goal celebration, free-kick stance and penalty run-up.

## Career Media / profile rendering
The Classic Media renderer now consumes the same Visual Identity profile. Face proportions, hair, facial hair, complexion, shirt fit, sleeve treatment, sock height, wrist tape, gloves/ankle tape, boot model/accent and physical dimensions are rendered from the saved player. The Profile tab also exposes a Visual Identity card so the current saved style is visible outside matches.

## Match Day
Match actors receive the complete visual profile. The player model uses the saved face/hair identity, body profile, sleeve style, shirt fit, socks, tape, accessories and boots. The actual shirt number is visible on the player. Running style changes gait expression, while shooting style, free-kick stance and penalty run-up modify kick animation expression without replacing football attributes.

## Training
The career training player inherits the same appearance profile. Generated training team-mates use the same deterministic visual resolver as Match Day, so their appearance does not become a separate random training-only model.

## AI visual persistence
Generated players receive deterministic appearance fields from stable player identifiers. This keeps the same AI player visually recognisable across line-up changes and other contexts instead of rerolling their look each time they are rendered.

## In-career Style Locker
The Profile screen contains an Edit Career Appearance button. During a career the user can change hairstyle, hair colour, facial hair, boots, sleeves, shirt fit, sock height, tape, accessories, running/shooting style, celebrations and set-piece animation preferences. Core face structure and physical dimensions remain stable so the footballer remains recognisable.

## Save compatibility
Legacy careers are migrated through `ensureVisualIdentity()`. Existing skin/hair/build/boot aliases are read when present, while missing modern appearance fields receive safe defaults. Derived physical values are still calculated by the v77.3 Physical Identity system.

## Rendering API
`window.__circleVisualIdentity` exposes resolve/ensure/context/fingerprint helpers plus the shared media renderer. This lets future transfer, international, awards and replay presentation screens render the same person while changing only context-specific kit/presentation.

## QA
- Static validation: 42/42 checks passed.
- JavaScript syntax check passed.
- Runtime boot smoke test passed with no `CAUGHT IN GAME.JS` error.
- Runtime visual continuity test confirmed the same hairstyle, face shape, boot model and sock height reached Career Media, Match Day and Training canvases.
