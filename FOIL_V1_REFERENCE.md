# Foil v1 reference (about-card holofoil, as shipped through commit 349dda2)

Kept on request before the 2026-09-07 evolution pass (sparkle layer, tilt-driven
etch angle). This is the *way back*: the exact CSS and JS of the three-layer
stack — hue field, etch, glare — plus the pointer and gyroscope drivers.

Everything below is verbatim from commit `349dda2`. To restore wholesale:

```
git show 349dda2:styles.css > /tmp/styles-v1.css   # then lift lines 3964-4185 and 4295-4327
git show 349dda2:main.js   > /tmp/main-v1.js       # then lift lines 5564-5964
git show 349dda2:index.html | sed -n 223,228p      # the .image-wrapper markup, no canvas
```

The mask (`images/cw4-card-foil-mask.webp`, from `tools/make-foil-mask.js`) is
unchanged by the evolution and still in the tree.

What changed since v1, after a day of trying louder things and coming back:

| layer | v1 (this file) | current |
|---|---|---|
| hue field | `.foil` — 112deg repeating gradient, blue/cyan family, `hard-light`, masked to the plate | same |
| diffraction lines | `.foil::before` — fixed 112deg, `overlay` | angle is `112deg + --foil-etch`, swung a few degrees by the tilt |
| glare | `.foil::after` — radial white at the pointer, `screen` | tighter, and travels 1.6x the pointer |
| shadow | static `0 10px 20px` | slides opposite the pointer, drops further on hover |
| 3D tilt | 9deg at the edge, 0.12s transition while tracking | 10deg, 0.16s |
| phone | gyroscope via `initFoilMotion` | same, also writes `--foil-etch` |

Rejected the same day: a sparkle canvas (appendix below) and a full refractor
(rainbow over the whole print in `color` blend, rotating prism starburst,
briefly also masked to the plate). Both turned the plate into a pattern rather
than a surface with light moving over it.

---

## styles.css — card vars and transform (lines 3964–4005)

```css
.image-compare {
    position: relative;
    --showcase-edge: #ffb93a;
    /* Pointer-driven tilt. JS writes the two angles and the normalized pointer
       position; everything else here is static so the card still rests at its
       jaunty angle with JS off. --foil-px/--foil-py are consumed by the foil
       sheen layer. */
    --foil-tilt-x: 0deg;
    --foil-tilt-y: 0deg;
    --foil-lift: 0px;
    --foil-scale: 1;
    --foil-px: 0.5;
    --foil-py: 0.5;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    align-self: start;
    border-radius: 8px 8px 16px 16px;
    overflow: visible;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2), 0 0 0 2px #ffb93a;
    /* perspective() as a transform function rather than a wrapper element, so
       the ring and border tilt with the card and the markup stays flat. */
    transform:
        perspective(1000px)
        translateY(var(--foil-lift))
        rotateX(var(--foil-tilt-x))
        rotateY(var(--foil-tilt-y))
        rotate(-0.5deg)
        scale(var(--foil-scale));
    /* Springy overshoot on the way back to rest, like setting a card down. */
    transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
    /* The breathing glow lives on ::after (below), not here: it used to be a
       box-shadow keyframe animation on this element, which repaints the whole
       portrait's shadow every frame it is on screen. Keeps the pseudo's
       z-index: -1 inside this card even where the mobile block drops the
       transform. */
    isolation: isolate;
    cursor: pointer;
    border: 3px solid #000;
    outline: 2px solid #ffb93a;
    display: flex;
    flex-direction: column;
```

## styles.css — the foil stack (lines 4073–4185)

