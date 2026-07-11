# DAVIAN Robotics — website

This is the source for [davian-robotics.github.io](https://davian-robotics.github.io), the public site for DAVIAN Robotics, the robotics research group of DAVIAN Lab at KAIST AI. It is a build-free static page: `index.html` plus `css/style.css`, `js/render.js`, `js/i18n.js`, and the data files under `data/` render everything — no bundler, no npm install, no dependencies. GitHub Pages serves the repository root as-is.

## Add a project

1. Put the demo clip and its poster frame in `assets/media/` (see Media rules below for encoding).
2. Copy the template object at the top of `data/projects.js` and fill it in. Delete any optional field you don't have:

   ```js
   {
     id: 'short-slug',                       // required, unique, lowercase
     title: 'PAPER: Full Title',             // required
     authors: ['pmh9960', 'Jane Doe (SNU)'], // required; ids link, plain strings do not
     venue: 'NeurIPS 2025',                  // optional, shown as a badge
     year: 2025,                             // required, sorts the grid (newest first); use venue year if present, else arXiv posting year
     tags: ['manipulation', 'vla'],          // optional, drives the filter chips
     media: {                                // optional; omit until the file exists
       type: 'video',                        // 'video' | 'image'
       src: 'assets/media/slug.mp4',
       poster: 'assets/media/slug.jpg',      // required when type is 'video'
     },
     summary: { en: 'One or two sentences.', ko: '한두 문장.' },  // en required, ko optional
     links: {                                // optional; a missing key renders no button
       paper: 'https://arxiv.org/abs/...',
       code: 'https://github.com/DAVIAN-Robotics/...',
       model: 'https://huggingface.co/DAVIAN-Robotics/...',
       data: 'https://huggingface.co/datasets/DAVIAN-Robotics/...',
       project: 'https://...',
     },
     featured: true,                         // optional; promotes it to the Highlights band
   }
   ```

   On `year`: use the year of the **accepted venue**, not the arXiv posting year — a paper posted in 2025 but accepted at CVPR 2026 gets `year: 2026`. Only fall back to the arXiv year when there is no venue yet. This field is what the grid sorts on, so getting it wrong misorders the whole page.

   None of the six projects currently on the site set `media`, so every card today falls back to a plain typographic tile (see `mediaHTML` in `js/render.js`). Adding a demo clip is the single most visible improvement a contributor can make.

3. If an author is new, decide whether they belong in `data/people.js`. An `authors` entry that matches a key in `window.PEOPLE` renders as a link everywhere the project appears; anything else renders as plain text (e.g. `'Jane Doe (SNU)'`). Only add someone to `PEOPLE` when you can point at a page that actually ties them to KAIST / DAVIAN / one of the lab's papers — Korean names collide constantly, and a wrong link under a real person's name is a real error, while leaving a name unlinked costs nothing. When in doubt, leave it as a plain string.

## Media rules

3–6 second loop, H.264 MP4, 2 MB or less, poster image required.

```bash
ffmpeg -i input.mov -t 6 -an -vf "scale=960:-2" -c:v libx264 -crf 28 -movflags +faststart assets/media/<slug>.mp4
ffmpeg -i assets/media/<slug>.mp4 -vframes 1 -q:v 3 assets/media/<slug>.jpg
```

Then check the size:

```bash
du -h assets/media/<slug>.mp4
```

Over 2 MB, raise `-crf` (e.g. to 30 or 32) and re-encode.

## Preview

Open `index.html` directly in a browser — no server needed. The data files (`data/people.js`, `data/projects.js`, `data/strings.js`) are loaded as plain `<script>` tags, not fetched, so `file://` works with no CORS issues. If you ever change that to a `fetch()`, this stops working from `file://` and a local server becomes mandatory.

If you'd rather use one anyway:

```bash
python3 -m http.server 8101
```

then visit `http://localhost:8101`.

## Before you open a PR

Open the page and check the browser console: it should be free of `render:` warnings (`js/render.js` logs one per project that's missing a required field, and that project is silently dropped from the grid). Then run the test suite:

```bash
node --test tests/
```

Node is needed only to run these tests — the site itself has no build step and no dependencies, and there is no `package.json`.

## Translations

The English text lives in `index.html` as the literal content of each node. To translate a string, add it to `data/strings.js` under `window.STRINGS.ko`, keyed by the matching `data-i18n="<key>"` attribute in `index.html`. A key that's missing from `strings.js` simply leaves the English text in place — nothing breaks.

## Deploy

Pushing to `main` publishes. There is no build step and no CI workflow — GitHub Pages serves the repository root directly.
