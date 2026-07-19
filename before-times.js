(function () {
    'use strict';

    const PANELS = {
        about: {
            kicker: 'Lobby directory // orientation',
            title: 'Before Times',
            copy: [
                'A career archive for the work made before AI became a daily collaborator. The doors organize the big chapters; the lobby holds the earlier obsessions that never fit neatly on a résumé.',
                'Nothing important is locked behind a puzzle. Click around for the main stories, then use found objects for side roads, old recordings, and jokes.',
                'Click or tap a door, exhibit, or desk object. Keyboard visitors can use Tab and Enter. On a narrow screen, swipe sideways through the lobby or use the floating floor-plan button.',
                'Sound is always opt-in. Nothing plays until you ring the bell or tune the radio.'
            ],
            facts: ['Use Tab to move between every interactive object.', 'The glowing mint door and the X in the upper-right return to the present-day site.'],
            button: { label: 'Turn sound off', action: 'sound' }
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
        floorplan: {
            kicker: 'Inventory // permanent item',
            title: 'Floor plan',
            copy: ['The lobby is open. Absurd Alchemy and The Content Factory are ready to enter; the remaining career rooms are still being excavated.'],
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
    const TAPE_25_CLIPS = [
        '/audio/before-times/tape25-fart-1.mp3',
        '/audio/before-times/tape25-fart-2.mp3'
    ];
    const ALCHEMY_VIDEOS = [
        {
            key: 'lucifer-1',
            id: 146679839,
            series: 'Call Me Lucifer',
            title: 'Call Me Lucifer - Part One',
            year: '2015',
            description: 'The Devil takes a meeting. Part one of the four-part confessional.'
        },
        {
            key: 'lucifer-2',
            id: 146848618,
            series: 'Call Me Lucifer',
            title: 'Call Me Lucifer - Part Two',
            year: '2015',
            description: 'Part two. The horns come off; the grievances do not.'
        },
        {
            key: 'lucifer-3',
            id: 149589451,
            series: 'Call Me Lucifer',
            title: 'Call Me Lucifer - Part Three',
            year: '2015',
            description: 'Part three. Old Scratch would like the record corrected on several points.'
        },
        {
            key: 'lucifer-4',
            id: 189543790,
            series: 'Call Me Lucifer',
            title: 'Call Me Lucifer - Part Four',
            year: '2016',
            description: 'The finale, recovered nearly a year later with the prince of darkness still talking.'
        },
        {
            key: 'noho-1',
            id: 148037044,
            series: 'The NoHo Rag',
            title: 'The NoHo Rag -01- Big Hollywood News',
            year: '2015',
            description: 'Episode one of the North Hollywood serial. Big news arrives; nobody is ready for it.'
        },
        {
            key: 'noho-2',
            id: 151464381,
            series: 'The NoHo Rag',
            title: 'The NoHo Rag -02- Off to the Races',
            year: '2016',
            description: 'Episode two. The Rag hits the ground running, roughly.'
        },
        {
            key: 'noho-3',
            id: 153845736,
            series: 'The NoHo Rag',
            title: 'The NoHo Rag -03- Game Night',
            year: '2016',
            description: 'Episode three. Game night, played dangerously close to the rules.'
        },
        {
            key: 'noho-4',
            id: 168555377,
            series: 'The NoHo Rag',
            title: 'The NoHo Rag -04- Virus Scare',
            year: '2016',
            description: 'Episode four. A virus scare sweeps the office years before it was fashionable.'
        },
        {
            key: 'side-effects-1',
            id: 164932004,
            series: 'Shorts & one-offs',
            title: "Side Effects -01- You Think You're So Smart",
            year: '2016',
            description: 'Confidence, chemistry, and consequences, in roughly that order.'
        },
        {
            key: 'sagan',
            id: 170550896,
            hash: 'a5e4fec068',
            series: 'Shorts & one-offs',
            title: 'Carl Sagan: Prank Master',
            year: '2016',
            description: 'Carl Sagan, proud owner of the universe, steps into his favorite role: Prank Master.'
        },
        {
            key: 'french-kitty',
            id: 202553124,
            series: 'Shorts & one-offs',
            title: 'French Kitty (Trailer)',
            year: '2017',
            description: 'Twenty-four seconds. French Kitty appears to have retained final-cut approval.'
        },
        {
            key: 'noho-101',
            yt: '-s9Ehd4QHJs',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 101 · The Children of Swift',
            year: '2014',
            description: 'Season premiere. North Hollywood meets its most dangerous fandom.'
        },
        {
            key: 'noho-102',
            yt: 'HGdlLZocFzw',
            series: 'The NoHo Rag · Season One',
            title: "Episode 102 · Big Tex's Waterland",
            year: '2014',
            description: 'A waterpark, a Texan, and several unsigned liability waivers.'
        },
        {
            key: 'noho-103',
            yt: 'FvehCTCJj5k',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 103 · Thanksgiving Wonderland',
            year: '2014',
            description: 'The holidays arrive in NoHo ahead of schedule and under budget.'
        },
        {
            key: 'noho-104',
            yt: 'y-6yEKKQ7GE',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 104 · Hola Buttholes',
            year: '2014',
            description: 'International relations, handled with characteristic grace.'
        },
        {
            key: 'noho-105',
            yt: 'qFOOYv4XxSY',
            series: 'The NoHo Rag · Season One',
            title: "Episode 105 · Santa's Package",
            year: '2014',
            description: 'A Christmas special that should probably apologize.'
        },
        {
            key: 'noho-106',
            yt: 'N23HJPFPTlI',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 106 · Glassholes',
            year: '2015',
            description: 'Wearable technology meets unbearable people.'
        },
        {
            key: 'noho-107',
            yt: 'GKzNT8knxyE',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 107 · A Swift Bieber Vaccination',
            year: '2015',
            description: 'A public health advisory for the pop-inclined.'
        },
        {
            key: 'noho-108',
            yt: 'NM46GgNznvQ',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 108 · To Kill A Brewery',
            year: '2015',
            description: 'Craft beer, courtroom drama, and no mockingbirds.'
        },
        {
            key: 'noho-109',
            yt: 'PMrEW5sikOA',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 109 · Justice Gone Wild',
            year: '2015',
            description: 'The legal system, briefly unsupervised.'
        },
        {
            key: 'noho-110',
            yt: 'PovqnsxP_s4',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 110 · Pricks',
            year: '2015',
            description: 'Exactly what it sounds like. Possibly also cacti.'
        },
        {
            key: 'noho-111',
            yt: 'Qkg4E4RPulk',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 111 · The Good Way Sex Emporium',
            year: '2015',
            description: 'Local commerce at its most enthusiastic.'
        },
        {
            key: 'noho-112',
            yt: 'EixNejDGnb0',
            series: 'The NoHo Rag · Season One',
            title: 'Episode 112 · There and Back Again',
            year: '2015',
            description: 'The season finale. A NoHo tale.'
        },
        {
            key: 'segment-stu-brewed-beat',
            yt: 'L5LaDqeKT30',
            series: 'Segments',
            title: 'Stu Brewed Beat — Bernie Sanders 2016',
            year: '2015',
            description: 'Stu drops a beat for the primary season.'
        },
        {
            key: 'segment-watchman',
            yt: 'JSOu2UY7eMY',
            series: 'Segments',
            title: 'Go Set a Watchman — Parody Trailer',
            year: '2015',
            description: 'The trailer literature never asked for.'
        },
        {
            key: 'segment-chip-sterling',
            yt: 'BD7M2nExLuU',
            series: 'Segments',
            title: "Chip Sterling's Interpretive Opinions: Ghostbusters",
            year: '2015',
            description: 'Chip interprets, opines, and busts.'
        },
        {
            key: 'segment-paraflix',
            yt: 'EOxYQ7Hppg0',
            series: 'Segments',
            title: 'Paraflix — The Binge Watching Pill',
            year: '2015',
            description: 'One pill to binge them all.'
        }
    ];
    const PRODUCTION_LOOPS = [
        {
            src: '/images/before-times/production/fragment-lucifer-2-v1.mp4',
            label: 'A fragment from the Lucifer sessions'
        },
        {
            src: '/images/before-times/production/fragment-noho-3-v1.mp4',
            label: 'A NoHo Rag game night fragment'
        },
        {
            src: '/images/before-times/production/fragment-side-effects-1-v1.mp4',
            label: 'A Side Effects fragment'
        },
        {
            src: '/images/before-times/production/fragment-sagan-v1.mp4',
            label: 'A recovered Sagan park fragment'
        },
        {
            src: '/images/before-times/production/fragment-french-kitty-v1.mp4',
            label: 'A French Kitty fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-105-v1.mp4',
            label: 'A Season One holiday fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-110-v1.mp4',
            label: 'A Season One field fragment'
        },
        {
            src: '/images/before-times/production/fragment-segment-paraflix-v1.mp4',
            label: 'A Paraflix segment fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-1-v1.mp4',
            label: 'A fragment from the first Lucifer sitting'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-3-v1.mp4',
            label: 'A third Lucifer confessional fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-4-v1.mp4',
            label: 'A Lucifer finale fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-1-v1.mp4',
            label: 'A NoHo Rag newsroom fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-2-v1.mp4',
            label: 'A NoHo Rag races fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-4-v1.mp4',
            label: 'A NoHo Rag virus-scare fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-102-v1.mp4',
            label: 'A Waterland field fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-103-v1.mp4',
            label: 'A Thanksgiving Wonderland fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-107-v1.mp4',
            label: 'A vaccination special fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-108-v1.mp4',
            label: 'A brewery trial fragment'
        },
        {
            src: '/images/before-times/production/fragment-segment-watchman-v1.mp4',
            label: 'A Watchman trailer fragment'
        },
        {
            src: '/images/before-times/production/fragment-segment-chip-sterling-v1.mp4',
            label: 'A Chip Sterling opinion fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-101-v1.mp4',
            label: 'A season premiere fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-104-v1.mp4',
            label: 'An episode 104 diplomacy fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-106-v1.mp4',
            label: 'A Glassholes fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-109-v1.mp4',
            label: 'A Justice Gone Wild fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-111-v1.mp4',
            label: 'A Good Way Emporium fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-112-v1.mp4',
            label: 'A season finale fragment'
        },
        {
            src: '/images/before-times/production/fragment-segment-stu-brewed-beat-v1.mp4',
            label: 'A Stu Brewed Beat fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-2-b-v1.mp4',
            label: 'Another Lucifer session fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-4-b-v1.mp4',
            label: 'A later Lucifer finale fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-1-b-v1.mp4',
            label: 'Another newsroom fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-3-b-v1.mp4',
            label: 'A late game-night fragment'
        },
        {
            src: '/images/before-times/production/fragment-side-effects-1-b-v1.mp4',
            label: 'Another Side Effects fragment'
        },
        {
            src: '/images/before-times/production/fragment-sagan-b-v1.mp4',
            label: 'Another Sagan park fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-105-b-v1.mp4',
            label: 'A late Santa fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-107-b-v1.mp4',
            label: 'Another vaccination fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-110-b-v1.mp4',
            label: 'A late Pricks fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-1-b-v1.mp4',
            label: 'An early Lucifer fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-3-b-v1.mp4',
            label: 'Another Lucifer confessional fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-2-b-v1.mp4',
            label: 'A late races fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-4-b-v1.mp4',
            label: 'An early virus-scare fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-101-b-v1.mp4',
            label: 'Another premiere fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-102-b-v1.mp4',
            label: 'A late Waterland fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-103-b-v1.mp4',
            label: 'An early Thanksgiving fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-104-b-v1.mp4',
            label: 'A late diplomacy fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-106-b-v1.mp4',
            label: 'A late Glassholes fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-108-b-v1.mp4',
            label: 'A late brewery fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-109-b-v1.mp4',
            label: 'Another justice fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-111-b-v1.mp4',
            label: 'Another Emporium fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-112-b-v1.mp4',
            label: 'A late finale fragment'
        },
        {
            src: '/images/before-times/production/fragment-lucifer-4-c-v1.mp4',
            label: 'A third Lucifer finale fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-1-c-v1.mp4',
            label: 'An early newsroom fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-3-c-v1.mp4',
            label: 'A third game-night fragment'
        },
        {
            src: '/images/before-times/production/fragment-side-effects-1-c-v1.mp4',
            label: 'A third Side Effects fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-105-c-v1.mp4',
            label: 'A very late Santa fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-107-c-v1.mp4',
            label: 'A closing vaccination fragment'
        },
        {
            src: '/images/before-times/production/fragment-noho-110-c-v1.mp4',
            label: 'A third Pricks fragment'
        }
    ];
    const lobbySceneStatus = document.getElementById('bt-scene-status');
    const alchemySceneStatus = document.getElementById('bt-alchemy-scene-status');
    const contentSceneStatus = document.getElementById('bt-content-scene-status');
    const infoDialog = document.getElementById('bt-info-dialog');
    const guestbookDialog = document.getElementById('bt-guestbook-dialog');
    const alchemyMenuDialog = document.getElementById('bt-alchemy-menu-dialog');
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
    const guestbookHotspot = document.querySelector('[data-action="guestbook"]');
    const guestbookPenLayer = document.getElementById('bt-guestbook-pen-layer');
    const newspaperHotspot = document.querySelector('[data-action="newspaper"]');
    const bellHotspot = document.querySelector('[data-action="bell"]');
    const radioHotspot = document.querySelector('[data-action="radio"]');
    const alchemyDoorHotspot = document.querySelector('.bt-hotspot-alchemy');
    const alchemyChairHotspot = document.querySelector('.bt-alchemy-hotspot-chair');
    const alchemyScriptsHotspot = document.querySelector('.bt-alchemy-hotspot-scripts');
    const alchemySolarHotspot = document.querySelector('.bt-alchemy-hotspot-solar');
    const alchemyCatHotspot = document.querySelector('.bt-alchemy-hotspot-cat');
    const alchemyExitHotspot = document.querySelector('.bt-alchemy-hotspot-door');
    const alchemyHandHotspot = document.querySelector('.bt-alchemy-hotspot-hand');
    const alchemyTwentyFiveHotspot = document.querySelector('.bt-alchemy-hotspot-25');
    const alchemyPenHotspot = document.getElementById('bt-alchemy-pen');
    const alchemyPenCleanLayer = document.getElementById('bt-alchemy-pen-clean-layer');
    const lobbyInventoryPen = document.getElementById('bt-lobby-inventory-pen');
    const inventoryPenSlot = document.getElementById('bt-inventory-slot-pen');
    const contentDoorHotspot = document.querySelector('.bt-hotspot-content');
    const contentExitHotspot = document.querySelector('.bt-content-hotspot-door');
    const contentConsoleHotspot = document.querySelector('.bt-content-hotspot-console');
    const contentQuarterHotspot = document.getElementById('bt-content-quarter');
    const lobbyInventoryQuarter = document.getElementById('bt-lobby-inventory-quarter');
    const inventoryQuarterSlot = document.getElementById('bt-inventory-slot-quarter');
    const inventoryDragGhost = document.getElementById('bt-inventory-drag-ghost');
    const inventoryQuarterDragGhost = document.getElementById('bt-inventory-quarter-drag-ghost');
    const inventoryDrawer = document.getElementById('bt-inventory-drawer');
    const inventoryHandle = document.getElementById('bt-inventory-handle');
    const lobbyScroll = document.getElementById('bt-lobby-scroll');
    const alchemyScroll = document.getElementById('bt-alchemy-scroll');
    const alchemyScene = document.getElementById('bt-alchemy-scene');
    const alchemyArt = document.querySelector('.bt-alchemy-art');
    const contentScroll = document.getElementById('bt-content-scroll');
    const contentScene = document.getElementById('bt-content-scene');
    const contentArt = document.querySelector('.bt-content-art');
    const alchemyChairLayer = document.getElementById('bt-alchemy-chair-layer');
    const alchemyCrateLayer = document.getElementById('bt-alchemy-crate-layer');
    const alchemySolarLayer = document.getElementById('bt-alchemy-solar-layer');
    const alchemyCatLayer = document.getElementById('bt-alchemy-cat-layer');
    const alchemyTapeTwentyFiveLayer = document.getElementById('bt-alchemy-tape-25-layer');
    const alchemyExitDoorLayer = document.getElementById('bt-alchemy-exit-door-layer');
    const alchemyHandLayer = document.getElementById('bt-alchemy-hand-layer');
    const mobileFloorplan = document.getElementById('bt-mobile-floorplan');
    const mobileRoomExit = document.getElementById('bt-mobile-room-exit');
    const alchemyHeroScreen = document.getElementById('bt-alchemy-hero-screen');
    const alchemyIframe = document.getElementById('bt-alchemy-player');
    const alchemyPlayFallback = document.getElementById('bt-crt-play-fallback');
    const alchemyTapToggle = document.getElementById('bt-crt-tap-toggle');
    const alchemyYtIframe = document.getElementById('bt-alchemy-player-yt');
    const alchemyVideoList = document.getElementById('bt-alchemy-video-list');
    const alchemyNowPlaying = document.getElementById('bt-alchemy-now-playing');
    const productionScreens = Array.from(document.querySelectorAll('[data-production-screen]'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let statusTimer = null;
    let guestbookLoaded = false;
    let soundEnabled = localStorage.getItem('bt-sound-enabled') !== 'false';
    const tape25Audio = new Audio();
    tape25Audio.preload = 'none';
    let lastTape25ClipIndex = -1;
    let activeRoom = 'lobby';
    let alchemyPlayer = null;
    let loadedAlchemyVideoKey = null;
    let currentAlchemyVideo = null;
    let ytPlayer = null;
    let ytApiPromise = null;
    let ytGlowPoll = 0;
    let ytCaptionsClearedFor = null;
    let heroSource = 'vimeo';
    let productionTimer = null;
    let lastProductionLoop = -1;
    let productionDeck = [];
    let alchemyRoomOpening = false;
    let contentRoomOpening = false;
    let inventoryCloseTimer = 0;
    let hasAlchemyPen = false;
    let alchemyPenLocation = 'room';
    let inventoryPenSelected = false;
    let penPointerId = null;
    let penDragStarted = false;
    let suppressPenClick = false;
    let penPointerStartX = 0;
    let penPointerStartY = 0;
    let penPointerLastX = 0;
    let penPointerLastY = 0;
    let hasContentQuarter = false;
    let contentQuarterLocation = 'room';
    let inventoryQuarterSelected = false;
    let quarterPointerId = null;
    let quarterDragStarted = false;
    let suppressQuarterClick = false;
    let quarterPointerStartX = 0;
    let quarterPointerStartY = 0;
    let quarterPointerLastX = 0;
    let quarterPointerLastY = 0;

    function readInventory() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('bt-inventory-v1') || '{}');
            return saved && typeof saved === 'object' ? saved : {};
        } catch (error) {
            return {};
        }
    }

    function writeInventory(inventory) {
        try {
            sessionStorage.setItem('bt-inventory-v1', JSON.stringify(inventory));
        } catch (error) {
            // The inventory still works for this page view when storage is unavailable.
        }
    }

    function penIsInInventory() {
        return hasAlchemyPen && alchemyPenLocation === 'inventory';
    }

    function penIsOnGuestbook() {
        return hasAlchemyPen && alchemyPenLocation === 'guestbook';
    }

    function quarterIsInInventory() {
        return hasContentQuarter && contentQuarterLocation === 'inventory';
    }

    function quarterIsInNewsstand() {
        return hasContentQuarter && contentQuarterLocation === 'newsstand';
    }

    function inventoryHasItems() {
        return penIsInInventory() || quarterIsInInventory();
    }

    function savePenState() {
        const inventory = readInventory();
        inventory.alchemyPen = hasAlchemyPen;
        inventory.alchemyPenLocation = alchemyPenLocation;
        writeInventory(inventory);
    }

    function saveQuarterState() {
        const inventory = readInventory();
        inventory.contentQuarter = hasContentQuarter;
        inventory.contentQuarterLocation = contentQuarterLocation;
        writeInventory(inventory);
    }

    function syncInventoryDrawer() {
        const hasItems = inventoryHasItems();
        inventoryDrawer.classList.toggle('is-active', hasItems);
        inventoryDrawer.setAttribute('aria-hidden', String(!hasItems));
        if (!hasItems) {
            inventoryDrawer.classList.remove('is-open');
            inventoryHandle.setAttribute('aria-expanded', 'false');
        }
    }

    function setInventoryDrawerOpen(open, autoClose) {
        if (!inventoryHasItems()) return;
        window.clearTimeout(inventoryCloseTimer);
        inventoryDrawer.classList.toggle('is-open', open);
        inventoryHandle.setAttribute('aria-expanded', String(open));
        if (open && autoClose && !prefersReducedMotion.matches) {
            inventoryCloseTimer = window.setTimeout(() => setInventoryDrawerOpen(false, false), 2900);
        }
    }

    function syncGuestbookAccess() {
        const penOnBook = penIsOnGuestbook();
        const penReady = penIsInInventory();
        guestbookPenLayer.hidden = !penOnBook;
        if (penOnBook) {
            guestbookHotspot.dataset.label = 'Sign the guest book';
            guestbookHotspot.setAttribute('aria-label', 'Open and sign the Before Times guest book');
        } else if (penReady) {
            guestbookHotspot.dataset.label = 'Guest book · use the pen';
            guestbookHotspot.setAttribute('aria-label', 'Drop the collected fountain pen onto the guest book');
        } else {
            guestbookHotspot.dataset.label = 'Guest book · needs a pen';
            guestbookHotspot.setAttribute('aria-label', 'Inspect the guest book; a pen is needed before signing');
        }
    }

    function syncPenInventory() {
        const penReady = penIsInInventory();
        inventoryPenSlot.classList.toggle('bt-inventory-slot-filled', penReady);
        lobbyInventoryPen.hidden = !penReady;
        alchemyPenHotspot.hidden = hasAlchemyPen;
        alchemyPenCleanLayer.hidden = !hasAlchemyPen;
        if (!penReady) {
            inventoryPenSelected = false;
            lobbyInventoryPen.classList.remove('is-selected');
            lobbyInventoryPen.setAttribute('aria-pressed', 'false');
            guestbookHotspot.classList.remove('is-drop-target', 'is-drop-over');
        }
        syncGuestbookAccess();
        syncInventoryDrawer();
    }

    function collectAlchemyPen() {
        if (hasAlchemyPen) {
            setInventoryDrawerOpen(true, true);
            return;
        }

        hasAlchemyPen = true;
        alchemyPenLocation = 'inventory';
        savePenState();
        inventoryPenSlot.classList.add('bt-inventory-slot-filled');
        lobbyInventoryPen.hidden = false;
        alchemyPenCleanLayer.hidden = false;
        syncInventoryDrawer();
        syncGuestbookAccess();
        animateLayer(alchemyPenHotspot, 'is-collecting', 740);
        window.setTimeout(() => {
            alchemyPenHotspot.hidden = true;
            setInventoryDrawerOpen(true, true);
        }, prefersReducedMotion.matches ? 0 : 420);
        showStatus('Fountain pen added to inventory.', 3400);
    }

    function setInventoryPenSelected(selected) {
        if (selected && inventoryQuarterSelected) setInventoryQuarterSelected(false);
        inventoryPenSelected = Boolean(selected && penIsInInventory());
        lobbyInventoryPen.classList.toggle('is-selected', inventoryPenSelected);
        lobbyInventoryPen.setAttribute('aria-pressed', String(inventoryPenSelected));
        guestbookHotspot.classList.toggle('is-drop-target', inventoryPenSelected);
        if (inventoryPenSelected) {
            showStatus('Pen selected. Drag it onto the guest book, or activate the guest book to use it.', 4200);
        }
    }

    function placePenOnGuestbook() {
        if (!penIsInInventory()) return;
        alchemyPenLocation = 'guestbook';
        savePenState();
        setInventoryPenSelected(false);
        syncPenInventory();
        showStatus('The pen settles onto the guest book. Time to sign.', 3000);
        openDialog(guestbookDialog);
        loadGuestbook(false);
    }

    function pointerIsOverGuestbook(clientX, clientY) {
        if (activeRoom !== 'lobby') return false;
        const rect = guestbookHotspot.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function movePenDragGhost(clientX, clientY) {
        inventoryDragGhost.style.left = `${clientX}px`;
        inventoryDragGhost.style.top = `${clientY}px`;
        guestbookHotspot.classList.toggle('is-drop-over', pointerIsOverGuestbook(clientX, clientY));
    }

    function finishPenDrag(event, cancelled) {
        if (event.pointerId !== penPointerId) return;
        const shouldPlace = !cancelled && penDragStarted && pointerIsOverGuestbook(penPointerLastX, penPointerLastY);
        if (lobbyInventoryPen.hasPointerCapture && lobbyInventoryPen.hasPointerCapture(event.pointerId)) {
            lobbyInventoryPen.releasePointerCapture(event.pointerId);
        }
        inventoryDragGhost.hidden = true;
        guestbookHotspot.classList.remove('is-drop-over');
        penPointerId = null;
        if (penDragStarted) {
            suppressPenClick = true;
            window.setTimeout(() => { suppressPenClick = false; }, 0);
        }
        penDragStarted = false;
        if (shouldPlace) placePenOnGuestbook();
    }

    function syncNewsstandAccess() {
        const unlocked = quarterIsInNewsstand();
        const quarterReady = quarterIsInInventory();
        newspaperHotspot.classList.toggle('is-unlocked', unlocked);
        if (unlocked) {
            newspaperHotspot.dataset.label = 'Newspaper archive · unlocked';
            newspaperHotspot.setAttribute('aria-label', 'Open the unlocked collegiate newspaper dispenser');
        } else if (quarterReady) {
            newspaperHotspot.dataset.label = 'Newspaper archive · use the quarter';
            newspaperHotspot.setAttribute('aria-label', 'Drop the collected quarter into the newspaper dispenser');
        } else {
            newspaperHotspot.dataset.label = 'Coin-operated newspaper archive';
            newspaperHotspot.setAttribute('aria-label', 'Inspect the coin-operated collegiate newspaper dispenser');
        }
    }

    function syncQuarterInventory() {
        const quarterReady = quarterIsInInventory();
        inventoryQuarterSlot.classList.toggle('bt-inventory-slot-filled', quarterReady);
        lobbyInventoryQuarter.hidden = !quarterReady;
        contentQuarterHotspot.hidden = hasContentQuarter;
        if (!quarterReady) {
            inventoryQuarterSelected = false;
            lobbyInventoryQuarter.classList.remove('is-selected');
            lobbyInventoryQuarter.setAttribute('aria-pressed', 'false');
            newspaperHotspot.classList.remove('is-drop-target', 'is-drop-over');
        }
        syncNewsstandAccess();
        syncInventoryDrawer();
    }

    function collectContentQuarter() {
        if (hasContentQuarter) {
            setInventoryDrawerOpen(true, true);
            return;
        }

        hasContentQuarter = true;
        contentQuarterLocation = 'inventory';
        saveQuarterState();
        inventoryQuarterSlot.classList.add('bt-inventory-slot-filled');
        lobbyInventoryQuarter.hidden = false;
        syncInventoryDrawer();
        syncNewsstandAccess();
        animateLayer(contentQuarterHotspot, 'is-collecting', 740);
        window.setTimeout(() => {
            contentQuarterHotspot.hidden = true;
            setInventoryDrawerOpen(true, true);
        }, prefersReducedMotion.matches ? 0 : 420);
        showStatus('A shiny quarter rattles into inventory.', 3400);
    }

    function setInventoryQuarterSelected(selected) {
        if (selected && inventoryPenSelected) setInventoryPenSelected(false);
        inventoryQuarterSelected = Boolean(selected && quarterIsInInventory());
        lobbyInventoryQuarter.classList.toggle('is-selected', inventoryQuarterSelected);
        lobbyInventoryQuarter.setAttribute('aria-pressed', String(inventoryQuarterSelected));
        newspaperHotspot.classList.toggle('is-drop-target', inventoryQuarterSelected);
        if (inventoryQuarterSelected) {
            showStatus('Quarter selected. Drag it to the newspaper dispenser, or activate the dispenser to use it.', 4400);
        }
    }

    function insertQuarterIntoNewsstand() {
        if (!quarterIsInInventory()) return;
        contentQuarterLocation = 'newsstand';
        saveQuarterState();
        setInventoryQuarterSelected(false);
        syncQuarterInventory();
        animateLayer(newspaperHotspot, 'is-opening', 780);
        showStatus('Clink. The newspaper dispenser unlocks with a mechanical sigh.', 3200);
        window.setTimeout(() => openPanel('press'), prefersReducedMotion.matches ? 0 : 420);
    }

    function pointerIsOverNewsstand(clientX, clientY) {
        if (activeRoom !== 'lobby') return false;
        const rect = newspaperHotspot.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function moveQuarterDragGhost(clientX, clientY) {
        inventoryQuarterDragGhost.style.left = `${clientX}px`;
        inventoryQuarterDragGhost.style.top = `${clientY}px`;
        newspaperHotspot.classList.toggle('is-drop-over', pointerIsOverNewsstand(clientX, clientY));
    }

    function finishQuarterDrag(event, cancelled) {
        if (event.pointerId !== quarterPointerId) return;
        const shouldInsert = !cancelled && quarterDragStarted && pointerIsOverNewsstand(quarterPointerLastX, quarterPointerLastY);
        if (lobbyInventoryQuarter.hasPointerCapture && lobbyInventoryQuarter.hasPointerCapture(event.pointerId)) {
            lobbyInventoryQuarter.releasePointerCapture(event.pointerId);
        }
        inventoryQuarterDragGhost.hidden = true;
        newspaperHotspot.classList.remove('is-drop-over');
        quarterPointerId = null;
        if (quarterDragStarted) {
            suppressQuarterClick = true;
            window.setTimeout(() => { suppressQuarterClick = false; }, 0);
        }
        quarterDragStarted = false;
        if (shouldInsert) insertQuarterIntoNewsstand();
    }

    function showStatus(message, duration) {
        const sceneStatus = activeRoom === 'alchemy'
            ? alchemySceneStatus
            : (activeRoom === 'content' ? contentSceneStatus : lobbySceneStatus);
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

    function renderAlchemyPlaylist() {
        alchemyVideoList.replaceChildren();
        let currentSeries = null;
        ALCHEMY_VIDEOS.forEach((video) => {
            if (video.series && video.series !== currentSeries) {
                currentSeries = video.series;
                const seriesLabel = document.createElement('p');
                seriesLabel.className = 'bt-alchemy-series-label';
                seriesLabel.textContent = currentSeries;
                alchemyVideoList.appendChild(seriesLabel);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt-alchemy-video-option';
            button.dataset.alchemyVideo = video.key;

            const title = document.createElement('span');
            title.className = 'bt-alchemy-video-title';
            title.textContent = video.title;

            const year = document.createElement('span');
            year.className = 'bt-alchemy-video-year';
            year.textContent = video.year;

            const description = document.createElement('span');
            description.className = 'bt-alchemy-video-description';
            description.textContent = video.description;

            button.append(title, year, description);
            button.addEventListener('click', () => cueAlchemyVideo(video.key));
            alchemyVideoList.appendChild(button);
        });
    }

    function markCurrentAlchemyVideo(video) {
        currentAlchemyVideo = video;
        alchemyNowPlaying.textContent = `Now screening: ${video.title}`;
        alchemyVideoList.querySelectorAll('[data-alchemy-video]').forEach((button) => {
            if (button.dataset.alchemyVideo === video.key) {
                button.setAttribute('aria-current', 'true');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    }

    const GLOW_DEFAULT = { r: 116, g: 239, b: 207, m: 1 };
    let glowTracks = null;
    let glowTracksRequested = false;
    let glowCurrent = { ...GLOW_DEFAULT };
    let glowTarget = { ...GLOW_DEFAULT };
    let glowFrame = 0;

    function loadGlowTracks() {
        if (glowTracksRequested) return;
        glowTracksRequested = true;
        fetch('/images/before-times/glow-tracks-v1.json')
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (data && data.tracks && data.interval) glowTracks = data;
            })
            .catch(() => {});
    }

    function applyGlow(values) {
        const r = Math.round(values.r);
        const g = Math.round(values.g);
        const b = Math.round(values.b);
        alchemyScene.style.setProperty('--bt-glow-rgb', `${r} ${g} ${b}`);
        alchemyScene.style.setProperty(
            '--bt-glow-hi-rgb',
            `${Math.round(r + (255 - r) * 0.45)} ${Math.round(g + (255 - g) * 0.45)} ${Math.round(b + (255 - b) * 0.45)}`
        );
        alchemyScene.style.setProperty('--bt-glow-mult', values.m.toFixed(3));
    }

    function glowStep() {
        const ease = 0.14;
        glowCurrent.r += (glowTarget.r - glowCurrent.r) * ease;
        glowCurrent.g += (glowTarget.g - glowCurrent.g) * ease;
        glowCurrent.b += (glowTarget.b - glowCurrent.b) * ease;
        glowCurrent.m += (glowTarget.m - glowCurrent.m) * ease;
        applyGlow(glowCurrent);
        const settled =
            Math.abs(glowTarget.r - glowCurrent.r) < 0.8 &&
            Math.abs(glowTarget.g - glowCurrent.g) < 0.8 &&
            Math.abs(glowTarget.b - glowCurrent.b) < 0.8 &&
            Math.abs(glowTarget.m - glowCurrent.m) < 0.004;
        glowFrame = settled ? 0 : window.requestAnimationFrame(glowStep);
    }

    function setGlowTarget(r, g, b, m) {
        glowTarget = { r, g, b, m };
        if (prefersReducedMotion.matches) {
            glowCurrent = { ...glowTarget };
            applyGlow(glowCurrent);
            return;
        }
        if (!glowFrame) glowFrame = window.requestAnimationFrame(glowStep);
    }

    function resetGlow() {
        setGlowTarget(GLOW_DEFAULT.r, GLOW_DEFAULT.g, GLOW_DEFAULT.b, GLOW_DEFAULT.m);
    }

    function updateGlowFromTime(videoKey, seconds) {
        if (!glowTracks || !videoKey || typeof seconds !== 'number') return;
        const track = glowTracks.tracks[videoKey];
        if (!track || !track.length) return;
        const index = Math.min(track.length - 1, Math.max(0, Math.floor(seconds / glowTracks.interval)));
        const sample = track[index];
        setGlowTarget(sample[0], sample[1], sample[2], sample[3] / 100);
    }

    function alchemyEmbedUrl(video) {
        const hashParam = video.hash ? `h=${video.hash}&` : '';
        return `https://player.vimeo.com/video/${video.id}?${hashParam}autoplay=0&dnt=1&title=0&byline=0&portrait=0`;
    }

    function alchemyVideoUrl(video) {
        return video.hash ? `https://vimeo.com/${video.id}?h=${video.hash}` : `https://vimeo.com/${video.id}`;
    }

    function bindAlchemyPlayerEvents() {
        if (!alchemyPlayer) return;
        alchemyPlayer.on('play', () => {
            alchemyHeroScreen.classList.add('is-playing', 'is-loaded');
            alchemyPlayFallback.hidden = true;
            alchemyTapToggle.hidden = false;
            alchemyTapToggle.setAttribute('aria-label', 'Pause the current reel');
        });
        alchemyPlayer.on('pause', () => {
            alchemyHeroScreen.classList.remove('is-playing');
            alchemyTapToggle.setAttribute('aria-label', 'Resume the current reel');
        });
        alchemyPlayer.on('ended', () => {
            alchemyHeroScreen.classList.remove('is-playing');
            powerDownHeroScreen();
            showStatus('The reel clicks to a stop. The chair has more tapes.', 3600);
        });
        alchemyPlayer.on('timeupdate', (data) => {
            if (heroSource !== 'vimeo' || !data) return;
            updateGlowFromTime(loadedAlchemyVideoKey, data.seconds);
        });
    }

    function primeAlchemyPlayer(video) {
        if (alchemyPlayer) return alchemyPlayer.ready().then(() => alchemyPlayer);
        if (!window.Vimeo || !window.Vimeo.Player) return Promise.reject(new Error('Vimeo player unavailable'));

        alchemyIframe.src = alchemyEmbedUrl(video);
        alchemyPlayer = new window.Vimeo.Player(alchemyIframe);
        loadedAlchemyVideoKey = video.key;
        bindAlchemyPlayerEvents();
        return alchemyPlayer.ready().then(() => alchemyPlayer);
    }

    function setHeroSource(source) {
        heroSource = source;
        alchemyHeroScreen.dataset.crtSource = source;
    }

    function loadYouTubeApi() {
        if (ytApiPromise) return ytApiPromise;
        ytApiPromise = new Promise((resolve, reject) => {
            if (window.YT && window.YT.Player) {
                resolve(window.YT);
                return;
            }
            const previous = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (previous) previous();
                resolve(window.YT);
            };
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => reject(new Error('YouTube player unavailable'));
            document.head.appendChild(script);
        });
        return ytApiPromise;
    }

    function startYtGlowPoll() {
        window.clearInterval(ytGlowPoll);
        ytGlowPoll = window.setInterval(() => {
            if (!ytPlayer || heroSource !== 'youtube') return;
            updateGlowFromTime(loadedAlchemyVideoKey, ytPlayer.getCurrentTime());
        }, 250);
    }

    function stopYtGlowPoll() {
        window.clearInterval(ytGlowPoll);
        ytGlowPoll = 0;
    }

    /* The embed API has no captions-off URL param; unloading the caption
       modules turns them off per load while leaving the player's CC button
       available for viewers who want them back. */
    function disableYtCaptions(player) {
        try {
            player.unloadModule('captions');
            player.unloadModule('cc');
        } catch (error) {
            // Whichever module variant is absent simply throws; ignore.
        }
    }

    function handleYtStateChange(event) {
        if (heroSource !== 'youtube' || !window.YT) return;
        const states = window.YT.PlayerState;
        if (event.data === states.PLAYING) {
            if (ytPlayer && ytCaptionsClearedFor !== loadedAlchemyVideoKey) {
                disableYtCaptions(ytPlayer);
                ytCaptionsClearedFor = loadedAlchemyVideoKey;
            }
            alchemyHeroScreen.classList.add('is-playing', 'is-loaded');
            alchemyPlayFallback.hidden = true;
            alchemyTapToggle.hidden = false;
            alchemyTapToggle.setAttribute('aria-label', 'Pause the current reel');
            startYtGlowPoll();
        } else if (event.data === states.PAUSED) {
            alchemyHeroScreen.classList.remove('is-playing');
            alchemyTapToggle.setAttribute('aria-label', 'Resume the current reel');
            stopYtGlowPoll();
        } else if (event.data === states.ENDED) {
            alchemyHeroScreen.classList.remove('is-playing');
            stopYtGlowPoll();
            powerDownHeroScreen();
            showStatus('The reel clicks to a stop. The chair has more tapes.', 3600);
        }
    }

    async function primeYtPlayer(video) {
        const api = await loadYouTubeApi();
        if (ytPlayer) return ytPlayer;
        alchemyYtIframe.src =
            `https://www.youtube.com/embed/${video.yt}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1` +
            `&origin=${encodeURIComponent(window.location.origin)}`;
        ytPlayer = await new Promise((resolve) => {
            const player = new api.Player(alchemyYtIframe, {
                events: {
                    onReady: () => resolve(player),
                    onStateChange: handleYtStateChange
                }
            });
        });
        disableYtCaptions(ytPlayer);
        loadedAlchemyVideoKey = video.key;
        return ytPlayer;
    }

    async function cueVimeoVideo(video, restartCurrentVideo) {
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            stopYtGlowPoll();
            ytPlayer.pauseVideo();
        }
        setHeroSource('vimeo');

        if (!window.Vimeo || !window.Vimeo.Player) {
            alchemyIframe.src = alchemyEmbedUrl(video);
            alchemyHeroScreen.classList.add('is-loaded');
            showStatus('The player loaded without remote controls. Press play inside the television.', 4200);
            return;
        }

        if (!alchemyPlayer) {
            await primeAlchemyPlayer(video);
        }

        if (loadedAlchemyVideoKey !== video.key) {
            await alchemyPlayer.loadVideo({
                url: alchemyVideoUrl(video)
            });
            loadedAlchemyVideoKey = video.key;
        }

        alchemyHeroScreen.classList.add('is-loaded');
        const seekPromise = restartCurrentVideo ? alchemyPlayer.setCurrentTime(0) : Promise.resolve();
        const playPromise = alchemyPlayer.play();
        await seekPromise;
        await playPromise;
    }

    async function cueYouTubeVideo(video, restartCurrentVideo) {
        if (alchemyPlayer) alchemyPlayer.pause().catch(() => {});
        setHeroSource('youtube');

        const player = await primeYtPlayer(video);
        if (loadedAlchemyVideoKey !== video.key) {
            player.loadVideoById(video.yt);
            loadedAlchemyVideoKey = video.key;
        } else {
            if (restartCurrentVideo) player.seekTo(0, true);
            player.playVideo();
        }
        alchemyHeroScreen.classList.add('is-loaded');

        window.setTimeout(() => {
            if (heroSource !== 'youtube' || !window.YT || !ytPlayer) return;
            const state = ytPlayer.getPlayerState();
            if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
                alchemyPlayFallback.hidden = false;
            }
        }, 1600);
    }

    async function cueAlchemyVideo(videoKey) {
        const video = ALCHEMY_VIDEOS.find((item) => item.key === videoKey);
        if (!video) return;
        const restartCurrentVideo = currentAlchemyVideo && currentAlchemyVideo.key === video.key;

        if (alchemyMenuDialog.open) closeDialog(alchemyMenuDialog);
        markCurrentAlchemyVideo(video);
        resetGlow();
        alchemyPlayFallback.hidden = true;
        alchemyHeroScreen.classList.add('is-loading');
        showStatus(`Threading ${video.title}…`, 3200);

        try {
            if (video.yt) {
                await cueYouTubeVideo(video, restartCurrentVideo);
            } else {
                await cueVimeoVideo(video, restartCurrentVideo);
            }
        } catch (error) {
            alchemyHeroScreen.classList.add('is-loaded');
            alchemyPlayFallback.hidden = false;
            showStatus('The browser wants one more press directly on the television.', 4200);
        } finally {
            window.setTimeout(() => alchemyHeroScreen.classList.remove('is-loading'), 760);
        }
    }

    function powerDownHeroScreen() {
        alchemyHeroScreen.classList.add('is-powering-off');
        alchemyTapToggle.setAttribute('aria-label', 'Play the reel again');
        resetGlow();
        window.setTimeout(() => alchemyHeroScreen.classList.remove('is-loaded'), 140);
        window.setTimeout(() => alchemyHeroScreen.classList.remove('is-powering-off'), 700);
    }

    async function toggleAlchemyPlayback() {
        if (heroSource === 'youtube') {
            if (!ytPlayer || !window.YT) return;
            const states = window.YT.PlayerState;
            const state = ytPlayer.getPlayerState();
            if (state === states.PLAYING || state === states.BUFFERING) {
                ytPlayer.pauseVideo();
                showStatus('Paused mid-reel. Tap the screen to resume.', 3200);
            } else {
                if (state === states.ENDED) ytPlayer.seekTo(0, true);
                ytPlayer.playVideo();
                showStatus('Rolling again.', 2400);
            }
            return;
        }
        if (!alchemyPlayer) return;
        try {
            if (await alchemyPlayer.getPaused()) {
                if (await alchemyPlayer.getEnded()) await alchemyPlayer.setCurrentTime(0);
                await alchemyPlayer.play();
                showStatus('Rolling again.', 2400);
            } else {
                await alchemyPlayer.pause();
                showStatus('Paused mid-reel. Tap the screen to resume.', 3200);
            }
        } catch (error) {
            showStatus('The set refuses direct orders. Use the controls inside the screen.', 3600);
        }
    }

    async function retryAlchemyPlayback() {
        if (heroSource === 'youtube') {
            if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
                ytPlayer.playVideo();
                alchemyPlayFallback.hidden = true;
            } else if (currentAlchemyVideo) {
                cueAlchemyVideo(currentAlchemyVideo.key);
            }
            return;
        }
        if (!alchemyPlayer) {
            if (currentAlchemyVideo) cueAlchemyVideo(currentAlchemyVideo.key);
            return;
        }
        try {
            await alchemyPlayer.play();
            alchemyPlayFallback.hidden = true;
        } catch (error) {
            showStatus('The set remains temperamental. Use Vimeo’s play control inside the screen.', 4200);
        }
    }

    function deactivateProductionScreen(screen, withBlip) {
        window.clearTimeout(screen.btGhostTimer);
        window.clearTimeout(screen.btRevealTimer);
        screen.querySelector('video').pause();
        if (withBlip && screen.classList.contains('is-active') && !prefersReducedMotion.matches) {
            screen.classList.add('is-powering-off');
            window.setTimeout(() => screen.classList.remove('is-powering-off'), 420);
        }
        screen.classList.remove('is-active', 'is-powering-on');
    }

    function stopProductionScreens(withBlip) {
        productionScreens.forEach((screen) => deactivateProductionScreen(screen, withBlip));
    }

    /* Shuffled deck rather than random draws: every fragment appears once
       before any repeats, so ambient variety is guaranteed, not likely. */
    function chooseProductionLoop() {
        if (!productionDeck.length) {
            productionDeck = PRODUCTION_LOOPS.map((_, index) => index);
            for (let i = productionDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [productionDeck[i], productionDeck[j]] = [productionDeck[j], productionDeck[i]];
            }
            const last = productionDeck.length - 1;
            if (productionDeck[last] === lastProductionLoop && productionDeck.length > 1) {
                [productionDeck[0], productionDeck[last]] = [productionDeck[last], productionDeck[0]];
            }
        }
        lastProductionLoop = productionDeck.pop();
        return PRODUCTION_LOOPS[lastProductionLoop];
    }

    function activateProductionScreen(screen, loop) {
        window.clearTimeout(screen.btGhostTimer);
        const video = screen.querySelector('video');
        video.pause();
        if (video.dataset.loopSrc !== loop.src) {
            video.src = loop.src;
            video.dataset.loopSrc = loop.src;
            video.load();
        }
        video.currentTime = 0;
        /* Fragments play through once; the 'ended' listener powers the
           monitor down so a clip never loops before its cutout. The ghost
           timer remains only as a cap for stalled or slow-loading video. */
        video.loop = false;
        screen.setAttribute('aria-label', `${loop.label}. Trigger another production fragment.`);

        if (!prefersReducedMotion.matches) {
            /* Let the tube warm up: run the power-on sweep alone first, then
               reveal and roll the picture a beat later, as the line blooms. */
            screen.classList.remove('is-powering-off');
            screen.classList.add('is-powering-on');
            window.setTimeout(() => screen.classList.remove('is-powering-on'), 460);
            window.clearTimeout(screen.btRevealTimer);
            screen.btRevealTimer = window.setTimeout(() => {
                screen.classList.add('is-active');
                const playPromise = video.play();
                if (playPromise) playPromise.catch(() => {});
            }, 340);
        } else {
            screen.classList.add('is-active');
        }

        screen.btGhostTimer = window.setTimeout(() => {
            deactivateProductionScreen(screen, true);
        }, prefersReducedMotion.matches ? 4200 : 5600 + Math.random() * 2600);
    }

    function scheduleProductionGhost(delay) {
        window.clearTimeout(productionTimer);
        if (activeRoom !== 'alchemy' || document.hidden || prefersReducedMotion.matches) return;
        productionTimer = window.setTimeout(() => triggerProductionGhost(), delay || 8000 + Math.random() * 12000);
    }

    function triggerProductionGhost(screenIndex) {
        if (activeRoom !== 'alchemy') return;
        stopProductionScreens(true);
        const primaryIndex = Number.isInteger(screenIndex)
            ? screenIndex
            : Math.floor(Math.random() * productionScreens.length);
        activateProductionScreen(productionScreens[primaryIndex], chooseProductionLoop());

        if (!Number.isInteger(screenIndex) && !prefersReducedMotion.matches && Math.random() < 0.12) {
            const secondaryIndex = (primaryIndex + 1) % productionScreens.length;
            window.setTimeout(() => {
                if (activeRoom === 'alchemy') activateProductionScreen(productionScreens[secondaryIndex], chooseProductionLoop());
            }, 280);
        }
        scheduleProductionGhost();
    }

    async function enterAlchemyRoom(options) {
        const settings = options || {};
        if (activeRoom === 'alchemy' || alchemyRoomOpening) return;
        alchemyRoomOpening = true;
        if (!alchemyArt.complete || !alchemyArt.naturalWidth) {
            showStatus('Unlocking the production room…', 3200);
            try {
                await alchemyArt.decode();
            } catch (error) {
                // The image element will still show its normal fallback behavior.
            }
        }
        alchemyRoomOpening = false;
        if (infoDialog.open) closeDialog(infoDialog);
        radioAudio.pause();
        activeRoom = 'alchemy';
        lobbyScroll.hidden = true;
        alchemyScroll.hidden = false;
        mobileFloorplan.hidden = true;
        mobileRoomExit.hidden = false;
        document.body.classList.add('bt-room-alchemy');
        alchemyScene.classList.remove('is-entering');
        void alchemyScene.offsetWidth;
        alchemyScene.classList.add('is-entering');
        alchemyScroll.scrollLeft = 0;
        scheduleProductionGhost(3600);
        loadGlowTracks();
        primeAlchemyPlayer(ALCHEMY_VIDEOS[0]).catch(() => {});

        if (settings.updateHistory !== false && window.location.hash !== '#absurd-alchemy') {
            window.history.pushState({ btRoom: 'alchemy' }, '', '#absurd-alchemy');
        }
        showStatus('Absurd Alchemy. The director’s chair controls the big screen.', 4200);
        window.setTimeout(() => alchemyChairHotspot.focus({ preventScroll: true }), 380);
    }

    function leaveAlchemyRoom(options) {
        const settings = options || {};
        if (activeRoom !== 'alchemy') return;
        setInventoryDrawerOpen(false, false);
        activeRoom = 'lobby';
        window.clearTimeout(productionTimer);
        stopProductionScreens();
        if (glowFrame) {
            window.cancelAnimationFrame(glowFrame);
            glowFrame = 0;
        }
        stopYtGlowPoll();
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
        if (alchemyPlayer) alchemyPlayer.pause().catch(() => {});
        alchemyHeroScreen.classList.remove('is-playing');
        alchemyScroll.hidden = true;
        lobbyScroll.hidden = false;
        mobileFloorplan.hidden = false;
        mobileRoomExit.hidden = true;
        document.body.classList.remove('bt-room-alchemy');

        if (settings.updateHistory !== false) {
            if (window.history.state && window.history.state.btRoom === 'alchemy') {
                window.history.back();
            } else {
                window.history.replaceState({ btRoom: 'lobby' }, '', `${window.location.pathname}${window.location.search}`);
            }
        }
        showStatus('Back in the lobby.', 2200);
        window.setTimeout(() => alchemyDoorHotspot.focus({ preventScroll: true }), 60);
    }

    async function enterContentRoom(options) {
        const settings = options || {};
        if (activeRoom === 'content' || contentRoomOpening) return;
        contentRoomOpening = true;
        if (!contentArt.complete || !contentArt.naturalWidth) {
            showStatus('Starting the conveyor line…', 3200);
            try {
                await contentArt.decode();
            } catch (error) {
                // The image element will still show its normal fallback behavior.
            }
        }
        contentRoomOpening = false;
        if (infoDialog.open) closeDialog(infoDialog);
        radioAudio.pause();
        activeRoom = 'content';
        lobbyScroll.hidden = true;
        contentScroll.hidden = false;
        mobileFloorplan.hidden = true;
        mobileRoomExit.hidden = false;
        document.body.classList.add('bt-room-content');
        contentScene.classList.remove('is-entering');
        void contentScene.offsetWidth;
        contentScene.classList.add('is-entering');
        contentScroll.scrollLeft = 0;

        if (settings.updateHistory !== false && window.location.hash !== '#content-factory') {
            window.history.pushState({ btRoom: 'content' }, '', '#content-factory');
        }
        showStatus('The Content Factory. The conveyor line is still carrying old work.', 4200);
        const focusTarget = hasContentQuarter ? contentConsoleHotspot : contentQuarterHotspot;
        window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 380);
    }

    function leaveContentRoom(options) {
        const settings = options || {};
        if (activeRoom !== 'content') return;
        setInventoryDrawerOpen(false, false);
        activeRoom = 'lobby';
        contentScroll.hidden = true;
        lobbyScroll.hidden = false;
        mobileFloorplan.hidden = false;
        mobileRoomExit.hidden = true;
        document.body.classList.remove('bt-room-content');

        if (settings.updateHistory !== false) {
            if (window.history.state && window.history.state.btRoom === 'content') {
                window.history.back();
            } else {
                window.history.replaceState({ btRoom: 'lobby' }, '', `${window.location.pathname}${window.location.search}`);
            }
        }
        showStatus('Back in the lobby.', 2200);
        window.setTimeout(() => contentDoorHotspot.focus({ preventScroll: true }), 60);
    }

    function syncRoomFromLocation() {
        if (window.location.hash === '#absurd-alchemy') {
            if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
            enterAlchemyRoom({ updateHistory: false });
            return;
        }
        if (window.location.hash === '#content-factory') {
            if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
            enterContentRoom({ updateHistory: false });
            return;
        }
        if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
        if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
    }

    function playTapeTwentyFive() {
        animateLayer(alchemyTwentyFiveHotspot, 'is-farting', 560);
        if (!soundEnabled) {
            showStatus('Tape 25 performs in dignified silence.');
            return;
        }

        let clipIndex = Math.floor(Math.random() * TAPE_25_CLIPS.length);
        if (TAPE_25_CLIPS.length > 1 && clipIndex === lastTape25ClipIndex) {
            clipIndex = (clipIndex + 1) % TAPE_25_CLIPS.length;
        }
        lastTape25ClipIndex = clipIndex;
        tape25Audio.src = TAPE_25_CLIPS[clipIndex];
        tape25Audio.currentTime = 0;
        tape25Audio.play().catch(() => {});
        showStatus('Tape 25 offers its production notes.', 2800);
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
                if (route.id === 'alchemy') {
                    window.setTimeout(() => enterAlchemyRoom(), 30);
                    return;
                }
                if (route.id === 'content') {
                    window.setTimeout(() => enterContentRoom(), 30);
                    return;
                }
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

    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('bt-sound-enabled', String(soundEnabled));
        infoButton.textContent = soundEnabled ? 'Turn sound off' : 'Turn sound on';
        if (!soundEnabled) {
            radioAudio.pause();
            tape25Audio.pause();
        }
        showStatus(soundEnabled ? 'Lobby sound is on.' : 'Lobby sound is off.');
    }

    function tuneRadio() {
        animateLayer(radioHotspot, 'is-tuning', 680);
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
        animateLayer(bellHotspot, 'is-ringing', 780);
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

    function animateLayer(button, className, duration) {
        if (!button) return;
        window.clearTimeout(button.btAnimationTimer);
        button.classList.remove(className);
        void button.offsetWidth;
        button.classList.add(className);
        button.btAnimationTimer = window.setTimeout(() => button.classList.remove(className), duration);
    }

    function bindAlchemyObjectLayer(hotspot, layer) {
        if (!hotspot || !layer) return;
        const setHovered = (hovered) => layer.classList.toggle('is-hovered', hovered);
        hotspot.addEventListener('pointerenter', () => setHovered(true));
        hotspot.addEventListener('pointerleave', () => setHovered(false));
        hotspot.addEventListener('focus', () => setHovered(true));
        hotspot.addEventListener('blur', () => setHovered(false));
    }

    bindAlchemyObjectLayer(alchemyChairHotspot, alchemyChairLayer);
    bindAlchemyObjectLayer(alchemyScriptsHotspot, alchemyCrateLayer);
    bindAlchemyObjectLayer(alchemySolarHotspot, alchemySolarLayer);
    bindAlchemyObjectLayer(alchemyCatHotspot, alchemyCatLayer);
    bindAlchemyObjectLayer(alchemyTwentyFiveHotspot, alchemyTapeTwentyFiveLayer);
    bindAlchemyObjectLayer(alchemyExitHotspot, alchemyExitDoorLayer);
    bindAlchemyObjectLayer(alchemyHandHotspot, alchemyHandLayer);

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
        if (!penIsOnGuestbook()) {
            guestbookStatus.textContent = 'Place the inventory pen on the guest book before signing.';
            return;
        }
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
        button.addEventListener('click', () => {
            const panelId = button.dataset.panel;
            if (panelId === 'alchemy') {
                animateLayer(button, 'is-activating', 680);
                if (prefersReducedMotion.matches) {
                    enterAlchemyRoom();
                } else {
                    window.setTimeout(() => enterAlchemyRoom(), 360);
                }
                return;
            }
            if (panelId === 'content') {
                animateLayer(button, 'is-activating', 680);
                if (prefersReducedMotion.matches) {
                    enterContentRoom();
                } else {
                    window.setTimeout(() => enterContentRoom(), 360);
                }
                return;
            }
            const hasDoorwayAnimation = panelId === 'portal' || button.classList.contains('bt-layered-doorway');
            if (!hasDoorwayAnimation) {
                openPanel(panelId);
                return;
            }

            animateLayer(button, 'is-activating', 680);
            if (prefersReducedMotion.matches) {
                openPanel(panelId);
                return;
            }
            window.setTimeout(() => openPanel(panelId), 360);
        });
    });

    document.querySelectorAll('[data-alchemy-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.alchemyAction;
            if (action === 'playlist') {
                animateLayer(alchemyChairLayer, 'is-selected', 650);
                openDialog(alchemyMenuDialog);
            }
            if (action === 'lobby') leaveAlchemyRoom();
            if (action === 'twenty-five') playTapeTwentyFive();
            if (action === 'sagan') cueAlchemyVideo('sagan');
            if (action === 'cat') cueAlchemyVideo('french-kitty');
            if (action === 'hand') showStatus('The hand of Absurd Alchemy. Still reaching for one more impossible shot.', 3600);
            if (action === 'collect-pen') collectAlchemyPen();
            if (action === 'scripts') {
                animateLayer(alchemyCrateLayer, 'is-rustling', 620);
                showStatus('Drafts, call sheets, and at least one page nobody remembers approving.', 3800);
            }
        });
    });

    document.querySelectorAll('[data-content-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.contentAction;
            if (action === 'lobby') leaveContentRoom();
            if (action === 'collect-quarter') collectContentQuarter();
            if (action === 'console') {
                showStatus('Twenty-four article jobs are queued across the conveyor loop.', 3200);
            }
        });
    });

    productionScreens.forEach((screen, index) => {
        screen.addEventListener('click', () => triggerProductionGhost(index));
        screen.querySelector('video').addEventListener('ended', () => {
            if (screen.classList.contains('is-active')) deactivateProductionScreen(screen, true);
        });
    });

    alchemyPlayFallback.addEventListener('click', retryAlchemyPlayback);
    alchemyTapToggle.addEventListener('click', toggleAlchemyPlayback);

    document.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'bell') ringBell();
            if (action === 'radio') {
                tuneRadio();
                if (prefersReducedMotion.matches) {
                    openPanel('radio');
                } else {
                    window.setTimeout(() => openPanel('radio'), 360);
                }
            }
            if (action === 'newspaper') {
                if (quarterIsInNewsstand()) {
                    animateLayer(newspaperHotspot, 'is-opening', 780);
                    window.setTimeout(() => openPanel('press'), prefersReducedMotion.matches ? 0 : 320);
                    return;
                }
                if (quarterIsInInventory() && inventoryQuarterSelected) {
                    insertQuarterIntoNewsstand();
                    return;
                }
                if (quarterIsInInventory()) {
                    showStatus('The dispenser wants the quarter. Drag it from inventory, or select it and activate the dispenser.', 5200);
                    return;
                }
                showStatus('The newspaper dispenser is locked behind a twenty-five-cent problem. The Content Factory may have spare change.', 5000);
                return;
            }
            if (action === 'guestbook') {
                if (penIsOnGuestbook()) {
                    openDialog(guestbookDialog);
                    loadGuestbook(false);
                    return;
                }
                if (penIsInInventory() && inventoryPenSelected) {
                    placePenOnGuestbook();
                    return;
                }
                if (penIsInInventory()) {
                    showStatus('Drag the pen from your inventory onto the guest book. Keyboard visitors can select the pen, then activate the book.', 5200);
                    return;
                }
                if (!hasAlchemyPen) {
                    showStatus('The guest book is waiting, but there is nothing to write with. Maybe Absurd Alchemy has a spare pen.', 4800);
                    return;
                }
            }
        });
    });

    document.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => closeDialog(button.closest('dialog')));
    });

    [infoDialog, guestbookDialog, alchemyMenuDialog].forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog(dialog);
        });
    });

    guestbookMessage.addEventListener('input', () => {
        guestbookCount.textContent = `${guestbookMessage.value.length} / 500`;
    });
    guestbookForm.addEventListener('submit', submitGuestbook);
    guestbookRefresh.addEventListener('click', () => loadGuestbook(true));
    inventoryHandle.addEventListener('click', () => {
        setInventoryDrawerOpen(!inventoryDrawer.classList.contains('is-open'), false);
    });
    lobbyInventoryPen.addEventListener('pointerdown', (event) => {
        if (!penIsInInventory() || event.button !== 0 || event.pointerType === 'mouse') return;
        penPointerId = event.pointerId;
        penPointerStartX = event.clientX;
        penPointerStartY = event.clientY;
        penPointerLastX = event.clientX;
        penPointerLastY = event.clientY;
        penDragStarted = false;
        if (lobbyInventoryPen.setPointerCapture) lobbyInventoryPen.setPointerCapture(event.pointerId);
    });
    lobbyInventoryPen.addEventListener('pointermove', (event) => {
        if (event.pointerId !== penPointerId) return;
        penPointerLastX = event.clientX;
        penPointerLastY = event.clientY;
        const distance = Math.hypot(event.clientX - penPointerStartX, event.clientY - penPointerStartY);
        if (!penDragStarted && distance > 6) {
            penDragStarted = true;
            setInventoryPenSelected(true);
            inventoryDragGhost.hidden = false;
        }
        if (penDragStarted) {
            event.preventDefault();
            movePenDragGhost(event.clientX, event.clientY);
        }
    });
    lobbyInventoryPen.addEventListener('pointerup', (event) => finishPenDrag(event, false));
    lobbyInventoryPen.addEventListener('pointercancel', (event) => finishPenDrag(event, true));
    lobbyInventoryPen.addEventListener('dragstart', (event) => {
        if (!penIsInInventory()) {
            event.preventDefault();
            return;
        }
        setInventoryPenSelected(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'absurd-alchemy-pen');
    });
    lobbyInventoryPen.addEventListener('dragend', () => {
        guestbookHotspot.classList.remove('is-drop-over');
    });
    guestbookHotspot.addEventListener('dragover', (event) => {
        if (!penIsInInventory()) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        guestbookHotspot.classList.add('is-drop-over');
    });
    guestbookHotspot.addEventListener('dragleave', (event) => {
        if (!guestbookHotspot.contains(event.relatedTarget)) {
            guestbookHotspot.classList.remove('is-drop-over');
        }
    });
    guestbookHotspot.addEventListener('drop', (event) => {
        if (!penIsInInventory()) return;
        event.preventDefault();
        guestbookHotspot.classList.remove('is-drop-over');
        placePenOnGuestbook();
    });
    lobbyInventoryPen.addEventListener('click', (event) => {
        if (suppressPenClick) {
            event.preventDefault();
            return;
        }
        setInventoryPenSelected(!inventoryPenSelected);
    });

    lobbyInventoryQuarter.addEventListener('pointerdown', (event) => {
        if (!quarterIsInInventory() || event.button !== 0 || event.pointerType === 'mouse') return;
        quarterPointerId = event.pointerId;
        quarterPointerStartX = event.clientX;
        quarterPointerStartY = event.clientY;
        quarterPointerLastX = event.clientX;
        quarterPointerLastY = event.clientY;
        quarterDragStarted = false;
        if (lobbyInventoryQuarter.setPointerCapture) lobbyInventoryQuarter.setPointerCapture(event.pointerId);
    });
    lobbyInventoryQuarter.addEventListener('pointermove', (event) => {
        if (event.pointerId !== quarterPointerId) return;
        quarterPointerLastX = event.clientX;
        quarterPointerLastY = event.clientY;
        const distance = Math.hypot(event.clientX - quarterPointerStartX, event.clientY - quarterPointerStartY);
        if (!quarterDragStarted && distance > 6) {
            quarterDragStarted = true;
            setInventoryQuarterSelected(true);
            inventoryQuarterDragGhost.hidden = false;
        }
        if (quarterDragStarted) {
            event.preventDefault();
            moveQuarterDragGhost(event.clientX, event.clientY);
        }
    });
    lobbyInventoryQuarter.addEventListener('pointerup', (event) => finishQuarterDrag(event, false));
    lobbyInventoryQuarter.addEventListener('pointercancel', (event) => finishQuarterDrag(event, true));
    lobbyInventoryQuarter.addEventListener('dragstart', (event) => {
        if (!quarterIsInInventory()) {
            event.preventDefault();
            return;
        }
        setInventoryQuarterSelected(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'content-factory-quarter');
    });
    lobbyInventoryQuarter.addEventListener('dragend', () => {
        newspaperHotspot.classList.remove('is-drop-over');
    });
    newspaperHotspot.addEventListener('dragover', (event) => {
        if (!quarterIsInInventory()) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        newspaperHotspot.classList.add('is-drop-over');
    });
    newspaperHotspot.addEventListener('dragleave', (event) => {
        if (!newspaperHotspot.contains(event.relatedTarget)) {
            newspaperHotspot.classList.remove('is-drop-over');
        }
    });
    newspaperHotspot.addEventListener('drop', (event) => {
        if (!quarterIsInInventory()) return;
        event.preventDefault();
        newspaperHotspot.classList.remove('is-drop-over');
        insertQuarterIntoNewsstand();
    });
    lobbyInventoryQuarter.addEventListener('click', (event) => {
        if (suppressQuarterClick) {
            event.preventDefault();
            return;
        }
        setInventoryQuarterSelected(!inventoryQuarterSelected);
    });

    mobileRoomExit.addEventListener('click', () => {
        if (activeRoom === 'alchemy') leaveAlchemyRoom();
        if (activeRoom === 'content') leaveContentRoom();
    });

    radioAudio.addEventListener('ended', () => {
        showStatus('Only static for now. The old broadcasts are still hiding somewhere.');
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.clearTimeout(productionTimer);
            stopProductionScreens();
        } else if (activeRoom === 'alchemy') {
            scheduleProductionGhost(2400);
        }
    });

    window.addEventListener('popstate', syncRoomFromLocation);
    const savedInventory = readInventory();
    hasAlchemyPen = savedInventory.alchemyPen === true;
    alchemyPenLocation = hasAlchemyPen && savedInventory.alchemyPenLocation === 'guestbook' ? 'guestbook' : (hasAlchemyPen ? 'inventory' : 'room');
    hasContentQuarter = savedInventory.contentQuarter === true;
    contentQuarterLocation = hasContentQuarter && savedInventory.contentQuarterLocation === 'newsstand'
        ? 'newsstand'
        : (hasContentQuarter ? 'inventory' : 'room');
    syncPenInventory();
    syncQuarterInventory();
    renderAlchemyPlaylist();
    syncRoomFromLocation();

}());
