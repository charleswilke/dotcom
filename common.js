/**
 * Common JavaScript utilities shared across charleswilke.com
 */

// Security: ensure all target=_blank links also include noopener/noreferrer
(function secureExternalLinks() {
    Array.from(document.querySelectorAll('a[target="_blank"]')).forEach(a => {
        const rel = (a.getAttribute('rel') || '');
        if (!/noopener/i.test(rel) || !/noreferrer/i.test(rel)) {
            a.setAttribute('rel', (rel + ' noopener noreferrer').trim());
        }
    });
})();

// Footer note glitch effect
function triggerGlitchFooterNote() {
    const note = document.querySelector('.footer-note');
    if (!note) return;
    note.classList.add('glitch');
    setTimeout(() => {
        note.classList.remove('glitch');
        setTimeout(triggerGlitchFooterNote, 2200 + Math.random() * 5000);
    }, 100 + Math.random() * 150);
}

// ===== STICKY NAV =====
function initStickyNav() {
    const nav = document.getElementById('siteNav');
    const hamburger = document.getElementById('navHamburger');
    const navLinks = document.getElementById('navLinks');
    const allDropdownWraps = document.querySelectorAll('.nav-explore-wrap');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const sectionNavLinks = document.querySelectorAll('[data-section]');
    const navLogo = document.getElementById('navLogo');

    if (!nav) return;

    // --- Show nav logo only after header scrolls out of view ---
    const siteHeader = document.querySelector('header');
    if (navLogo && siteHeader) {
        const headerObserver = new IntersectionObserver(
            ([entry]) => {
                navLogo.classList.toggle('visible', !entry.isIntersecting);
            },
            { threshold: 0 }
        );
        headerObserver.observe(siteHeader);
    }

    // --- Hide/show on scroll ---
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                if (currentY > lastScrollY && currentY > 80) {
                    nav.classList.add('nav-hidden');
                } else {
                    nav.classList.remove('nav-hidden');
                }
                nav.classList.toggle('nav-scrolled', currentY > 20);
                lastScrollY = currentY;
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // --- Active section tracking (homepage only) ---
    const sectionIds = ['l.ai.bor', 'game-cartridges', 'albums', 'projections', 'about'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean)
        .sort((a, b) => a.offsetTop - b.offsetTop);

    function updateActiveLink() {
        const scrollMid = window.scrollY + window.innerHeight / 3;
        let activeId = null;
        for (const section of sections) {
            if (section.offsetTop <= scrollMid) {
                activeId = section.id;
            }
        }
        allNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === activeId);
        });
    }
    if (sections.length) {
        window.addEventListener('scroll', updateActiveLink, { passive: true });
        updateActiveLink();
    }

    // --- Smooth scroll for section links (homepage only) ---
    sectionNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.getElementById(link.dataset.section);
            if (target) {
                e.preventDefault();
                nav.classList.remove('nav-hidden');
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                closeAllDropdowns();
                const offset = nav.offsetHeight + 8;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // --- Dropdowns (Games, Music, Explore) ---
    function closeAllDropdowns() {
        allDropdownWraps.forEach(wrap => {
            const btn = wrap.querySelector('.nav-explore-btn');
            const dd = wrap.querySelector('.nav-dropdown');
            if (dd) dd.classList.remove('open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }

    allDropdownWraps.forEach(wrap => {
        const btn = wrap.querySelector('.nav-explore-btn');
        const dd = wrap.querySelector('.nav-dropdown');
        if (!btn || !dd) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dd.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                dd.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) closeAllDropdowns();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllDropdowns();
    });

    // --- Hamburger (mobile) ---
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('open');
        navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen) closeAllDropdowns();
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyNav);
    } else {
        initStickyNav();
    }
}());
// ===== END STICKY NAV =====

// ===== HEADER WORDMARK SIGNAL =====
// Every page's header is the SVG wordmark, so its momentary chroma burst lives
// here rather than in main.js; index and the three subpages share this copy.
function initHeaderGlitchEffects() {
    const header = document.querySelector('.header-wordmark');
    const artwork = header?.querySelector('img');
    if (!artwork) return;

    const signal = document.createElement('span');
    signal.className = 'wordmark-signal';
    signal.setAttribute('aria-hidden', 'true');
    // The wordmark is a <picture>: under 768px the compact SVG is served, so read the
    // face the browser actually chose, not the src attribute, or the overlay stretches
    // the wide artwork into the compact box. currentSrc is empty until the image starts
    // loading, hence the fallback.
    const syncArt = () => {
        signal.style.setProperty('--wordmark-art', `url("${artwork.currentSrc || artwork.getAttribute('src')}")`);
    };
    syncArt();
    header.appendChild(signal);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const classes = ['signal-chroma', 'signal-soft'];
    let visible = false;
    let firstBurst = true;
    let nextBurst;
    let endBurst;

    const clear = () => {
        clearTimeout(nextBurst);
        clearTimeout(endBurst);
        header.classList.remove(...classes);
    };
    const canAnimate = () => visible && !document.hidden && !reducedMotion.matches;
    const schedule = () => {
        clear();
        if (!canAnimate()) return;
        const delay = firstBurst ? 6000 + Math.random() * 4000 : 12000 + Math.random() * 12000;
        nextBurst = setTimeout(() => {
            if (!canAnimate()) return;
            firstBurst = false;
            syncArt();
            header.classList.add('signal-chroma');
            // Favor the subtle split, with an occasional stronger red/cyan burst.
            header.classList.toggle('signal-soft', Math.random() < 0.65);
            endBurst = setTimeout(schedule, 240);
        }, delay);
    };

    // Returning to the header starts a fresh quiet interval, never a catch-up burst.
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        schedule();
    });
    observer.observe(header);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
}
// ===== END HEADER WORDMARK SIGNAL =====