```css
/* ===== Foil =============================================================
   Confined to the orange hexagon plate by an alpha mask generated from the
   illustration itself (tools/make-foil-mask.js). Both the source art and the
   mask are square and the wrapper is 1:1, so `cover` is an exact 1:1 fit and
   the two register without any offset correction.

   `mask` makes this an isolated group, so ::before and ::after blend against
   the hue field below rather than against the artwork. That's deliberate: the
   foil is composed internally, then laid onto the orange as a single unit by
   the mix-blend-mode here. */
.foil {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    /* Hue field. Bands are anisotropic and travel with the pointer, which is
       what separates foil from a flat rainbow wash. */
    /* Foil, not Polychrome: the palette stays inside the blue/cyan family. An
       earlier violet stop read as hot magenta against the orange, which is the
       Polychrome look rather than the restrained sheen we want. */
    background: repeating-linear-gradient(
        112deg,
        rgba(12, 38, 82, 0.9) 0%,
        rgba(0, 214, 200, 0.9) 5%,
        rgba(158, 232, 255, 0.85) 9%,
        rgba(28, 92, 172, 0.9) 14%,
        rgba(72, 192, 236, 0.85) 17.5%,
        rgba(12, 38, 82, 0.9) 22%
    );
    background-size: 200% 200%;
    background-position: calc(var(--foil-px) * 100%) calc(var(--foil-py) * 100%);
    /* hard-light, after trying the two obvious alternatives:
       - color-dodge divides by the inverse of the source, so bright bands blew
         the orange out to a pale salmon.
       - overlay lets the *base* pick multiply vs screen, so the orange's
         dominant red channel survived and the cyan bands came through yellow.
       hard-light lets the *source* decide, which is what actually cools the
       plate where a band crosses it while the dark stops keep it banded. */
    mix-blend-mode: hard-light;
    opacity: 0.38;
    -webkit-mask-image: url('images/cw4-card-foil-mask.webp');
    mask-image: url('images/cw4-card-foil-mask.webp');
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    transition: opacity 0.4s ease;
}

/* The etch. Real foil is a micro-grooved layer under the ink, and without a
   fine directional pattern the hue field reads as a soap bubble instead. */
.foil::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        112deg,
        rgba(255, 255, 255, 0) 0px,
        rgba(255, 255, 255, 0.16) 1.5px,
        rgba(255, 255, 255, 0) 3px,
        rgba(0, 0, 0, 0.14) 4.5px,
        rgba(255, 255, 255, 0) 6px
    );
    mix-blend-mode: overlay;
}

/* Specular glare, pinned to the pointer. This is the gloss cue: it says the
   surface is laminated rather than printed. */
.foil::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at calc(var(--foil-px) * 100%) calc(var(--foil-py) * 100%),
        rgba(255, 255, 255, 0.6) 0%,
        rgba(255, 255, 255, 0.15) 26%,
        rgba(255, 255, 255, 0) 58%
    );
    mix-blend-mode: screen;
}

/* The mask only describes the illustration, and the reveal swaps in a
   completely different photograph. Rather than fight that, the foil retires
   while the photo is up: the card is the persona, the photo is the person. */
.image-compare.is-revealed .foil {
    opacity: 0;
}

/* Without a pointer there's nothing to drive the sheen, and an undriven foil
   reads as a discolored plate rather than as foil. So on touch the portrait
   starts flat, as the plain illustration, and the foil fades in only once the
   gyroscope is actually feeding it (main.js, initFoilMotion sets the class on
   <html> when the first real reading lands). The base rule's opacity
   transition does the fade.

   This replaced a slow canned drift, which was the wrong answer to the same
   problem: it kept the layer legible as *something moving*, but before the
   sensor was granted it was a tinted plate wandering on its own, and on iOS
   that is the state most visitors saw. Flat until earned reads better, and it
   gives the permission tap a visible payoff.

   Specificity note: .image-compare.is-revealed .foil still wins over the
   un-hide below, so the photo side stays foil-free. */
@media (hover: none), (pointer: coarse) {
    .foil {
        opacity: 0;
    }

    html.foil-motion .foil {
        opacity: 0.38;
    }
}

```

## styles.css — phone tilt restore inside `@media (max-width: 767px)` (lines 4295–4327)

```css

    .image-compare,
    .image-compare:hover {
        transform: none;
    }

    /* ...except while the gyroscope is driving, which is the only time this
       card has a reason to move on a phone.

       The rule above is why the pitch axis read as broken: with no transform,
       --foil-tilt-x/y went nowhere, so the sheen was the whole effect. That
       hides an asymmetry — the hue field runs at 112deg, direction vector
       (0.93, 0.37), so rolling sweeps the bands hard while pitching barely
       shifts them. Roll looked alive on the weak cue alone; pitch had nothing
       left. Restoring the tilt gives both axes an equal, obvious one.

       Only the tilt, not the desktop declaration: no -0.5deg jaunt, no lift,
       no scale. At rest the angles are 0deg, so this is visually identical to
       `none` and the card can't jump when motion starts.

       Watch this one in Safari. The wrapper paints the portrait as a parent
       background precisely because Safari drops composited <img> layers when a
       tap mixes clipping, filtering and transforms; the clip and filter are
       already neutralized above, and .is-tilting's will-change promotes this to
       its own layer, but if the portrait ever blanks on tap, start here. */
    html.foil-motion .image-compare,
    html.foil-motion .image-compare:hover {
        transform:
            perspective(1000px)
            rotateX(var(--foil-tilt-x))
            rotateY(var(--foil-tilt-y));
    }

```

