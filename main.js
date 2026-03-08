/** Main JavaScript for charleswilke.com index page */

// Pre-computed SVG fallback placeholder (used when article images fail to load)
const FALLBACK_SVG_B64 = btoa('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2c4f7c;stop-opacity:1" /><stop offset="100%" style="stop-color:#1a1550;stop-opacity:1" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="800" height="400" fill="url(#grad)"/><g fill="#00f7c2" filter="url(#glow)"><path d="M100,200 L200,100 L300,200 L400,100 L500,200 L600,100 L700,200" stroke="#00f7c2" stroke-width="4" fill="none"/><circle cx="400" cy="200" r="50"/><text x="400" y="200" font-family="monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">l.ai.bor</text></g></svg>');
const FALLBACK_SVG = 'data:image/svg+xml;base64,' + FALLBACK_SVG_B64;
const TOTAL_RSS_ITEMS = 19; // 1 spotlight + 18 grid cards for an even 2-column ending

// Function to properly decode all HTML entities
function decodeHtmlEntities(text) {
    if (!text) return '';
    // Create a temporary DOM element to decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
}

// Centralized DOM-ready queue to avoid many independent DOMContentLoaded listeners.
const readyCallbacks = [];
function onReady(callback) {
    readyCallbacks.push(callback);
}
document.addEventListener('DOMContentLoaded', () => {
    readyCallbacks.forEach(callback => callback());
});

function scheduleIdleWork(callback, timeout = 2000) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout });
        return;
    }
    window.setTimeout(callback, Math.min(timeout, 250));
}

function createLazyInitializer(initializer) {
    let initialized = false;
    let instance;
    return function ensureInitialized() {
        if (!initialized) {
            initialized = true;
            instance = initializer();
        }
        return instance;
    };
}

const managedAudioPlayers = new Set();

function registerManagedAudio(audio) {
    if (audio) {
        managedAudioPlayers.add(audio);
    }
    return audio;
}

function pauseManagedAudioExcept(currentAudio) {
    managedAudioPlayers.forEach(audio => {
        if (audio !== currentAudio) {
            audio.pause();
        }
    });
}

function seekAudioToClientX(audio, rect, clientX) {
    if (!audio || !rect || !rect.width || !audio.duration) return false;
    const clickX = clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickPercent * audio.duration;
    if (isNaN(newTime) || newTime < 0) return false;
    audio.currentTime = newTime;
    return true;
}

function setupProgressScrubbing(progressContainer, audio) {
    if (!progressContainer || !audio) return;

    progressContainer.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const rect = progressContainer.getBoundingClientRect();
        if (!audio.duration) return;

        const wasPlaying = !audio.paused;
        if (wasPlaying) {
            audio.pause();
        }

        if (seekAudioToClientX(audio, rect, e.clientX) && wasPlaying) {
            setTimeout(() => {
                audio.play().catch(err => console.error('Failed to resume playback:', err));
            }, 50);
        }
    });

    progressContainer.addEventListener('mousedown', function(e) {
        e.preventDefault();

        const rect = progressContainer.getBoundingClientRect();
        const wasPlaying = !audio.paused;
        let isDragging = true;

        if (wasPlaying) {
            audio.pause();
        }

        const scrub = function(event) {
            if (audio.duration) {
                seekAudioToClientX(audio, rect, event.clientX);
            }
        };

        scrub(e);

        const handleMouseMove = function(event) {
            if (isDragging) {
                scrub(event);
            }
        };

        const handleMouseUp = function() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (wasPlaying) {
                setTimeout(() => {
                    audio.play().catch(err => console.error('Failed to resume playback after drag:', err));
                }, 50);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

const effectTimerIds = new Set();

function scheduleEffectTimeout(callback, delay) {
    const timerId = window.setTimeout(() => {
        effectTimerIds.delete(timerId);
        if (document.hidden) {
            scheduleEffectTimeout(callback, 1000);
            return;
        }
        callback();
    }, delay);

    effectTimerIds.add(timerId);
    return timerId;
}

function extractFeedImage(item) {
    if (!item) return FALLBACK_SVG;
    if (item.thumbnail) return item.thumbnail;

    const markup = item.content || item.description || '';
    const imgMatch = markup.match(/<img[^>]+src="([^">]+)"/i);
    return imgMatch ? imgMatch[1] : FALLBACK_SVG;
}

function createFeedExcerpt(item) {
    const description = decodeHtmlEntities(item && item.description ? item.description : '')
        .replace(/<[^>]*>/g, '')
        .trim();

    return {
        cleanDescription: description,
        shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : '')
    };
}

function normalizeFeedItems(items) {
    return sortItemsByNewest(items).slice(0, TOTAL_RSS_ITEMS).map(item => {
        const excerpt = createFeedExcerpt(item);
        return {
            ...item,
            displayImage: extractFeedImage(item),
            cleanDescription: excerpt.cleanDescription,
            shortDescription: excerpt.shortDescription
        };
    });
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fade-in sections on scroll using IntersectionObserver (performant)
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            sectionObserver.unobserve(entry.target); // Stop observing once visible
        }
    });
}, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
document.querySelectorAll('section').forEach(section => sectionObserver.observe(section));

// RSS Feed functionality
let currentItems = 0;
let allItems = [];
let isLoading = false;
const ITEMS_PER_PAGE = 12;
let isArchiveMode = false;
const RSS_CACHE_KEY = 'charleswilke:rss-feed:v3';
const RSS_CACHE_TTL_MS = 30 * 60 * 1000;
let rssIntersectionObserver = null;

function sortItemsByNewest(items) {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
        const aTime = a && a.pubDate ? Date.parse(a.pubDate) : 0;
        const bTime = b && b.pubDate ? Date.parse(b.pubDate) : 0;
        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });
}

