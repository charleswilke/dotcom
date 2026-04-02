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

