/** Main JavaScript for charleswilke.com index page */

// Pre-computed SVG fallback placeholder (used when article images fail to load)
const FALLBACK_SVG_B64 = btoa('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2c4f7c;stop-opacity:1" /><stop offset="100%" style="stop-color:#1a1550;stop-opacity:1" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="800" height="400" fill="url(#grad)"/><g fill="#00f7c2" filter="url(#glow)"><path d="M100,200 L200,100 L300,200 L400,100 L500,200 L600,100 L700,200" stroke="#00f7c2" stroke-width="4" fill="none"/><circle cx="400" cy="200" r="50"/><text x="400" y="200" font-family="monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">l.ai.bor</text></g></svg>');
const FALLBACK_SVG = 'data:image/svg+xml;base64,' + FALLBACK_SVG_B64;
const TOTAL_RSS_ITEMS = 19; // 1 spotlight + 18 grid cards for an even 2-column ending

// Function to properly decode all HTML entities
function decodeHtmlEntities(text) {
    if (!text) return '';
    // Create a temporary DOM element to decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
}

// Centralized DOM-ready queue to avoid many independent DOMContentLoaded listeners.
const readyCallbacks = [];
function onReady(callback) {
    readyCallbacks.push(callback);
}
document.addEventListener('DOMContentLoaded', () => {
    readyCallbacks.forEach(callback => callback());
});

// Masonry layout for the showcase grid (preserves source order, packs into shortest column)
onReady(() => {
    const grid = document.querySelector('.showcase-grid');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll(':scope > .showcase-item'));
    if (!items.length) return;

    function getColumnCount() {
        const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean);
        return tracks.length || 1;
    }

    function getGap() {
        const cs = getComputedStyle(grid);
        const raw = cs.rowGap && cs.rowGap !== 'normal' ? cs.rowGap : cs.gap;
        return parseFloat(raw) || 0;
    }

    function reset() {
        grid.classList.remove('is-masonry');
        grid.style.height = '';
        items.forEach(item => {
            item.style.width = '';
            item.style.top = '';
            item.style.left = '';
        });
    }

    function layout() {
        const cols = getColumnCount();
        if (cols < 2) { reset(); return; }
        // Measure before flipping to masonry so column width is from the real grid layout.
        // Use offsetWidth (not getBoundingClientRect) so the float animation's rotation
        // doesn't inflate the reading — otherwise the baked-in width feeds the
        // ResizeObserver and the cards grow a little on every layout pass.
        const probe = items[0];
        const colWidth = probe.offsetWidth;
        const gap = getGap();
        grid.classList.add('is-masonry');
        const colHeights = new Array(cols).fill(0);
        const placements = items.map(item => {
            item.style.width = `${colWidth}px`;
            const shortest = colHeights.indexOf(Math.min(...colHeights));
            const top = colHeights[shortest];
            colHeights[shortest] = top + item.offsetHeight + gap;
            return { item, col: shortest, top };
        });
        // Column total heights (without trailing gap).
        const colTotals = colHeights.map(h => Math.max(0, h - gap));
        const maxHeight = Math.max(...colTotals);
        // Vertically center each column's stack within the tallest column.
        placements.forEach(({ item, col, top }) => {
            const offset = (maxHeight - colTotals[col]) / 2;
            item.style.left = `${col * (colWidth + gap)}px`;
            item.style.top = `${top + offset}px`;
        });
        grid.style.height = `${maxHeight}px`;
    }

    let rafId = 0;
    function scheduleLayout() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(layout);
    }

    layout();
    // Re-run once images report dimensions (natural aspect ratios can shift heights).
    grid.querySelectorAll('img').forEach(img => {
        if (!img.complete) img.addEventListener('load', scheduleLayout, { once: true });
    });
    window.addEventListener('resize', scheduleLayout);
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(scheduleLayout);
        items.forEach(item => ro.observe(item));
    }
});

