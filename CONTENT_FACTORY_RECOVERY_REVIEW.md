# Content Factory recovery — review pass

The 2022 DreamHost backup (`jeltz_dh_mkj53s.tar.gz`) held a full WordPress
export whose `.wpress` archive contained the site database. All 17 published
posts were recovered, and their text is now the source of truth in the Content
Factory — your later edit passes included.

**Everything in this file is prose I drafted or attribution I inferred.** The
article text itself is yours, recovered verbatim; none of it was rewritten.
Edit here, or straight in `before-times-archive.js` — the ids match.

---

## 1. Dates

The backup could not date anything. WordPress categories were thematic
(`Science & Technology`, `Social Impact`), every `post_date` is the 2021
bulk-import date, and no original publication URLs survived. Two pieces even
mention TikTok, which did not exist in 2015–16 — consistent with a later edit
pass, but it rules out dating them from content.

So none of the recovered pieces claims a specific year. Each inherits the year
span its client drawer already declares in `contentCatalog`, and the archive
header now carries the overall range:

> Content Factory // recovered work, 2014–2022

The one piece with no drawer, `give-a-damn-about-space`, carries no date at all.
Both the masthead and the index skip the slot when it is empty, so it reads as
undated rather than broken.

| Piece | Drawer | Eyebrow |
|---|---|---|
| `occipital-neuralgia-smartphones` | review-weekly | Health Desk // 2015–2016 |
| `irish-pubs-chicago` | review-weekly | City Guides // 2015–2016 |
| `hooking-up-at-coachella` | review-weekly | Digital Culture // 2015–2016 |
| `grammatical-errors-dating-profile` | review-weekly | Service Desk // 2015–2016 |
| `shell-arctic-drilling` | solar-me-home | Energy Desk // 2015 |
| `ladwp-overcharging` | solar-me-home | Utility Watch // 2015 |
| `future-of-the-battery` | solar-me-home | Energy Desk // 2015 |
| `life-near-an-airport` | home-living-101 | Urban Systems // 2015 |
| `unlicensed-sober-living-homes` | home-living-101 | Investigative // 2015 |
| `give-a-damn-about-space` | — none — | Personal Essay *(no date)* |

## 2. Client attribution — the part still worth checking

Which drawer each piece belongs to is inferred from your own drawer summaries.
Six are solid; the rest are judgement calls.

- **Heads Up! Smartphone Use Linked to Occipital Neuralgia** — medium — SEO shape and Takeaway close match the Review Weekly drawer; a TikTok mention suggests a later edit pass, so the year is unconfirmed
- **The Future of the Battery** — medium — the Solar Me Home drawer summary names battery breakthroughs, but a TikTok mention points to a later edit pass, so the year is unconfirmed
- **Now Boarding – Life Near an Airport is for the Birds** — medium — fits the Home Living 101 drawer, though the eMortgageRates neighborhood-anthropology beat is also plausible
- **The Dark Side of Unlicensed Sober Living Homes** — medium — length and register are unlike anything else in the Home Living 101 drawer; the first-person Los Angeles framing is the main signal
- **Give a Damn About Space: An Argument** — LOW — no client fits. Dated from the TRAPPIST-1 discovery (February 2017), which falls between the client drawers; Improbology is inferred from it being your own site, not from evidence in the piece.

To move a piece: change its `publication` in the entry and move its id between
`restored: [...]` arrays in `contentCatalog`. The "N restored of M" counts
recompute themselves.

---

## 3. Drafted prose for the ten new pieces

