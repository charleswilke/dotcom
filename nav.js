// Centralized nav — injected synchronously so there's no layout shift.
// Detects homepage vs sub-page to set correct href prefixes and data-section attrs.
(function () {
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    var p = isHome ? '' : '/';
    var ds = isHome
        ? function (s) { return ' data-section="' + s + '"'; }
        : function () { return ''; };

    var navHtml = '<nav class="site-nav" id="siteNav" aria-label="Main navigation">\n' +
        '    <div class="nav-inner">\n' +
        '        <a href="/" class="nav-logo" id="navLogo" aria-label="Home">Charles Wilke</a>\n' +
        '        <div class="nav-links" id="navLinks">\n' +
        '            <a href="' + p + '#portfolio" class="nav-link"' + ds('portfolio') + '>Recently</a>\n' +
        '            <a href="' + p + '#writing" class="nav-link"' + ds('writing') + '>Writing</a>\n' +
        '            <a href="' + p + '#projections" class="nav-link"' + ds('projections') + '>Theater</a>\n' +
        '            <a href="' + p + '#about" class="nav-link"' + ds('about') + '>About</a>\n' +
        '            <div class="nav-explore-wrap">\n' +
        '                <button class="nav-explore-btn" id="navExploreBtn" aria-haspopup="true" aria-expanded="false">\n' +
        '                    Explore <span class="nav-explore-arrow">&#9662;</span>\n' +
        '                </button>\n' +
        '                <div class="nav-dropdown" id="navDropdown" role="menu">\n' +
        '                    <a href="/tootsjam/" class="nav-dropdown-item" role="menuitem">TootsJam <span class="nav-tag">game</span></a>\n' +
        '                    <a href="/spacetoots/" class="nav-dropdown-item" role="menuitem">SpaceToots <span class="nav-tag">game</span></a>\n' +
        '                    <a href="/mixtape.html" class="nav-dropdown-item nav-dropdown-item--wrap" role="menuitem">Exploring<br>L.ai.bor <span class="nav-tag">mixtape</span></a>\n' +
        '                    <a href="/gwor.html" class="nav-dropdown-item nav-dropdown-item--wrap" role="menuitem">Grief without<br>Ritual <span class="nav-tag">album</span></a>\n' +
        '                    <a href="https://fellowvector.com" class="nav-dropdown-item" role="menuitem" target="_blank" rel="noopener noreferrer">Fellow Vector <span class="nav-tag">consulting</span></a>\n' +
        '                    <a href="/faq.html" class="nav-dropdown-item" role="menuitem">FAQ <span class="nav-tag">ama</span></a>\n' +
        '                    <a href="mailto:cwilke.inquiry@gmail.com" class="nav-dropdown-item" role="menuitem">Contact Me <span class="nav-tag">IRL</span></a>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" aria-expanded="false">\n' +
        '            <span></span><span></span><span></span>\n' +
        '        </button>\n' +
        '    </div>\n' +
        '</nav>';

    document.currentScript.insertAdjacentHTML('beforebegin', navHtml);
}());