// Warp starfield for the games section — stars fly outward from a central
// vanishing point so it reads as accelerating toward the horizon.
onReady(() => {
    const section = document.getElementById('game-cartridges');
    const canvas = section && section.querySelector('.cartridge-starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STAR_COLORS = ['255, 255, 255', '255, 255, 255', '255, 255, 255', '0, 247, 194', '229, 0, 203'];
    const SPEED = 0.084;       // depth units per second (gentle drift)
    const MAX_TRAIL = 6;       // cap streak length so a fresh star never draws across the screen

    let w = 0, h = 0, cx = 0, cy = 0, dpr = 1;
    let stars = [];
    let rafId = 0;
    let lastTs = 0;
    let running = false;

    function spawn(star) {
        star.x = (Math.random() * 2 - 1);
        star.y = (Math.random() * 2 - 1);
        star.z = Math.random() * 0.7 + 0.3;
        star.color = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
        star.px = null;
        star.py = null;
        return star;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        if (!w || !h) return;
        cx = w / 2;
        cy = h / 2;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const target = Math.min(320, Math.round((w * h) / 5200));
        if (stars.length < target) {
            while (stars.length < target) stars.push(spawn({}));
        } else {
            stars.length = target;
        }
    }

    function project(star) {
        return { sx: cx + (star.x / star.z) * cx, sy: cy + (star.y / star.z) * cy };
    }

    function render(dt) {
        ctx.clearRect(0, 0, w, h);
        for (const star of stars) {
            star.z -= SPEED * dt;
            if (star.z <= 0.02) {
                spawn(star);
                star.z = 1;
            }
            const { sx, sy } = project(star);
            const depth = 1 - star.z;            // 0 (far) → 1 (near)
            const size = depth * 1.8 + 0.4;
            const alpha = Math.min(1, depth * 1.1 + 0.1);
            if (star.px !== null) {
                let dx = sx - star.px;
                let dy = sy - star.py;
                const len = Math.hypot(dx, dy);
                if (len > MAX_TRAIL) {
                    const s = MAX_TRAIL / len;
                    dx *= s; dy *= s;
                }
                ctx.strokeStyle = `rgba(${star.color}, ${alpha * 0.55})`;
                ctx.lineWidth = size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sx - dx, sy - dy);
                ctx.lineTo(sx, sy);
                ctx.stroke();
            }
            ctx.fillStyle = `rgba(${star.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
            star.px = sx;
            star.py = sy;
        }
    }

    function frame(ts) {
        if (!running) return;
        const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
        lastTs = ts;
        render(dt);
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running || !w || !h) return;
        running = true;
        lastTs = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
    }

    resize();
    window.addEventListener('resize', () => {
        resize();
        if (reduceMotion) render(0);
    });

    if (reduceMotion) {
        // Static frame: nudge stars apart once so it isn't an empty void.
        for (const star of stars) star.z = Math.random() * 0.7 + 0.3;
        render(0);
        return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) start(); else stop();
            }
        }, { threshold: 0 });
        io.observe(section);
    } else {
        start();
    }
});

function scheduleIdleWork(callback, timeout = 2000) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout });
        return;
    }
    window.setTimeout(callback, Math.min(timeout, 250));
}

function createLazyInitializer(initializer) {
    let initialized = false;
    let instance;
    return function ensureInitialized() {
        if (!initialized) {
            initialized = true;
            instance = initializer();
        }
        return instance;
    };
}

const managedAudioPlayers = new Set();

function registerManagedAudio(audio) {
    if (audio) {
        managedAudioPlayers.add(audio);
        attachPlayTracker(audio);
    }
    return audio;
}

const PLAY_TRACK_THRESHOLD_SEC = 15;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

function parsePlayTarget(src) {
    if (!src) return null;
    let path;
    try { path = new URL(src, window.location.href).pathname; } catch { return null; }
    const match = path.match(/\/audio\/(?:([^/]+)\/)?([^/]+)\.(?:mp3|mp4|mov|m4a|wav)$/i);
    if (!match) return null;
    const album = (match[1] || 'recaps').toLowerCase();
    const slug = match[2].toLowerCase();
    if (!SLUG_RE.test(album) || !SLUG_RE.test(slug)) return null;
    return { album, slug };
}

const reportedPlayKeys = new Set();

function sendPlayBeacon(target) {
    const key = `${target.album}/${target.slug}`;
    if (reportedPlayKeys.has(key)) return;
    reportedPlayKeys.add(key);
    const payload = JSON.stringify(target);
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            if (navigator.sendBeacon('/api/play', blob)) return;
        }
        fetch('/api/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => {});
    } catch { /* ignore */ }
}

function attachPlayTracker(audio) {
    if (!audio || audio.dataset.playTrackerAttached === '1') return;
    audio.dataset.playTrackerAttached = '1';
    let armed = false;
    audio.addEventListener('play', () => { armed = true; });
    audio.addEventListener('timeupdate', () => {
        if (!armed || audio.currentTime < PLAY_TRACK_THRESHOLD_SEC) return;
        armed = false;
        const target = parsePlayTarget(audio.currentSrc || audio.src);
        if (target) sendPlayBeacon(target);
    });
    audio.addEventListener('loadstart', () => {
        armed = false;
    });
}

function pauseManagedAudioExcept(currentAudio) {
    managedAudioPlayers.forEach(audio => {
        if (audio !== currentAudio) {
            audio.pause();
        }
    });
}

function seekAudioToClientX(audio, rect, clientX) {
    if (!audio || !rect || !rect.width || !audio.duration) return false;
    const clickX = clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickPercent * audio.duration;
    if (isNaN(newTime) || newTime < 0) return false;
    audio.currentTime = newTime;
    return true;
}

function setupProgressScrubbing(progressContainer, audio) {
    if (!progressContainer || !audio) return;

    progressContainer.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const rect = progressContainer.getBoundingClientRect();
        if (!audio.duration) return;

        const wasPlaying = !audio.paused;
        if (wasPlaying) {
            audio.pause();
        }

        if (seekAudioToClientX(audio, rect, e.clientX) && wasPlaying) {
            setTimeout(() => {
                audio.play().catch(err => console.error('Failed to resume playback:', err));
            }, 50);
        }
    });

    progressContainer.addEventListener('mousedown', function(e) {
        e.preventDefault();

        const rect = progressContainer.getBoundingClientRect();
        const wasPlaying = !audio.paused;
        let isDragging = true;

        if (wasPlaying) {
            audio.pause();
        }

        const scrub = function(event) {
            if (audio.duration) {
                seekAudioToClientX(audio, rect, event.clientX);
            }
        };

        scrub(e);

        const handleMouseMove = function(event) {
            if (isDragging) {
                scrub(event);
            }
        };

        const handleMouseUp = function() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (wasPlaying) {
                setTimeout(() => {
                    audio.play().catch(err => console.error('Failed to resume playback after drag:', err));
                }, 50);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

const effectTimerIds = new Set();

function scheduleEffectTimeout(callback, delay) {
    const timerId = window.setTimeout(() => {
        effectTimerIds.delete(timerId);
        if (document.hidden) {
            scheduleEffectTimeout(callback, 1000);
            return;
        }
        callback();
    }, delay);

    effectTimerIds.add(timerId);
    return timerId;
}

function extractFeedImage(item) {
    if (!item) return FALLBACK_SVG;
    if (item.thumbnail) return item.thumbnail;

    const markup = item.content || item.description || '';
    const imgMatch = markup.match(/<img[^>]+src="([^">]+)"/i);
    return imgMatch ? imgMatch[1] : FALLBACK_SVG;
}

function createFeedExcerpt(item) {
    const description = decodeHtmlEntities(item && item.description ? item.description : '')
        .replace(/<[^>]*>/g, '')
        .trim();

    return {
        cleanDescription: description,
        shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : '')
    };
}

// ===== ARTICLE READER =====
// Open Substack articles inline using the full content from the RSS feed,
// rendered with site typography instead of jumping out to substack.com.

function slugifyArticle(item) {
    if (item && item.link) {
        const m = item.link.match(/\/p\/([^/?#]+)/);
        if (m) return m[1];
    }
    const title = (item && item.title) ? item.title : 'article';
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const SUBSTACK_BASE = 'https://charleswilke.substack.com';
const ARTICLE_READER_PATH_PREFIX = '/read/';

function getArticleSharePath(itemOrSlug) {
    const slug = typeof itemOrSlug === 'string' ? itemOrSlug : slugifyArticle(itemOrSlug);
    return `${ARTICLE_READER_PATH_PREFIX}${encodeURIComponent(slug)}`;
}

function getCurrentRelativeUrl() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
}

function decodeArticleSlug(value) {
    try {
        return decodeURIComponent(value);
    } catch (e) {
        return value;
    }
}

function getArticleRouteFromLocation() {
    const pathMatch = window.location.pathname.match(/^\/read\/([^/?#]+)/);
    if (pathMatch) {
        return { slug: decodeArticleSlug(pathMatch[1]), source: 'path' };
    }

    const hashMatch = (window.location.hash || '').match(/^#read\/(.+)$/);
    if (hashMatch) {
        return { slug: decodeArticleSlug(hashMatch[1]), source: 'hash' };
    }

    return null;
}

function getArticleReaderReturnUrl() {
    return getArticleRouteFromLocation() ? '/#writing' : getCurrentRelativeUrl();
}

function _formatScopeTime(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function createScopePlayer(audioSrc, label) {
    const el = document.createElement('div');
    el.className = 'scope-player';
    el.innerHTML = `
        <div class="scope-controls">
            <button type="button" class="scope-play" aria-label="Play">
                <span class="scope-icon-play">&#9654;</span>
                <span class="scope-icon-pause">&#10074;&#10074;</span>
            </button>
            <span class="scope-label">${label || 'Narration'}</span>
            <span class="scope-time-current">0:00</span>
            <input type="range" class="scope-scrub" min="0" max="0" value="0" step="0.1" aria-label="Seek">
            <span class="scope-time-total">0:00</span>
        </div>
        <audio class="scope-audio" preload="metadata"></audio>
    `;

    const audio = el.querySelector('audio');
    audio.src = audioSrc;
    const playBtn = el.querySelector('.scope-play');
    const scrub = el.querySelector('.scope-scrub');
    const tCur = el.querySelector('.scope-time-current');
    const tTot = el.querySelector('.scope-time-total');
    const updateScrubProgress = () => {
        const max = parseFloat(scrub.max) || 0;
        const value = parseFloat(scrub.value) || 0;
        const progress = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
        scrub.style.setProperty('--scope-progress', `${progress}%`);
    };

    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(err => console.warn('[scope] play failed:', err));
        } else {
            audio.pause();
        }
    });
    audio.addEventListener('play', () => {
        // Pause sibling scope players.
        document.querySelectorAll('.scope-player.is-playing').forEach(other => {
            if (other !== el) {
                const otherAudio = other.querySelector('audio');
                if (otherAudio) otherAudio.pause();
            }
        });
        el.classList.add('is-playing');
        playBtn.setAttribute('aria-label', 'Pause');
    });
    audio.addEventListener('pause', () => {
        el.classList.remove('is-playing');
        playBtn.setAttribute('aria-label', 'Play');
    });
    audio.addEventListener('loadedmetadata', () => {
        tTot.textContent = _formatScopeTime(audio.duration);
        scrub.max = audio.duration || 0;
        updateScrubProgress();
    });
    audio.addEventListener('timeupdate', () => {
        tCur.textContent = _formatScopeTime(audio.currentTime);
        if (!scrub.matches(':active')) {
            scrub.value = audio.currentTime;
            updateScrubProgress();
        }
    });
    scrub.addEventListener('input', () => {
        audio.currentTime = parseFloat(scrub.value) || 0;
        updateScrubProgress();
    });

    return el;
}

function hydrateNativeMedia(root) {
    // Replace Substack placeholder divs with playable elements pointed at
    // /api/v1/{audio|video}/upload/<id>/src on the publication's domain.
    // Audio gets the oscilloscope-glass scope player; video gets a plain element.
    root.querySelectorAll('.native-audio-embed').forEach(el => {
        let id = '';
        try { id = (JSON.parse(el.getAttribute('data-attrs') || '{}') || {}).mediaUploadId; } catch (e) { /* ignore */ }
        if (!id) { el.remove(); return; }
        const src = `${SUBSTACK_BASE}/api/v1/audio/upload/${id}/src`;
        el.replaceWith(createScopePlayer(src, 'Recap'));
    });

    root.querySelectorAll('.native-video-embed').forEach(el => {
        let id = '';
        try { id = (JSON.parse(el.getAttribute('data-attrs') || '{}') || {}).mediaUploadId; } catch (e) { /* ignore */ }
        if (!id) { el.remove(); return; }
        const src = `${SUBSTACK_BASE}/api/v1/video/upload/${id}/src`;
        const v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.preload = 'metadata';
        v.setAttribute('playsinline', '');
        v.className = 'article-reader-video';
        el.replaceWith(v);
    });
}

function sanitizeArticleHtml(html) {
    const doc = document.implementation.createHTMLDocument('article');
    doc.body.innerHTML = html || '';

    // Remove Substack chrome that doesn't belong on our site.
    const killSelectors = [
        '.subscription-widget-wrap',
        '.subscription-widget',
        '.subscribe-widget',
        '.button-wrapper',
        '.image-link-expand',
        '.image2-inset-overlay',
        '.restack-image',
        '.pencraft.pc-display-flex',
        'img[src*="/open?"]',
        'img[src*="/p-open?"]',
        'img[width="1"]',
        'img[height="1"]'
    ];
    killSelectors.forEach(sel => doc.body.querySelectorAll(sel).forEach(el => el.remove()));

    // Normalize all links to open externally and drop tracking params.
    doc.body.querySelectorAll('a[href]').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
    });

    // Drop noisy inline event handlers and styles from Substack markup.
    doc.body.querySelectorAll('*').forEach(el => {
        for (const attr of [...el.attributes]) {
            if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
        }
    });

    // Make sure images lazy-load and degrade gracefully.
    doc.body.querySelectorAll('img').forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
    });

    return doc.body.innerHTML;
}

function ensureReaderOverlay() {
    let overlay = document.getElementById('article-reader-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'article-reader-overlay';
    overlay.className = 'article-reader-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Article reader');
    overlay.innerHTML = `
        <article class="article-reader-shell" tabindex="-1">
            <div class="article-reader-topbar">
                <span class="reader-lead">
                    <span class="reader-source">exploring <span class="reader-break">l.ai.bor</span></span>
                    <span class="reader-sep">//</span>
                    <a class="substack-link" href="#" target="_blank" rel="noopener noreferrer">Read on <span class="link-break">Substack &rarr;</span></a>
                </span>
                <span class="reader-actions">
                    <button type="button" class="article-reader-close" aria-label="Close article">&times;</button>
                </span>
            </div>
            <div class="article-reader-scroll-wrap">
                <div class="article-reader-scroll-area">
                    <header class="article-reader-header">
                        <h1 class="article-reader-title"></h1>
                        <div class="article-reader-meta-row">
                            <p class="article-reader-subtitle"></p>
                            <div class="article-reader-byline">
                                <div class="byline-meta">
                                    <span class="byline-name">Charles Wilke</span>
                                    <span class="byline-date"></span>
                                </div>
                                <img class="byline-avatar" src="/images/cw4.webp" alt="Charles Wilke" width="40" height="40" loading="lazy" decoding="async">
                            </div>
                        </div>
                        <div class="article-reader-tags"></div>
                    </header>
                    <div class="article-reader-body"></div>
                    <footer class="article-reader-footer">
                        <p>Originally published on Substack —
                            <a class="footer-substack-link" href="#" target="_blank" rel="noopener noreferrer">view comments &amp; subscribe</a>
                        </p>
                    </footer>
                </div>
                <div class="article-reader-rail" aria-hidden="true"></div>
                <div class="article-reader-thumb" aria-hidden="true"></div>
            </div>
        </article>
    `;
    document.body.appendChild(overlay);

    // Topbar actions
    overlay.querySelector('.article-reader-close').addEventListener('click', closeArticleReader);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeArticleReader();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
            closeArticleReader();
        }
    });

    // Swap the "exploring l.ai.bor" topbar text for the article title once the
    // header scrolls behind the topbar. The inner scroll-area is the scroll root.
    const titleEl = overlay.querySelector('.article-reader-title');
    const scrollArea = overlay.querySelector('.article-reader-scroll-area');
    if (titleEl && scrollArea && typeof IntersectionObserver !== 'undefined') {
        const titleObserver = new IntersectionObserver((entries) => {
            if (!overlay.classList.contains('is-open')) return;
            for (const entry of entries) {
                const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
                const aboveTopbar = !entry.isIntersecting && entry.boundingClientRect.bottom < rootTop;
                setReaderHeaderMode(overlay, aboveTopbar ? 'title' : 'brand');
            }
        }, {
            root: scrollArea,
            threshold: 0,
        });
        titleObserver.observe(titleEl);
    }

    // Custom scroll thumb with tick rail behind: native scrollbar is hidden so
    // the article header and featured image render full-bleed. Header z-index
    // covers the thumb at the top; the thumb emerges as content scrolls past.
    const thumbEl = overlay.querySelector('.article-reader-thumb');
    const railEl = overlay.querySelector('.article-reader-rail');
    if (scrollArea && thumbEl) {
        const THUMB_MIN = 60;
        let thumbDragActive = false;
        const updateThumb = () => {
            const sh = scrollArea.scrollHeight;
            const ch = scrollArea.clientHeight;
            if (sh <= ch) {
                thumbEl.style.display = 'none';
                if (railEl) railEl.style.backgroundPositionY = '';
                return;
            }
            thumbEl.style.display = '';
            const thumbH = Math.max(THUMB_MIN, ch * (ch / sh));
            const trackLen = ch - thumbH;
            const maxScroll = sh - ch;
            const top = (scrollArea.scrollTop / maxScroll) * trackLen;
            thumbEl.style.height = thumbH + 'px';
            thumbEl.style.top = top + 'px';
            if (railEl) {
                const offset = -(scrollArea.scrollTop % 24);
                railEl.style.backgroundPositionY = `${offset}px, ${offset}px`;
            }
        };
        let raf = 0;
        scrollArea.addEventListener('scroll', () => {
            if (thumbDragActive) return;
            if (raf) return;
            raf = requestAnimationFrame(() => { raf = 0; updateThumb(); });
        }, { passive: true });
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(updateThumb).observe(scrollArea);
        }
        overlay._updateReaderThumb = updateThumb;

        // Drag to scroll, with squash/stretch & touch-prime animations (ported
        // from common.js .tuner-thumb).
        const attachDrag = (el) => {
            let dragging = false;
            let activePointerId = null;
            let startY = 0;
            let startScroll = 0;
            let primeTimer = null;
            let primed = false;
            let moved = false;
            let dragRaf = 0;
            let pendingScroll = 0;
            const applyDragFrame = () => {
                const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
                scrollArea.scrollTop = Math.max(0, Math.min(maxScroll, pendingScroll));
                updateThumb();
                dragRaf = 0;
            };
            const scheduleDragFrame = (scrollTop) => {
                pendingScroll = scrollTop;
                if (dragRaf) return;
                dragRaf = requestAnimationFrame(applyDragFrame);
            };
            const handleMove = (e) => {
                if (!dragging) return;
                if (e.pointerId !== undefined && activePointerId !== null && e.pointerId !== activePointerId) return;
                e.preventDefault();
                const dy = e.clientY - startY;
                const ch = scrollArea.clientHeight;
                const sh = scrollArea.scrollHeight;
                const thumbH = el.offsetHeight;
                const trackLen = ch - thumbH;
                const maxScroll = sh - ch;
                if (trackLen <= 0 || maxScroll <= 0) return;
                if (!moved && Math.abs(dy) > 1) {
                    moved = true;
                    el.classList.add('is-scrolling');
                }
                scheduleDragFrame(startScroll + (dy / trackLen) * maxScroll);
            };
            const stop = (e = {}) => {
                if (!dragging) return;
                if (e.pointerId !== undefined && activePointerId !== null && e.pointerId !== activePointerId) return;
                dragging = false;
                thumbDragActive = false;
                clearTimeout(primeTimer);
                if (dragRaf) { cancelAnimationFrame(dragRaf); applyDragFrame(); }
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', stop);
                window.removeEventListener('pointercancel', stop);
                window.removeEventListener('blur', stop);
                el.classList.remove('is-dragging');
                el.classList.remove('is-touching');
                el.classList.remove('is-scrolling');
                if (primed) {
                    primed = false;
                    el.classList.remove('is-primed');
                    el.classList.remove('is-settling');
                    void el.offsetWidth;
                    el.classList.add('is-touch-release');
                } else if (moved) {
                    el.classList.remove('is-settling');
                    el.classList.remove('is-touch-release');
                    void el.offsetWidth;
                    el.classList.add('is-settling');
                }
                if (activePointerId !== null) {
                    try { el.releasePointerCapture(activePointerId); } catch (_) {}
                    activePointerId = null;
                }
                requestAnimationFrame(updateThumb);
            };
            el.addEventListener('pointerdown', (e) => {
                if (dragging) stop();
                dragging = true;
                thumbDragActive = true;
                activePointerId = e.pointerId;
                primed = false;
                moved = false;
                startY = e.clientY;
                startScroll = scrollArea.scrollTop;
                el.classList.add('is-dragging');
                try { el.setPointerCapture(e.pointerId); } catch (_) {}
                window.addEventListener('pointermove', handleMove, { passive: false });
                window.addEventListener('pointerup', stop);
                window.addEventListener('pointercancel', stop);
                window.addEventListener('blur', stop);
                if (e.pointerType === 'touch') {
                    el.classList.add('is-touching');
                    clearTimeout(primeTimer);
                    primeTimer = setTimeout(() => {
                        if (!dragging) return;
                        primed = true;
                        el.classList.add('is-primed');
                    }, 160);
                }
                e.preventDefault();
            });
            el.addEventListener('animationend', () => {
                el.classList.remove('is-settling');
                el.classList.remove('is-touch-release');
            });
        };
        attachDrag(thumbEl);
    }


    return overlay;
}

function setReaderHeaderMode(overlay, mode) {
    const topbar = overlay.querySelector('.article-reader-topbar');
    const sourceEl = overlay.querySelector('.reader-source');
    if (!topbar || !sourceEl) return;
    if (topbar.dataset.headerMode === mode) return;
    topbar.dataset.headerMode = mode;
    topbar.classList.toggle('is-title-mode', mode === 'title');

    sourceEl.classList.add('is-fading');
    setTimeout(() => {
        if (topbar.dataset.headerMode !== mode) return;
        if (mode === 'title') {
            const titleEl = overlay.querySelector('.article-reader-title');
            sourceEl.textContent = titleEl ? titleEl.textContent : '';
        } else {
            sourceEl.innerHTML = 'exploring <span class="reader-break">l.ai.bor</span>';
        }
        requestAnimationFrame(() => {
            sourceEl.classList.remove('is-fading');
        });
    }, 180);
}

let _readerPrevUrl = '';

function openArticleReader(item, options = {}) {
    if (!item || !(item.content || item.description)) return false;

    const overlay = ensureReaderOverlay();
    const wasOpen = overlay.classList.contains('is-open');
    const shell = overlay.querySelector('.article-reader-shell');
    const titleEl = overlay.querySelector('.article-reader-title');
    const subtitleEl = overlay.querySelector('.article-reader-subtitle');
    const tagsEl = overlay.querySelector('.article-reader-tags');
    const bylineDateEl = overlay.querySelector('.byline-date');
    const bodyEl = overlay.querySelector('.article-reader-body');
    const topLink = overlay.querySelector('.substack-link');
    const footLink = overlay.querySelector('.footer-substack-link');

    titleEl.textContent = decodeHtmlEntities(item.title || 'Untitled');

    const subtitle = decodeHtmlEntities((item.cleanDescription || item.description || '').replace(/<[^>]*>/g, '').trim());
    subtitleEl.textContent = subtitle;
    subtitleEl.style.display = subtitle ? '' : 'none';

    const pubDate = item.pubDate ? new Date(item.pubDate) : null;
    const dateStr = pubDate && !isNaN(pubDate)
        ? pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase()
        : '';
    bylineDateEl.textContent = dateStr;
    tagsEl.innerHTML = '';

    bodyEl.innerHTML = sanitizeArticleHtml(item.content || item.description || '');
    hydrateNativeMedia(bodyEl);
    bodyEl.querySelectorAll('p').forEach(p => {
        const txt = p.textContent.replace(/\s+/g, '');
        if (/^[-‐-―−]{3,}$/.test(txt)) {
            p.replaceWith(document.createElement('hr'));
        }
    });
    bodyEl.querySelectorAll('hr').forEach(hr => {
        const row = document.createElement('div');
        row.className = 'article-reader-signal';
        row.setAttribute('role', 'separator');
        for (let i = 0; i < 5; i++) row.appendChild(document.createElement('span'));
        hr.replaceWith(row);
    });

    if (item.link) {
        topLink.href = item.link;
        footLink.href = item.link;
    }

    const slug = slugifyArticle(item);
    if (!wasOpen) {
        _readerPrevUrl = getArticleReaderReturnUrl();
    }

    if (options.syncUrl !== false) {
        const sharePath = getArticleSharePath(slug);
        const currentUrl = getCurrentRelativeUrl();
        const method = options.replaceUrl ? 'replaceState' : 'pushState';
        try {
            if (currentUrl !== sharePath) {
                history[method]({ reader: slug }, '', sharePath);
            }
        } catch (e) { /* ignore */ }
    }

    overlay.classList.add('is-open');
    document.body.classList.add('reader-open');
    overlay.scrollTop = 0;
    const scrollArea = overlay.querySelector('.article-reader-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;
    if (typeof overlay._updateReaderThumb === 'function') {
        requestAnimationFrame(overlay._updateReaderThumb);
    }
    // Force brand state on (re)open so the prior article's title doesn't briefly linger.
    const topbar = overlay.querySelector('.article-reader-topbar');
    if (topbar) {
        delete topbar.dataset.headerMode;
        topbar.classList.remove('is-title-mode');
        const sourceEl = overlay.querySelector('.reader-source');
        if (sourceEl) {
            sourceEl.classList.remove('is-fading');
            sourceEl.innerHTML = 'exploring <span class="reader-break">l.ai.bor</span>';
        }
    }
    setTimeout(() => shell.focus(), 50);
    return true;
}

function closeArticleReader() {
    const overlay = document.getElementById('article-reader-overlay');
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('reader-open');
    if (getArticleRouteFromLocation()) {
        try {
            history.replaceState(null, '', _readerPrevUrl || '/#writing');
        } catch (e) { /* ignore */ }
    }
    _readerPrevUrl = '';
}

function findItemBySlug(slug) {
    if (!slug || !Array.isArray(allItems)) return null;
    return allItems.find(it => slugifyArticle(it) === slug) || null;
}

function maybeOpenReaderFromLocation() {
    const route = getArticleRouteFromLocation();
    if (!route) return;

    const item = findItemBySlug(route.slug);
    if (item) {
        openArticleReader(item, { replaceUrl: route.source === 'hash' });
    }
}

window.addEventListener('popstate', () => {
    if (getArticleRouteFromLocation()) {
        maybeOpenReaderFromLocation();
    } else {
        const overlay = document.getElementById('article-reader-overlay');
        if (overlay && overlay.classList.contains('is-open')) {
            overlay.classList.remove('is-open');
            document.body.classList.remove('reader-open');
            _readerPrevUrl = '';
        }
    }
});

function normalizeFeedItems(items) {
    return sortItemsByNewest(items).slice(0, TOTAL_RSS_ITEMS).map(item => {
        const excerpt = createFeedExcerpt(item);
        return {
            ...item,
            displayImage: extractFeedImage(item),
            cleanDescription: excerpt.cleanDescription,
            shortDescription: excerpt.shortDescription
        };
    });
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fade-in sections on scroll using IntersectionObserver (performant)
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            sectionObserver.unobserve(entry.target); // Stop observing once visible
        }
    });
}, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
document.querySelectorAll('section').forEach(section => sectionObserver.observe(section));

// RSS Feed functionality
let currentItems = 0;
let allItems = [];
let isLoading = false;
const ITEMS_PER_PAGE = 12;
let isArchiveMode = false;
const RSS_CACHE_KEY = 'charleswilke:rss-feed:v3';
const RSS_CACHE_TTL_MS = 30 * 60 * 1000;
let rssIntersectionObserver = null;

function sortItemsByNewest(items) {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
        const aTime = a && a.pubDate ? Date.parse(a.pubDate) : 0;
        const bTime = b && b.pubDate ? Date.parse(b.pubDate) : 0;
        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });
}

function readCachedFeedItems() {
    try {
        const cached = sessionStorage.getItem(RSS_CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (!parsed || !Array.isArray(parsed.items) || !parsed.timestamp || !parsed.version) {
            return null;
        }

        if (parsed.version !== 3) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if ((Date.now() - parsed.timestamp) > RSS_CACHE_TTL_MS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if (parsed.limit !== TOTAL_RSS_ITEMS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if (parsed.items.length > TOTAL_RSS_ITEMS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        return parsed;
    } catch (error) {
        return null;
    }
}

function writeCachedFeedItems(items, source = 'unknown') {
    try {
        sessionStorage.setItem(RSS_CACHE_KEY, JSON.stringify({
            version: 3,
            timestamp: Date.now(),
            limit: TOTAL_RSS_ITEMS,
            source,
            items
        }));
    } catch (error) {
        // Ignore storage failures (private mode, quota, etc.)
    }
}

function logFeedAttempt(stage, details = {}) {
    console.log(`[RSS] ${stage}`, details);
}

function renderFeedItems(items, feedContent) {
    allItems = normalizeFeedItems(items);
    currentItems = 0;
    isArchiveMode = false;

    if (feedContent) {
        feedContent.innerHTML = '';
    }

    populateLatestArticleSpotlight();
    displayItems(ITEMS_PER_PAGE);
    maybeOpenReaderFromLocation();
}

async function fetchRSSFeed() {
    if (isLoading) return;
    isLoading = true;
    
    // Show loading indicator immediately
    const feedContent = document.getElementById('feed-content');
    if (feedContent) {
        feedContent.innerHTML = '<div class="feed-item loading-placeholder"><h3>Loading latest articles...</h3></div>';
    }
    
    let success = false;

    const cachedFeed = readCachedFeedItems();
    if (cachedFeed && cachedFeed.items.length > 0) {
        logFeedAttempt('session-cache-hit', {
            itemCount: cachedFeed.items.length,
            source: cachedFeed.source
        });
        renderFeedItems(cachedFeed.items, feedContent);
        isLoading = false;
        return;
    }
    logFeedAttempt('session-cache-miss');
    
    try {
        // Primary endpoint: Vercel serverless function
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            try {
                logFeedAttempt('primary-fetch-start', { url: `/api/substack-feed?limit=${TOTAL_RSS_ITEMS}` });
                const response = await fetch(`/api/substack-feed?limit=${TOTAL_RSS_ITEMS}`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                logFeedAttempt('primary-fetch-response', {
                    ok: response.ok,
                    status: response.status,
                    contentType: response.headers.get('content-type')
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.status === 'ok' && data.items && data.items.length > 0) {
                        writeCachedFeedItems(data.items, 'primary');
                        renderFeedItems(data.items, feedContent);
                        logFeedAttempt('primary-fetch-success', { itemCount: allItems.length });
                        success = true;
                    } else {
                        console.warn('[RSS] Primary endpoint returned invalid data structure', {
                            status: data && data.status,
                            hasItemsArray: !!(data && data.items),
                            itemCount: data && Array.isArray(data.items) ? data.items.length : 0
                        });
                    }
                } else {
                    console.warn('[RSS] Primary endpoint returned non-OK response', {
                        status: response.status,
                        statusText: response.statusText
                    });
                }
            } catch(cacheErr) {
                console.warn('[RSS] Primary endpoint failed:', cacheErr);
            }
        }
        
        // Fallback: Direct RSS2JSON (only if cache failed)
        if (!success) {
            try {
                logFeedAttempt('rss2json-fallback-start');
                const fallbackUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + 
                    encodeURIComponent('https://charleswilke.substack.com/feed') + `&count=${TOTAL_RSS_ITEMS}`;
                
                const response = await fetch(fallbackUrl, {
                    cache: 'default',
                    headers: { 'Accept': 'application/json' }
                });
                logFeedAttempt('rss2json-fallback-response', {
                    ok: response.ok,
                    status: response.status
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.status === 'ok' && data.items && data.items.length > 0) {
                        writeCachedFeedItems(data.items, 'rss2json');
                        renderFeedItems(data.items, feedContent);
                        logFeedAttempt('rss2json-fallback-success', { itemCount: allItems.length });
                        success = true;
                    }
                }
            } catch(fallbackErr) {
                console.warn('[RSS] RSS2JSON fallback failed:', fallbackErr);
            }
        }
        
        // Last resort: XML parsing
        if (!success) {
            try {
                logFeedAttempt('xml-fallback-start');
                const xmlItems = await fetchRssXmlFallback();
                if (xmlItems && xmlItems.length > 0) {
                    writeCachedFeedItems(xmlItems, 'xml');
                    renderFeedItems(xmlItems, feedContent);
                    logFeedAttempt('xml-fallback-success', { itemCount: allItems.length });
                    success = true;
                }
            } catch (xmlErr) {
                console.warn('[RSS] XML fallback failed:', xmlErr);
            }
        }

    } catch (error) {
        console.error('All RSS feed attempts failed:', error);
    }

    // Local-dev fallback: if all live sources failed, load the on-disk cache.
    // Lets the inline reader and cards be developed without the Vercel API.
    if (!success) {
        try {
            logFeedAttempt('local-cache-fallback-start');
            const res = await fetch('/cache_substack_feed.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.items) && data.items.length > 0) {
                    renderFeedItems(data.items, feedContent);
                    logFeedAttempt('local-cache-fallback-success', { itemCount: allItems.length });
                    success = true;
                }
            }
        } catch (localErr) {
            console.warn('[RSS] Local cache fallback failed:', localErr);
        }
    }

    // Handle complete failure
    if (!success) {
        if (feedContent) {
            feedContent.innerHTML = `
                <div class="feed-item error-state">
                    <h3>Unable to load articles</h3>
                    <p>Please visit <a href="https://charleswilke.substack.com" target="_blank" rel="noopener noreferrer">exploring l.ai.bor</a> directly to read the latest posts.</p>
                </div>
            `;
        }
    }
    
    isLoading = false;
}

function populateLatestArticleSpotlight() {
    if (!allItems || allItems.length === 0) return;
    
    const latestItem = allItems[0]; // First item is the latest
    const spotlight = document.getElementById('latest-article-spotlight');
    const spotlightSection = spotlight.querySelector('.spotlight-production');
    const spotlightImg = spotlight.querySelector('.spotlight-featured-image');
    const spotlightTitle = spotlight.querySelector('.spotlight-title');
    const spotlightDescription = spotlight.querySelector('.spotlight-description');
    const spotlightDate = spotlight.querySelector('.spotlight-date');
    const spotlightTagsContainer = spotlight.querySelector('.spotlight-tags-container');
    const spotlightTags = spotlight.querySelector('.spotlight-tags');
    
    // Make the entire section clickable — open inline reader when we have content.
    spotlight.style.cursor = 'pointer';
    spotlight.addEventListener('click', (e) => {
        if (latestItem.content && openArticleReader(latestItem)) {
            e.preventDefault();
            return;
        }
        window.open(latestItem.link, '_blank', 'noopener,noreferrer');
    });
    
    // Set the image and handle sizing
    spotlightImg.src = latestItem.displayImage || FALLBACK_SVG;
    spotlightImg.alt = latestItem.title;
    
    // Adjust card height based on image aspect ratio
    spotlightImg.onload = function() {
        const aspectRatio = this.naturalWidth / this.naturalHeight;
        // More generous height calculation to prevent cropping - increased range for taller card
        const baseHeight = Math.max(420, Math.min(580, 480 / aspectRatio));
        spotlightSection.style.height = baseHeight + 'px';
    };
    
    // Set the title
    spotlightTitle.textContent = latestItem.title;
    
    // Set the description (shorter for compact design)
    // First decode HTML entities properly, then strip HTML tags
    spotlightDescription.textContent = latestItem.shortDescription || '';
    
    // Set the date
    const pubDate = new Date(latestItem.pubDate);
    spotlightDate.textContent = pubDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Show the spotlight
    spotlight.style.display = 'block';
}

function displayItems(count) {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent || !allItems.length) return;

    // Index 0 is reserved for the spotlight card.
    const startIndex = currentItems + 1;
    const endIndex = Math.min(startIndex + count, allItems.length);
    if (startIndex >= endIndex) {
        isArchiveMode = true;
        updateDynamicButton();
        return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
        const item = allItems[i];
        const title = item.title;
        const link = item.content ? getArticleSharePath(item) : item.link;
        const pubDate = new Date(item.pubDate);
        
        const feedItem = document.createElement('a');
        feedItem.className = 'feed-item';
        feedItem.href = link;
        feedItem.target = '_blank';
        feedItem.rel = 'noopener noreferrer';
        feedItem.innerHTML = `
            <img src="${item.displayImage || FALLBACK_SVG}" alt="${title}" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,${FALLBACK_SVG_B64}'">
            <h3>${title}</h3>
            <p>${item.shortDescription || ''}</p>
            <div class="date">${pubDate.toLocaleDateString()}</div>
        `;
        feedItem.addEventListener('click', (e) => {
            if (item.content && openArticleReader(item)) {
                e.preventDefault();
            }
        });

        fragment.appendChild(feedItem);
    }

    feedContent.appendChild(fragment);
    currentItems += (endIndex - startIndex);
    isArchiveMode = currentItems >= (allItems.length - 1);
    updateDynamicButton();
}

// Function to update the dynamic button state
function updateDynamicButton() {
    const dynamicBtn = document.getElementById('dynamicButton');
    if (!dynamicBtn) return;

    if (currentItems < allItems.length - 1) {
        dynamicBtn.textContent = 'Load more';
        dynamicBtn.className = 'load-more-btn';
        dynamicBtn.onclick = () => displayItems(ITEMS_PER_PAGE);
        return;
    }

    dynamicBtn.innerHTML = 'Full Archive <span class="arrow" aria-hidden="true">&rarr;</span>';
    dynamicBtn.className = 'archive-btn';
    dynamicBtn.onclick = () => {
        window.open('https://charleswilke.substack.com/archive?sort=new', '_blank', 'noopener,noreferrer');
    };
}

// Fallback: parse RSS XML manually (via AllOrigins proxy) if rss2json fails
async function fetchRssXmlFallback() {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://charleswilke.substack.com/feed');
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('AllOrigins error ' + res.status);
    const json = await res.json();
    const xmlString = json.contents;
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).map(node => {
        const get = sel => (node.querySelector(sel) ? node.querySelector(sel).textContent : '');
        const title = get('title');
        const link = get('link');
        const descriptionHtml = get('description');
        // Use getElementsByTagNameNS for reliable content:encoded extraction
        const contentEl = node.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0];
        const contentEncoded = contentEl ? contentEl.textContent : get('content\\:encoded');
        const description = contentEncoded || descriptionHtml || '';
        const pubDate = get('pubDate');
        // Try to find first image URL in content/description
        let thumbnail = '';
        const imgMatch = description.match(/<img[^>]+src="([^">]+)"/i)
            || description.match(/<img[^>]+src='([^'>]+)'/i);
        if (imgMatch) thumbnail = imgMatch[1];
        // Also check media:thumbnail and enclosure as fallbacks
        if (!thumbnail) {
            const mediaThumb = node.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
            if (mediaThumb) thumbnail = mediaThumb.getAttribute('url') || '';
        }
        if (!thumbnail) {
            const enclosure = node.querySelector('enclosure[type^="image"]');
            if (enclosure) thumbnail = enclosure.getAttribute('url') || '';
        }
        
        // Extract categories from RSS
        const categories = [];
        const categoryNodes = node.querySelectorAll('category');
        categoryNodes.forEach(catNode => {
            if (catNode.textContent.trim()) {
                categories.push(catNode.textContent.trim());
            }
        });
        
        return { title, link, description, pubDate, thumbnail, content: description, categories };
    });
    return items;
}

// Skip RSS calls on localhost/file audits to avoid noisy fetch failures.
const shouldFetchRSS = !['localhost', '127.0.0.1'].includes(location.hostname) && location.protocol !== 'file:';

function initRSSFallbackFetch() {
    if (!shouldFetchRSS) return;
    const rssSection = document.querySelector('.rss-feed');
    if (!rssSection) return;

    const loadFeed = () => {
        if (rssIntersectionObserver) {
            rssIntersectionObserver.disconnect();
            rssIntersectionObserver = null;
        }

        if (!isLoading && allItems.length === 0) {
            fetchRSSFeed();
        }
    };

    if (getArticleRouteFromLocation()) {
        loadFeed();
        return;
    }

    rssIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
            loadFeed();
        }
    }, { rootMargin: '250px 0px' });

    rssIntersectionObserver.observe(rssSection);
    scheduleIdleWork(loadFeed, 4000);
}

// Time Dial Functionality
function initTimeDial() {
    const recapStations = [
        {
            angle: 40,
            date: 'Q3 2023',
            file: 'audio/q3-2023-substack-recap.mp3',
            label: 'Q3 \'23'
        },
        {
            angle: 80,
            date: 'Q4 2023',
            file: 'audio/q4-2023-substack-recap.mp3',
            label: 'Q4 \'23'
        },
        {
            angle: 120,
            date: 'H1 2024',
            file: 'audio/h1-2024-substack-recap.mp3',
            label: 'H1 \'24'
        },
        {
            angle: 160,
            date: 'H2 2024',
            file: 'audio/h2-2024-substack-recap.mp3',
            label: 'H2 \'24'
        },
        {
            angle: 200,
            date: 'Q3 2025',
            file: 'audio/aug-sept-substack-summary.mp3',
            label: 'Q3 \'25'
        },
        {
            angle: 240,
            date: 'October 2025',
            file: 'audio/oct-substack-recap.mp3',
            label: 'OCT \'25'
        },
        {
            angle: 280,
            date: 'November 2025',
            file: 'audio/nov-2025-substack-recap.mp3',
            label: 'NOV \'25'
        },
        {
            angle: 320,
            date: 'December 2025',
            file: 'audio/dec-2025-substack-recap.mp3',
            label: 'DEC \'25'
        },
        {
            angle: 0,
            date: 'January 2026',
            file: 'audio/jan-2026-substack-recap.mp3',
            label: 'JAN \'26'
        },
        {
            angle: 20,
            date: 'February 2026',
            file: 'audio/feb-2026-substack-recap.mp3',
            label: 'FEB \'26'
        },
        {
            angle: 40,
            date: 'March 2026',
            file: 'audio/mar-2026-substack-recap.mp3',
            label: 'MAR \'26'
        },
        {
            angle: 60,
            date: 'April 2026',
            file: 'audio/april-2026-substack-recap.mp3',
            label: 'APR \'26'
        }
    ];
    
    // Radio tuning sound effects
    const tuningSounds = [
        'audio/radio_tuning1.mp3',
        'audio/radio_tuning2.mp3',
        'audio/radio_tuning3.mp3',
        'audio/radio_tuning4.mp3',
        'audio/radio_tuning5.mp3',
        'audio/radio_tuning6.mp3',
        'audio/radio_tuning7.mp3',
        'audio/radio_tuning8.mp3',
        'audio/radio_tuning9.mp3'
    ];
    
    let currentStation = 11; // Start at station 11 (Apr '26)
    const oscilloscopeCanvas = document.getElementById('recap-oscilloscope');
    const dateDisplay = document.getElementById('current-recap-date');
    const recapAudio = document.getElementById('recap-audio');
    attachPlayTracker(recapAudio);
    const tunerGlass = document.querySelector('.tuner-glass');
    const tunerIndicator = document.getElementById('tuner-indicator');
    const scaleMarkers = Array.from(document.querySelectorAll('.scale-marker.scale-major'));
    const clickableMarkers = Array.from(document.querySelectorAll('.scale-marker.scale-clickable'));
    let scrollAccumulator = 0; // Accumulate scroll for stepping
    const SCROLL_THRESHOLD = 50; // Pixels of scroll needed to change station
    let tunerMarkerPositions = [];
    
    // Create audio element for tuning sounds
    const tuningAudio = new Audio();
    tuningAudio.volume = 0.4; // Set volume to 40% so it's not too loud

    function cacheTunerMarkerPositions() {
        if (!tunerGlass || !scaleMarkers.length) return;
        const tunerRect = tunerGlass.getBoundingClientRect();
        tunerMarkerPositions = scaleMarkers.map(marker => {
            const markerRect = marker.getBoundingClientRect();
            return markerRect.left - tunerRect.left + (markerRect.width / 2);
        });
    }
    
    function playRandomTuningSound() {
        const randomIndex = Math.floor(Math.random() * tuningSounds.length);
        tuningAudio.src = tuningSounds[randomIndex];
        tuningAudio.currentTime = 0;
        tuningAudio.play().catch(e => console.log('Tuning sound play prevented:', e));
    }
    
    function updateStation(stationIndex) {
        if (stationIndex === currentStation) return;
        
        const station = recapStations[stationIndex];
        const previousStation = currentStation;
        currentStation = stationIndex;
        
        // Play random tuning sound effect
        playRandomTuningSound();
        
        // ===== CRT VISUAL EFFECTS =====
        // 1. Add static noise during tuning
        if (tunerGlass) {
            tunerGlass.classList.add('tuning');
            setTimeout(() => tunerGlass.classList.remove('tuning'), 600);
        }
        
        // 2. Add tuning glow to indicator
        if (tunerIndicator) {
            tunerIndicator.classList.add('tuning');
            setTimeout(() => tunerIndicator.classList.remove('tuning'), 400);
        }
        
        // 3. Phosphor decay on previous marker
        if (scaleMarkers[previousStation]) {
            scaleMarkers[previousStation].classList.add('phosphor-decay');
            setTimeout(() => {
                scaleMarkers[previousStation].classList.remove('phosphor-decay');
            }, 1200);
        }
        
        // 4. Vacuum tube warmup + signal locking on new marker
        if (scaleMarkers[stationIndex]) {
            scaleMarkers[stationIndex].classList.add('warming-up', 'signal-locking');
            setTimeout(() => {
                scaleMarkers[stationIndex].classList.remove('warming-up', 'signal-locking');
            }, 600);
        }
        // ===== END CRT EFFECTS =====
        
        // Update tuner indicator position
        updateTunerIndicator(stationIndex);
        
        // Update date display with glitch effect
        dateDisplay.style.opacity = '0';
        dateDisplay.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            dateDisplay.textContent = station.date;
            dateDisplay.style.opacity = '1';
            dateDisplay.style.transform = 'translateY(0)';
            // Update oscilloscope meta date too
            var oscDate = document.getElementById('oscilloscope-recap-date');
            if (oscDate) oscDate.textContent = station.date;
        }, 150);
        
        // Pause current audio and switch source
        if (recapAudio) {
            const wasPlaying = !recapAudio.paused;
            recapAudio.pause();
            recapAudio.src = station.file;
            recapAudio.load();
            
            // If it was playing, resume after a brief moment
            if (wasPlaying) {
                setTimeout(() => {
                    recapAudio.play().catch(e => console.log('Autoplay prevented'));
                }, 200);
            }
        }
        
    }
    
    function updateTunerIndicator(stationIndex) {
        if (!tunerIndicator || !tunerGlass) return;
        
        // Remove active class from all markers (but don't remove phosphor-decay, that's handled separately)
        scaleMarkers.forEach(marker => marker.classList.remove('active'));

        if (!tunerMarkerPositions.length) {
            cacheTunerMarkerPositions();
        }

        const targetMarker = scaleMarkers[stationIndex];
        const leftPosition = tunerMarkerPositions[stationIndex];
        if (targetMarker && typeof leftPosition === 'number') {
            tunerIndicator.style.left = leftPosition + 'px';
            targetMarker.classList.add('active');
        }
    }
    
    function updateTunerIndicatorByAngle(angle) {
        const tunerIndicator = document.getElementById('tuner-indicator');
        const tunerGlass = document.querySelector('.tuner-glass');
        
        if (!tunerIndicator || !tunerGlass) return;
        
        // Map the knob angle to the tuner display (left to right)
        // Station angles: H1'24=45Â°, H2'24=135Â°, Q3'25=225Â°, Oct'25=315Â°
        // Tuner wraps around: 315Â°-360Â° and 0Â°-45Â° both map to the full scale
        
        const tunerWidth = tunerGlass.offsetWidth;
        const padding = 20;
        const availableWidth = tunerWidth - (2 * padding);
        
        // Normalize angle to 0-360 range
        let normalizedAngle = angle % 360;
        if (normalizedAngle < 0) normalizedAngle += 360;
        
        // Map angle to progress (0-1) across the tuner scale
        // The tuner shows a continuous range wrapping around the full 360Â°
        // We want the full tuner width to represent the full rotation
        let progress;
        
        if (normalizedAngle >= 45 && normalizedAngle <= 315) {
            // Main range: 45Â° to 315Â° maps to left-to-right across tuner
            progress = (normalizedAngle - 45) / 270;
        } else if (normalizedAngle > 315) {
            // Between 315Â° and 360Â°: wraps back toward left side
            // Map 315-360 (45Â° range) to continue past 1.0 and wrap to 0
            const degreesOver = normalizedAngle - 315;
            const wrapProgress = degreesOver / 90; // 90Â° total wrap zone (315-360 + 0-45)
            progress = 1 + (wrapProgress * 0.167); // Go slightly past 1.0, then wrap
            if (progress > 1.167) progress -= 1.167; // Wrap around
        } else {
            // Between 0Â° and 45Â°: continuation from the wrap
            const degreesIn = normalizedAngle;
            progress = (degreesIn / 90) * 0.167; // Maps 0-45Â° to start of scale
        }
        
        // Clamp progress between 0 and 1 to stay within tuner bounds
        progress = Math.max(0, Math.min(1, progress));
        
        const leftPosition = padding + (availableWidth * progress);
        tunerIndicator.style.left = leftPosition + 'px';
    }
    
    // Handle scroll/wheel events
    function handleScroll(e) {
        e.preventDefault();
        
        // Get scroll delta (normalize across browsers)
        const delta = e.deltaY || e.detail || -e.wheelDelta;
        
        // Accumulate scroll
        scrollAccumulator += delta;
        
        // Check if we've scrolled enough to change station
        if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
            const direction = scrollAccumulator > 0 ? 1 : -1; // Down = forward, Up = backward
            
            // Calculate new station (wrapping around)
            let newStation = currentStation + direction;
            if (newStation < 0) newStation = recapStations.length - 1;
            if (newStation >= recapStations.length) newStation = 0;
            
            // Update station
            updateStation(newStation);
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
            
            // Reset accumulator (keep remainder for smooth feel)
            scrollAccumulator = scrollAccumulator % SCROLL_THRESHOLD;
        }
    }
    
    // Scroll/swipe tuning removed — was hijacking page scroll when crossing the dial.
    // Stations are selected via the period markers (click/touch) below.

    // Oscilloscope visualizer
    (function initOscilloscope() {
        if (!oscilloscopeCanvas || !recapAudio) return;

        const ctx = oscilloscopeCanvas.getContext('2d');
        let audioCtx = null;
        let analyserNode = null;
        let timeData = null;
        let oscAnimId = null;
        let initialized = false;

        function initAudio() {
            if (initialized) return;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyserNode = audioCtx.createAnalyser();
                analyserNode.fftSize = 256;
                analyserNode.smoothingTimeConstant = 0.6;
                timeData = new Uint8Array(analyserNode.fftSize);
                const source = audioCtx.createMediaElementSource(recapAudio);
                source.connect(analyserNode);
                analyserNode.connect(audioCtx.destination);
                initialized = true;
            } catch (e) {
                // Fallback: will draw idle line
            }
        }

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const rect = oscilloscopeCanvas.getBoundingClientRect();
            oscilloscopeCanvas.width = rect.width * dpr;
            oscilloscopeCanvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawGraticule(w, h) {
            var divX = 10, divY = 8;
            var cellW = w / divX, cellH = h / divY;
            var tickLen = 3, subTicks = 5;

            // Major grid lines
            ctx.strokeStyle = 'rgba(255, 190, 60, 0.12)';
            ctx.lineWidth = 0.5;
            for (var ix = 1; ix < divX; ix++) {
                var x = ix * cellW;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (var iy = 1; iy < divY; iy++) {
                var y = iy * cellH;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Subtick marks along center horizontal axis
            ctx.strokeStyle = 'rgba(255, 190, 60, 0.18)';
            ctx.lineWidth = 0.5;
            var midY = h / 2;
            for (var ix = 0; ix < divX; ix++) {
                for (var s = 1; s < subTicks; s++) {
                    var sx = ix * cellW + s * (cellW / subTicks);
                    ctx.beginPath();
                    ctx.moveTo(sx, midY - tickLen);
                    ctx.lineTo(sx, midY + tickLen);
                    ctx.stroke();
                }
            }

            // Subtick marks along center vertical axis
            var midX = w / 2;
            for (var iy = 0; iy < divY; iy++) {
                for (var s = 1; s < subTicks; s++) {
                    var sy = iy * cellH + s * (cellH / subTicks);
                    ctx.beginPath();
                    ctx.moveTo(midX - tickLen, sy);
                    ctx.lineTo(midX + tickLen, sy);
                    ctx.stroke();
                }
            }

            // Brighter center crosshair
            ctx.strokeStyle = 'rgba(255, 190, 60, 0.2)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, midY);
            ctx.lineTo(w, midY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(midX, 0);
            ctx.lineTo(midX, h);
            ctx.stroke();
        }

        function drawFrame() {
            var w = oscilloscopeCanvas.getBoundingClientRect().width;
            var h = oscilloscopeCanvas.getBoundingClientRect().height;
            var isPlaying = !recapAudio.paused;

            ctx.clearRect(0, 0, w, h);

            // Graticule
            drawGraticule(w, h);

            // Waveform trace
            ctx.beginPath();
            ctx.strokeStyle = '#ffc94a';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 190, 60, 0.9)';
            ctx.shadowBlur = 10;

            if (isPlaying && analyserNode && timeData) {
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                analyserNode.getByteTimeDomainData(timeData);
                var sliceWidth = w / timeData.length;
                var x = 0;
                var gain = 3.0; // Amplify signal for wider display
                var mid = h / 2;
                for (var i = 0; i < timeData.length; i++) {
                    var v = (timeData[i] / 128.0) - 1.0; // Center around 0
                    var y = mid + (v * mid * gain); // Amplified displacement
                    // Soft clamp to keep within bounds
                    y = Math.max(2, Math.min(h - 2, y));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
            } else {
                // Idle: flat trace with subtle noise
                var mid = h / 2;
                for (var x = 0; x < w; x++) {
                    var noise = (Math.random() - 0.5) * 1.5;
                    if (x === 0) ctx.moveTo(x, mid + noise);
                    else ctx.lineTo(x, mid + noise);
                }
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            oscAnimId = requestAnimationFrame(drawFrame);
        }

        recapAudio.addEventListener('play', function() {
            if (!initialized) initAudio();
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        drawFrame();
    })();

    // Initialize date display transition and current station
    dateDisplay.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    cacheTunerMarkerPositions();
    window.addEventListener('resize', cacheTunerMarkerPositions);
    
    // Initialize station (date display, audio source, etc.)
    updateStation(11);

    // Initialize tuner indicator position
    setTimeout(() => {
        updateTunerIndicator(11);
    }, 100);
    
    // Add click handlers to clickable scale markers
    clickableMarkers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            const stationIndex = parseInt(this.getAttribute('data-station'));
            if (!isNaN(stationIndex) && stationIndex !== currentStation) {
                updateStation(stationIndex);

                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(20);
                }
            }
        });
        
        // Add hover effect for touch devices
        marker.addEventListener('touchstart', function() {
            this.style.transform = 'scale(1.05)';
        }, { passive: true });
        
        marker.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        }, { passive: true });
    });
}


// Lightbox functionality
let currentImageIndex = 0;
let currentImageSet = [];
const imageSets = {
    'jb': [
        'images/jb/jb1.webp',
        'images/jb/jb2.webp',
        'images/jb/jb3.webp',
        'images/jb/jb4.webp',
        'images/jb/jb5.webp',
        'images/jb/jb6.webp',
        'images/jb/jb7.webp',
        'images/jb/jb8.webp',
        'images/jb/jb9.webp',
        'images/jb/jb10.webp',
        'images/jb/jb11.webp',
        'images/jb/jb12.webp'
    ],
    'aiw': [
        'images/aiw/aiw1.webp',
        'images/aiw/aiw2.webp',
        'images/aiw/aiw3.webp',
        'images/aiw/aiw4.webp',
        'images/aiw/aiw5.webp',
        'images/aiw/aiw6.webp',
        'images/aiw/aiw7.webp',
        'images/aiw/aiw8.webp',
        'images/aiw/aiw9.webp',
        'images/aiw/aiw10.webp',
        'images/aiw/aiw11.webp',
        'images/aiw/aiw12.webp',
        'images/aiw/aiw13.webp',
        'images/aiw/aiw14.webp',
        'images/aiw/aiw15.webp',
        'images/aiw/aiw16.webp'
    ],
    'fv': ['images/fv1.webp'],
    'dogs': ['images/doc_resist.webp', 'images/astro-justhappy2behere.webp']
};

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    
    // Determine which set the image belongs to
    let setKey = '';
    if (imageSrc.includes('jb/')) {
        setKey = 'jb';
    } else if (imageSrc.includes('aiw/')) {
        setKey = 'aiw';
    } else if (imageSrc.includes('doc_resist.webp') || imageSrc.includes('astro-justhappy2behere.webp')) {
        setKey = 'dogs';
    } else {
        setKey = 'fv';
    }
    
    currentImageSet = imageSets[setKey];
    currentImageIndex = currentImageSet.indexOf(imageSrc);
    
    lightboxImg.src = imageSrc;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = ''; document.documentElement.style.overflow = '';
}

function navigateLightbox(direction) {
    currentImageIndex = (currentImageIndex + direction + currentImageSet.length) % currentImageSet.length;
    const lightboxImg = document.querySelector('.lightbox-content img');
    lightboxImg.src = currentImageSet[currentImageIndex];
}

// Event listeners for lightbox
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.prev-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
});
document.querySelector('.next-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
});

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeLightbox();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

// Touch swipe functionality for mobile
let touchStartX = 0;
let touchEndX = 0;
const minSwipeDistance = 50; // Minimum distance for a swipe to register

document.querySelector('.lightbox-content').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.querySelector('.lightbox-content').addEventListener('touchmove', (e) => {
    // Prevent default to stop page scrolling while swiping in lightbox
    if (document.getElementById('lightbox').style.display === 'flex') {
        e.preventDefault();
    }
}, { passive: false });

document.querySelector('.lightbox-content').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) >= minSwipeDistance) {
        // Negative distance means swipe left, positive means swipe right
        if (swipeDistance > 0) {
            // Swipe right - show previous image
            navigateLightbox(-1);
        } else {
            // Swipe left - show next image
            navigateLightbox(1);
        }
    }
}

// Testimonial Carousel
const carousel = document.querySelector('.testimonial-carousel');
const cards = Array.from(carousel.children);
const dots = Array.from(document.querySelectorAll('.dot'));
let currentIndex = 0;
let isAutoRotating = true;
let autoRotateInterval;

function updateCarousel(newIndex) {
    const currentCard = cards[currentIndex];
    const nextCard = cards[newIndex];
    
    // Remove active class and add leaving class to current card
    currentCard.classList.remove('active');
    currentCard.classList.add('leaving');
    
    // After the out animation, hide the card and remove leaving class
    setTimeout(() => {
        currentCard.style.visibility = 'hidden';
        currentCard.classList.remove('leaving');
    }, 500);
    
    // Show and activate the next card
    nextCard.style.visibility = 'visible';
    nextCard.classList.add('active');
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === newIndex);
        dot.setAttribute('aria-pressed', index === newIndex ? 'true' : 'false');
    });
    
    currentIndex = newIndex;
}

function rotateCards() {
    const nextIndex = (currentIndex + 1) % cards.length;
    updateCarousel(nextIndex);
}

function startAutoRotate() {
    if (isAutoRotating) {
        autoRotateInterval = setInterval(rotateCards, 45000);
    }
}

function stopAutoRotate() {
    clearInterval(autoRotateInterval);
}

// Initialize carousel
cards.forEach((card, index) => {
    if (index === 0) {
        card.classList.add('active');
        card.style.visibility = 'visible';
    } else {
        card.style.visibility = 'hidden';
    }
});
startAutoRotate();

// Event listeners for dots
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        updateCarousel(index);
        stopAutoRotate();
        startAutoRotate();
    });
});

// Button is now initialized by updateDynamicButton() after feed loads

// Pause on hover
carousel.addEventListener('mouseenter', () => {
    isAutoRotating = false;
    stopAutoRotate();
});

carousel.addEventListener('mouseleave', () => {
    isAutoRotating = true;
    startAutoRotate();
});

// Testimonial Carousel Swipe Functionality
let testimonialTouchStartX = 0;
let testimonialTouchStartY = 0;
let testimonialTouchEndX = 0;
let testimonialTouchEndY = 0;
const testimonialMinSwipeDistance = 50;

carousel.addEventListener('touchstart', (e) => {
    testimonialTouchStartX = e.touches[0].clientX;
    testimonialTouchStartY = e.touches[0].pageY;
    // Pause auto-rotation while touching
    stopAutoRotate();
}, { passive: true });

carousel.addEventListener('touchmove', (e) => {
    if (!testimonialTouchStartX || !testimonialTouchStartY) {
        return;
    }

    let touchMoveX = e.touches[0].clientX;
    let touchMoveY = e.touches[0].pageY;

    // Calculate the horizontal and vertical differences
    let deltaX = testimonialTouchStartX - touchMoveX;
    let deltaY = testimonialTouchStartY - touchMoveY;

    // If horizontal scrolling is greater than vertical scrolling
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Prevent default only for horizontal swipes
        e.preventDefault();
    }
}, { passive: false });

carousel.addEventListener('touchend', (e) => {
    testimonialTouchEndX = e.changedTouches[0].clientX;
    testimonialTouchEndY = e.changedTouches[0].pageY;
    handleTestimonialSwipe();
    // Reset touch coordinates
    testimonialTouchStartX = 0;
    testimonialTouchStartY = 0;
    // Resume auto-rotation after touch
    startAutoRotate();
}, { passive: true });

function handleTestimonialSwipe() {
    const swipeDistance = testimonialTouchEndX - testimonialTouchStartX;
    const verticalDistance = Math.abs(testimonialTouchEndY - testimonialTouchStartY);
    
    // Only handle horizontal swipes where the horizontal movement is greater than vertical
    if (Math.abs(swipeDistance) >= testimonialMinSwipeDistance && 
        Math.abs(swipeDistance) > verticalDistance) {
        if (swipeDistance > 0) {
            // Swipe right - show previous testimonial
            const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel(prevIndex);
        } else {
            // Swipe left - show next testimonial
            const nextIndex = (currentIndex + 1) % cards.length;
            updateCarousel(nextIndex);
        }
    }
}

// All glitch CSS classes used by the CRT effect system
const ALL_GLITCH_CLASSES = ['glitch', 'glitch-scanlines', 'glitch-tear', 'glitch-vhold', 'glitch-interlace', 'glitch-static'];

function clearGlitch(header) {
    header.classList.remove(...ALL_GLITCH_CLASSES);
}

function triggerGlitch(header) {
    if (!header) return;

    const roll = Math.random();
    const glitchClasses = ['glitch'];
    let duration;

    if (roll > 0.88) {
        // ~12% chance: vertical hold slip — dramatic, CRT losing sync
        glitchClasses.length = 0;
        glitchClasses.push('glitch-vhold');
        duration = 600;
    } else if (roll > 0.72) {
        // ~16% chance: horizontal tear with interlace flicker
        glitchClasses.push('glitch-tear', 'glitch-interlace');
        duration = 400 + Math.random() * 150;
    } else if (roll > 0.55) {
        // ~17% chance: chromatic glitch + scanline intensification
        glitchClasses.push('glitch-scanlines');
        duration = 350 + Math.random() * 150;
    } else if (roll > 0.40) {
        // ~15% chance: chromatic glitch + interlace
        glitchClasses.push('glitch-interlace');
        duration = 300 + Math.random() * 100;
    } else {
        // ~40% chance: light chromatic aberration only
        duration = 250 + Math.random() * 100;
    }

    // Apply all selected effects
    glitchClasses.forEach(cls => header.classList.add(cls));

    setTimeout(() => {
        clearGlitch(header);

        // 15% chance for "bad signal" — rapid repeated glitch bursts
        const isBadSignal = Math.random() > 0.85;
        if (isBadSignal) {
            setTimeout(() => {
                header.classList.add('glitch');
                setTimeout(() => {
                    header.classList.remove('glitch');
                    if (Math.random() > 0.5) {
                        // Triple burst
                        setTimeout(() => {
                            header.classList.add('glitch', 'glitch-tear');
                            setTimeout(() => {
                                clearGlitch(header);
                                scheduleEffectTimeout(() => triggerGlitch(header), 3000 + Math.random() * 4000);
                            }, 150);
                        }, 80 + Math.random() * 50);
                    } else {
                        scheduleEffectTimeout(() => triggerGlitch(header), 3000 + Math.random() * 4000);
                    }
                }, 120 + Math.random() * 80);
            }, 100 + Math.random() * 100);
        } else {
            scheduleEffectTimeout(() => triggerGlitch(header), 2500 + Math.random() * 5000);
        }
    }, duration);
}

function initHeaderGlitchEffects() {
    const header = document.querySelector('.header-title');
    if (!header) return;
    window.__headerGlitchInit = true;
    scheduleEffectTimeout(() => triggerGlitch(header), 1500 + Math.random() * 2000);
}

// Timed glitch effect for the FAQ link
function triggerGlitchFAQ(faqLink) {
    if (!faqLink) return;
    faqLink.classList.add('glitch-link', 'glitch');
    setTimeout(() => {
        faqLink.classList.remove('glitch-link', 'glitch');
        scheduleEffectTimeout(() => triggerGlitchFAQ(faqLink), 20000 + Math.random() * 5000); // 20-25s
    }, 120 + Math.random() * 180); // short burst
}
function initFaqGlitchTimer() {
    const faqLink = document.querySelector('.faq-glitch-link');
    if (!faqLink) return;
    scheduleEffectTimeout(() => triggerGlitchFAQ(faqLink), 4000 + Math.random() * 2000); // initial delay
}
// Glitch effect for the email link (hover/focus only)
function initEmailGlitchEffects() {
    const emailLink = document.querySelector('.email-glitch-link');
    if (!emailLink) return;
    emailLink.addEventListener('mouseenter', () => {
        emailLink.classList.add('glitch-link', 'glitch');
        setTimeout(() => emailLink.classList.remove('glitch-link', 'glitch'), 200 + Math.random() * 200);
    });
    emailLink.addEventListener('focus', () => {
        emailLink.classList.add('glitch-link', 'glitch');
        setTimeout(() => emailLink.classList.remove('glitch-link', 'glitch'), 200 + Math.random() * 200);
    });
}

// Periodic CRT glitch for the "l.ai.bor" section title
const LAIBOR_GLITCH_CLASSES = ['glitch', 'glitch-tear', 'glitch-vhold'];

function clearLaiborGlitch(el) {
    el.classList.remove(...LAIBOR_GLITCH_CLASSES);
}

function triggerLaiborGlitch(el) {
    if (!el) return;

    const roll = Math.random();
    const classes = [];
    let duration;

    if (roll > 0.9) {
        classes.push('glitch-vhold');
        duration = 600;
    } else if (roll > 0.7) {
        classes.push('glitch', 'glitch-tear');
        duration = 400 + Math.random() * 100;
    } else {
        classes.push('glitch');
        duration = 300 + Math.random() * 150;
    }

    classes.forEach(cls => el.classList.add(cls));

    setTimeout(() => {
        clearLaiborGlitch(el);

        // 12% chance for bad signal double burst
        if (Math.random() > 0.88) {
            setTimeout(() => {
                el.classList.add('glitch');
                setTimeout(() => {
                    el.classList.remove('glitch');
                    scheduleEffectTimeout(() => triggerLaiborGlitch(el), 4000 + Math.random() * 6000);
                }, 120 + Math.random() * 80);
            }, 100 + Math.random() * 80);
        } else {
            scheduleEffectTimeout(() => triggerLaiborGlitch(el), 4000 + Math.random() * 8000);
        }
    }, duration);
}

function initLaiborGlitchEffects() {
    const el = document.querySelector('.rss-title-main');
    if (!el) return;
    scheduleEffectTimeout(() => triggerLaiborGlitch(el), 3000 + Math.random() * 3000);
}

// Custom Audio Player Script
function initCustomAudioPlayers() {
  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // For each custom audio player on the page
  document.querySelectorAll('.custom-audio-player').forEach(function(player) {
    // Skip the mixtape player - it has its own dedicated handler
    if (player.classList.contains('mixtape-audio-controls')) return;
    
    // Find the closest audio element (either by class or previous sibling)
    let audio = registerManagedAudio(player.parentElement.querySelector('audio.custom-audio') || player.parentElement.querySelector('audio'));
    if (!audio) return;
    const playPauseBtn = player.querySelector('.audio-btn');
    const icon = playPauseBtn.querySelector('.audio-icon');
    const progressBar = player.querySelector('.audio-progress');
    const progressContainer = player.querySelector('.audio-progress-bar');
    const currentTimeEl = player.querySelector('.audioCurrent') || player.querySelector('#audioCurrent');

    audio.addEventListener('timeupdate', function() {
      progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    setupProgressScrubbing(progressContainer, audio);

    playPauseBtn.addEventListener('click', function() {
      pauseManagedAudioExcept(audio);
      if (audio.paused) {
        audio.play();
        icon.textContent = '❚❚';
      } else {
        audio.pause();
        icon.textContent = '▶';
      }
    });

    audio.addEventListener('play', function() {
      icon.textContent = '❚❚';
      player.classList.add('playing');
    });
    audio.addEventListener('pause', function() {
      icon.textContent = '▶';
      player.classList.remove('playing');
    });
    audio.addEventListener('ended', function() {
      icon.textContent = '▶';
      player.classList.remove('playing');
    });


  });
}

// Add event listener for Doc lightbox link
function initPetLightboxLinks() {
    const docLink = document.getElementById('docLightboxLink');
    const astroLink = document.getElementById('astroLightboxLink');
    if (docLink) {
        docLink.addEventListener('click', function(e) {
            e.preventDefault();
            openLightbox('images/doc_resist.webp');
        });
    }
    if (astroLink) {
        astroLink.addEventListener('click', function(e) {
            e.preventDefault();
            openLightbox('images/astro-justhappy2behere.webp');
        });
    }
}

function createVisualizerController(options) {
    const audio = registerManagedAudio(options.audio);
    const visualizerCanvas = options.visualizerCanvas;
    const getPalette = options.getPalette;
    const isLocalFile = window.location.protocol === 'file:';
    let animationId = null;
    let isPlaying = false;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let useRealAnalyser = false;
    let barHeights = new Array(8).fill(0);

    function initAudioContext() {
        if (!audio || audioContext || isLocalFile) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.7;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            useRealAnalyser = true;
        } catch (error) {
            useRealAnalyser = false;
        }
    }

    function draw() {
        if (!visualizerCanvas) return;

        const ctx = visualizerCanvas.getContext('2d');
        const width = visualizerCanvas.width;
        const height = visualizerCanvas.height;
        const barCount = 8;
        const barWidth = 3;
        const barGap = 3;
        const maxBarHeight = height * 0.8;
        const centerY = height / 2;
        const edgePadding = 10;

        ctx.clearRect(0, 0, width, height);

        if (useRealAnalyser && analyser && isPlaying) {
            analyser.getByteFrequencyData(dataArray);
        }

        for (let i = 0; i < barCount; i++) {
            let targetHeight;

            if (useRealAnalyser && dataArray && isPlaying) {
                const binIndex = Math.floor((i / barCount) * (dataArray.length * 0.6));
                const value = dataArray[binIndex] || 0;
                targetHeight = value / 255;
            } else if (isPlaying) {
                if (Math.random() < 0.12) {
                    targetHeight = Math.random() * 0.7 + 0.15;
                } else {
                    targetHeight = barHeights[i] + (Math.random() - 0.5) * 0.1;
                }
                targetHeight = Math.max(0.05, Math.min(0.85, targetHeight));
            } else {
                targetHeight = 0;
            }

            const smoothing = useRealAnalyser ? 0.35 : 0.18;
            barHeights[i] += (targetHeight - barHeights[i]) * smoothing;

            const barHeight = barHeights[i] * maxBarHeight;
            const palette = getPalette(i, barCount, barHeights[i]);

            ctx.fillStyle = palette.fillStyle;
            ctx.shadowColor = palette.shadowColor;
            ctx.shadowBlur = 6 + barHeights[i] * 4;

            const leftX = edgePadding + (i * (barWidth + barGap));
            ctx.fillRect(leftX, centerY - barHeight / 2, barWidth, Math.max(2, barHeight));

            const rightX = width - edgePadding - barWidth - (i * (barWidth + barGap));
            ctx.fillRect(rightX, centerY - barHeight / 2, barWidth, Math.max(2, barHeight));
        }

        ctx.shadowBlur = 0;
        animationId = requestAnimationFrame(draw);
    }

    function start() {
        isPlaying = true;
        if (!audioContext && !isLocalFile) {
            initAudioContext();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!animationId) {
            draw();
        }
    }

    function stop() {
        isPlaying = false;
        setTimeout(() => {
            if (!isPlaying && animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
                if (visualizerCanvas) {
                    const ctx = visualizerCanvas.getContext('2d');
                    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
                }
            }
        }, 500);
    }

    function resize() {
        if (!visualizerCanvas) return;
        const container = visualizerCanvas.parentElement;
        if (container) {
            visualizerCanvas.width = container.offsetWidth;
            visualizerCanvas.height = 40;
        }
    }

    return { start, stop, resize, getAnalyser: () => analyser, getAudioContext: () => audioContext };
}

function createModalOscilloscope(canvas, audioEl, getAnalyser, colors) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    // Offscreen buffer holds the trace so it can decay like CRT phosphor.
    const persistCanvas = document.createElement('canvas');
    const persistCtx = persistCanvas.getContext('2d');
    let oscAnimId = null;
    let currentColors = Object.assign({}, colors);
    let dpr = window.devicePixelRatio || 1;

    // Pull the r,g,b out of the graticule rgba() so the vial + glow can be
    // tinted to match each album. `tint` is a let so updateColors() can re-derive
    // it (e.g. the Mixtape A→B side swap), keeping the colour change complete.
    function parseRGB(str) {
        const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(str || '');
        return m ? [m[1], m[2], m[3]] : [0, 247, 194];
    }
    let tint = parseRGB(currentColors.graticule);
    const rgba = (a) => 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + a + ')';

    const frame = canvas.parentElement;
    const vial = frame ? frame.querySelector('.time-vial') : null;

    // Clicking the scope toggles play/pause — scrubbing lives on the vial.
    canvas.addEventListener('click', function () {
        pauseManagedAudioExcept(audioEl);
        if (audioEl.paused) audioEl.play().catch(function () {});
        else audioEl.pause();
    });

    // The vial IS the scrubber: drag it vertically (bottom = start, top = end),
    // mirroring the filling metaphor.
    if (vial) {
        const seekVial = function (clientY) {
            const rect = vial.getBoundingClientRect();
            if (!audioEl.duration || !isFinite(audioEl.duration) || !rect.height) return;
            const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
            audioEl.currentTime = pct * audioEl.duration;
        };
        vial.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            try { vial.setPointerCapture(e.pointerId); } catch (err) {}
            const wasPlaying = !audioEl.paused;
            if (wasPlaying) audioEl.pause();
            seekVial(e.clientY);
            const move = function (ev) { seekVial(ev.clientY); };
            const up = function () {
                vial.removeEventListener('pointermove', move);
                vial.removeEventListener('pointerup', up);
                vial.removeEventListener('pointercancel', up);
                if (wasPlaying) setTimeout(function () { audioEl.play().catch(function () {}); }, 50);
            };
            vial.addEventListener('pointermove', move);
            vial.addEventListener('pointerup', up);
            vial.addEventListener('pointercancel', up);
        });
    }

    // Vial gauge: a tiny canvas drawn with real drop physics — drops fall from
    // the top, splash into the surface, and the pool collects toward progress.
    const vialCanvas = vial ? vial.querySelector('.time-vial-canvas') : null;
    const vialCtx = vialCanvas ? vialCanvas.getContext('2d') : null;
    let vialLevel = 0;      // displayed fill (0..1), eases toward progress
    let vialDrops = [];     // in-flight droplets
    let vialRipple = 0;     // surface ripple amplitude, decays after each splash
    let vialDropTimer = 0;  // countdown to next drop spawn
    let vialBubbles = [];   // carbonation rising through the liquid
    let vialBubbleTimer = 0;
    let vialSpecks = null;  // fixed condensation flecks on the glass
    let vialLastT = (typeof performance !== 'undefined' ? performance.now() : 0);

    // Bass energy (0..1) drives the quarter-line neon pulse — fast attack on a
    // kick, slow decay back to the calm neon baseline.
    let bassPulse = 0;
    let bassFreq = null;
    let bassBaseline = 0;   // slow-tracking sustained bass level; pulse responds to kicks above it

    // Live tempo tracking — detect kick onsets (rising edge of bassPulse) and
    // measure the gaps between them. The median of a rolling window of recent
    // gaps gives a jitter-resistant beat interval that drives the vial's drip
    // cadence: one drop per beat. Until enough beats are seen, we fall back to a
    // steady default. (Median, not mean, so syncopated/missed kicks don't skew it.)
    let beatLastOnset = 0;      // timestamp (s) of the last detected onset
    let beatIntervals = [];     // rolling window of recent inter-onset gaps (s)
    let beatInterval = 0;       // current smoothed estimate (s); 0 = not locked yet
    let beatArmed = true;       // gate so one kick fires a single onset
    const BEAT_MIN = 0.32;      // ~188 BPM ceiling — reject double-triggers
    const BEAT_MAX = 1.10;      // ~55 BPM floor — reject dropped beats / gaps
    const BEAT_DEFAULT = 0.92;  // fallback cadence before the tempo locks

    function resizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        persistCanvas.width = canvas.width;
        persistCanvas.height = canvas.height;
        persistCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (vialCanvas && vialCtx) {
            const vr = vialCanvas.getBoundingClientRect();
            vialCanvas.width = Math.max(1, vr.width * dpr);
            vialCanvas.height = Math.max(1, vr.height * dpr);
            vialCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            vialSpecks = null; // regenerate condensation for the new size
        }
    }

    function drawGraticule(w, h) {
        // Fixed pixel cell size so the graticule reads as a stable CRT texture
        // pinned to the screen's center, rather than a fixed division count that
        // stretches/squashes (and makes the center appear to drift) as the canvas
        // is resized. Lines are walked outward from the exact center in both
        // directions; partial cells simply fall off the edges.
        var cellW = 46, cellH = 26;
        var midX = w / 2, midY = h / 2;
        var gc = currentColors.graticule;

        ctx.strokeStyle = gc.replace(/[\d.]+\)$/, '0.12)');
        ctx.lineWidth = 0.5;
        // Vertical grid lines, mirrored around the center (center itself is the
        // brighter crosshair drawn below).
        for (var x = midX - cellW; x > 0; x -= cellW) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (var x = midX + cellW; x < w; x += cellW) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        // Horizontal grid lines, mirrored around the center. The center line is
        // intentionally skipped (the trace sits there).
        for (var y = midY - cellH; y > 0; y -= cellH) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (var y = midY + cellH; y < h; y += cellH) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Faint horizontal baseline at the exact vertical center. Because the
        // center grid cell is intentionally empty (and the trace is absent while
        // paused), the eye otherwise latches onto the nearest grid line above and
        // misreads the center as sitting high. A whisper-faint anchor here — well
        // below the 0.12 grid lines — fixes that read without reintroducing a
        // bold center mark.
        ctx.strokeStyle = gc.replace(/[\d.]+\)$/, '0.07)');
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

        // Vertical center crosshair only (the scope's trigger line).
        ctx.strokeStyle = gc.replace(/[\d.]+\)$/, '0.2)');
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();

        // Neon, self-emitting markers at the quarter lines (25% and 75% down):
        // a glowing colored tube with a hot near-white core that throbs with the
        // bass (bassPulse, 0..1) so the markers keep rhythm with the track.
        // At rest, leave the glass clean so they do not read as a false center line.
        if (audioEl.paused && bassPulse < 0.02) {
            return;
        }
        var pulse = bassPulse;
        // Per-frame flicker gives a staticky CRT shimmer; livelier on the beat.
        var flicker = (Math.random() - 0.5) * (0.1 + pulse * 0.4);
        var lit = Math.max(0, Math.min(1, pulse + flicker));
        // Walk the line in short segments with tiny random vertical offsets so the
        // trace crackles with static — amplitude grows with the beat.
        function strokeStatic(qy, jitterAmp) {
            var step = 13;
            ctx.beginPath();
            ctx.moveTo(0, qy + (Math.random() - 0.5) * jitterAmp);
            for (var sx = step; sx < w; sx += step) {
                ctx.lineTo(sx, qy + (Math.random() - 0.5) * jitterAmp);
            }
            ctx.lineTo(w, qy + (Math.random() - 0.5) * jitterAmp);
            ctx.stroke();
        }
        ctx.save();
        [0.25, 0.75].forEach(function (frac) {
            var qy = h * frac;
            var jitter = 0.35 + lit * 2.2;
            // Tube: near-invisible at rest, thickens and blooms hard on a kick.
            ctx.shadowColor = currentColors.glow;
            ctx.shadowBlur = 4 + lit * 50;
            ctx.strokeStyle = gc.replace(/[\d.]+\)$/, (0.28 + lit * 0.72).toFixed(2) + ')');
            ctx.lineWidth = 0.9 + lit * 6;
            strokeStatic(qy, jitter);
            strokeStatic(qy, jitter); // double pass intensifies the bloom
            // Hot near-white core that flares to full white on the beat.
            ctx.shadowBlur = 2 + lit * 16;
            ctx.strokeStyle = 'rgba(255, 250, 235, ' + (0.35 + lit * 0.65).toFixed(2) + ')';
            ctx.lineWidth = 0.5 + lit * 2.4;
            strokeStatic(qy, jitter * 0.6);
        });
        ctx.restore();
    }

    function drawVial(now) {
        if (!vialCtx) return;
        var rect = vialCanvas.getBoundingClientRect();
        var vw = rect.width, vh = rect.height;
        if (!vw || !vh) return;

        var dt = Math.min(0.05, Math.max(0, (now - vialLastT) / 1000));
        vialLastT = now;

        var dur = audioEl.duration;
        var target = (dur && isFinite(dur) && dur > 0) ? Math.max(0, Math.min(1, audioEl.currentTime / dur)) : 0;
        var playing = !audioEl.paused;

        // Big jumps (scrubs, track changes) snap; otherwise the pool eases up.
        if (Math.abs(target - vialLevel) > 0.3) vialLevel = target;
        else vialLevel += (target - vialLevel) * Math.min(1, dt * 2.5);

        var surfaceY = (1 - vialLevel) * vh;

        // Spawn a drop from the top now and then while playing.
        vialDropTimer -= dt;
        if (playing && vialDropTimer <= 0) {
            vialDrops.push({
                x: vw / 2 + (Math.random() - 0.5) * vw * 0.32,
                y: 1,
                vy: 8 + Math.random() * 10,
                r: 1.2 + Math.random() * 0.7
            });
            // One drop per beat once the tempo has locked; until then, the steady
            // default keeps the soothing, predictable cadence.
            vialDropTimer = beatInterval > 0 ? beatInterval : BEAT_DEFAULT;
        }

        // Integrate drops under gravity; splash into the surface on contact.
        var grav = vh * 6;
        for (var i = vialDrops.length - 1; i >= 0; i--) {
            var d = vialDrops[i];
            d.vy += grav * dt;
            d.y += d.vy * dt;
            if (d.y >= surfaceY - d.r) {
                vialRipple = Math.min(4.5, vialRipple + 2.4);
                vialDrops.splice(i, 1);
            }
        }
        vialRipple *= Math.exp(-dt * 4.5);

        // Carbonation: small bubbles seep up from the bottom and pop at the top.
        vialBubbleTimer -= dt;
        if (playing && vialLevel > 0.04 && vialBubbleTimer <= 0) {
            vialBubbles.push({
                x: 1.5 + Math.random() * (vw - 3),
                y: vh - 1,
                r: 0.5 + Math.random() * 0.9,
                vy: 26 + Math.random() * 30,
                ph: Math.random() * 6.283
            });
            vialBubbleTimer = 0.18 + Math.random() * 0.3;
        }
        for (var bi = vialBubbles.length - 1; bi >= 0; bi--) {
            var bub = vialBubbles[bi];
            bub.y -= bub.vy * dt;
            if (bub.y <= surfaceY + 1) vialBubbles.splice(bi, 1);
        }

        // ---- draw ----
        vialCtx.clearRect(0, 0, vw, vh);

        // The surface is two independent "floorboards" (à la Prince of Persia's
        // loose tiles) that quiver while the vial fills and jolt on each splash.
        var quiver = vialRipple + (playing ? 1.3 : 0);
        var midX = vw / 2;
        var sy = function (freq, phase) {
            return Math.max(0, Math.min(vh, surfaceY + Math.sin(now * freq + phase) * quiver));
        };
        var yLo = sy(0.052, 0.0);   // left board — outer edge (x = 0)
        var yLi = sy(0.061, 1.7);   // left board — inner edge (x = mid)
        var yRi = sy(0.058, 3.1);   // right board — inner edge (x = mid)
        var yRo = sy(0.049, 4.6);   // right board — outer edge (x = vw)

        if (vialLevel > 0.002) {
            var grad = vialCtx.createLinearGradient(0, surfaceY, 0, vh);
            grad.addColorStop(0, rgba(0.58)); // translucent — waveform shows through
            grad.addColorStop(1, rgba(0.4));
            vialCtx.fillStyle = grad;
            vialCtx.shadowColor = currentColors.glow;
            vialCtx.shadowBlur = 8;
            vialCtx.beginPath();
            vialCtx.moveTo(0, yLo);
            vialCtx.lineTo(midX, yLi);
            vialCtx.lineTo(midX, yRi);
            vialCtx.lineTo(vw, yRo);
            vialCtx.lineTo(vw, vh);
            vialCtx.lineTo(0, vh);
            vialCtx.closePath();
            vialCtx.fill();
            vialCtx.shadowBlur = 0;

            // Two bright meniscus boards with a seam down the middle.
            vialCtx.strokeStyle = 'rgba(255, 250, 240, 0.95)';
            vialCtx.lineWidth = 1.4;
            vialCtx.shadowColor = currentColors.glow;
            vialCtx.shadowBlur = 7;
            vialCtx.beginPath();
            vialCtx.moveTo(0, yLo); vialCtx.lineTo(midX, yLi);
            vialCtx.moveTo(midX, yRi); vialCtx.lineTo(vw, yRo);
            vialCtx.stroke();
            vialCtx.shadowBlur = 0;

            // Carbonation bubbles drifting up through the liquid.
            vialCtx.strokeStyle = 'rgba(255, 250, 240, 0.4)';
            vialCtx.lineWidth = 0.6;
            for (var k = 0; k < vialBubbles.length; k++) {
                var bd = vialBubbles[k];
                var bx = bd.x + Math.sin(now * 0.004 + bd.ph) * 0.8;
                vialCtx.beginPath();
                vialCtx.arc(bx, bd.y, bd.r, 0, Math.PI * 2);
                vialCtx.stroke();
            }
        }

        // Falling drops, stretched by speed into little teardrops.
        vialCtx.fillStyle = rgba(0.95);
        vialCtx.shadowColor = currentColors.glow;
        vialCtx.shadowBlur = 6;
        for (var j = 0; j < vialDrops.length; j++) {
            var dr = vialDrops[j];
            var stretch = Math.min(2.4, 1 + dr.vy / 60);
            vialCtx.save();
            vialCtx.translate(dr.x, dr.y);
            vialCtx.scale(1, stretch);
            vialCtx.beginPath();
            vialCtx.arc(0, 0, dr.r, 0, Math.PI * 2);
            vialCtx.fill();
            vialCtx.restore();
        }
        vialCtx.shadowBlur = 0;

        // Condensation: a fixed sprinkle of faint flecks on the glass.
        if (!vialSpecks) {
            vialSpecks = [];
            var count = Math.round(vw * vh / 120);
            for (var s = 0; s < count; s++) {
                vialSpecks.push({
                    x: Math.random() * vw,
                    y: Math.random() * vh,
                    r: 0.35 + Math.random() * 0.6,
                    a: 0.03 + Math.random() * 0.06
                });
            }
        }
        for (var si = 0; si < vialSpecks.length; si++) {
            var sp = vialSpecks[si];
            vialCtx.beginPath();
            vialCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            vialCtx.fillStyle = 'rgba(255, 250, 235, ' + sp.a + ')';
            vialCtx.fill();
        }
    }

    function render() {
        if (vialCtx) drawVial(typeof performance !== 'undefined' ? performance.now() : 0);
        var w = canvas.getBoundingClientRect().width;
        var h = canvas.getBoundingClientRect().height;
        if (!w || !h) return;
        // Re-sync the backing store whenever the displayed box (or DPR) no longer
        // matches it. The resize listener only fires resizeCanvas() while playing,
        // so without this a breakpoint change leaves a stale coordinate space and
        // mid = h/2 lands off-center — the trace drifts upward. Keeping the backing
        // store == rect * dpr guarantees a centered trace at every breakpoint.
        var curDpr = window.devicePixelRatio || 1;
        if (!canvas.width ||
            Math.abs(canvas.width - w * curDpr) > 1 ||
            Math.abs(canvas.height - h * curDpr) > 1) {
            resizeCanvas();
        }
        var isPlaying = !audioEl.paused;
        var mid = h / 2;

        // Sample bass energy from the low FFT bins to drive the quarter-line pulse.
        var bassAnalyser = getAnalyser();
        var bassTarget = 0;
        if (isPlaying && bassAnalyser) {
            if (!bassFreq) bassFreq = new Uint8Array(bassAnalyser.frequencyBinCount);
            bassAnalyser.getByteFrequencyData(bassFreq);
            // Only the lowest 3 bins (~170-520 Hz) — the kick/sub band, not low-mids.
            var bassSum = 0, bassBins = Math.min(3, bassFreq.length - 1);
            for (var bb = 1; bb <= bassBins; bb++) bassSum += bassFreq[bb];
            var bassAvg = bassSum / bassBins;
            // Slow baseline tracks the sustained bass level so the pulse blooms on
            // transients (kicks) above it rather than pinning to max during loud passages.
            bassBaseline += (bassAvg - bassBaseline) * 0.03;
            var bassExcess = bassAvg - bassBaseline;
            bassTarget = Math.max(0, Math.min(1, (bassExcess - 8) / 55)); // ignore baseline, bloom on the punch
        }
        // Fast attack, slow decay → snaps on a kick, eases back to the baseline.
        bassPulse += (bassTarget - bassPulse) * (bassTarget > bassPulse ? 0.55 : 0.14);

        // Tempo tracking: treat a strong rising edge of bassPulse as a beat onset.
        // Arm/disarm with hysteresis (fire above 0.55, re-arm below 0.22) so one
        // kick yields exactly one onset. Record the gap since the last onset, keep
        // a rolling window in the valid tempo band, and take the median as the beat.
        if (isPlaying) {
            var nowSec = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
            if (beatArmed && bassPulse > 0.55) {
                beatArmed = false;
                if (beatLastOnset > 0) {
                    var gap = nowSec - beatLastOnset;
                    if (gap >= BEAT_MIN && gap <= BEAT_MAX) {
                        beatIntervals.push(gap);
                        if (beatIntervals.length > 8) beatIntervals.shift();
                        var sorted = beatIntervals.slice().sort(function (a, b) { return a - b; });
                        var med = sorted[sorted.length >> 1];
                        // Ease toward the new estimate so the cadence drifts smoothly.
                        beatInterval = beatInterval > 0 ? beatInterval + (med - beatInterval) * 0.4 : med;
                    }
                }
                beatLastOnset = nowSec;
            } else if (!beatArmed && bassPulse < 0.22) {
                beatArmed = true;
            }
        } else {
            // Reset on pause so a resumed/changed track re-locks from scratch.
            beatIntervals.length = 0;
            beatInterval = 0;
            beatLastOnset = 0;
            beatArmed = true;
        }

        ctx.clearRect(0, 0, w, h);
        drawGraticule(w, h);

        // (Progress now lives in the vial gauge — the scope shows live signal
        // plus a grab handle, so there's no played-region wash here.)

        var analyser = getAnalyser();
        if (isPlaying && analyser) {
            // Fade the persistence buffer (phosphor decay), then draw the new
            // trace onto it so previous frames linger as a ghost behind it.
            persistCtx.globalCompositeOperation = 'destination-out';
            persistCtx.fillStyle = 'rgba(0,0,0,0.22)';
            persistCtx.fillRect(0, 0, w, h);
            persistCtx.globalCompositeOperation = 'source-over';

            persistCtx.beginPath();
            persistCtx.strokeStyle = currentColors.trace;
            persistCtx.lineWidth = 2;
            persistCtx.shadowColor = currentColors.glow;
            persistCtx.shadowBlur = 10;

            var timeData = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(timeData);
            var sliceWidth = w / timeData.length;
            var x = 0;
            var gain = 3.0;
            for (var i = 0; i < timeData.length; i++) {
                var v = (timeData[i] / 128.0) - 1.0;
                var y = mid + (v * mid * gain);
                y = Math.max(2, Math.min(h - 2, y));
                if (i === 0) persistCtx.moveTo(x, y);
                else persistCtx.lineTo(x, y);
                x += sliceWidth;
            }
            persistCtx.stroke();
            persistCtx.shadowBlur = 0;
        } else {
            // Idle (paused/stopped): no trace at all — clear the buffer so the
            // scope rests on its graticule instead of drawing a flat center line.
            persistCtx.clearRect(0, 0, w, h);
        }

        // Composite the phosphor buffer over the graticule.
        ctx.drawImage(persistCanvas, 0, 0, w, h);

        // (No playhead marker on the scope — progress lives in the vial gauge.
        // The trace still brightens while scrubbing for tactile feedback, and
        // the canvas remains click/drag-seekable.)
    }

    function drawFrame() {
        render();
        oscAnimId = requestAnimationFrame(drawFrame);
    }

    // Keep the cursor responsive to seeks/scrubs while paused (no RAF running).
    function renderIfIdle() {
        if (!oscAnimId) render();
    }
    audioEl.addEventListener('seeked', renderIfIdle);
    audioEl.addEventListener('timeupdate', renderIfIdle);

    function start() {
        resizeCanvas();
        if (!oscAnimId) drawFrame();
    }

    function stop() {
        if (oscAnimId) {
            cancelAnimationFrame(oscAnimId);
            oscAnimId = null;
        }
        render();
    }

    function updateColors(newColors) {
        Object.assign(currentColors, newColors);
        tint = parseRGB(currentColors.graticule);
    }

    window.addEventListener('resize', function() {
        resizeCanvas();
        // While playing, the RAF loop repaints; while paused it's idle, so repaint
        // once here to keep the trace centered after a breakpoint change.
        if (!oscAnimId) render();
    });

    return { start, stop, updateColors, resizeCanvas };
}

function createMiniPlayer() {
    const root = document.getElementById('miniPlayer');
    if (!root) return null;

    const coverBtn = document.getElementById('miniPlayerCover');
    const coverImg = document.getElementById('miniPlayerCoverImg');
    const coverIcon = document.getElementById('miniPlayerCoverIcon');
    const albumEl = document.getElementById('miniPlayerAlbum');
    const titleEl = document.getElementById('miniPlayerTitle');
    const oscFrame = document.getElementById('miniPlayerOscFrame');
    const closeBtn = document.getElementById('miniPlayerClose');
    const oscCanvas = document.getElementById('miniPlayerOscilloscope');

    const PLAY_ICON = '\u25B6';
    const PAUSE_ICON = '\u275A\u275A';

    let current = null; // { audio, onExpand, onClose, refreshTitle, listeners, oscilloscope }

    function detachListeners() {
        if (!current || !current.listeners) return;
        const { audio } = current;
        current.listeners.forEach(({ event, fn }) => audio.removeEventListener(event, fn));
        current.listeners = [];
    }

    function teardown(stopAudio) {
        if (!current) return;
        if (current.oscilloscope) current.oscilloscope.stop();
        if (stopAudio && current.audio) current.audio.pause();
        detachListeners();
        root.classList.remove('active');
        root.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (!current) root.hidden = true;
        }, 380);
        current = null;
    }

    function syncPlayIcon() {
        if (!current) return;
        const paused = current.audio.paused;
        if (coverIcon) coverIcon.textContent = paused ? PLAY_ICON : PAUSE_ICON;
        root.classList.toggle('is-paused', paused);
    }

    function attach(options) {
        if (current) teardown(false);

        const {
            audio,
            coverSrc,
            albumTitle,
            theme,
            oscColors,
            getAnalyser,
            getTitle,
            onExpand,
            onClose
        } = options;

        if (!audio) return;

        root.dataset.theme = theme || 'mixtape-a';
        if (coverSrc && coverImg) {
            coverImg.src = coverSrc;
            coverImg.alt = albumTitle ? `${albumTitle} cover` : '';
        }
        if (albumEl) albumEl.textContent = albumTitle || '';
        const updateTitle = () => {
            if (!titleEl) return;
            const t = typeof getTitle === 'function' ? getTitle() : '';
            titleEl.textContent = t || '';
        };
        updateTitle();

        const oscilloscope = oscCanvas && getAnalyser
            ? createModalOscilloscope(oscCanvas, audio, getAnalyser, oscColors || {
                trace: '#00f7c2', glow: 'rgba(0,247,194,0.9)', graticule: 'rgba(0,247,194,1)'
            })
            : null;

        const listeners = [];
        const add = (event, fn) => {
            audio.addEventListener(event, fn);
            listeners.push({ event, fn });
        };
        add('play', () => { syncPlayIcon(); if (oscilloscope) oscilloscope.start(); });
        add('pause', syncPlayIcon);
        add('ended', syncPlayIcon);
        add('loadedmetadata', updateTitle);
        add('play', updateTitle);

        current = { audio, onExpand, onClose, listeners, oscilloscope, updateTitle };

        root.hidden = false;
        // force reflow so the transition animates in
        void root.offsetWidth;
        root.classList.add('active');
        root.setAttribute('aria-hidden', 'false');
        syncPlayIcon();
        if (oscilloscope) {
            setTimeout(() => {
                oscilloscope.resizeCanvas();
                oscilloscope.start();
            }, 50);
        }
    }

    if (coverBtn) {
        coverBtn.addEventListener('click', () => {
            if (!current) return;
            if (typeof pauseManagedAudioExcept === 'function') {
                pauseManagedAudioExcept(current.audio);
            }
            if (current.audio.paused) {
                current.audio.play().catch(() => {});
            } else {
                current.audio.pause();
            }
        });
    }

    if (oscFrame) {
        oscFrame.addEventListener('click', () => {
            if (!current) return;
            const expand = current.onExpand;
            teardown(false);
            if (typeof expand === 'function') expand();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const onClose = current && current.onClose;
            teardown(true);
            if (typeof onClose === 'function') onClose();
        });
    }

    return {
        attach,
        detach: (stopAudio = false) => teardown(stopAudio),
        isActive: () => !!current,
        getAudio: () => (current ? current.audio : null)
    };
}

let miniPlayerInstance = null;
function getMiniPlayer() {
    if (!miniPlayerInstance) {
        miniPlayerInstance = createMiniPlayer();
    }
    return miniPlayerInstance;
}

function formatAudioTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

// Keep the vial's ARIA progress value in sync. The liquid itself is rendered
// on a canvas by createModalOscilloscope (see drawVial), which reads the audio
// directly — so this only maintains the accessibility value.
function setAudioTimeReadout(el, audio) {
    if (!el) return;
    const dur = audio.duration;
    const pct = (dur && isFinite(dur)) ? Math.max(0, Math.min(1, audio.currentTime / dur)) : 0;
    const vial = el.closest('.time-vial');
    if (vial) vial.setAttribute('aria-valuenow', Math.round(pct * 100));
}

function resetAudioTimeReadout(el) {
    if (!el) return;
    const vial = el.closest('.time-vial');
    if (vial) vial.setAttribute('aria-valuenow', 0);
}

function slugifyTrackSegment(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getTrackSlug(track) {
    if (!track) return '';
    const filePath = typeof track.file === 'string' ? track.file : '';
    const fileName = filePath.split('/').pop() || '';
    const basename = fileName.replace(/\.[^.]+$/, '');
    return slugifyTrackSegment(basename || track.title);
}

function buildMusicHash(routeKey, trackOrSlug = '') {
    const rawSlug = typeof trackOrSlug === 'string' ? trackOrSlug : getTrackSlug(trackOrSlug);
    const trackSlug = slugifyTrackSegment(rawSlug);
    return `#${routeKey}${trackSlug ? `/${encodeURIComponent(trackSlug)}` : ''}`;
}

function parseMusicHash(hash = window.location.hash) {
    const normalizedHash = String(hash || '').replace(/^#/, '');
    if (!normalizedHash) return null;

    const [routeSegment, rawTrackSlug = ''] = normalizedHash.split('/');
    const routes = {
        'mixtape': {
            player: 'mixtape',
            canonicalRoute: 'mixtape',
            isBSide: false
        },
        'mixtape-side-two': {
            player: 'mixtape',
            canonicalRoute: 'mixtape-side-two',
            isBSide: true
        },
        'bsides': {
            player: 'mixtape',
            canonicalRoute: 'mixtape-side-two',
            isBSide: true
        },
        'gwor': {
            player: 'gwor',
            canonicalRoute: 'gwor',
            isBSide: false
        },
        'junkyard-cabaret': {
            player: 'junkyard-cabaret',
            canonicalRoute: 'junkyard-cabaret',
            isBSide: false
        }
    };

    const route = routes[routeSegment];
    if (!route) return null;

    const trackSlug = slugifyTrackSegment(decodeURIComponent(rawTrackSlug));
    return {
        ...route,
        trackSlug,
        canonicalHash: buildMusicHash(route.canonicalRoute, trackSlug)
    };
}

function findTrackIndexBySlug(tracks, trackSlug) {
    const normalizedSlug = slugifyTrackSegment(trackSlug);
    if (!normalizedSlug) return -1;
    return tracks.findIndex(track => getTrackSlug(track) === normalizedSlug);
}

function updateHistoryHash(nextHash, method = 'replaceState') {
    if (!nextHash || window.location.hash === nextHash) return;
    if (history && typeof history[method] === 'function') {
        history[method](null, '', nextHash);
    }
}

function buildTrackShareUrl(routeKey, track) {
    const trackSlug = getTrackSlug(track);
    const sharePath = `songs/${routeKey}/${trackSlug}/`;

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return new URL(`/${sharePath}`, window.location.origin).href;
    }

    return new URL(sharePath, window.location.href).href;
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const didCopy = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!didCopy) {
        throw new Error('Clipboard copy failed.');
    }
}

function flashShareButtonLabel(button, label, duration = 1800) {
    if (!button) return;
    const labelEl = button.querySelector('.track-share-label');
    if (!labelEl) return;

    const defaultLabel = button.dataset.defaultLabel || labelEl.textContent || 'share';
    button.dataset.defaultLabel = defaultLabel;
    labelEl.textContent = label;

    window.clearTimeout(button._shareResetTimer);
    button._shareResetTimer = window.setTimeout(() => {
        labelEl.textContent = defaultLabel;
    }, duration);
}

async function shareTrackLink(button, { routeKey, track, collectionTitle }) {
    if (!button || !track || !routeKey) return;

    const url = buildTrackShareUrl(routeKey, track);
    const title = `${track.title} | ${collectionTitle}`;
    const text = `Listen to "${track.title}" from ${collectionTitle}.`;

    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            flashShareButtonLabel(button, 'shared', 1400);
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return;
            }
        }
    }

    try {
        await copyTextToClipboard(url);
        flashShareButtonLabel(button, 'copied');
    } catch (error) {
        console.error('Share failed:', error);
        flashShareButtonLabel(button, 'error', 1400);
    }
}


