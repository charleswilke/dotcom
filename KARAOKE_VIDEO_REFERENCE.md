# Karaoke & Lyrics Video Playback - Reference Archive

This file preserves the karaoke (word-level lyric sync) and lyrics video playback code that was removed from production files. These features were built but not active in the current music player iteration. This reference exists so the code can be restored if needed.

---

## karaoke.js (standalone file - was loaded via `<script src="karaoke.js">`)

```js
/**
 * Karaoke Controller - syncs word-level lyrics to audio playback.
 * Loaded after main.js. No dependencies.
 *
 * Usage:
 *   const karaoke = createKaraokeController({
 *       audio: document.getElementById('mixtapeAudio'),
 *       container: document.getElementById('mixtapeKaraoke'),
 *       videoContainer: document.getElementById('lyricsVideoContainer'),
 *       playerContainer: document.querySelector('#mixtapeLightbox .mixtape-player-container'),
 *       getTrackSlug: () => slug,
 *       albumSlug: 'exploring-laibor-mixtape'
 *   });
 *   karaoke.loadTrack('hum-of-humanity');
 */

function createKaraokeController({ audio, container, videoContainer, playerContainer, getTrackSlug, albumSlug }) {
    if (!audio || !container) return { loadTrack() {}, destroy() {} };

    const scrollRegion = container.querySelector('.karaoke-scroll-region');
    const cache = new Map();
    let lyricsData = null;
    let activeLineIndex = -1;
    let activeWordIndex = -1;
    let rafId = null;
    let isActive = false;

    // --- Data loading ---

    async function fetchLyrics(slug) {
        if (cache.has(slug)) return cache.get(slug);

        const resolvedAlbum = typeof albumSlug === 'function' ? albumSlug() : albumSlug;
        const url = `lyrics/${resolvedAlbum}/${slug}.json`;

        try {
            const resp = await fetch(url);
            if (!resp.ok) return null;
            const data = await resp.json();
            cache.set(slug, data);
            return data;
        } catch {
            return null;
        }
    }

    // --- DOM rendering ---

    function renderLyrics(data) {
        if (!scrollRegion) return;
        scrollRegion.innerHTML = '';

        data.lines.forEach((line, li) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'karaoke-line';
            lineEl.dataset.index = li;
            lineEl.dataset.start = line.start;
            lineEl.dataset.end = line.end;

            line.words.forEach((w, wi) => {
                const span = document.createElement('span');
                span.className = 'karaoke-word';
                span.textContent = w.word;
                span.dataset.start = w.start;
                span.dataset.end = w.end;
                span.dataset.lineIndex = li;
                span.dataset.wordIndex = wi;
                lineEl.appendChild(span);

                // Add space between words
                if (wi < line.words.length - 1) {
                    lineEl.appendChild(document.createTextNode(' '));
                }
            });

            scrollRegion.appendChild(lineEl);
        });
    }

    // --- Sync engine (rAF-based) ---

    function findActiveLine(time) {
        if (!lyricsData) return -1;
        const lines = lyricsData.lines;

        // Binary search for the line containing `time`
        let lo = 0, hi = lines.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (time < lines[mid].start) {
                hi = mid - 1;
            } else if (time > lines[mid].end) {
                lo = mid + 1;
            } else {
                return mid;
            }
        }

        // If between lines, find the nearest upcoming line
        // Show the next line slightly early for a more natural feel
        if (lo < lines.length && lines[lo].start - time < 0.3) {
            return lo;
        }

        return -1;
    }

    function findActiveWord(lineIndex, time) {
        if (!lyricsData || lineIndex < 0) return -1;
        const words = lyricsData.lines[lineIndex].words;
        for (let i = 0; i < words.length; i++) {
            if (time >= words[i].start && time <= words[i].end) return i;
        }
        // If between words in the line, highlight the next word approaching
        for (let i = 0; i < words.length; i++) {
            if (time < words[i].start) {
                if (words[i].start - time < 0.15) return i;
                break;
            }
        }
        return -1;
    }

    function updateHighlight(time) {
        const lineIndex = findActiveLine(time);
        const wordIndex = lineIndex >= 0 ? findActiveWord(lineIndex, time) : -1;

        // Update line highlight
        if (lineIndex !== activeLineIndex) {
            const lineEls = scrollRegion.querySelectorAll('.karaoke-line');

            if (activeLineIndex >= 0 && lineEls[activeLineIndex]) {
                // Mark all words as fully highlighted before fading out
                const prevWords = lineEls[activeLineIndex].querySelectorAll('.karaoke-word');
                prevWords.forEach(w => {
                    w.classList.add('past');
                    w.classList.remove('active');
                    w.style.removeProperty('--word-progress');
                });
                lineEls[activeLineIndex].classList.add('completed');
                lineEls[activeLineIndex].classList.remove('active');
            }

            if (lineIndex >= 0 && lineEls[lineIndex]) {
                lineEls[lineIndex].classList.add('active');
                lineEls[lineIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            activeLineIndex = lineIndex;
            activeWordIndex = -1; // Reset word when line changes
        }

        // Update word highlight - words stay highlighted once sung (progress bar effect)
        if (lineIndex >= 0) {
            const lineEl = scrollRegion.querySelectorAll('.karaoke-line')[lineIndex];
            if (!lineEl) return;
            const wordEls = lineEl.querySelectorAll('.karaoke-word');
            const words = lyricsData.lines[lineIndex].words;

            // Find the furthest word we've reached based on time
            // (even if we're in a gap between words)
            let furthestWord = -1;
            for (let i = 0; i < words.length; i++) {
                if (time >= words[i].start) furthestWord = i;
            }

            if (wordIndex !== activeWordIndex || furthestWord !== activeWordIndex) {
                // Previous active word becomes past (fully highlighted)
                if (activeWordIndex >= 0 && wordEls[activeWordIndex]) {
                    wordEls[activeWordIndex].classList.remove('active');
                    wordEls[activeWordIndex].classList.add('past');
                    wordEls[activeWordIndex].style.removeProperty('--word-progress');
                }
                activeWordIndex = wordIndex >= 0 ? wordIndex : furthestWord;

                // All words up to the furthest reached stay highlighted as past
                for (let i = 0; i < wordEls.length; i++) {
                    if (i < furthestWord || (i === furthestWord && wordIndex < 0)) {
                        wordEls[i].classList.add('past');
                        wordEls[i].classList.remove('active');
                        wordEls[i].style.removeProperty('--word-progress');
                    } else if (i > furthestWord) {
                        wordEls[i].classList.remove('past', 'active');
                        wordEls[i].style.removeProperty('--word-progress');
                    }
                }
            }

            // Update word progress sweep on the currently active word
            if (wordIndex >= 0 && wordEls[wordIndex]) {
                const word = words[wordIndex];
                const duration = word.end - word.start;
                const progress = duration > 0 ? Math.min(1, Math.max(0, (time - word.start) / duration)) : 1;

                wordEls[wordIndex].classList.add('active');
                wordEls[wordIndex].classList.remove('past');
                wordEls[wordIndex].style.setProperty('--word-progress', progress);
            }
        }
    }

    function syncLoop() {
        if (!audio.paused && lyricsData && isActive) {
            updateHighlight(audio.currentTime);
        }
        rafId = requestAnimationFrame(syncLoop);
    }

    function startSync() {
        if (rafId) return;
        rafId = requestAnimationFrame(syncLoop);
    }

    function stopSync() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // --- Audio event listeners ---

    function onPlay() {
        if (isActive && lyricsData) startSync();
    }

    function onPause() {
        stopSync();
    }

    function onSeeked() {
        if (isActive && lyricsData) {
            // Snap highlight immediately
            activeLineIndex = -1;
            activeWordIndex = -1;
            updateHighlight(audio.currentTime);
        }
    }

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('seeked', onSeeked);

    // --- Public API ---

    async function loadTrack(slug, { defaultKaraoke = false } = {}) {
        if (!slug) slug = typeof getTrackSlug === 'function' ? getTrackSlug() : '';
        if (!slug) return;

        lyricsData = await fetchLyrics(slug);
        activeLineIndex = -1;
        activeWordIndex = -1;

        if (lyricsData && lyricsData.lines.length > 0) {
            renderLyrics(lyricsData);
            container.classList.add('has-lyrics');
            if (defaultKaraoke) {
                activate();
                if (!audio.paused) {
                    updateHighlight(audio.currentTime);
                    startSync();
                }
            } else {
                deactivate();
            }
        } else {
            if (scrollRegion) scrollRegion.innerHTML = '';
            container.classList.remove('has-lyrics');
            deactivate();
        }
    }

    function activate() {
        isActive = true;
        container.classList.add('karaoke-active');
        if (videoContainer) videoContainer.style.display = 'none';
        if (playerContainer) playerContainer.classList.add('karaoke-mode');

        if (lyricsData && !audio.paused) {
            updateHighlight(audio.currentTime);
            startSync();
        }
    }

    function deactivate() {
        isActive = false;
        stopSync();
        container.classList.remove('karaoke-active');
        if (playerContainer) playerContainer.classList.remove('karaoke-mode');

        // Restore video container visibility (let CSS .has-video handle display)
        if (videoContainer) videoContainer.style.display = '';
    }

    function destroy() {
        stopSync();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('seeked', onSeeked);
        if (scrollRegion) scrollRegion.innerHTML = '';
        lyricsData = null;
    }

    return { loadTrack, activate, deactivate, destroy };
}
```

