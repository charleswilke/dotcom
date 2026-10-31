# Recently: matchbook edition

The homepage chooses equally among classic cards, screenprinted posters, and
matchbooks on each full page load. `/?recently=matchbooks#portfolio` pins this
edition for review without storing a visitor preference.

## Approved artwork

The six served WebP covers are native-size exports of their adjacent ImageGen
source PNGs (`cwebp -q 88 -m 6`, alpha preserved):

- Toast IQ: cream stock, cobalt lettering, orange retaining flap.
- The Before Times: cream stock, teal archive doorway, amber light and flap.
- Junkyard Cabaret: worn burgundy and gold, three mismatched empty chairs beneath
  a bare bulb. The center chair has a replacement back slat and bound leg.
  The image draws on Cathedral of Junk's chairs, House Lights' audience becoming
  the act, and Scarce's freely given attention. `junkyard-cabaret-proof-v5.png`
  is the approved source; earlier rejected proofs were removed.
- Grief Without Ritual: cream stock, charcoal lettering, fragmented red heart.
- Spectator to Initiator: cream stock, forest-green lettering, split seed and flower.
- Space Toots: midnight violet, cream lettering, magenta accents, orbital ship.

`paper-match-interior-v1.webp` supplies the shared fibrous paper matches.
Approved source PNGs and exact prompts remain alongside the production exports.
Prompt references document generation history; discarded drafts are not runtime
assets. The standalone concept study was removed after integration.

## Rendering and interaction

`recently-edition.js` mounts the selected inert template before the homepage's
media initializers bind. Only selected images activate, Toast IQ's selected art
is preloaded, and matchbook effects load only for this edition. Existing album
and deck trigger IDs are retained; Space Toots uses the existing game overlay.
The face, ticket, and striker form one native link, so ordinary clicks, taps,
and keyboard activation open the project immediately.

`recently-matchbooks.css` separates aligned cover and fixed flap layers. Hover
or keyboard focus lifts the cover to reveal generated matches and a gentle cast
shadow. The interior is already painted beneath the lid; its shadow moves from
96% to 84% of the interior height with the lid's 620ms timing. Matches fill the
book width and sit 20% down so their joined base tucks behind the retaining flap.

Live HTML descriptions sit on cream ticket stubs. A 30px sliver of the CTA peeks
out at rest, and hover, keyboard focus, or a swipe reveals the ticket. Reserved
height prevents grid jumps. Phones and devices without hover show full tickets.
The layout uses three columns from 1200px, two from 768px, and one below 768px.
Reduced motion removes lid, shadow, and ticket transitions.

`recently-matchbooks.js` emits sparks along real striker movement. Mouse and pen
need no click; touch requires horizontal intent. Direction and strength follow
the swipe velocity. Vertical scrolling and pinch zoom remain native. A deliberate
swipe consumes its compatibility click before album/deck handlers run; a fresh
tap and keyboard activation remain immediate.

Fine scatter, bright crackle, and trailing streak alternate between strokes.
A small neutral gray smoke puff carries some swipe momentum, slows, rises, and
fades over 850ms. Each book uses at most one temporary canvas and 140 particles;
canvases disappear when effects finish. Scroll, resize, blur, hidden tabs, and
pointer cancellation release gestures and effects. Reduced motion uses a brief
stationary glint.

The deployment build minifies the component CSS/JS and generates album share
routes from the homepage template. The enamel pin idea remains in `IDEA_BIN.md`.