function renderTrackList(trackList, tracks, onSelect, getShareData) {
    if (!trackList) return [];

    trackList.innerHTML = '';
    return tracks.map((track, index) => {
        // Optional act divider: a track with an `act` label gets a non-interactive
        // header row inserted above it. Dividers are appended straight to the list and
        // kept out of the returned array so track indices stay aligned.
        if (track.act) {
            const divider = document.createElement('li');
            divider.className = 'mixtape-act-divider';
            divider.setAttribute('aria-hidden', 'true');
            const dividerLabel = document.createElement('span');
            dividerLabel.className = 'act-divider-label';
            dividerLabel.textContent = track.act;
            divider.appendChild(dividerLabel);
            trackList.appendChild(divider);
        }

        const li = document.createElement('li');
        li.className = 'mixtape-track-item';
        const trackNumber = document.createElement('span');
        trackNumber.className = 'track-number';
        trackNumber.textContent = index + 1;

        const titleText = document.createElement('span');
        titleText.className = 'track-title-text';
        titleText.textContent = track.title;

        const actionGroup = document.createElement('div');
        actionGroup.className = 'track-action-group';

        if (track.article) {
            actionGroup.classList.add('track-action-group--paired');
            const articleLink = document.createElement('a');
            articleLink.href = track.article;
            articleLink.target = '_blank';
            articleLink.rel = 'noopener noreferrer';
            articleLink.className = 'track-article-link';
            articleLink.title = 'Read the article that inspired this song';
            articleLink.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                <span class="track-article-label">spark</span>
            `;
            articleLink.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            actionGroup.appendChild(articleLink);
        }

        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'track-share-button';
        shareButton.title = `Share link to ${track.title}`;
        shareButton.setAttribute('aria-label', `Share link to ${track.title}`);
        shareButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.6" y1="10.7" x2="15.4" y2="6.3"></line>
                <line x1="8.6" y1="13.3" x2="15.4" y2="17.7"></line>
            </svg>
            <span class="track-share-label">share</span>
        `;
        shareButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const shareData = typeof getShareData === 'function' ? getShareData(track, index) : null;
            if (!shareData || !shareData.routeKey) return;

            await shareTrackLink(shareButton, {
                routeKey: shareData.routeKey,
                track,
                collectionTitle: shareData.collectionTitle || document.title
            });
        });
        actionGroup.appendChild(shareButton);

        li.appendChild(trackNumber);
        li.appendChild(titleText);
        li.appendChild(actionGroup);
        li.addEventListener('click', () => onSelect(index));
        trackList.appendChild(li);
        return li;
    });
}