function readCachedFeedItems() {
    try {
        const cached = sessionStorage.getItem(RSS_CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (!parsed || !Array.isArray(parsed.items) || !parsed.timestamp || !parsed.version) {
            return null;
        }

        if (parsed.version !== 3) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if ((Date.now() - parsed.timestamp) > RSS_CACHE_TTL_MS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if (parsed.limit !== TOTAL_RSS_ITEMS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        if (parsed.items.length > TOTAL_RSS_ITEMS) {
            sessionStorage.removeItem(RSS_CACHE_KEY);
            return null;
        }

        return parsed;
    } catch (error) {
        return null;
    }
}

function writeCachedFeedItems(items, source = 'unknown') {
    try {
        sessionStorage.setItem(RSS_CACHE_KEY, JSON.stringify({
            version: 3,
            timestamp: Date.now(),
            limit: TOTAL_RSS_ITEMS,
            source,
            items
        }));
    } catch (error) {
        // Ignore storage failures (private mode, quota, etc.)
    }
}

function logFeedAttempt(stage, details = {}) {
    console.log(`[RSS] ${stage}`, details);
}

function renderFeedItems(items, feedContent) {
    allItems = normalizeFeedItems(items);
    currentItems = 0;
    isArchiveMode = false;

    if (feedContent) {
        feedContent.innerHTML = '';
    }

    populateLatestArticleSpotlight();
    displayItems(ITEMS_PER_PAGE);
}

async function fetchRSSFeed() {
    if (isLoading) return;
    isLoading = true;
    
    // Show loading indicator immediately
    const feedContent = document.getElementById('feed-content');
    if (feedContent) {
        feedContent.innerHTML = '<div class="feed-item loading-placeholder"><h3>Loading latest articles...</h3></div>';
    }
    
    let success = false;

    const cachedFeed = readCachedFeedItems();
    if (cachedFeed && cachedFeed.items.length > 0) {
        logFeedAttempt('session-cache-hit', {
            itemCount: cachedFeed.items.length,
            source: cachedFeed.source
        });
        renderFeedItems(cachedFeed.items, feedContent);
        isLoading = false;
        return;
    }
    logFeedAttempt('session-cache-miss');
    
    try {
        // Primary endpoint: optimized PHP cache with high priority
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            try {
                logFeedAttempt('primary-fetch-start', { url: `substack_feed.php?limit=${TOTAL_RSS_ITEMS}` });
                const response = await fetch(`substack_feed.php?limit=${TOTAL_RSS_ITEMS}`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                logFeedAttempt('primary-fetch-response', {
                    ok: response.ok,
                    status: response.status,
                    contentType: response.headers.get('content-type')
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.status === 'ok' && data.items && data.items.length > 0) {
                        writeCachedFeedItems(data.items, 'primary');
                        renderFeedItems(data.items, feedContent);
                        logFeedAttempt('primary-fetch-success', { itemCount: allItems.length });
                        success = true;
                    } else {
                        console.warn('[RSS] Primary endpoint returned invalid data structure', {
                            status: data && data.status,
                            hasItemsArray: !!(data && data.items),
                            itemCount: data && Array.isArray(data.items) ? data.items.length : 0
                        });
                    }
                } else {
                    console.warn('[RSS] Primary endpoint returned non-OK response', {
                        status: response.status,
                        statusText: response.statusText
                    });
                }
            } catch(cacheErr) {
                console.warn('[RSS] Primary endpoint failed:', cacheErr);
            }
        }
        
        // Fallback: Direct RSS2JSON (only if cache failed)
        if (!success) {
            try {
                logFeedAttempt('rss2json-fallback-start');
                const fallbackUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + 
                    encodeURIComponent('https://charleswilke.substack.com/feed') + `&count=${TOTAL_RSS_ITEMS}`;
                
                const response = await fetch(fallbackUrl, {
                    cache: 'default',
                    headers: { 'Accept': 'application/json' }
                });
                logFeedAttempt('rss2json-fallback-response', {
                    ok: response.ok,
                    status: response.status
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.status === 'ok' && data.items && data.items.length > 0) {
                        writeCachedFeedItems(data.items, 'rss2json');
                        renderFeedItems(data.items, feedContent);
                        logFeedAttempt('rss2json-fallback-success', { itemCount: allItems.length });
                        success = true;
                    }
                }
            } catch(fallbackErr) {
                console.warn('[RSS] RSS2JSON fallback failed:', fallbackErr);
            }
        }
        
        // Last resort: XML parsing
        if (!success) {
            logFeedAttempt('xml-fallback-start');
            const xmlItems = await fetchRssXmlFallback();
            if (xmlItems && xmlItems.length > 0) {
                writeCachedFeedItems(xmlItems, 'xml');
                renderFeedItems(xmlItems, feedContent);
                logFeedAttempt('xml-fallback-success', { itemCount: allItems.length });
                success = true;
            }
        }
        
    } catch (error) {
        console.error('All RSS feed attempts failed:', error);
    }
    
    // Handle complete failure
    if (!success) {
        if (feedContent) {
            feedContent.innerHTML = `
                <div class="feed-item error-state">
                    <h3>Unable to load articles</h3>
                    <p>Please visit <a href="https://charleswilke.substack.com" target="_blank" rel="noopener noreferrer">exploring l.ai.bor</a> directly to read the latest posts.</p>
                </div>
            `;
        }
    }
    
    isLoading = false;
}

function populateLatestArticleSpotlight() {
    if (!allItems || allItems.length === 0) return;
    
    const latestItem = allItems[0]; // First item is the latest
    const spotlight = document.getElementById('latest-article-spotlight');
    const spotlightSection = spotlight.querySelector('.spotlight-production');
    const spotlightImg = spotlight.querySelector('.spotlight-featured-image');
    const spotlightTitle = spotlight.querySelector('.spotlight-title');
    const spotlightDescription = spotlight.querySelector('.spotlight-description');
    const spotlightDate = spotlight.querySelector('.spotlight-date');
    const spotlightTagsContainer = spotlight.querySelector('.spotlight-tags-container');
    const spotlightTags = spotlight.querySelector('.spotlight-tags');
    
    // Make the entire section clickable
    spotlight.style.cursor = 'pointer';
    spotlight.addEventListener('click', () => {
        window.open(latestItem.link, '_blank', 'noopener,noreferrer');
    });
    
    // Set the image and handle sizing
    spotlightImg.src = latestItem.displayImage || FALLBACK_SVG;
    spotlightImg.alt = latestItem.title;
    
    // Adjust card height based on image aspect ratio
    spotlightImg.onload = function() {
        const aspectRatio = this.naturalWidth / this.naturalHeight;
        // More generous height calculation to prevent cropping - increased range for taller card
        const baseHeight = Math.max(420, Math.min(580, 480 / aspectRatio));
        spotlightSection.style.height = baseHeight + 'px';
    };
    
    // Set the title
    spotlightTitle.textContent = latestItem.title;
    
    // Set the description (shorter for compact design)
    // First decode HTML entities properly, then strip HTML tags
    spotlightDescription.textContent = latestItem.shortDescription || '';
    
    // Set the date
    const pubDate = new Date(latestItem.pubDate);
    spotlightDate.textContent = pubDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Show the spotlight
    spotlight.style.display = 'block';
}

function displayItems(count) {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent || !allItems.length) return;

    // Index 0 is reserved for the spotlight card.
    const startIndex = currentItems + 1;
    const endIndex = Math.min(startIndex + count, allItems.length);
    if (startIndex >= endIndex) {
        isArchiveMode = true;
        updateDynamicButton();
        return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
        const item = allItems[i];
        const title = item.title;
        const link = item.link;
        const pubDate = new Date(item.pubDate);
        
        const feedItem = document.createElement('a');
        feedItem.className = 'feed-item';
        feedItem.href = link;
        feedItem.target = '_blank';
        feedItem.rel = 'noopener noreferrer';
        feedItem.innerHTML = `
            <img src="${item.displayImage || FALLBACK_SVG}" alt="${title}" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,${FALLBACK_SVG_B64}'">
            <h3>${title}</h3>
            <p>${item.shortDescription || ''}</p>
            <div class="date">${pubDate.toLocaleDateString()}</div>
        `;

        fragment.appendChild(feedItem);
    }

    feedContent.appendChild(fragment);
    currentItems += (endIndex - startIndex);
    isArchiveMode = currentItems >= (allItems.length - 1);
    updateDynamicButton();
}

// Function to update the dynamic button state
function updateDynamicButton() {
    const dynamicBtn = document.getElementById('dynamicButton');
    if (!dynamicBtn) return;

    if (currentItems < allItems.length - 1) {
        dynamicBtn.textContent = 'Load more';
        dynamicBtn.className = 'load-more-btn';
        dynamicBtn.onclick = () => displayItems(ITEMS_PER_PAGE);
        return;
    }

    dynamicBtn.textContent = 'Full Archive ->';
    dynamicBtn.className = 'archive-btn';
    dynamicBtn.onclick = () => {
        window.open('https://charleswilke.substack.com/archive?sort=new', '_blank', 'noopener,noreferrer');
    };
}

// Fallback: parse RSS XML manually (via AllOrigins proxy) if rss2json fails
async function fetchRssXmlFallback() {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://charleswilke.substack.com/feed');
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('AllOrigins error ' + res.status);
    const json = await res.json();
    const xmlString = json.contents;
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).map(node => {
        const get = sel => (node.querySelector(sel) ? node.querySelector(sel).textContent : '');
        const title = get('title');
        const link = get('link');
        const descriptionHtml = get('description');
        const contentEncoded = get('content\\:encoded');
        const description = contentEncoded || descriptionHtml || '';
        const pubDate = get('pubDate');
        // Try to find first image URL in content/description
        let thumbnail = '';
        const imgMatch = description.match(/<img[^>]+src=\"([^\">]+)\"/i);
        if (imgMatch) thumbnail = imgMatch[1];
        
        // Extract categories from RSS
        const categories = [];
        const categoryNodes = node.querySelectorAll('category');
        categoryNodes.forEach(catNode => {
            if (catNode.textContent.trim()) {
                categories.push(catNode.textContent.trim());
            }
        });
        
        return { title, link, description, pubDate, thumbnail, content: description, categories };
    });
    return items;
}

// Skip RSS calls on localhost/file audits to avoid noisy fetch failures.
const shouldFetchRSS = !['localhost', '127.0.0.1'].includes(location.hostname) && location.protocol !== 'file:';

function initRSSFallbackFetch() {
    if (!shouldFetchRSS) return;
    const rssSection = document.querySelector('.rss-feed');
    if (!rssSection) return;

    const loadFeed = () => {
        if (rssIntersectionObserver) {
            rssIntersectionObserver.disconnect();
            rssIntersectionObserver = null;
        }

        if (!isLoading && allItems.length === 0) {
            fetchRSSFeed();
        }
    };

    rssIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
            loadFeed();
        }
    }, { rootMargin: '250px 0px' });

    rssIntersectionObserver.observe(rssSection);
    scheduleIdleWork(loadFeed, 4000);
}

