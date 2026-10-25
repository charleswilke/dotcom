# Songbook audio history audit — October 24, 2026

**Result:** 31 distinct earlier audio versions across 9 current songs: 28 in Junkyard Cabaret and 3 in Grief without Ritual. Cathedral’s one earlier recording is already wired locally, leaving 30 additional candidates.

The audit also found eight distinct recordings across four former GWOR songs. They are listed separately below and are not counted as previous takes of replacement songs.

**Songbook update — October 24:** All 31 earlier versions are now linked in the nine current songbooks, using simple date labels and numbers for versions saved on the same day. The original Git audio is preserved; entries are ordered oldest first. Former GWOR songs remain listed only in this audit.

**Curation update — October 24:** Why This Way now includes only the April 5 recording in its songbook. Its four September versions remain in the audit but are no longer listed as Previous takes. Scarce now includes only its 4:33 July 11 recording. The current songbooks contain 26 previous takes across nine songs.

## Scope and method

- Audited all locally available Git branches and remote-tracking refs. Repository HEAD: `0bfb16ff26c61b1a5c08fae4546b3615999051ea` (Add From This Side of the Door to GWOR with songbook and artwork). The repository is not shallow. No remote fetch, reflog scan, or external-folder search was performed.
- Used the current working-tree track lists: 16 Junkyard Cabaret songbooks, 12 GWOR songbooks, and the Take Your Time intermission.
- Scanned Git changes to MP3, WAV, M4A, FLAC, and OGG files throughout the repository, including older album and mixtape paths. All 69 relevant unique file blobs were MP3s and were readable and decodable.
- Compared Git blob IDs, compressed audio hashes, and decoded PCM hashes. After removing the What You Get tag-only duplicate, there are 68 distinct audio versions: 29 current recordings, 31 earlier versions of current songs, and 8 recordings of former GWOR songs.
- Also inspected the Git history of the Clear as Day and Permission to Ache MP4s. Each has one stored video blob, added with its MP3 and later moved between albums; no earlier video revisions were found.
- “Distinct” means the decoded audio differs. Some versions are exports, edits, or trims of a recording; the audit does not claim every file is a different performance.
- Dates are first saved appearances in Git, not recording dates. Times below are America/Chicago. Durations are rounded to the nearest second.
- Audio links point to installed repository files or the original Git snapshots for unselected and former-song recordings. Commit and blob IDs are the durable recovery references. No additional songbook entries or public audio files were added by this audit.

## Current songs with earlier audio

| Album | Current song | Earlier versions | Earlier Git dates | Current duration |
|---|---|---:|---|---|
| JC | Why This Way | 5 | 2026-04-05 – 2026-09-25 | 4:13 |
| JC | Cathedral of Junk | 1 | 2026-03-28 | 3:12 |
| JC | Morning's Flood | 5 | 2026-03-06 – 2026-10-16 | 5:05 |
| JC | Refuse the Call | 4 | 2026-06-19 – 2026-10-17 | 3:40 |
| JC | Mostly Yours | 6 | 2026-07-03 – 2026-09-27 | 3:16 |
| JC | Misdirected. | 5 | 2026-07-05 – 2026-09-27 | 3:17 |
| JC | Scarce | 2 | 2026-07-11 | 4:47 |
| GWOR | Slow the Clock | 1 | 2026-03-04 | 3:01 |
| GWOR | When Doctrine Slips | 2 | 2026-03-01 – 2026-10-10 | 4:07 |

## Version timelines

### Why This Way

Current file: `audio/junkyard-cabaret/why-this-way.mp3`.