function setActiveTrackListItem(trackItems, activeIndex) {
    trackItems.forEach((item, index) => {
        item.classList.toggle('active', index === activeIndex);
    });
}

function updateNowPlayingDisplays(elements, title, metaTitle) {
    const displayTitle = title || 'Select a track...';
    if (elements.trackDisplay) {
        elements.trackDisplay.textContent = displayTitle;
    }
    if (elements.glassTitle) {
        elements.glassTitle.textContent = displayTitle;
    }
    if (elements.glassMeta && metaTitle) {
        elements.glassMeta.textContent = metaTitle;
    }
    if (elements.mobileNowPlaying) {
        elements.mobileNowPlaying.textContent = displayTitle;
    }
}

// Mixtape Lightbox Logic
function initMixtapeLightbox() {
    const aSideTracks = [
        { title: 'Hum of Humanity', file: 'audio/exploring-laibor-mixtape/hum-of-humanity.mp3', article: 'https://charleswilke.substack.com/p/the-hum-of-humanity' },
        { title: 'Protect the Hollow', file: 'audio/exploring-laibor-mixtape/protect-the-hollow.mp3', article: 'https://charleswilke.substack.com/p/protect-the-hollow' },
        { title: 'Data Dignity', file: 'audio/exploring-laibor-mixtape/data-dignity.mp3', article: 'https://charleswilke.substack.com/p/the-quest-for-data-dignity' },
        { title: 'Compounding Fuzziness', file: 'audio/exploring-laibor-mixtape/compounding-fuzziness.mp3', video: 'audio/exploring-laibor-mixtape/compounding-fuzziness.mp4', article: 'https://charleswilke.substack.com/p/compounding-fuzziness' },
        { title: 'Conjured Impunity', file: 'audio/exploring-laibor-mixtape/conjured-impunity.mp3', video: 'audio/exploring-laibor-mixtape/conjured-impunity.mp4', article: 'https://charleswilke.substack.com/p/imagined-impunity' },
        { title: 'Hypnotic Crimes', file: 'audio/exploring-laibor-mixtape/hypnotic-crimes.mp3', video: 'audio/exploring-laibor-mixtape/hypnotic-crimes.mp4', article: 'https://charleswilke.substack.com/p/hypnotic-crimes' },
        { title: 'Rubicon\'d', file: 'audio/exploring-laibor-mixtape/rubicon-d.mp3', video: 'audio/exploring-laibor-mixtape/rubicon-d.mp4', article: 'https://charleswilke.substack.com/p/rubicond' },
        { title: 'Certainty\'s Whimpering End', file: 'audio/exploring-laibor-mixtape/certaintys-whimpering-end.mp3', video: 'audio/exploring-laibor-mixtape/certaintys-whimpering-end.mp4', article: 'https://charleswilke.substack.com/p/certaintys-whimpering-end' },
        { title: 'Terminal Uniqueness', file: 'audio/exploring-laibor-mixtape/terminal-uniqueness.mp3', video: 'audio/exploring-laibor-mixtape/terminal-uniqueness.mp4', article: 'https://charleswilke.substack.com/p/terminal-uniqueness' },
        { title: 'G(ai)ve it Away', file: 'audio/exploring-laibor-mixtape/gave-it-away.mp3', video: 'audio/exploring-laibor-mixtape/gave-it-away.mp4', article: 'https://charleswilke.substack.com/p/gave-it-away' },
        { title: 'Value is Myth', file: 'audio/exploring-laibor-mixtape/value-is-myth.mp3', video: 'audio/exploring-laibor-mixtape/value-is-myth.mp4', article: 'https://charleswilke.substack.com/p/value-is-myth' }
    ];
    
    const bSideTracks = [
        { title: 'Clear as Day', file: 'audio/exploring-laibor-mixtape/clear-as-day.mp3', video: 'audio/exploring-laibor-mixtape/clear-as-day.mp4', article: 'https://www.theguardian.com/us-news/2026/jan/24/alex-pretti-minneapolis-minnesota-shooting' },
        { title: 'Permission to Ache', file: 'audio/exploring-laibor-mixtape/permission-to-ache.mp3', video: 'audio/exploring-laibor-mixtape/permission-to-ache.mp4', article: 'https://charleswilke.substack.com/p/whats-next' },
        { title: 'The Siege of Social Atomization', file: 'audio/exploring-laibor-mixtape/the-siege-of-social-atomization.mp3', video: 'audio/exploring-laibor-mixtape/the-siege-of-social-atomization.mp4', article: 'https://charleswilke.substack.com/p/the-social-siege-of-atomization' },
        { title: 'The Copy Blinked First', file: 'audio/exploring-laibor-mixtape/the-copy-blinked-first.mp3', video: 'audio/exploring-laibor-mixtape/the-copy-blinked-first.mp4', article: 'https://charleswilke.substack.com/p/after-normal' },
        { title: 'Leave Room for the Signal', file: 'audio/exploring-laibor-mixtape/leave-room-for-the-signal.mp3', video: 'audio/exploring-laibor-mixtape/leave-room-for-the-signal.mp4', article: 'https://charleswilke.substack.com/p/confusing-clarity' },
        { title: 'No Model for This', file: 'audio/exploring-laibor-mixtape/no-model-for-this.mp3', video: 'audio/exploring-laibor-mixtape/no-model-for-this.mp4', article: 'https://charleswilke.substack.com/p/rehearsing-tomorrow' },
        { title: 'What Passes Through Us', file: 'audio/exploring-laibor-mixtape/what-passes-through-us.mp3', video: 'audio/exploring-laibor-mixtape/what-passes-through-us.mp4', article: 'https://charleswilke.substack.com/p/what-passes-through-us' },
        { title: 'The Space Between', file: 'audio/exploring-laibor-mixtape/the-space-between.mp3', video: 'audio/exploring-laibor-mixtape/the-space-between.mp4', article: 'https://charleswilke.substack.com/p/the-space-between' },
        { title: 'Treasure in the Mess', file: 'audio/exploring-laibor-mixtape/treasure-in-the-mess.mp3', video: 'audio/exploring-laibor-mixtape/treasure-in-the-mess.mp4', article: 'https://charleswilke.substack.com/p/treasure-in-the-mess' },
        { title: 'What We Carry', file: 'audio/exploring-laibor-mixtape/what-we-carry.mp3', video: 'audio/exploring-laibor-mixtape/what-we-carry.mp4', article: 'https://charleswilke.substack.com/p/our-loss-of-discernment' },
        { title: 'After Normal', file: 'audio/exploring-laibor-mixtape/after-normal.mp3', video: 'audio/exploring-laibor-mixtape/after-normal.mp4', article: 'https://charleswilke.substack.com/p/after-normal' }
    ];
    
    const aSideCover = 'audio/exploring-laibor-mixtape/exploring-laibor-mixtape-cover.webp';
    const bSideCover = 'audio/exploring-laibor-mixtape/exploring-laibor-side2-cover.webp';
    
    let tracks = aSideTracks;
    let isBSide = false;

    const lightbox = document.getElementById('mixtapeLightbox');
    const tile = document.getElementById('mixtapeTile');
    const closeBtn = document.getElementById('mixtapeClose');
    const audio = document.getElementById('mixtapeAudio');
    const trackList = document.getElementById('mixtapeTrackList');
    const trackDisplay = document.querySelector('.mixtape-current-track');
    const prevBtn = document.getElementById('mixtapePrev');
    const nextBtn = document.getElementById('mixtapeNext');
    const playPauseBtn = document.getElementById('mixtapePlayPause');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.audio-icon') : null;
    const progressBar = document.getElementById('mixtapeProgressBar');
    const progressContainer = document.getElementById('mixtapeProgressContainer');
    const timeDisplay = document.getElementById('mixtapeTime');
    const visualizerCanvas = document.getElementById('mixtapeVisualizer');
    const sideToggle = document.getElementById('sideToggleSwitch');
    const sideALabel = document.querySelector('.side-a-label');
    const sideBLabel = document.querySelector('.side-b-label');
    const coverImg = document.getElementById('mixtapeCoverImg');
    const subtitleSpan = document.querySelector('.mixtape-subtitle');
    const oscilloscopeTitle = document.getElementById('mixtapeOscilloscopeTitle');
    const oscilloscopeMeta = document.getElementById('mixtapeOscilloscopeMeta');
    const mobileNowPlaying = lightbox ? lightbox.querySelector('.mixtape-now-playing') : null;
    
    const audioEl = registerManagedAudio(audio);

    // Glyph reflects playback state. Playing → pause glyph (hidden at rest,
    // revealed + pulsing on hover, all in CSS). Paused → 'awaiting-tap' shows the
    // play glyph + "tap to play" hint, pulsing/glowing on hover. No hover JS needed.
    const MIX_PLAY_ICON = '▶';
    const MIX_PAUSE_ICON = '❚❚';
    const oscFrame = document.getElementById('mixtapeOscilloscopeFrame');
    function refreshPlayGlyph() {
        if (playPauseIcon) playPauseIcon.textContent = audio.paused ? MIX_PLAY_ICON : MIX_PAUSE_ICON;
        if (oscFrame) oscFrame.classList.toggle('awaiting-tap', audio.paused);
    }
    function armTapToPlay() {
        if (oscFrame) oscFrame.classList.add('awaiting-tap');
    }
    refreshPlayGlyph();

    let currentIndex = 0;
    let trackItems = [];

    function getCurrentRouteKey() {
        return isBSide ? 'mixtape-side-two' : 'mixtape';
    }

    function getMixtapeCollectionTitle() {
        return isBSide ? 'Exploring L.ai.bor Side Two' : 'Exploring L.ai.bor Mixtape';
    }

    function resolveTrackIndex(trackSlug) {
        const matchedIndex = findTrackIndexBySlug(tracks, trackSlug);
        return matchedIndex === -1 ? 0 : matchedIndex;
    }

    function syncMixtapeHash(method = 'replaceState') {
        if (!lightbox || !lightbox.classList.contains('active') || !tracks[currentIndex]) return;
        updateHistoryHash(buildMusicHash(getCurrentRouteKey(), tracks[currentIndex]), method);
    }

    const visualizer = createVisualizerController({
        audio: audioEl,
        visualizerCanvas,
        getPalette: (index, barCount, intensity) => {
            const baseHue = isBSide ? 38 : 168;
            const hueVariance = isBSide ? 15 : 25;
            const hue = baseHue - ((barCount - 1 - index) / barCount) * hueVariance;
            const saturation = 75 + intensity * 25;
            const lightness = 40 + intensity * 20;
            return {
                fillStyle: `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.4})`,
                shadowColor: `hsla(${hue}, 100%, 55%, ${0.4 + intensity * 0.4})`
            };
        }
    });

    const MIXTAPE_OSC_COLORS = {
        a: { trace: '#00f7c2', glow: 'rgba(0, 247, 194, 0.9)', graticule: 'rgba(0, 247, 194, 1)' },
        b: { trace: '#f7a800', glow: 'rgba(247, 168, 0, 0.9)', graticule: 'rgba(247, 168, 0, 1)' }
    };
    const mixtapeOscilloscope = createModalOscilloscope(
        document.getElementById('mixtapeOscilloscope'),
        audioEl,
        () => visualizer.getAnalyser(),
        MIXTAPE_OSC_COLORS.a
    );

    function populatePlaylist() {
        trackItems = renderTrackList(trackList, tracks, (index) => {
            loadTrack(index);
            playTrack();
        }, () => ({
            routeKey: getCurrentRouteKey(),
            collectionTitle: getMixtapeCollectionTitle()
        }));
    }
    
    // Toggle sound effect
    const toggleSound = new Audio('audio/mixtape-found.mp3');
    toggleSound.volume = 0.5;
    
    // Toggle between A-side and B-side
    function toggleSide(options = {}) {
        const {
            nextIsBSide = !isBSide,
            requestedTrackSlug = '',
            suppressHashUpdate = false
        } = options;
        const previousIsBSide = isBSide;
        const didChangeSide = nextIsBSide !== previousIsBSide;

        if (!didChangeSide && !requestedTrackSlug) return;

        isBSide = nextIsBSide;

        if (didChangeSide) {
            toggleSound.currentTime = 0;
            toggleSound.play().catch(e => console.log("Toggle sound:", e));
        }
        
        // Stop current playback
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        // Update play button
        if (playPauseIcon) {
            playPauseIcon.textContent = '▶';
        }
        visualizer.stop();

        // Update oscilloscope colors for A/B side
        if (mixtapeOscilloscope) {
            mixtapeOscilloscope.updateColors(nextIsBSide ? MIXTAPE_OSC_COLORS.b : MIXTAPE_OSC_COLORS.a);
        }

        // Switch tracks and cover
        if (isBSide) {
            tracks = bSideTracks;
            lightbox.classList.add('b-side-active');
            if (coverImg) coverImg.src = bSideCover;
            if (subtitleSpan) subtitleSpan.textContent = 'Side Two';
            if (sideALabel) sideALabel.classList.remove('active');
            if (sideBLabel) sideBLabel.classList.add('active');
        } else {
            tracks = aSideTracks;
            lightbox.classList.remove('b-side-active');
            if (coverImg) coverImg.src = aSideCover;
            if (subtitleSpan) subtitleSpan.textContent = 'Mixtape';
            if (sideALabel) sideALabel.classList.add('active');
            if (sideBLabel) sideBLabel.classList.remove('active');
        }
        
        // Reset and repopulate
        currentIndex = 0;
        populatePlaylist();
        
        // Load requested track if present, otherwise default to the first track
        loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: !suppressHashUpdate });

        if (!suppressHashUpdate) {
            syncMixtapeHash('replaceState');
        }
    }
    
    // Side toggle event listener
    if (sideToggle) {
        sideToggle.addEventListener('click', toggleSide);
    }
    
    // Initial playlist population
    populatePlaylist();

    function loadTrack(index, options = {}) {
        const { syncHash = true } = options;
        currentIndex = index;
        if (audio) {
            audio.src = tracks[index].file;
            audio.load();
        }
        updateNowPlayingDisplays({
            trackDisplay,
            glassTitle: oscilloscopeTitle,
            glassMeta: oscilloscopeMeta,
            mobileNowPlaying
        }, tracks[index].title, getMixtapeCollectionTitle());

        // Reset progress bar and time
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (timeDisplay) {
            resetAudioTimeReadout(timeDisplay);
        }

        setActiveTrackListItem(trackItems, index);

        if (syncHash) {
            syncMixtapeHash('replaceState');
        }
    }

    function playTrack() {
        pauseManagedAudioExcept(audio);
        if (audio) {
            audio.play().catch(e => console.error("Play error:", e));
        }
    }
    
    function pauseTrack() {
        if (audio) {
            audio.pause();
        }
    }

    // Set canvas dimensions
    function resizeCanvas() {
        visualizer.resize();
    }
    
    // Open/Close Mixtape functions (also handles URL hash)
    function openMixtape(openBSide = false, requestedTrackSlug = '', historyMethod = 'pushState') {
        if (lightbox) {
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
            
            // Switch to B-side if requested and not already there
            if (openBSide && !isBSide) {
                toggleSide({
                    nextIsBSide: true,
                    requestedTrackSlug,
                    suppressHashUpdate: true
                });
            } else if (!openBSide && isBSide) {
                // Switch back to A-side if opening A-side
                toggleSide({
                    nextIsBSide: false,
                    requestedTrackSlug,
                    suppressHashUpdate: true
                });
            } else if (requestedTrackSlug) {
                loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: false });
            }
            
            // Load first track if empty
            if (audio && !audio.src) {
                loadTrack(0, { syncHash: false });
            }
            // Size the visualizer canvas and start oscilloscope
            setTimeout(resizeCanvas, 50);
            if (mixtapeOscilloscope) setTimeout(() => mixtapeOscilloscope.start(), 50);
            syncMixtapeHash(historyMethod);

            // If the mini-player is holding our audio, dismiss it — full player takes over
            const mini = getMiniPlayer();
            if (mini && mini.isActive() && mini.getAudio() === audio) {
                mini.detach(false);
            }
        }
    }

    function closeMixtape() {
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; document.documentElement.style.overflow = '';
            if (mixtapeOscilloscope) mixtapeOscilloscope.stop();
            const currentRoute = parseMusicHash();
            if (currentRoute && currentRoute.player === 'mixtape') {
                history.pushState(null, '', window.location.pathname);
            }

            const mini = getMiniPlayer();
            if (audio && !audio.paused && mini) {
                const coverImg = document.getElementById('mixtapeCoverImg');
                mini.attach({
                    audio,
                    coverSrc: coverImg ? coverImg.src : '',
                    albumTitle: 'Exploring L.ai.bor',
                    theme: isBSide ? 'mixtape-b' : 'mixtape-a',
                    oscColors: isBSide ? MIXTAPE_OSC_COLORS.b : MIXTAPE_OSC_COLORS.a,
                    getAnalyser: () => visualizer.getAnalyser(),
                    getTitle: () => (tracks[currentIndex] ? tracks[currentIndex].title : ''),
                    onExpand: () => openMixtape(isBSide, '', 'pushState'),
                    onClose: () => {}
                });
            } else if (audio) {
                audio.pause();
            }
        }
    }
    
    // Event Listeners
    if (tile) {
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            openMixtape();
        });
    }
    
    // Red Button - Mixtape Trigger with CRT Effects
    const redButtonWrapper = document.getElementById('redButtonWrapper');
    const crtStaticOverlay = document.getElementById('crtStaticOverlay');
    
    // Sound effect for mixtape discovery
    const mixtapeFoundSound = new Audio('audio/mixtape-found.mp3');
    mixtapeFoundSound.volume = 0.6;
    
    if (redButtonWrapper) {
        redButtonWrapper.addEventListener('click', (e) => {
            // Add pressed class for LED burst animation
            redButtonWrapper.classList.add('pressed');
            
            // Play the discovery sound
            mixtapeFoundSound.currentTime = 0;
            mixtapeFoundSound.play().catch(err => console.log('Audio play prevented:', err));
            
            // Open mixtape with CRT power-on effect
            setTimeout(() => {
                redButtonWrapper.classList.remove('pressed');
                
                // Trigger static flash overlay at moment of lightbox reveal
                if (crtStaticOverlay) {
                    crtStaticOverlay.classList.add('active');
                    setTimeout(() => crtStaticOverlay.classList.remove('active'), 400);
                }
                
                // Add CRT power-on class before opening
                if (lightbox) {
                    lightbox.classList.add('crt-power-on');
                    
                    // Remove the class after animation completes
                    setTimeout(() => {
                        lightbox.classList.remove('crt-power-on');
                    }, 600);
                }
                
                openMixtape();
            }, 400);
        });
    }
    
    // Resize canvas on window resize
    window.addEventListener('resize', resizeCanvas);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMixtape);
    }
    
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeMixtape();
            }
        });
    }
    
    const initialMixtapeRoute = parseMusicHash();
    if (initialMixtapeRoute && initialMixtapeRoute.player === 'mixtape') {
        setTimeout(() => {
            openMixtape(
                initialMixtapeRoute.isBSide,
                initialMixtapeRoute.trackSlug,
                'replaceState'
            );
            if (initialMixtapeRoute.trackSlug) { // direct song link → play on load
                pauseManagedAudioExcept(audio);
                audio.play().catch(armTapToPlay); // autoplay blocked → show tap-to-play affordance
            }
        }, 100);
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const route = parseMusicHash();
        if (route && route.player === 'mixtape') {
            openMixtape(route.isBSide, route.trackSlug, 'replaceState');
        } else {
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = ''; document.documentElement.style.overflow = '';
                if (audio) audio.pause();
            }
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tracks.length - 1;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = (currentIndex + 1) % tracks.length;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (audio) {
        // Update progress bar and time on timeupdate
        audio.addEventListener('timeupdate', function() {
            if (progressBar && audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = progress + '%';
            }
            if (timeDisplay) {
                timeDisplay.textContent = formatAudioTime(audio.currentTime);
            }
        });

        // Update play/pause icon and visualizer
        audio.addEventListener('play', function() {
            refreshPlayGlyph();
            visualizer.start();
        });

        audio.addEventListener('pause', function() {
            refreshPlayGlyph();
            visualizer.stop();
        });

        audio.addEventListener('ended', () => {
            // Only advance to next track if not at the end
            if (currentIndex < tracks.length - 1) {
                loadTrack(currentIndex + 1);
                playTrack();
            }
            // Otherwise, just stop (don't loop back to first track)
        });
    }

    // Play/Pause button
    if (playPauseBtn && audio) {
        playPauseBtn.addEventListener('click', function() {
            pauseManagedAudioExcept(audio);
            
            if (audio.paused) {
                audio.play().catch(e => console.error("Play error:", e));
            } else {
                audio.pause();
            }
        });
    }

    setupProgressScrubbing(progressContainer, audio);

    return {
        open: openMixtape,
        close: closeMixtape
    };
}