document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year dynamically (fallback for hardcoded value)
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    setTimeout(triggerGlitchFooterNote, 2500 + Math.random() * 3000);

    // Off the critical path: the first burst is 6-10s out anyway.
    (window.requestIdleCallback || (cb => setTimeout(cb, 1)))(initHeaderGlitchEffects, { timeout: 2000 });
});

// ===== TUNER SCROLLBAR =====
(() => {
    const root = document.documentElement;
    const THUMB_HEIGHT = 60;

    let thumbEl = null;
    let thumbDragActive = false;
    const getScrollMetrics = () => {
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const trackLen = Math.max(0, window.innerHeight - THUMB_HEIGHT);
        return { max, trackLen };
    };
    const clampScroll = (scrollTop, max) => Math.min(max, Math.max(0, scrollTop));
    const setThumbTopForScroll = (scrollTop, max, trackLen) => {
        const clampedScroll = clampScroll(scrollTop, max);
        const top = max > 0 ? (clampedScroll / max) * trackLen : 0;
        root.style.setProperty('--tuner-thumb-top', `${top}px`);
        return clampedScroll;
    };
    const ensureThumb = () => {
        if (thumbEl) return thumbEl;
        thumbEl = document.createElement('div');
        thumbEl.className = 'tuner-thumb';
        thumbEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(thumbEl);
        attachDrag(thumbEl);
        thumbEl.addEventListener('animationend', () => {
            thumbEl.classList.remove('is-settling');
            thumbEl.classList.remove('is-touch-release');
        });
        return thumbEl;
    };

    const updateThumb = () => {
        const el = ensureThumb();
        const { max, trackLen } = getScrollMetrics();
        if (max <= 0) { el.style.display = 'none'; return; }
        el.style.display = '';
        setThumbTopForScroll(window.scrollY, max, trackLen);
    };

    const attachDrag = (el) => {
        let dragging = false;
        let activePointerId = null;
        let startY = 0;
        let startScroll = 0;
        let primeTimer = null;
        let primed = false;
        let moved = false;
        let dragRaf = 0;
        let pendingDrag = null;
        const applyDragFrame = () => {
            if (pendingDrag) {
                const { scrollTop, max, trackLen } = pendingDrag;
                const clampedScroll = setThumbTopForScroll(scrollTop, max, trackLen);
                window.scrollTo(0, clampedScroll);
                pendingDrag = null;
            }
            dragRaf = 0;
        };
        const scheduleDragFrame = (scrollTop, max, trackLen) => {
            pendingDrag = { scrollTop, max, trackLen };
            if (dragRaf) return;
            dragRaf = requestAnimationFrame(applyDragFrame);
        };
        const addWindowListeners = () => {
            window.addEventListener('pointermove', handleMove, { passive: false });
            window.addEventListener('pointerup', stop);
            window.addEventListener('pointercancel', stop);
            window.addEventListener('blur', stop);
        };
        const removeWindowListeners = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
            window.removeEventListener('blur', stop);
        };
        const handleMove = (e) => {
            if (!dragging) return;
            if (e.pointerId !== undefined && activePointerId !== null && e.pointerId !== activePointerId) return;
            e.preventDefault();
            const dy = e.clientY - startY;
            const { max, trackLen } = getScrollMetrics();
            if (trackLen <= 0 || max <= 0) return;
            if (!moved && Math.abs(dy) > 1) {
                moved = true;
                el.classList.add('is-scrolling');
            }
            const newScroll = startScroll + (dy / trackLen) * max;
            scheduleDragFrame(newScroll, max, trackLen);
        };
        const stop = (e = {}) => {
            if (!dragging) return;
            if (e.pointerId !== undefined && activePointerId !== null && e.pointerId !== activePointerId) return;
            dragging = false;
            thumbDragActive = false;
            clearTimeout(primeTimer);
            if (dragRaf) {
                cancelAnimationFrame(dragRaf);
                applyDragFrame();
            }
            removeWindowListeners();
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
            startScroll = window.scrollY;
            el.classList.add('is-dragging');
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
            addWindowListeners();
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
    };

    let ticking = false;
    const onScroll = () => {
        if (thumbDragActive) return;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateThumb(); ticking = false; });
    };

    const injectSegments = () => {
        document.querySelectorAll('[data-tuner-theme]').forEach(sec => {
            if (sec.querySelector(':scope > .tuner-segment')) return;
            const seg = document.createElement('div');
            seg.className = 'tuner-segment';
            seg.setAttribute('aria-hidden', 'true');
            sec.appendChild(seg);
        });
    };
    const alignSegments = () => {
        document.querySelectorAll('[data-tuner-theme] > .tuner-segment').forEach(seg => {
            const top = seg.parentElement.getBoundingClientRect().top + window.scrollY;
            const offset = -(((top % 24) + 24) % 24);
            seg.style.backgroundPositionY = `${offset}px, ${offset}px`;
        });
    };
    const init = () => { injectSegments(); alignSegments(); updateThumb(); };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.addEventListener('load', init);
    window.addEventListener('resize', () => { alignSegments(); updateThumb(); }, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
})();
