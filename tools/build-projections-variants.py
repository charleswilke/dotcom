"""Generate texture/motion studies from the clean SVG; standard library only.
Run after build-projections-title.py when changing the source lettering.
"""
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'images/projections'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
def tag(name):
    return f'{{{NS}}}{name}'

for name, texture, motion in [('textured', True, False), ('animated', False, True), ('combined', True, True)]:
    svg = ET.parse(ART / 'section-title-clean.svg').getroot()
    defs = svg.find(tag('defs'))
    if texture:
        # Fixed seed keeps the grain still: no shimmer or frame-by-frame noise.
        defs.append(ET.fromstring(f'''<filter xmlns="{NS}" id="surface-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="17"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>'''))
        defs.append(ET.fromstring(f'''<filter xmlns="{NS}" id="surface-light" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".012 .035" numOctaves="2" seed="8"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>'''))
        clip = ET.SubElement(defs, tag('clipPath'), id='all-letter-faces')
        for ref in ['headline', 'eyebrow']:
            ET.SubElement(clip, tag('use'), {'{http://www.w3.org/1999/xlink}href': f'#{ref}'})
        group = ET.SubElement(svg, tag('g'), {'id': 'surface-texture', 'clip-path': 'url(#all-letter-faces)', 'style': 'mix-blend-mode:multiply'})
        for filter_id, opacity in [('surface-grain', '.2'), ('surface-light', '.12')]:
            ET.SubElement(group, tag('rect'), x='70', y='80', width='1460', height='450', fill='#fff', filter=f'url(#{filter_id})', opacity=opacity)
    if motion:
        style = ET.SubElement(svg, tag('style'))
        style.text = '''
          .beam-cyan { transform-origin:57px 227px; animation:cyan-sweep 18s ease-in-out infinite; }
          .beam-amber { transform-origin:1543px 222px; animation:amber-sweep 20s ease-in-out infinite; }
          @keyframes cyan-sweep { 0%,100% { transform:rotate(-2deg); } 50% { transform:rotate(2deg); } }
          @keyframes amber-sweep { 0%,100% { transform:rotate(1.8deg); } 50% { transform:rotate(-1.8deg); } }
          @media (prefers-reduced-motion:reduce) { .beam-cyan,.beam-amber { animation:none; transform:none; } }
        '''
        for group_id in ['projection-beams', 'light-on-letters']:
            group = svg.find(f".//*[@id='{group_id}']")
            paths = list(group)
            paths[0].set('class', 'beam-cyan')
            paths[1].set('class', 'beam-amber')
            if group_id == 'projection-beams':
                group.remove(paths[2])
                for d, cls in [('M57 227L1516 543', 'beam-cyan'), ('M1543 222L84 544', 'beam-amber')]:
                    ET.SubElement(group, tag('path'), {'d':d, 'class':cls, 'fill':'none', 'stroke':'#edc777', 'stroke-opacity':'.5', 'stroke-width':'1.5'})
    svg.find(tag('desc')).text += f' {name.capitalize()} study.'
    ET.ElementTree(svg).write(ART / f'section-title-{name}.svg', encoding='unicode')
    print(f'Built {name}')