function initGWORLightbox() {
    const gworTempArticleLink = 'https://charleswilke.substack.com/p/waiting-for-something';
    const tracks = [
        { title: 'Waiting for Something', file: 'audio/grief-without-ritual/waiting-for-something.mp3', article: 'https://charleswilke.substack.com/p/waiting-for-something' },
        { title: 'Underlined Once', file: 'audio/grief-without-ritual/underlined-once.mp3', article: 'https://en.wikipedia.org/wiki/Operation_Metro_Surge' },
        { title: 'Letter to the Editor', file: 'audio/grief-without-ritual/letter-to-the-editor.mp3', article: 'https://charleswilke.substack.com/p/letter-to-the-editor' },
        { title: 'Love at Machine Speed', file: 'audio/grief-without-ritual/love-at-machine-speed.mp3', article: 'https://charleswilke.substack.com/p/love-at-the-speed-of-inference' },
        { title: 'Slow the Clock', file: 'audio/grief-without-ritual/slow-the-clock.mp3', article: 'https://charleswilke.substack.com/p/the-future-starves-without-wonder' },
        { title: 'From the Beginning', file: 'audio/grief-without-ritual/from-the-beginning.mp3', article: 'https://charleswilke.substack.com/p/stop-collaborate-and-listen' },
        { title: 'Dearly Beloved', file: 'audio/grief-without-ritual/dearly-beloved.mp3', article: 'https://charleswilke.substack.com/p/dearly-beloved' },
        { title: 'Scattered Thunderstorms', file: 'audio/grief-without-ritual/scattered-thunderstorms.mp3', article: 'https://charleswilke.substack.com/p/scattered-thunderstorms' },
        { title: 'When Doctrine Slips', file: 'audio/grief-without-ritual/when-doctrine-slips.mp3', article: 'https://charleswilke.substack.com/p/when-doctrine-slips' },
        { title: 'Refuse the Frequency', file: 'audio/grief-without-ritual/refuse-the-frequency.mp3', article: 'https://charleswilke.substack.com/p/salve-for-the-algorithmic-rash' },
        { title: 'Cherish Your Confident Ire', file: 'audio/grief-without-ritual/cherish-your-confident-ire.mp3', article: 'https://charleswilke.substack.com/p/cherish-your-confident-ire' }
    ];

    const lightbox = document.getElementById('gworLightbox');
    const tile = document.getElementById('gworTile');
    const closeBtn = document.getElementById('gworClose');
    const audio = document.getElementById('gworAudio');
    const trackList = document.getElementById('gworTrackList');
    const trackDisplay = document.getElementById('gworCurrentTrack');
    const prevBtn = document.getElementById('gworPrev');
    const nextBtn = document.getElementById('gworNext');
    const playPauseBtn = document.getElementById('gworPlayPause');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.audio-icon') : null;
    const PLAY_ICON = '\u25B6';
    const PAUSE_ICON = '\u275A\u275A';
    const progressBar = document.getElementById('gworProgressBar');
    const progressContainer = document.getElementById('gworProgressContainer');
    const timeDisplay = document.getElementById('gworTime');
    const visualizerCanvas = document.getElementById('gworVisualizer');
    const oscilloscopeTitle = document.getElementById('gworOscilloscopeTitle');
    const mobileNowPlaying = lightbox ? lightbox.querySelector('.mixtape-now-playing') : null;
    if (!lightbox || !tile || !audio || !trackList) return;

    if (playPauseIcon) {
        playPauseIcon.textContent = PLAY_ICON;
    }

    // Glyph reflects playback state. Playing → pause glyph (hidden at rest,
    // revealed + pulsing on hover, all in CSS). Paused → 'awaiting-tap' shows the
    // play glyph + "tap to play" hint, pulsing/glowing on hover. No hover JS needed.
    const oscFrame = document.getElementById('gworOscilloscopeFrame');
    function refreshPlayGlyph() {
        if (playPauseIcon) playPauseIcon.textContent = audio.paused ? PLAY_ICON : PAUSE_ICON;
        if (oscFrame) oscFrame.classList.toggle('awaiting-tap', audio.paused);
    }
    function armTapToPlay() {
        if (oscFrame) oscFrame.classList.add('awaiting-tap');
    }
    refreshPlayGlyph();

    const audioEl = registerManagedAudio(audio);
    let currentIndex = 0;
    let trackItems = [];

    function resolveTrackIndex(trackSlug) {
        const matchedIndex = findTrackIndexBySlug(tracks, trackSlug);
        return matchedIndex === -1 ? 0 : matchedIndex;
    }

    function syncGWORHash(method = 'replaceState') {
        if (!lightbox || !lightbox.classList.contains('active') || !tracks[currentIndex]) return;
        updateHistoryHash(buildMusicHash('gwor', tracks[currentIndex]), method);
    }

    const visualizer = createVisualizerController({
        audio: audioEl,
        visualizerCanvas,
        getPalette: (index, barCount, intensity) => {
            const baseHue = 6;
            const hueVariance = 12;
            const hue = baseHue - ((barCount - 1 - index) / barCount) * hueVariance;
            const saturation = 42 + intensity * 20;
            const lightness = 42 + intensity * 16;
            return {
                fillStyle: `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.4})`,
                shadowColor: `hsla(${hue}, 100%, 55%, ${0.4 + intensity * 0.4})`
            };
        }
    });

    const gworOscilloscope = createModalOscilloscope(
        document.getElementById('gworOscilloscope'),
        audioEl,
        () => visualizer.getAnalyser(),
        { trace: '#c54a4a', glow: 'rgba(197, 74, 74, 0.9)', graticule: 'rgba(197, 74, 74, 1)' }
    );

    function populatePlaylist() {
        trackItems = renderTrackList(trackList, tracks, (index) => {
            loadTrack(index);
            playTrack();
        }, () => ({
            routeKey: 'gwor',
            collectionTitle: 'Grief without Ritual'
        }));
    }

    function loadTrack(index, options = {}) {
        const { syncHash = true } = options;
        currentIndex = index;
        audio.src = tracks[index].file;
        audio.load();
        updateNowPlayingDisplays({
            trackDisplay,
            glassTitle: oscilloscopeTitle,
            mobileNowPlaying
        }, tracks[index].title);

        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (timeDisplay) {
            resetAudioTimeReadout(timeDisplay);
        }

        setActiveTrackListItem(trackItems, index);

        if (syncHash) {
            syncGWORHash('replaceState');
        }
    }

    function playTrack() {
        pauseManagedAudioExcept(audio);
        audio.play().catch(e => console.error('Play error:', e));
    }

    function resizeCanvas() {
        visualizer.resize();
    }

    function openGWOR(requestedTrackSlug = '', historyMethod = 'pushState') {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
        if (requestedTrackSlug) {
            loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: false });
        } else if (!audio.src) {
            loadTrack(0, { syncHash: false });
        }
        setTimeout(resizeCanvas, 50);
        if (gworOscilloscope) setTimeout(() => gworOscilloscope.start(), 50);
        syncGWORHash(historyMethod);

        const mini = getMiniPlayer();
        if (mini && mini.isActive() && mini.getAudio() === audio) {
            mini.detach(false);
        }
    }

    function closeGWOR() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; document.documentElement.style.overflow = '';
        if (gworOscilloscope) gworOscilloscope.stop();
        const currentRoute = parseMusicHash();
        if (currentRoute && currentRoute.player === 'gwor') {
            history.pushState(null, '', window.location.pathname);
        }

        const mini = getMiniPlayer();
        if (audio && !audio.paused && mini) {
            const coverImg = document.getElementById('gworCoverImg');
            mini.attach({
                audio,
                coverSrc: coverImg ? coverImg.src : '',
                albumTitle: 'Grief without Ritual',
                theme: 'gwor',
                oscColors: { trace: '#c54a4a', glow: 'rgba(197, 74, 74, 0.9)', graticule: 'rgba(197, 74, 74, 1)' },
                getAnalyser: () => visualizer.getAnalyser(),
                getTitle: () => (tracks[currentIndex] ? tracks[currentIndex].title : ''),
                onExpand: () => openGWOR('', 'pushState'),
                onClose: () => {}
            });
        } else if (audio) {
            audio.pause();
        }
    }

    populatePlaylist();

    tile.addEventListener('click', (e) => {
        e.preventDefault();
        openGWOR();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeGWOR);
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeGWOR();
        }
    });

    window.addEventListener('resize', resizeCanvas);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tracks.length - 1;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = (currentIndex + 1) % tracks.length;
            loadTrack(newIndex);
            playTrack();
        });
    }

    audio.addEventListener('timeupdate', function() {
        if (progressBar && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = progress + '%';
        }
        if (timeDisplay) {
            setAudioTimeReadout(timeDisplay, audio);
        }
    });

    audio.addEventListener('play', function() {
        refreshPlayGlyph();
        visualizer.start();
    });

    audio.addEventListener('pause', function() {
        refreshPlayGlyph();
        visualizer.stop();
    });

    audio.addEventListener('ended', () => {
        if (currentIndex < tracks.length - 1) {
            loadTrack(currentIndex + 1);
            playTrack();
        }
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            pauseManagedAudioExcept(audio);

            if (audio.paused) {
                audio.play().catch(e => console.error('Play error:', e));
            } else {
                audio.pause();
            }
        });
    }

    setupProgressScrubbing(progressContainer, audio);

    const initialGWORRoute = parseMusicHash();
    if (initialGWORRoute && initialGWORRoute.player === 'gwor') {
        setTimeout(() => {
            openGWOR(initialGWORRoute.trackSlug, 'replaceState');
            if (initialGWORRoute.trackSlug) { // direct song link → play on load
                pauseManagedAudioExcept(audio);
                audio.play().catch(armTapToPlay); // autoplay blocked → show tap-to-play affordance
            }
        }, 100);
    }

    window.addEventListener('popstate', () => {
        const route = parseMusicHash();
        if (route && route.player === 'gwor') {
            openGWOR(route.trackSlug, 'replaceState');
        } else if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; document.documentElement.style.overflow = '';
            audio.pause();
        }
    });

    return {
        open: openGWOR,
        close: closeGWOR
    };
}