---

## main.js functions

### syncLyricsVideoSource()

```js
function syncLyricsVideoSource(lyricsVideo, lyricsVideoContainer, track) {
    if (!lyricsVideo || !lyricsVideoContainer) return;

    const frame = track && track.lyricsVideoFrame ? track.lyricsVideoFrame : {};
    const offsetY = frame.offsetY || '15px';
    lyricsVideo.style.transform = `translate(-50%, calc(-50% + ${offsetY}))`;
    lyricsVideo.style.width = frame.width || '100%';
    lyricsVideo.style.minWidth = frame.minWidth || '100%';
    lyricsVideo.style.minHeight = frame.minHeight || '150%';
    lyricsVideo.style.objectPosition = frame.objectPosition || 'center center';

    if (track && track.video) {
        lyricsVideo.src = track.video;
        lyricsVideo.load();
        lyricsVideo.currentTime = 0;
        lyricsVideoContainer.classList.add('has-video');
    } else {
        lyricsVideo.src = '';
        lyricsVideoContainer.classList.remove('has-video');
    }
}
```

### bindLyricsVideoSync()

```js
function bindLyricsVideoSync(audio, lyricsVideo, getCurrentTrack) {
    if (!audio || !lyricsVideo) return;

    audio.addEventListener('play', () => {
        const track = getCurrentTrack();
        if (track && track.video) {
            lyricsVideo.currentTime = audio.currentTime;
            lyricsVideo.play().catch(() => {});
        }
    });

    audio.addEventListener('pause', () => {
        lyricsVideo.pause();
    });

    audio.addEventListener('seeked', () => {
        const track = getCurrentTrack();
        if (track && track.video) {
            lyricsVideo.currentTime = audio.currentTime;
        }
    });

    audio.addEventListener('timeupdate', () => {
        const track = getCurrentTrack();
        if (track && track.video && !audio.paused) {
            const drift = Math.abs(audio.currentTime - lyricsVideo.currentTime);
            if (drift > 0.3) {
                lyricsVideo.currentTime = audio.currentTime;
            }
        }
    });
}
```