// Time Dial Functionality
function initTimeDial() {
    const recapStations = [
        {
            angle: 40,
            date: 'Q3 2023',
            file: 'audio/q3-2023-substack-recap.mp3',
            label: 'Q3 \'23'
        },
        {
            angle: 80,
            date: 'Q4 2023',
            file: 'audio/q4-2023-substack-recap.mp3',
            label: 'Q4 \'23'
        },
        {
            angle: 120,
            date: 'H1 2024',
            file: 'audio/h1-2024-substack-recap.mp3',
            label: 'H1 \'24'
        },
        {
            angle: 160,
            date: 'H2 2024',
            file: 'audio/h2-2024-substack-recap.mp3',
            label: 'H2 \'24'
        },
        {
            angle: 200,
            date: 'Q3 2025',
            file: 'audio/aug-sept-substack-summary.mp3',
            label: 'Q3 \'25'
        },
        {
            angle: 240,
            date: 'October 2025',
            file: 'audio/oct-substack-recap.mp3',
            label: 'OCT \'25'
        },
        {
            angle: 280,
            date: 'November 2025',
            file: 'audio/nov-2025-substack-recap.mp3',
            label: 'NOV \'25'
        },
        {
            angle: 320,
            date: 'December 2025',
            file: 'audio/dec-2025-substack-recap.mp3',
            label: 'DEC \'25'
        },
        {
            angle: 0,
            date: 'January 2026',
            file: 'audio/jan-2026-substack-recap.mp3',
            label: 'JAN \'26'
        },
        {
            angle: 20,
            date: 'February 2026',
            file: 'audio/feb-2026-substack-recap.mp3',
            label: 'FEB \'26'
        }
    ];
    
    // Radio tuning sound effects
    const tuningSounds = [
        'audio/radio_tuning1.mp3',
        'audio/radio_tuning2.mp3',
        'audio/radio_tuning3.mp3',
        'audio/radio_tuning4.mp3',
        'audio/radio_tuning5.mp3',
        'audio/radio_tuning6.mp3',
        'audio/radio_tuning7.mp3',
        'audio/radio_tuning8.mp3',
        'audio/radio_tuning9.mp3'
    ];
    
    let currentStation = 9; // Start at station 9 (Feb '26)
    const stationLightsContainer = document.getElementById('station-lights');
    const stationLights = Array.from(document.querySelectorAll('.station-light'));
    const dateDisplay = document.getElementById('current-recap-date');
    const recapAudio = document.getElementById('recap-audio');
    const tunerGlass = document.querySelector('.tuner-glass');
    const tunerIndicator = document.getElementById('tuner-indicator');
    const scaleMarkers = Array.from(document.querySelectorAll('.scale-marker.scale-major'));
    const clickableMarkers = Array.from(document.querySelectorAll('.scale-marker.scale-clickable'));
    let scrollAccumulator = 0; // Accumulate scroll for stepping
    const SCROLL_THRESHOLD = 50; // Pixels of scroll needed to change station
    let tunerMarkerPositions = [];
    
    // Create audio element for tuning sounds
    const tuningAudio = new Audio();
    tuningAudio.volume = 0.4; // Set volume to 40% so it's not too loud

    function cacheTunerMarkerPositions() {
        if (!tunerGlass || !scaleMarkers.length) return;
        const tunerRect = tunerGlass.getBoundingClientRect();
        tunerMarkerPositions = scaleMarkers.map(marker => {
            const markerRect = marker.getBoundingClientRect();
            return markerRect.left - tunerRect.left + (markerRect.width / 2);
        });
    }
    
    function playRandomTuningSound() {
        const randomIndex = Math.floor(Math.random() * tuningSounds.length);
        tuningAudio.src = tuningSounds[randomIndex];
        tuningAudio.currentTime = 0;
        tuningAudio.play().catch(e => console.log('Tuning sound play prevented:', e));
    }
    
    function updateStation(stationIndex) {
        if (stationIndex === currentStation) return;
        
        const station = recapStations[stationIndex];
        const previousStation = currentStation;
        currentStation = stationIndex;
        
        // Play random tuning sound effect
        playRandomTuningSound();
        
        // ===== CRT VISUAL EFFECTS =====
        // 1. Add static noise during tuning
        if (tunerGlass) {
            tunerGlass.classList.add('tuning');
            setTimeout(() => tunerGlass.classList.remove('tuning'), 600);
        }
        
        // 2. Add tuning glow to indicator
        if (tunerIndicator) {
            tunerIndicator.classList.add('tuning');
            setTimeout(() => tunerIndicator.classList.remove('tuning'), 400);
        }
        
        // 3. Phosphor decay on previous marker
        if (scaleMarkers[previousStation]) {
            scaleMarkers[previousStation].classList.add('phosphor-decay');
            setTimeout(() => {
                scaleMarkers[previousStation].classList.remove('phosphor-decay');
            }, 1200);
        }
        
        // 4. Vacuum tube warmup + signal locking on new marker
        if (scaleMarkers[stationIndex]) {
            scaleMarkers[stationIndex].classList.add('warming-up', 'signal-locking');
            setTimeout(() => {
                scaleMarkers[stationIndex].classList.remove('warming-up', 'signal-locking');
            }, 600);
        }
        // ===== END CRT EFFECTS =====
        
        // Update station lights
        stationLights.forEach((light, i) => {
            light.classList.remove('active', 'nearby');
            if (i === stationIndex) {
                light.classList.add('active');
            } else if (Math.abs(i - stationIndex) === 1) {
                light.classList.add('nearby');
            }
        });
        
        // Update data attribute for label highlighting
        if (stationLightsContainer) {
            stationLightsContainer.setAttribute('data-current-station', stationIndex);
        }
        
        // Update tuner indicator position
        updateTunerIndicator(stationIndex);
        
        // Update date display with glitch effect
        dateDisplay.style.opacity = '0';
        dateDisplay.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            dateDisplay.textContent = station.date;
            dateDisplay.style.opacity = '1';
            dateDisplay.style.transform = 'translateY(0)';
        }, 150);
        
        // Pause current audio and switch source
        if (recapAudio) {
            const wasPlaying = !recapAudio.paused;
            recapAudio.pause();
            recapAudio.src = station.file;
            recapAudio.load();
            
            // If it was playing, resume after a brief moment
            if (wasPlaying) {
                setTimeout(() => {
                    recapAudio.play().catch(e => console.log('Autoplay prevented'));
                }, 200);
            }
        }
        
    }
    
    function updateTunerIndicator(stationIndex) {
        if (!tunerIndicator || !tunerGlass) return;
        
        // Remove active class from all markers (but don't remove phosphor-decay, that's handled separately)
        scaleMarkers.forEach(marker => marker.classList.remove('active'));

        if (!tunerMarkerPositions.length) {
            cacheTunerMarkerPositions();
        }

        const targetMarker = scaleMarkers[stationIndex];
        const leftPosition = tunerMarkerPositions[stationIndex];
        if (targetMarker && typeof leftPosition === 'number') {
            tunerIndicator.style.left = leftPosition + 'px';
            targetMarker.classList.add('active');
        }
    }
    
    function updateTunerIndicatorByAngle(angle) {
        const tunerIndicator = document.getElementById('tuner-indicator');
        const tunerGlass = document.querySelector('.tuner-glass');
        
        if (!tunerIndicator || !tunerGlass) return;
        
        // Map the knob angle to the tuner display (left to right)
        // Station angles: H1'24=45Â°, H2'24=135Â°, Q3'25=225Â°, Oct'25=315Â°
        // Tuner wraps around: 315Â°-360Â° and 0Â°-45Â° both map to the full scale
        
        const tunerWidth = tunerGlass.offsetWidth;
        const padding = 20;
        const availableWidth = tunerWidth - (2 * padding);
        
        // Normalize angle to 0-360 range
        let normalizedAngle = angle % 360;
        if (normalizedAngle < 0) normalizedAngle += 360;
        
        // Map angle to progress (0-1) across the tuner scale
        // The tuner shows a continuous range wrapping around the full 360Â°
        // We want the full tuner width to represent the full rotation
        let progress;
        
        if (normalizedAngle >= 45 && normalizedAngle <= 315) {
            // Main range: 45Â° to 315Â° maps to left-to-right across tuner
            progress = (normalizedAngle - 45) / 270;
        } else if (normalizedAngle > 315) {
            // Between 315Â° and 360Â°: wraps back toward left side
            // Map 315-360 (45Â° range) to continue past 1.0 and wrap to 0
            const degreesOver = normalizedAngle - 315;
            const wrapProgress = degreesOver / 90; // 90Â° total wrap zone (315-360 + 0-45)
            progress = 1 + (wrapProgress * 0.167); // Go slightly past 1.0, then wrap
            if (progress > 1.167) progress -= 1.167; // Wrap around
        } else {
            // Between 0Â° and 45Â°: continuation from the wrap
            const degreesIn = normalizedAngle;
            progress = (degreesIn / 90) * 0.167; // Maps 0-45Â° to start of scale
        }
        
        // Clamp progress between 0 and 1 to stay within tuner bounds
        progress = Math.max(0, Math.min(1, progress));
        
        const leftPosition = padding + (availableWidth * progress);
        tunerIndicator.style.left = leftPosition + 'px';
    }
    
    // Handle scroll/wheel events
    function handleScroll(e) {
        e.preventDefault();
        
        // Get scroll delta (normalize across browsers)
        const delta = e.deltaY || e.detail || -e.wheelDelta;
        
        // Accumulate scroll
        scrollAccumulator += delta;
        
        // Check if we've scrolled enough to change station
        if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
            const direction = scrollAccumulator > 0 ? 1 : -1; // Down = forward, Up = backward
            
            // Calculate new station (wrapping around)
            let newStation = currentStation + direction;
            if (newStation < 0) newStation = recapStations.length - 1;
            if (newStation >= recapStations.length) newStation = 0;
            
            // Update station
            updateStation(newStation);
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
            
            // Reset accumulator (keep remainder for smooth feel)
            scrollAccumulator = scrollAccumulator % SCROLL_THRESHOLD;
        }
    }
    
    // Set up station lights interactions
    if (stationLightsContainer) {
        // Scroll wheel events on the container
        stationLightsContainer.addEventListener('wheel', handleScroll, { passive: false });
        
        // Touch swipe support for mobile
        let touchStartY = 0;
        let touchAccumulator = 0;
        
        stationLightsContainer.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            touchAccumulator = 0;
        }, { passive: true });
        
        stationLightsContainer.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const touchY = e.touches[0].clientY;
            const delta = touchStartY - touchY;
            touchStartY = touchY;
            
            // Accumulate for station change
            touchAccumulator += delta;
            
            if (Math.abs(touchAccumulator) >= SCROLL_THRESHOLD) {
                const direction = touchAccumulator > 0 ? 1 : -1;
                let newStation = currentStation + direction;
                if (newStation < 0) newStation = recapStations.length - 1;
                if (newStation >= recapStations.length) newStation = 0;
                
                updateStation(newStation);
                
                if ('vibrate' in navigator) {
                    navigator.vibrate(15);
                }
                
                touchAccumulator = touchAccumulator % SCROLL_THRESHOLD;
            }
        }, { passive: false });
    }
    
    // Click on individual lights to go directly to that station
    stationLights.forEach(light => {
        light.addEventListener('click', function(e) {
            e.stopPropagation();
            const stationIndex = parseInt(this.getAttribute('data-station'));
            if (!isNaN(stationIndex) && stationIndex !== currentStation) {
                updateStation(stationIndex);
                
                if ('vibrate' in navigator) {
                    navigator.vibrate(20);
                }
            }
        });
    });
    
    // Initialize date display transition and current station
    dateDisplay.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    if (stationLightsContainer) {
        stationLightsContainer.setAttribute('data-current-station', '9');
    }

    cacheTunerMarkerPositions();
    window.addEventListener('resize', cacheTunerMarkerPositions);
    
    // Initialize station (date display, audio source, etc.)
    updateStation(9);
    
    // Initialize tuner indicator position
    setTimeout(() => {
        updateTunerIndicator(9);
    }, 100);
    
    // Add click handlers to clickable scale markers
    clickableMarkers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            const stationIndex = parseInt(this.getAttribute('data-station'));
            if (!isNaN(stationIndex) && stationIndex !== currentStation) {
                updateStation(stationIndex);

                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(20);
                }
            }
        });
        
        // Add hover effect for touch devices
        marker.addEventListener('touchstart', function() {
            this.style.transform = 'scale(1.05)';
        }, { passive: true });
        
        marker.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        }, { passive: true });
    });
}


// Lightbox functionality
let currentImageIndex = 0;
let currentImageSet = [];
const imageSets = {
    'jb': [
        'images/jb/jb1.png',
        'images/jb/jb2.png',
        'images/jb/jb3.png',
        'images/jb/jb4.png',
        'images/jb/jb5.png',
        'images/jb/jb6.png',
        'images/jb/jb7.png',
        'images/jb/jb8.png',
        'images/jb/jb9.png',
        'images/jb/jb10.png',
        'images/jb/jb11.png',
        'images/jb/jb12.png'
    ],
    'aiw': [
        'images/aiw/aiw1.png',
        'images/aiw/aiw2.png',
        'images/aiw/aiw3.png',
        'images/aiw/aiw4.png',
        'images/aiw/aiw5.png',
        'images/aiw/aiw6.png',
        'images/aiw/aiw7.png',
        'images/aiw/aiw8.png',
        'images/aiw/aiw9.png',
        'images/aiw/aiw10.png',
        'images/aiw/aiw11.png',
        'images/aiw/aiw12.png',
        'images/aiw/aiw13.png',
        'images/aiw/aiw14.png',
        'images/aiw/aiw15.png',
        'images/aiw/aiw16.png'
    ],
    'fv': ['images/fv1.jpg'],
    'dogs': ['images/doc_resist.png', 'images/astro-justhappy2behere.png']
};

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    
    // Determine which set the image belongs to
    let setKey = '';
    if (imageSrc.includes('jb/')) {
        setKey = 'jb';
    } else if (imageSrc.includes('aiw/')) {
        setKey = 'aiw';
    } else if (imageSrc.includes('doc_resist.png') || imageSrc.includes('astro-justhappy2behere.png')) {
        setKey = 'dogs';
    } else {
        setKey = 'fv';
    }
    
    currentImageSet = imageSets[setKey];
    currentImageIndex = currentImageSet.indexOf(imageSrc);
    
    lightboxImg.src = imageSrc;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function navigateLightbox(direction) {
    currentImageIndex = (currentImageIndex + direction + currentImageSet.length) % currentImageSet.length;
    const lightboxImg = document.querySelector('.lightbox-content img');
    lightboxImg.src = currentImageSet[currentImageIndex];
}