## index.html — the wrapper markup (lines 223–227)

```html
                <div class="image-wrapper">
                    <img class="image-before" src="images/cw4-card.webp" alt="" width="860" height="860" loading="lazy" decoding="async">
                    <img class="image-after" src="images/cw2.webp" alt="" loading="lazy" decoding="async" width="800" height="800">
                    <div class="foil" aria-hidden="true"></div>
                </div>
```

## main.js — `initFoilCard` and `initFoilMotion` (lines 5564–5964)

```js
function initFoilCard() {
    const card = document.querySelector('.image-compare');
    if (!card) return;

    // --- Reveal, moved off :hover -------------------------------------------
    // Hover had to give up the pointer to the tilt, and on touch it was never
    // right anyway: tapping left the card stuck in a phantom hover state.
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', 'Illustrated portrait of Charles Wilke. Activate to show the photograph.');

    const toggleReveal = () => {
        const revealed = card.classList.toggle('is-revealed');
        card.setAttribute('aria-pressed', revealed ? 'true' : 'false');
    };

    card.addEventListener('click', toggleReveal);
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleReveal();
        }
    });

    // --- Pointer tilt --------------------------------------------------------
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const MAX_TILT = 9; // degrees at the very edge of the card

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const applyTilt = () => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        // -0.5 .. 0.5 from the card's center
        const dx = (pointerX - rect.left) / rect.width - 0.5;
        const dy = (pointerY - rect.top) / rect.height - 0.5;
        // rotateX is negated so the card tips *away* under the pointer, as if
        // the cursor were pressing into the surface. Dropping the minus gives
        // the opposite "card leans toward you" read.
        card.style.setProperty('--foil-tilt-x', (-dy * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--foil-tilt-y', (dx * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--foil-px', (dx + 0.5).toFixed(4));
        card.style.setProperty('--foil-py', (dy + 0.5).toFixed(4));
    };

    const onPointerMove = (e) => {
        pointerX = e.clientX;
        pointerY = e.clientY;
        if (!frame) frame = requestAnimationFrame(applyTilt);
    };

    const onPointerEnter = () => card.classList.add('is-tilting');

    const onPointerLeave = () => {
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        card.classList.remove('is-tilting');
        card.style.setProperty('--foil-tilt-x', '0deg');
        card.style.setProperty('--foil-tilt-y', '0deg');
        card.style.setProperty('--foil-px', '0.5');
        card.style.setProperty('--foil-py', '0.5');
    };

    let tiltBound = false;
    const syncTilt = () => {
        const wanted = finePointer.matches && !reduceMotion.matches;
        if (wanted === tiltBound) return;
        if (wanted) {
            card.addEventListener('pointermove', onPointerMove);
            card.addEventListener('pointerenter', onPointerEnter);
            card.addEventListener('pointerleave', onPointerLeave);
        } else {
            card.removeEventListener('pointermove', onPointerMove);
            card.removeEventListener('pointerenter', onPointerEnter);
            card.removeEventListener('pointerleave', onPointerLeave);
            onPointerLeave();
        }
        tiltBound = wanted;
    };

    syncTilt();
    finePointer.addEventListener('change', syncTilt);
    reduceMotion.addEventListener('change', syncTilt);
}

/* Gyroscope tilt for the foil, on touch devices.

   Desktop drives the sheen from the pointer. A phone has no pointer to give,
   so the foil sat there as a discolored plate with only a slow canned drift on
   the about card. The device's own orientation is the honest stand-in: tip the
   phone and the light moves, the way it does holding a real foil card.

   Until it's live the portrait is flat — styles.css hides .foil on coarse
   pointers and un-hides it on html.foil-motion, which is set here on the first
   real reading. So a visitor who never grants the sensor sees the plain
   illustration, never an inert tinted plate, and the permission tap has a
   visible payoff.

   It writes exactly the vars the pointer path writes (--foil-px/--foil-py and
   the two tilt angles), so the CSS is shared and this only supplies a different
   input.

   The about portrait only, and it's now the only foil on the page at all. The
   four Recently tiles carried a pointer tilt and a sheen of their own for a
   while; five holofoils turned the top of the page into a light show and cost
   this one its status as the object that does this. They keep their float and
   their CRT treatment; the foil is the portrait's alone.

   Model: the card behaves as a plate held level by gravity, floating just above
   the screen. Tip the phone right and it stays level, which from the screen's
   frame means its right edge rises toward you. Everything below follows from
   that one idea, including which way the glare travels.

   Three things to know before editing:

   - iOS gates the sensor. DeviceOrientationEvent.requestPermission() exists
     only on Safari and only resolves when called from a real user gesture, so
     activation is bolted to the about card's existing tap. Everywhere else the
     listener just binds. A grant is remembered per origin, so returning
     visitors get a gesture-free retry first and only fall back to the tap.
   - Baseline, not absolute. Nobody holds a phone flat, so the first reading
     becomes neutral and everything after is a delta from it. Re-baselined when
     the screen rotates or the tab comes back, since both invalidate the pose.
   - Screen space, not device space. beta/gamma are fixed to the hardware; in
     landscape they swap. The delta is rotated by screen.orientation.angle
     before it means anything about left and right.

   Smoothing is the same trick the pointer path uses — .is-tilting swaps in a
   0.12s ease on the registered angle properties — plus an EMA here, because a
   real gyro is noisier than a mouse and the raw signal jitters visibly. */
function initFoilMotion() {
    const card = document.querySelector('.image-compare');
    if (!card) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Degrees away from the resting pose that reach the edge of the effect.
       Per axis, because the two are not interchangeable:

       - Roll (left/right) is a wrist movement. 22deg is effortless and you
         never lose sight of the screen.
       - Pitch (forward/back) is not. Past roughly 15deg the screen is angling
         out of view, so the range you actually get is far smaller — and at a
         shared 22deg the axis reads as dead because nobody ever reaches it.

       The gradient compounds it: the hue field runs at 112deg, whose direction
       vector is (0.93, 0.37), so an equal move in --foil-py sweeps the bands
       only ~40% as far as the same move in --foil-px. A shorter pitch swing
       pays back some of that too, by reaching the extremes with less motion. */
    const SWING_X = 22;
    const SWING_Y = 12;
    // Deltas past this are someone putting the phone in a pocket, not aiming
    // it. Clamped rather than ignored so the cards settle instead of freezing.
    const MAX_DELTA = 45;
    // Gentler than the pointer's 9deg: the tilt is now on top of a moving hand
    // rather than a still screen, and the same amplitude reads as wobble.
    const MAX_TILT = 6;
    // Exponential moving average on the screen-space delta. 0.16 lands about
    // where a gyro stops looking twitchy without feeling like syrup.
    const SMOOTH = 0.16;

    /* Which way the glare travels. Not a taste call in the end: solving the
       specular condition for a tilting flat plane puts the highlight at
       v ≈ d(θ - 2φ) — it slides toward whichever edge is *nearer* the viewer.
       Since a level plate lifts the edge the phone drops, the glare chases the
       edge you tip down. Both axes follow that one rule, so they can't disagree
       with each other; flip a sign only to reverse the whole read. */
    const TIP_X = 1;
    const TIP_Y = -1;

    let baseBeta = null;
    let baseGamma = null;
    let sx = 0; // screen-space left/right delta, degrees
    let sy = 0; // screen-space front/back delta, degrees
    let frame = 0;
    let listening = false;
    let onScreen = false;
    // Debug only: the largest delta each axis has actually reached. Answers
    // "is this axis dead or am I just not moving it far enough" without having
    // to watch a console while waving a phone around.
    let rawBeta = null;
    let rawGamma = null;
    let peakBeta = 0;
    let peakGamma = 0;

    const screenAngle = () => {
        const angle = (screen.orientation && screen.orientation.angle);
        return typeof angle === 'number' ? angle : (window.orientation || 0);
    };

    const clampDelta = (v) => Math.max(-MAX_DELTA, Math.min(MAX_DELTA, v));

    const write = () => {
        frame = 0;
        if (!onScreen) return;
        // -1 .. 1 on each axis
        const nx = Math.max(-1, Math.min(1, sx / SWING_X));
        const ny = Math.max(-1, Math.min(1, sy / SWING_Y));
        card.style.setProperty('--foil-px', (0.5 + TIP_X * nx * 0.5).toFixed(4));
        card.style.setProperty('--foil-py', (0.5 + TIP_Y * ny * 0.5).toFixed(4));
        // Both angles negated, for the same reason: a plate that stays level
        // while the phone turns under it rotates *against* the phone, and
        // CSS's positive directions push the far edge away (measured, not
        // assumed — positive rotateX sends the top back, positive rotateY
        // sends the right edge back). ny/nx are "this edge went down", so the
        // plate answers with the opposite sign.
        card.style.setProperty('--foil-tilt-x', (-ny * MAX_TILT).toFixed(2) + 'deg');
        card.style.setProperty('--foil-tilt-y', (-nx * MAX_TILT).toFixed(2) + 'deg');
    };

    // The class is what un-hides the foil on touch (styles.css), so it's set on
    // the first real reading rather than in start(). A phone that grants the
    // sensor but never reports one — no gyro, or a silent implementation —
    // would otherwise trade the flat portrait for a motionless plate, which is
    // the exact thing this path exists to avoid.
    let live = false;
    const goLive = () => {
        if (live) return;
        live = true;
        document.documentElement.classList.add('foil-motion');
    };

    const onOrientation = (e) => {
        if (e.beta == null || e.gamma == null) return;
        goLive();
        if (baseBeta === null) {
            baseBeta = e.beta;
            baseGamma = e.gamma;
            return; // the pose that started it is neutral, not a tilt
        }
        rawBeta = e.beta;
        rawGamma = e.gamma;
        const dBeta = clampDelta(e.beta - baseBeta);
        const dGamma = clampDelta(e.gamma - baseGamma);
        peakBeta = Math.max(peakBeta, Math.abs(dBeta));
        peakGamma = Math.max(peakGamma, Math.abs(dGamma));
        // Device axes: +X out the right edge, +Y out the top. Positive gamma
        // drops the right edge, positive beta lifts the top. Express both as
        // "which way is down", then rotate into screen space.
        const downX = dGamma;
        const downY = -dBeta;
        const rad = screenAngle() * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const targetX = downX * cos - downY * sin;
        const targetY = downY * cos + downX * sin;
        sx += (targetX - sx) * SMOOTH;
        sy += (targetY - sy) * SMOOTH;
        if (!frame) frame = requestAnimationFrame(write);
    };

    const release = () => {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--foil-px');
        card.style.removeProperty('--foil-py');
        card.style.removeProperty('--foil-tilt-x');
        card.style.removeProperty('--foil-tilt-y');
    };

    // The card sits well below the fold, and every write is a transform on a
    // large image. Nothing pays for the effect until it's actually on screen.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            onScreen = entry.isIntersecting;
            if (onScreen) {
                if (listening) card.classList.add('is-tilting');
            } else {
                release();
            }
        });
    }, { rootMargin: '10% 0px' });

    const rebase = () => {
        baseBeta = null;
        baseGamma = null;
        sx = 0;
        sy = 0;
        peakBeta = 0;
        peakGamma = 0;
    };

    const start = () => {
        if (listening) return;
        listening = true;
        rebase();
        if (onScreen) card.classList.add('is-tilting');
        window.addEventListener('deviceorientation', onOrientation);
        window.addEventListener('orientationchange', rebase);
        document.addEventListener('visibilitychange', onVisibility);
    };

    const stop = () => {
        if (!listening) return;
        listening = false;
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        live = false;
        document.documentElement.classList.remove('foil-motion');
        window.removeEventListener('deviceorientation', onOrientation);
        window.removeEventListener('orientationchange', rebase);
        document.removeEventListener('visibilitychange', onVisibility);
        release();
    };

    function onVisibility() {
        // Coming back from the app switcher, the phone is rarely in the pose it
        // left in. Re-baselining beats snapping to a stale neutral.
        if (!document.hidden) rebase();
    }

    const GRANT_KEY = 'foil-motion-granted';
    const needsPermission = typeof DeviceOrientationEvent.requestPermission === 'function';

    const requestAndStart = () => {
        // Rejects outside a user gesture, on insecure origins, and when the
        // user declines. All three mean "no gyro" and none deserve a console
        // error on a portfolio page.
        return DeviceOrientationEvent.requestPermission().then(state => {
            if (state !== 'granted') return false;
            try { localStorage.setItem(GRANT_KEY, '1'); } catch (err) { /* private mode */ }
            start();
            return true;
        }).catch(() => false);
    };

    let armed = false;
    const arm = () => {
        if (armed) return;
        armed = true;
        observer.observe(card);
        if (!needsPermission) {
            start();
            return;
        }
        let remembered = false;
        try { remembered = localStorage.getItem(GRANT_KEY) === '1'; } catch (err) { /* private mode */ }
        // A previous grant is remembered per origin, so this usually resolves
        // without a prompt and the foil is live before the first tap. If the
        // browser insists on a gesture anyway, the tap below still covers it.
        if (remembered) requestAndStart();
        card.addEventListener('click', () => {
            if (!listening) requestAndStart();
        });
    };

    const disarm = () => {
        if (!armed) return;
        armed = false;
        observer.disconnect();
        onScreen = false;
        stop();
    };

    // Touch devices only. A laptop with both a trackpad and an accelerometer
    // already has the pointer version, and running both would fight.
    const sync = () => {
        if (!finePointer.matches && !reduceMotion.matches) arm();
        else disarm();
    };

    sync();
    finePointer.addEventListener('change', sync);
    reduceMotion.addEventListener('change', sync);

    // Debug readout for tuning the swing ranges and TIP_X/TIP_Y on a real
    // device, since no desktop browser can produce a genuine reading. The peaks
    // are the useful pair: wave the phone through its comfortable range on one
    // axis, then read off how far that axis actually got compared to its swing.
    // ?foildebug only.
    if (/[?&]foildebug\b/.test(location.search)) {
        window.__foilMotion = {
            get state() {
                return {
                    listening, live, needsPermission, onScreen,
                    angle: screenAngle(),
                    beta: rawBeta, gamma: rawGamma,
                    baseBeta, baseGamma,
                    sx: +sx.toFixed(2), sy: +sy.toFixed(2),
                    peakPitch: +peakBeta.toFixed(1), swingPitch: SWING_Y,
                    peakRoll: +peakGamma.toFixed(1), swingRoll: SWING_X,
                };
            },
            rebase,
            arm,
            disarm,
            start,
            stop,
        };
    }
}
```

