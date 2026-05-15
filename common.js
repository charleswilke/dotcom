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

    // --- Smooth scroll for anchor links (homepage only) ---
    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.getElementById(link.dataset.section);
            if (target) {
                e.preventDefault();
                nav.classList.remove('nav-hidden');
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
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
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) { el.style.display = 'none'; return; }
        el.style.display = '';
        const ratio = Math.min(1, Math.max(0, window.scrollY / max));
        const top = ratio * (window.innerHeight - THUMB_HEIGHT);
        root.style.setProperty('--tuner-thumb-top', `${top}px`);
    };

    const attachDrag = (el) => {
        let dragging = false;
        let startY = 0;
        let startScroll = 0;
        let primeTimer = null;
        let primed = false;
        let moved = false;
        let touchActive = false;
        let scrollRaf = 0;
        let pendingScroll = 0;
        const scheduleScroll = (top) => {
            pendingScroll = top;
            if (scrollRaf) return;
            scrollRaf = requestAnimationFrame(() => {
                window.scrollTo(0, pendingScroll);
                scrollRaf = 0;
            });
        };
        el.addEventListener('pointerdown', (e) => {
            dragging = true;
            primed = false;
            moved = false;
            touchActive = e.pointerType === 'touch';
            startY = e.clientY;
            startScroll = window.scrollY;
            el.classList.add('is-dragging');
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
            if (touchActive) {
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
        el.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            e.preventDefault();
            const dy = e.clientY - startY;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const trackLen = window.innerHeight - THUMB_HEIGHT;
            if (trackLen <= 0 || max <= 0) return;
            if (!moved && Math.abs(dy) > 1) {
                moved = true;
                el.classList.add('is-scrolling');
            }
            const newScroll = startScroll + (dy / trackLen) * max;
            scheduleScroll(newScroll);
        });
        const stop = (e) => {
            if (!dragging) return;
            dragging = false;
            clearTimeout(primeTimer);
            if (scrollRaf) {
                cancelAnimationFrame(scrollRaf);
                window.scrollTo(0, pendingScroll);
                scrollRaf = 0;
            }
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
            try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        };
        el.addEventListener('pointerup', stop);
        el.addEventListener('pointercancel', stop);
        el.addEventListener('lostpointercapture', stop);
    };

    let ticking = false;
    const onScroll = () => {
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