function initJCLightbox() {
    const tracks = [
        { title: 'Why This Way', act: 'Act I', file: 'audio/junkyard-cabaret/why-this-way.mp3', cover: 'audio/junkyard-cabaret/why-this-way-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/the-narrower-path' },
        { title: 'Cathedral of Junk', file: 'audio/junkyard-cabaret/cathedral-of-junk.mp3', cover: 'audio/junkyard-cabaret/cathedral-of-junk-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/theaters-last-stand' },
        { title: 'Pauses Gone', file: 'audio/junkyard-cabaret/pauses-gone.mp3', cover: 'audio/junkyard-cabaret/pauses-gone-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/staccato-again' },
        { title: 'Three Fifteen', file: 'audio/junkyard-cabaret/three-fifteen.mp3', cover: 'audio/junkyard-cabaret/three-fifteen-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/accumulated-velocity' },
        { title: 'House Lights', file: 'audio/junkyard-cabaret/house-lights.mp3', cover: 'audio/junkyard-cabaret/house-lights-title.webp?v=202606071656', article: 'https://claude.ai/share/55400033-7fb7-4d4f-bb85-ddadd5fdc57f' },
        { title: 'The New Survivalism', file: 'audio/junkyard-cabaret/the-new-survivalism.mp3?v=202605251410', cover: 'audio/junkyard-cabaret/the-new-survivalism-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/the-new-survivalism' },
        { title: 'Hip Height', file: 'audio/junkyard-cabaret/hip-height.mp3', cover: 'audio/junkyard-cabaret/hip-height-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/know-thyself' },
        { title: 'How Dare It Rise', file: 'audio/junkyard-cabaret/how-dare-it-rise.mp3', cover: 'audio/junkyard-cabaret/how-dare-it-rise.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/your-right' },
        { title: 'Everything Must Go', act: 'Act II', file: 'audio/junkyard-cabaret/everything-must-go.mp3', cover: 'audio/junkyard-cabaret/everything-must-go-title.webp?v=202606071656', article: 'https://charleswilke.substack.com/p/singular-intention' }
    ];

    const lightbox = document.getElementById('jcLightbox');
    const tile = document.getElementById('jcTile');
    const closeBtn = document.getElementById('jcClose');
    const audio = document.getElementById('jcAudio');
    const trackList = document.getElementById('jcTrackList');
    const trackDisplay = document.getElementById('jcCurrentTrack');
    const prevBtn = document.getElementById('jcPrev');
    const nextBtn = document.getElementById('jcNext');
    const playPauseBtn = document.getElementById('jcPlayPause');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.audio-icon') : null;
    const PLAY_ICON = '\u25B6';
    const PAUSE_ICON = '\u275A\u275A';
    const progressBar = document.getElementById('jcProgressBar');
    const progressContainer = document.getElementById('jcProgressContainer');
    const timeDisplay = document.getElementById('jcTime');
    const visualizerCanvas = document.getElementById('jcVisualizer');
    const oscilloscopeTitle = document.getElementById('jcOscilloscopeTitle');
    const mobileNowPlaying = lightbox ? lightbox.querySelector('.mixtape-now-playing') : null;
    const coverImg = document.getElementById('jcCoverImg');
    const albumCoverSrc = coverImg ? coverImg.src : '';
    if (!lightbox || !tile || !audio || !trackList) return;

    if (playPauseIcon) {
        playPauseIcon.textContent = PLAY_ICON;
    }

    // Glyph reflects playback state. Playing → pause glyph (hidden at rest,
    // revealed + pulsing on hover, all in CSS). Paused → 'awaiting-tap' shows the
    // play glyph + "tap to play" hint, pulsing/glowing on hover. No hover JS needed.
    const oscFrame = document.getElementById('jcOscilloscopeFrame');
    function refreshPlayGlyph() {
        if (playPauseIcon) playPauseIcon.textContent = audio.paused ? PLAY_ICON : PAUSE_ICON;
        if (oscFrame) oscFrame.classList.toggle('awaiting-tap', audio.paused);
    }
    function armTapToPlay() {
        if (oscFrame) oscFrame.classList.add('awaiting-tap');
    }
    refreshPlayGlyph();

    const audioEl = registerManagedAudio(audio);
    let currentIndex = 0;
    let trackItems = [];
    let isChangingTrack = false;

    function resolveTrackIndex(trackSlug) {
        const matchedIndex = findTrackIndexBySlug(tracks, trackSlug);
        return matchedIndex === -1 ? 0 : matchedIndex;
    }

    function syncJCHash(method = 'replaceState') {
        if (!lightbox || !lightbox.classList.contains('active') || !tracks[currentIndex]) return;
        updateHistoryHash(buildMusicHash('junkyard-cabaret', tracks[currentIndex]), method);
    }

    const visualizer = createVisualizerController({
        audio: audioEl,
        visualizerCanvas,
        getPalette: (index, barCount, intensity) => {
            const baseHue = 22;
            const hueVariance = 16;
            const hue = baseHue - ((barCount - 1 - index) / barCount) * hueVariance;
            const saturation = 55 + intensity * 20;
            const lightness = 38 + intensity * 18;
            return {
                fillStyle: `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.4})`,
                shadowColor: `hsla(${hue}, 100%, 50%, ${0.4 + intensity * 0.4})`
            };
        }
    });

    const jcOscilloscope = createModalOscilloscope(
        document.getElementById('jcOscilloscope'),
        audioEl,
        () => visualizer.getAnalyser(),
        { trace: '#c27038', glow: 'rgba(194, 112, 56, 0.9)', graticule: 'rgba(194, 112, 56, 1)' }
    );

    function populatePlaylist() {
        trackItems = renderTrackList(trackList, tracks, (index) => {
            loadTrack(index);
            playTrack();
        }, () => ({
            routeKey: 'junkyard-cabaret',
            collectionTitle: 'Junkyard Cabaret'
        }));
    }

    function showAlbumCover() {
        if (!coverImg) return;
        if (coverImg.src !== albumCoverSrc) {
            coverImg.src = albumCoverSrc;
        }
        coverImg.alt = 'Junkyard Cabaret Cover';
    }

    function showTrackCover(index) {
        if (!coverImg) return;
        const track = tracks[index];
        if (!track || !track.cover) {
            showAlbumCover();
            return;
        }
        const trackCoverUrl = new URL(track.cover, window.location.href).href;
        if (coverImg.src !== trackCoverUrl) {
            coverImg.src = track.cover;
        }
        coverImg.alt = `${track.title} title art`;
    }

    function loadTrack(index, options = {}) {
        const { syncHash = true } = options;
        const wasPlaying = !audio.paused;
        isChangingTrack = wasPlaying;
        currentIndex = index;
        audio.src = tracks[index].file;
        audio.load();
        if (wasPlaying) {
            showTrackCover(index);
        } else {
            showAlbumCover();
        }
        updateNowPlayingDisplays({
            trackDisplay,
            glassTitle: oscilloscopeTitle,
            mobileNowPlaying
        }, tracks[index].title);

        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (timeDisplay) {
            resetAudioTimeReadout(timeDisplay);
        }

        setActiveTrackListItem(trackItems, index);

        if (syncHash) {
            syncJCHash('replaceState');
        }
    }

    function playTrack() {
        pauseManagedAudioExcept(audio);
        audio.play().catch(e => console.error('Play error:', e));
    }

    function resizeCanvas() {
        visualizer.resize();
    }

    function openJC(requestedTrackSlug = '', historyMethod = 'pushState') {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
        if (requestedTrackSlug) {
            loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: false });
        } else if (!audio.src) {
            loadTrack(0, { syncHash: false });
        }
        setTimeout(resizeCanvas, 50);
        if (jcOscilloscope) setTimeout(() => jcOscilloscope.start(), 50);
        syncJCHash(historyMethod);

        const mini = getMiniPlayer();
        if (mini && mini.isActive() && mini.getAudio() === audio) {
            mini.detach(false);
        }
    }

    function closeJC() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; document.documentElement.style.overflow = '';
        if (jcOscilloscope) jcOscilloscope.stop();
        const currentRoute = parseMusicHash();
        if (currentRoute && currentRoute.player === 'junkyard-cabaret') {
            history.pushState(null, '', window.location.pathname);
        }

        const mini = getMiniPlayer();
        if (audio && !audio.paused && mini) {
            mini.attach({
                audio,
                coverSrc: coverImg ? coverImg.src : '',
                albumTitle: 'Junkyard Cabaret',
                theme: 'jc',
                oscColors: { trace: '#c27038', glow: 'rgba(194, 112, 56, 0.9)', graticule: 'rgba(194, 112, 56, 1)' },
                getAnalyser: () => visualizer.getAnalyser(),
                getTitle: () => (tracks[currentIndex] ? tracks[currentIndex].title : ''),
                onExpand: () => openJC('', 'pushState'),
                onClose: () => {}
            });
        } else if (audio) {
            audio.pause();
        }
    }

    populatePlaylist();

    tile.addEventListener('click', (e) => {
        e.preventDefault();
        openJC();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeJC);
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeJC();
        }
    });

    window.addEventListener('resize', resizeCanvas);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tracks.length - 1;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = (currentIndex + 1) % tracks.length;
            loadTrack(newIndex);
            playTrack();
        });
    }

    audio.addEventListener('timeupdate', function() {
        if (progressBar && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = progress + '%';
        }
        if (timeDisplay) {
            setAudioTimeReadout(timeDisplay, audio);
        }
    });

    audio.addEventListener('play', function() {
        isChangingTrack = false;
        refreshPlayGlyph();
        visualizer.start();
        showTrackCover(currentIndex);
    });

    audio.addEventListener('pause', function() {
        refreshPlayGlyph();
        visualizer.stop();
        if (!audio.ended && !isChangingTrack) {
            showAlbumCover();
        }
    });

    audio.addEventListener('ended', () => {
        if (currentIndex < tracks.length - 1) {
            loadTrack(currentIndex + 1);
            playTrack();
        } else {
            showAlbumCover();
        }
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            pauseManagedAudioExcept(audio);

            if (audio.paused) {
                audio.play().catch(e => console.error('Play error:', e));
            } else {
                audio.pause();
            }
        });
    }

    setupProgressScrubbing(progressContainer, audio);

    const initialJCRoute = parseMusicHash();
    if (initialJCRoute && initialJCRoute.player === 'junkyard-cabaret') {
        setTimeout(() => {
            openJC(initialJCRoute.trackSlug, 'replaceState');
            if (initialJCRoute.trackSlug) { // direct song link → play on load
                pauseManagedAudioExcept(audio);
                audio.play().catch(armTapToPlay); // autoplay blocked → show tap-to-play affordance
            }
        }, 100);
    }

    window.addEventListener('popstate', () => {
        const route = parseMusicHash();
        if (route && route.player === 'junkyard-cabaret') {
            openJC(route.trackSlug, 'replaceState');
        } else if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; document.documentElement.style.overflow = '';
            audio.pause();
        }
    });

    return {
        open: openJC,
        close: closeJC
    };
}