The September 19 Desktop export and September 24/25 end/intro trims are distinct audio files. Review these as an edit chain before choosing which cuts to share.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Apr 5, 2026 · 2:25 PM | 4:01 | Earlier | `3e6e88d` | `41979618160f8b14ac39620da50cf0f7c2c91293` | [Listen](../audio/junkyard-cabaret/previous-takes/why-this-way-2026-04-05.mp3) |
| Sep 19, 2026 · 3:58 PM | 4:46 | Earlier | `20bf2ae` | `f0acd8cce2bc4e7fd8f55f21aaab4580618fc153` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/20bf2ae5267dcea913452cd8f4e09aedfff3673f/audio/junkyard-cabaret/why-this-way.mp3) |
| Sep 19, 2026 · 4:36 PM | 4:43 | Earlier | `aa0c33b` | `bff5e7ed619638fb6e396c5b0ff35a7da51cc072` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/aa0c33bad114536f564a5ccd3d2ee91dfee1fc0c/audio/junkyard-cabaret/why-this-way.mp3) |
| Sep 24, 2026 · 11:15 AM | 4:38 | Earlier | `c7e334a` | `58b96f5c127e62c9c85bfee49b8c5682b36c3afd` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/c7e334ae93da291ee74b1e8f6d3946e0100ed3f4/audio/junkyard-cabaret/why-this-way.mp3) |
| Sep 25, 2026 · 8:40 AM | 4:31 | Earlier | `8b69392` | `d2dfd6f3fb0d7f8cf1754843cdbd86c86c3c1cee` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/8b693924aa82b4ce13957d5dfd126222ccff0a33/audio/junkyard-cabaret/why-this-way.mp3) |
| Sep 27, 2026 · 1:28 PM | 4:13 | Current | `c524b72` | `f5772e9006ed8dda6fe6bacc7d14503eba28c1b5` | [Listen](../audio/junkyard-cabaret/why-this-way.mp3) |

Commit descriptions:

- `3e6e88d` — new song! Why this Way?
- `20bf2ae` — Update Why This Way recording in Junkyard Cabaret
- `aa0c33b` — Use Desktop export of Why This Way in Junkyard Cabaret
- `c7e334a` — Refresh Why This Way audio and visualizer after end trim
- `8b69392` — Refresh Why This Way audio and visualizer after intro trim
- `c524b72` — JC: update Why This Way cut and visualizer data

### Cathedral of Junk

Current file: `audio/junkyard-cabaret/cathedral-of-junk.mp3`.

The March recording is already wired into the local Previous takes section; this audit has not added any other takes.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 28, 2026 · 5:44 PM | 3:41 | Earlier | `cbf615a` | `140c52b3e0aec1d605695778ac32982725db5dd9` | [Listen](../audio/junkyard-cabaret/previous-takes/cathedral-of-junk-2026-03.mp3) |
| Sep 14, 2026 · 4:51 PM | 3:12 | Current | `0d90b1d` | `cf984508f2bd0621415bba7c33216592aa9074d4` | [Listen](../audio/junkyard-cabaret/cathedral-of-junk.mp3) |

Commit descriptions:

- `cbf615a` — starting a new album, junkyard cabaret
- `0d90b1d` — JC: new cut of Cathedral of Junk. (221.3s -> 191.6s)

### Morning's Flood

Current file: `audio/junkyard-cabaret/mornings-flood.mp3`.

Includes the March recording under Cherish Your Confident Ire in GWOR. The July 3 commit moves that song idea to Morning’s Flood in Junkyard Cabaret, matching the user-confirmed lineage.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 6, 2026 · 5:18 PM | 4:40 | Earlier | `37baa7e` | `838c43329178c39244dbd064da29d3ec64c7575d` | [Listen](../audio/junkyard-cabaret/previous-takes/mornings-flood-2026-03-06.mp3) |
| Jul 3, 2026 · 4:31 PM | 5:22 | Earlier | `7191042` | `c76112df229199f54347b8c0152ae94b1f9c5c16` | [Listen](../audio/junkyard-cabaret/previous-takes/mornings-flood-2026-07-03.mp3) |
| Jul 4, 2026 · 11:10 AM | 5:16 | Earlier | `f294bb1` | `61b74aef0f2dcfd2c7a713e0d5977607e4ee6f8b` | [Listen](../audio/junkyard-cabaret/previous-takes/mornings-flood-2026-07-04.mp3) |
| Jul 5, 2026 · 1:02 PM | 4:53 | Earlier | `ec99a5b` | `6989d73efbeb8c6e4f82a2a0f86a7f4fdffd4237` | [Listen](../audio/junkyard-cabaret/previous-takes/mornings-flood-2026-07-05.mp3) |
| Oct 16, 2026 · 2:00 PM | 5:10 | Earlier | `3fab317` | `f63d04e8cba75a162d69511efb0c1ca21094797e` | [Listen](../audio/junkyard-cabaret/previous-takes/mornings-flood-2026-10-16.mp3) |
| Oct 18, 2026 · 12:02 PM | 5:05 | Current | `289e47c` | `909abb9b3229da0877e0129e4e7bb270801854bf` | [Listen](../audio/junkyard-cabaret/mornings-flood.mp3) |

Commit descriptions:

- `37baa7e` — new song! cherish your confident ire
- `7191042` — JC: add Morning's Flood as final Act II track; retire Cherish from GWOR
- `f294bb1` — Replace Morning's Flood mp3 with new version; bump cache param
- `ec99a5b` — Replace Morning's Flood mp3 with updated version; bump cache param
- `3fab317` — Update Morning's Flood audio and matchstick title art
- `289e47c` — Update Morning's Flood to revised 5:05 audio

### Refuse the Call

Current file: `audio/junkyard-cabaret/refuse-the-call.mp3`.

The first three versions use Refuse the Frequency. October 17 introduces Refuse the Call; October 18 updates its audio. Both titles are treated as one lineage.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Jun 19, 2026 · 9:59 AM | 4:13 | Earlier | `2a34cc2` | `509c0a6a9b425946e18c5106dd887f9315d80eab` | [Listen](../audio/junkyard-cabaret/previous-takes/refuse-the-call-2026-06-19.mp3) |
| Sep 27, 2026 · 12:06 PM | 3:53 | Earlier | `ace96f0` | `b26aa9a8ea3b0da7a60b504191721538b8e11bac` | [Listen](../audio/junkyard-cabaret/previous-takes/refuse-the-call-2026-09-27-1.mp3) |
| Sep 27, 2026 · 4:47 PM | 3:27 | Earlier | `ae28af1` | `3e79065664ff4828647cc6ac2e07c1b826c44c93` | [Listen](../audio/junkyard-cabaret/previous-takes/refuse-the-call-2026-09-27-2.mp3) |
| Oct 17, 2026 · 10:09 AM | 3:52 | Earlier | `79ca6ad` | `55d33a8eb7fce7597354867e725d45c7b5bd90f4` | [Listen](../audio/junkyard-cabaret/previous-takes/refuse-the-call-2026-10-17.mp3) |
| Oct 18, 2026 · 11:34 AM | 3:40 | Current | `26c313e` | `1bfba2e4a800dcd1c2fbe77c6408aa472e77ba35` | [Listen](../audio/junkyard-cabaret/refuse-the-call.mp3) |

Commit descriptions:

- `2a34cc2` — Bump cache-bust string for updated Refuse the Frequency mp3
- `ace96f0` — JC: new cut of Refuse the Frequency (252.6s -> 233.2s)
- `ae28af1` — JC: another new cut of Refuse the Frequency (233.2s -> 206.8s)
- `79ca6ad` — JC: rework Refuse the Frequency as Refuse the Call
- `26c313e` — Update Refuse the Call audio to latest version

### Mostly Yours

Current file: `audio/junkyard-cabaret/fits-and-starts.mp3`.

All seven audio versions are stored as fits-and-starts.mp3. The October 18 rename to Mostly Yours did not change the audio; the current recording was saved October 17.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Jul 3, 2026 · 10:24 AM | 3:46 | Earlier | `e7ec4f1` | `6e4448bd1be1935b2994978968848f0292279ff2` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-07-03.mp3) |
| Jul 4, 2026 · 5:00 PM | 3:32 | Earlier | `42e0d61` | `a2640e1d5b208c39b63796ffd3ee4ac62db41137` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-07-04.mp3) |
| Jul 5, 2026 · 3:44 PM | 3:58 | Earlier | `b1f305b` | `81834fd43cd4c81c54cb5561a30ea416e477e6c6` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-07-05.mp3) |
| Sep 27, 2026 · 11:48 AM | 5:19 | Earlier | `b54fec5` | `4a6fe9560f3a49666204b99a6a9c8d2c9700d8c2` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-09-27-1.mp3) |
| Sep 27, 2026 · 12:35 PM | 4:42 | Earlier | `9c6b01f` | `47ca41b3319cc3df42e456c9d08a14ae093d3116` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-09-27-2.mp3) |
| Sep 27, 2026 · 5:05 PM | 5:12 | Earlier | `aabe6d0` | `3e7f241079bf8d77acb2d46e83904ca9431c3c40` | [Listen](../audio/junkyard-cabaret/previous-takes/mostly-yours-2026-09-27-3.mp3) |
| Oct 17, 2026 · 11:16 AM | 3:16 | Current | `d1ed37a` | `8547a1647ddec5371bc9fa45eb7be41362bd9047` | [Listen](../audio/junkyard-cabaret/fits-and-starts.mp3) |

Commit descriptions:

- `e7ec4f1` — JC: restore Fits and Starts as 2nd-to-last in Act II; bump mp3 cache
- `42e0d61` — Replace Fits and Starts mp3 with new version; bump cache param
- `b1f305b` — Replace Fits and Starts mp3 with updated version; bump cache param
- `b54fec5` — JC: new cut of Fits and Starts (238.3s -> 319.2s)
- `9c6b01f` — JC: another new cut of Fits and Starts (319.2s -> 281.9s)
- `aabe6d0` — JC: another new cut of Fits and Starts (281.9s -> 312.4s)
- `d1ed37a` — Update Fits and Starts audio and cabaret title art

### Misdirected.

Current file: `audio/junkyard-cabaret/misdirected.mp3`.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Jul 5, 2026 · 12:24 PM | 2:58 | Earlier | `0069eb1` | `95c8878a50f66b791cabde25e17a690552af126d` | [Listen](../audio/junkyard-cabaret/previous-takes/misdirected-2026-07-05.mp3) |
| Aug 28, 2026 · 4:33 PM | 3:12 | Earlier | `2e86de0` | `2cf17b108ad38956d41f03df810464a5ccbe1d42` | [Listen](../audio/junkyard-cabaret/previous-takes/misdirected-2026-08-28.mp3) |
| Aug 29, 2026 · 1:37 PM | 3:13 | Earlier | `5c1256c` | `f4492dead55f5c50a46265c5bb040e38da02e67b` | [Listen](../audio/junkyard-cabaret/previous-takes/misdirected-2026-08-29.mp3) |
| Sep 27, 2026 · 11:37 AM | 3:35 | Earlier | `451a6af` | `59b4cc543d31f1456372a6624d93e7dac81cb980` | [Listen](../audio/junkyard-cabaret/previous-takes/misdirected-2026-09-27-1.mp3) |
| Sep 27, 2026 · 5:22 PM | 3:22 | Earlier | `2010892` | `54e8b1412344a5ed1383a5d1f85e0d79a5ffbac9` | [Listen](../audio/junkyard-cabaret/previous-takes/misdirected-2026-09-27-2.mp3) |
| Oct 17, 2026 · 4:15 PM | 3:17 | Current | `3107dfc` | `2eeb5f5e609e57182e81cc21b95a3c28c6907015` | [Listen](../audio/junkyard-cabaret/misdirected.mp3) |

Commit descriptions:

- `0069eb1` — Add "Misdirected." as final Act II track; swap Act I tracks 4 and 5
- `2e86de0` — JC: new cut of Misdirected. (177.6s -> 191.8s)
- `5c1256c` — JC: new cut of Misdirected. (191.8s -> 193.4s)
- `451a6af` — JC: new cut of Misdirected. (193.4s -> 214.8s)
- `2010892` — JC: another new cut of Misdirected. (214.8s -> 202.4s)
- `3107dfc` — JC: refresh Misdirected audio and art for the returning barker

### Scarce

Current file: `audio/junkyard-cabaret/scarce.mp3`.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Jul 11, 2026 · 3:14 PM | 4:38 | Earlier | `f5aad9a` | `5c972ab3a279a9b54c60811409f64c556ec4af5d` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/f5aad9a5d899384b9ab89423690cce4e0112cd8b/audio/junkyard-cabaret/scarce.mp3) |
| Jul 11, 2026 · 5:24 PM | 4:34 | Earlier | `efa1ef4` | `cfbd199fc099e695c6a67e2cb96f756e980b5178` | [Listen](../audio/junkyard-cabaret/previous-takes/scarce-2026-07-11-2.mp3) |
| Jul 12, 2026 · 3:52 PM | 4:47 | Current | `6b30114` | `b1c2f4056f566e7963b68fda50eba7acfadfbb7b` | [Listen](../audio/junkyard-cabaret/scarce.mp3) |

Commit descriptions:

- `f5aad9a` — JC: Scarce takes the stage as the encore — track 15, outside the acts
- `efa1ef4` — Update scarce.mp3
- `6b30114` — JC: swap in new Scarce mix, bump cache-bust to v=202607121551

### Slow the Clock

Current file: `audio/grief-without-ritual/slow-the-clock.mp3`.