// Event listeners for lightbox
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.prev-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
});
document.querySelector('.next-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
});

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeLightbox();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

// Touch swipe functionality for mobile
let touchStartX = 0;
let touchEndX = 0;
const minSwipeDistance = 50; // Minimum distance for a swipe to register

document.querySelector('.lightbox-content').addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.querySelector('.lightbox-content').addEventListener('touchmove', (e) => {
    // Prevent default to stop page scrolling while swiping in lightbox
    if (document.getElementById('lightbox').style.display === 'flex') {
        e.preventDefault();
    }
}, { passive: false });

document.querySelector('.lightbox-content').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) >= minSwipeDistance) {
        // Negative distance means swipe left, positive means swipe right
        if (swipeDistance > 0) {
            // Swipe right - show previous image
            navigateLightbox(-1);
        } else {
            // Swipe left - show next image
            navigateLightbox(1);
        }
    }
}

// Testimonial Carousel
const carousel = document.querySelector('.testimonial-carousel');
const cards = Array.from(carousel.children);
const dots = Array.from(document.querySelectorAll('.dot'));
let currentIndex = 0;
let isAutoRotating = true;
let autoRotateInterval;

function updateCarousel(newIndex) {
    const currentCard = cards[currentIndex];
    const nextCard = cards[newIndex];
    
    // Remove active class and add leaving class to current card
    currentCard.classList.remove('active');
    currentCard.classList.add('leaving');
    
    // After the out animation, hide the card and remove leaving class
    setTimeout(() => {
        currentCard.style.visibility = 'hidden';
        currentCard.classList.remove('leaving');
    }, 500);
    
    // Show and activate the next card
    nextCard.style.visibility = 'visible';
    nextCard.classList.add('active');
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === newIndex);
    });
    
    currentIndex = newIndex;
}

function rotateCards() {
    const nextIndex = (currentIndex + 1) % cards.length;
    updateCarousel(nextIndex);
}

function startAutoRotate() {
    if (isAutoRotating) {
        autoRotateInterval = setInterval(rotateCards, 45000);
    }
}

function stopAutoRotate() {
    clearInterval(autoRotateInterval);
}

// Initialize carousel
cards.forEach((card, index) => {
    if (index === 0) {
        card.classList.add('active');
        card.style.visibility = 'visible';
    } else {
        card.style.visibility = 'hidden';
    }
});
startAutoRotate();

// Event listeners for dots
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        updateCarousel(index);
        stopAutoRotate();
        startAutoRotate();
    });
});

// Button is now initialized by updateDynamicButton() after feed loads

// Pause on hover
carousel.addEventListener('mouseenter', () => {
    isAutoRotating = false;
    stopAutoRotate();
});

carousel.addEventListener('mouseleave', () => {
    isAutoRotating = true;
    startAutoRotate();
});

// Testimonial Carousel Swipe Functionality
let testimonialTouchStartX = 0;
let testimonialTouchStartY = 0;
let testimonialTouchEndX = 0;
let testimonialTouchEndY = 0;
const testimonialMinSwipeDistance = 50;

carousel.addEventListener('touchstart', (e) => {
    testimonialTouchStartX = e.touches[0].clientX;
    testimonialTouchStartY = e.touches[0].pageY;
    // Pause auto-rotation while touching
    stopAutoRotate();
}, { passive: true });

carousel.addEventListener('touchmove', (e) => {
    if (!testimonialTouchStartX || !testimonialTouchStartY) {
        return;
    }

    let touchMoveX = e.touches[0].clientX;
    let touchMoveY = e.touches[0].pageY;

    // Calculate the horizontal and vertical differences
    let deltaX = testimonialTouchStartX - touchMoveX;
    let deltaY = testimonialTouchStartY - touchMoveY;

    // If horizontal scrolling is greater than vertical scrolling
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Prevent default only for horizontal swipes
        e.preventDefault();
    }
}, { passive: false });

carousel.addEventListener('touchend', (e) => {
    testimonialTouchEndX = e.changedTouches[0].clientX;
    testimonialTouchEndY = e.changedTouches[0].pageY;
    handleTestimonialSwipe();
    // Reset touch coordinates
    testimonialTouchStartX = 0;
    testimonialTouchStartY = 0;
    // Resume auto-rotation after touch
    startAutoRotate();
}, { passive: true });

function handleTestimonialSwipe() {
    const swipeDistance = testimonialTouchEndX - testimonialTouchStartX;
    const verticalDistance = Math.abs(testimonialTouchEndY - testimonialTouchStartY);
    
    // Only handle horizontal swipes where the horizontal movement is greater than vertical
    if (Math.abs(swipeDistance) >= testimonialMinSwipeDistance && 
        Math.abs(swipeDistance) > verticalDistance) {
        if (swipeDistance > 0) {
            // Swipe right - show previous testimonial
            const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel(prevIndex);
        } else {
            // Swipe left - show next testimonial
            const nextIndex = (currentIndex + 1) % cards.length;
            updateCarousel(nextIndex);
        }
    }
}

function triggerGlitch(header) {
    if (!header) return;
    
    // Randomly select glitch intensity
    const intensity = Math.random();
    const glitchClasses = ['glitch'];
    
    // 40% chance for extra scanlines effect
    if (intensity > 0.6) {
        glitchClasses.push('glitch-scanlines');
    }
    
    // 25% chance for horizontal bar glitch (more dramatic)
    if (intensity > 0.75) {
        glitchClasses.push('glitch-bars');
    }
    
    // Apply all selected effects
    glitchClasses.forEach(cls => header.classList.add(cls));
    
    // Variable duration based on intensity (longer for more intense glitches)
    const duration = intensity > 0.75 ? 400 + Math.random() * 200 : 250 + Math.random() * 150;
    
    setTimeout(() => {
        // Remove all glitch classes
        header.classList.remove('glitch', 'glitch-scanlines', 'glitch-bars', 'glitch-static');
        
        // Variable interval - occasional "bad signal" with rapid repeated glitches
        const isBadSignal = Math.random() > 0.85;
        if (isBadSignal) {
            // Rapid double/triple glitch
            setTimeout(() => {
                header.classList.add('glitch');
                setTimeout(() => {
                    header.classList.remove('glitch');
                    if (Math.random() > 0.5) {
                        setTimeout(() => {
                            header.classList.add('glitch', 'glitch-bars');
                            setTimeout(() => {
                                header.classList.remove('glitch', 'glitch-bars');
                                    scheduleEffectTimeout(() => triggerGlitch(header), 3000 + Math.random() * 4000);
                            }, 150);
                        }, 80 + Math.random() * 50);
                    } else {
                            scheduleEffectTimeout(() => triggerGlitch(header), 3000 + Math.random() * 4000);
                    }
                }, 120 + Math.random() * 80);
            }, 100 + Math.random() * 100);
        } else {
            scheduleEffectTimeout(() => triggerGlitch(header), 2500 + Math.random() * 5000);
        }
    }, duration);
}
function initHeaderGlitchEffects() {
    const header = document.querySelector('.header-title');
    if (!header) return;
    scheduleEffectTimeout(() => triggerGlitch(header), 1500 + Math.random() * 2000);
}

// Timed glitch effect for the FAQ link
function triggerGlitchFAQ(faqLink) {
    if (!faqLink) return;
    faqLink.classList.add('glitch-link', 'glitch');
    setTimeout(() => {
        faqLink.classList.remove('glitch-link', 'glitch');
        scheduleEffectTimeout(() => triggerGlitchFAQ(faqLink), 20000 + Math.random() * 5000); // 20-25s
    }, 120 + Math.random() * 180); // short burst
}
function initFaqGlitchTimer() {
    const faqLink = document.querySelector('.faq-glitch-link');
    if (!faqLink) return;
    scheduleEffectTimeout(() => triggerGlitchFAQ(faqLink), 4000 + Math.random() * 2000); // initial delay
}
// Glitch effect for the email link (hover/focus only)
function initEmailGlitchEffects() {
    const emailLink = document.querySelector('.email-glitch-link');
    if (!emailLink) return;
    emailLink.addEventListener('mouseenter', () => {
        emailLink.classList.add('glitch-link', 'glitch');
        setTimeout(() => emailLink.classList.remove('glitch-link', 'glitch'), 200 + Math.random() * 200);
    });
    emailLink.addEventListener('focus', () => {
        emailLink.classList.add('glitch-link', 'glitch');
        setTimeout(() => emailLink.classList.remove('glitch-link', 'glitch'), 200 + Math.random() * 200);
    });
}

function neonFlicker(letters) {
  if (!letters || !letters.length) return;
  letters.forEach(letter => letter.classList.remove('flicker'));
  // Pick one random letter to flicker
  const idx = Math.floor(Math.random() * letters.length);
  const letter = letters[idx];
  // Flicker sequence: on/off/on/off/on/off/on
  let flicks = 0;
  function doFlick() {
    letter.classList.toggle('flicker');
    flicks++;
    if (flicks < 7) {
      setTimeout(doFlick, 40 + Math.random() * 20); // 40-60ms per flick (twice as fast)
    } else {
      letter.classList.remove('flicker');
      scheduleEffectTimeout(() => neonFlicker(letters), 5000 + Math.random() * 1000); // 5-6s until next flicker
    }
  }
  doFlick();
}
function initNeonFlicker() {
  const letters = Array.from(document.querySelectorAll('.recently-bg-text span'));
  if (!letters.length) return;
  scheduleEffectTimeout(() => neonFlicker(letters), 2000); // initial delay
}

function triggerShimmer(shimmer) {
  if (!shimmer) return;
  shimmer.classList.add('shimmer');
  setTimeout(() => {
    shimmer.classList.remove('shimmer');
    scheduleEffectTimeout(() => triggerShimmer(shimmer), 4000 + Math.random() * 2000); // 4-6s between shimmers
  }, 1200); // match animation duration
}
function initShimmerEffect() {
  const shimmer = document.querySelector('.recently-bg-text');
  if (!shimmer) return;
  scheduleEffectTimeout(() => triggerShimmer(shimmer), 2000);
}

