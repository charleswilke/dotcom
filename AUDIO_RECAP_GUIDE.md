# Audio Recap Time Dial - User Guide

## Overview
The Time Dial feature allows visitors to "turn back time" and listen to past audio recaps of your Substack articles. It features a vintage radio dial aesthetic with an interactive rotating needle.

## How It Works

### Current Implementation
- **October 2024** - Latest recap at the top (0° position)
- **Aug-Sept 2024** - Previous recap at the bottom (180° position)

### User Interactions
1. **Click/Tap** - Cycles to the next recap
2. **Drag** - Rotate the dial to any position; it will snap to the nearest recap
3. **Mobile Swipe** - Touch and drag to rotate the dial

### Visual Feedback
- The needle rotates smoothly to the selected position
- Date display updates with a fade effect
- Dial glows when a new station is selected
- Audio automatically switches to the selected recap
- If audio was playing, it continues playing the new selection

## Adding New Recaps

When you create a new monthly/periodic recap, follow these steps:

### 1. Add the Audio File
Place your new MP3 file in the `/audio/` directory:
```
audio/
  ├── nov-substack-recap.mp3  (new file)
  ├── oct-substack-recap.mp3
  └── aug-sept-substack-summary.mp3
```

### 2. Update the JavaScript Configuration
Open `index.html` and find the `recapStations` array (around line 838):

```javascript
const recapStations = [
    {
        angle: 0,        // Top position (most recent)
        date: 'November 2024',
        file: 'audio/nov-substack-recap.mp3',
        label: 'NOV \'24'
    },
    {
        angle: 90,       // Right position
        date: 'October 2024',
        file: 'audio/oct-substack-recap.mp3',
        label: 'OCT \'24'
    },
    {
        angle: 180,      // Bottom position
        date: 'Aug-Sept 2024',
        file: 'audio/aug-sept-substack-summary.mp3',
        label: 'AUG-SEP \'24'
    }
];
```

**Angle Guidelines:**
- `0°` = Top (12 o'clock) - Most recent
- `90°` = Right (3 o'clock)
- `180°` = Bottom (6 o'clock)
- `270°` = Left (9 o'clock)
- For 2 items: Use 0° and 180°
- For 3 items: Use 0°, 120°, and 240°
- For 4 items: Use 0°, 90°, 180°, and 270°

### 3. Update the SVG Tick Marks
In the same file, update the dial visual tick marks (around line 191):

```html
<g id="dial-ticks">
    <!-- November 2024 at 0° (top) -->
    <line x1="100" y1="30" x2="100" y2="40" 
          stroke="#00f7c2" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- October 2024 at 90° (right) -->
    <line x1="170" y1="100" x2="160" y2="100" 
          stroke="#00f7c2" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    
    <!-- Aug-Sept 2024 at 180° (bottom) -->
    <line x1="100" y1="170" x2="100" y2="160" 
          stroke="#00f7c2" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
</g>
```

**Tick Mark Positions (for 200x200 viewBox, center at 100,100):**
- 0° (top): `x1="100" y1="30" x2="100" y2="40"`
- 90° (right): `x1="170" y1="100" x2="160" y2="100"`
- 180° (bottom): `x1="100" y1="170" x2="100" y2="160"`
- 270° (left): `x1="30" y1="100" x2="40" y2="100"`

### 4. Update the Dial Labels
Update the label divs (around line 220):

```html
<div class="dial-label dial-label-top">NOV '24</div>
<div class="dial-label dial-label-right">OCT '24</div>
<div class="dial-label dial-label-bottom">AUG-SEP '24</div>
```

Add corresponding CSS classes if needed for right/left positions:

```css
.dial-label-right {
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.7;
}

.dial-label-left {
    left: 5px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.7;
}
```

### 5. Update Default Display
Change the default date shown (around line 179):

```html
<span class="summary-date" id="current-recap-date">November 2024</span>
```

And update the default audio source (around line 228):

```html
<audio id="recap-audio" class="custom-audio" 
       src="audio/nov-substack-recap.mp3" preload="metadata" style="display:none;">
</audio>
```

## Design Philosophy

The Time Dial embraces a retro-futuristic aesthetic that matches your site's overall design:
- **Neon cyan (#00f7c2)** - Your signature neon color
- **Glowing effects** - Subtle shadows and filters for depth
- **Smooth animations** - Cubic bezier easing for satisfying interactions
- **Responsive** - Works on desktop, tablet, and mobile

## Tips for Best Experience

1. **Keep recaps organized** - Name files chronologically (e.g., `2024-11-recap.mp3`)
2. **Limit quantity** - 4-6 recaps works best visually
3. **Archive old recaps** - Consider removing very old entries or creating an archive page
4. **Consistent naming** - Use a consistent date format in labels

## Future Enhancements

Potential ideas for expanding the feature:
- Add year rings for multi-year archives
- Include episode thumbnails
- Add playback speed controls
- Show duration badges on each station
- Animate static/noise effects between stations
- Add keyboard shortcuts (arrow keys to navigate)

---

Created: October 27, 2024
Last Updated: October 27, 2024

