# Circle XI v77.4 — Immersion & Training UX

## Scope
This update builds on v77.3 Physical Identity. It improves match immersion and fixes the Training tab so its full content can be reached vertically.

Two requested exclusions are intentional:
- No new teammate communication / speech callout system was added.
- No new match commentary text system was added.

## Training tab
- The Training career panel now scrolls vertically instead of clipping lower content.
- Training content is allowed to grow beyond the viewport; horizontal page spill is suppressed.
- Added a sticky Training status bar showing weekly sessions remaining, Energy and Sharpness.
- Added quick navigation to Ground, Technical, Tactical, Physical, Set Pieces, Recovery and Development.
- Training navigation stays accessible on desktop and adapts for smaller screens.
- Added a dedicated styled scrollbar.
- The tab remembers its scroll position when the Training centre re-renders or the player returns from a drill.
- Existing coach recommendation, session availability, fatigue, sharpness and training-ground systems remain intact.

## Match immersion director
- Added live momentum tracking based on recent events, shots and match flow.
- Added score/time-aware team states: Balanced, Pressure, Chase and Protect.
- AI movement responds to those states, with more advanced runs when chasing/pressing and more recovery positioning when protecting a lead.
- Crowd energy now responds to importance, momentum, dangerous territory and close late-game situations.
- Added contextual receiving states for open-body, half-turn, protected touch and aerial control situations.
- Added local pressure awareness and offside-risk awareness using the existing offside engine.
- Added stoppage match-stat presentation for possession, shots and momentum.
- Added a cleaner dynamic HUD that fades back during uncomplicated open play.
- Added immediate rating-delta feedback when meaningful match-rating changes occur.
- Added restrained camera emphasis after shots/goals.
- Existing weather mechanics now receive visible rain/snow particle reinforcement.
- Added frustration/hands-on-head/keeper celebration reactions for key outcomes.
- Existing manager and bench models now receive stronger goal/concession reactions.
- Added a post-match dressing-room beat that reflects result and player rating.

## Existing systems retained and reinforced
The build keeps the existing match ceremony, physical-duel/body-profile system, ball deflections/rebounds, goalkeeper logic, fouls/advantage, substitutions, replays, weather, pitch scuffs/wear and player-career systems. V77.4 connects additional presentation/state feedback to them rather than replacing them.

## QA
`VALIDATION_V77_4.txt` contains the V77.4 static/regression checks. The current build passes 47/47 checks including JavaScript parsing, Training scroll rules, quick navigation, match-state systems, existing system preservation, and both requested exclusions.
