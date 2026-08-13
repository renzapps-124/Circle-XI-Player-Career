CIRCLE XI: PLAYER CAREER — ADVANCED MATCH ENGINE UPDATE

HOW TO PLAY
1. Extract the complete ZIP folder.
2. Keep index.html, game.js and styles.css together.
3. Double-click index.html in a modern browser.

MAIN CONTROLS
WASD — move and aim
J — pass / request pass
K — through ball / standing tackle
L — shoot / sliding tackle
I — cross / jockey
M — hold to return to position
Shift — sprint or action modifier
Space — shield or jockey
Q — call for ball, pressure or shoulder challenge
B — toggle match engine debug overlay
T — cycle compact, detailed and evaluation debug views
V — toggle the live space-control map
R — replay the latest recorded match phase
N — run a fresh automatic match-balance audit
Esc — pause

ADVANCED MATCH ENGINE FEATURES
The engine now evaluates space control, expected possession value, future passing options, defensive cover shadows, pressing traps, transition responsibilities, role familiarity, chemistry, confidence and player decision personalities. It also includes multi-player combinations, adaptive opponent responses, smarter loose-ball behaviour, goalkeeper anticipation and distribution, referee personalities, event-based injuries, environmental effects, intelligent set-piece routines, replay capture and automatic match-balance checks.

FREE-KICK FREEZE FIX
--------------------
This build includes restart ownership repair, a kick-contact fallback and an open-play watchdog. If a free-kick animation or input release is interrupted, the game now completes the kick instead of remaining frozen.

Training UX overhaul added: icon-led focus cards, visual status feedback, coach guidance, intensity imagery, smart recommendation, and responsive training layout.

ASSISTS AND CIRCLE XI MANAGER BRANDING
-------------------------------------
The match engine now keeps an official-style assist chain for passes, through balls, crosses, cut-backs, corners, indirect free-kicks and throw-ins. Goals show the scorer and assister on the live scoreboard and in the full-time summary. Opposition control and goalkeeper parries correctly end the chain.

Career leagues, team names, club badge marks, colours and league branding are refreshed from Circle XI Manager. Existing Manager-linked careers are migrated automatically while preserving league points, matches played and goal difference.

MATCHDAY PRESENTATION, CUPS AND AUDIO
-------------------------------------
Players now walk out and form two line-ups before kick-off. At half time and full time every active player turns from their exact match position, walks directly towards the visible tunnel on the right side of the match view, funnels through the entrance and disappears inside before the second half or full-time result screen.

Completed passes now visibly improve the match rating, with larger rewards for progressive and chance-creating passes. Interceptions receive stronger rewards, with extra credit for stopping danger in the defensive third or cutting out a fast pass.

Career mode now includes the national Unity Cup and League Shield. Cup rounds appear as gold fixtures on the season calendar, use their own match presentation and progress through knockout rounds without changing the league table.

The match has layered procedural audio for continuous crowd atmosphere, distinct pass and shot contacts, tackles, lofted-ball grass impacts, net impacts, posts, crossbars, goal reactions and half-time or full-time whistles. The existing sound toggle controls the complete mix.

TEAM GOAL CELEBRATIONS
----------------------
After a goal, the scorer becomes the focus of a longer broadcast-style celebration. Eight available teammates run into spaced positions around the scorer, with the assister first to join. Players use varied arms-up, pointing, fist-pump, jumping, knee-slide and huddle poses while the camera follows the group before the replay choice appears.

CROWD REACTIONS, SEASON CALENDAR AND HONOURS
--------------------------------------------
The stadium now uses denser club-coloured home and away supporter sections. When either side scores, its supporters jump, raise their arms, wave scarves and flags and release coloured confetti while the opposing section slumps, lowers its arms or puts hands on heads.

The Fixtures tab is a live August-to-June season calendar. Use the month arrows to review recorded scores and match ratings or inspect future league and cup fixtures. Selecting a date updates the match detail panel, while only the current fixture can be played.

