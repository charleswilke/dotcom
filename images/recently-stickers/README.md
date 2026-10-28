# Recently: mobile bumper-sticker proofs

The poster edition of the homepage uses these six stickers below 768px. At
768px and above, the same links show the full screenprinted posters and live
captions. The original card edition keeps its existing mobile presentation.
The full sticker set is also shown at `/recently-stickers-preview.html`.

| Order | Artwork | Ink colors | Category |
| --- | --- | --- | --- |
| 01 | toast-iq.webp | Cobalt and orange | AI Product |
| 02 | before-times.webp | Deep teal and amber | Pre-AI Archive |
| 03 | junkyard-cabaret.webp | Burgundy and gold | New Album |
| 04 | grief-without-ritual.webp | Charcoal and brick red | Album as Ritual |
| 05 | spectator-to-initiator.webp | Forest green and gold | Live Talk |
| 06 | space-toots.webp | Midnight violet and magenta | Void Shooter |

Generated with the built-in ImageGen tool. The approved, borderless, square-cut
Toast IQ proof (`toast-iq-proof-v2.webp`) is the shared style reference. Each
project's full screenprinted poster supplies its subject and colors. The five
new designs are recomposed for the horizontal format; the original poster art
is retained unchanged.

Each project's `.prompt.txt` records the exact prompt and generated PNG source.
The Toast IQ generation/edit history remains in `toast-iq-proof.prompt.txt` and
`toast-iq-proof-v2.prompt.txt`.

The six gallery assets are exported at 1080px wide using `cwebp -q 88 -m 6`,
with transparency preserved. That provides about three source pixels per CSS
pixel at the 340px preview width.

`/recently-stickers.css` supplies individual square cut contours, small fixed
rotations, a narrow cream rim, and close contact shadows. Artwork is centered
inside a 3.55:1 physical sticker window, cropping the transparent canvas margin
without stretching the print. There is no printed border or peeled corner.

The gallery displays two columns of phone-width stickers on larger screens and
one column on phones. Native link labels provide each project's accessible name
and action. The preview uses the site's existing Recently background and glows.

In the homepage template, each poster's `<picture>` selects the sticker source
on phones. Responsive Toast IQ preload hints match the picture breakpoint so
the desktop poster is not preloaded on mobile. Captions stay available to the
links' accessible names and descriptions while being visually hidden on phones.
The existing album, talk and game trigger elements are retained during resizing.
Mobile uses ambient section lighting; the spotlight and dust remain paused.