// Custom Audio Player Script
function initCustomAudioPlayers() {
  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // For each custom audio player on the page
  document.querySelectorAll('.custom-audio-player').forEach(function(player) {
    // Skip the mixtape player - it has its own dedicated handler
    if (player.classList.contains('mixtape-audio-controls')) return;
    
    // Find the closest audio element (either by class or previous sibling)
    let audio = registerManagedAudio(player.parentElement.querySelector('audio.custom-audio') || player.parentElement.querySelector('audio'));
    if (!audio) return;
    const playPauseBtn = player.querySelector('.audio-btn');
    const icon = playPauseBtn.querySelector('.audio-icon');
    const progressBar = player.querySelector('.audio-progress');
    const progressContainer = player.querySelector('.audio-progress-bar');
    const currentTimeEl = player.querySelector('.audioCurrent') || player.querySelector('#audioCurrent');

    audio.addEventListener('timeupdate', function() {
      progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    setupProgressScrubbing(progressContainer, audio);

    playPauseBtn.addEventListener('click', function() {
      pauseManagedAudioExcept(audio);
      if (audio.paused) {
        audio.play();
        icon.textContent = '❚❚';
      } else {
        audio.pause();
        icon.textContent = '▶';
      }
    });

    audio.addEventListener('play', function() {
      icon.textContent = '❚❚';
      player.classList.add('playing');
    });
    audio.addEventListener('pause', function() {
      icon.textContent = '▶';
      player.classList.remove('playing');
    });
    audio.addEventListener('ended', function() {
      icon.textContent = '▶';
      player.classList.remove('playing');
    });


  });
}

// Add event listener for Doc lightbox link
function initPetLightboxLinks() {
    const docLink = document.getElementById('docLightboxLink');
    const astroLink = document.getElementById('astroLightboxLink');
    if (docLink) {
        docLink.addEventListener('click', function(e) {
            e.preventDefault();
            openLightbox('images/doc_resist.png');
        });
    }
    if (astroLink) {
        astroLink.addEventListener('click', function(e) {
            e.preventDefault();
            openLightbox('images/astro-justhappy2behere.png');
        });
    }
}

function createVisualizerController(options) {
    const audio = registerManagedAudio(options.audio);
    const visualizerCanvas = options.visualizerCanvas;
    const getPalette = options.getPalette;
    const isLocalFile = window.location.protocol === 'file:';
    let animationId = null;
    let isPlaying = false;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let useRealAnalyser = false;
    let barHeights = new Array(8).fill(0);

    function initAudioContext() {
        if (!audio || audioContext || isLocalFile) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.7;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            useRealAnalyser = true;
        } catch (error) {
            useRealAnalyser = false;
        }
    }

    function draw() {
        if (!visualizerCanvas) return;

        const ctx = visualizerCanvas.getContext('2d');
        const width = visualizerCanvas.width;
        const height = visualizerCanvas.height;
        const barCount = 8;
        const barWidth = 3;
        const barGap = 3;
        const maxBarHeight = height * 0.8;
        const centerY = height / 2;
        const edgePadding = 10;

        ctx.clearRect(0, 0, width, height);

        if (useRealAnalyser && analyser && isPlaying) {
            analyser.getByteFrequencyData(dataArray);
        }

        for (let i = 0; i < barCount; i++) {
            let targetHeight;

            if (useRealAnalyser && dataArray && isPlaying) {
                const binIndex = Math.floor((i / barCount) * (dataArray.length * 0.6));
                const value = dataArray[binIndex] || 0;
                targetHeight = value / 255;
            } else if (isPlaying) {
                if (Math.random() < 0.12) {
                    targetHeight = Math.random() * 0.7 + 0.15;
                } else {
                    targetHeight = barHeights[i] + (Math.random() - 0.5) * 0.1;
                }
                targetHeight = Math.max(0.05, Math.min(0.85, targetHeight));
            } else {
                targetHeight = 0;
            }

            const smoothing = useRealAnalyser ? 0.35 : 0.18;
            barHeights[i] += (targetHeight - barHeights[i]) * smoothing;

            const barHeight = barHeights[i] * maxBarHeight;
            const palette = getPalette(i, barCount, barHeights[i]);

            ctx.fillStyle = palette.fillStyle;
            ctx.shadowColor = palette.shadowColor;
            ctx.shadowBlur = 6 + barHeights[i] * 4;

            const leftX = edgePadding + (i * (barWidth + barGap));
            ctx.fillRect(leftX, centerY - barHeight / 2, barWidth, Math.max(2, barHeight));

            const rightX = width - edgePadding - barWidth - (i * (barWidth + barGap));
            ctx.fillRect(rightX, centerY - barHeight / 2, barWidth, Math.max(2, barHeight));
        }

        ctx.shadowBlur = 0;
        animationId = requestAnimationFrame(draw);
    }

    function start() {
        isPlaying = true;
        if (!audioContext && !isLocalFile) {
            initAudioContext();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!animationId) {
            draw();
        }
    }

    function stop() {
        isPlaying = false;
        setTimeout(() => {
            if (!isPlaying && animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
                if (visualizerCanvas) {
                    const ctx = visualizerCanvas.getContext('2d');
                    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
                }
            }
        }, 500);
    }

    function resize() {
        if (!visualizerCanvas) return;
        const container = visualizerCanvas.parentElement;
        if (container) {
            visualizerCanvas.width = container.offsetWidth;
            visualizerCanvas.height = 40;
        }
    }

    return { start, stop, resize };
}

function formatAudioTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function slugifyTrackSegment(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getTrackSlug(track) {
    if (!track) return '';
    const filePath = typeof track.file === 'string' ? track.file : '';
    const fileName = filePath.split('/').pop() || '';
    const basename = fileName.replace(/\.[^.]+$/, '');
    return slugifyTrackSegment(basename || track.title);
}

function buildMusicHash(routeKey, trackOrSlug = '') {
    const rawSlug = typeof trackOrSlug === 'string' ? trackOrSlug : getTrackSlug(trackOrSlug);
    const trackSlug = slugifyTrackSegment(rawSlug);
    return `#${routeKey}${trackSlug ? `/${encodeURIComponent(trackSlug)}` : ''}`;
}

function parseMusicHash(hash = window.location.hash) {
    const normalizedHash = String(hash || '').replace(/^#/, '');
    if (!normalizedHash) return null;

    const [routeSegment, rawTrackSlug = ''] = normalizedHash.split('/');
    const routes = {
        'mixtape': {
            player: 'mixtape',
            canonicalRoute: 'mixtape',
            isBSide: false
        },
        'mixtape-side-two': {
            player: 'mixtape',
            canonicalRoute: 'mixtape-side-two',
            isBSide: true
        },
        'bsides': {
            player: 'mixtape',
            canonicalRoute: 'mixtape-side-two',
            isBSide: true
        },
        'gwor': {
            player: 'gwor',
            canonicalRoute: 'gwor',
            isBSide: false
        }
    };

    const route = routes[routeSegment];
    if (!route) return null;

    const trackSlug = slugifyTrackSegment(decodeURIComponent(rawTrackSlug));
    return {
        ...route,
        trackSlug,
        canonicalHash: buildMusicHash(route.canonicalRoute, trackSlug)
    };
}

function findTrackIndexBySlug(tracks, trackSlug) {
    const normalizedSlug = slugifyTrackSegment(trackSlug);
    if (!normalizedSlug) return -1;
    return tracks.findIndex(track => getTrackSlug(track) === normalizedSlug);
}

function updateHistoryHash(nextHash, method = 'replaceState') {
    if (!nextHash || window.location.hash === nextHash) return;
    if (history && typeof history[method] === 'function') {
        history[method](null, '', nextHash);
    }
}

function buildTrackShareUrl(routeKey, track) {
    const trackSlug = getTrackSlug(track);
    const sharePath = `songs/${routeKey}/${trackSlug}/`;

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return new URL(`/${sharePath}`, window.location.origin).href;
    }

    return new URL(sharePath, window.location.href).href;
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const didCopy = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!didCopy) {
        throw new Error('Clipboard copy failed.');
    }
}

function flashShareButtonLabel(button, label, duration = 1800) {
    if (!button) return;
    const labelEl = button.querySelector('.track-share-label');
    if (!labelEl) return;

    const defaultLabel = button.dataset.defaultLabel || labelEl.textContent || 'share';
    button.dataset.defaultLabel = defaultLabel;
    labelEl.textContent = label;

    window.clearTimeout(button._shareResetTimer);
    button._shareResetTimer = window.setTimeout(() => {
        labelEl.textContent = defaultLabel;
    }, duration);
}

async function shareTrackLink(button, { routeKey, track, collectionTitle }) {
    if (!button || !track || !routeKey) return;

    const url = buildTrackShareUrl(routeKey, track);
    const title = `${track.title} | ${collectionTitle}`;
    const text = `Listen to "${track.title}" from ${collectionTitle}.`;

    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            flashShareButtonLabel(button, 'shared', 1400);
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return;
            }
        }
    }

    try {
        await copyTextToClipboard(url);
        flashShareButtonLabel(button, 'copied');
    } catch (error) {
        console.error('Share failed:', error);
        flashShareButtonLabel(button, 'error', 1400);
    }
}

function syncLyricsVideoSource(lyricsVideo, lyricsVideoContainer, track) {
    if (!lyricsVideo || !lyricsVideoContainer) return;

    if (track && track.video) {
        lyricsVideo.src = track.video;
        lyricsVideo.load();
        lyricsVideo.currentTime = 0;
        lyricsVideoContainer.classList.add('has-video');
    } else {
        lyricsVideo.src = '';
        lyricsVideoContainer.classList.remove('has-video');
    }
}

function bindLyricsVideoSync(audio, lyricsVideo, getCurrentTrack) {
    if (!audio || !lyricsVideo) return;

    audio.addEventListener('play', () => {
        const track = getCurrentTrack();
        if (track && track.video) {
            lyricsVideo.currentTime = audio.currentTime;
            lyricsVideo.play().catch(() => {});
        }
    });

    audio.addEventListener('pause', () => {
        lyricsVideo.pause();
    });

    audio.addEventListener('seeked', () => {
        const track = getCurrentTrack();
        if (track && track.video) {
            lyricsVideo.currentTime = audio.currentTime;
        }
    });

    audio.addEventListener('timeupdate', () => {
        const track = getCurrentTrack();
        if (track && track.video && !audio.paused) {
            const drift = Math.abs(audio.currentTime - lyricsVideo.currentTime);
            if (drift > 0.3) {
                lyricsVideo.currentTime = audio.currentTime;
            }
        }
    });
}