The Career tab now contains a glass-fronted trophy cabinet with separate shelves for team trophies and individual awards. Cup and league wins, Player of the Match, Player of the Month, Player of the Season and Golden Boot awards are tracked and displayed automatically.
CAREER SEASON, INJURY & PROGRESSION UPDATE
------------------------------------------
- League seasons now contain exactly 38 league matches, with cup ties occupying their own calendar weeks.
- Match injuries can make the career player miss multiple fixtures. Active absences are marked on both the season calendar and fixture detail; the markers disappear after recovery.
- Completed training now reports exact development points in the Training Centre and Profile.
- Profile attributes use recent development deltas to show improving, stagnant, or declining form truthfully.
- From age 33, age-related decline is applied despite training. Outfield players retire at 35; goalkeepers retire at 40.
- The Form panel now uses vivid green, yellow, orange, and red states with visual performance icons.
- League, cup, shield, international, individual, and Golden Boot honours use different trophy silhouettes in the cabinet.
INTERNATIONAL CALL-UPS & TOURNAMENT CALENDAR UPDATE
---------------------------------------------------
- International call-ups now compare the player's overall rating, five-match average form, and the national team's 1–100 reputation rating.
- A player whose overall meets or exceeds the team rating is selected automatically (for example, 70 OVR for a 67-rated country).
- A player within five rating points of the national team is selected automatically when recent average form is 7.50 or higher (for example, 75 OVR for an 80-rated country).
- Borderline players receive a weighted call-up chance based on both rating gap and recent form; the Profile explains the decision.
- The Profile now shows national-team rating, call-up status, reason, caps, international goals, and international assists.
- Club league and cup competitions are dated from August to May. International tournaments are dated from June to July.
- The season calendar shows international tournament dates, selection-pending markers, call-up fixtures, and international results.
- Selected players can play a six-match international tournament from the group stage through the final, with a distinct international trophy for champions.

MATCH RENDER RECOVERY FIX
-------------------------
- Fixed the dark-green match screen caused by the animated crowd trying to read an absent goal-reaction state at kick-off.
- Crowd presentation now fails safely, so an isolated supporter-animation issue cannot prevent the pitch, markings, ball, officials, or players from rendering.
- The game script URL has been cache-busted so browsers load the corrected match renderer immediately.

FOUR-ASSISTANT OFFSIDE SYSTEM
-----------------------------
- Matches now use four assistant referees: one on each half of both touchlines.
- Each pair remains inside its assigned half and tracks the ball or second-last defender line.
- Offside snapshots select the closest correctly positioned assistant for the attacking end and side of the pitch.
- Flag animations now appear on the exact touchline half where the offence occurred.

SMART MANAGER, MEDICAL AND 100% VIEWPORT UPDATE
-----------------------------------------------
- The manager now gives position-specific instructions and reviews how closely each one was followed after the match.
- Smart feedback identifies the player's strongest contribution and the most important role-specific weakness to improve.
- Normal match injuries are less frequent. Risk rises sharply when energy is empty, and the manager immediately substitutes an exhausted player.
- Elite dribblers retain the ball more effectively and are substantially harder to dispossess with a clean tackle.
- Injured players see a clear medical notice and cannot select, simulate, automate or complete training until recovered.
- Light, normal and intense training display different injury risks; intense work becomes increasingly dangerous when fatigue is high.
- Career, training and post-match layouts are constrained to the browser viewport so their essential controls remain visible at 100% zoom.

CONTINUOUS NEARBY-BALL AI MOVEMENT
----------------------------------
- Nearby AI players no longer stop moving simply because one teammate has been selected as the primary ball chaser.
- The closest player attacks the predicted ball path while the next two players anticipate second balls and rebounds.
- Defenders close to the carrier keep moving with goal-side jockeying steps instead of becoming static.
- Teammates close to the carrier continually adjust their passing angle rather than standing on an exact tactical point.
- A stable anti-idle footwork fallback prevents players within the active ball area from slowing to zero without adding random visual jitter.
- Reaction distance and interception lead are influenced by anticipation, decisions and acceleration attributes.

RIGHT-SIDE TUNNEL AND VISUAL TUTORIAL
-------------------------------------
- Pre-match players now begin inside the same right-side tunnel used at half time and full time, emerge through its mouth and split into their two line-ups.
- Half-time and full-time walk-offs still begin from each player's exact pitch position and now disappear deeper inside the upgraded tunnel.
- User substitutions also walk off through the right-side tunnel, with the incoming replacement emerging from the same entrance.
- The tunnel now has a concrete housing, recessed depth, rubber floor, perspective walls, ceiling lights, rails, club-colour fascia, illuminated sign and threshold shadows.
- The main menu Tutorial opens a colourful visual guide with four simple sections: Controls, Match IQ, Career and Cool Features.
- Control cards explain power, movement, passing, shooting, crossing, defending, sprint variations and positional assistance with clear symbols and key labels.
- The tutorial keeps its navigation and Quick Match button visible at 100% zoom while additional information scrolls inside the content panel.


