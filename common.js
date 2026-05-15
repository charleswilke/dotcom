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
    const sectionIds = ['writing', 'projections', 'about'];
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

// ===== HEADER CRT GLITCH (subpages - skipped when main.js handles it) =====
const COMMON_GLITCH_CLASSES = ['glitch', 'glitch-scanlines', 'glitch-tear', 'glitch-vhold', 'glitch-interlace', 'glitch-static'];

function commonClearGlitch(el) {
    el.classList.remove(...COMMON_GLITCH_CLASSES);
}

function commonTriggerGlitch(header) {
    if (!header) return;

    const roll = Math.random();
    const classes = ['glitch'];
    let duration;

    if (roll > 0.88) {
        classes.length = 0;
        classes.push('glitch-vhold');
        duration = 600;
    } else if (roll > 0.72) {
        classes.push('glitch-tear', 'glitch-interlace');
        duration = 400 + Math.random() * 150;
    } else if (roll > 0.55) {
        classes.push('glitch-scanlines');
        duration = 350 + Math.random() * 150;
    } else if (roll > 0.40) {
        classes.push('glitch-interlace');
        duration = 300 + Math.random() * 100;
    } else {
        duration = 250 + Math.random() * 100;
    }

    classes.forEach(cls => header.classList.add(cls));

    setTimeout(() => {
        commonClearGlitch(header);

        if (Math.random() > 0.85) {
            setTimeout(() => {
                header.classList.add('glitch');
                setTimeout(() => {
                    header.classList.remove('glitch');
                    if (Math.random() > 0.5) {
                        setTimeout(() => {
                            header.classList.add('glitch', 'glitch-tear');
                            setTimeout(() => {
                                commonClearGlitch(header);
                                setTimeout(() => commonTriggerGlitch(header), 3000 + Math.random() * 4000);
                            }, 150);
                        }, 80 + Math.random() * 50);
                    } else {
                        setTimeout(() => commonTriggerGlitch(header), 3000 + Math.random() * 4000);
                    }
                }, 120 + Math.random() * 80);
            }, 100 + Math.random() * 100);
        } else {
            setTimeout(() => commonTriggerGlitch(header), 2500 + Math.random() * 5000);
        }
    }, duration);
}

function initCommonHeaderGlitch() {
    // Skip if main.js already initialized the header glitch (index.html)
    if (window.__headerGlitchInit) return;
    const header = document.querySelector('.header-title');
    if (!header) return;
    setTimeout(() => commonTriggerGlitch(header), 1500 + Math.random() * 2000);
}
// ===== END HEADER CRT GLITCH =====

document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year dynamically (fallback for hardcoded value)
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    setTimeout(triggerGlitchFooterNote, 2500 + Math.random() * 3000);

    // Init header glitch for subpages (deferred to let main.js claim it first if present)
    setTimeout(initCommonHeaderGlitch, 100);
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
