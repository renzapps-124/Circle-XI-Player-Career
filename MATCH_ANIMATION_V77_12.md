# Circle XI v77.12 – Match Animation & Set Pieces

## Running left and right

`drawVisibleFootballer` already had a side-on pose — the torso narrows, the arms
reposition — but **it was never mirrored**. Running left and running right produced
the *same drawing*, so neither read as travelling that way, and the figure kept
looking like the front-on ("running down") pose.

Every side-on pose is now built as if facing right, and the whole figure is flipped
for leftward travel:

```
const mirrorSide = (!preview && rawFace.x < -.02) ? -1 : 1;
const face = mirrorSide<0 ? {x:-rawFace.x, y:rawFace.y} : rawFace;
...
if (mirrorSide < 0) ctx.scale(-1, 1);
```

The flip is applied after the renderer's own `rotate(PI/2)`, where local axes are
screen-aligned, so it is a true horizontal mirror. It only engages once `face.x`
crosses `-0.02` — at that point the figure is nearly front- or back-on, so the switch
is invisible. The shirt number only draws on the back view, so nothing reversed.

Verified by rendering the four cardinal directions side by side: up is a back view,
down is a front view, and left and right are now opposite profiles instead of
identical drawings.

**Note on the coordinate system.** The world has goals at `x=0` and `x=W`, but the
camera draws it with `translate(0,W); rotate(-PI/2)`, and the figure counter-rotates
by `+PI/2`. So `worldAngleToScreenVector`'s `{sin, -cos}` mapping is correct and was
left alone — the missing piece was only the mirror.

## Goalkeeper dive

Diving hands reached `saveSide*(8.5 + reach*5.5)` — up to **14 units** from centre
against a torso half-width of about 3.6, roughly **four times** the standing arm
length. That is why the arms looked rubbery on every dive.

Pulled back to a full but anatomical stretch:

| | before | after |
|---|---|---|
| hand reach | 8.5 + reach·5.5 (10.4 → 14.0) | 6.3 + reach·2.9 (7.3 → 9.2) |
| elbow | 6.1–7.4 + reach·2.1–2.6 | 4.5–5.1 + reach·1.1–1.4 |

Applied across all four dive variants (cross-hand, two-hand, punch, and the default),
so the whole family is consistent. Side-to-side diving itself was already wired —
`gkDiveSide` is set from the ball's lateral offset at every save entry point, and a
non-zero side is what selects the horizontal dive.

## Tackles

A clean win and a foul used the **same tackler pose** — the only difference on screen
was a text cue and the victim's fall. The tackler's outcome is now tagged at the point
the challenge resolves (`tackleOutcome = 'clean' | 'foul'`, reset as each new challenge
resolves so a missed tackle cannot inherit the last one), and the renderer poses it:

- **Clean win** — plants and stays balanced, lead leg driving low through the ball.
- **Foul** — off-balance follow-through, trailing leg high, torso falling away, scaled
  by the foul severity already computed for the victim's fall.

## Penalties and free kicks

Measured over 40,000 simulated attempts per skill band:

| | before | after |
|---|---|---|
| AI penalty on target | 94% | 99% |
| Keeper guesses the right way | 49% | 43% |
| AI free kick on target | **100%** | ~80% |

Two separate causes:

- **Penalties** were suppressed less by aim than by the keeper, who was handed the
  correct side outright 24% of the time *on top of* a random three-way guess. The aim
  spread is tightened and that hand-out is cut to 14%. The aim was deliberately not
  tightened all the way — an early pass reached 99.9% on target, which is unrealistic;
  a few penalties should still be dragged wide.
- **Free kicks** could not miss. The target was clamped *inside* the posts
  (`goalTop+4 … goalBottom-4`), so every AI free kick was on target by construction.
  The clamp now allows the ball outside the frame and the placement error is
  meaningful, so roughly one in five now goes wide or over.

## Verified

Renders compared before and after for running direction, keeper dives (both sides,
three heights) and both tackle outcomes. Set-piece rates measured numerically. A real
match boots with no console errors and no crash banner.

**Not verified in this environment:** the match render loop runs on
`requestAnimationFrame`, which does not fire while the browser pane is hidden, so none
of this could be watched in live motion — the pose work is verified frame-by-frame
through the renderer, not in play.

## Version

- Feature flag: `window.__CXI_V7712`
- Version: `77.12.0`