Each piece carries three authored fields: the **dek** (one line under the
title), the **curator** note (the archivist's aside), and the **In brief** pane
(precis plus pull quote). Every pull quote is an exact string from your article
— verified against the recovered text, not paraphrased.


### Heads Up! Smartphone Use Linked to Occipital Neuralgia
`occipital-neuralgia-smartphones` · Review Weekly · Health explainer · 881 words · 2 inline images

**Dek**
> A health explainer built to the shape of an SEO brief — what is it, how does it happen, what can you do — that then refuses to end on the reassuring note the format expects.

**Curator note**
> The bones here are pure search scaffolding: four questions as subheads, a takeaway to close. What the brief did not ask for was the bowling ball balanced on a plastic cup, or the closing admission that evolution is not going to arrive in time to fix our posture. The format holds. Something else moves around inside it.

**In brief**
> The occipital nerves run up through the cervical spine and branch across the scalp. Tilt your head down far enough, long enough, and the weight of the skull stops being distributed and starts being concentrated — and those nerves, no longer shielded, begin to complain.
>
> *(pull quote)* Think of your head like a bowling ball and your neck as a plastic cup.
>
> The piece walks through symptoms, causes and the thin menu of treatments, then closes somewhere a service article usually does not go: human evolution takes hundreds of thousands of years, the phone is not going anywhere, and the adaptation is going to have to be behavioral.
>

### 7 Best Irish Pubs in Chicago to Visit on St. Patrick’s Day
`irish-pubs-chicago` · Review Weekly · City guide listicle · 1160 words · 0 inline images

**Dek**
> Seven Chicago Irish pubs, loosely ranked and annotated with the kind of trivia that only turns up when a writer is enjoying the assignment.

**Curator note**
> A listicle is the most disposable thing the factory made, and this is unmistakably one — addresses, phone numbers, the whole apparatus. But every entry closes on a Fun Fact, and the fun facts are where the writer is hiding: gangster tunnels running toward the Field Museum, a four-way stop sign the city installed because of falling drunks, the birth of the Harvey Wallbanger. The listicle is the container. The marginalia is the piece.

**In brief**
> Seven pubs, spread deliberately across the city rather than clustered downtown — the Kerryman for people who want corned beef without the hollering, Cork & Kerry for the South Side, Johnny O'Hagan's for Wrigleyville, Butch McGuire's for the animatronic leprechauns.
>
> *(pull quote)* The City of Chicago had to add a four‐way stop sign at the intersection outside this pub due to so many stumbling drunks tripping into the streets.
>
> The service information is accurate and the structure is exactly what the brief called for. The reason to read it now is the footnotes.
>

### Hooking Up at Coachella
`hooking-up-at-coachella` · Review Weekly · Festival dispatch · 715 words · 4 inline images

**Dek**
> A festival dispatch about dating apps, geo-fencing and the marketing machinery of Coachella, written by someone who has never been and has no intention of going.

**Curator note**
> The factory at its most cheerfully cynical, and the editor's note at the bottom gives the whole game away: the writer has never attended and describes the event as a personalized hell. The reporting still lands — Glance, the geo-fencing, the H&M aura booth are all real. It simply does the job from a great and entirely unashamed distance.

**In brief**
> Coachella as a marketing surface: twelve corporate partners, a Dutch dating app using the same geo-fencing that serves you targeted ads, and an H&M aura-photo booth engineered to be posted. The ostensible subject is hooking up. The actual subject is how thoroughly the moment has been instrumented.
>
> *(pull quote)* And while nothing screams cool indie rock like American Express, you’ll quickly focus on the nearly naked throngs of millennials chewing handfuls of designer drugs and having sex in the mosh pit.
>
> It ends with a practical tip about dropping GPS pins when the cell network collapses under the weight of everyone uploading at once, and then an editor's note admitting the writer has never set foot in the place.
>

### 5 Common Grammatical Errors That Sink Your Dating Profile
`grammatical-errors-dating-profile` · Review Weekly · Service piece · 816 words · 5 inline images

**Dek**
> Five grammar mistakes, each pinned to an animated reaction GIF, aimed at men whose dating profiles are working against them faster than their photos are.

**Curator note**
> A grammar explainer dressed as dating advice, which is a shrewder brief than it looks: nobody clicks a grammar explainer, and everybody clicks an explanation of why they are not getting dates. The GIFs did the traffic work. The apostrophe rule underneath them is the cleanest version of that rule I ever managed to write.

**In brief**
> Apostrophes, your/you're, there/their/they're, its/it's, and sentences ending in prepositions — the five most common ways a dating profile signals carelessness before anyone reaches the photos.
>
> *(pull quote)* Every time you remove letters of one word to stick together with another word, you use an apostrophe
>
> The framing is unapologetically commercial, opening on a Zoosk statistic that 48% of singles call bad grammar a deal breaker. The teaching under it is genuinely good, and the five GIFs are preserved here as they ran.
>

### Shell Abandons Arctic Drilling Plans at a $7 Billion Loss
`shell-arctic-drilling` · Solar Me Home · Energy news feature · 538 words · 2 inline images

**Dek**
> Shell walks away from Arctic exploration after $7 billion, and the piece follows the loss past the headline to the Alaskan port town that had been counting on the work.

**Curator note**
> News copy with a turn in it. The obvious version of this story ends at 'oil company retreats, environment wins.' This one keeps going to Unalaska, where the mayor is quietly working out what the departure costs a town that had been promised a boom. The factory rarely paid for that second move. This one made it anyway.

**In brief**
> After years of exploration and $7 billion spent, Shell abandons offshore Alaska entirely, citing the Burger J well result, the costs, and a federal regulatory environment it calls unpredictable — with a presidential election approaching in which every remaining Democratic candidate opposed Arctic drilling.
>
> *(pull quote)* Our business community will notice it because [Shell] utilized a lot of local businesses and hired a lot of folks. So, that’s too bad. I mean it was a real boon,
>
> The closing argument is that the retreat says less about one bad well than about a company reading the direction of the whole industry.
>

### Some Customers Report LADWP Overcharging on Monthly Bill
`ladwp-overcharging` · Solar Me Home · Consumer utility report · 848 words · 2 inline images

**Dek**
> A municipal utility's botched billing system, told through the customers holding four-figure bills they cannot account for.

**Curator note**
> Consumer-utility reporting on a solar blog, which is to say: written to be found by somebody searching at midnight for why their power bill tripled. The Consumer Affairs quotes carry it — 'Can they do this? Is this legal?' — real people at the wrong end of a database migration, before anyone called it a scandal.

**In brief**
> LADWP sends out nearly 1.5 million estimated bills in a single year following a botched billing-system transition. Customers report charges they cannot reconcile, refunds that arrive in the wrong amounts, and a utility that considers the matter closed.
>
> *(pull quote)* Can they do this? Is this legal?
>
> Two class-action suits were pending when this ran. The piece does not resolve, because at the time it had not.
>

### The Future of the Battery
`future-of-the-battery` · Solar Me Home · Technology explainer · 1116 words · 0 inline images

**Dek**
> Solar's real bottleneck was never the panel, and this piece goes looking for the storage chemistry that might finally clear it.

**Curator note**
> The energy desk's standing problem was that solar news is mostly panel news, and panels had stopped being interesting some time around the third conversion-rate story. So the beat widened into storage, which is where the actual constraint always lived. The phone-in-your-pocket framing is a content-farm move. The argument underneath it is sound.

**In brief**
> Crack open any phone and the battery is the largest component in it, dictating the size and weight of everything around it. That ratio is the ceiling on renewable energy too: panels keep improving, and storage does not.
>
> *(pull quote)* What if the battery became the smallest component in your phone?
>
> From there it runs through the candidate chemistries, including one whose key material turns out to be sitting inside a tree.
>

### Now Boarding – Life Near an Airport is for the Birds
`life-near-an-airport` · Home Living 101 · Real-estate feature · 930 words · 1 inline image

**Dek**
> The discounted house under the landing pattern, and the noise, air-quality and eviction research that explains the discount.

**Curator note**
> A real-estate piece that turns into a warning. It opens on the conga line of jets hanging over Los Angeles and ends in Heathrow cardiac studies and Medicare data across eighty-nine American airports — sourcing the brief did not require and probably did not pay for. Useful copy that decided to be true first.

**In brief**
> The price break on a house near an airport is real, and so is what you are buying with it: constant low-frequency noise, elevated particulate exposure, and, if the airport ever expands, the possibility of an eviction you cannot contest.
>
> *(pull quote)* The closer you live to the airport, the more aircraft noise you experience in your home, the higher the risk you run for developing heart problems.
>
> Two observational studies anchor it — 3.6 million people around Heathrow, six million Medicare recipients near American airports — both finding the same dose-response curve.
>

### The Dark Side of Unlicensed Sober Living Homes
`unlicensed-sober-living-homes` · Home Living 101 · Investigative feature · 1927 words · 0 inline images

**Dek**
> A neighborhood-watch meeting in Hollywood opens into three decades of federal housing law, and the loophole that lets unlicensed halfway houses operate with no oversight at all.

**Curator note**
> The longest thing in this drawer and the least like anything around it. It begins in a room the writer walked into two doors from his own apartment and works outward through the Fair Housing Act, the ADA, the Oxford House ruling, and a 2012 Pasadena fire that killed two men. It is careful about the people it could easily have vilified, and it does not resolve, because the law never did. Nobody briefed this one.

**In brief**
> Sober-living homes sit in a gap in the law: not medical facilities, so not licensed; occupied by residents legally defined as disabled, so protected by the FHA and the ADA. The result is a category of business with almost no operational floor and almost no way for a neighbor to challenge it.
>
> *(pull quote)* A completely self-governed facility with zero oversight is somehow meant to expel those that relapse.
>
> The reporting is deliberate about what it is not arguing. Recovering addicts deserve housing and protection; the objection is to proprietors packing ten to twelve people into single-family homes and calling it recovery. Los Angeles drafted an ordinance in 2011 and sent it back to committee in 2013, where it stayed.
>

### Give a Damn About Space: An Argument
`give-a-damn-about-space` · Improbology · Personal essay · 426 words · 0 inline images

**Dek**
> A short argument for caring about space exploration, written in the weeks after seven Earth-like planets turned up around a single nearby star.

**Curator note**
> Four hundred words and not one subhead, which in this archive marks it immediately as something other than client work. No keyword to hit, no takeaway to land, no drawer it fits into. Just a writer who has been looking up since childhood, briefly getting to say so.

**In brief**
> The TRAPPIST-1 discovery lands, and the essay uses it to make a case that has nothing to do with habitability studies: that space is one of the few remaining subjects capable of holding public attention across every other division.
>
> *(pull quote)* And this makes me ecstatic!
>
> It is the shortest piece in the archive and the only one written for no client at all.
>

---

## 4. The five entries that already existed

These kept your dek, curator note and In brief exactly as written. Only the
article body changed: the condensed rebuild was replaced with the full recovered
text, and inline images were restored to position. Their eyebrows were left
alone.

| Piece | Was | Now | Figures restored |
|---|---|---|---|
| `trimming-fringe-suburbia` | ~588 words | 1125 words | 2 |
| `frank-lloyd-wright-spotlight` | ~673 words | 1610 words | 8 |
| `google-glass-slow-death` | ~511 words | 972 words | 1 |
| `state-of-dating-2016` | ~850 words | 1828 words | 4 |
| `forty-hour-workweek` | ~526 words | 1068 words | 0 |

Their `depth.intro` now reads:

> The full article as it was last published, recovered from the 2022 site backup
> with its images restored to position. Earlier editions of this archive carried
> a shortened rebuild; this is the complete text.

Change that line if you would rather it not point at the earlier version.

---

## 5. What else changed

- **New `image` block type** in `renderArchiveBody` (`before-times.js`), so
  figures can sit inside an article body. Each opens the existing scan viewer at
  its own page. Styling is `.bt-archive-figure` in `before-times.css`.
- **Original image alignment restored.** WordPress recorded `align` and a
  display width on every image, and both survived in the backup. Frank Lloyd
  Wright carries six right-floated insets (150–241px) and two centered plates
  (600px); Occipital Neuralgia and Trimming the Fringe have two centered images
  each. There is no `alignleft` anywhere in the corpus. Below 720px the floats
  drop back into the flow.
- **`.bt-archive-body` changed from `display: grid` to `display: flow-root`.**
  Floats do not work on grid items — a floated grid item just sits in its own
  cell instead of letting text wrap around it. The grid `gap` was replaced with
  margins that reproduce the old spacing exactly, including the looser 1.2rem
  the `.bt-archive-reader` variant used. Verified by measuring the gap between
  every pair of adjacent body elements before and after: 611 gaps compared,
  and every difference was figure-adjacent. No paragraph, heading, blockquote
  or screenplay spacing moved.
- **41 images** converted to webp under `/images/before-times/archive/`. Six are
  animated — five grammar GIFs and one in the neuralgia piece — and went through
  `gif2webp`; lossy re-encoding took them from 9.8 MB to 2.4 MB.
- **Three new room hotspots** on previously unclaimed clipboards: sober living,
  Coachella, Irish pubs. The room art has about nine medium-or-larger clipboards
  and all were already spoken for, so these three sit further back on the line
  and are correspondingly smaller targets. More can be added, but they would be
  smaller still.
- **Reading depth is unchanged.** `renderContentPiece` still opens on
  `mode: 'read'`, so one click from a hotspot lands on the full article. The
  summaries remain the second tab, not a gate.

## 6. Not included

- **Two link roundups** — "Favorite Improbology Posts of 2018" and "Favorite
  FieldEdge Articles of 2021" are lists of outbound links rather than articles,
  so they were recovered but not added. The `links` block type already exists if
  you want them in as index cards.