### Karaoke controller initialization (Mixtape player)

```js
// Karaoke controller - auto-activates on track load
const karaokeContainer = document.getElementById('mixtapeKaraoke');
const mixtapePlayerContainer = lightbox ? lightbox.querySelector('.mixtape-player-container') : null;
const karaoke = typeof createKaraokeController === 'function' ? createKaraokeController({
    audio: audio,
    container: karaokeContainer,
    videoContainer: lyricsVideoContainer,
    playerContainer: mixtapePlayerContainer,
    getTrackSlug: () => getTrackSlug(tracks[currentIndex]),
    albumSlug: 'exploring-laibor-mixtape'
}) : null;
```

### Karaoke controller initialization (GWOR player)

```js
// Karaoke controller - auto-activates on track load
const gworKaraokeContainer = document.getElementById('gworKaraoke');
const gworPlayerContainer = lightbox ? lightbox.querySelector('.mixtape-player-container') : null;
const gworKaraoke = typeof createKaraokeController === 'function' ? createKaraokeController({
    audio: audio,
    container: gworKaraokeContainer,
    videoContainer: lyricsVideoContainer,
    playerContainer: gworPlayerContainer,
    getTrackSlug: () => getTrackSlug(tracks[currentIndex]),
    albumSlug: 'grief-without-ritual'
}) : null;
```

