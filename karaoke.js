/**
 * Karaoke Controller — syncs word-level lyrics to audio playback.
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
    if (!audio || !container) return { loadTrack() {}, destroy() {}, toggle() {} };

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
                lineEls[activeLineIndex].classList.remove('active');
            }

            if (lineIndex >= 0 && lineEls[lineIndex]) {
                lineEls[lineIndex].classList.add('active');
                lineEls[lineIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            activeLineIndex = lineIndex;
            activeWordIndex = -1; // Reset word when line changes
        }

        // Update word highlight
        if (lineIndex >= 0) {
            const lineEl = scrollRegion.querySelectorAll('.karaoke-line')[lineIndex];
            if (!lineEl) return;
            const wordEls = lineEl.querySelectorAll('.karaoke-word');

            if (wordIndex !== activeWordIndex) {
                if (activeWordIndex >= 0 && wordEls[activeWordIndex]) {
                    wordEls[activeWordIndex].classList.remove('active');
                    wordEls[activeWordIndex].classList.add('past');
                    wordEls[activeWordIndex].style.removeProperty('--word-progress');
                }
                activeWordIndex = wordIndex;

                // Mark all words before the active one as past
                for (let i = 0; i < wordEls.length; i++) {
                    if (i < wordIndex) {
                        wordEls[i].classList.add('past');
                        wordEls[i].classList.remove('active');
                    } else if (i > wordIndex) {
                        wordEls[i].classList.remove('past', 'active');
                        wordEls[i].style.removeProperty('--word-progress');
                    }
                }
            }

            // Update word progress for sweep effect
            if (wordIndex >= 0 && wordEls[wordIndex]) {
                const word = lyricsData.lines[lineIndex].words[wordIndex];
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

    async function loadTrack(slug) {
        if (!slug) slug = typeof getTrackSlug === 'function' ? getTrackSlug() : '';
        if (!slug) return;

        lyricsData = await fetchLyrics(slug);
        activeLineIndex = -1;
        activeWordIndex = -1;

        if (lyricsData && lyricsData.lines.length > 0) {
            renderLyrics(lyricsData);
            container.classList.add('has-lyrics');

            if (isActive && !audio.paused) {
                updateHighlight(audio.currentTime);
                startSync();
            }
        } else {
            if (scrollRegion) scrollRegion.innerHTML = '';
            container.classList.remove('has-lyrics');
            // If no lyrics available and karaoke is active, switch back to video
            if (isActive) {
                deactivate();
            }
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

    function toggle() {
        if (isActive) {
            deactivate();
        } else if (lyricsData && lyricsData.lines.length > 0) {
            activate();
        }
    }

    function destroy() {
        stopSync();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('seeked', onSeeked);
        if (scrollRegion) scrollRegion.innerHTML = '';
        lyricsData = null;
    }

    return { loadTrack, toggle, activate, deactivate, destroy };
}