Traced through its move to the mixtape and back on October 11. The March and October audio are distinct; the intervening folder moves do not create versions.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 4, 2026 · 2:05 PM | 2:38 | Earlier | `67e7ff0` | `b8c3227fab4eea2502ec49c0299b78dabf746f5e` | [Listen](../audio/grief-without-ritual/previous-takes/slow-the-clock-2026-03-04.mp3) |
| Oct 11, 2026 · 1:55 PM | 3:01 | Current | `a57de5d` | `c324dbabb3f574bd01205d76434649c41accfd0a` | [Listen](../audio/grief-without-ritual/slow-the-clock.mp3) |

Commit descriptions:

- `67e7ff0` — updated slow the clock
- `a57de5d` — Update Slow the Clock audio and visualizer

### When Doctrine Slips

Current file: `audio/grief-without-ritual/when-doctrine-slips.mp3`.

| First saved in Git (Chicago) | Duration | State | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 1, 2026 · 11:08 AM | 3:30 | Earlier | `ef2bc7c` | `1fd4010469220fe6555d89f2cc51c7c406936b32` | [Listen](../audio/grief-without-ritual/previous-takes/when-doctrine-slips-2026-03-01.mp3) |
| Oct 10, 2026 · 2:23 PM | 4:37 | Earlier | `9429ea6` | `d85a5b920da1541aacd9d18a2bc6d4929e363012` | [Listen](../audio/grief-without-ritual/previous-takes/when-doctrine-slips-2026-10-10.mp3) |
| Oct 11, 2026 · 10:19 AM | 4:07 | Current | `349a183` | `f5bea7e6506aa69bac5a51571ad501a59eece9b3` | [Listen](../audio/grief-without-ritual/when-doctrine-slips.mp3) |

Commit descriptions:

- `ef2bc7c` — I mean, I didn't say "new album"
- `9429ea6` — Update When Doctrine Slips audio and sharing description
- `349a183` — Update When Doctrine Slips audio and share description

## Current songs with no earlier saved audio found

**Junkyard Cabaret:** Pauses Gone, Three Fifteen, The New Survivalism, House Lights, Hip Height, How Dare It Rise, Everything Must Go, What You Get, Mind the Drop.

**Grief without Ritual:** Clear as Day, Underlined Once, Letter to the Editor, Love at Machine Speed, Permission to Ache, Respect the Exhale, Dearly Beloved, As We Speak It, From This Side of the Door, Haven't Heard From You Yet.

Take Your Time also has one stored recording and no earlier version; it has no songbook.

“No earlier saved audio” does not establish that no earlier version ever existed. Some commits describe an update or replacement but introduce the first tracked MP3. For example, Mostly Yours/Fits and Starts was added to the track list on June 13, while the first recoverable MP3 is from July 3. Everything Must Go was added June 7, but its first tracked MP3 is June 14. Git cannot recover the earlier untracked files from those commits.

## Former GWOR songs

These are separate songs, or songs that now live on the mixtape. None is attached to a current GWOR songbook by this audit.

### From the Beginning

Moved from GWOR to the mixtape on October 11. The 3:27 update later that day belongs to the mixtape period; the 2:43 recording was the GWOR-era audio.

| First saved in Git (Chicago) | Duration | Saved under | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 14, 2026 · 2:42 PM | 2:43 | `audio/exploring-laibor-mixtape/from-the-beginning.mp3`; `audio/grief-without-ritual/from-the-beginning.mp3` | `29e01a4` | `ebff964b6c162f0c30ba4ed9ed8dcfa19b550008` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/29e01a4eb3d5672fd7bf297440736944b90245de/audio/grief-without-ritual/from-the-beginning.mp3) |
| Oct 11, 2026 · 3:37 PM | 3:27 | `audio/exploring-laibor-mixtape/from-the-beginning.mp3` | `4870137` | `a10ffa44cbbd1acce33a6d560a9e52655d9f5b2e` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/4870137979a6ec9d110f11f6c5bf52b47084383b/audio/exploring-laibor-mixtape/from-the-beginning.mp3) |

### Scattered Thunderstorms

A former GWOR song, replaced in the track list by As We Speak It. These four recordings belong to Scattered Thunderstorms, not to As We Speak It.

