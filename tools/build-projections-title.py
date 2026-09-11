"""Build the clean, outlined projection header. Requires fonttools.
Usage: python build-projections-title.py /path/to/condensed-bold.ttf
The generated SVG needs no runtime font or JavaScript.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.basePen import BasePen

font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
cap = font['OS/2'].sCapHeight

class KeystonePen(BasePen):
    """Map the headline into the registration plane, including its slight tilt.

    Top corners: (57, 227), (1543, 222).
    Bottom corners: (84, 544), (1516, 543).
    Shared outlined paths keep shadows and texture clipping aligned.
    """
    def __init__(self, output):
        super().__init__(glyphs)
        self.output = output

    def point(self, point):
        x, y = point
        u = (x - 57) / 1486
        v = (y - 224.5) / 319
        left = 57 + 27 * v
        right = 1543 - 27 * v
        top = 227 - 5 * u
        bottom = 544 - u
        return (left + (right - left) * u, top + (bottom - top) * v)

    def _moveTo(self, p):
        self.output.moveTo(self.point(p))

    def _lineTo(self, p):
        self.output.lineTo(self.point(p))

    def _curveToOne(self, p1, p2, p3):
        # Subdivide before mapping: the bilinear warp is not affine.
        p0 = self._getCurrentPoint()
        for step in range(1, 25):
            t = step / 24
            s = 1 - t
            p = tuple(s**3*p0[i] + 3*s*s*t*p1[i] + 3*s*t*t*p2[i] + t**3*p3[i] for i in (0, 1))
            self.output.lineTo(self.point(p))

    def _closePath(self):
        self.output.closePath()

    def _endPath(self):
        self.output.endPath()


def lettering(text, x, baseline, width, height, tracking=0, keystone=False):
    total = sum(glyphs[cmap[ord(c)]].width for c in text) + tracking * (len(text)-1)
    sx, sy = width/total, height/cap
    pen = SVGPathPen(glyphs, ntos=lambda value: format(value, ".3f").rstrip("0").rstrip("."))
    outline = KeystonePen(pen) if keystone else pen
    cursor = 0
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        glyph.draw(TransformPen(outline, (sx, 0, 0, -sy, x+cursor*sx, baseline)))
        cursor += glyph.width + tracking
    return pen.getCommands()

small = lettering('THEATRICAL', 480, 210, 640, 98, 190)
large = lettering('PROJECTION DESIGN', 95, 507, 1410, 260, 12, keystone=True)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="660" viewBox="0 0 1600 660" role="img" aria-labelledby="title desc">
  <title id="title">Theatrical Projection Design</title>
  <desc id="desc">Ivory condensed lettering with teal dimensional echoes, crossing amber and cyan light, and fine optical registration marks.</desc>
  <defs>
    <path id="headline" d="{large}"/>
    <path id="eyebrow" d="{small}"/>
    <clipPath id="letter-faces"><use xlink:href="#headline"/></clipPath>
    <linearGradient id="ivory" x2="0" y2="1"><stop stop-color="#fff3d4"/><stop offset="1" stop-color="#ead9ac"/></linearGradient>
    <linearGradient id="cyan"><stop stop-color="#7ee2dd" stop-opacity=".28"/><stop offset="1" stop-color="#7ee2dd" stop-opacity="0"/></linearGradient>
    <linearGradient id="amber"><stop stop-color="#efb95b" stop-opacity=".05"/><stop offset="1" stop-color="#efb95b" stop-opacity=".32"/></linearGradient>
    <!-- Fixed grain and a soft envelope dissolve only the amber spill's left edge. -->
    <linearGradient id="spill-fade" gradientUnits="userSpaceOnUse" x1="35" y1="0" x2="310" y2="0">
      <stop stop-color="white" stop-opacity="0"/><stop offset=".3" stop-color="white" stop-opacity=".12"/><stop offset="1" stop-color="white"/>
    </linearGradient>
    <linearGradient id="spill-solid" gradientUnits="userSpaceOnUse" x1="35" y1="0" x2="310" y2="0">
      <stop stop-color="white" stop-opacity="0"/><stop offset=".35" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white"/>
    </linearGradient>
    <filter id="spill-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="1" seed="23"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 7 -3"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <mask id="amber-dissolve" maskUnits="userSpaceOnUse" x="0" y="180" width="1600" height="440" style="mask-type:alpha">
      <rect x="0" y="180" width="1600" height="440" fill="url(#spill-fade)" filter="url(#spill-grain)"/>
      <rect x="0" y="180" width="1600" height="440" fill="url(#spill-solid)"/>
    </mask>
    <filter id="spill-softness" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter>
    <g id="registration" fill="none" stroke="#eeddb4" stroke-width="1.6">
      <circle r="13" opacity=".6"/><path d="M-23 0H23M0-23V23"/><circle r="3" fill="#fff3d4" stroke="none"/>
    </g>
  </defs>
  <!-- Projection fields remain separate for future motion experiments. -->
  <g id="projection-beams">
    <path d="M57 227L1534 431V561Z" fill="url(#cyan)"/>
    <path d="M1543 222L66 434V561Z" fill="url(#amber)" mask="url(#amber-dissolve)" filter="url(#spill-softness)"/>
    <path d="M57 227L1516 543M1543 222L84 544" fill="none" stroke="#edc777" stroke-opacity=".5" stroke-width="1.5"/>
  </g>
  <g id="letter-depth">
    <use xlink:href="#headline" fill="#123c50" transform="translate(15 14)"/>
    <use xlink:href="#headline" fill="#78d6d5" opacity=".5" transform="translate(-10 7)"/>
    <use xlink:href="#eyebrow" fill="#78d6d5" opacity=".3" transform="translate(-4 4)"/>
  </g>
  <g id="lettering" fill="url(#ivory)"><use xlink:href="#headline"/><use xlink:href="#eyebrow"/></g>
  <g id="light-on-letters" clip-path="url(#letter-faces)">
    <path d="M57 227L1534 431V561Z" fill="#6ad1d2" opacity=".19"/>
    <path d="M1543 222L66 434V561Z" fill="#ecae3c" opacity=".25"/>
    <path d="M430 220L640 530H700L490 220ZM1100 220L1310 530H1370L1160 220Z" fill="#fff9e7" opacity=".32"/>
  </g>
  <g id="ornaments" stroke="#eeddb4" fill="none">
    <path d="M260 169H440M1160 169H1340" stroke-width="1.5" opacity=".65"/>
    <path d="M330 177H440M1160 177H1270" opacity=".3"/>
    <path d="M730 64H777M823 64H870" opacity=".55"/>
  </g>
  <g id="registration-marks"><use xlink:href="#registration" x="800" y="64"/><use xlink:href="#registration" x="57" y="227"/><use xlink:href="#registration" x="1543" y="222"/><use xlink:href="#registration" x="84" y="544"/><use xlink:href="#registration" x="1516" y="543"/></g>
</svg>'''
out = Path(__file__).resolve().parents[1] / 'images/projections/section-title-clean.svg'
out.write_text(svg)
print(out)
