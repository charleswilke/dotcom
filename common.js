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
    const exploreBtn = document.getElementById('navExploreBtn');
    const dropdown = document.getElementById('navDropdown');
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
    const sectionIds = ['portfolio', 'writing', 'projections', 'about'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

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

    // --- Explore dropdown ---
    function closeDropdown() {
        dropdown.classList.remove('open');
        exploreBtn.setAttribute('aria-expanded', 'false');
    }

    exploreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            closeDropdown();
        } else {
            dropdown.classList.add('open');
            exploreBtn.setAttribute('aria-expanded', 'true');
        }
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) closeDropdown();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDropdown();
    });

    // --- Hamburger (mobile) ---
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('open');
        navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen) closeDropdown();
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

document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year dynamically (fallback for hardcoded value)
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    setTimeout(triggerGlitchFooterNote, 2500 + Math.random() * 3000);
});