function bindLazyMediaTrigger(element, ensureInitialized, openCallback) {
    if (!element) return;

    element.addEventListener('pointerenter', ensureInitialized, { once: true });
    element.addEventListener('focusin', ensureInitialized, { once: true });
    element.addEventListener('touchstart', ensureInitialized, { once: true, passive: true });

    element.addEventListener('click', (event) => {
        const instance = ensureInitialized();
        if (instance && typeof openCallback === 'function') {
            event.preventDefault();
            event.stopImmediatePropagation();
            openCallback(instance);
        }
    }, { capture: true, once: true });
}

function initDeferredHomepageMedia() {
    const ensureMixtapeLightbox = createLazyInitializer(initMixtapeLightbox);
    const ensureGWORLightbox = createLazyInitializer(initGWORLightbox);
    const ensureJCLightbox = createLazyInitializer(initJCLightbox);
    const mixtapeTile = document.getElementById('mixtapeTile');
    const gworTile = document.getElementById('gworTile');
    const jcTile = document.getElementById('jcTile');
    const redButtonWrapper = document.getElementById('redButtonWrapper');
    const gworButtonWrapper = document.getElementById('gworButtonWrapper');
    const initialRoute = parseMusicHash();

    bindLazyMediaTrigger(mixtapeTile, ensureMixtapeLightbox, (instance) => {
        instance.open(false);
    });

    bindLazyMediaTrigger(redButtonWrapper, ensureMixtapeLightbox, (instance) => {
        window.setTimeout(() => {
            redButtonWrapper.click();
        }, 0);
    });

    bindLazyMediaTrigger(gworTile, ensureGWORLightbox, (instance) => {
        instance.open();
    });

    bindLazyMediaTrigger(jcTile, ensureJCLightbox, (instance) => {
        instance.open();
    });

    // GWOR grey LED — persistent click handler (bindLazyMediaTrigger is once-only)
    if (gworButtonWrapper) {
        const gworFoundSound = new Audio('audio/mixtape-found.mp3');
        gworFoundSound.volume = 0.6;

        gworButtonWrapper.addEventListener('click', () => {
            gworButtonWrapper.classList.add('pressed');
            gworFoundSound.currentTime = 0;
            gworFoundSound.play().catch(() => {});

            setTimeout(() => {
                gworButtonWrapper.classList.remove('pressed');
                const instance = ensureGWORLightbox();
                if (instance) instance.open();
            }, 300);
        });
    }

    if (initialRoute && initialRoute.player === 'mixtape') {
        ensureMixtapeLightbox();
    }

    if (initialRoute && initialRoute.player === 'gwor') {
        ensureGWORLightbox();
    }

    if (initialRoute && initialRoute.player === 'junkyard-cabaret') {
        ensureJCLightbox();
    }
}