### GWOR karaoke default slugs

```js
const KARAOKE_DEFAULT_SLUGS = new Set(['cherish-your-confident-ire', 'letter-to-the-editor', 'dearly-beloved', 'from-the-beginning']);
gworKaraoke.loadTrack(slug, { defaultKaraoke: KARAOKE_DEFAULT_SLUGS.has(slug) });
```

### Track video/lyricsVideoFrame properties

GWOR tracks with custom lyricsVideoFrame:
```js
// From the Beginning
lyricsVideoFrame: { offsetY: '-116px', width: '152%', minWidth: '152%', minHeight: '112%', objectPosition: 'center 42%' }

// Pauses Gone
lyricsVideoFrame: { offsetY: '-116px', width: '152%', minWidth: '152%', minHeight: '112%', objectPosition: 'center 42%' }
```

Junkyard Cabaret tracks (all shared the same frame):
```js
lyricsVideoFrame: { offsetY: '-128px', width: '195%', minWidth: '195%', minHeight: '195%' }
```

All tracks had a `video` property pointing to files in `audio/{album}/` (mp4/mov).

---

## index.html elements

### Mixtape lightbox

```html
<!-- Lyric Video Display (hidden, kept for future use) -->
<div class="mixtape-lyrics-video-container" id="lyricsVideoContainer">
    <video id="lyricsVideo" class="lyrics-video" muted playsinline></video>
    <div class="lyrics-video-overlay"></div>
</div>

<!-- Karaoke Lyrics Display (hidden, kept for future use) -->
<div class="karaoke-container" id="mixtapeKaraoke">
    <div class="karaoke-scroll-region"></div>
</div>
```

### GWOR lightbox

```html
<!-- Lyric Video Display (hidden, kept for future use) -->
<div class="mixtape-lyrics-video-container" id="gworLyricsVideoContainer">
    <video id="gworLyricsVideo" class="lyrics-video" muted playsinline></video>
    <div class="lyrics-video-overlay"></div>
</div>

<!-- Karaoke Lyrics Display (hidden, kept for future use) -->
<div class="karaoke-container" id="gworKaraoke">
    <div class="karaoke-scroll-region"></div>
</div>
```

### Junkyard Cabaret lightbox

```html
<!-- Lyric Video Display (hidden, kept for future use) -->
<div class="mixtape-lyrics-video-container" id="jcLyricsVideoContainer">
    <video id="jcLyricsVideo" class="lyrics-video" muted playsinline></video>
    <div class="lyrics-video-overlay"></div>
</div>
```

### Script tag

```html
<script src="karaoke.js?v=20260328" defer></script>
```

---

## styles.css

### Lyrics Video Display (base styles, lines ~9172-9228)