| First saved in Git (Chicago) | Duration | Saved under | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Apr 18, 2026 · 4:04 PM | 4:53 | `audio/grief-without-ritual/scattered-thunderstorms.mp3` | `4b8a2b7` | `c1f68fc4a72f2eab6b9487f30b427e37f6abda61` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/4b8a2b79afac6131d6d1bdb7128dcf852bdadcc8/audio/grief-without-ritual/scattered-thunderstorms.mp3) |
| May 9, 2026 · 5:07 PM | 4:42 | `audio/grief-without-ritual/scattered-thunderstorms2.mp3` | `69ba0a8` | `2d6a8700a857e08342e3194c075243f868199e52` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/69ba0a814835ca00edd142ad3f27c33612190a95/audio/grief-without-ritual/scattered-thunderstorms2.mp3) |
| May 9, 2026 · 5:07 PM | 4:47 | `audio/grief-without-ritual/scattered-thunderstorms3.mp3` | `69ba0a8` | `45a7c70cbad3ffd0d02ff1c3c3d28ff695f5cadd` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/69ba0a814835ca00edd142ad3f27c33612190a95/audio/grief-without-ritual/scattered-thunderstorms3.mp3) |
| Jul 18, 2026 · 3:19 PM | 4:58 | `audio/grief-without-ritual/scattered-thunderstorms.mp3` | `08f5eef` | `4b82b464effc61f13fd3f0c2ecd078966bda474f` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/08f5eef9d55754319ced57938646d1b265d4d42a/audio/grief-without-ritual/scattered-thunderstorms.mp3) |

### Surviving Salem

A former GWOR song, replaced in the track list by Haven’t Heard From You Yet. It remains a separate song.

| First saved in Git (Chicago) | Duration | Saved under | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Jul 18, 2026 · 4:25 PM | 3:17 | `audio/grief-without-ritual/surviving-salem.mp3` | `a2e58e8` | `4e5ec45afcdd6c0c96f4a1bca3e1a686a42565b7` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/a2e58e84dceec4fca2bd58ed7fcd8eccd00c6f3f/audio/grief-without-ritual/surviving-salem.mp3) |

### Waiting for Something

Moved from GWOR to the mixtape on October 11. Only one distinct stored audio version was found.

| First saved in Git (Chicago) | Duration | Saved under | Source commit | Audio blob | Audio |
|---|---|---|---|---|---|
| Mar 1, 2026 · 11:08 AM | 3:10 | `audio/exploring-laibor-mixtape/waiting-for-something.mp3`; `audio/grief-without-ritual/waiting-for-something.mp3` | `ef2bc7c` | `6911d68d496b9ebafb91138df8799de0d744b508` | [Listen](https://raw.githubusercontent.com/charleswilke/dotcom/ef2bc7c103715fe9cd701e6553c9ab246b025b79/audio/grief-without-ritual/waiting-for-something.mp3) |

## Deduplication and title mapping notes

- **Mostly Yours:** All seven audio versions are stored as fits-and-starts.mp3. The October 18 rename to Mostly Yours did not change the audio; the current recording was saved October 17.
- **Morning's Flood:** Includes the March recording under Cherish Your Confident Ire in GWOR. The July 3 commit moves that song idea to Morning’s Flood in Junkyard Cabaret, matching the user-confirmed lineage.
- **Refuse the Call:** The first three versions use Refuse the Frequency. October 17 introduces Refuse the Call; October 18 updates its audio. Both titles are treated as one lineage.
- **What You Get:** The two Git blobs have identical compressed audio and identical decoded samples. The August 8 edit only corrects the ID3 title from What Do You Get? to What You Get. No previous take is counted.
- **Pauses Gone:** The former GWOR file and the current Junkyard Cabaret file have the same Git blob. The album move is not another take.
- **Slow the Clock:** Traced through its move to the mixtape and back on October 11. The March and October audio are distinct; the intervening folder moves do not create versions.
- **Clear as Day:** Moved from the mixtape to GWOR on October 11; the stored audio is unchanged.
- **Love at Machine Speed:** Traced from its earlier mixtape path to GWOR. Only one stored audio version was found.
- **Permission to Ache:** Moved from the mixtape to GWOR on October 11; the stored audio is unchanged.
- **Respect the Exhale:** The same stored audio disappears and returns to the GWOR path. Re-adding the same blob is not another take.

## Suggested next pass

Review the 31 candidates before choosing what to expose in Previous takes. Use the same-day version order or take numbers for the three September 27 Mostly Yours recordings and the two September 27 Refuse the Frequency recordings. Keep export/trim labels available for Why This Way rather than implying each is a newly performed take.

If earlier files exist outside Git, add the relevant local folders to the audit. That is the main remaining gap, particularly for songs whose first stored MP3 was already described as an update.
