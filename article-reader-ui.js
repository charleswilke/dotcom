// Shared controls for the homepage overlay and standalone archive reader.
(() => {
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

function attachScrollbar(scrollArea, thumbEl, railEl, options = {}) {
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
    (options.scrollTarget || scrollArea).addEventListener('scroll', () => {
        if (thumbDragActive) return;
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; updateThumb(); });
    }, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(updateThumb).observe(options.resizeTarget || scrollArea);
    }
    
    
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
    window.addEventListener('resize', updateThumb, {passive:true});
    updateThumb();
    return updateThumb;
}

window.ArticleReaderUI = {createScopePlayer, attachScrollbar};
})();
