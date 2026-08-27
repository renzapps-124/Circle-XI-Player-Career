# Circle XI v77.11 – Smart Manager Feedback & Clean Gameplay HUD

## What was wrong with the post-match breakdown

The old assessment tested every phrase independently and pushed each match onto the
list on its own. Nothing checked whether two lines could both be true, so it argued
with itself regularly:

- **85% passing with three misplaced passes** produced *"Your passing was controlled,
  accurate and helpful to the team's rhythm"* and *"Several misplaced passes allowed
  the opposition to transition"* — in the same breakdown.
- **Scoring while making an error that led to a goal** produced *"The manager was
  delighted with your decisive contribution"* directly above *"A possession error led
  directly to a goal and must be addressed."* The tone test was
  `goals>0 && errorCost<1`, and one error scored exactly `0.9`.
- A **red card** could be described as *"Two bookings is careless"*, because one shared
  pool of sentences served every discipline outcome. Ball-security criticism had the
  same flaw.

It was also repetitive and context-blind:

- Three variants per line, and **four fixed summary templates** — one of which
  (`"A mixed performance with clear positives and one main area to improve."`) was a
  constant string printed on every balanced match.
- Nothing looked at the **match**: not the result, not the scoreline, not how long the
  player was actually on the pitch. A substitute who played 14 minutes was judged on a
  starter's volume thresholds.

## How feedback is built now

Feedback is assembled per **theme**. Each theme scores **once**, from the stats plus
the match context, and emits **at most one line** — positive or negative, never both.
That single rule is what removes the contradictions.

Eleven themes: `finishing`, `creation`, `passing`, `security`, `dribbling`,
`defending`, `aerial`, `discipline`, `tactical`, `workrate`, `keeping`.

Beyond one-line-per-theme:

- **Positive gates.** A compliment only fires when the stat behind the sentence
  supports it. "You saw the runner early and the final pass was the right weight"
  needs an assist or two key passes, not one key pass plus arithmetic.
- **Cause-matched criticism.** Security and discipline pick their sentence pool from
  what actually happened — an error that led to a goal, an error that led to a shot,
  or plain volume; a red card, two bookings, or persistent fouling.
- **Minutes-scaled volume.** Thresholds are per-90, so a cameo is not marked down for
  a starter's sample, and volume-based criticism is suppressed for short appearances.
- **Match context.** Result, margin, possession share, clean sheet, whether the player
  scored the team's only goal, and whether it was a cup or derby all feed the verdict.
- **Gated tone.** Tone is decided last and cannot disagree with its own leading line.
  An error leading to a goal or a red card forces `critical` and forces that item to
  lead the criticism. A win softens a critical verdict only when there was no error and
  no red card. A loss caps a `very-positive` verdict at `positive`.
- **Ordered summary.** A critical summary leads with the fault and *then* concedes the
  positive ("It was not all bad — ..."). A positive summary leads with the positive.
  A player who scored but is still being criticised gets a dedicated opener that holds
  both facts at once, instead of "you were well below the standard required" sitting
  above "you scored our only goal".
- **Normalised scoring.** Tone and trust run off the *average* theme score rather than
  a raw sum, which previously grew with however many themes happened to fire — a busy
  midfielder out-scored a decisive striker just by touching the ball more, and trust
  gain hit its clamp on almost every good game.

## More to say, less repetition

Roughly **120 written lines** across the themes (was ~30), plus **60 result-and-tone
openers**, five mixed praise-and-blame openers, plus bridge, concession and closing
pools, and four variants for each tactical verdict band.

The summary is composed rather than templated: opener → (cameo note) → leading point →
bridge or concession → closing line. The line picker prefers variants that have not
appeared in the recent feedback history and only reuses one when every option in the
pool has been seen.

Measured over 300 generated matches across all ten positions:

| Check | Result |
|---|---|
| Same theme produced both a positive and a negative | **0** |
| "Delighted" verdict despite an error leading to a goal or a red card | **0** |
| Critical summary that led with praise | **0** |
| Line that did not match the event it was scored on | **0** |
| Unique summaries | **297 / 300** |
| Trust deltas hitting the clamp | **1 / 300** (was routine) |

Tone spread: 111 balanced, 99 positive, 73 critical, 17 very-positive.

## Gameplay HUD

Two overlays are no longer drawn during play:

- The **possession / shots / momentum strip** (`#v774MatchPulse`).
- The **on-canvas control panel** — "TEAMMATE IN POSSESSION … WASD · MOVE / AIM" with
  the J/K/L/I/M keys (`drawControlHUD`).

Everything behind them still runs in the background. `updateV774Immersion` keeps
computing momentum, team intent, crowd swell, pressure count and the camera; the
telemetry it reads still feeds possession and shot counts into the post-match
breakdown; and `controlHudData()` still resolves the control state every frame, so the
inputs behave exactly as before — the panel simply is not painted.

Three smaller overlays from the same block are **left in place**: the awareness prompt
(`#v774Awareness`), the match context banner (`#v774MatchContext`) and the rating flash
(`#v774RatingFlash`).

## Version

- Feature flag: `window.__CXI_V7711`
- Version: `77.11.0`