```css
/* Lyrics Video Display */
.mixtape-lyrics-video-container {
    display: none;
    width: 100%;
    height: 0;
    overflow: hidden;
    border-radius: 8px;
    position: relative;
    background: rgba(10, 5, 20, 0.8);
    border: 1px solid rgba(0, 247, 194, 0.2);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.8),
        0 0 15px rgba(0, 247, 194, 0.1);
}

.mixtape-lyrics-video-container.has-video {
    display: block;
    flex: 1;
    min-height: 113px;
    margin-top: 0.4rem;
}

.lyrics-video {
    position: absolute;
    width: var(--lyrics-video-width, 100%);
    height: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, calc(-50% + var(--lyrics-video-offset-y, 15px)));
    min-height: var(--lyrics-video-min-height, 150%);
    min-width: var(--lyrics-video-min-width, 100%);
    object-fit: cover;
    object-position: var(--lyrics-video-object-position, center center);
    pointer-events: none;
}

.lyrics-video-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg,
        rgba(15, 10, 30, 0.6) 0%,
        transparent 25%,
        transparent 75%,
        rgba(15, 10, 30, 0.6) 100%
    );
    box-shadow: inset 0 0 20px rgba(0, 247, 194, 0.1);
}

@media (min-width: 768px) {
    .mixtape-lyrics-video-container.has-video {
        min-height: 162px;
    }
}
```

### Oscilloscope hide rules (lines ~9164-9169)

```css
/* Hide video/karaoke when oscilloscope is present */
.modal-oscilloscope-frame ~ .mixtape-lyrics-video-container,
.modal-oscilloscope-frame ~ .mixtape-lyrics-video-container.has-video,
.modal-oscilloscope-frame ~ .karaoke-container,
.modal-oscilloscope-frame ~ .karaoke-container.karaoke-active {
    display: none !important;
}
```

### Per-lightbox video theme overrides

```css
/* B-side */
.mixtape-lightbox.b-side-active .mixtape-lyrics-video-container {
    border-color: rgba(247, 168, 0, 0.2);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.8),
        0 0 15px rgba(247, 168, 0, 0.1);
}
.mixtape-lightbox.b-side-active .lyrics-video-overlay {
    box-shadow: inset 0 0 20px rgba(247, 168, 0, 0.1);
}

/* GWOR */
#gworLightbox .mixtape-lyrics-video-container {
    border-color: rgba(166, 52, 52, 0.26);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.82),
        0 0 14px rgba(166, 52, 52, 0.16);
}
#gworLightbox .lyrics-video-overlay {
    box-shadow: inset 0 0 20px rgba(166, 52, 52, 0.14);
}

/* Junkyard Cabaret */
#jcLightbox .mixtape-lyrics-video-container {
    border-color: rgba(194, 112, 56, 0.26);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.82),
        0 0 14px rgba(194, 112, 56, 0.16);
}
#jcLightbox .lyrics-video-overlay {
    box-shadow: inset 0 0 20px rgba(194, 112, 56, 0.14);
}
```

### Full karaoke styles block (lines ~9230-9465)

