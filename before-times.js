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
            title: 'The Sound Stage',
            copy: [
                'The crooked production office of the film years — scripts, short films, web series, questionable props, and twenty-five projects shepherded from idea to finished thing, most of them under the Absurd Alchemy banner.',
                'Its project files now connect the working title of French Kitty to the finished film, open the production machinery inside The NoHo Rag, follow Call Me Lucifer from broadcast scandal into Burbank exile — and preserve The Sisters Hayes, the unproduced horror short whose whole development file survived.'
            ],
            facts: ['Writer / producer', 'French Kitty, featuring Chloe Fineman', 'The NoHo Rag + Call Me Lucifer', 'The Sisters Hayes — unproduced short, 2013', 'Distributed by Troma Entertainment'],
            action: { label: 'Visit the surviving Vimeo archive', href: 'https://vimeo.com/absurdalchemy', external: true }
        },
        games: {
            kicker: 'Door 02 // Burbank // 2008–2013',
            title: 'Game Development',
            copy: [
                'A cinematic engine room full of narrative tools, debug geometry, motion-capture cleanup, version-control rituals, and characters waiting for their animation pass.',
                'The eight illuminated cases trace the path from quality assurance into cinematic support and scripting. Each one wakes the dual-monitor workstation: the official trailer on the right, the credited role on the left.',
                'The binder is reserved for recovered game-writing artifacts. The motion-capture mannequin already has a screen waiting for the tape when it resurfaces.'
            ],
            facts: [
                'Quality Assurance · Quest for Booty',
                'Quality Assurance + Cinematic Support · Resistance 2',
                'Cinematic Scripter · six releases from 2009–2013',
                'MotionBuilder, Maya, Perforce, and internal narrative tools'
            ]
        },
        content: {
            kicker: 'Door 03 // 2013–2022',
            title: 'The Content Factory',
            copy: [
                'A cheerful industrial accident producing blogs, landing pages, campaign copy, websites, search traffic, and the occasional viral object.',
                'The archive now opens in layers: a fast taste, the reason each piece survived, then a full reading edition, strategy system, or annotated before-and-after proof. Below the restored pieces, a card catalog logs the rest of the factory output by client.'
            ],
            facts: ['13 recovered reading paths in the current archive', 'A card catalog logging 195 pieces across eight clients', 'Corporate websites and digital assets', 'A 240% organic-traffic increase at FieldEdge']
        },
        docs: {
            kicker: 'Door 04 // remote // 2022–2024',
            title: 'The Knowledge Maze',
            copy: [
                'A documentation labyrinth where every corridor leads to another edge case, style decision, customer question, or stakeholder with a very reasonable concern.',
                'The GoDaddy chapter is where content craft met product systems at scale—and where the first chatbot-shaped shadows started appearing on the walls.',
                'Inside, three evidence stations restore the human context an early assistance prototype is missing. Give it a person, a goal, and the thing standing in the way; it may find a path the old maze never anticipated.'
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
                'The Northern Star Weekender, 2003–2004. A standing column called NIU Review that graded campus furniture, weather and drinking fountains; film reviews; theater coverage; and the occasional real story about a real person.'
            ],
            facts: ['Northern Star Weekender, 2003–2004', 'NIU Review column, film and theater criticism', 'Clippings recovered and transcribed from the physical archive'],
            button: { label: 'Open the clipping file', action: 'clippings' }
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
            copy: ['The lobby and all four career rooms are open. The Knowledge Maze contains a second route to the present for anyone willing to give the machine enough human context.'],
            routes: [
                { id: 'alchemy', label: '01 · The Sound Stage' },
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

    const KNOWLEDGE_EXHIBITS = {
        human: {
            kicker: 'Evidence 01 // voice and tone',
            title: 'There is a person inside the query',
            copy: [
                'A useful answer changes with the person receiving it. Someone opening their first business site needs different language, pacing, and reassurance than an experienced developer fixing a configuration problem.',
                'The unified guidance was not a coat of friendly paint. It was a system for recognizing confidence, urgency, emotional state, and the amount of knowledge an answer could safely assume.'
            ],
            facts: ['Context recovered: WHO', 'A new business owner', 'Human state before institutional vocabulary'],
            contextValue: 'A NEW BUSINESS OWNER'
        },
        goal: {
            kicker: 'Evidence 02 // before and after',
            title: 'Start with the job, not the interface',
            copy: [
                'The paired GoDaddy panels preserve a recurring transformation: procedural pages organized around product controls became guidance organized around what a customer was actually trying to accomplish.',
                'That shift turns documentation into product design. The writer is no longer describing the maze from above; they are walking beside someone who needs to get somewhere.'
            ],
            facts: ['Context recovered: GOAL', 'Help customers find the business', 'Recovered Websites + Marketing article rewrites'],
            contextValue: 'HELP CUSTOMERS FIND THE BUSINESS'
        },
        friction: {
            kicker: 'Evidence 03 // measured outcome',
            title: 'Find what is really in the way',
            copy: [
                'The pressure gauge tracks a 93% reduction in customer-care escalations after one support experience was redesigned. The words mattered because they removed uncertainty at the moment it was becoming expensive.',
                'The obstacle was not a lack of intelligence. It was unfamiliar language, unclear consequences, and no confidence about the next step.'
            ],
            facts: ['Context recovered: FRICTION', 'Unfamiliar with SEO', '93% fewer customer-care escalations'],
            contextValue: 'UNFAMILIAR WITH SEO'
        }
    };

    // The compiled "revised question." Each keyed fragment is colour-coded and fills
    // in as its evidence is recovered; the joiners are the always-present scaffolding.
    const KNOWLEDGE_REQUEST = [
        { key: 'human', text: 'NEW BUSINESS OWNER' },
        { joiner: ' SEEKING HELP ' },
        { key: 'goal', text: 'FINDING CUSTOMERS' },
        { joiner: ', BUT ' },
        { key: 'friction', text: 'DOESN’T UNDERSTAND SEO' },
        { joiner: '.' }
    ];

    const TUNING_TRACKS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => `/audio/radio_tuning${number}.mp3`);
    const RADIO_EPISODES = [
        {
            title: 'Walken on Water',
            date: 'First episode · 2004',
            duration: '53:03',
            file: '/audio/before-times/the-boat/01-walken-on-water.mp3'
        },
        {
            title: 'Elections',
            date: 'February 24, 2004',
            duration: '21:05',
            file: '/audio/before-times/the-boat/02-elections.mp3'
        },
        {
            title: 'Robotic Brayton',
            date: 'March 16, 2004',
            duration: '25:23',
            file: '/audio/before-times/the-boat/03-robotic-brayton.mp3'
        },
        {
            title: 'Burnt Sienna',
            date: '2004',
            duration: '26:36',
            file: '/audio/before-times/the-boat/04-burnt-sienna.mp3'
        },
        {
            title: 'Viva Variety',
            date: '2004',
            duration: '26:56',
            file: '/audio/before-times/the-boat/05-viva-variety.mp3'
        }
    ];
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
    const GAME_PROJECTS = [
        {
            key: 'quest-for-booty',
            yt: 'Wuql7jRIn6Y',
            title: 'Quest for Booty',
            fullTitle: 'Ratchet & Clank Future: Quest for Booty',
            year: '2008',
            role: ['Quality Assurance'],
            glow: '71 190 205',
            glowHi: '145 235 244'
        },
        {
            key: 'resistance-2',
            yt: 'hnk_zWmBK6Y',
            title: 'Resistance 2',
            fullTitle: 'Resistance 2',
            year: '2008',
            role: ['Quality Assurance', 'Cinematic Support'],
            glow: '214 146 67',
            glowHi: '255 211 126'
        },
        {
            key: 'crack-in-time',
            yt: 'trDZcBShFl0',
            title: 'A Crack in Time',
            fullTitle: 'Ratchet & Clank Future: A Crack in Time',
            year: '2009',
            role: ['Cinematic Scripter'],
            glow: '83 190 232',
            glowHi: '158 236 255'
        },
        {
            key: 'all-4-one',
            yt: 'D_7W4-9Rfsc',
            title: 'All 4 One',
            fullTitle: 'Ratchet & Clank: All 4 One',
            year: '2011',
            role: ['Cinematic Scripter'],
            glow: '231 146 52',
            glowHi: '255 215 125'
        },
        {
            key: 'resistance-3',
            yt: '3t8ZoFCGfyQ',
            title: 'Resistance 3',
            fullTitle: 'Resistance 3',
            year: '2011',
            role: ['Cinematic Scripter'],
            glow: '205 69 43',
            glowHi: '255 151 96'
        },
        {
            key: 'full-frontal-assault',
            yt: 'ZY1aeurQ2z4',
            title: 'Full Frontal Assault',
            fullTitle: 'Ratchet & Clank: Full Frontal Assault',
            year: '2012',
            role: ['Cinematic Scripter'],
            glow: '72 157 222',
            glowHi: '147 218 255'
        },
        {
            key: 'fuse',
            yt: '4JyokG3aHVo',
            title: 'Fuse',
            fullTitle: 'Fuse',
            year: '2013',
            role: ['Cinematic Scripter'],
            glow: '220 118 54',
            glowHi: '255 190 116'
        },
        {
            key: 'into-the-nexus',
            yt: '4RZpGvGgdZA',
            title: 'Into the Nexus',
            fullTitle: 'Ratchet & Clank: Into the Nexus',
            year: '2013',
            role: ['Cinematic Scripter'],
            glow: '143 86 210',
            glowHi: '211 157 255'
        }
    ];
    const MOCAP_GIFS = [
        {
            src: '/bt-assets/mocap/mocap-performance-pair-1-v1.gif?v=20260722b',
            durationMs: 3000,
            label: 'Motion-capture performance paired with its in-engine character pass'
        },
        {
            src: '/bt-assets/mocap/mocap-performance-pair-2-v1.gif?v=20260722b',
            durationMs: 3500,
            label: 'A second motion-capture performance paired with its in-engine character pass'
        },
        {
            src: '/bt-assets/mocap/kevin-manly-fall-v1.gif?v=20260722b',
            durationMs: 6700,
            label: 'Kevin takes a manly fall beside the crash mat'
        }
    ];
    const MONITOR_CALIBRATION_STORAGE_KEY = 'bt-monitor-calibration-v1';
    const MONITOR_CALIBRATION_DEFAULTS = {
        left: {
            tl: [20.3, 28.35],
            tr: [37.88, 29.41],
            br: [37.88, 48.19],
            bl: [20.29, 50.55]
        },
        right: {
            tl: [39.01, 29.74],
            tr: [55.16, 29.72],
            br: [55.26, 47.63],
            bl: [38.97, 47.92]
        }
    };
    const DOCUMENT_CALIBRATION_STORAGE_KEY = 'bt-document-calibration-v1';
    const DOCUMENT_CALIBRATION_DEFAULTS = {
        before: {
            tl: [4.77, 16.64],
            tr: [13.89, 18.34],
            br: [13.82, 46.34],
            bl: [4.79, 47.37]
        },
        after: {
            tl: [16.33, 18.87],
            tr: [23.96, 20.21],
            br: [24.04, 44.53],
            bl: [16.24, 45.84]
        },
        terminal: {
            tl: [39.38, 51.79],
            tr: [62.06, 51.51],
            br: [63.3, 73.03],
            bl: [38.06, 73.25]
        }
    };
    const PRODUCTION_CALIBRATION_STORAGE_KEY = 'bt-production-calibration-v1';
    // Corner points are scene percentages at the TRUE corners of each painted
    // tube — where the straight edges would meet if the glass were flat. The
    // convex contour (rounded corners, outward-bowed edges) is generated from
    // them; cornerRadius is a fraction of the shorter adjacent edge, edgeBulge
    // a fraction of each edge's length. Defaults are the accepted July 23
    // measurement, which the shipped --bt-production-*-shape polygons and
    // element boxes were generated from.
    const PRODUCTION_CALIBRATION_DEFAULTS = {
        upper: {
            tl: [51.63, 15.4],
            tr: [61.51, 15.37],
            br: [61.36, 29.25],
            bl: [51.84, 29.28]
        },
        lower: {
            tl: [51.03, 35.62],
            tr: [60.84, 36.12],
            br: [60.8, 49.75],
            bl: [50.99, 49.53]
        },
        cornerRadius: 0.16,
        edgeBulge: 0.025
    };
    // Room plate is 1672×941; contour math runs in aspect-corrected space so
    // rounding and bulge read as circular on screen, not squashed by the
    // percentage grid.
    const PRODUCTION_CALIBRATION_ASPECT = 1672 / 941;
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
    const mobileOrientationPrompt = document.getElementById('bt-mobile-orientation');
    const mobileOrientationFullscreen = document.getElementById('bt-mobile-orientation-fullscreen');
    const mobileOrientationContinue = document.getElementById('bt-mobile-orientation-continue');
    const mobileImmersiveButton = document.getElementById('bt-mobile-immersive');
    const lobbySceneStatus = document.getElementById('bt-scene-status');
    const alchemySceneStatus = document.getElementById('bt-alchemy-scene-status');
    const gameSceneStatus = document.getElementById('bt-game-scene-status');
    const contentSceneStatus = document.getElementById('bt-content-scene-status');
    const knowledgeSceneStatus = document.getElementById('bt-knowledge-scene-status');
    const infoDialog = document.getElementById('bt-info-dialog');
    const guestbookDialog = document.getElementById('bt-guestbook-dialog');
    const alchemyMenuDialog = document.getElementById('bt-alchemy-menu-dialog');
    const archiveDialog = document.getElementById('bt-archive-dialog');
    const archiveKicker = document.getElementById('bt-archive-kicker');
    const archiveTitle = document.getElementById('bt-archive-title');
    const archiveIndex = document.getElementById('bt-archive-index');
    const archiveDetail = document.getElementById('bt-archive-detail');
    const scanDialog = document.getElementById('bt-scan-dialog');
    const scanKicker = document.getElementById('bt-scan-kicker');
    const scanTitle = document.getElementById('bt-scan-title');
    const scanStage = document.getElementById('bt-scan-stage');
    const scanImage = document.getElementById('bt-scan-image');
    const scanFit = document.getElementById('bt-scan-fit');
    const scanCaption = document.getElementById('bt-scan-caption');
    const scanPages = document.getElementById('bt-scan-pages');
    const gameBinderDialog = document.getElementById('bt-game-binder-dialog');
    const gameBinderIndex = document.getElementById('bt-game-binder-index');
    const gameBinderDetail = document.getElementById('bt-game-binder-detail');
    const gameBinderPosition = document.getElementById('bt-game-binder-position');
    const radioDialog = document.getElementById('bt-radio-dialog');
    const radioAudio = document.getElementById('bt-radio-audio');
    const radioPlaylist = document.getElementById('bt-radio-playlist');
    const radioOscilloscopeFrame = document.getElementById('bt-radio-oscilloscope-frame');
    const radioOscilloscope = document.getElementById('bt-radio-oscilloscope');
    const radioEpisodeNumber = document.getElementById('bt-radio-episode-number');
    const radioNowPlaying = document.getElementById('bt-radio-now-playing');
    const radioEpisodeDate = document.getElementById('bt-radio-episode-date');
    const radioPrev = document.getElementById('bt-radio-prev');
    const radioPlay = document.getElementById('bt-radio-play');
    const radioNext = document.getElementById('bt-radio-next');
    const radioSeek = document.getElementById('bt-radio-seek');
    const radioTime = document.getElementById('bt-radio-time');
    const infoKicker = document.getElementById('bt-dialog-kicker');
    const infoTitle = document.getElementById('bt-dialog-title');
    const knowledgeDocumentViewer = document.getElementById('bt-knowledge-document-viewer');
    const infoRecovery = document.getElementById('bt-dialog-recovery');
    const infoCopy = document.getElementById('bt-dialog-copy');
    const infoFacts = document.getElementById('bt-dialog-facts');
    const infoRoutes = document.getElementById('bt-dialog-routes');
    const infoAction = document.getElementById('bt-dialog-action');
    const infoButton = document.getElementById('bt-dialog-button');
    const infoSecondary = infoDialog.querySelector('.bt-dialog-secondary');
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
    const alchemyPenOverlay = document.getElementById('bt-alchemy-pen-overlay');
    const gameDoorHotspot = document.querySelector('.bt-hotspot-games');
    const gameCaseHotspots = Array.from(document.querySelectorAll('[data-game-key]'));
    const gameCassetteHotspot = document.getElementById('bt-game-cassette');
    const lobbyInventoryPen = document.getElementById('bt-lobby-inventory-pen');
    const inventoryPenSlot = document.getElementById('bt-inventory-slot-pen');
    const lobbyInventoryCassette = document.getElementById('bt-lobby-inventory-cassette');
    const inventoryCassetteSlot = document.getElementById('bt-inventory-slot-cassette');
    const contentDoorHotspot = document.querySelector('.bt-hotspot-content');
    const contentExitHotspot = document.querySelector('.bt-content-hotspot-door');
    const contentConsoleHotspot = document.querySelector('.bt-content-hotspot-console');
    const contentQuarterHotspot = document.getElementById('bt-content-quarter');
    const lobbyInventoryQuarter = document.getElementById('bt-lobby-inventory-quarter');
    const inventoryQuarterSlot = document.getElementById('bt-inventory-slot-quarter');
    const inventoryDragGhost = document.getElementById('bt-inventory-drag-ghost');
    const inventoryQuarterDragGhost = document.getElementById('bt-inventory-quarter-drag-ghost');
    const inventoryCassetteDragGhost = document.getElementById('bt-inventory-cassette-drag-ghost');
    const inventoryDrawer = document.getElementById('bt-inventory-drawer');
    const inventoryHandle = document.getElementById('bt-inventory-handle');
    const lobbyScroll = document.getElementById('bt-lobby-scroll');
    const alchemyScroll = document.getElementById('bt-alchemy-scroll');
    const alchemyScene = document.getElementById('bt-alchemy-scene');
    const alchemyArt = document.querySelector('.bt-alchemy-art');
    const gameScroll = document.getElementById('bt-game-scroll');
    const gameScene = document.getElementById('bt-game-scene');
    const gameArt = document.querySelector('.bt-game-art');
    const gameRoleScreen = document.getElementById('bt-game-role-screen');
    const gameRoleTerminal = document.querySelector('.bt-game-role-terminal');
    const gameTrailerScreen = document.getElementById('bt-game-trailer-screen');
    const gameVideoPlane = document.querySelector('.bt-game-video-plane');
    const gameIframe = document.getElementById('bt-game-player');
    const gameMocapGif = document.getElementById('bt-game-mocap-gif');
    const gamePlayFallback = document.getElementById('bt-game-play-fallback');
    const gameRoleCase = document.getElementById('bt-game-role-case');
    const gameRoleTitle = document.getElementById('bt-game-role-title');
    const gameRoleYear = document.getElementById('bt-game-role-year');
    const gameRoleCopy = document.getElementById('bt-game-role-copy');
    const gameRoleState = document.getElementById('bt-game-role-state');
    const monitorCalibrationLayer = document.getElementById('bt-monitor-calibration');
    const monitorCalibrationOutput = document.getElementById('bt-monitor-calibration-output');
    const monitorCalibrationCopy = document.getElementById('bt-monitor-calibration-copy');
    const monitorCalibrationReset = document.getElementById('bt-monitor-calibration-reset');
    const monitorCalibrationScreens = document.getElementById('bt-monitor-calibration-screens');
    const monitorCalibrationVisibilityToggles = Array.from(document.querySelectorAll('[data-calibration-visibility]'));
    const monitorCalibrationHandles = Array.from(document.querySelectorAll('[data-calibration-corner]'));
    const monitorCalibrationPolygons = Array.from(document.querySelectorAll('[data-calibration-polygon]'));
    const contentScroll = document.getElementById('bt-content-scroll');
    const contentScene = document.getElementById('bt-content-scene');
    const contentArt = document.querySelector('.bt-content-art');
    const knowledgeDoorHotspot = document.querySelector('.bt-hotspot-docs');
    const knowledgeBreakSlabs = Array.from(knowledgeDoorHotspot.querySelectorAll('.bt-door-break-slab img'));
    const knowledgeScroll = document.getElementById('bt-knowledge-scroll');
    const knowledgeScene = document.getElementById('bt-knowledge-scene');
    const knowledgeArt = document.querySelector('.bt-knowledge-art-contained');
    const knowledgeTerminal = document.getElementById('bt-knowledge-terminal');
    const knowledgeContextCount = document.getElementById('bt-knowledge-context-count');
    const knowledgeTerminalRequest = document.getElementById('bt-knowledge-terminal-request');
    const knowledgeTerminalResponse = document.getElementById('bt-knowledge-terminal-response');
    const knowledgeAsk = document.getElementById('bt-knowledge-ask');
    const knowledgePresentPortal = document.getElementById('bt-knowledge-present-portal');
    const knowledgePresentVideo = document.getElementById('bt-knowledge-present-video');
    const knowledgeDocumentSurfaces = {
        before: document.querySelector('[data-knowledge-document-surface="before"]'),
        after: document.querySelector('[data-knowledge-document-surface="after"]'),
        terminal: document.getElementById('bt-knowledge-terminal-surface')
    };
    const documentCalibrationLayer = document.getElementById('bt-document-calibration');
    const documentCalibrationOutput = document.getElementById('bt-document-calibration-output');
    const documentCalibrationCopy = document.getElementById('bt-document-calibration-copy');
    const documentCalibrationReset = document.getElementById('bt-document-calibration-reset');
    const documentCalibrationArt = document.getElementById('bt-document-calibration-art');
    const documentCalibrationVisibilityToggles = Array.from(document.querySelectorAll('[data-document-calibration-visibility]'));
    const documentCalibrationHandles = Array.from(document.querySelectorAll('[data-document-calibration-corner]'));
    const documentCalibrationPolygons = Array.from(document.querySelectorAll('[data-document-calibration-polygon]'));
    const productionCalibrationLayer = document.getElementById('bt-production-calibration');
    const productionCalibrationOutput = document.getElementById('bt-production-calibration-output');
    const productionCalibrationCopy = document.getElementById('bt-production-calibration-copy');
    const productionCalibrationReset = document.getElementById('bt-production-calibration-reset');
    const productionCalibrationScreens = document.getElementById('bt-production-calibration-screens');
    const productionCalibrationRadius = document.getElementById('bt-production-calibration-radius');
    const productionCalibrationRadiusValue = document.getElementById('bt-production-calibration-radius-value');
    const productionCalibrationBulge = document.getElementById('bt-production-calibration-bulge');
    const productionCalibrationBulgeValue = document.getElementById('bt-production-calibration-bulge-value');
    const productionCalibrationVisibilityToggles = Array.from(document.querySelectorAll('[data-production-calibration-visibility]'));
    const productionCalibrationHandles = Array.from(document.querySelectorAll('[data-production-calibration-corner]'));
    const productionCalibrationQuads = Array.from(document.querySelectorAll('[data-production-calibration-quad]'));
    const productionCalibrationContours = Array.from(document.querySelectorAll('[data-production-calibration-contour]'));
    const knowledgeContextElements = {
        human: document.getElementById('bt-knowledge-context-human'),
        goal: document.getElementById('bt-knowledge-context-goal'),
        friction: document.getElementById('bt-knowledge-context-friction')
    };
    const knowledgeEvidenceHotspots = Array.from(document.querySelectorAll('[data-knowledge-key]'));
    const knowledgeExitHotspot = document.querySelector('[data-knowledge-action="lobby"]');
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
    const usesTouchscreenLayout = window.matchMedia('(hover: none) and (pointer: coarse)');
    const isPortraitOrientation = window.matchMedia('(orientation: portrait)');
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)');
    let statusTimer = null;
    let guestbookLoaded = false;
    let soundEnabled = localStorage.getItem('bt-sound-enabled') !== 'false';
    const tape25Audio = new Audio();
    tape25Audio.preload = 'none';
    let lastTape25ClipIndex = -1;
    let currentRadioEpisode = 0;
    let radioMode = 'tuning';
    let radioAudioContext = null;
    let radioAnalyser = null;
    let radioAudioSource = null;
    let radioScopeAnimation = 0;
    let radioScopeData = null;
    let activeRoom = 'lobby';
    let alchemyPlayer = null;
    let loadedAlchemyVideoKey = null;
    let currentAlchemyVideo = null;
    let ytPlayer = null;
    let ytApiPromise = null;
    let ytGlowPoll = 0;
    let ytCaptionsClearedFor = null;
    let heroSource = 'vimeo';
    let gamePlayer = null;
    let gamePlayerPromise = null;
    let loadedGameKey = null;
    let currentGameProject = null;
    let gameFallbackTimer = 0;
    let lastMocapGifIndex = -1;
    let mocapPlaybackTimer = 0;
    let monitorCalibration = null;
    let documentCalibration = null;
    let productionCalibration = null;
    let productionTimer = null;
    let lastProductionLoop = -1;
    let productionDeck = [];
    let alchemyRoomOpening = false;
    let gameRoomOpening = false;
    let contentRoomOpening = false;
    let knowledgeRoomOpening = false;
    let knowledgeContext = new Set();
    let knowledgeBreached = false;
    let knowledgeRuptureTimer = 0;
    let knowledgeFlashKey = null;
    let knowledgeFlashTimer = 0;
    let gameBinderInitialized = false;
    let currentGameBinderFile = null;
    let gameMonitorResizeObserver = null;
    let knowledgeDocumentResizeObserver = null;
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
    let hasBoatCassette = false;
    let boatCassetteLocation = 'room';
    let inventoryCassetteSelected = false;
    let cassettePointerId = null;
    let cassetteDragStarted = false;
    let suppressCassetteClick = false;
    let cassettePointerStartX = 0;
    let cassettePointerStartY = 0;
    let cassettePointerLastX = 0;
    let cassettePointerLastY = 0;
    let portraitPromptDismissed = false;

    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function fullscreenRequest() {
        return document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || null;
    }

    function listenForMediaQueryChange(mediaQuery, handler) {
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handler);
        } else if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(handler);
        }
    }

    function syncMobileImmersiveControls() {
        const isTouchscreen = usesTouchscreenLayout.matches;
        const canRequestFullscreen = typeof fullscreenRequest() === 'function';
        const isFullscreen = Boolean(fullscreenElement()) || isStandaloneDisplay.matches || navigator.standalone === true;
        const showOrientationPrompt = isTouchscreen
            && isPortraitOrientation.matches
            && !portraitPromptDismissed;

        mobileOrientationPrompt.hidden = !showOrientationPrompt;
        mobileOrientationFullscreen.hidden = !canRequestFullscreen || isFullscreen;
        mobileImmersiveButton.hidden = !isTouchscreen
            || !canRequestFullscreen
            || isFullscreen
            || showOrientationPrompt;
    }

    async function requestMobileImmersiveMode() {
        if (!usesTouchscreenLayout.matches) return;

        const request = fullscreenRequest();
        if (!fullscreenElement() && !isStandaloneDisplay.matches && navigator.standalone !== true && request) {
            try {
                await Promise.resolve(request.call(document.documentElement));
            } catch (error) {
                // Fullscreen is a progressive enhancement. The rotate prompt
                // remains available when a browser declines the request.
            }
        }

        if (screen.orientation && typeof screen.orientation.lock === 'function') {
            try {
                await screen.orientation.lock('landscape');
            } catch (error) {
                // iOS and some embedded browsers do not expose orientation
                // locking. They receive the rotate-phone fallback instead.
            }
        }

        syncMobileImmersiveControls();
    }

    mobileOrientationFullscreen.addEventListener('click', requestMobileImmersiveMode);
    mobileImmersiveButton.addEventListener('click', requestMobileImmersiveMode);
    mobileOrientationContinue.addEventListener('click', () => {
        portraitPromptDismissed = true;
        syncMobileImmersiveControls();
    });

    document.addEventListener('fullscreenchange', syncMobileImmersiveControls);
    document.addEventListener('webkitfullscreenchange', syncMobileImmersiveControls);
    listenForMediaQueryChange(isPortraitOrientation, syncMobileImmersiveControls);
    listenForMediaQueryChange(usesTouchscreenLayout, syncMobileImmersiveControls);
    listenForMediaQueryChange(isStandaloneDisplay, syncMobileImmersiveControls);
    syncMobileImmersiveControls();

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

    function boatCassetteIsInInventory() {
        return hasBoatCassette && boatCassetteLocation === 'inventory';
    }

    function boatCassetteIsInRadio() {
        return hasBoatCassette && boatCassetteLocation === 'radio';
    }

    function inventoryHasItems() {
        return penIsInInventory() || quarterIsInInventory() || boatCassetteIsInInventory();
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

    function saveBoatCassetteState() {
        const inventory = readInventory();
        inventory.boatCassette = hasBoatCassette;
        inventory.boatCassetteLocation = boatCassetteLocation;
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
        alchemyPenOverlay.classList.toggle('is-active', hasAlchemyPen);
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
        alchemyPenOverlay.classList.add('is-active');
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
        if (selected && inventoryCassetteSelected) setInventoryCassetteSelected(false);
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
        showStatus('A suspiciously good quarter rattles into inventory.', 3400);
    }

    function setInventoryQuarterSelected(selected) {
        if (selected && inventoryPenSelected) setInventoryPenSelected(false);
        if (selected && inventoryCassetteSelected) setInventoryCassetteSelected(false);
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

    function syncRadioAccess() {
        const unlocked = boatCassetteIsInRadio();
        const cassetteReady = boatCassetteIsInInventory();
        radioHotspot.classList.toggle('is-unlocked', unlocked);
        gameCassetteHotspot.hidden = hasBoatCassette;
        inventoryCassetteSlot.classList.toggle('bt-inventory-slot-filled', cassetteReady);
        lobbyInventoryCassette.hidden = !cassetteReady;

        if (!cassetteReady) {
            inventoryCassetteSelected = false;
            lobbyInventoryCassette.classList.remove('is-selected');
            lobbyInventoryCassette.setAttribute('aria-pressed', 'false');
            radioHotspot.classList.remove('is-drop-target', 'is-drop-over');
        }

        if (unlocked) {
            radioHotspot.dataset.label = 'The Boat radio archive · unlocked';
            radioHotspot.setAttribute('aria-label', 'Open the unlocked archive of The Boat radio show');
            PANELS.radio.kicker = 'Lobby exhibit // signal recovered';
            PANELS.radio.title = 'The Boat is on the air';
            PANELS.radio.copy = [
                'The hand-labeled cassette from the Game Development desk fits the receiver. Five broadcasts from 2004 have come back through the static.',
                'The recovered archive includes the first episode, Walken on Water, plus Elections, Robotic Brayton, Burnt Sienna, and Viva Variety.'
            ];
            PANELS.radio.facts = ['Five complete recovered broadcasts', 'Chaz Wilke · John Ugolini · Brayton Cameron', 'Live CRT oscilloscope playback'];
            PANELS.radio.button = { label: 'Open The Boat archive', action: 'broadcasts' };
        } else if (cassetteReady) {
            radioHotspot.dataset.label = 'Radio · insert The Boat cassette';
            radioHotspot.setAttribute('aria-label', 'Drop The Boat cassette from inventory onto the radio');
        }
    }

    function syncBoatCassetteInventory(options) {
        const settings = options || {};
        syncRadioAccess();
        syncInventoryDrawer();
        if (settings.openDrawer && boatCassetteIsInInventory()) setInventoryDrawerOpen(true, true);
    }

    function collectBoatCassette() {
        if (hasBoatCassette) {
            setInventoryDrawerOpen(true, true);
            return;
        }

        hasBoatCassette = true;
        boatCassetteLocation = 'inventory';
        saveBoatCassetteState();
        inventoryCassetteSlot.classList.add('bt-inventory-slot-filled');
        lobbyInventoryCassette.hidden = false;
        animateLayer(gameCassetteHotspot, 'is-collecting', 740);
        window.setTimeout(() => {
            gameCassetteHotspot.hidden = true;
            syncBoatCassetteInventory({ openDrawer: true });
        }, prefersReducedMotion.matches ? 0 : 420);
        showStatus('“THE BOAT.” Cassette added to inventory. The lobby radio looks ready for it.', 4600);
    }

    function setInventoryCassetteSelected(selected) {
        if (selected && inventoryPenSelected) setInventoryPenSelected(false);
        if (selected && inventoryQuarterSelected) setInventoryQuarterSelected(false);
        inventoryCassetteSelected = Boolean(selected && boatCassetteIsInInventory());
        lobbyInventoryCassette.classList.toggle('is-selected', inventoryCassetteSelected);
        lobbyInventoryCassette.setAttribute('aria-pressed', String(inventoryCassetteSelected));
        radioHotspot.classList.toggle('is-drop-target', inventoryCassetteSelected);
        if (inventoryCassetteSelected) {
            showStatus('Cassette selected. Drag it onto the radio, or activate the radio to insert it.', 4400);
        }
    }

    function insertBoatCassetteIntoRadio() {
        if (!boatCassetteIsInInventory()) return;
        boatCassetteLocation = 'radio';
        saveBoatCassetteState();
        setInventoryCassetteSelected(false);
        syncBoatCassetteInventory();
        animateLayer(radioHotspot, 'is-tuning', 780);
        showStatus('The cassette clicks into place. The Boat is back on the air.', 3600);
        window.setTimeout(openRadioArchive, prefersReducedMotion.matches ? 0 : 420);
    }

    function pointerIsOverRadio(clientX, clientY) {
        if (activeRoom !== 'lobby') return false;
        const rect = radioHotspot.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function moveCassetteDragGhost(clientX, clientY) {
        inventoryCassetteDragGhost.style.left = `${clientX}px`;
        inventoryCassetteDragGhost.style.top = `${clientY}px`;
        radioHotspot.classList.toggle('is-drop-over', pointerIsOverRadio(clientX, clientY));
    }

    function finishCassetteDrag(event, cancelled) {
        if (event.pointerId !== cassettePointerId) return;
        const shouldInsert = !cancelled
            && cassetteDragStarted
            && pointerIsOverRadio(cassettePointerLastX, cassettePointerLastY);
        if (lobbyInventoryCassette.hasPointerCapture && lobbyInventoryCassette.hasPointerCapture(event.pointerId)) {
            lobbyInventoryCassette.releasePointerCapture(event.pointerId);
        }
        inventoryCassetteDragGhost.hidden = true;
        radioHotspot.classList.remove('is-drop-over');
        cassettePointerId = null;
        if (cassetteDragStarted) {
            suppressCassetteClick = true;
            window.setTimeout(() => { suppressCassetteClick = false; }, 0);
        }
        cassetteDragStarted = false;
        if (shouldInsert) insertBoatCassetteIntoRadio();
    }

    function readKnowledgeState() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('bt-knowledge-v1') || '{}');
            return {
                context: Array.isArray(saved.context)
                    ? saved.context.filter((key) => Object.prototype.hasOwnProperty.call(KNOWLEDGE_EXHIBITS, key))
                    : [],
                breached: saved.breached === true
            };
        } catch (error) {
            return { context: [], breached: false };
        }
    }

    function saveKnowledgeState() {
        try {
            sessionStorage.setItem('bt-knowledge-v1', JSON.stringify({
                context: Array.from(knowledgeContext),
                breached: knowledgeBreached
            }));
        } catch (error) {
            // Session storage can be unavailable; the room still works in memory.
        }
    }

    function renderKnowledgeRequest() {
        const nodes = KNOWLEDGE_REQUEST.map((part) => {
            if (part.joiner) return document.createTextNode(part.joiner);
            const recovered = knowledgeContext.has(part.key);
            const span = document.createElement('span');
            span.className = `bt-ctx-fragment bt-ctx-${part.key}${recovered ? '' : ' is-pending'}`;
            span.dataset.knowledgeFragment = part.key;
            if (recovered) {
                span.textContent = part.text;
            } else {
                // Redact each glyph (keep word spacing) — Space Mono keeps the width
                // identical, so the real phrase drops in with no reflow.
                span.textContent = part.text.replace(/\S/g, '▓');
                span.setAttribute('aria-hidden', 'true');
            }
            return span;
        });
        knowledgeTerminalRequest.replaceChildren(...nodes);
    }

    function revealKnowledgeFragment(key) {
        const fragment = knowledgeTerminalRequest.querySelector(`[data-knowledge-fragment="${key}"]`);
        if (!fragment) return;
        fragment.classList.remove('is-revealing');
        void fragment.offsetWidth;
        fragment.classList.add('is-revealing');
        window.setTimeout(() => fragment.classList.remove('is-revealing'), 1400);
    }

    // The lobby fracture is CSS geometry cut into two copies of the door art.
    // The door layers pop in as they decode, and the shapes paint first, so
    // without this the crack spends a beat floating on a bare wall. Hold it
    // back until the stone it is cut from is actually on screen.
    function syncKnowledgeBreakArt() {
        const ready = knowledgeBreakSlabs.every((img) => img.complete && img.naturalWidth > 0);
        knowledgeDoorHotspot.classList.toggle('bt-break-ready', ready);
        if (ready) return;
        knowledgeBreakSlabs.forEach((img) => {
            img.addEventListener('load', syncKnowledgeBreakArt, { once: true });
        });
    }

    function syncKnowledgeState() {
        const count = knowledgeContext.size;
        const ready = count === Object.keys(KNOWLEDGE_EXHIBITS).length;
        const portalWasHidden = knowledgePresentPortal.hidden;
        knowledgePresentPortal.hidden = !knowledgeBreached;
        if (knowledgeBreached && portalWasHidden && activeRoom === 'knowledge') {
            void knowledgePresentPortal.offsetWidth;
        }
        knowledgeContextCount.textContent = `CONTEXT ${count} / 3`;
        knowledgeScene.dataset.contextCount = String(count);
        knowledgeScene.classList.toggle('has-context', count > 0);
        knowledgeScene.classList.toggle('is-context-ready', ready && !knowledgeBreached);
        knowledgeScene.classList.toggle('is-breached', knowledgeBreached);
        knowledgeDoorHotspot.classList.toggle('bt-is-breached', knowledgeBreached);
        syncKnowledgeBreakArt();

        Object.entries(knowledgeContextElements).forEach(([key, element]) => {
            const recovered = knowledgeContext.has(key);
            const row = element.closest('[data-knowledge-context]');
            element.textContent = recovered ? KNOWLEDGE_EXHIBITS[key].contextValue : 'MISSING';
            row.classList.toggle('is-recovered', recovered);
            const hotspot = knowledgeEvidenceHotspots.find((item) => item.dataset.knowledgeKey === key);
            if (hotspot) hotspot.classList.toggle('is-recovered', recovered);
        });

        knowledgeAsk.hidden = knowledgeBreached;
        knowledgeAsk.disabled = !ready || knowledgeBreached;

        if (knowledgeBreached) {
            renderKnowledgeRequest();
            knowledgeTerminalResponse.textContent = 'New path found. The present awaits!';
            knowledgeDoorHotspot.dataset.label = 'The Knowledge Maze · breach open';
            knowledgeDoorHotspot.setAttribute('aria-label', 'The Knowledge Maze; its path to the present is open');
            if (activeRoom === 'knowledge' && !document.hidden && !prefersReducedMotion.matches) {
                knowledgePresentVideo.play().catch(() => {});
            }
            return;
        }

        knowledgePresentVideo.pause();

        knowledgeDoorHotspot.dataset.label = 'The Knowledge Maze';
        knowledgeDoorHotspot.setAttribute('aria-label', 'The Knowledge Maze documentation room');
        if (ready) {
            renderKnowledgeRequest();
            knowledgeTerminalResponse.replaceChildren(
                document.createTextNode('Context complete.'),
                document.createElement('br'),
                document.createTextNode('New route discovered.')
            );
        } else if (count > 0) {
            // The sentence assembles itself: recovered slots fill in, the rest stay redacted.
            renderKnowledgeRequest();
            const remaining = 3 - count;
            knowledgeTerminalResponse.textContent = `${remaining} piece${remaining === 1 ? '' : 's'} of human context still missing.`;
        } else {
            knowledgeTerminalRequest.textContent = 'HELP ME WITH MY WEBSITE.';
            knowledgeTerminalResponse.textContent = 'A useful answer needs a person, a goal, and the thing standing in the way.';
        }
    }

    function showKnowledgeRecoveryBadge(value) {
        const total = Object.keys(KNOWLEDGE_EXHIBITS).length;
        const count = knowledgeContext.size;
        const complete = count >= total;

        const badge = document.createElement('div');
        badge.className = 'bt-recovery-badge';
        badge.classList.toggle('is-complete', complete);

        const glyph = document.createElement('span');
        glyph.className = 'bt-recovery-badge-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = '✓';

        const text = document.createElement('span');
        text.className = 'bt-recovery-badge-text';

        const label = document.createElement('span');
        label.className = 'bt-recovery-badge-label';
        label.textContent = complete ? 'Context complete' : 'Context recovered';

        const readout = document.createElement('span');
        readout.className = 'bt-recovery-badge-value';
        readout.textContent = value;

        text.append(label, readout);

        const progress = document.createElement('span');
        progress.className = 'bt-recovery-badge-progress';
        const done = document.createElement('b');
        done.textContent = String(count);
        progress.append(done, ` / ${total}`);

        badge.append(glyph, text, progress);
        // Re-trigger the entrance animation on every open (the node is fresh each time).
        infoRecovery.replaceChildren(badge);
        infoRecovery.hidden = false;
    }

    function flashKnowledgeRow(key) {
        const element = knowledgeContextElements[key];
        if (!element) return;
        const row = element.closest('[data-knowledge-context]');
        if (!row) return;
        window.clearTimeout(knowledgeFlashTimer);
        row.classList.remove('is-just-recovered');
        // Force a reflow so the animation restarts on back-to-back recoveries.
        void row.offsetWidth;
        row.classList.add('is-just-recovered');
        knowledgeFlashTimer = window.setTimeout(() => row.classList.remove('is-just-recovered'), 1500);
    }

    function openKnowledgeExhibit(key) {
        const panel = KNOWLEDGE_EXHIBITS[key];
        if (!panel) return;

        const wasRecovered = knowledgeContext.has(key);
        knowledgeContext.add(key);
        saveKnowledgeState();
        syncKnowledgeState();

        infoKicker.textContent = panel.kicker;
        setInfoTitle(panel.title);
        const showDocumentViewer = key === 'goal';
        knowledgeDocumentViewer.hidden = !showDocumentViewer;
        infoDialog.classList.toggle('bt-knowledge-documents-dialog', showDocumentViewer);
        infoCopy.replaceChildren(...panel.copy.map(makeParagraph));
        infoFacts.replaceChildren();
        panel.facts.forEach((fact) => {
            const recoveredMatch = /^Context recovered:\s*(.+)$/i.exec(fact);
            if (recoveredMatch) {
                showKnowledgeRecoveryBadge(recoveredMatch[1]);
            } else {
                const item = document.createElement('li');
                item.textContent = fact;
                infoFacts.appendChild(item);
            }
        });
        infoRoutes.replaceChildren();
        infoAction.hidden = true;
        infoButton.hidden = true;
        infoButton.onclick = null;
        infoSecondary.textContent = 'Back to the room';
        openDialog(infoDialog);

        if (!wasRecovered) {
            // Remember this piece so its terminal row flashes when the modal closes.
            knowledgeFlashKey = key;
            showStatus(`Human context recovered: ${key.toUpperCase()}.`, 3200, 'recovery');
        }
    }

    function openKnowledgeBreach() {
        if (knowledgeBreached || knowledgeAsk.disabled) return;
        window.clearTimeout(knowledgeRuptureTimer);
        knowledgeAsk.disabled = true;
        knowledgeTerminal.classList.add('is-answering');
        knowledgeTerminalResponse.textContent = 'Looking past the prescribed route…';
        showStatus('The terminal is searching the walls instead of the maze.', 4200);

        const beginRupture = () => {
            knowledgeScene.classList.add('is-rupturing');
            knowledgeTerminalResponse.textContent = 'I found a shorter path.';
            knowledgeRuptureTimer = window.setTimeout(() => {
                knowledgeBreached = true;
                saveKnowledgeState();
                syncKnowledgeState();
                knowledgeTerminal.classList.remove('is-answering');
                knowledgeScene.classList.remove('is-rupturing');
                showStatus('There you are. The present has been looking for you.', 5200);
                window.setTimeout(() => knowledgePresentPortal.focus({ preventScroll: true }), 180);
            }, prefersReducedMotion.matches ? 0 : 1350);
        };

        knowledgeRuptureTimer = window.setTimeout(beginRupture, prefersReducedMotion.matches ? 0 : 620);
    }

    function showStatus(message, duration, variant) {
        const sceneStatus = activeRoom === 'alchemy'
            ? alchemySceneStatus
            : (activeRoom === 'games'
                ? gameSceneStatus
                : (activeRoom === 'content'
                    ? contentSceneStatus
                    : (activeRoom === 'knowledge' ? knowledgeSceneStatus : lobbySceneStatus)));
        window.clearTimeout(statusTimer);
        sceneStatus.textContent = message;
        sceneStatus.classList.toggle('is-recovery', variant === 'recovery');
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

    function setInfoTitle(text) {
        infoTitle.textContent = text;
        // Sentence-length titles drop to a smaller scale (see .bt-dialog-long-title).
        infoDialog.classList.toggle('bt-dialog-long-title', text.length > 28);
    }

    function makeArchiveElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function makeGameBinderElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function renderGameBinderBlock(block) {
        const section = makeGameBinderElement('section', `bt-game-binder-block bt-game-binder-${block.type}`);

        if (block.type === 'screenplay') {
            block.lines.forEach(([kind, line]) => {
                section.appendChild(makeGameBinderElement(
                    'p',
                    `bt-game-binder-script-line bt-game-binder-script-${kind}`,
                    line
                ));
            });
            return section;
        }

        if (block.title) section.appendChild(makeGameBinderElement('h3', '', block.title));

        if (block.type === 'section') {
            block.entries.forEach(([label, copy]) => {
                const entry = makeGameBinderElement('div', 'bt-game-binder-entry');
                entry.appendChild(makeGameBinderElement('h4', '', label));
                entry.appendChild(makeGameBinderElement('p', '', copy));
                section.appendChild(entry);
            });
            if (block.note) {
                section.appendChild(makeGameBinderElement('p', 'bt-game-binder-recovery-note', block.note));
            }
            return section;
        }

        (block.paragraphs || []).forEach((paragraph) => {
            section.appendChild(makeGameBinderElement('p', '', paragraph));
        });
        return section;
    }

    function selectGameBinderFile(fileId, options) {
        const files = Array.isArray(window.BEFORE_TIMES_GAME_BINDER)
            ? window.BEFORE_TIMES_GAME_BINDER
            : [];
        const file = files.find((item) => item.id === fileId);
        if (!file) return;
        const settings = options || {};
        currentGameBinderFile = file;

        gameBinderIndex.querySelectorAll('[data-game-binder-file]').forEach((button) => {
            const isActive = button.dataset.gameBinderFile === file.id;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        const header = makeGameBinderElement('header', 'bt-game-binder-file-header');
        header.appendChild(makeGameBinderElement(
            'p',
            'bt-game-binder-file-eyebrow',
            `RECORD ${file.number} // ${file.statusLabel.toUpperCase()}`
        ));
        header.appendChild(makeGameBinderElement('h2', '', file.title));
        header.appendChild(makeGameBinderElement('p', 'bt-game-binder-file-subtitle', file.subtitle));

        const metadata = makeGameBinderElement('dl', 'bt-game-binder-metadata');
        [
            ['PROJECT', file.project],
            ['DATE', file.year],
            ['FORMAT', file.format],
            ['SOURCE', file.source]
        ].forEach(([label, value]) => {
            const field = document.createElement('div');
            field.appendChild(makeGameBinderElement('dt', '', label));
            field.appendChild(makeGameBinderElement('dd', '', value));
            metadata.appendChild(field);
        });
        header.appendChild(metadata);
        header.appendChild(makeGameBinderElement('p', 'bt-game-binder-summary', file.summary));

        const body = makeGameBinderElement('div', 'bt-game-binder-file-body');
        file.blocks.forEach((block) => body.appendChild(renderGameBinderBlock(block)));
        gameBinderDetail.replaceChildren(header, body);
        gameBinderDetail.scrollTop = 0;
        gameBinderPosition.textContent = `RECORD ${file.number} / ${String(files.length).padStart(2, '0')} // ${file.status}`;
        gameBinderDetail.classList.remove('is-refreshing');
        void gameBinderDetail.offsetWidth;
        gameBinderDetail.classList.add('is-refreshing');
        if (settings.focusDetail) gameBinderDetail.focus({ preventScroll: true });
    }

    function initializeGameBinder() {
        if (gameBinderInitialized) return;
        const files = Array.isArray(window.BEFORE_TIMES_GAME_BINDER)
            ? window.BEFORE_TIMES_GAME_BINDER
            : [];
        gameBinderInitialized = true;

        if (!files.length) {
            gameBinderDetail.appendChild(makeGameBinderElement(
                'p',
                'bt-game-binder-empty',
                'ERROR 404 // No recovered narrative records found.'
            ));
            return;
        }

        files.forEach((file) => {
            const button = makeGameBinderElement('button', 'bt-game-binder-index-item');
            button.type = 'button';
            button.dataset.gameBinderFile = file.id;
            button.setAttribute('aria-pressed', 'false');
            button.appendChild(makeGameBinderElement('span', 'bt-game-binder-index-code', `${file.number} / ${file.status}`));
            button.appendChild(makeGameBinderElement('strong', '', file.title));
            button.appendChild(makeGameBinderElement('span', 'bt-game-binder-index-subtitle', file.subtitle));
            button.appendChild(makeGameBinderElement('span', 'bt-game-binder-index-meta', `${file.year} · ${file.format}`));
            button.addEventListener('click', () => selectGameBinderFile(file.id));
            gameBinderIndex.appendChild(button);
        });

        gameBinderIndex.addEventListener('keydown', (event) => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            const buttons = Array.from(gameBinderIndex.querySelectorAll('[data-game-binder-file]'));
            const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
            let nextIndex = currentIndex;
            if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % buttons.length;
            if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = buttons.length - 1;
            event.preventDefault();
            buttons[nextIndex].focus({ preventScroll: true });
            buttons[nextIndex].click();
            buttons[nextIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });

        selectGameBinderFile(files[0].id);
    }

    function openGameBinder() {
        initializeGameBinder();
        openDialog(gameBinderDialog);
        const card = gameBinderDialog.querySelector('.bt-game-binder-card');
        card.classList.remove('is-booting');
        void card.offsetWidth;
        card.classList.add('is-booting');
        window.setTimeout(() => card.classList.remove('is-booting'), 520);
        window.requestAnimationFrame(() => {
            const activeFile = currentGameBinderFile && currentGameBinderFile.id;
            const activeButton = activeFile
                ? gameBinderIndex.querySelector(`[data-game-binder-file="${activeFile}"]`)
                : gameBinderIndex.querySelector('button');
            if (activeButton) activeButton.focus({ preventScroll: true });
        });
    }

    function renderArchiveBody(blocks) {
        const body = makeArchiveElement('div', 'bt-archive-body');
        (blocks || []).forEach((block) => {
            if (block.type === 'paragraph') {
                body.appendChild(makeArchiveElement('p', '', block.text));
                return;
            }
            if (block.type === 'quote') {
                body.appendChild(makeArchiveElement('blockquote', '', block.text));
                return;
            }
            if (block.type === 'subhead') {
                body.appendChild(makeArchiveElement('h3', 'bt-archive-body-heading', block.text));
                return;
            }
            if (block.type === 'bullets') {
                const section = makeArchiveElement('section', 'bt-archive-notes');
                section.appendChild(makeArchiveElement('h3', '', block.title));
                const list = document.createElement('ul');
                block.items.forEach((item) => list.appendChild(makeArchiveElement('li', '', item)));
                section.appendChild(list);
                body.appendChild(section);
                return;
            }
            if (block.type === 'links') {
                const section = makeArchiveElement('section', 'bt-archive-notes bt-archive-documents');
                section.appendChild(makeArchiveElement('h3', '', block.title));
                const list = document.createElement('ul');
                block.items.forEach((item) => {
                    const entry = document.createElement('li');
                    const anchor = makeArchiveElement('a', 'bt-archive-document-link', item.label);
                    anchor.href = item.href;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener';
                    entry.appendChild(anchor);
                    if (item.meta) entry.appendChild(makeArchiveElement('span', 'bt-archive-document-meta', item.meta));
                    list.appendChild(entry);
                });
                section.appendChild(list);
                body.appendChild(section);
                return;
            }
            if (block.type === 'screenplay') {
                const excerpt = makeArchiveElement('blockquote', 'bt-archive-screenplay');
                excerpt.appendChild(makeArchiveElement('strong', '', block.character));
                excerpt.appendChild(makeArchiveElement('p', '', block.text));
                body.appendChild(excerpt);
            }
        });
        return body;
    }

    function renderArchiveComparison(piece) {
        const container = makeArchiveElement('div', 'bt-archive-deep-content');
        const mapHeading = makeArchiveElement('header', 'bt-compare-heading');
        mapHeading.appendChild(makeArchiveElement('p', 'bt-archive-piece-eyebrow', 'The editorial map'));
        mapHeading.appendChild(makeArchiveElement('h3', '', 'Five decisions hiding inside the rewrite'));
        mapHeading.appendChild(makeArchiveElement('p', '', 'Read straight down for the argument, then open either complete page proof to inspect the source.'));
        container.appendChild(mapHeading);

        const changes = makeArchiveElement('div', 'bt-compare-map');
        piece.depth.changes.forEach((change) => {
            const card = makeArchiveElement('article', 'bt-compare-change');
            card.appendChild(makeArchiveElement('h4', '', change.title));

            const before = makeArchiveElement('section', 'bt-compare-change-before');
            before.appendChild(makeArchiveElement('strong', '', 'Before'));
            before.appendChild(makeArchiveElement('p', '', change.before));
            card.appendChild(before);

            const after = makeArchiveElement('section', 'bt-compare-change-after');
            after.appendChild(makeArchiveElement('strong', '', 'After'));
            after.appendChild(makeArchiveElement('p', '', change.after));
            card.appendChild(after);

            const why = makeArchiveElement('aside', 'bt-compare-change-why');
            why.appendChild(makeArchiveElement('strong', '', 'Why it matters'));
            why.appendChild(makeArchiveElement('p', '', change.why));
            card.appendChild(why);
            changes.appendChild(card);
        });
        container.appendChild(changes);

        const source = makeArchiveElement('section', 'bt-compare-source');
        source.appendChild(makeArchiveElement('p', 'bt-archive-piece-eyebrow', 'The complete page proofs'));
        source.appendChild(makeArchiveElement('h3', '', 'Follow the rabbit hole all the way down'));
        source.appendChild(makeArchiveElement('p', 'bt-compare-source-intro', 'Choose a version, then scroll inside the proof to read the complete captured page.'));

        const controls = makeArchiveElement('div', 'bt-compare-source-controls');
        const beforeButton = makeArchiveElement('button', '', 'Read the 2020 original');
        const afterButton = makeArchiveElement('button', '', 'Read the 2021 rewrite');
        beforeButton.type = 'button';
        afterButton.type = 'button';
        controls.append(beforeButton, afterButton);
        source.appendChild(controls);

        const proofLabel = makeArchiveElement('p', 'bt-compare-source-label');
        const proofWindow = makeArchiveElement('div', 'bt-compare-source-window');
        const proofImage = document.createElement('img');
        proofImage.loading = 'lazy';
        proofImage.decoding = 'async';
        proofWindow.appendChild(proofImage);
        source.append(proofLabel, proofWindow);

        function selectProof(version) {
            const isBefore = version === 'before';
            beforeButton.classList.toggle('is-active', isBefore);
            afterButton.classList.toggle('is-active', !isBefore);
            beforeButton.setAttribute('aria-pressed', String(isBefore));
            afterButton.setAttribute('aria-pressed', String(!isBefore));
            proofLabel.textContent = isBefore
                ? 'Original publication // November 2020'
                : 'Rebuilt publication // November 2021';
            proofImage.src = isBefore ? piece.beforeImage : piece.afterImage;
            proofImage.alt = isBefore ? piece.beforeAlt : piece.afterAlt;
            proofWindow.scrollTop = 0;
        }

        beforeButton.addEventListener('click', () => selectProof('before'));
        afterButton.addEventListener('click', () => selectProof('after'));
        selectProof('after');
        container.appendChild(source);
        return container;
    }

    /* ------------------------------------------------------------------------
     * The clipping file
     *
     * The press collection is presented in two visual registers, and the split
     * is the whole point: everything printed in 2003–04 reads as newsprint
     * (serif, paper, drop cap, "as printed" captions), and everything written
     * in 2026 — the dek and the curator note — reads as an annotation slip laid
     * on top of the paper. Nothing here should ever let the two voices blur.
     *
     * Two tiers of artifact exist. Eighteen clippings have a full transcription
     * (`piece.depth`); the other fifteen have only the scan plus a recovered
     * pull quote. Both tiers use the same shell, and the pane toggle names the
     * difference honestly rather than hiding it behind a "keep reading" button.
     * ---------------------------------------------------------------------- */

    const PRESS_CAPTION_PREFIX = 'Photo caption, as printed:';

    // The desks are derived from `format`, not hand-tagged, so a new clipping
    // that follows the existing "<Desk> · <subject>" convention files itself.
    const PRESS_DESKS = [
        {
            id: 'features',
            label: 'Features',
            note: 'Reported pieces, round-ups and guides',
            match: (info) => info.kind === 'feature'
        },
        {
            id: 'column',
            label: 'The NIU Review',
            note: 'Weekly graded column, Sept. 2003 → spring 2004',
            match: (info) => info.kind === 'column'
        },
        {
            id: 'reviews',
            label: 'The review desk',
            note: 'Film, theater, music, live performance',
            match: (info) => info.kind === 'review'
        }
    ];

    // Explicit `desk`, `date` and `stars` fields on a piece always win; the
    // fallbacks below read the conventions already present in the data.
    function describePressPiece(piece) {
        const format = piece.format || '';
        const eyebrowParts = (piece.eyebrow || '').split(' // ');
        const eyebrowDesk = eyebrowParts[0] || '';
        const eyebrowTail = eyebrowParts[1] || '';
        const formatParts = format.split(' · ');

        let kind = piece.desk;
        if (!kind) {
            if (/^NIU Review/.test(format)) kind = 'column';
            else if (/review/i.test(formatParts[0])) kind = 'review';
            else kind = 'feature';
        }

        // Reviews name the work they cover in `publication`, in quotes.
        const workMatch = (piece.publication || '').match(/[“"]([^”"]+)[”"]/);
        // "three stars" only repeats the ★ chip sitting next to it.
        const formatTail = formatParts.slice(1).join(' · ');
        const subject = /^(one|two|three|four|five) stars?$/i.test(formatTail) ? '' : formatTail;

        return {
            kind,
            desk: eyebrowDesk,
            // "Sept. 4, 2003" and "spring 2004" both end in a year; "★★★" and
            // "Players Theater" do not, and fall through to the subject line.
            date: piece.date || (/\d{4}$/.test(eyebrowTail) ? eyebrowTail : ''),
            stars: piece.stars !== undefined ? piece.stars : (eyebrowTail.match(/★/g) || []).length,
            work: piece.work || (workMatch ? workMatch[1] : ''),
            subject,
            hasTranscription: Boolean(piece.depth),
            readingTime: (piece.depth && piece.depth.meta) || ''
        };
    }

    // The last paragraph of a clipping body is the printed photo caption. It
    // belongs under the scan, not buried at the end of the prose.
    function splitPressBody(blocks) {
        const body = (blocks || []).slice();
        const last = body[body.length - 1];
        let caption = '';
        if (last && last.type === 'paragraph' && last.text.startsWith(PRESS_CAPTION_PREFIX)) {
            caption = body.pop().text.slice(PRESS_CAPTION_PREFIX.length).trim();
        }
        return { body, caption };
    }

    function makePressStars(count) {
        const stars = makeArchiveElement('span', 'bt-press-stars', '★'.repeat(count));
        stars.setAttribute('aria-label', `${count} ${count === 1 ? 'star' : 'stars'}`);
        return stars;
    }

    // The index groups the file into desks, and that grouped order is the only
    // order the reader ever sees: the numbering and the previous/next walk both
    // run off it, so "Next" always lands on the next card down the list.
    function pressDisplayOrder() {
        const collection = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.press) || [];
        const entries = collection.map((piece) => ({ piece, info: describePressPiece(piece) }));
        const ordered = [];
        PRESS_DESKS.forEach((desk) => {
            entries.forEach((entry) => {
                if (desk.match(entry.info)) ordered.push({ ...entry, desk });
            });
        });
        // Anything a future format string does not match still gets a place.
        entries.forEach((entry) => {
            if (!ordered.some((item) => item.piece.id === entry.piece.id)) ordered.push({ ...entry, desk: null });
        });
        return ordered.map((entry, index) => ({
            ...entry,
            groupLabel: entry.desk ? entry.desk.label : 'The file',
            number: String(index + 1).padStart(2, '0')
        }));
    }

    function renderPressIndex(activeId) {
        const entries = pressDisplayOrder();
        if (!entries.length) return;

        archiveIndex.replaceChildren();

        PRESS_DESKS.forEach((desk) => {
            const deskEntries = entries.filter((entry) => entry.desk === desk);
            if (!deskEntries.length) return;

            const heading = makeArchiveElement('p', 'bt-doc-index-heading');
            heading.appendChild(makeArchiveElement('strong', '', desk.label));
            heading.appendChild(makeArchiveElement('span', '', `${deskEntries.length} · ${desk.note}`));
            archiveIndex.appendChild(heading);

            deskEntries.forEach(({ piece, info, number }) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'bt-archive-index-item bt-doc-index-item';
                button.classList.toggle('is-active', piece.id === activeId);
                button.classList.toggle('is-transcribed', info.hasTranscription);
                button.setAttribute('aria-current', piece.id === activeId ? 'true' : 'false');
                button.appendChild(makeArchiveElement('span', 'bt-archive-index-number', number));
                button.appendChild(makeArchiveElement('strong', '', piece.title));
                button.appendChild(makeArchiveElement(
                    'span',
                    'bt-archive-index-meta',
                    info.work || info.date || info.subject
                ));

                const tags = makeArchiveElement('span', 'bt-doc-index-tags');
                if (info.stars) tags.appendChild(makePressStars(info.stars));
                tags.appendChild(makeArchiveElement(
                    'span',
                    info.hasTranscription ? 'bt-doc-tag is-full' : 'bt-doc-tag',
                    info.hasTranscription ? 'Full text' : 'Scan only'
                ));
                button.appendChild(tags);

                button.addEventListener('click', () => renderPressPiece(piece.id, { revealArticle: true }));
                archiveIndex.appendChild(button);
            });
        });

    }

    // Scrolled by hand rather than with scrollIntoView: on mobile the index sits
    // inside the scrolling card, and letting the browser walk the ancestor chain
    // yanks the article back off screen.
    function revealPressIndexItem() {
        const activeItem = archiveIndex.querySelector('.bt-archive-index-item.is-active');
        if (!activeItem) return;
        // The card sizes itself in dvh, so just after the dialog opens or the
        // viewport changes the list can report a collapsed box — a 20px height
        // over 6,000px of content. Scrolling on those numbers throws the list to
        // the far end, so bail and let the next frame's pass do the work.
        if (archiveIndex.clientHeight < 40) return;
        const item = activeItem.getBoundingClientRect();
        const list = archiveIndex.getBoundingClientRect();
        if (item.top < list.top) {
            archiveIndex.scrollTop += item.top - list.top - 8;
        } else if (item.bottom > list.bottom) {
            archiveIndex.scrollTop += item.bottom - list.bottom + 8;
        }
    }

    /* ------------------------------------------------------------------------
     * The document reader
     *
     * The shell the clipping file and the output archive share: a masthead, the
     * archivist's 2026 annotation as a visibly separate object, a pane switch
     * instead of a "keep reading" gate, and a walk through the collection in the
     * order the index displays it. Each collection supplies its own panes.
     * ---------------------------------------------------------------------- */

    // desk / date / position, headline, then one source line where a three-row
    // definition list used to sit.
    function makeDocMasthead(spec) {
        const header = makeArchiveElement('header', 'bt-doc-header');

        const slug = makeArchiveElement('p', 'bt-doc-slug');
        if (spec.desk) slug.appendChild(makeArchiveElement('span', 'bt-doc-slug-desk', spec.desk));
        if (spec.date) slug.appendChild(makeArchiveElement('span', '', spec.date));
        if (spec.position) slug.appendChild(makeArchiveElement('span', 'bt-doc-slug-count', spec.position));
        header.appendChild(slug);

        header.appendChild(makeArchiveElement('h2', 'bt-doc-headline', spec.title));

        const source = makeArchiveElement('p', 'bt-doc-source');
        (spec.source || []).filter(Boolean).forEach((part) => {
            source.appendChild(typeof part === 'string' ? makeArchiveElement('span', '', part) : part);
        });
        if (source.childElementCount) header.appendChild(source);
        return header;
    }

    function makeDocNote(dek, curator) {
        const note = makeArchiveElement('aside', 'bt-doc-note');
        note.appendChild(makeArchiveElement('p', 'bt-doc-note-label', 'Archivist’s note · 2026'));
        if (dek) note.appendChild(makeArchiveElement('p', 'bt-doc-note-lede', dek));
        if (curator) note.appendChild(makeArchiveElement('p', 'bt-doc-note-body', curator));
        return note;
    }

    // Toggle buttons rather than a tablist: real tab semantics would owe the
    // reader arrow-key navigation, and these are simply pressed states.
    function makeDocSwitch(tabs, activeId, onSelect) {
        const switcher = makeArchiveElement('div', 'bt-doc-switch');
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Choose how to read this piece');
        switcher.style.setProperty('--bt-doc-switch-count', String(tabs.length));
        tabs.forEach((tab) => {
            const button = makeArchiveElement('button', 'bt-doc-switch-item');
            button.type = 'button';
            button.setAttribute('aria-pressed', String(tab.id === activeId));
            button.classList.toggle('is-active', tab.id === activeId);
            button.appendChild(makeArchiveElement('strong', '', tab.label));
            button.appendChild(makeArchiveElement('span', '', tab.meta));
            button.addEventListener('click', () => onSelect(tab.id));
            switcher.appendChild(button);
        });
        return switcher;
    }

    function makeDocWalk(entries, index, onSelect) {
        const walk = makeArchiveElement('nav', 'bt-doc-walk');
        walk.setAttribute('aria-label', 'Move through the archive');
        [
            { entry: entries[index - 1], label: '← Previous', className: 'is-previous' },
            { entry: entries[index + 1], label: 'Next →', className: 'is-next' }
        ].forEach(({ entry, label, className }) => {
            if (!entry) {
                walk.appendChild(makeArchiveElement('span', `bt-doc-walk-blank ${className}`));
                return;
            }
            const button = makeArchiveElement('button', `bt-doc-walk-item ${className}`);
            button.type = 'button';
            button.appendChild(makeArchiveElement('span', '', entry.groupLabel ? `${label}  ·  ${entry.groupLabel}` : label));
            button.appendChild(makeArchiveElement('strong', '', entry.piece.title));
            button.addEventListener('click', () => onSelect(entry.piece.id));
            walk.appendChild(button);
        });
        return walk;
    }

    // Focus is claimed immediately, before any scrolling. Re-rendering removes
    // the button the reader just pressed, and an orphaned focus sends the dialog
    // hunting for a replacement — a hunt that scrolls both the index and the card
    // out from under anything positioned first.
    function settleDocScroll(header, reveal) {
        archiveDetail.scrollTop = 0;
        if (reveal) {
            header.tabIndex = -1;
            header.focus({ preventScroll: true });
        }
        const run = () => {
            revealPressIndexItem();
            if (!reveal || !window.matchMedia('(max-width: 760px)').matches) return;
            const card = archiveDialog.querySelector('.bt-archive-card');
            if (!card || card.clientHeight < 40) return;
            const offset = header.getBoundingClientRect().top - card.getBoundingClientRect().top;
            card.scrollTop += offset - 8;
        };
        // Both passes: the first lands before paint, and the second corrects it
        // if the first ran against a layout that had not settled. Each is a
        // no-op once the target is already in view.
        run();
        window.requestAnimationFrame(run);
    }

    // A clipping can run across several pages of newsprint — "Meet Sam" jumps
    // from the cover to pages 2 and 3. `pages` wins when present; otherwise the
    // single `image` is treated as a one-page run so both shapes render alike.
    function pressPages(piece) {
        if (Array.isArray(piece.pages) && piece.pages.length) {
            return piece.pages.map((page, index) => ({
                label: page.label || `Page ${index + 1}`,
                src: page.src,
                alt: page.alt || '',
                caption: page.caption || ''
            }));
        }
        if (!piece.image) return [];
        return [{
            label: 'The clipping',
            src: piece.image,
            alt: piece.imageAlt || '',
            caption: ''
        }];
    }

    let scanViewerState = { pages: [], index: 0, title: '' };

    function paintScanViewer() {
        const { pages, index } = scanViewerState;
        const page = pages[index];
        if (!page) return;

        scanImage.src = page.src;
        scanImage.alt = page.alt || `Scan of “${scanViewerState.title}”, ${page.label}`;
        scanCaption.textContent = page.caption || '';
        scanCaption.hidden = !page.caption;

        scanPages.replaceChildren();
        scanPages.hidden = pages.length < 2;
        if (pages.length > 1) {
            pages.forEach((item, itemIndex) => {
                const button = makeArchiveElement('button', 'bt-scan-page', item.label);
                button.type = 'button';
                button.setAttribute('aria-pressed', String(itemIndex === index));
                button.classList.toggle('is-active', itemIndex === index);
                button.addEventListener('click', () => {
                    scanViewerState.index = itemIndex;
                    paintScanViewer();
                });
                scanPages.appendChild(button);
            });
        }

        scanStage.classList.remove('is-actual');
        scanFit.textContent = 'Actual size';
        scanFit.setAttribute('aria-pressed', 'false');
        scanStage.scrollTo({ top: 0, left: 0 });
    }

    function openScanViewer(piece, pageIndex) {
        const pages = pressPages(piece);
        if (!pages.length) return;
        scanViewerState = {
            pages,
            index: Math.min(Math.max(pageIndex || 0, 0), pages.length - 1),
            title: piece.title
        };
        scanKicker.textContent = piece.publication || 'As printed';
        scanTitle.textContent = piece.title;
        paintScanViewer();
        openDialog(scanDialog);
    }

    scanFit.addEventListener('click', () => {
        const actual = scanStage.classList.toggle('is-actual');
        scanFit.textContent = actual ? 'Fit to window' : 'Actual size';
        scanFit.setAttribute('aria-pressed', String(actual));
        if (actual) scanStage.focus({ preventScroll: true });
    });

    // Arrow keys walk a multi-page scan, but only while the stage itself is not
    // being panned at actual size, where the arrows belong to the scroll box.
    scanDialog.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        if (scanViewerState.pages.length < 2) return;
        if (scanStage.classList.contains('is-actual') && document.activeElement === scanStage) return;
        const next = scanViewerState.index + (event.key === 'ArrowRight' ? 1 : -1);
        if (next < 0 || next >= scanViewerState.pages.length) return;
        event.preventDefault();
        scanViewerState.index = next;
        paintScanViewer();
    });

    function renderPressScanPane(piece, caption, pageIndex, onSelectPage) {
        const pages = pressPages(piece);
        const index = Math.min(Math.max(pageIndex || 0, 0), Math.max(pages.length - 1, 0));
        const page = pages[index];
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-doc-pane-scan');
        if (!page) return pane;

        // The printed photo caption comes off the body, which is not page
        // specific, so it is only trusted for a single-page clipping. Multi-page
        // runs carry their caption per page.
        const pageCaption = pages.length > 1 ? page.caption : (page.caption || caption);

        if (pages.length > 1) {
            const strip = makeArchiveElement('div', 'bt-press-pagestrip');
            strip.setAttribute('role', 'group');
            strip.setAttribute('aria-label', 'Choose a page of this clipping');
            strip.appendChild(makeArchiveElement(
                'span',
                'bt-press-pagestrip-count',
                `${pages.length} pages, as printed`
            ));
            pages.forEach((item, itemIndex) => {
                const button = makeArchiveElement('button', 'bt-press-pagestrip-item', item.label);
                button.type = 'button';
                button.setAttribute('aria-pressed', String(itemIndex === index));
                button.classList.toggle('is-active', itemIndex === index);
                button.addEventListener('click', () => onSelectPage(itemIndex));
                strip.appendChild(button);
            });
            pane.appendChild(strip);
        }

        const figure = makeArchiveElement('figure', 'bt-press-scan');
        const frame = makeArchiveElement('button', 'bt-press-scan-frame');
        frame.type = 'button';
        frame.setAttribute('aria-label', pages.length > 1
            ? `Open the full-size scan of “${piece.title}”, ${page.label}`
            : `Open the full-size scan of “${piece.title}”`);
        const image = document.createElement('img');
        image.src = page.src;
        image.alt = page.alt;
        image.loading = 'lazy';
        image.decoding = 'async';
        frame.appendChild(image);
        frame.appendChild(makeArchiveElement('span', 'bt-press-scan-zoom', 'Enlarge'));
        frame.addEventListener('click', () => openScanViewer(piece, index));
        figure.appendChild(frame);

        if (pageCaption) {
            const figcaption = document.createElement('figcaption');
            figcaption.appendChild(makeArchiveElement('span', 'bt-press-scan-label', 'Caption, as printed'));
            figcaption.appendChild(makeArchiveElement('p', '', pageCaption));
            figure.appendChild(figcaption);
        }

        pane.appendChild(figure);
        return pane;
    }

    // The graded columns print a scorecard — "Grades, as printed", "Out of five
    // unsightly drool stains" — and it lives in `body` rather than in the
    // transcription, so it has to be rendered on its own or it is lost. It is
    // also the fastest read in the piece, so it sits above the article and shows
    // in both panes.
    function renderPressScorecard(piece) {
        const blocks = (piece.body || []).filter((block) => block.type === 'bullets');
        if (!blocks.length) return null;

        const section = makeArchiveElement('section', 'bt-press-scorecard');
        blocks.forEach((block) => {
            section.appendChild(makeArchiveElement('p', 'bt-press-scorecard-label', block.title));
            const list = makeArchiveElement('dl', 'bt-press-scorecard-list');
            block.items.forEach((item) => {
                const parts = item.split(' — ');
                const grade = parts.length > 1 ? parts.pop() : '';
                const row = document.createElement('div');
                row.appendChild(makeArchiveElement('dt', '', parts.join(' — ')));
                if (grade) row.appendChild(makeArchiveElement('dd', '', grade));
                list.appendChild(row);
            });
            section.appendChild(list);
        });
        return section;
    }

    function renderPressTextPane(piece, info) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-doc-pane-text');

        if (info.hasTranscription) {
            const split = splitPressBody(piece.depth.body);
            const reader = renderArchiveBody(split.body);
            reader.classList.add('bt-archive-reader');
            pane.appendChild(reader);
            if (piece.depth.intro) {
                pane.appendChild(makeArchiveElement('p', 'bt-doc-provenance', piece.depth.intro));
            }
            const endMark = makeArchiveElement('aside', 'bt-archive-end-mark');
            endMark.appendChild(makeArchiveElement('strong', '', 'End of recovered artifact'));
            endMark.appendChild(makeArchiveElement(
                'p',
                '',
                [piece.publication, piece.credit].filter(Boolean).join(' · ')
            ));
            pane.appendChild(endMark);
            return pane;
        }

        // Scan-only: the recovered excerpt is the opening line and the pull
        // quote. Say so plainly instead of implying there is more behind a click.
        // Any scorecard is rendered separately, above.
        const split = splitPressBody(piece.body);
        const excerpt = renderArchiveBody(split.body.filter((block) => block.type !== 'bullets'));
        excerpt.classList.add('bt-press-excerpt');
        pane.appendChild(excerpt);
        pane.appendChild(makeArchiveElement(
            'p',
            'bt-doc-provenance',
            'Only the opening line and the pull quote have been transcribed from this clipping. The scan is the complete record.'
        ));
        return pane;
    }

    function renderPressPiece(pieceId, options) {
        const entries = pressDisplayOrder();
        if (!entries.length) return;
        const foundIndex = entries.findIndex((entry) => entry.piece.id === pieceId);
        const index = foundIndex === -1 ? 0 : foundIndex;
        const { piece, info, number } = entries[index];
        const settings = options || {};
        const mode = settings.mode || (info.hasTranscription ? 'text' : 'scan');
        const caption = splitPressBody(info.hasTranscription ? piece.depth.body : piece.body).caption;
        const pages = pressPages(piece);
        const pageIndex = Math.min(Math.max(settings.page || 0, 0), Math.max(pages.length - 1, 0));
        const reopen = (extra) => renderPressPiece(piece.id, Object.assign({
            mode,
            page: pageIndex,
            revealArticle: settings.revealArticle
        }, extra));

        renderPressIndex(piece.id);

        const header = makeDocMasthead({
            desk: info.desk,
            date: info.date,
            position: `No. ${number} of ${entries.length}`,
            title: piece.title,
            source: [piece.publication, piece.credit, info.stars ? makePressStars(info.stars) : null]
        });

        const switcher = makeDocSwitch([
            {
                id: 'text',
                label: info.hasTranscription ? 'Transcription' : 'Excerpt',
                meta: info.hasTranscription
                    ? (info.readingTime || 'Transcribed in full')
                    : 'Pull quote only'
            },
            {
                id: 'scan',
                label: 'Newsprint',
                meta: pages.length > 1 ? `The original scan · ${pages.length} pages` : 'The original scan'
            }
        ], mode, (id) => reopen({ mode: id }));

        const pane = mode === 'scan'
            ? renderPressScanPane(piece, caption, pageIndex, (nextPage) => reopen({ mode: 'scan', page: nextPage }))
            : renderPressTextPane(piece, info);

        const actions = makeArchiveElement('div', 'bt-dialog-actions bt-archive-actions');
        const close = makeArchiveElement('button', 'bt-dialog-secondary', 'Back to the room');
        close.type = 'button';
        close.addEventListener('click', () => closeDialog(archiveDialog));
        actions.appendChild(close);

        archiveDetail.replaceChildren(...[
            header,
            makeDocNote(piece.dek, piece.curator),
            renderPressScorecard(piece),
            switcher,
            pane,
            makeDocWalk(entries, index, (id) => renderPressPiece(id, { revealArticle: true })),
            actions
        ].filter(Boolean));

        settleDocScroll(header, settings.revealArticle);
    }

    /* ------------------------------------------------------------------------
     * The output archive
     *
     * Where the clipping file sorts into desks, this one sorts into clients —
     * the axis the data already models in `contentCatalog`. That unifies the two
     * lists the index used to keep apart: each client heading now owns its
     * catalog card and whatever has been restored from that drawer, so the shape
     * of the archive (13 restored, 195 logged) is legible at a glance.
     *
     * Unlike a clipping, a restored article's `body` is not an excerpt of the
     * full text — it is a separately written précis with a pull quote. So the
     * preview is not discarded when the gate goes; it becomes the "In brief"
     * pane, which is also where the `bullets` blocks live.
     * ---------------------------------------------------------------------- */

    function contentDisplayOrder() {
        const archive = window.BEFORE_TIMES_ARCHIVE || {};
        const pieces = archive.content || [];
        const catalog = archive.contentCatalog || [];
        const entries = [];
        let number = 0;

        catalog.forEach((group) => {
            const restored = (group.restored || [])
                .map((id) => pieces.find((piece) => piece.id === id))
                .filter(Boolean);
            entries.push({ kind: 'catalog', group, groupLabel: group.client });
            restored.forEach((piece) => {
                number += 1;
                entries.push({
                    kind: 'piece',
                    piece,
                    group,
                    groupLabel: group.client,
                    number: String(number).padStart(2, '0')
                });
            });
        });

        // A restored piece whose client has no catalog drawer still gets a place.
        pieces.forEach((piece) => {
            if (entries.some((entry) => entry.kind === 'piece' && entry.piece.id === piece.id)) return;
            number += 1;
            entries.push({
                kind: 'piece',
                piece,
                group: null,
                groupLabel: piece.publication || 'Unfiled',
                number: String(number).padStart(2, '0')
            });
        });

        return entries;
    }

    // The walk steps between readable pieces; catalog cards are not stops on it.
    function contentPieceEntries() {
        return contentDisplayOrder().filter((entry) => entry.kind === 'piece');
    }

    function describeContentPiece(piece) {
        const eyebrowParts = (piece.eyebrow || '').split(' // ');
        return {
            desk: eyebrowParts[0] || '',
            date: eyebrowParts[1] || '',
            readingTime: (piece.depth && piece.depth.meta) || '',
            isCompare: Boolean(piece.depth && piece.depth.kind === 'compare')
        };
    }

    function renderContentIndex(activeId) {
        const entries = contentDisplayOrder();
        if (!entries.length) return;
        const pieces = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.content) || [];
        const catalog = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.contentCatalog) || [];
        const logged = catalog.reduce((total, group) => total + (group.pieces || 0), 0);

        archiveIndex.replaceChildren();

        const summary = makeArchiveElement('p', 'bt-doc-index-heading bt-out-index-summary');
        summary.appendChild(makeArchiveElement('strong', '', 'The card catalog'));
        summary.appendChild(makeArchiveElement(
            'span',
            '',
            `${pieces.length} restored of ${logged} logged · ${catalog.length} clients`
        ));
        archiveIndex.appendChild(summary);

        let lastGroupId = null;
        entries.forEach((entry) => {
            const groupId = entry.group ? entry.group.id : 'unfiled';
            if (groupId !== lastGroupId) {
                lastGroupId = groupId;
                if (entry.group) {
                    const heading = makeArchiveElement('p', 'bt-doc-index-heading');
                    heading.appendChild(makeArchiveElement('strong', '', entry.group.client));
                    heading.appendChild(makeArchiveElement(
                        'span',
                        '',
                        `${entry.group.years} · ${(entry.group.restored || []).length} restored of ${entry.group.pieces}`
                    ));
                    archiveIndex.appendChild(heading);
                }
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt-archive-index-item bt-doc-index-item';
            const isActive = entry.kind === 'catalog'
                ? entry.group.id === activeId
                : entry.piece.id === activeId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-current', isActive ? 'true' : 'false');

            if (entry.kind === 'catalog') {
                button.classList.add('bt-out-index-drawer');
                button.appendChild(makeArchiveElement('span', 'bt-archive-index-number', '▤'));
                button.appendChild(makeArchiveElement('strong', '', 'The drawer'));
                button.appendChild(makeArchiveElement('span', 'bt-archive-index-meta', entry.group.formats));
                const tags = makeArchiveElement('span', 'bt-doc-index-tags');
                tags.appendChild(makeArchiveElement('span', 'bt-doc-tag', 'Catalog card'));
                button.appendChild(tags);
                button.addEventListener('click', () => renderContentCatalogCard(entry.group.id, { revealArticle: true }));
            } else {
                const info = describeContentPiece(entry.piece);
                button.classList.add('is-transcribed');
                button.appendChild(makeArchiveElement('span', 'bt-archive-index-number', entry.number));
                button.appendChild(makeArchiveElement('strong', '', entry.piece.title));
                button.appendChild(makeArchiveElement('span', 'bt-archive-index-meta', info.date));
                const tags = makeArchiveElement('span', 'bt-doc-index-tags');
                tags.appendChild(makeArchiveElement(
                    'span',
                    'bt-doc-tag is-full',
                    info.isCompare ? 'Before + after' : 'Full read'
                ));
                button.appendChild(tags);
                button.addEventListener('click', () => renderContentPiece(entry.piece.id, { revealArticle: true }));
            }

            archiveIndex.appendChild(button);
        });

        revealPressIndexItem();
    }

    // The 2026 précis: two condensed paragraphs and a pull quote, written for the
    // archive rather than lifted from the article, plus any summary list.
    function renderContentBriefPane(piece) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-out-pane-brief');
        const brief = renderArchiveBody(piece.body);
        brief.classList.add('bt-out-brief');
        pane.appendChild(brief);
        pane.appendChild(makeArchiveElement(
            'p',
            'bt-doc-provenance',
            'Written for the archive in 2026 as a short way in. The article itself is under “Full article.”'
        ));
        return pane;
    }

    function renderContentReadPane(piece) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-doc-pane-text');

        if (piece.image) {
            const figure = makeArchiveElement('figure', 'bt-out-hero');
            const frame = makeArchiveElement('button', 'bt-out-hero-frame');
            frame.type = 'button';
            frame.setAttribute('aria-label', `Open the captured page for “${piece.title}”`);
            const image = document.createElement('img');
            image.src = piece.image;
            image.alt = piece.imageAlt || '';
            image.loading = 'lazy';
            image.decoding = 'async';
            frame.appendChild(image);
            frame.appendChild(makeArchiveElement('span', 'bt-press-scan-zoom', 'Enlarge'));
            frame.addEventListener('click', () => openScanViewer(piece, 0));
            figure.appendChild(frame);
            pane.appendChild(figure);
        }

        const reader = renderArchiveBody(piece.depth.body);
        reader.classList.add('bt-archive-reader');
        pane.appendChild(reader);

        if (piece.depth.intro) {
            pane.appendChild(makeArchiveElement('p', 'bt-doc-provenance', piece.depth.intro));
        }

        const endMark = makeArchiveElement('aside', 'bt-archive-end-mark');
        endMark.appendChild(makeArchiveElement('strong', '', 'End of recovered artifact'));
        endMark.appendChild(makeArchiveElement(
            'p',
            '',
            [piece.publication, piece.credit].filter(Boolean).join(' · ')
        ));
        pane.appendChild(endMark);
        return pane;
    }

    function renderContentComparePane(piece) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-out-pane-compare');
        pane.appendChild(renderArchiveComparison(piece));
        return pane;
    }

    function renderContentPiece(pieceId, options) {
        const entries = contentPieceEntries();
        if (!entries.length) return;
        const foundIndex = entries.findIndex((entry) => entry.piece.id === pieceId);
        const index = foundIndex === -1 ? 0 : foundIndex;
        const { piece, number, group } = entries[index];
        const info = describeContentPiece(piece);
        const settings = options || {};
        const mode = settings.mode || 'read';

        renderContentIndex(piece.id);

        const header = makeDocMasthead({
            desk: group ? group.client : piece.publication,
            date: info.date,
            position: `No. ${number} of ${entries.length}`,
            title: piece.title,
            source: [piece.credit, piece.format]
        });

        const switcher = makeDocSwitch([
            {
                id: 'read',
                label: info.isCompare ? 'The rewrite' : 'Full article',
                meta: info.readingTime || 'The recovered article'
            },
            { id: 'brief', label: 'In brief', meta: 'Summary and pull quote' }
        ], mode, (id) => renderContentPiece(piece.id, {
            mode: id,
            revealArticle: settings.revealArticle
        }));

        let pane;
        if (mode === 'brief') pane = renderContentBriefPane(piece);
        else if (info.isCompare) pane = renderContentComparePane(piece);
        else pane = renderContentReadPane(piece);

        const actions = makeArchiveElement('div', 'bt-dialog-actions bt-archive-actions');
        if (piece.action && piece.action.href) {
            const action = makeArchiveElement('a', 'bt-dialog-action', piece.action.label);
            action.href = piece.action.href;
            action.target = '_blank';
            action.rel = 'noopener';
            actions.appendChild(action);
        }
        const close = makeArchiveElement('button', 'bt-dialog-secondary', 'Back to the room');
        close.type = 'button';
        close.addEventListener('click', () => closeDialog(archiveDialog));
        actions.appendChild(close);

        archiveDetail.replaceChildren(...[
            header,
            makeDocNote(piece.dek, piece.curator),
            switcher,
            pane,
            makeDocWalk(entries, index, (id) => renderContentPiece(id, { revealArticle: true })),
            actions
        ].filter(Boolean));

        settleDocScroll(header, settings.revealArticle);
    }

    function renderContentCatalogCard(groupId, options) {
        const catalog = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.contentCatalog) || [];
        if (!catalog.length) return;
        const group = catalog.find((item) => item.id === groupId) || catalog[0];
        const pieces = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.content) || [];
        const restored = (group.restored || []).map((id) => pieces.find((p) => p.id === id)).filter(Boolean);
        const settings = options || {};

        renderContentIndex(group.id);

        const header = makeDocMasthead({
            desk: 'Card catalog',
            date: group.years,
            position: `${restored.length} restored of ${group.pieces}`,
            title: group.client,
            source: [group.formats]
        });

        const note = makeDocNote(group.summary, restored.length
            ? `${restored.length} of the ${group.pieces} logged pieces ${restored.length === 1 ? 'has' : 'have'} been fully restored. The rest wait, labeled and preserved, for a turn on the bench.`
            : `None of the ${group.pieces} logged pieces has been fully restored yet. Each one waits, labeled and preserved, for a turn on the bench.`);

        const body = makeArchiveElement('div', 'bt-doc-pane bt-out-pane-drawer');

        const samples = makeArchiveElement('section', 'bt-out-drawer-section');
        samples.appendChild(makeArchiveElement('p', 'bt-out-drawer-label', 'Pulled from the drawer'));
        const sampleList = document.createElement('ul');
        (group.samples || []).forEach((title) => sampleList.appendChild(makeArchiveElement('li', '', title)));
        samples.appendChild(sampleList);
        body.appendChild(samples);

        if (restored.length) {
            const section = makeArchiveElement('section', 'bt-out-drawer-section');
            section.appendChild(makeArchiveElement('p', 'bt-out-drawer-label', 'Restored from this drawer'));
            const links = makeArchiveElement('div', 'bt-out-drawer-links');
            restored.forEach((piece) => {
                const link = makeArchiveElement('button', 'bt-out-drawer-link');
                link.type = 'button';
                link.appendChild(makeArchiveElement('strong', '', piece.title));
                link.appendChild(makeArchiveElement('span', '', describeContentPiece(piece).readingTime));
                link.addEventListener('click', () => renderContentPiece(piece.id, { revealArticle: true }));
                links.appendChild(link);
            });
            section.appendChild(links);
            body.appendChild(section);
        }

        const actions = makeArchiveElement('div', 'bt-dialog-actions bt-archive-actions');
        const close = makeArchiveElement('button', 'bt-dialog-secondary', 'Back to the room');
        close.type = 'button';
        close.addEventListener('click', () => closeDialog(archiveDialog));
        actions.appendChild(close);

        archiveDetail.replaceChildren(header, note, body, actions);
        settleDocScroll(header, settings.revealArticle);
    }

    /* ------------------------------------------------------------------------
     * The mutation archive
     *
     * Four project files, and the thing they have in common is not a desk or a
     * client — it is that each one changed shape on the way to the screen. Every
     * piece carries a three-step `lineage`, and every lineage ends in something
     * that can be watched or read. So the chain is the hero element here, the
     * way the printed scorecard is in the clipping file, and the payoff is
     * attached to the end of it rather than parked in a row of buttons.
     * ---------------------------------------------------------------------- */

    function describeAlchemyPiece(piece) {
        const eyebrowParts = (piece.eyebrow || '').split(' // ');
        return {
            desk: eyebrowParts[0] || 'Project file',
            date: eyebrowParts[1] || '',
            readingTime: (piece.depth && piece.depth.meta) || ''
        };
    }

    // Desks are read off the eyebrow in order of first appearance, so a new
    // project file groups itself without a hardcoded list.
    function alchemyDisplayOrder() {
        const collection = (window.BEFORE_TIMES_ARCHIVE && window.BEFORE_TIMES_ARCHIVE.alchemy) || [];
        const entries = collection.map((piece) => ({ piece, info: describeAlchemyPiece(piece) }));
        const desks = [];
        entries.forEach((entry) => {
            if (!desks.includes(entry.info.desk)) desks.push(entry.info.desk);
        });
        const ordered = [];
        desks.forEach((desk) => {
            entries.forEach((entry) => {
                if (entry.info.desk === desk) ordered.push({ ...entry, groupLabel: desk });
            });
        });
        return ordered.map((entry, index) => ({ ...entry, number: String(index + 1).padStart(2, '0') }));
    }

    function renderAlchemyIndex(activeId) {
        const entries = alchemyDisplayOrder();
        if (!entries.length) return;

        archiveIndex.replaceChildren();
        let lastDesk = null;
        entries.forEach((entry) => {
            if (entry.groupLabel !== lastDesk) {
                lastDesk = entry.groupLabel;
                const deskEntries = entries.filter((item) => item.groupLabel === lastDesk);
                const heading = makeArchiveElement('p', 'bt-doc-index-heading');
                heading.appendChild(makeArchiveElement('strong', '', lastDesk));
                heading.appendChild(makeArchiveElement(
                    'span',
                    '',
                    `${deskEntries.length} ${deskEntries.length === 1 ? 'file' : 'files'}`
                ));
                archiveIndex.appendChild(heading);
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt-archive-index-item bt-doc-index-item is-transcribed';
            button.classList.toggle('is-active', entry.piece.id === activeId);
            button.setAttribute('aria-current', entry.piece.id === activeId ? 'true' : 'false');
            button.appendChild(makeArchiveElement('span', 'bt-archive-index-number', entry.number));
            button.appendChild(makeArchiveElement('strong', '', entry.piece.title));
            button.appendChild(makeArchiveElement('span', 'bt-archive-index-meta', entry.info.date));
            const tags = makeArchiveElement('span', 'bt-doc-index-tags');
            tags.appendChild(makeArchiveElement('span', 'bt-doc-tag is-full', entry.piece.depthLabel || 'Project file'));
            button.appendChild(tags);
            button.addEventListener('click', () => renderAlchemyPiece(entry.piece.id, { revealArticle: true }));
            archiveIndex.appendChild(button);
        });

        revealPressIndexItem();
    }

    // The chain, ending in the thing it turned into.
    function renderAlchemyLineage(piece) {
        const lineage = piece.lineage || [];
        if (!lineage.length && !piece.action) return null;

        const section = makeArchiveElement('section', 'bt-sound-lineage');
        section.setAttribute('aria-label', 'What it turned into');
        section.appendChild(makeArchiveElement('p', 'bt-sound-lineage-label', 'The mutation'));

        const chain = makeArchiveElement('ol', 'bt-sound-chain');
        lineage.forEach((step) => {
            const item = document.createElement('li');
            item.appendChild(makeArchiveElement('span', 'bt-sound-chain-year', step.year));
            item.appendChild(makeArchiveElement('strong', '', step.label));
            item.appendChild(makeArchiveElement('span', 'bt-sound-chain-detail', step.detail));
            chain.appendChild(item);
        });
        section.appendChild(chain);

        if (piece.action) {
            const payoff = makeArchiveElement('div', 'bt-sound-payoff');
            if (piece.action.video) {
                const button = makeArchiveElement('button', 'bt-dialog-action', piece.action.label);
                button.type = 'button';
                button.addEventListener('click', () => {
                    closeDialog(archiveDialog);
                    cueAlchemyVideo(piece.action.video);
                });
                payoff.appendChild(button);
            } else if (piece.action.href) {
                const link = makeArchiveElement('a', 'bt-dialog-action', piece.action.label);
                link.href = piece.action.href;
                link.target = '_blank';
                link.rel = 'noopener';
                payoff.appendChild(link);
            }
            section.appendChild(payoff);
        }
        return section;
    }

    function renderAlchemyDossierPane(piece) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-doc-pane-text');

        if (piece.image) {
            const figure = makeArchiveElement('figure', 'bt-out-hero');
            const frame = makeArchiveElement('button', 'bt-out-hero-frame');
            frame.type = 'button';
            frame.setAttribute('aria-label', `Open the still from “${piece.title}”`);
            const image = document.createElement('img');
            image.src = piece.image;
            image.alt = piece.imageAlt || '';
            image.loading = 'lazy';
            image.decoding = 'async';
            frame.appendChild(image);
            frame.appendChild(makeArchiveElement('span', 'bt-press-scan-zoom', 'Enlarge'));
            frame.addEventListener('click', () => openScanViewer(piece, 0));
            figure.appendChild(frame);
            pane.appendChild(figure);
        }

        const reader = renderArchiveBody(piece.depth.body);
        reader.classList.add('bt-archive-reader');
        pane.appendChild(reader);

        if (piece.depth.intro) {
            pane.appendChild(makeArchiveElement('p', 'bt-doc-provenance', piece.depth.intro));
        }

        const endMark = makeArchiveElement('aside', 'bt-archive-end-mark');
        endMark.appendChild(makeArchiveElement('strong', '', 'End of recovered artifact'));
        endMark.appendChild(makeArchiveElement(
            'p',
            '',
            [piece.publication, piece.credit].filter(Boolean).join(' · ')
        ));
        pane.appendChild(endMark);
        return pane;
    }

    // Three lines lifted off the page, which for three of the four files appear
    // nowhere in the dossier — so the excerpt is its own view, not a teaser.
    function renderAlchemyScriptPane(piece) {
        const pane = makeArchiveElement('div', 'bt-doc-pane bt-sound-pane-script');
        const excerpt = renderArchiveBody(piece.body);
        excerpt.classList.add('bt-sound-excerpt');
        pane.appendChild(excerpt);
        pane.appendChild(makeArchiveElement(
            'p',
            'bt-doc-provenance',
            'Lifted from the working script. The complete file is under “The dossier.”'
        ));
        return pane;
    }

    function renderAlchemyPiece(pieceId, options) {
        const entries = alchemyDisplayOrder();
        if (!entries.length) return;
        const foundIndex = entries.findIndex((entry) => entry.piece.id === pieceId);
        const index = foundIndex === -1 ? 0 : foundIndex;
        const { piece, info, number } = entries[index];
        const settings = options || {};
        const mode = settings.mode || 'dossier';

        renderAlchemyIndex(piece.id);

        const header = makeDocMasthead({
            desk: info.desk,
            date: info.date,
            position: `No. ${number} of ${entries.length}`,
            title: piece.title,
            source: [piece.publication, piece.credit, piece.format]
        });

        const switcher = makeDocSwitch([
            { id: 'dossier', label: 'The dossier', meta: info.readingTime || 'The recovered file' },
            { id: 'script', label: 'Script excerpt', meta: 'Lifted from the page' }
        ], mode, (id) => renderAlchemyPiece(piece.id, {
            mode: id,
            revealArticle: settings.revealArticle
        }));

        const pane = mode === 'script'
            ? renderAlchemyScriptPane(piece)
            : renderAlchemyDossierPane(piece);

        const actions = makeArchiveElement('div', 'bt-dialog-actions bt-archive-actions');
        const close = makeArchiveElement('button', 'bt-dialog-secondary', 'Back to the room');
        close.type = 'button';
        close.addEventListener('click', () => closeDialog(archiveDialog));
        actions.appendChild(close);

        archiveDetail.replaceChildren(...[
            header,
            makeDocNote(piece.dek, piece.curator),
            renderAlchemyLineage(piece),
            switcher,
            pane,
            makeDocWalk(entries, index, (id) => renderAlchemyPiece(id, { revealArticle: true })),
            actions
        ].filter(Boolean));

        settleDocScroll(header, settings.revealArticle);
    }

    const ARCHIVE_HEADERS = {
        alchemy: { kicker: 'The Sound Stage // project file', title: 'The mutation archive' },
        press: { kicker: 'Student press // recovered byline', title: 'The clipping file' },
        content: { kicker: 'Content Factory // recovered work', title: 'The output archive' }
    };

    function openArchive(collectionName, pieceId) {
        const header = ARCHIVE_HEADERS[collectionName] || ARCHIVE_HEADERS.content;
        archiveKicker.textContent = header.kicker;
        archiveTitle.textContent = header.title;
        archiveDialog.classList.add('bt-archive-doc');
        if (collectionName === 'alchemy') renderAlchemyPiece(pieceId);
        else if (collectionName === 'content') renderContentPiece(pieceId);
        else renderPressPiece(pieceId);
        openDialog(archiveDialog);
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

    function updateGameRole(project) {
        const projectIndex = GAME_PROJECTS.findIndex((item) => item.key === project.key);
        currentGameProject = project;
        gameRoleCase.textContent = `${String(projectIndex + 1).padStart(2, '0')} / ${String(GAME_PROJECTS.length).padStart(2, '0')}`;
        gameRoleTitle.textContent = project.title;
        gameRoleYear.textContent = project.year;
        gameRoleCopy.replaceChildren(...project.role.map((role, index) => {
            const row = document.createElement('span');
            const number = document.createElement('b');
            const label = document.createElement('span');
            row.className = 'bt-game-role-credit-row';
            number.textContent = String(index + 1).padStart(2, '0');
            label.textContent = role;
            row.append(number, label);
            return row;
        }));
        gameRoleState.textContent = 'CASE LOADED';
        gameScene.style.setProperty('--bt-game-glow-rgb', project.glow);
        gameScene.style.setProperty('--bt-game-glow-hi-rgb', project.glowHi);
        gameScene.classList.add('has-game-selection');
    }

    function updateMocapRole() {
        const row = document.createElement('span');
        const number = document.createElement('b');
        const label = document.createElement('span');
        currentGameProject = null;
        gameRoleCase.textContent = 'MC / 03';
        gameRoleTitle.textContent = 'MOCAP ARCHIVE';
        gameRoleYear.textContent = 'BTS';
        row.className = 'bt-game-role-credit-row';
        number.textContent = '01';
        label.textContent = 'Motion-Capture Performer';
        row.append(number, label);
        gameRoleCopy.replaceChildren(row);
        gameRoleState.textContent = 'FIELD TAPE ROLLING';
        gameScene.style.setProperty('--bt-game-glow-rgb', '143 86 210');
        gameScene.style.setProperty('--bt-game-glow-hi-rgb', '211 157 255');
        gameScene.classList.add('has-game-selection');
        setGameCaseState('');
    }

    function cloneMonitorCalibrationDefaults() {
        return JSON.parse(JSON.stringify(MONITOR_CALIBRATION_DEFAULTS));
    }

    function readMonitorCalibration() {
        const calibration = cloneMonitorCalibrationDefaults();

        try {
            const saved = JSON.parse(localStorage.getItem(MONITOR_CALIBRATION_STORAGE_KEY) || 'null');
            ['left', 'right'].forEach((monitor) => {
                ['tl', 'tr', 'br', 'bl'].forEach((corner) => {
                    const point = saved && saved[monitor] && saved[monitor][corner];
                    if (!Array.isArray(point) || point.length !== 2) return;
                    const x = Number(point[0]);
                    const y = Number(point[1]);
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                        calibration[monitor][corner] = [x, y];
                    }
                });
            });
        } catch (error) {
            // The default guide remains usable when local storage is unavailable.
        }

        return calibration;
    }

    function saveMonitorCalibration() {
        try {
            localStorage.setItem(MONITOR_CALIBRATION_STORAGE_KEY, JSON.stringify(monitorCalibration));
        } catch (error) {
            // Calibration still works for the current page view without persistence.
        }
    }

    function roundMonitorCalibration(value) {
        return Math.round(value * 100) / 100;
    }

    function createRectangleToQuadMatrix(sourceWidth, sourceHeight, quad) {
        const [tl, tr, br, bl] = quad;
        const dx1 = tr.x - br.x;
        const dx2 = bl.x - br.x;
        const dx3 = tl.x - tr.x + br.x - bl.x;
        const dy1 = tr.y - br.y;
        const dy2 = bl.y - br.y;
        const dy3 = tl.y - tr.y + br.y - bl.y;
        let projectiveX = 0;
        let projectiveY = 0;

        if (Math.abs(dx3) > 1e-8 || Math.abs(dy3) > 1e-8) {
            const denominator = dx1 * dy2 - dx2 * dy1;
            if (Math.abs(denominator) < 1e-8) return null;
            projectiveX = (dx3 * dy2 - dx2 * dy3) / denominator;
            projectiveY = (dx1 * dy3 - dx3 * dy1) / denominator;
        }

        const scaleX = tr.x - tl.x + projectiveX * tr.x;
        const shearX = bl.x - tl.x + projectiveY * bl.x;
        const scaleY = tr.y - tl.y + projectiveX * tr.y;
        const shearY = bl.y - tl.y + projectiveY * bl.y;
        const homography = {
            h11: scaleX / sourceWidth,
            h12: shearX / sourceHeight,
            h13: tl.x,
            h21: scaleY / sourceWidth,
            h22: shearY / sourceHeight,
            h23: tl.y,
            h31: projectiveX / sourceWidth,
            h32: projectiveY / sourceHeight
        };

        return [
            homography.h11, homography.h21, 0, homography.h31,
            homography.h12, homography.h22, 0, homography.h32,
            0, 0, 1, 0,
            homography.h13, homography.h23, 0, 1
        ];
    }

    function applyMonitorKeystone(monitor, screen, plane) {
        const screenWidth = screen.clientWidth;
        const screenHeight = screen.clientHeight;
        const sourceWidth = plane.offsetWidth;
        const sourceHeight = plane.offsetHeight;
        if (!screenWidth || !screenHeight || !sourceWidth || !sourceHeight) return;

        const points = MONITOR_CALIBRATION_DEFAULTS[monitor];
        const corners = ['tl', 'tr', 'br', 'bl'];
        const xs = corners.map((corner) => points[corner][0]);
        const ys = corners.map((corner) => points[corner][1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const quad = corners.map((corner) => ({
            x: ((points[corner][0] - minX) / (maxX - minX)) * screenWidth,
            y: ((points[corner][1] - minY) / (maxY - minY)) * screenHeight
        }));
        const matrix = createRectangleToQuadMatrix(sourceWidth, sourceHeight, quad);
        if (!matrix) return;

        const formatted = matrix.map((value) => Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10)));
        plane.style.transform = `matrix3d(${formatted.join(',')})`;
    }

    function applyGameMonitorKeystones() {
        applyMonitorKeystone('left', gameRoleScreen, gameRoleTerminal);
        applyMonitorKeystone('right', gameTrailerScreen, gameVideoPlane);
    }

    function initializeGameMonitorKeystones() {
        if ('ResizeObserver' in window) {
            gameMonitorResizeObserver = new ResizeObserver(applyGameMonitorKeystones);
            gameMonitorResizeObserver.observe(gameScene);
        } else {
            window.addEventListener('resize', applyGameMonitorKeystones);
        }
    }

    function updateMonitorCalibrationView() {
        if (!monitorCalibration) return;
        const cornerOrder = ['tl', 'tr', 'br', 'bl'];

        monitorCalibrationHandles.forEach((handle) => {
            const point = monitorCalibration[handle.dataset.calibrationMonitor][handle.dataset.calibrationCorner];
            handle.style.left = `${point[0]}%`;
            handle.style.top = `${point[1]}%`;
        });

        monitorCalibrationPolygons.forEach((polygon) => {
            const points = cornerOrder
                .map((corner) => monitorCalibration[polygon.dataset.calibrationPolygon][corner].join(','))
                .join(' ');
            polygon.setAttribute('points', points);
        });

        monitorCalibrationOutput.textContent = JSON.stringify(monitorCalibration, null, 2);
    }

    function moveMonitorCalibrationHandle(handle, clientX, clientY) {
        const sceneBounds = gameScene.getBoundingClientRect();
        if (!sceneBounds.width || !sceneBounds.height) return;
        const monitor = handle.dataset.calibrationMonitor;
        const corner = handle.dataset.calibrationCorner;
        const x = Math.min(100, Math.max(0, ((clientX - sceneBounds.left) / sceneBounds.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - sceneBounds.top) / sceneBounds.height) * 100));
        monitorCalibration[monitor][corner] = [roundMonitorCalibration(x), roundMonitorCalibration(y)];
        updateMonitorCalibrationView();
        saveMonitorCalibration();
    }

    function initializeMonitorCalibration() {
        if (new URLSearchParams(window.location.search).get('calibrate') !== 'monitors') return;
        if (!monitorCalibrationLayer || !monitorCalibrationOutput) return;

        const calibrationPointerIds = new WeakMap();
        monitorCalibration = readMonitorCalibration();
        monitorCalibrationLayer.hidden = false;
        document.body.classList.add('bt-calibrating-monitors');
        updateMonitorCalibrationView();

        monitorCalibrationVisibilityToggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const monitor = toggle.dataset.calibrationVisibility;
                const visible = toggle.getAttribute('aria-pressed') !== 'true';
                monitorCalibrationLayer.classList.toggle(`is-${monitor}-hidden`, !visible);
                toggle.setAttribute('aria-pressed', String(visible));
                toggle.textContent = `${monitor === 'left' ? 'Left' : 'Right'} guides: ${visible ? 'on' : 'off'}`;
            });
        });

        monitorCalibrationScreens.addEventListener('click', () => {
            const visible = monitorCalibrationScreens.getAttribute('aria-pressed') !== 'true';
            document.body.classList.toggle('bt-calibration-hide-screens', !visible);
            monitorCalibrationScreens.setAttribute('aria-pressed', String(visible));
            monitorCalibrationScreens.textContent = `Screen overlays: ${visible ? 'on' : 'off'}`;
        });

        monitorCalibrationHandles.forEach((handle) => {
            handle.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                calibrationPointerIds.set(handle, event.pointerId);
                handle.setPointerCapture(event.pointerId);
                handle.classList.add('is-dragging');
                moveMonitorCalibrationHandle(handle, event.clientX, event.clientY);
            });
            handle.addEventListener('pointermove', (event) => {
                if (calibrationPointerIds.get(handle) !== event.pointerId) return;
                event.preventDefault();
                moveMonitorCalibrationHandle(handle, event.clientX, event.clientY);
            });
            const finishDrag = (event) => {
                if (calibrationPointerIds.get(handle) !== event.pointerId) return;
                calibrationPointerIds.delete(handle);
                handle.classList.remove('is-dragging');
                if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
                saveMonitorCalibration();
            };
            handle.addEventListener('pointerup', finishDrag);
            handle.addEventListener('pointercancel', finishDrag);
            handle.addEventListener('keydown', (event) => {
                const offsets = {
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1]
                };
                if (!offsets[event.key]) return;
                event.preventDefault();
                const monitor = handle.dataset.calibrationMonitor;
                const corner = handle.dataset.calibrationCorner;
                const point = monitorCalibration[monitor][corner];
                const step = event.shiftKey ? 0.1 : 0.25;
                monitorCalibration[monitor][corner] = [
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[0] + offsets[event.key][0] * step))),
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[1] + offsets[event.key][1] * step)))
                ];
                updateMonitorCalibrationView();
                saveMonitorCalibration();
            });
        });

        monitorCalibrationCopy.addEventListener('click', async () => {
            const payload = JSON.stringify(monitorCalibration, null, 2);
            const originalLabel = monitorCalibrationCopy.textContent;
            try {
                await navigator.clipboard.writeText(payload);
                monitorCalibrationCopy.textContent = 'Copied — paste into chat';
            } catch (error) {
                monitorCalibrationCopy.textContent = 'Select the JSON above';
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(monitorCalibrationOutput);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            window.setTimeout(() => {
                monitorCalibrationCopy.textContent = originalLabel;
            }, 2200);
        });

        monitorCalibrationReset.addEventListener('click', () => {
            monitorCalibration = cloneMonitorCalibrationDefaults();
            updateMonitorCalibrationView();
            saveMonitorCalibration();
            monitorCalibrationHandles[0].focus({ preventScroll: true });
        });
    }

    function cloneDocumentCalibrationDefaults() {
        return JSON.parse(JSON.stringify(DOCUMENT_CALIBRATION_DEFAULTS));
    }

    function readDocumentCalibration() {
        const calibration = cloneDocumentCalibrationDefaults();

        try {
            const saved = JSON.parse(localStorage.getItem(DOCUMENT_CALIBRATION_STORAGE_KEY) || 'null');
            ['before', 'after', 'terminal'].forEach((surface) => {
                ['tl', 'tr', 'br', 'bl'].forEach((corner) => {
                    const point = saved && saved[surface] && saved[surface][corner];
                    if (!Array.isArray(point) || point.length !== 2) return;
                    const x = Number(point[0]);
                    const y = Number(point[1]);
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                        calibration[surface][corner] = [x, y];
                    }
                });
            });
        } catch (error) {
            // The default document keystones remain usable when storage is unavailable.
        }

        return calibration;
    }

    function saveDocumentCalibration() {
        try {
            localStorage.setItem(DOCUMENT_CALIBRATION_STORAGE_KEY, JSON.stringify(documentCalibration));
        } catch (error) {
            // Calibration still works for the current page view without persistence.
        }
    }

    function applyKnowledgeDocumentKeystone(surfaceName) {
        const surface = knowledgeDocumentSurfaces[surfaceName];
        const points = documentCalibration && documentCalibration[surfaceName];
        const plane = surfaceName === 'terminal'
            ? surface
            : surface && surface.querySelector('.bt-knowledge-document-plane');
        if (!surface || !points || !plane) return;

        const corners = ['tl', 'tr', 'br', 'bl'];
        const xs = corners.map((corner) => points[corner][0]);
        const ys = corners.map((corner) => points[corner][1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        if (maxX - minX < 0.01 || maxY - minY < 0.01) return;

        surface.style.left = `${minX}%`;
        surface.style.top = `${minY}%`;
        surface.style.width = `${maxX - minX}%`;
        surface.style.height = `${maxY - minY}%`;

        const surfaceWidth = surface.clientWidth;
        const surfaceHeight = surface.clientHeight;
        const sourceWidth = plane.offsetWidth;
        const sourceHeight = plane.offsetHeight;
        if (!surfaceWidth || !surfaceHeight || !sourceWidth || !sourceHeight) return;

        const quad = corners.map((corner) => ({
            x: ((points[corner][0] - minX) / (maxX - minX)) * surfaceWidth,
            y: ((points[corner][1] - minY) / (maxY - minY)) * surfaceHeight
        }));
        const matrix = createRectangleToQuadMatrix(sourceWidth, sourceHeight, quad);
        if (!matrix) return;
        const formatted = matrix.map((value) => Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10)));
        plane.style.transform = `matrix3d(${formatted.join(',')})`;
    }

    function applyKnowledgeDocumentKeystones() {
        applyKnowledgeDocumentKeystone('before');
        applyKnowledgeDocumentKeystone('after');
        applyKnowledgeDocumentKeystone('terminal');
    }

    function initializeKnowledgeDocumentKeystones() {
        documentCalibration = readDocumentCalibration();
        applyKnowledgeDocumentKeystones();
        if ('ResizeObserver' in window) {
            knowledgeDocumentResizeObserver = new ResizeObserver(applyKnowledgeDocumentKeystones);
            knowledgeDocumentResizeObserver.observe(knowledgeScene);
        } else {
            window.addEventListener('resize', applyKnowledgeDocumentKeystones);
        }
    }

    function updateDocumentCalibrationView() {
        if (!documentCalibration) return;
        const cornerOrder = ['tl', 'tr', 'br', 'bl'];

        documentCalibrationHandles.forEach((handle) => {
            const point = documentCalibration[handle.dataset.documentCalibrationSurface][handle.dataset.documentCalibrationCorner];
            handle.style.left = `${point[0]}%`;
            handle.style.top = `${point[1]}%`;
        });

        documentCalibrationPolygons.forEach((polygon) => {
            const points = cornerOrder
                .map((corner) => documentCalibration[polygon.dataset.documentCalibrationPolygon][corner].join(','))
                .join(' ');
            polygon.setAttribute('points', points);
        });

        documentCalibrationOutput.textContent = JSON.stringify(documentCalibration, null, 2);
        applyKnowledgeDocumentKeystones();
    }

    function moveDocumentCalibrationHandle(handle, clientX, clientY) {
        const sceneBounds = knowledgeScene.getBoundingClientRect();
        if (!sceneBounds.width || !sceneBounds.height) return;
        const surface = handle.dataset.documentCalibrationSurface;
        const corner = handle.dataset.documentCalibrationCorner;
        const x = Math.min(100, Math.max(0, ((clientX - sceneBounds.left) / sceneBounds.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - sceneBounds.top) / sceneBounds.height) * 100));
        documentCalibration[surface][corner] = [roundMonitorCalibration(x), roundMonitorCalibration(y)];
        updateDocumentCalibrationView();
        saveDocumentCalibration();
    }

    function initializeDocumentCalibration() {
        if (new URLSearchParams(window.location.search).get('calibrate') !== 'documents') return;
        if (!documentCalibrationLayer || !documentCalibrationOutput) return;

        const pointerIds = new WeakMap();
        documentCalibrationLayer.hidden = false;
        document.body.classList.add('bt-calibrating-documents');
        updateDocumentCalibrationView();

        documentCalibrationVisibilityToggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const surface = toggle.dataset.documentCalibrationVisibility;
                const visible = toggle.getAttribute('aria-pressed') !== 'true';
                documentCalibrationLayer.classList.toggle(`is-${surface}-hidden`, !visible);
                toggle.setAttribute('aria-pressed', String(visible));
                const labels = { before: 'Before', after: 'After', terminal: 'Interface' };
                toggle.textContent = `${labels[surface]} guides: ${visible ? 'on' : 'off'}`;
            });
        });

        documentCalibrationArt.addEventListener('click', () => {
            const visible = documentCalibrationArt.getAttribute('aria-pressed') !== 'true';
            document.body.classList.toggle('bt-calibration-hide-documents', !visible);
            documentCalibrationArt.setAttribute('aria-pressed', String(visible));
            documentCalibrationArt.textContent = `Document art: ${visible ? 'on' : 'off'}`;
        });

        documentCalibrationHandles.forEach((handle) => {
            handle.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                pointerIds.set(handle, event.pointerId);
                handle.setPointerCapture(event.pointerId);
                handle.classList.add('is-dragging');
                moveDocumentCalibrationHandle(handle, event.clientX, event.clientY);
            });
            handle.addEventListener('pointermove', (event) => {
                if (pointerIds.get(handle) !== event.pointerId) return;
                event.preventDefault();
                moveDocumentCalibrationHandle(handle, event.clientX, event.clientY);
            });
            const finishDrag = (event) => {
                if (pointerIds.get(handle) !== event.pointerId) return;
                pointerIds.delete(handle);
                handle.classList.remove('is-dragging');
                if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
                saveDocumentCalibration();
            };
            handle.addEventListener('pointerup', finishDrag);
            handle.addEventListener('pointercancel', finishDrag);
            handle.addEventListener('keydown', (event) => {
                const offsets = {
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1]
                };
                if (!offsets[event.key]) return;
                event.preventDefault();
                const surface = handle.dataset.documentCalibrationSurface;
                const corner = handle.dataset.documentCalibrationCorner;
                const point = documentCalibration[surface][corner];
                const step = event.shiftKey ? 0.1 : 0.25;
                documentCalibration[surface][corner] = [
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[0] + offsets[event.key][0] * step))),
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[1] + offsets[event.key][1] * step)))
                ];
                updateDocumentCalibrationView();
                saveDocumentCalibration();
            });
        });

        documentCalibrationCopy.addEventListener('click', async () => {
            const payload = JSON.stringify(documentCalibration, null, 2);
            const originalLabel = documentCalibrationCopy.textContent;
            try {
                await navigator.clipboard.writeText(payload);
                documentCalibrationCopy.textContent = 'Copied — paste into chat';
            } catch (error) {
                documentCalibrationCopy.textContent = 'Select the JSON above';
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(documentCalibrationOutput);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            window.setTimeout(() => {
                documentCalibrationCopy.textContent = originalLabel;
            }, 2200);
        });

        documentCalibrationReset.addEventListener('click', () => {
            documentCalibration = cloneDocumentCalibrationDefaults();
            updateDocumentCalibrationView();
            saveDocumentCalibration();
            documentCalibrationHandles[0].focus({ preventScroll: true });
        });
    }

    function cloneProductionCalibrationDefaults() {
        return JSON.parse(JSON.stringify(PRODUCTION_CALIBRATION_DEFAULTS));
    }

    function readProductionCalibration() {
        const calibration = cloneProductionCalibrationDefaults();

        try {
            const saved = JSON.parse(localStorage.getItem(PRODUCTION_CALIBRATION_STORAGE_KEY) || 'null');
            ['upper', 'lower'].forEach((monitor) => {
                ['tl', 'tr', 'br', 'bl'].forEach((corner) => {
                    const point = saved && saved[monitor] && saved[monitor][corner];
                    if (!Array.isArray(point) || point.length !== 2) return;
                    const x = Number(point[0]);
                    const y = Number(point[1]);
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                        calibration[monitor][corner] = [x, y];
                    }
                });
            });
            if (saved) {
                const radius = Number(saved.cornerRadius);
                const bulge = Number(saved.edgeBulge);
                if (Number.isFinite(radius)) calibration.cornerRadius = Math.min(0.35, Math.max(0, radius));
                if (Number.isFinite(bulge)) calibration.edgeBulge = Math.min(0.08, Math.max(0, bulge));
            }
        } catch (error) {
            // The default contours remain usable when local storage is unavailable.
        }

        return calibration;
    }

    function saveProductionCalibration() {
        try {
            localStorage.setItem(PRODUCTION_CALIBRATION_STORAGE_KEY, JSON.stringify(productionCalibration));
        } catch (error) {
            // Calibration still works for the current page view without persistence.
        }
    }

    function buildProductionContour(points, cornerRadius, edgeBulge) {
        // Sampled convex-tube silhouette: quadratic edges bowed outward along
        // their normals, joined by quadratic corner arcs. Corners run
        // clockwise (tl → tr → br → bl) in y-down scene space, so the outward
        // normal of an edge (dx, dy) is (dy, -dx).
        const corners = ['tl', 'tr', 'br', 'bl'].map((corner) => ({
            x: points[corner][0] * PRODUCTION_CALIBRATION_ASPECT,
            y: points[corner][1]
        }));
        const toScene = (point) => [
            roundMonitorCalibration(point.x / PRODUCTION_CALIBRATION_ASPECT),
            roundMonitorCalibration(point.y)
        ];
        const edges = corners.map((corner, index) => {
            const next = corners[(index + 1) % 4];
            const dx = next.x - corner.x;
            const dy = next.y - corner.y;
            const length = Math.hypot(dx, dy);
            return { dx, dy, length };
        });
        if (edges.some((edge) => edge.length < 1e-6)) return corners.map(toScene);

        // cornerRadius caps at 0.35 of the shorter adjacent edge, so the two
        // trims on one edge can never consume its full length.
        const trims = corners.map((corner, index) =>
            cornerRadius * Math.min(edges[(index + 3) % 4].length, edges[index].length));
        const starts = corners.map((corner, index) => ({
            x: corner.x + (edges[index].dx / edges[index].length) * trims[index],
            y: corner.y + (edges[index].dy / edges[index].length) * trims[index]
        }));
        const ends = corners.map((corner, index) => {
            const next = (index + 1) % 4;
            return {
                x: corners[next].x - (edges[index].dx / edges[index].length) * trims[next],
                y: corners[next].y - (edges[index].dy / edges[index].length) * trims[next]
            };
        });

        const contour = [starts[0]];
        const sampleQuadratic = (start, control, end, steps) => {
            for (let step = 1; step <= steps; step += 1) {
                const t = step / steps;
                const a = (1 - t) * (1 - t);
                const b = 2 * (1 - t) * t;
                const c = t * t;
                contour.push({
                    x: a * start.x + b * control.x + c * end.x,
                    y: a * start.y + b * control.y + c * end.y
                });
            }
        };

        for (let index = 0; index < 4; index += 1) {
            const edge = edges[index];
            const next = (index + 1) % 4;
            // The quadratic apex sits halfway to its control point, so the
            // control offset is twice the requested bulge.
            const apex = 2 * edgeBulge * edge.length;
            sampleQuadratic(starts[index], {
                x: (starts[index].x + ends[index].x) / 2 + (edge.dy / edge.length) * apex,
                y: (starts[index].y + ends[index].y) / 2 - (edge.dx / edge.length) * apex
            }, ends[index], 10);
            sampleQuadratic(ends[index], corners[next], starts[next], 6);
        }
        contour.pop(); // The final corner arc lands back on starts[0].

        return contour.map(toScene);
    }

    function productionContourScenePoints(monitor) {
        return buildProductionContour(
            productionCalibration[monitor],
            productionCalibration.cornerRadius,
            productionCalibration.edgeBulge
        );
    }

    function buildProductionContourCss(scenePoints) {
        // Convert the scene-percent contour into the element box plus the
        // local clip-path polygon, following the handoff's four-corner recipe.
        const xs = scenePoints.map((point) => point[0]);
        const ys = scenePoints.map((point) => point[1]);
        const left = Math.min(...xs);
        const top = Math.min(...ys);
        const width = Math.max(...xs) - left;
        const height = Math.max(...ys) - top;
        if (!width || !height) return null;
        const polygon = scenePoints
            .map(([x, y]) => `${roundMonitorCalibration(((x - left) / width) * 100)}% ${roundMonitorCalibration(((y - top) / height) * 100)}%`)
            .join(', ');
        return {
            box: {
                left: `${roundMonitorCalibration(left)}%`,
                top: `${roundMonitorCalibration(top)}%`,
                width: `${roundMonitorCalibration(width)}%`,
                height: `${roundMonitorCalibration(height)}%`
            },
            clipPath: `polygon(${polygon})`
        };
    }

    function updateProductionCalibrationView() {
        if (!productionCalibration) return;
        const cornerOrder = ['tl', 'tr', 'br', 'bl'];

        productionCalibrationHandles.forEach((handle) => {
            const point = productionCalibration[handle.dataset.productionCalibrationMonitor][handle.dataset.productionCalibrationCorner];
            handle.style.left = `${point[0]}%`;
            handle.style.top = `${point[1]}%`;
        });

        productionCalibrationQuads.forEach((polygon) => {
            const points = cornerOrder
                .map((corner) => productionCalibration[polygon.dataset.productionCalibrationQuad][corner].join(','))
                .join(' ');
            polygon.setAttribute('points', points);
        });

        productionCalibrationContours.forEach((polygon) => {
            const points = productionContourScenePoints(polygon.dataset.productionCalibrationContour)
                .map((point) => point.join(','))
                .join(' ');
            polygon.setAttribute('points', points);
        });

        productionCalibrationRadius.value = String(productionCalibration.cornerRadius);
        productionCalibrationBulge.value = String(productionCalibration.edgeBulge);
        productionCalibrationRadiusValue.textContent = productionCalibration.cornerRadius.toFixed(3);
        productionCalibrationBulgeValue.textContent = productionCalibration.edgeBulge.toFixed(3);
        productionCalibrationOutput.textContent = JSON.stringify(productionCalibration, null, 2);
    }

    function moveProductionCalibrationHandle(handle, clientX, clientY) {
        const sceneBounds = alchemyScene.getBoundingClientRect();
        if (!sceneBounds.width || !sceneBounds.height) return;
        const monitor = handle.dataset.productionCalibrationMonitor;
        const corner = handle.dataset.productionCalibrationCorner;
        const x = Math.min(100, Math.max(0, ((clientX - sceneBounds.left) / sceneBounds.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - sceneBounds.top) / sceneBounds.height) * 100));
        productionCalibration[monitor][corner] = [roundMonitorCalibration(x), roundMonitorCalibration(y)];
        updateProductionCalibrationView();
        saveProductionCalibration();
    }

    function initializeProductionCalibration() {
        if (new URLSearchParams(window.location.search).get('calibrate') !== 'production') return;
        if (!productionCalibrationLayer || !productionCalibrationOutput) return;

        const calibrationPointerIds = new WeakMap();
        productionCalibration = readProductionCalibration();
        productionCalibrationLayer.hidden = false;
        document.body.classList.add('bt-calibrating-production');
        updateProductionCalibrationView();

        productionCalibrationVisibilityToggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const monitor = toggle.dataset.productionCalibrationVisibility;
                const visible = toggle.getAttribute('aria-pressed') !== 'true';
                productionCalibrationLayer.classList.toggle(`is-${monitor}-hidden`, !visible);
                toggle.setAttribute('aria-pressed', String(visible));
                toggle.textContent = `${monitor === 'upper' ? 'Upper' : 'Lower'} guides: ${visible ? 'on' : 'off'}`;
            });
        });

        productionCalibrationScreens.addEventListener('click', () => {
            const visible = productionCalibrationScreens.getAttribute('aria-pressed') !== 'true';
            document.body.classList.toggle('bt-production-calibration-hide-screens', !visible);
            productionCalibrationScreens.setAttribute('aria-pressed', String(visible));
            productionCalibrationScreens.textContent = `Screen overlays: ${visible ? 'on' : 'off'}`;
        });

        [productionCalibrationRadius, productionCalibrationBulge].forEach((slider) => {
            slider.addEventListener('input', () => {
                const value = Number(slider.value);
                if (!Number.isFinite(value)) return;
                if (slider === productionCalibrationRadius) {
                    productionCalibration.cornerRadius = Math.min(0.35, Math.max(0, value));
                } else {
                    productionCalibration.edgeBulge = Math.min(0.08, Math.max(0, value));
                }
                updateProductionCalibrationView();
                saveProductionCalibration();
            });
        });

        productionCalibrationHandles.forEach((handle) => {
            handle.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                calibrationPointerIds.set(handle, event.pointerId);
                handle.setPointerCapture(event.pointerId);
                handle.classList.add('is-dragging');
                moveProductionCalibrationHandle(handle, event.clientX, event.clientY);
            });
            handle.addEventListener('pointermove', (event) => {
                if (calibrationPointerIds.get(handle) !== event.pointerId) return;
                event.preventDefault();
                moveProductionCalibrationHandle(handle, event.clientX, event.clientY);
            });
            const finishDrag = (event) => {
                if (calibrationPointerIds.get(handle) !== event.pointerId) return;
                calibrationPointerIds.delete(handle);
                handle.classList.remove('is-dragging');
                if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
                saveProductionCalibration();
            };
            handle.addEventListener('pointerup', finishDrag);
            handle.addEventListener('pointercancel', finishDrag);
            handle.addEventListener('keydown', (event) => {
                const offsets = {
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1]
                };
                if (!offsets[event.key]) return;
                event.preventDefault();
                const monitor = handle.dataset.productionCalibrationMonitor;
                const corner = handle.dataset.productionCalibrationCorner;
                const point = productionCalibration[monitor][corner];
                const step = event.shiftKey ? 0.1 : 0.25;
                productionCalibration[monitor][corner] = [
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[0] + offsets[event.key][0] * step))),
                    roundMonitorCalibration(Math.min(100, Math.max(0, point[1] + offsets[event.key][1] * step)))
                ];
                updateProductionCalibrationView();
                saveProductionCalibration();
            });
        });

        productionCalibrationCopy.addEventListener('click', async () => {
            const payload = JSON.stringify({
                ...JSON.parse(JSON.stringify(productionCalibration)),
                generated: {
                    upper: buildProductionContourCss(productionContourScenePoints('upper')),
                    lower: buildProductionContourCss(productionContourScenePoints('lower'))
                }
            }, null, 2);
            const originalLabel = productionCalibrationCopy.textContent;
            try {
                await navigator.clipboard.writeText(payload);
                productionCalibrationCopy.textContent = 'Copied — paste into chat';
            } catch (error) {
                productionCalibrationCopy.textContent = 'Select the JSON above';
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(productionCalibrationOutput);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            window.setTimeout(() => {
                productionCalibrationCopy.textContent = originalLabel;
            }, 2200);
        });

        productionCalibrationReset.addEventListener('click', () => {
            productionCalibration = cloneProductionCalibrationDefaults();
            updateProductionCalibrationView();
            saveProductionCalibration();
            productionCalibrationHandles[0].focus({ preventScroll: true });
        });
    }

    function setGameCaseState(state) {
        const roleStates = {
            loading: 'LINKING TRAILER',
            playing: 'TRAILER ROLLING',
            paused: 'TRAILER PAUSED',
            ended: 'TRAILER COMPLETE'
        };
        if (currentGameProject) gameRoleState.textContent = roleStates[state] || 'CASE LOADED';
        gameCaseHotspots.forEach((button) => {
            const isCurrent = currentGameProject && button.dataset.gameKey === currentGameProject.key;
            button.classList.remove('is-loading', 'is-playing', 'is-paused');
            button.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
            if (isCurrent && ['loading', 'playing', 'paused'].includes(state)) button.classList.add(`is-${state}`);
        });
    }

    function powerDownGameScreen() {
        gameTrailerScreen.classList.remove('is-playing', 'is-loading');
        gameTrailerScreen.classList.add('is-powering-off');
        gameScene.classList.remove('is-trailer-playing');
        window.setTimeout(() => gameTrailerScreen.classList.remove('is-loaded'), 140);
        window.setTimeout(() => gameTrailerScreen.classList.remove('is-powering-off'), 700);
    }

    function handleGamePlayerState(event) {
        if (!window.YT || !currentGameProject) return;
        const states = window.YT.PlayerState;
        window.clearTimeout(gameFallbackTimer);

        if (event.data === states.PLAYING) {
            disableYtCaptions(gamePlayer);
            gameTrailerScreen.classList.add('is-loaded', 'is-playing');
            gameTrailerScreen.classList.remove('is-loading', 'is-powering-off');
            gameScene.classList.add('is-trailer-playing');
            gamePlayFallback.hidden = true;
            setGameCaseState('playing');
            return;
        }

        if (event.data === states.PAUSED) {
            gameTrailerScreen.classList.remove('is-playing', 'is-loading');
            gameScene.classList.remove('is-trailer-playing');
            gamePlayFallback.hidden = true;
            setGameCaseState('paused');
            return;
        }

        if (event.data === states.ENDED) {
            setGameCaseState('ended');
            powerDownGameScreen();
            showStatus(`${currentGameProject.title} clicks to a stop. Choose another case or replay it.`, 4000);
            return;
        }

        if (event.data === states.BUFFERING) {
            gameTrailerScreen.classList.add('is-loaded', 'is-loading');
            setGameCaseState('loading');
        }
    }

    function primeGamePlayer(project) {
        if (gamePlayer) return Promise.resolve(gamePlayer);
        if (gamePlayerPromise) return gamePlayerPromise;

        gamePlayerPromise = loadYouTubeApi().then((api) => new Promise((resolve) => {
            gameIframe.src =
                `https://www.youtube.com/embed/${project.yt}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1` +
                `&origin=${encodeURIComponent(window.location.origin)}`;
            const player = new api.Player(gameIframe, {
                events: {
                    onReady: () => {
                        gamePlayer = player;
                        loadedGameKey = project.key;
                        disableYtCaptions(player);
                        resolve(player);
                    },
                    onStateChange: handleGamePlayerState
                }
            });
        })).catch((error) => {
            gamePlayerPromise = null;
            throw error;
        });

        return gamePlayerPromise;
    }

    async function cueGameTrailer(gameKey) {
        const project = GAME_PROJECTS.find((item) => item.key === gameKey);
        if (!project) return;
        const restartCurrent = currentGameProject && currentGameProject.key === project.key;

        stopMocapGif();
        updateGameRole(project);
        setGameCaseState('loading');
        gamePlayFallback.hidden = true;
        gameTrailerScreen.classList.remove('is-powering-off');
        gameTrailerScreen.classList.add('is-loading');
        showStatus(`Loading the official ${project.title} trailer…`, 3200);

        try {
            const player = await primeGamePlayer(project);
            if (loadedGameKey !== project.key) {
                player.loadVideoById(project.yt);
                loadedGameKey = project.key;
            } else {
                if (restartCurrent) player.seekTo(0, true);
                player.playVideo();
            }
            gameTrailerScreen.classList.add('is-loaded');

            window.clearTimeout(gameFallbackTimer);
            gameFallbackTimer = window.setTimeout(() => {
                if (!window.YT || !gamePlayer) return;
                const state = gamePlayer.getPlayerState();
                if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
                    gamePlayFallback.hidden = false;
                }
            }, 1700);
        } catch (error) {
            gameTrailerScreen.classList.add('is-loaded');
            gamePlayFallback.hidden = false;
            showStatus('The browser wants one more press directly on the monitor.', 4200);
        } finally {
            window.setTimeout(() => gameTrailerScreen.classList.remove('is-loading'), 720);
        }
    }

    function retryGamePlayback() {
        if (!currentGameProject) return;
        if (!gamePlayer || typeof gamePlayer.playVideo !== 'function') {
            cueGameTrailer(currentGameProject.key);
            return;
        }
        gamePlayer.playVideo();
        gamePlayFallback.hidden = true;
    }

    function chooseMocapGif() {
        let index = Math.floor(Math.random() * MOCAP_GIFS.length);
        if (MOCAP_GIFS.length > 1 && index === lastMocapGifIndex) {
            index = (index + 1 + Math.floor(Math.random() * (MOCAP_GIFS.length - 1))) % MOCAP_GIFS.length;
        }
        lastMocapGifIndex = index;
        return MOCAP_GIFS[index];
    }

    function stopMocapGif() {
        window.clearTimeout(mocapPlaybackTimer);
        mocapPlaybackTimer = 0;
        const wasActive = gameTrailerScreen.classList.contains('is-mocap');
        gameTrailerScreen.classList.remove('is-mocap');
        if (wasActive) {
            gameTrailerScreen.classList.remove('is-loaded', 'is-playing');
            gameScene.classList.remove('is-trailer-playing');
        }
        if (!gameMocapGif) return;
        gameMocapGif.onload = null;
        gameMocapGif.hidden = true;
        gameMocapGif.removeAttribute('src');
        gameMocapGif.alt = '';
    }

    function finishMocapGif() {
        if (!gameTrailerScreen.classList.contains('is-mocap')) return;
        stopMocapGif();
        gameRoleState.textContent = 'FIELD TAPE COMPLETE';
        gameTrailerScreen.classList.add('is-powering-off');
        window.setTimeout(() => gameTrailerScreen.classList.remove('is-powering-off'), 700);
    }

    function cueMocapGif() {
        const clip = chooseMocapGif();
        window.clearTimeout(gameFallbackTimer);
        stopMocapGif();
        updateMocapRole();
        if (gamePlayer && typeof gamePlayer.pauseVideo === 'function') gamePlayer.pauseVideo();
        gamePlayFallback.hidden = true;
        gameMocapGif.alt = clip.label;
        gameMocapGif.onload = () => {
            if (!gameTrailerScreen.classList.contains('is-mocap')) return;
            if (gameMocapGif.getAttribute('src') !== clip.src) return;
            window.clearTimeout(mocapPlaybackTimer);
            mocapPlaybackTimer = window.setTimeout(finishMocapGif, clip.durationMs);
        };
        gameMocapGif.src = clip.src;
        gameMocapGif.hidden = false;
        gameTrailerScreen.classList.remove('is-loading', 'is-powering-off');
        gameTrailerScreen.classList.add('is-loaded', 'is-playing', 'is-mocap');
        gameScene.classList.add('is-trailer-playing');
        showStatus(`${clip.label}. Select the mocap suit again for another field tape.`, 4600);
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
                // Room art is lazy, so this <img> has not begun loading while its
                // room is hidden and decode() would never settle. Promote it first.
                if (alchemyArt.loading === 'lazy') alchemyArt.loading = 'eager';
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
        showStatus('The Sound Stage. The director’s chair controls the big screen.', 4200);
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

    async function enterGameRoom(options) {
        const settings = options || {};
        if (activeRoom === 'games' || gameRoomOpening) return;
        gameRoomOpening = true;
        if (!gameArt.complete || !gameArt.naturalWidth) {
            showStatus('Booting the development room…', 3200);
            try {
                // Room art is lazy, so this <img> has not begun loading while its
                // room is hidden and decode() would never settle. Promote it first.
                if (gameArt.loading === 'lazy') gameArt.loading = 'eager';
                await gameArt.decode();
            } catch (error) {
                // The image element will still show its normal fallback behavior.
            }
        }
        gameRoomOpening = false;
        if (infoDialog.open) closeDialog(infoDialog);
        radioAudio.pause();
        activeRoom = 'games';
        lobbyScroll.hidden = true;
        gameScroll.hidden = false;
        applyGameMonitorKeystones();
        mobileFloorplan.hidden = true;
        mobileRoomExit.hidden = false;
        document.body.classList.add('bt-room-games');
        gameScene.classList.remove('is-entering');
        void gameScene.offsetWidth;
        gameScene.classList.add('is-entering');
        gameScroll.scrollLeft = 0;
        primeGamePlayer(GAME_PROJECTS[0]).catch(() => {});

        if (settings.updateHistory !== false && window.location.hash !== '#game-development') {
            window.history.pushState({ btRoom: 'games' }, '', '#game-development');
        }
        showStatus('Game Development. Choose a case to load its role and official trailer.', 4600);
        window.setTimeout(() => gameCaseHotspots[0].focus({ preventScroll: true }), 380);
    }

    function leaveGameRoom(options) {
        const settings = options || {};
        if (activeRoom !== 'games') return;
        if (gameBinderDialog.open) closeDialog(gameBinderDialog);
        setInventoryDrawerOpen(false, false);
        activeRoom = 'lobby';
        window.clearTimeout(gameFallbackTimer);
        if (gamePlayer && typeof gamePlayer.pauseVideo === 'function') gamePlayer.pauseVideo();
        stopMocapGif();
        gamePlayFallback.hidden = true;
        gameTrailerScreen.classList.remove('is-loading', 'is-playing');
        gameScene.classList.remove('is-trailer-playing');
        if (currentGameProject) setGameCaseState('paused');
        gameScroll.hidden = true;
        lobbyScroll.hidden = false;
        mobileFloorplan.hidden = false;
        mobileRoomExit.hidden = true;
        document.body.classList.remove('bt-room-games');

        if (settings.updateHistory !== false) {
            if (window.history.state && window.history.state.btRoom === 'games') {
                window.history.back();
            } else {
                window.history.replaceState({ btRoom: 'lobby' }, '', `${window.location.pathname}${window.location.search}`);
            }
        }
        showStatus('Back in the lobby.', 2200);
        window.setTimeout(() => gameDoorHotspot.focus({ preventScroll: true }), 60);
    }

    async function enterContentRoom(options) {
        const settings = options || {};
        if (activeRoom === 'content' || contentRoomOpening) return;
        contentRoomOpening = true;
        if (!contentArt.complete || !contentArt.naturalWidth) {
            showStatus('Starting the conveyor line…', 3200);
            try {
                // Room art is lazy, so this <img> has not begun loading while its
                // room is hidden and decode() would never settle. Promote it first.
                if (contentArt.loading === 'lazy') contentArt.loading = 'eager';
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

    async function enterKnowledgeRoom(options) {
        const settings = options || {};
        if (activeRoom === 'knowledge' || knowledgeRoomOpening) return;
        knowledgeRoomOpening = true;
        if (!knowledgeArt.complete || !knowledgeArt.naturalWidth) {
            showStatus('Mapping the documentation labyrinth…', 3200);
            try {
                // Room art is lazy, so this <img> has not begun loading while its
                // room is hidden and decode() would never settle. Promote it first.
                if (knowledgeArt.loading === 'lazy') knowledgeArt.loading = 'eager';
                await knowledgeArt.decode();
            } catch (error) {
                // The image element will still show its normal fallback behavior.
            }
        }
        knowledgeRoomOpening = false;
        if (infoDialog.open) closeDialog(infoDialog);
        radioAudio.pause();
        activeRoom = 'knowledge';
        lobbyScroll.hidden = true;
        knowledgeScroll.hidden = false;
        mobileFloorplan.hidden = true;
        mobileRoomExit.hidden = false;
        document.body.classList.add('bt-room-knowledge');
        knowledgeScene.classList.remove('is-entering');
        void knowledgeScene.offsetWidth;
        knowledgeScene.classList.add('is-entering');
        knowledgeScroll.scrollLeft = 0;
        syncKnowledgeState();

        if (settings.updateHistory !== false && window.location.hash !== '#knowledge-maze') {
            window.history.pushState({ btRoom: 'knowledge' }, '', '#knowledge-maze');
        }
        showStatus(
            knowledgeBreached
                ? 'The Knowledge Maze. The path back to the present remains open.'
                : 'The Knowledge Maze. Three evidence stations can restore the terminal’s missing context.',
            4800
        );
        const focusTarget = knowledgeBreached
            ? knowledgePresentPortal
            : (knowledgeEvidenceHotspots.find((hotspot) => !knowledgeContext.has(hotspot.dataset.knowledgeKey)) || knowledgeAsk);
        window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 380);
    }

    function leaveKnowledgeRoom(options) {
        const settings = options || {};
        if (activeRoom !== 'knowledge') return;
        window.clearTimeout(knowledgeRuptureTimer);
        knowledgeTerminal.classList.remove('is-answering');
        knowledgeScene.classList.remove('is-rupturing');
        knowledgePresentVideo.pause();
        activeRoom = 'lobby';
        knowledgeScroll.hidden = true;
        lobbyScroll.hidden = false;
        mobileFloorplan.hidden = false;
        mobileRoomExit.hidden = true;
        document.body.classList.remove('bt-room-knowledge');

        if (settings.updateHistory !== false) {
            if (window.history.state && window.history.state.btRoom === 'knowledge') {
                window.history.back();
            } else {
                window.history.replaceState({ btRoom: 'lobby' }, '', `${window.location.pathname}${window.location.search}`);
            }
        }
        showStatus('Back in the lobby. The fracture remains.', 2400);
        window.setTimeout(() => knowledgeDoorHotspot.focus({ preventScroll: true }), 60);
    }

    function syncRoomFromLocation() {
        if (window.location.hash === '#absurd-alchemy') {
            if (activeRoom === 'games') leaveGameRoom({ updateHistory: false });
            if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
            if (activeRoom === 'knowledge') leaveKnowledgeRoom({ updateHistory: false });
            enterAlchemyRoom({ updateHistory: false });
            return;
        }
        if (window.location.hash === '#game-development') {
            if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
            if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
            if (activeRoom === 'knowledge') leaveKnowledgeRoom({ updateHistory: false });
            enterGameRoom({ updateHistory: false });
            return;
        }
        if (window.location.hash === '#content-factory') {
            if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
            if (activeRoom === 'games') leaveGameRoom({ updateHistory: false });
            if (activeRoom === 'knowledge') leaveKnowledgeRoom({ updateHistory: false });
            enterContentRoom({ updateHistory: false });
            return;
        }
        if (window.location.hash === '#knowledge-maze') {
            if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
            if (activeRoom === 'games') leaveGameRoom({ updateHistory: false });
            if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
            enterKnowledgeRoom({ updateHistory: false });
            return;
        }
        if (activeRoom === 'alchemy') leaveAlchemyRoom({ updateHistory: false });
        if (activeRoom === 'games') leaveGameRoom({ updateHistory: false });
        if (activeRoom === 'content') leaveContentRoom({ updateHistory: false });
        if (activeRoom === 'knowledge') leaveKnowledgeRoom({ updateHistory: false });
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

        infoSecondary.textContent = 'Back to the lobby';
        knowledgeDocumentViewer.hidden = true;
        infoRecovery.hidden = true;
        infoRecovery.replaceChildren();
        infoDialog.classList.remove('bt-knowledge-documents-dialog');

        infoKicker.textContent = panel.kicker || '';
        setInfoTitle(panel.title);
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
                if (route.id === 'games') {
                    window.setTimeout(() => enterGameRoom(), 30);
                    return;
                }
                if (route.id === 'content') {
                    window.setTimeout(() => enterContentRoom(), 30);
                    return;
                }
                if (route.id === 'docs') {
                    window.setTimeout(() => enterKnowledgeRoom(), 30);
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
                if (panel.button.action === 'broadcasts') openRadioArchive();
                if (panel.button.action === 'clippings') {
                    if (infoDialog.open) closeDialog(infoDialog);
                    openArchive('press');
                }
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

    function formatRadioTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
        const whole = Math.floor(seconds);
        const hours = Math.floor(whole / 3600);
        const minutes = Math.floor((whole % 3600) / 60);
        const secs = whole % 60;
        return hours
            ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
            : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function setRadioPlayState() {
        const playing = radioMode === 'episode' && !radioAudio.paused;
        radioPlay.setAttribute('aria-pressed', String(playing));
        radioPlay.setAttribute('aria-label', playing ? 'Pause episode' : 'Play episode');
        radioPlay.querySelector('span').textContent = playing ? '❚❚' : '▶';
        radioOscilloscopeFrame.classList.toggle('is-playing', playing);
    }

    function syncRadioProgress() {
        const duration = Number.isFinite(radioAudio.duration) ? radioAudio.duration : 0;
        const current = Number.isFinite(radioAudio.currentTime) ? radioAudio.currentTime : 0;
        const progress = duration ? current / duration : 0;
        radioSeek.value = String(Math.round(progress * 1000));
        radioSeek.style.setProperty('--bt-radio-progress', `${progress * 100}%`);
        radioTime.textContent = `${formatRadioTime(current)} / ${duration ? formatRadioTime(duration) : '--:--'}`;
    }

    function ensureRadioAnalyser() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!radioAudioContext) {
            radioAudioContext = new AudioContextClass();
            radioAnalyser = radioAudioContext.createAnalyser();
            radioAnalyser.fftSize = 2048;
            radioAnalyser.smoothingTimeConstant = 0.76;
            radioAudioSource = radioAudioContext.createMediaElementSource(radioAudio);
            radioAudioSource.connect(radioAnalyser);
            radioAnalyser.connect(radioAudioContext.destination);
            radioScopeData = new Uint8Array(radioAnalyser.fftSize);
        }
        if (radioAudioContext.state === 'suspended') radioAudioContext.resume().catch(() => {});
        return radioAnalyser;
    }

    function resizeRadioOscilloscope() {
        const rect = radioOscilloscope.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (radioOscilloscope.width !== width || radioOscilloscope.height !== height) {
            radioOscilloscope.width = width;
            radioOscilloscope.height = height;
        }
        return { width: rect.width, height: rect.height, dpr };
    }

    function drawRadioOscilloscope() {
        const ctx = radioOscilloscope.getContext('2d');
        const dimensions = resizeRadioOscilloscope();
        const { width, height, dpr } = dimensions;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const background = ctx.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, width * 0.72);
        background.addColorStop(0, 'rgba(8, 38, 38, 0.72)');
        background.addColorStop(1, 'rgba(1, 7, 10, 0.98)');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        const cellWidth = 46;
        const cellHeight = 26;
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(0, 247, 194, 0.105)';
        for (let x = centerX % cellWidth; x < width; x += cellWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = centerY % cellHeight; y < height; y += cellHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0, 247, 194, 0.22)';
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        const playing = radioMode === 'episode' && !radioAudio.paused && radioAnalyser;
        if (playing) radioAnalyser.getByteTimeDomainData(radioScopeData);
        const samples = playing ? radioScopeData.length : 512;
        const amplitude = Math.min(height * 0.33, 82);
        const points = [];
        for (let index = 0; index < samples; index += 1) {
            const x = index / (samples - 1) * width;
            const normalized = playing
                ? (radioScopeData[index] - 128) / 128
                : (Math.sin((index / samples) * Math.PI * 8) * 0.006 + (Math.random() - 0.5) * 0.008);
            points.push([x, centerY + normalized * amplitude]);
        }

        const strokeTrace = (lineWidth, color, blur) => {
            ctx.save();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.shadowColor = '#00f7c2';
            ctx.shadowBlur = blur;
            ctx.beginPath();
            points.forEach(([x, y], index) => {
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.restore();
        };
        strokeTrace(5, 'rgba(0, 247, 194, 0.08)', 22);
        strokeTrace(2, 'rgba(0, 247, 194, 0.72)', 10);
        strokeTrace(0.75, 'rgba(224, 255, 239, 0.96)', 2);

        ctx.fillStyle = 'rgba(229, 189, 117, 0.68)';
        [0.25, 0.75].forEach((fraction) => {
            ctx.fillRect(width * fraction - 0.5, height - 9, 1, 4);
        });
        radioScopeAnimation = window.requestAnimationFrame(drawRadioOscilloscope);
    }

    function startRadioOscilloscope() {
        window.cancelAnimationFrame(radioScopeAnimation);
        radioScopeAnimation = window.requestAnimationFrame(drawRadioOscilloscope);
    }

    function stopRadioOscilloscope() {
        window.cancelAnimationFrame(radioScopeAnimation);
        radioScopeAnimation = 0;
    }

    function loadRadioEpisode(index, options) {
        const settings = options || {};
        currentRadioEpisode = (index + RADIO_EPISODES.length) % RADIO_EPISODES.length;
        const episode = RADIO_EPISODES[currentRadioEpisode];
        radioMode = 'episode';
        radioAudio.pause();
        radioAudio.src = episode.file;
        radioAudio.preload = 'metadata';
        radioAudio.load();
        radioEpisodeNumber.textContent = `TRANSMISSION ${String(currentRadioEpisode + 1).padStart(2, '0')} / ${String(RADIO_EPISODES.length).padStart(2, '0')}`;
        radioNowPlaying.textContent = episode.title;
        radioEpisodeDate.textContent = episode.date;
        radioPlaylist.querySelectorAll('[data-radio-episode]').forEach((button, buttonIndex) => {
            const active = buttonIndex === currentRadioEpisode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        syncRadioProgress();
        setRadioPlayState();
        if (settings.autoplay) playRadioEpisode();
    }

    function playRadioEpisode() {
        if (radioMode !== 'episode') loadRadioEpisode(currentRadioEpisode);
        if (!soundEnabled) {
            soundEnabled = true;
            localStorage.setItem('bt-sound-enabled', 'true');
        }
        tape25Audio.pause();
        ensureRadioAnalyser();
        radioAudio.volume = 0.92;
        radioAudio.play().catch(() => showStatus('The archive needs another click before it will play.'));
    }

    function toggleRadioEpisode() {
        if (radioAudio.paused || radioMode !== 'episode') playRadioEpisode();
        else radioAudio.pause();
    }

    function renderRadioPlaylist() {
        if (radioPlaylist.childElementCount) return;
        RADIO_EPISODES.forEach((episode, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt-radio-episode';
            button.dataset.radioEpisode = String(index);
            button.setAttribute('aria-pressed', 'false');

            const number = document.createElement('b');
            number.textContent = String(index + 1).padStart(2, '0');
            const copy = document.createElement('span');
            copy.className = 'bt-radio-episode-copy';
            const title = document.createElement('strong');
            title.textContent = episode.title;
            const date = document.createElement('small');
            date.textContent = episode.date;
            const duration = document.createElement('small');
            duration.textContent = episode.duration;
            copy.append(title, date);
            button.append(number, copy, duration);
            button.addEventListener('click', () => loadRadioEpisode(index, { autoplay: true }));
            radioPlaylist.appendChild(button);
        });
    }

    function openRadioArchive() {
        if (!boatCassetteIsInRadio()) {
            openPanel('radio');
            return;
        }
        if (infoDialog.open) closeDialog(infoDialog);
        renderRadioPlaylist();
        if (radioMode !== 'episode') loadRadioEpisode(currentRadioEpisode);
        openDialog(radioDialog);
        startRadioOscilloscope();
        window.setTimeout(() => radioPlay.focus({ preventScroll: true }), 80);
    }

    function tuneRadio() {
        animateLayer(radioHotspot, 'is-tuning', 680);
        if (!soundEnabled) {
            showStatus('Sound is off. The dial moves silently.');
            return;
        }
        radioMode = 'tuning';
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
            if (panelId === 'games') {
                animateLayer(button, 'is-activating', 680);
                if (prefersReducedMotion.matches) {
                    enterGameRoom();
                } else {
                    window.setTimeout(() => enterGameRoom(), 360);
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
            if (panelId === 'docs') {
                animateLayer(button, 'is-activating', 680);
                if (prefersReducedMotion.matches) {
                    enterKnowledgeRoom();
                } else {
                    window.setTimeout(() => enterKnowledgeRoom(), 360);
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
                window.setTimeout(
                    () => openArchive('alchemy', 'french-kitty-lineage'),
                    prefersReducedMotion.matches ? 0 : 220
                );
            }
        });
    });

    document.querySelectorAll('[data-content-archive]').forEach((button) => {
        button.addEventListener('click', () => openArchive('content', button.dataset.contentArchive));
    });

    gameCaseHotspots.forEach((button) => {
        button.addEventListener('click', () => cueGameTrailer(button.dataset.gameKey));
    });

    document.querySelectorAll('[data-game-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.gameAction;
            if (action === 'lobby') leaveGameRoom();
            if (action === 'binder') openGameBinder();
            if (action === 'mocap') cueMocapGif();
            if (action === 'collect-cassette') collectBoatCassette();
        });
    });

    document.querySelectorAll('[data-content-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.contentAction;
            if (action === 'lobby') leaveContentRoom();
            if (action === 'collect-quarter') collectContentQuarter();
            if (action === 'console') {
                openArchive('content', 'solars-retro-future');
            }
        });
    });

    knowledgeEvidenceHotspots.forEach((button) => {
        button.addEventListener('click', () => openKnowledgeExhibit(button.dataset.knowledgeKey));
    });

    document.querySelectorAll('[data-knowledge-action]').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.knowledgeAction === 'lobby') leaveKnowledgeRoom();
        });
    });

    knowledgeAsk.addEventListener('click', openKnowledgeBreach);

    productionScreens.forEach((screen, index) => {
        screen.addEventListener('click', () => triggerProductionGhost(index));
        screen.querySelector('video').addEventListener('ended', () => {
            if (screen.classList.contains('is-active')) deactivateProductionScreen(screen, true);
        });
    });

    alchemyPlayFallback.addEventListener('click', retryAlchemyPlayback);
    alchemyTapToggle.addEventListener('click', toggleAlchemyPlayback);
    gamePlayFallback.addEventListener('click', retryGamePlayback);

    document.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'bell') ringBell();
            if (action === 'radio') {
                if (boatCassetteIsInRadio()) {
                    animateLayer(radioHotspot, 'is-tuning', 680);
                    if (prefersReducedMotion.matches) openRadioArchive();
                    else window.setTimeout(openRadioArchive, 260);
                    return;
                }
                if (boatCassetteIsInInventory() && inventoryCassetteSelected) {
                    insertBoatCassetteIntoRadio();
                    return;
                }
                if (boatCassetteIsInInventory()) {
                    showStatus('The radio is waiting for The Boat cassette. Drag it from inventory, or select it and activate the radio.', 5200);
                    return;
                }
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
                    showStatus('The guest book is waiting, but there is nothing to write with. Maybe one of these rooms has a spare pen.', 4800);
                    return;
                }
            }
        });
    });

    document.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => closeDialog(button.closest('dialog')));
    });

    [infoDialog, guestbookDialog, alchemyMenuDialog, archiveDialog, gameBinderDialog, radioDialog].forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog(dialog);
        });
    });

    // When a freshly recovered evidence dialog closes, punch its terminal row so the
    // "you did it" beat lands back in the room the moment the modal clears.
    infoDialog.addEventListener('close', () => {
        if (knowledgeFlashKey && activeRoom === 'knowledge') {
            const key = knowledgeFlashKey;
            window.setTimeout(() => {
                flashKnowledgeRow(key);
                revealKnowledgeFragment(key);
            }, prefersReducedMotion.matches ? 0 : 130);
        }
        knowledgeFlashKey = null;
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
    lobbyInventoryCassette.addEventListener('pointerdown', (event) => {
        if (!boatCassetteIsInInventory() || event.button !== 0 || event.pointerType === 'mouse') return;
        cassettePointerId = event.pointerId;
        cassettePointerStartX = event.clientX;
        cassettePointerStartY = event.clientY;
        cassettePointerLastX = event.clientX;
        cassettePointerLastY = event.clientY;
        cassetteDragStarted = false;
        if (lobbyInventoryCassette.setPointerCapture) lobbyInventoryCassette.setPointerCapture(event.pointerId);
    });
    lobbyInventoryCassette.addEventListener('pointermove', (event) => {
        if (event.pointerId !== cassettePointerId) return;
        cassettePointerLastX = event.clientX;
        cassettePointerLastY = event.clientY;
        const distance = Math.hypot(event.clientX - cassettePointerStartX, event.clientY - cassettePointerStartY);
        if (!cassetteDragStarted && distance > 6) {
            cassetteDragStarted = true;
            setInventoryCassetteSelected(true);
            inventoryCassetteDragGhost.hidden = false;
        }
        if (cassetteDragStarted) {
            event.preventDefault();
            moveCassetteDragGhost(event.clientX, event.clientY);
        }
    });
    lobbyInventoryCassette.addEventListener('pointerup', (event) => finishCassetteDrag(event, false));
    lobbyInventoryCassette.addEventListener('pointercancel', (event) => finishCassetteDrag(event, true));
    lobbyInventoryCassette.addEventListener('dragstart', (event) => {
        if (!boatCassetteIsInInventory()) {
            event.preventDefault();
            return;
        }
        setInventoryCassetteSelected(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'the-boat-cassette');
    });
    lobbyInventoryCassette.addEventListener('dragend', () => {
        radioHotspot.classList.remove('is-drop-over');
    });
    radioHotspot.addEventListener('dragover', (event) => {
        if (!boatCassetteIsInInventory()) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        radioHotspot.classList.add('is-drop-over');
    });
    radioHotspot.addEventListener('dragleave', (event) => {
        if (!radioHotspot.contains(event.relatedTarget)) {
            radioHotspot.classList.remove('is-drop-over');
        }
    });
    radioHotspot.addEventListener('drop', (event) => {
        if (!boatCassetteIsInInventory()) return;
        event.preventDefault();
        radioHotspot.classList.remove('is-drop-over');
        insertBoatCassetteIntoRadio();
    });
    lobbyInventoryCassette.addEventListener('click', (event) => {
        if (suppressCassetteClick) {
            event.preventDefault();
            return;
        }
        setInventoryCassetteSelected(!inventoryCassetteSelected);
    });

    radioPlay.addEventListener('click', toggleRadioEpisode);
    radioPrev.addEventListener('click', () => loadRadioEpisode(currentRadioEpisode - 1, { autoplay: true }));
    radioNext.addEventListener('click', () => loadRadioEpisode(currentRadioEpisode + 1, { autoplay: true }));
    radioOscilloscopeFrame.addEventListener('click', (event) => {
        if (event.target.closest('button, input')) return;
        toggleRadioEpisode();
    });
    radioSeek.addEventListener('input', () => {
        if (!Number.isFinite(radioAudio.duration) || radioAudio.duration <= 0) return;
        radioAudio.currentTime = Number(radioSeek.value) / 1000 * radioAudio.duration;
        syncRadioProgress();
    });
    radioAudio.addEventListener('loadedmetadata', syncRadioProgress);
    radioAudio.addEventListener('timeupdate', syncRadioProgress);
    radioAudio.addEventListener('play', setRadioPlayState);
    radioAudio.addEventListener('pause', setRadioPlayState);
    radioDialog.addEventListener('close', () => {
        radioAudio.pause();
        stopRadioOscilloscope();
    });

    mobileRoomExit.addEventListener('click', () => {
        if (activeRoom === 'alchemy') leaveAlchemyRoom();
        if (activeRoom === 'games') leaveGameRoom();
        if (activeRoom === 'content') leaveContentRoom();
        if (activeRoom === 'knowledge') leaveKnowledgeRoom();
    });

    radioAudio.addEventListener('ended', () => {
        if (radioMode === 'episode') {
            if (currentRadioEpisode < RADIO_EPISODES.length - 1) {
                loadRadioEpisode(currentRadioEpisode + 1, { autoplay: true });
            } else {
                setRadioPlayState();
                showStatus('End of the recovered transmission archive.', 3200);
            }
            return;
        }
        showStatus(boatCassetteIsInInventory()
            ? 'Only static. The Boat cassette in inventory looks like it fits the slot.'
            : 'Only static for now. Something on the Game Development desk might fit the cassette slot.');
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.clearTimeout(productionTimer);
            stopProductionScreens();
            knowledgePresentVideo.pause();
            if (activeRoom === 'games' && gamePlayer && typeof gamePlayer.pauseVideo === 'function') {
                gamePlayer.pauseVideo();
            }
        } else if (activeRoom === 'alchemy') {
            scheduleProductionGhost(2400);
        } else if (activeRoom === 'knowledge' && knowledgeBreached && !prefersReducedMotion.matches) {
            knowledgePresentVideo.play().catch(() => {});
        }
    });

    /* Room art is deferred — the room images carry loading="lazy" and are no longer
       preloaded, so the lobby paints on its own budget instead of queueing behind
       ~4MB of art for doors the visitor may never open. Once the lobby has finished
       loading and the main thread goes idle, we quietly warm those same URLs at low
       priority so opening a door still feels instant. The list is read from the DOM
       rather than hard-coded, so it stays correct as rooms gain or lose art. */
    function warmRoomArt() {
        const connection = navigator.connection;
        if (connection && (connection.saveData
            || /(^|-)(slow-)?2g$/.test(connection.effectiveType || ''))) {
            return;
        }

        const sources = Array.from(
            document.querySelectorAll('.bt-lobby-scroll[hidden] img[src]')
        ).map((img) => img.getAttribute('src'));
        const queue = Array.from(new Set(sources));
        if (!queue.length) return;

        const BATCH = 3;
        let index = 0;

        function warmBatch() {
            for (let i = 0; i < BATCH && index < queue.length; i += 1) {
                const img = new Image();
                img.decoding = 'async';
                img.fetchPriority = 'low';
                img.src = queue[index];
                index += 1;
            }
            if (index < queue.length) schedule();
        }

        function schedule() {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(warmBatch, { timeout: 2500 });
            } else {
                window.setTimeout(warmBatch, 250);
            }
        }

        if (document.readyState === 'complete') {
            schedule();
        } else {
            window.addEventListener('load', schedule, { once: true });
        }
    }

    window.addEventListener('popstate', syncRoomFromLocation);
    const savedInventory = readInventory();
    hasAlchemyPen = savedInventory.alchemyPen === true;
    alchemyPenLocation = hasAlchemyPen && savedInventory.alchemyPenLocation === 'guestbook' ? 'guestbook' : (hasAlchemyPen ? 'inventory' : 'room');
    hasContentQuarter = savedInventory.contentQuarter === true;
    contentQuarterLocation = hasContentQuarter && savedInventory.contentQuarterLocation === 'newsstand'
        ? 'newsstand'
        : (hasContentQuarter ? 'inventory' : 'room');
    hasBoatCassette = savedInventory.boatCassette === true;
    boatCassetteLocation = hasBoatCassette && savedInventory.boatCassetteLocation === 'radio'
        ? 'radio'
        : (hasBoatCassette ? 'inventory' : 'room');
    const savedKnowledge = readKnowledgeState();
    knowledgeContext = new Set(savedKnowledge.context);
    knowledgeBreached = savedKnowledge.breached;
    syncPenInventory();
    syncQuarterInventory();
    syncBoatCassetteInventory();
    syncKnowledgeState();
    renderAlchemyPlaylist();
    initializeGameMonitorKeystones();
    initializeMonitorCalibration();
    initializeKnowledgeDocumentKeystones();
    initializeDocumentCalibration();
    initializeProductionCalibration();
    syncRoomFromLocation();
    warmRoomArt();
}());