---

## Appendix: rejected sparkle layer (2026-09-07)

Between v1 and the refractor, one pass added a `<canvas class="foil-sparkles">`
above the plate: 64 four-pointed stars seeded from the mask, twinkling, with
brightness scaled by tilt magnitude and by distance to the glare. It worked
(loop only ran while a driver fed it, idle cost zero) but it read as a night
sky on the plate, not as foil, and was dropped the same day. The controller,
for the record; the drivers called `foilSparkles.set(nx, ny, px, py)` on every
write and `foilSparkles.rest()` on release.

```js
/* Sparkles for the foil: the fourth layer of the stack, and the one CSS can't
   draw. A canvas over the plate, four-pointed stars that twinkle, and — the
   detail worth having — brightness that scales with how far the card is
   tilted. Flat, they're shy; tipped hard, the whole plate glitters. Stars near
   the glare burn brightest, so they read as glitter answering a light source
   rather than a fixed pattern.

   Both tilt drivers feed it through set(nx, ny, px, py) and let go with
   rest(). Nothing runs otherwise: the loop starts on the first set(), decays
   to zero after rest(), clears the canvas and stops. At rest this costs no
   frame, which is the bar every animation on this page has to clear.

   The constellation is seeded from the foil mask itself (sampled at 64px) so
   every star lands on the orange plate. Scattering them over the whole square
   and letting the CSS mask hide the rest would waste most of the draw and
   pile the visible ones wherever the plate happens to be widest. A fixed PRNG
   seed makes it the same constellation every visit — it's one card, not a
   screensaver. */
let foilSparkles = null;

function initFoilSparkles() {
    const card = document.querySelector('.image-compare');
    const canvas = card && card.querySelector('.foil-sparkles');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const COUNT = 64;
    // Star radii are authored against the desktop card (420px) and scaled.
    const DESIGN_WIDTH = 420;
    // How much the plate glitters with no tilt at all, while a driver is live.
    const FLOOR = 0.16;
    // Response of the brightness envelope, 1/s. ~120ms to settle: quick enough
    // that a flick of the wrist lights the plate, slow enough not to strobe on
    // gyro noise.
    const RESPONSE = 8;

    // mulberry32, so the constellation is deterministic.
    let seed = 0x5eed;
    const rand = () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let stars = [];
    const seedStars = (inside) => {
        const out = [];
        let tries = 0;
        while (out.length < COUNT && tries++ < 4000) {
            const x = rand();
            const y = rand();
            if (inside && !inside(x, y)) continue;
            out.push({
                x,
                y,
                size: 2 + rand() * 3,
                phase: rand() * Math.PI * 2,
                speed: 1.2 + rand() * 2.4, // rad/s
                heat: 0.4 + rand() * 0.6,
            });
        }
        stars = out;
    };

    // Sample the mask's alpha so stars are placed on the plate. Until it
    // decodes (it's already in cache from the CSS) the layer simply has no
    // stars, which is the same as being at rest.
    const mask = new Image();
    mask.decoding = 'async';
    mask.src = 'images/cw4-card-foil-mask.webp';
    const N = 64;
    mask.decode().then(() => {
        const c = document.createElement('canvas');
        c.width = N;
        c.height = N;
        const g = c.getContext('2d');
        g.drawImage(mask, 0, 0, N, N);
        const data = g.getImageData(0, 0, N, N).data;
        const alphaAt = (x, y) => data[((y * N) + x) * 4 + 3];
        // Inside means the sample and its four neighbours are all opaque, which
        // keeps stars off the soft edge where the mask would half-hide them.
        const inside = (u, v) => {
            const x = Math.min(N - 2, Math.max(1, (u * N) | 0));
            const y = Math.min(N - 2, Math.max(1, (v * N) | 0));
            return alphaAt(x, y) > 200
                && alphaAt(x - 1, y) > 200 && alphaAt(x + 1, y) > 200
                && alphaAt(x, y - 1) > 200 && alphaAt(x, y + 1) > 200;
        };
        seedStars(inside);
    }).catch(() => seedStars(null));

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        const d = Math.min(2, window.devicePixelRatio || 1);
        if (w === width && h === height && d === dpr) return;
        width = w;
        height = h;
        dpr = d;
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(h * d);
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

    let level = 0;   // current brightness envelope, 0..1
    let target = 0;  // where the envelope is heading
    let lightX = 0.5;
    let lightY = 0.5;
    let frame = 0;
    let last = 0;
    let clock = 0;

    // A four-pointed star: four quadratic arcs whose control points sit near
    // the centre, which pinches the arms. `k` is the waist.
    const star = (x, y, r) => {
        const k = r * 0.22;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x + k, y - k, x + r, y);
        ctx.quadraticCurveTo(x + k, y + k, x, y + r);
        ctx.quadraticCurveTo(x - k, y + k, x - r, y);
        ctx.quadraticCurveTo(x - k, y - k, x, y - r);
        ctx.fill();
    };

    const draw = (now) => {
        frame = 0;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        clock += dt;
        level += (target - level) * Math.min(1, dt * RESPONSE);
        if (target === 0 && level < 0.004) {
            level = 0;
            last = 0;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        if (!width) resize();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const scale = width / DESIGN_WIDTH;
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            // Squared sine: most stars sit dim most of the time and each one
            // flares briefly, which is what twinkle is. (Cubed read as too
            // sparse at a hard tilt: a dozen faint points, not glitter.)
            const wave = 0.5 + 0.5 * Math.sin(clock * s.speed + s.phase);
            const twinkle = wave * wave;
            const dx = s.x - lightX;
            const dy = s.y - lightY;
            const near = Math.exp(-(dx * dx + dy * dy) / 0.1);
            const alpha = level * s.heat * (0.12 + 0.88 * twinkle) * (0.3 + 0.7 * near);
            if (alpha < 0.02) continue;
            const r = s.size * scale * (0.65 + 0.55 * twinkle) * (0.75 + 0.45 * level);
            const x = s.x * width;
            const y = s.y * height;
            // Halo in the foil's own cyan, then the white core.
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = 'rgb(158, 232, 255)';
            star(x, y, r * 2.1);
            ctx.globalAlpha = Math.min(1, alpha);
            ctx.fillStyle = '#fff';
            star(x, y, r);
        }
        frame = requestAnimationFrame(draw);
    };

    const set = (nx, ny, px, py) => {
        if (reduceMotion.matches) return;
        const tilt = Math.min(1, Math.hypot(nx, ny));
        target = FLOOR + (1 - FLOOR) * tilt;
        lightX = px;
        lightY = py;
        if (!frame) frame = requestAnimationFrame(draw);
    };

    const rest = () => {
        target = 0;
        if (!frame && level > 0) frame = requestAnimationFrame(draw);
    };

    return { set, rest };
}

```