DUGOUT, REAL SUBSTITUTION AND RED-CARD UPDATE
------------------------------------------------
- The match now renders two club-coloured substitutes’ benches beside the right-side tunnel, with seven visible substitute seats for each team.
- Each team has its own marked technical area and a visible manager who can observe, point, encourage or brief a substitute.
- Bench players are real squad entities with names, positions, shirt numbers, attributes, energy and match states.
- User substitutions now select a positionally suitable player from the bench, move that player through the technical area, complete the exchange at the touchline and activate the replacement in the match engine.
- The outgoing career player occupies the vacated dugout seat and the replacement takes over the same tactical position, home coordinates and match role.
- AI substitutions also use real bench players and preserve eleven active players while reducing the available bench count.
- Straight red cards and second-yellow dismissals immediately reduce the active team to ten and never trigger a replacement.
- Dismissed players leave the field and walk down the existing right-side tunnel alone before disappearing inside.
- Teams compact into a ten-player shape after a dismissal, with defensive cover reassigned when a defender is sent off.
- Live substitution and red-card banners show incoming and outgoing players, the dismissal type and the remaining player count.
- A reduced-team status badge remains visible for the rest of the match.
- Seven screenshots demonstrating the complete update are included in screenshots/dugout_update.


REFEREE AND ASSISTANT REFEREE MODEL UPDATE
- Referee and assistant referees now use detailed human figures with separate limbs, proper running poses, faces, hair, headset microphones, badges, watches and equipment.
- Official appearances vary between matches while remaining visually consistent.
- The referee shirt is selected automatically to contrast with both teams and both goalkeepers.
- Assistant referees track the offside line with side-on movement and use a visible chequered flag that remains attached to the hand.
- Advantage, free-kick, penalty, yellow-card and red-card signals have clearer body poses and compact decision labels.
- Referee positioning now avoids players, the ball and predicted passing lanes without changing foul or offside decisions.
- A fourth official stands between the technical areas and displays the substitution board during changes.
DYNAMIC GOAL NET PHYSICS UPDATE
- Both goals now use a lightweight 9 x 19 spring mesh.
- Net movement responds to shot speed, direction, height, shot type and exact impact position.
- Power shots, finesse finishes, chips, corners and low finishes have different reactions.
- Outside side-net and roof-net contacts animate correctly without counting as goals.
- The ball loses energy, rebounds or settles after contact.
- Replays preserve the recorded net deformation.
- Net movement dampens naturally and resets safely at the next kick-off.


STAT BASED PASSING, CROSSING AND SHOOTING UPDATE
------------------------------------------------
- Passing, crossing and shooting now use weighted technical and mental attributes instead of a single flat accuracy value.
- High passing and vision improve target selection, moving-player prediction, through-ball lead and pass weight consistency.
- High crossing improves near-post, far-post, penalty-spot and cutback deliveries while helping the ball avoid the goalkeeper.
- Finishing, composure, technique and long shots now control shot placement, miss angle, power variation, curl and dip.
- Pressure, sprinting, low energy, awkward body position, injury, distance and weak-foot use reduce effective accuracy.
- The live action guide shows quality tier, uncertainty and the main condition affecting the kick.
- AI players use the same stat-aware passing, crossing and shooting calculations as the career player.
- Six in-game screenshots are included in the Stat Accuracy Screenshots folder.


CREATE A PLAYER, WORLD BROWSER, WAGES AND PROMOTION UPDATE
----------------------------------------------------------
- The Create a Player identity screen now uses separate first name and surname fields with John and Smith as examples.
- Date of birth, height, weight and preferred foot are no longer displayed on the identity screen.
- Technical, Mental and Physical attributes can be reviewed and adjusted through a shared creation point budget.
- Nationality selection uses the existing fictional continents and filters countries by the selected continent.
- National team Overall ratings are calculated from Attack, Midfield, Defence and Goalkeeper.
- The Profile tab includes a realistic two sided Player ID and a wage funded coach and investment centre.
- The match presentation includes enhanced player shadows, pitch wear, grass texture, ball rotation and motion trails.
- All ten training activities fit on one desktop screen with proportionate Play and Simulate controls.
- The fixture calendar supports month and list views, competition filtering and clickable match information.
- Promotions trigger a skippable celebration and safely move the club into the next division.
- The League tab can browse fictional continents, countries, divisions and clubs with standings, ratings and club comparison.
- Eleven in-game screenshots are included in the In-Game Creator World Upgrade Screenshots folder.
- Automated regression testing completed 30 checks with 30 passes.