function renderTrackList(trackList, tracks, onSelect, getShareData) {
    if (!trackList) return [];

    trackList.innerHTML = '';
    return tracks.map((track, index) => {
        const li = document.createElement('li');
        li.className = 'mixtape-track-item';
        const trackNumber = document.createElement('span');
        trackNumber.className = 'track-number';
        trackNumber.textContent = index + 1;

        const titleText = document.createElement('span');
        titleText.className = 'track-title-text';
        titleText.textContent = track.title;

        const actionGroup = document.createElement('div');
        actionGroup.className = 'track-action-group';

        if (track.article) {
            actionGroup.classList.add('track-action-group--paired');
            const articleLink = document.createElement('a');
            articleLink.href = track.article;
            articleLink.target = '_blank';
            articleLink.rel = 'noopener noreferrer';
            articleLink.className = 'track-article-link';
            articleLink.title = 'Read the article that inspired this song';
            articleLink.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                <span class="track-article-label">spark</span>
            `;
            articleLink.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            actionGroup.appendChild(articleLink);
        }

        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'track-share-button';
        shareButton.title = `Share link to ${track.title}`;
        shareButton.setAttribute('aria-label', `Share link to ${track.title}`);
        shareButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.6" y1="10.7" x2="15.4" y2="6.3"></line>
                <line x1="8.6" y1="13.3" x2="15.4" y2="17.7"></line>
            </svg>
            <span class="track-share-label">share</span>
        `;
        shareButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const shareData = typeof getShareData === 'function' ? getShareData(track, index) : null;
            if (!shareData || !shareData.routeKey) return;

            await shareTrackLink(shareButton, {
                routeKey: shareData.routeKey,
                track,
                collectionTitle: shareData.collectionTitle || document.title
            });
        });
        actionGroup.appendChild(shareButton);

        li.appendChild(trackNumber);
        li.appendChild(titleText);
        li.appendChild(actionGroup);
        li.addEventListener('click', () => onSelect(index));
        trackList.appendChild(li);
        return li;
    });
}

function setActiveTrackListItem(trackItems, activeIndex) {
    trackItems.forEach((item, index) => {
        item.classList.toggle('active', index === activeIndex);
    });
}