function initDeferredHomepageEffects() {
    scheduleIdleWork(() => {
        initHeaderGlitchEffects();
        initLaiborGlitchEffects();
        initFaqGlitchTimer();
    }, 2000);
}

function initCoverZoom() {
    const zoom = document.getElementById('coverZoom');
    const zoomImg = document.getElementById('coverZoomImg');
    const zoomClose = document.getElementById('coverZoomClose');
    if (!zoom || !zoomImg) return;

    const open = (src, alt) => {
        zoomImg.src = src;
        zoomImg.alt = alt || '';
        zoom.hidden = false;
        requestAnimationFrame(() => zoom.setAttribute('data-open', 'true'));
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        zoom.removeAttribute('data-open');
        document.body.style.overflow = '';
        setTimeout(() => {
            zoom.hidden = true;
            zoomImg.src = '';
        }, 200);
    };

    document.querySelectorAll('.mixtape-cover').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            open(img.currentSrc || img.src, img.alt);
        });
        img.setAttribute('role', 'button');
        img.setAttribute('tabindex', '0');
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(img.currentSrc || img.src, img.alt);
            }
        });
    });

    zoom.addEventListener('click', close);
    if (zoomClose) zoomClose.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && zoom.getAttribute('data-open') === 'true') close();
    });
}

onReady(() => {
    initRSSFallbackFetch();
    initTimeDial();
    initEmailGlitchEffects();
    initCustomAudioPlayers();
    initPetLightboxLinks();
    initDeferredHomepageMedia();
    initDeferredHomepageEffects();
    initCoverZoom();
});

// ===== STICKY NAV handled by common.js =====
