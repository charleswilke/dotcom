# Adding a Song to Grief without Ritual

A step-by-step procedure for adding (or swapping) a track on the GWOR album.

---

## Files involved

| File | Purpose |
|------|---------|
| `main.js` | Track list & karaoke defaults |
| `audio/grief-without-ritual/[slug].mp3` | Audio file |
| `audio/grief-without-ritual/[slug].mp4` | Video file (mp4 or mov) |
| `songs/gwor/[slug]/index.html` | Song page (SEO + shareable redirect) |
| `lyrics/grief-without-ritual/[slug].json` | Karaoke sync data (optional) |

---

## Steps

### 1. Place audio/video files

Drop the `.mp3` and `.mp4` (or `.mov`) files into:

```
audio/grief-without-ritual/
```

File names become the slug — lowercase, hyphen-separated (e.g. `pauses-gone.mp3` → slug `pauses-gone`).

---

### 2. Edit the track list in `main.js`

Find `initGWORLightbox()` (~line 2333) and add an entry to the `tracks` array:

```js
{ title: 'Song Title', file: 'audio/grief-without-ritual/song-slug.mp3', video: 'audio/grief-without-ritual/song-slug.mp4', article: 'https://charleswilke.substack.com/p/your-post' },
```

- `title` — display name shown in the player
- `file` — path to the MP3
- `video` — path to the MP4/MOV (used in the lyrics video panel)
- `article` — Substack (or other) link; use a placeholder URL if not published yet

**To remove a song:** delete its entry from the array.

**Optional — special video framing:** if the video needs custom positioning in the lyrics panel, add a `lyricsVideoFrame` object (see `from-the-beginning` for an example).

---

### 3. Create the song page

Create `songs/gwor/[slug]/index.html` by copying an existing one and replacing:

- Every instance of the old title (display name)
- Every instance of the old slug in URLs and redirect targets

The page is a metadata wrapper + instant redirect to `/#gwor/[slug]`. It exists for SEO and social sharing.

---

### 4. (Optional) Add karaoke

If the song has word-level timing data:

1. Place the JSON file at `lyrics/grief-without-ritual/[slug].json`
2. In `main.js`, find `KARAOKE_DEFAULT_SLUGS` (~line 2452) and add the slug to the `Set` if karaoke should be on by default.

---

### 5. (Optional) Update the article link later

When the Substack post goes live, update the `article` value in the `tracks` array in `main.js`.

---

## Quick checklist

- [ ] `audio/grief-without-ritual/[slug].mp3` present
- [ ] `audio/grief-without-ritual/[slug].mp4` (or `.mov`) present
- [ ] Track entry added to `tracks` array in `main.js`
- [ ] Removed song's entry deleted from `tracks` array (if swapping)
- [ ] `songs/gwor/[slug]/index.html` created
- [ ] Karaoke JSON added (if applicable)
- [ ] `KARAOKE_DEFAULT_SLUGS` updated (if karaoke should be on by default)
- [ ] Article link updated once Substack post is live