// Mixtape Lightbox Logic
function initMixtapeLightbox() {
    const aSideTracks = [
        { title: 'Hum of Humanity', file: 'audio/exploring-laibor-mixtape/hum-of-humanity.mp3', video: 'audio/exploring-laibor-mixtape/hum-of-humanity.mp4', article: 'https://charleswilke.substack.com/p/the-hum-of-humanity' },
        { title: 'Protect the Hollow', file: 'audio/exploring-laibor-mixtape/protect-the-hollow.mp3', video: 'audio/exploring-laibor-mixtape/protect-the-hollow.mp4', article: 'https://charleswilke.substack.com/p/protect-the-hollow' },
        { title: 'Data Dignity', file: 'audio/exploring-laibor-mixtape/data-dignity.mp3', video: 'audio/exploring-laibor-mixtape/data-dignity.mp4', article: 'https://charleswilke.substack.com/p/the-quest-for-data-dignity' },
        { title: 'Compounding Fuzziness', file: 'audio/exploring-laibor-mixtape/compounding-fuzziness.mp3', video: 'audio/exploring-laibor-mixtape/compounding-fuzziness.mp4', article: 'https://charleswilke.substack.com/p/compounding-fuzziness' },
        { title: 'Conjured Impunity', file: 'audio/exploring-laibor-mixtape/conjured-impunity.mp3', video: 'audio/exploring-laibor-mixtape/conjured-impunity.mp4', article: 'https://charleswilke.substack.com/p/imagined-impunity' },
        { title: 'Hypnotic Crimes', file: 'audio/exploring-laibor-mixtape/hypnotic-crimes.mp3', video: 'audio/exploring-laibor-mixtape/hypnotic-crimes.mp4', article: 'https://charleswilke.substack.com/p/hypnotic-crimes' },
        { title: 'Rubicon\'d', file: 'audio/exploring-laibor-mixtape/rubicon-d.mp3', video: 'audio/exploring-laibor-mixtape/rubicon-d.mp4', article: 'https://charleswilke.substack.com/p/rubicond' },
        { title: 'Certainty\'s Whimpering End', file: 'audio/exploring-laibor-mixtape/certaintys-whimpering-end.mp3', video: 'audio/exploring-laibor-mixtape/certaintys-whimpering-end.mp4', article: 'https://charleswilke.substack.com/p/certaintys-whimpering-end' },
        { title: 'Terminal Uniqueness', file: 'audio/exploring-laibor-mixtape/terminal-uniqueness.mp3', video: 'audio/exploring-laibor-mixtape/terminal-uniqueness.mp4', article: 'https://charleswilke.substack.com/p/terminal-uniqueness' },
        { title: 'G(ai)ve it Away', file: 'audio/exploring-laibor-mixtape/gave-it-away.mp3', video: 'audio/exploring-laibor-mixtape/gave-it-away.mp4', article: 'https://charleswilke.substack.com/p/gave-it-away' },
        { title: 'Value is Myth', file: 'audio/exploring-laibor-mixtape/value-is-myth.mp3', video: 'audio/exploring-laibor-mixtape/value-is-myth.mp4', article: 'https://charleswilke.substack.com/p/value-is-myth' }
    ];
    
    const bSideTracks = [
        { title: 'Clear as Day', file: 'audio/exploring-laibor-mixtape/clear-as-day.mp3', video: 'audio/exploring-laibor-mixtape/clear-as-day.mp4', article: 'https://www.theguardian.com/us-news/2026/jan/24/alex-pretti-minneapolis-minnesota-shooting' },
        { title: 'Permission to Ache', file: 'audio/exploring-laibor-mixtape/permission-to-ache.mp3', video: 'audio/exploring-laibor-mixtape/permission-to-ache.mp4', article: 'https://charleswilke.substack.com/p/whats-next' },
        { title: 'The Siege of Social Atomization', file: 'audio/exploring-laibor-mixtape/the-siege-of-social-atomization.mp3', video: 'audio/exploring-laibor-mixtape/the-siege-of-social-atomization.mp4', article: 'https://charleswilke.substack.com/p/the-social-siege-of-atomization' },
        { title: 'The Copy Blinked First', file: 'audio/exploring-laibor-mixtape/the-copy-blinked-first.mp3', video: 'audio/exploring-laibor-mixtape/the-copy-blinked-first.mp4', article: 'https://charleswilke.substack.com/p/after-normal' },
        { title: 'Leave Room for the Signal', file: 'audio/exploring-laibor-mixtape/leave-room-for-the-signal.mp3', video: 'audio/exploring-laibor-mixtape/leave-room-for-the-signal.mp4', article: 'https://charleswilke.substack.com/p/confusing-clarity' },
        { title: 'No Model for This', file: 'audio/exploring-laibor-mixtape/no-model-for-this.mp3', video: 'audio/exploring-laibor-mixtape/no-model-for-this.mp4', article: 'https://charleswilke.substack.com/p/rehearsing-tomorrow' },
        { title: 'What Passes Through Us', file: 'audio/exploring-laibor-mixtape/what-passes-through-us.mp3', video: 'audio/exploring-laibor-mixtape/what-passes-through-us.mp4', article: 'https://charleswilke.substack.com/p/what-passes-through-us' },
        { title: 'The Space Between', file: 'audio/exploring-laibor-mixtape/the-space-between.mp3', video: 'audio/exploring-laibor-mixtape/the-space-between.mp4', article: 'https://charleswilke.substack.com/p/the-space-between' },
        { title: 'Treasure in the Mess', file: 'audio/exploring-laibor-mixtape/treasure-in-the-mess.mp3', video: 'audio/exploring-laibor-mixtape/treasure-in-the-mess.mp4', article: 'https://charleswilke.substack.com/p/treasure-in-the-mess' },
        { title: 'What We Carry', file: 'audio/exploring-laibor-mixtape/what-we-carry.mp3', video: 'audio/exploring-laibor-mixtape/what-we-carry.mp4', article: 'https://charleswilke.substack.com/p/our-loss-of-discernment' },
        { title: 'After Normal', file: 'audio/exploring-laibor-mixtape/after-normal.mp3', video: 'audio/exploring-laibor-mixtape/after-normal.mp4', article: 'https://charleswilke.substack.com/p/after-normal' }
    ];
    
    const aSideCover = 'audio/exploring-laibor-mixtape/exploring-laibor-mixtape-cover.jpg';
    const bSideCover = 'audio/exploring-laibor-mixtape/exploring-laibor-side2-cover.jpg';
    
    let tracks = aSideTracks;
    let isBSide = false;

    const lightbox = document.getElementById('mixtapeLightbox');
    const tile = document.getElementById('mixtapeTile');
    const closeBtn = document.getElementById('mixtapeClose');
    const audio = document.getElementById('mixtapeAudio');
    const trackList = document.getElementById('mixtapeTrackList');
    const trackDisplay = document.querySelector('.mixtape-current-track');
    const prevBtn = document.getElementById('mixtapePrev');
    const nextBtn = document.getElementById('mixtapeNext');
    const playPauseBtn = document.getElementById('mixtapePlayPause');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.audio-icon') : null;
    const progressBar = document.getElementById('mixtapeProgressBar');
    const progressContainer = document.getElementById('mixtapeProgressContainer');
    const timeDisplay = document.getElementById('mixtapeTime');
    const visualizerCanvas = document.getElementById('mixtapeVisualizer');
    const lyricsVideo = document.getElementById('lyricsVideo');
    const lyricsVideoContainer = document.getElementById('lyricsVideoContainer');
    const sideToggle = document.getElementById('sideToggleSwitch');
    const sideALabel = document.querySelector('.side-a-label');
    const sideBLabel = document.querySelector('.side-b-label');
    const coverImg = document.getElementById('mixtapeCoverImg');
    const subtitleSpan = document.querySelector('.mixtape-subtitle');
    
    const audioEl = registerManagedAudio(audio);
    let currentIndex = 0;
    let trackItems = [];
    
    function getCurrentRouteKey() {
        return isBSide ? 'mixtape-side-two' : 'mixtape';
    }

    function getMixtapeCollectionTitle() {
        return isBSide ? 'Exploring L.ai.bor Side Two' : 'Exploring L.ai.bor Mixtape';
    }

    function resolveTrackIndex(trackSlug) {
        const matchedIndex = findTrackIndexBySlug(tracks, trackSlug);
        return matchedIndex === -1 ? 0 : matchedIndex;
    }

    function syncMixtapeHash(method = 'replaceState') {
        if (!lightbox || !lightbox.classList.contains('active') || !tracks[currentIndex]) return;
        updateHistoryHash(buildMusicHash(getCurrentRouteKey(), tracks[currentIndex]), method);
    }

    const visualizer = createVisualizerController({
        audio: audioEl,
        visualizerCanvas,
        getPalette: (index, barCount, intensity) => {
            const baseHue = isBSide ? 38 : 168;
            const hueVariance = isBSide ? 15 : 25;
            const hue = baseHue - ((barCount - 1 - index) / barCount) * hueVariance;
            const saturation = 75 + intensity * 25;
            const lightness = 40 + intensity * 20;
            return {
                fillStyle: `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.4})`,
                shadowColor: `hsla(${hue}, 100%, 55%, ${0.4 + intensity * 0.4})`
            };
        }
    });

    function populatePlaylist() {
        trackItems = renderTrackList(trackList, tracks, (index) => {
            loadTrack(index);
            playTrack();
        }, () => ({
            routeKey: getCurrentRouteKey(),
            collectionTitle: getMixtapeCollectionTitle()
        }));
    }
    
    // Toggle sound effect
    const toggleSound = new Audio('audio/mixtape-found.mp3');
    toggleSound.volume = 0.5;
    
    // Toggle between A-side and B-side
    function toggleSide(options = {}) {
        const {
            nextIsBSide = !isBSide,
            requestedTrackSlug = '',
            suppressHashUpdate = false
        } = options;
        const previousIsBSide = isBSide;
        const didChangeSide = nextIsBSide !== previousIsBSide;

        if (!didChangeSide && !requestedTrackSlug) return;

        isBSide = nextIsBSide;

        if (didChangeSide) {
            toggleSound.currentTime = 0;
            toggleSound.play().catch(e => console.log("Toggle sound:", e));
        }
        
        // Stop current playback
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        if (lyricsVideo) {
            lyricsVideo.pause();
            lyricsVideo.src = '';
            lyricsVideoContainer.classList.remove('has-video');
        }
        
        // Update play button
        if (playPauseIcon) {
            playPauseIcon.textContent = '▶';
        }
        visualizer.stop();
        
        // Switch tracks and cover
        if (isBSide) {
            tracks = bSideTracks;
            lightbox.classList.add('b-side-active');
            if (coverImg) coverImg.src = bSideCover;
            if (subtitleSpan) subtitleSpan.textContent = 'Side Two';
            if (sideALabel) sideALabel.classList.remove('active');
            if (sideBLabel) sideBLabel.classList.add('active');
        } else {
            tracks = aSideTracks;
            lightbox.classList.remove('b-side-active');
            if (coverImg) coverImg.src = aSideCover;
            if (subtitleSpan) subtitleSpan.textContent = 'Mixtape';
            if (sideALabel) sideALabel.classList.add('active');
            if (sideBLabel) sideBLabel.classList.remove('active');
        }
        
        // Reset and repopulate
        currentIndex = 0;
        populatePlaylist();
        
        // Load requested track if present, otherwise default to the first track
        loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: !suppressHashUpdate });

        if (!suppressHashUpdate) {
            syncMixtapeHash('replaceState');
        }
    }
    
    // Side toggle event listener
    if (sideToggle) {
        sideToggle.addEventListener('click', toggleSide);
    }
    
    // Initial playlist population
    populatePlaylist();

    function loadTrack(index, options = {}) {
        const { syncHash = true } = options;
        currentIndex = index;
        if (audio) {
            audio.src = tracks[index].file;
            audio.load();
        }
        if (trackDisplay) {
            trackDisplay.textContent = tracks[index].title;
        }
        
        // Reset progress bar and time
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (timeDisplay) {
            timeDisplay.textContent = '0:00';
        }

        syncLyricsVideoSource(lyricsVideo, lyricsVideoContainer, tracks[index]);
        setActiveTrackListItem(trackItems, index);

        if (syncHash) {
            syncMixtapeHash('replaceState');
        }
    }

    function playTrack() {
        pauseManagedAudioExcept(audio);
        if (audio) {
            audio.play().catch(e => console.error("Play error:", e));
        }
        // Sync video playback
        if (lyricsVideo && tracks[currentIndex].video) {
            lyricsVideo.currentTime = audio.currentTime;
            lyricsVideo.play().catch(e => console.log("Video play:", e));
        }
    }
    
    function pauseTrack() {
        if (audio) {
            audio.pause();
        }
        if (lyricsVideo) {
            lyricsVideo.pause();
        }
    }

    // Set canvas dimensions
    function resizeCanvas() {
        visualizer.resize();
    }
    
    // Open/Close Mixtape functions (also handles URL hash)
    function openMixtape(openBSide = false, requestedTrackSlug = '', historyMethod = 'pushState') {
        if (lightbox) {
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Switch to B-side if requested and not already there
            if (openBSide && !isBSide) {
                toggleSide({
                    nextIsBSide: true,
                    requestedTrackSlug,
                    suppressHashUpdate: true
                });
            } else if (!openBSide && isBSide) {
                // Switch back to A-side if opening A-side
                toggleSide({
                    nextIsBSide: false,
                    requestedTrackSlug,
                    suppressHashUpdate: true
                });
            } else if (requestedTrackSlug) {
                loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: false });
            }
            
            // Load first track if empty
            if (audio && !audio.src) {
                loadTrack(0, { syncHash: false });
            }
            // Size the visualizer canvas
            setTimeout(resizeCanvas, 50);
            syncMixtapeHash(historyMethod);
        }
    }
    
    function closeMixtape() {
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (audio) audio.pause();
            if (lyricsVideo) lyricsVideo.pause();
            const currentRoute = parseMusicHash();
            if (currentRoute && currentRoute.player === 'mixtape') {
                history.pushState(null, '', window.location.pathname);
            }
        }
    }
    
    // Event Listeners
    if (tile) {
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            openMixtape();
        });
    }
    
    // Red Button - Mixtape Trigger with CRT Effects
    const redButtonWrapper = document.getElementById('redButtonWrapper');
    const crtStaticOverlay = document.getElementById('crtStaticOverlay');
    
    // Sound effect for mixtape discovery
    const mixtapeFoundSound = new Audio('audio/mixtape-found.mp3');
    mixtapeFoundSound.volume = 0.6;
    
    if (redButtonWrapper) {
        redButtonWrapper.addEventListener('click', (e) => {
            // Add pressed class for LED burst animation
            redButtonWrapper.classList.add('pressed');
            
            // Play the discovery sound
            mixtapeFoundSound.currentTime = 0;
            mixtapeFoundSound.play().catch(err => console.log('Audio play prevented:', err));
            
            // Open mixtape with CRT power-on effect
            setTimeout(() => {
                redButtonWrapper.classList.remove('pressed');
                
                // Trigger static flash overlay at moment of lightbox reveal
                if (crtStaticOverlay) {
                    crtStaticOverlay.classList.add('active');
                    setTimeout(() => crtStaticOverlay.classList.remove('active'), 400);
                }
                
                // Add CRT power-on class before opening
                if (lightbox) {
                    lightbox.classList.add('crt-power-on');
                    
                    // Remove the class after animation completes
                    setTimeout(() => {
                        lightbox.classList.remove('crt-power-on');
                    }, 600);
                }
                
                openMixtape();
            }, 400);
        });
    }
    
    // Resize canvas on window resize
    window.addEventListener('resize', resizeCanvas);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMixtape);
    }
    
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeMixtape();
            }
        });
    }
    
    const initialMixtapeRoute = parseMusicHash();
    if (initialMixtapeRoute && initialMixtapeRoute.player === 'mixtape') {
        setTimeout(() => openMixtape(
            initialMixtapeRoute.isBSide,
            initialMixtapeRoute.trackSlug,
            'replaceState'
        ), 100);
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const route = parseMusicHash();
        if (route && route.player === 'mixtape') {
            openMixtape(route.isBSide, route.trackSlug, 'replaceState');
        } else {
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = 'auto';
                if (audio) audio.pause();
            }
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tracks.length - 1;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = (currentIndex + 1) % tracks.length;
            loadTrack(newIndex);
            playTrack();
        });
    }

    bindLyricsVideoSync(audio, lyricsVideo, () => tracks[currentIndex]);

    if (audio) {
        // Update progress bar and time on timeupdate
        audio.addEventListener('timeupdate', function() {
            if (progressBar && audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = progress + '%';
            }
            if (timeDisplay) {
                timeDisplay.textContent = formatAudioTime(audio.currentTime);
            }
        });

        // Update play/pause icon and visualizer
        audio.addEventListener('play', function() {
            if (playPauseIcon) {
                playPauseIcon.textContent = '❚❚';
            }
            visualizer.start();
        });

        audio.addEventListener('pause', function() {
            if (playPauseIcon) {
                playPauseIcon.textContent = '▶';
            }
            visualizer.stop();
        });

        audio.addEventListener('ended', () => {
            // Only advance to next track if not at the end
            if (currentIndex < tracks.length - 1) {
                loadTrack(currentIndex + 1);
                playTrack();
            }
            // Otherwise, just stop (don't loop back to first track)
        });
    }

    // Play/Pause button
    if (playPauseBtn && audio) {
        playPauseBtn.addEventListener('click', function() {
            pauseManagedAudioExcept(audio);
            
            if (audio.paused) {
                audio.play().catch(e => console.error("Play error:", e));
            } else {
                audio.pause();
            }
        });
    }

    setupProgressScrubbing(progressContainer, audio);

    return {
        open: openMixtape,
        close: closeMixtape
    };
}

