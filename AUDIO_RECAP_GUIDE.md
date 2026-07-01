# Audio Recap Time Dial - Guide

## Overview
The Time Dial lets visitors browse and play past audio recaps of the Substack
articles. It's styled as a vintage radio tuner inside a wood cabinet, with a
live oscilloscope "CRT" and a horizontal station dial.

It lives in the **Writing** section of the main site
(`index.html` + `main.js`), just above the article grid.

## How It Works (current implementation)

### Layout
- **Oscilloscope CRT (top):** a `<canvas>` (`#recap-oscilloscope`) that draws a
  live amber waveform of whatever recap is playing. Two faded labels are baked
  into the glass: a title (`RECENTLY ON EXPLORING L.AI.BOR`) and a meta line
  (`RECAP PODCAST • <month>`, id `#oscilloscope-recap-date`).
- **Station dial (middle):** a horizontal amber scale. Each recap is a clickable
  major marker (`.scale-marker.scale-major.scale-clickable`) with a `.marker-label`;
  short minor ticks sit between them. A red vertical needle (`#tuner-indicator`)
  slides to the active station.
- **Player (bottom/right):** a minimal custom audio player — play/pause button,
  progress bar, and current-time readout — driven by `<audio id="recap-audio">`.

### Interaction
- **Click/tap a station marker** to switch recaps. (Scroll/swipe tuning was
  removed; it hijacked page scroll when the cursor crossed the dial.)
- On change, the dates fade-update, the audio source swaps, and playback resumes
  if it was already playing.

### Visual feedback
- **Active station is spotlighted:** bright near-white amber (`#fff3d4`), scaled
  up ~18%. **Inactive stations are dimmed** (~42% opacity, low glow blur) so they
  recede but stay legible.
- **Hover** lifts an inactive label with a neon glow + slight scale.
- CRT flavor (in `styles.css`, ~line 4876+): scanlines, static noise during
  tuning, phosphor decay on the old marker, vacuum-tube warmup + signal-lock
  pulse on the new one, subtle screen flicker, plus a random radio-tuning sound
  effect from `audio/radio_tuning1–9.mp3`.

## Where things live
- **Station data:** `main.js`, inside `initTimeDial()` → the `recapStations`
  array (~line 1496).
- **Selected-on-load station:** `currentStation` in `main.js` (~line 1590).
- **Date sync on load:** `syncInitialStation()` in `main.js` (~line 1961) copies
  the current station's date into both date displays, so the HTML date defaults
  don't need to be kept in sync by hand.
- **Dial markup:** `index.html`, the `.tuner-scale` block (~line 193).
- **Default audio source:** `index.html`, `<audio id="recap-audio" src="…">`
  (~line 233).

### Station data shape
```javascript
const recapStations = [
    // ...
    {
        angle: 80,                              // legacy/unused — see note below
        date: 'May 2026',                       // shown in displays
        file: 'audio/may-2026-substack-recap.mp3',
        label: 'MAY \'26'                       // not rendered; HTML holds the visible label
    }
];
```

**Array order is the source of truth.** The array index equals the station index
(`data-station` in the HTML) and the left-to-right position on the dial. Append
new recaps to the **end** to make them the newest (right-most) station.

> **Note on `angle` and `label`:** the `angle` field and the helper
> `updateTunerIndicatorByAngle()` are leftovers from the old rotating-needle
> design and are no longer read — the needle is positioned by the marker's DOM
> index, not by angle. `label` is likewise not rendered (the visible label text
> lives in the HTML `.marker-label`). They're kept for now to avoid churn; safe
> to ignore when adding stations.

## Adding a new recap

### 1. Add the audio file
Drop the MP3 in `/audio/` (e.g. `audio/jun-2026-substack-recap.mp3`). Use a
consistent, chronological name.

### 2. Add the station to `main.js`
Append an entry to the **end** of `recapStations` (~line 1496):
```javascript
{
    angle: 0,                                   // value doesn't matter (unused)
    date: 'June 2026',
    file: 'audio/jun-2026-substack-recap.mp3',
    label: 'JUN \'26'
}
```

### 3. Point `currentStation` at the new newest station
Update `currentStation` (~line 1602) to the new last index so it loads selected:
```javascript
let currentStation = 13; // Start at the newest station
```
This one value now drives both the displayed dates *and* the initial needle/active
marker position — the load-time `updateTunerIndicator(currentStation)` call (~line 1991)
derives from it, so there's no separate hardcoded index to bump.

### 4. Add the marker to `index.html`
In the `.tuner-scale` block (~line 193): add a `.scale-marker.scale-minor` spacer,
then the new major marker. Move the `active` class onto the new (newest) marker,
and alternate `label-top` so labels keep staggering above/below the line:
```html
<div class="scale-marker scale-minor"></div>
<div class="scale-marker scale-major scale-clickable active" data-period="Jun '26" data-station="13">
    <span class="marker-label">JUN<br>2026</span>
</div>
```
Remove `active` from the previous newest marker.

### 5. Update the default audio source
Set the `<audio id="recap-audio">` `src` (~line 233) to the newest MP3 so the
right station is cued before JS runs:
```html
<audio id="recap-audio" class="custom-audio"
       src="audio/jun-2026-substack-recap.mp3" preload="metadata" style="display:none;"></audio>
```

### 6. (Optional) Extend the animation stagger
`styles.css` has a `--marker-index` list keyed by `:nth-child` (~line 5142) that
staggers the idle "breathing" animation. It currently covers the first 19
markers; add another `:nth-child` rule only if you've grown past that and want
the new marker's animation staggered. Purely cosmetic.

### What you do *not* need to touch
The date displays auto-sync from the station data on load (`syncInitialStation`),
so you don't have to hand-edit the right-side date or the oscilloscope meta date.

## Design notes
- **Palette:** amber/gold dial (`#ffc94a` / `rgba(255, 190, 60, …)`), red needle.
  This is a deliberate vintage-radio look, distinct from the site's neon-cyan
  (`--neon: #00f7c2`).
- **Spotlight model:** the active station is the focal point; everything else
  recedes. If you tune the dim level, the inactive label color is set in
  `.marker-label` and the active treatment in
  `.scale-marker.scale-major.active .marker-label` (`styles.css`).

## Tips
1. Keep file names chronological and consistent.
2. The dial is getting dense (13+ stations on one line). If it gets too tight,
   consider grouping by year, abbreviating labels, or paginating.
3. If you replace an existing recap MP3 **in place** (same filename), run
   `./bump-cover.sh <file>.mp3` to cache-bust it — assets are served `immutable`.

---

Last updated: 2026-07-01