```css
/* ===== KARAOKE LYRICS ===== */

/* Karaoke container - replaces video display */
.karaoke-container {
    display: none;
    width: 100%;
    border-radius: 8px;
    position: relative;
    background: rgba(10, 5, 20, 0.9);
    border: 1px solid rgba(0, 247, 194, 0.2);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.8),
        0 0 15px rgba(0, 247, 194, 0.1);
    overflow: hidden;
}

.karaoke-container.karaoke-active {
    display: block;
    flex: 1;
    min-height: 113px;
    margin-top: 0.4rem;
}

/* Hide video when karaoke is active */
.karaoke-mode .mixtape-lyrics-video-container {
    display: none !important;
}

.karaoke-scroll-region {
    padding: 1rem 0.75rem;
    max-height: 280px;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.karaoke-scroll-region::-webkit-scrollbar {
    display: none;
}

.karaoke-line {
    text-align: center;
    padding: 0.3rem 0;
    font-size: 0.92rem;
    font-weight: 500;
    line-height: 1.5;
    opacity: 0.25;
    transition: opacity 0.4s ease;
    letter-spacing: 0.02em;
}

.karaoke-line.active {
    opacity: 1;
}

.karaoke-line.completed {
    opacity: 0.25;
}

.karaoke-line.completed .karaoke-word.past {
    background: #00f7c2;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

#gworLightbox .karaoke-line.completed .karaoke-word.past {
    background: #c54a4a;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.mixtape-lightbox.b-side-active .karaoke-line.completed .karaoke-word.past {
    background: #f7a800;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.karaoke-word {
    position: relative;
    display: inline;
    color: rgba(255, 255, 255, 0.85);
    transition: color 0.15s ease;
}

.karaoke-word.active {
    color: #00f7c2;
    text-shadow: 0 0 12px rgba(0, 247, 194, 0.6);
}

.karaoke-line.active .karaoke-word {
    background: linear-gradient(
        90deg,
        #00f7c2 0%,
        #00f7c2 calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
}

.karaoke-line.active .karaoke-word.active {
    filter: drop-shadow(0 0 8px rgba(0, 247, 194, 0.4));
}

.karaoke-line.active .karaoke-word.past {
    background: #00f7c2;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 6px rgba(0, 247, 194, 0.3));
}

/* GWOR karaoke theme */
#gworLightbox .karaoke-container {
    border-color: rgba(166, 52, 52, 0.26);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.82),
        0 0 14px rgba(166, 52, 52, 0.16);
}

#gworLightbox .karaoke-word.active {
    color: #c54a4a;
    text-shadow: 0 0 12px rgba(197, 74, 74, 0.6);
}

#gworLightbox .karaoke-line.active .karaoke-word {
    background: linear-gradient(
        90deg,
        #c54a4a 0%,
        #c54a4a calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
}

#gworLightbox .karaoke-line.active .karaoke-word.active {
    filter: drop-shadow(0 0 8px rgba(197, 74, 74, 0.4));
}

#gworLightbox .karaoke-line.active .karaoke-word.past {
    background: #c54a4a;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 6px rgba(197, 74, 74, 0.3));
}

/* B-side karaoke theme */
.mixtape-lightbox.b-side-active .karaoke-container {
    border-color: rgba(247, 168, 0, 0.2);
    box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.8),
        0 0 15px rgba(247, 168, 0, 0.1);
}

.mixtape-lightbox.b-side-active .karaoke-word.active {
    color: #f7a800;
    text-shadow: 0 0 12px rgba(247, 168, 0, 0.6);
}

.mixtape-lightbox.b-side-active .karaoke-line.active .karaoke-word {
    background: linear-gradient(
        90deg,
        #f7a800 0%,
        #f7a800 calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) calc(var(--word-progress, 0) * 100%),
        rgba(255, 255, 255, 0.85) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
}

.mixtape-lightbox.b-side-active .karaoke-line.active .karaoke-word.active {
    filter: drop-shadow(0 0 8px rgba(247, 168, 0, 0.4));
}

.mixtape-lightbox.b-side-active .karaoke-line.active .karaoke-word.past {
    background: #f7a800;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 6px rgba(247, 168, 0, 0.3));
}

/* Desktop karaoke sizing */
@media (min-width: 768px) {
    .karaoke-container.karaoke-active {
        min-height: 162px;
        max-height: 162px;
    }
    .karaoke-scroll-region {
        max-height: 130px;
    }
}

/* Mobile karaoke */
@media (max-width: 768px) {
    .karaoke-container.karaoke-active {
        min-height: 0;
    }
    .karaoke-scroll-region {
        padding: 0.6rem 0.5rem;
        max-height: 6.5rem;
    }
    .karaoke-line {
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .karaoke-scroll-region {
        max-height: 5.8rem;
        padding: 0.5rem 0.4rem;
    }
    .karaoke-line {
        font-size: 0.78rem;
    }
}
```