function initGWORLightbox() {
    const gworTempArticleLink = 'https://charleswilke.substack.com/p/waiting-for-something';
    const tracks = [
        { title: 'Waiting for Something', file: 'audio/grief-without-ritual/waiting-for-something.mp3', video: 'audio/grief-without-ritual/waiting-for-something.mov', article: 'https://charleswilke.substack.com/p/waiting-for-something' },
        { title: 'Underlined Once', file: 'audio/grief-without-ritual/underlined-once.mp3', video: 'audio/grief-without-ritual/underlined-once.mp4', article: 'https://en.wikipedia.org/wiki/Operation_Metro_Surge' },
        { title: 'Letter to the Editor', file: 'audio/grief-without-ritual/letter-to-the-editor.mp3', video: 'audio/grief-without-ritual/letter-to-the-editor.mp4', article: 'https://charleswilke.substack.com/p/letter-to-the-editor' },
        { title: 'Refuse the Frequency', file: 'audio/grief-without-ritual/refuse-the-frequency.mp3', video: 'audio/grief-without-ritual/refuse-the-frequency.mov', article: 'https://charleswilke.substack.com/p/salve-for-the-algorithmic-rash' },
        { title: 'When Doctrine Slips', file: 'audio/grief-without-ritual/when-doctrine-slips.mp3', video: 'audio/grief-without-ritual/when-doctrine-slips.mov', article: 'https://charleswilke.substack.com/p/when-doctrine-slips' },
        { title: 'Respect the Exhale', file: 'audio/grief-without-ritual/respect-the-exhale.mp3', video: 'audio/grief-without-ritual/respect-the-exhale.mp4', article: 'https://charleswilke.substack.com/p/respect-the-exhale' },
        { title: 'Dearly Beloved', file: 'audio/grief-without-ritual/dearly-beloved.mp3', video: 'audio/grief-without-ritual/dearly-beloved.mp4', article: 'https://charleswilke.substack.com/p/dearly-beloved' },
        { title: 'Slow the Clock', file: 'audio/grief-without-ritual/slow-the-clock.mp3', video: 'audio/grief-without-ritual/slow-the-clock.mp4', article: 'https://charleswilke.substack.com/p/the-future-starves-without-wonder' },
        { title: 'Luxury of Indifference', file: 'audio/grief-without-ritual/luxury-of-indifference.mp3', video: 'audio/grief-without-ritual/luxury-of-indifference.mp4', article: 'https://charleswilke.substack.com/p/agency-wo-agenda' },
        { title: 'Love at Machine Speed', file: 'audio/grief-without-ritual/love-at-machine-speed.mp3', video: 'audio/grief-without-ritual/love-at-machine-speed.mp4', article: 'https://charleswilke.substack.com/p/love-at-the-speed-of-inference' },
        { title: 'Cherish Your Confident Ire', file: 'audio/grief-without-ritual/cherish-your-confident-ire.mp3', video: 'audio/grief-without-ritual/cherish-your-confident-ire.mov', article: 'https://charleswilke.substack.com/p/cherish-your-confident-ire' }
    ];

    const lightbox = document.getElementById('gworLightbox');
    const tile = document.getElementById('gworTile');
    const closeBtn = document.getElementById('gworClose');
    const audio = document.getElementById('gworAudio');
    const trackList = document.getElementById('gworTrackList');
    const trackDisplay = document.getElementById('gworCurrentTrack');
    const prevBtn = document.getElementById('gworPrev');
    const nextBtn = document.getElementById('gworNext');
    const playPauseBtn = document.getElementById('gworPlayPause');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.audio-icon') : null;
    const PLAY_ICON = '\u25B6';
    const PAUSE_ICON = '\u275A\u275A';
    const progressBar = document.getElementById('gworProgressBar');
    const progressContainer = document.getElementById('gworProgressContainer');
    const timeDisplay = document.getElementById('gworTime');
    const visualizerCanvas = document.getElementById('gworVisualizer');
    const lyricsVideo = document.getElementById('gworLyricsVideo');
    const lyricsVideoContainer = document.getElementById('gworLyricsVideoContainer');

    if (!lightbox || !tile || !audio || !trackList) return;

    if (playPauseIcon) {
        playPauseIcon.textContent = PLAY_ICON;
    }

    const audioEl = registerManagedAudio(audio);
    let currentIndex = 0;
    let trackItems = [];
    
    function resolveTrackIndex(trackSlug) {
        const matchedIndex = findTrackIndexBySlug(tracks, trackSlug);
        return matchedIndex === -1 ? 0 : matchedIndex;
    }

    function syncGWORHash(method = 'replaceState') {
        if (!lightbox || !lightbox.classList.contains('active') || !tracks[currentIndex]) return;
        updateHistoryHash(buildMusicHash('gwor', tracks[currentIndex]), method);
    }

    const visualizer = createVisualizerController({
        audio: audioEl,
        visualizerCanvas,
        getPalette: (index, barCount, intensity) => {
            const baseHue = 6;
            const hueVariance = 12;
            const hue = baseHue - ((barCount - 1 - index) / barCount) * hueVariance;
            const saturation = 42 + intensity * 20;
            const lightness = 42 + intensity * 16;
            return {
                fillStyle: `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + intensity * 0.4})`,
                shadowColor: `hsla(${hue}, 100%, 55%, ${0.4 + intensity * 0.4})`
            };
        }
    });

    function populatePlaylist() {
        trackItems = renderTrackList(trackList, tracks, (index) => {
            loadTrack(index);
            playTrack();
        }, () => ({
            routeKey: 'gwor',
            collectionTitle: 'Grief without Ritual'
        }));
    }

    function loadTrack(index, options = {}) {
        const { syncHash = true } = options;
        currentIndex = index;
        audio.src = tracks[index].file;
        audio.load();
        if (trackDisplay) {
            trackDisplay.textContent = tracks[index].title;
        }

        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (timeDisplay) {
            timeDisplay.textContent = '0:00';
        }

        syncLyricsVideoSource(lyricsVideo, lyricsVideoContainer, tracks[index]);
        setActiveTrackListItem(trackItems, index);

        if (syncHash) {
            syncGWORHash('replaceState');
        }
    }

    function playTrack() {
        pauseManagedAudioExcept(audio);
        audio.play().catch(e => console.error('Play error:', e));
        if (lyricsVideo && tracks[currentIndex].video) {
            lyricsVideo.currentTime = audio.currentTime;
            lyricsVideo.play().catch(e => console.log('Video play:', e));
        }
    }

    function resizeCanvas() {
        visualizer.resize();
    }

    function openGWOR(requestedTrackSlug = '', historyMethod = 'pushState') {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (requestedTrackSlug) {
            loadTrack(resolveTrackIndex(requestedTrackSlug), { syncHash: false });
        } else if (!audio.src) {
            loadTrack(0, { syncHash: false });
        }
        setTimeout(resizeCanvas, 50);
        syncGWORHash(historyMethod);
    }

    function closeGWOR() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
        audio.pause();
        if (lyricsVideo) lyricsVideo.pause();
        const currentRoute = parseMusicHash();
        if (currentRoute && currentRoute.player === 'gwor') {
            history.pushState(null, '', window.location.pathname);
        }
    }

    populatePlaylist();

    tile.addEventListener('click', (e) => {
        e.preventDefault();
        openGWOR();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeGWOR);
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeGWOR();
        }
    });

    window.addEventListener('resize', resizeCanvas);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = tracks.length - 1;
            loadTrack(newIndex);
            playTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = (currentIndex + 1) % tracks.length;
            loadTrack(newIndex);
            playTrack();
        });
    }

    bindLyricsVideoSync(audio, lyricsVideo, () => tracks[currentIndex]);

    audio.addEventListener('timeupdate', function() {
        if (progressBar && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = progress + '%';
        }
        if (timeDisplay) {
            timeDisplay.textContent = formatAudioTime(audio.currentTime);
        }
    });

    audio.addEventListener('play', function() {
        if (playPauseIcon) {
            playPauseIcon.textContent = PAUSE_ICON;
        }
        visualizer.start();
    });

    audio.addEventListener('pause', function() {
        if (playPauseIcon) {
            playPauseIcon.textContent = PLAY_ICON;
        }
        visualizer.stop();
    });

    audio.addEventListener('ended', () => {
        if (currentIndex < tracks.length - 1) {
            loadTrack(currentIndex + 1);
            playTrack();
        }
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            pauseManagedAudioExcept(audio);

            if (audio.paused) {
                audio.play().catch(e => console.error('Play error:', e));
            } else {
                audio.pause();
            }
        });
    }

    setupProgressScrubbing(progressContainer, audio);

    const initialGWORRoute = parseMusicHash();
    if (initialGWORRoute && initialGWORRoute.player === 'gwor') {
        setTimeout(() => openGWOR(initialGWORRoute.trackSlug, 'replaceState'), 100);
    }

    window.addEventListener('popstate', () => {
        const route = parseMusicHash();
        if (route && route.player === 'gwor') {
            openGWOR(route.trackSlug, 'replaceState');
        } else if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
            audio.pause();
            if (lyricsVideo) lyricsVideo.pause();
        }
    });

    return {
        open: openGWOR,
        close: closeGWOR
    };
}

function bindLazyMediaTrigger(element, ensureInitialized, openCallback) {
    if (!element) return;

    element.addEventListener('pointerenter', ensureInitialized, { once: true });
    element.addEventListener('focusin', ensureInitialized, { once: true });
    element.addEventListener('touchstart', ensureInitialized, { once: true, passive: true });

    element.addEventListener('click', (event) => {
        const instance = ensureInitialized();
        if (instance && typeof openCallback === 'function') {
            event.preventDefault();
            event.stopImmediatePropagation();
            openCallback(instance);
        }
    }, { capture: true, once: true });
}

function initDeferredHomepageMedia() {
    const ensureMixtapeLightbox = createLazyInitializer(initMixtapeLightbox);
    const ensureGWORLightbox = createLazyInitializer(initGWORLightbox);
    const mixtapeTile = document.getElementById('mixtapeTile');
    const gworTile = document.getElementById('gworTile');
    const redButtonWrapper = document.getElementById('redButtonWrapper');
    const initialRoute = parseMusicHash();

    bindLazyMediaTrigger(mixtapeTile, ensureMixtapeLightbox, (instance) => {
        instance.open(false);
    });

    bindLazyMediaTrigger(redButtonWrapper, ensureMixtapeLightbox, (instance) => {
        window.setTimeout(() => {
            redButtonWrapper.click();
        }, 0);
    });

    bindLazyMediaTrigger(gworTile, ensureGWORLightbox, (instance) => {
        instance.open();
    });

    if (initialRoute && initialRoute.player === 'mixtape') {
        ensureMixtapeLightbox();
    }

    if (initialRoute && initialRoute.player === 'gwor') {
        ensureGWORLightbox();
    }
}

function initDeferredHomepageEffects() {
    scheduleIdleWork(() => {
        initHeaderGlitchEffects();
        initFaqGlitchTimer();
        initNeonFlicker();
        initShimmerEffect();
    }, 2000);
}

onReady(() => {
    initRSSFallbackFetch();
    initTimeDial();
    initEmailGlitchEffects();
    initCustomAudioPlayers();
    initPetLightboxLinks();
    initDeferredHomepageMedia();
    initDeferredHomepageEffects();
});

