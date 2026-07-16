(function () {
    'use strict';

    const PANELS = {
        about: {
            kicker: 'Lobby directory // orientation',
            title: 'Before Times',
            copy: [
                'A career archive for the work made before AI became a daily collaborator. The doors organize the big chapters; the lobby holds the earlier obsessions that never fit neatly on a résumé.',
                'Nothing important is locked behind a puzzle. Click around for the main stories, then use found objects for side roads, old recordings, and jokes.'
            ],
            facts: ['Use Tab to move between every interactive object.', 'The hand icon briefly reveals all hotspots.', 'The glowing mint door returns to the present-day site.']
        },
        alchemy: {
            kicker: 'Door 01 // Los Angeles // 2013–2017',
            title: 'Absurd Alchemy',
            copy: [
                'The crooked production office: scripts, short films, web series, questionable props, and twenty-five projects shepherded from idea to finished thing.',
                'This room will hold French Kitty, production artifacts, and the years when making the work meant writing it, scheduling it, shooting it, and occasionally figuring out where everyone had parked.'
            ],
            facts: ['Writer / producer', 'French Kitty, featuring Chloe Fineman', 'Distributed by Troma Entertainment'],
            action: { label: 'Visit the surviving Vimeo archive', href: 'https://vimeo.com/absurdalchemy', external: true }
        },
        games: {
            kicker: 'Door 02 // Burbank // 2008–2013',
            title: 'Game Development',
            copy: [
                'A cinematic engine room full of narrative tools, debug geometry, motion-capture cleanup, version-control rituals, and characters waiting for their animation pass.',
                'The artifacts here will trace the path from cinematic support and QA into scripting and pipeline work across several AAA productions.'
            ],
            facts: ['Ratchet & Clank Future: A Crack in Time', 'Resistance 3', 'Sunset Overdrive', 'MotionBuilder, Maya, Perforce, and internal narrative tools']
        },
        content: {
            kicker: 'Door 03 // 2013–2022',
            title: 'The Content Factory',
            copy: [
                'A cheerful industrial accident producing blogs, landing pages, campaign copy, websites, search traffic, and the occasional viral object.',
                'This room joins the copy mines, freelance design years, Salt & Straw work, and FieldEdge into one absurd machine built to turn technical subjects into language people could actually use.'
            ],
            facts: ['Hundreds of B2B and B2C content pieces', 'Corporate websites and digital assets', 'A 240% organic-traffic increase at FieldEdge']
        },
        docs: {
            kicker: 'Door 04 // remote // 2022–2024',
            title: 'The Knowledge Maze',
            copy: [
                'A documentation labyrinth where every corridor leads to another edge case, style decision, customer question, or stakeholder with a very reasonable concern.',
                'The GoDaddy chapter is where content craft met product systems at scale—and where the first chatbot-shaped shadows started appearing on the walls.'
            ],
            facts: ['Websites + Marketing knowledge systems', 'Unified voice-and-tone guidance', '93% reduction in customer-care escalations']
        },
        portal: {
            kicker: 'Door 05 // 2024–now',
            title: 'The machines started talking back',
            copy: [
                'Beyond this door: Fellow Vector, theatrical projection work, conversational design at Toast, and the ongoing experiment in making things with systems that can answer.',
                'The Before Times are not a discarded identity. They are the evidence underneath everything happening now.'
            ],
            action: { label: 'Return to the present', href: '/#about' }
        },
        press: {
            kicker: 'Lobby exhibit // Northern Illinois University',
            title: 'The student press office',
            copy: [
                'Before the career doors, there was a collegiate newspaper: deadlines, bylines, the strange authority of a press badge, and the discovery that asking a better question usually produced a better story.',
                'The dispenser is ready for scanned clips once the old papers surface.'
            ],
            facts: ['Collegiate newspaper work', 'Early reporting and editing instincts', 'Future home for recovered bylines and scans']
        },
        photography: {
            kicker: 'Lobby exhibit // contact sheets',
            title: 'Photography',
            copy: [
                'The work that never fit into the job chronology: frames, contact sheets, visual experiments, and evidence that the instinct to compose a scene was present long before it had a professional label.',
                'This lightbox will become a browsable contact sheet as the photo archive is recovered.'
            ],
            facts: ['Personal photography', 'Production stills and location textures', 'An archive waiting to be digitized']
        },
        radio: {
            kicker: 'Lobby exhibit // broadcast receiver',
            title: 'The old radio shows',
            copy: [
                'The receiver works. The actual episode tapes are still somewhere in the physical archive, which feels appropriately on-brand.',
                'For now, turn the dial and listen to the machine search. When the broadcasts are recovered, they can drop into this tuner without rebuilding the room.'
            ],
            facts: ['Cassette-ready player', 'Nine original tuning sounds already mounted', 'Episode slots waiting for recovered audio'],
            button: { label: 'Turn the dial', action: 'tune' }
        },
        settings: {
            kicker: 'Lobby controls // accessibility',
            title: 'How to explore',
            copy: [
                'Click or tap a door, exhibit, or desk object. Keyboard visitors can use Tab and Enter. On a narrow screen, swipe sideways through the lobby or use the floating floor-plan button.',
                'Sound is always opt-in. Nothing plays until you ring the bell or tune the radio.'
            ],
            button: { label: 'Turn sound off', action: 'sound' }
        },
        floorplan: {
            kicker: 'Inventory // permanent item',
            title: 'Floor plan',
            copy: ['The lobby is open. The career rooms are being excavated one at a time; each door already contains its field notes and planned artifacts.'],
            routes: [
                { id: 'alchemy', label: '01 · Absurd Alchemy' },
                { id: 'games', label: '02 · Game Development' },
                { id: 'content', label: '03 · The Content Factory' },
                { id: 'docs', label: '04 · The Knowledge Maze' },
                { id: 'portal', label: '05 · Return to the present' },
                { id: 'press', label: 'Lobby · Student press' },
                { id: 'photography', label: 'Lobby · Photography' },
                { id: 'radio', label: 'Lobby · Radio archive' }
            ]
        }
    };

    const TUNING_TRACKS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => `/audio/radio_tuning${number}.mp3`);
    const scene = document.querySelector('.bt-lobby-scene');
    const sceneStatus = document.getElementById('bt-scene-status');
    const infoDialog = document.getElementById('bt-info-dialog');
    const guestbookDialog = document.getElementById('bt-guestbook-dialog');
    const radioAudio = document.getElementById('bt-radio-audio');
    const infoKicker = document.getElementById('bt-dialog-kicker');
    const infoTitle = document.getElementById('bt-dialog-title');
    const infoCopy = document.getElementById('bt-dialog-copy');
    const infoFacts = document.getElementById('bt-dialog-facts');
    const infoRoutes = document.getElementById('bt-dialog-routes');
    const infoAction = document.getElementById('bt-dialog-action');
    const infoButton = document.getElementById('bt-dialog-button');
    const guestbookForm = document.getElementById('bt-guestbook-form');
    const guestbookMessage = document.getElementById('bt-guest-message');
    const guestbookCount = document.getElementById('bt-guest-count');
    const guestbookStatus = document.getElementById('bt-guestbook-status');
    const guestbookEntries = document.getElementById('bt-guestbook-entries');
    const guestbookRefresh = document.getElementById('bt-guestbook-refresh');
    let statusTimer = null;
    let revealTimer = null;
    let guestbookLoaded = false;
    let soundEnabled = localStorage.getItem('bt-sound-enabled') !== 'false';

    function showStatus(message, duration) {
        window.clearTimeout(statusTimer);
        sceneStatus.textContent = message;
        sceneStatus.classList.add('is-visible');
        statusTimer = window.setTimeout(() => sceneStatus.classList.remove('is-visible'), duration || 2800);
    }

    function openDialog(dialog) {
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    function closeDialog(dialog) {
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    function makeParagraph(text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
    }

    function openPanel(panelId) {
        const panel = PANELS[panelId];
        if (!panel) return;

        infoKicker.textContent = panel.kicker || '';
        infoTitle.textContent = panel.title;
        infoCopy.replaceChildren(...(panel.copy || []).map(makeParagraph));

        infoFacts.replaceChildren();
        (panel.facts || []).forEach((fact) => {
            const item = document.createElement('li');
            item.textContent = fact;
            infoFacts.appendChild(item);
        });

        infoRoutes.replaceChildren();
        (panel.routes || []).forEach((route) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt-dialog-route';
            button.textContent = route.label;
            button.addEventListener('click', () => {
                closeDialog(infoDialog);
                window.setTimeout(() => openPanel(route.id), 30);
            });
            infoRoutes.appendChild(button);
        });

        infoAction.hidden = true;
        infoAction.removeAttribute('target');
        infoAction.removeAttribute('rel');
        if (panel.action) {
            infoAction.textContent = panel.action.label;
            infoAction.href = panel.action.href;
            infoAction.hidden = false;
            if (panel.action.external) {
                infoAction.target = '_blank';
                infoAction.rel = 'noopener noreferrer';
            }
        }

        infoButton.hidden = true;
        infoButton.onclick = null;
        if (panel.button) {
            infoButton.textContent = panel.button.action === 'sound'
                ? (soundEnabled ? 'Turn sound off' : 'Turn sound on')
                : panel.button.label;
            infoButton.hidden = false;
            infoButton.onclick = () => {
                if (panel.button.action === 'tune') tuneRadio();
                if (panel.button.action === 'sound') toggleSound();
            };
        }

        openDialog(infoDialog);
    }

    function revealHotspots() {
        window.clearTimeout(revealTimer);
        scene.classList.add('bt-show-hotspots');
        showStatus('The useful objects hum briefly.', 2200);
        revealTimer = window.setTimeout(() => scene.classList.remove('bt-show-hotspots'), 2600);
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('bt-sound-enabled', String(soundEnabled));
        infoButton.textContent = soundEnabled ? 'Turn sound off' : 'Turn sound on';
        if (!soundEnabled) radioAudio.pause();
        showStatus(soundEnabled ? 'Lobby sound is on.' : 'Lobby sound is off.');
    }

    function tuneRadio() {
        if (!soundEnabled) {
            showStatus('Sound is off. The dial moves silently.');
            return;
        }
        let nextTrack = TUNING_TRACKS[Math.floor(Math.random() * TUNING_TRACKS.length)];
        if (radioAudio.src.endsWith(nextTrack) && TUNING_TRACKS.length > 1) {
            nextTrack = TUNING_TRACKS[(TUNING_TRACKS.indexOf(nextTrack) + 1) % TUNING_TRACKS.length];
        }
        radioAudio.src = nextTrack;
        radioAudio.volume = 0.62;
        const playPromise = radioAudio.play();
        if (playPromise) playPromise.catch(() => showStatus('The radio needs another click before it will cooperate.'));
        showStatus('Scanning the old frequencies…', 3200);
    }

    function ringBell() {
        if (soundEnabled && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContextClass();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.42);
            gain.gain.setValueAtTime(0.0001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.72);
            oscillator.addEventListener('ended', () => context.close());
        }
        showStatus('Ding. No archivist appears. It seems to be self-service.');
    }

    function formatEntryDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Sometime before now';
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function renderGuestbook(entries) {
        guestbookEntries.replaceChildren();
        if (!entries.length) {
            const empty = document.createElement('p');
            empty.className = 'bt-empty-state';
            empty.textContent = 'The page is blank. You could be the first visitor to sign it.';
            guestbookEntries.appendChild(empty);
            return;
        }

        entries.forEach((entry) => {
            const article = document.createElement('article');
            article.className = 'bt-guest-entry';
            const quote = document.createElement('blockquote');
            quote.textContent = entry.message;
            const footer = document.createElement('footer');
            footer.textContent = `— ${entry.name || 'Anonymous visitor'} · ${formatEntryDate(entry.createdAt)}`;
            article.append(quote, footer);
            guestbookEntries.appendChild(article);
        });
    }

    async function loadGuestbook(force) {
        if (guestbookLoaded && !force) return;
        guestbookEntries.innerHTML = '<p class="bt-empty-state">Opening the ledger…</p>';
        try {
            const response = await fetch('/api/before-times-guestbook', { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Guestbook unavailable');
            const data = await response.json();
            renderGuestbook(Array.isArray(data.entries) ? data.entries : []);
            guestbookLoaded = true;
            guestbookForm.querySelector('button[type="submit"]').disabled = data.configured === false;
            if (data.configured === false) {
                guestbookStatus.textContent = 'The public ledger still needs its storage key.';
            }
        } catch (error) {
            guestbookEntries.innerHTML = '<p class="bt-empty-state">The public ledger is temporarily offline. The rest of the archive still works.</p>';
            guestbookStatus.textContent = 'Your note cannot be submitted right now.';
        }
    }

    async function submitGuestbook(event) {
        event.preventDefault();
        const submit = guestbookForm.querySelector('button[type="submit"]');
        const formData = new FormData(guestbookForm);
        const payload = {
            name: formData.get('name'),
            message: formData.get('message'),
            website: formData.get('website')
        };

        submit.disabled = true;
        guestbookStatus.textContent = 'Pressing the ink into the page…';
        try {
            const response = await fetch('/api/before-times-guestbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'The guest book refused the pen.');
            guestbookForm.reset();
            guestbookCount.textContent = '0 / 500';
            guestbookStatus.textContent = 'Signed. Your note is now part of the lobby.';
            guestbookLoaded = false;
            await loadGuestbook(true);
        } catch (error) {
            guestbookStatus.textContent = error.message || 'The guest book is temporarily unavailable.';
        } finally {
            submit.disabled = false;
        }
    }

    document.querySelectorAll('[data-panel]').forEach((button) => {
        button.addEventListener('click', () => openPanel(button.dataset.panel));
    });

    document.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'reveal') revealHotspots();
            if (action === 'bell') ringBell();
            if (action === 'radio') {
                tuneRadio();
                openPanel('radio');
            }
            if (action === 'guestbook') {
                openDialog(guestbookDialog);
                loadGuestbook(false);
            }
        });
    });

    document.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => closeDialog(button.closest('dialog')));
    });

    [infoDialog, guestbookDialog].forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog(dialog);
        });
    });

    guestbookMessage.addEventListener('input', () => {
        guestbookCount.textContent = `${guestbookMessage.value.length} / 500`;
    });
    guestbookForm.addEventListener('submit', submitGuestbook);
    guestbookRefresh.addEventListener('click', () => loadGuestbook(true));

    radioAudio.addEventListener('ended', () => {
        showStatus('Only static for now. The old broadcasts are still hiding somewhere.');
    });

    if (!localStorage.getItem('bt-lobby-visited')) {
        window.setTimeout(revealHotspots, 900);
        localStorage.setItem('bt-lobby-visited', 'true');
    }
}());