TACKLE AND GOALKEEPER DIRECTION UPDATE
---------------------------------------
- Standing, sliding and physical tackles now each have three situation driven animations.
- Tackle animation selection reacts to approach angle, speed, location and the correct tackling foot.
- Goalkeeper controls are J right, L left, K low middle and I high middle. Side and height keys combine for all four corners.
- Goalkeeper saves now use multiple catch, parry, fingertip, foot block, smother and rebound animations.
- Penalty and free kick saves use a nine zone goal layout with the same directional controls.
- Goalkeeper careers receive a Goalkeeper Reaction Lab training drill without increasing the ten activity total.
- Replays preserve tackle variants and goalkeeper dive states.
- Static and headless browser regression checks are recorded in TACKLE_GOALKEEPER_REGRESSION_TESTS.json.


DUGOUT, MANAGER, GOAL REACTION AND FORMATION UPGRADE
----------------------------------------------------
- Both technical areas now use detailed club-coloured dugouts, equipment and seven individual substitute models.
- Substitutes have varied appearances, poses, warm-up movements and separate goal-scored and goal-conceded reactions.
- Managers use detailed models, varied outfits, five touchline personalities and contextual tactical gestures.
- Goal celebrations include multiple individual and team styles, while the conceding side uses varied goalkeeper, defender, manager and bench reactions.
- Clubs now receive independent tactical identities and can use 4-3-3, 4-2-3-1, 4-4-2, 4-1-4-1, 3-5-2, 5-4-1 or 3-4-3.
- AI teams can change into attacking, defensive or alternative formations according to match time and score.
- Live formation labels and match events make tactical changes clear without interrupting play.
- Eight in-game screenshots are included in the In-Game Dugout Manager Formation Screenshots folder.
- Automated browser regression testing completed 17 checks with 17 passes and no browser errors.

HIGH DETAIL MANAGER AND SUBSTITUTE MODELS
-----------------------------------------
The matchday dugouts now use more detailed substitutes, managers, seats, equipment, clothing, faces and animation layers. Existing formations, substitutions, goal reactions and saved careers remain compatible. See HIGH_DETAIL_MANAGER_SUBSTITUTE_MODELS_UPDATE.md for details.

REFEREE ADVANTAGE UPDATE
- Referees can now play advantage when the fouled team retains a useful attack.
- A clear two-arm play-on animation, decision banner and three gesture variations are included.
- Weak advantages are called back to the original foul position.
- Delayed cards are shown at the next natural stoppage.
- Advantage events and referee animation states are saved in replay data.

REALISTIC SHOT, PASS AND CROSS ANIMATION OVERHAUL
==================================================
Added contextual shooting, passing and crossing animation profiles, foot contact synchronisation, momentum aware preparation, weak foot reactions and technique specific ball behaviour. See REALISTIC_SHOT_PASS_CROSS_ANIMATION_UPDATE.md for full details.

SMART FEEDBACK, CAREER STATS AND GOAL REALISM UPGRADE
-----------------------------------------------------
This build adds event-based manager feedback, stronger Hard difficulty mistake deductions, configurable formation notifications, elite-only flair animation profiles, weak-foot training and both-footed development, preferred-foot finesse shots, saved season and career statistics in the Forms tab, and expanded goalkeeper or one-on-one goal animations.

Five in-game screenshots are included in:
Smart Feedback Career and Goal Realism Screenshots

Full technical details:
SMART_FEEDBACK_CAREER_STATS_GOAL_REALISM_UPDATE.md


YEAR, CLUB AND COUNTRY STATISTICS UPGRADE
- The Forms tab now shows every season as a football year, such as 2026/27.
- Each club has a separate row, including multiple clubs during the same season.
- International appearances and detailed country statistics are displayed separately.
- Goals, assists, contributions, minutes, ratings, passing, shooting, dribbling and defending are tracked.
- Existing saves migrate automatically and future transfers preserve previous club records.
