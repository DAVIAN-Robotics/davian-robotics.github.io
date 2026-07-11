# DAVIAN Robotics Website — Design Spec

Date: 2026-07-11
Repository: `DAVIAN-Robotics/davian-robotics.github.io`
Status: approved design, ready for implementation planning

## 1. Purpose and audience

DAVIAN Robotics is a sub-group of DAVIAN Lab (KAIST AI) working on Vision-Language-Action
models and robotic manipulation. Unlike a typical academic lab page, this group's output is
release-heavy: five active code repositories (EgoX 733★, PHUMA 228★, SimbaV2 107★, ACG 82★,
3D_HAMSTER), six models and fifty-nine datasets on HuggingFace.

The site's primary job is therefore a **research showcase**: make "what we built" immediately
visible, with demo video as the leading medium and paper/code/model links one click away.
Recruiting and group identity are secondary and are served by linking back into the parent lab
site rather than by duplicating its content.

Non-goals: a publication list that mirrors the parent lab's PUBLICATION page, a separate People
page, a per-project detail page, and any content management system.

## 2. Constraints

- **No build step.** GitHub Actions minutes are limited, so the repository must be servable
  as-is by GitHub Pages from the `main` branch root. No Node, no Ruby, no bundler.
- **White-toned palette** inherited from the parent lab site (davian.kaist.ac.kr); layout is
  otherwise free.
- **Responsive** on desktop and mobile.
- Site copy is **English by default**, with a Korean toggle. No mixed-language copy.
- Implementation must apply the `frontend-design` skill for visual quality.

## 3. Architecture

A single static page. Data lives in plain JavaScript files loaded before the renderer, so no
`fetch` is involved and `index.html` works when opened directly from the filesystem — no local
server needed for preview.

```
index.html          Single page: header, hero, section skeletons, footer
css/style.css       Design system, CSS custom properties
js/render.js        Renders repeating lists (project cards, author links) from data
js/i18n.js          EN/KR toggle: swaps text of [data-i18n] nodes
data/people.js      window.PEOPLE   — id → { name, url } dictionary
data/projects.js    window.PROJECTS — array of projects (the file people edit)
data/strings.js     window.STRINGS  — Korean translations of static copy
assets/media/       Demo videos, poster images
assets/logo/        Brand assets (see §6)
README.md           How to add a project (English)
```

**Static vs. rendered.** Everything that defines the site's identity — header, hero copy,
section headings, join/contact text, footer — is written as real HTML in `index.html`. JavaScript
only generates the repeating lists. If the JS fails or a crawler does not execute it, the page
still presents who the group is and how to reach them, in English, in the page source.

## 4. Data model

### `data/people.js`

One dictionary for every person the site can link to. Adding a person here makes their name
clickable everywhere it appears.

```js
window.PEOPLE = {
  "pmh9960":    { name: "Minho Park",  url: "https://pmh9960.github.io" },
  "godnpeter":  { name: "Peter Kim",   url: "https://..." },
  "jaegulchoo": { name: "Jaegul Choo", url: "https://sites.google.com/site/jaegulchoo/" },
};
```

### `data/projects.js`

```js
window.PROJECTS = [
  {
    id: "phuma",                                  // required, unique, used as DOM id
    title: "PHUMA: Physically Reliable Humanoid Locomotion",   // required
    authors: ["godnpeter", "pmh9960", "Jane Doe (SNU)"],       // required
    venue: "NeurIPS 2025",                        // optional, rendered as a badge
    year: 2025,                                   // required, sorts the grid
    tags: ["humanoid", "dataset"],                // optional, drives the filter chips
    media: {                                      // optional
      type: "video",                              // "video" | "image"
      src: "assets/media/phuma.mp4",
      poster: "assets/media/phuma.jpg",           // required when type === "video"
    },
    summary: { en: "...", ko: "..." },            // required (en); ko optional
    links: {                                      // optional; only present keys render buttons
      paper: "https://arxiv.org/abs/2510.26236",
      code:  "https://github.com/DAVIAN-Robotics/PHUMA",
      model: "https://huggingface.co/DAVIAN-Robotics/PHUMA",
      data:  null,
      project: null,
    },
    featured: true,                               // optional; promotes to the Highlights band
  },
];
```

**Author linking rule.** Each entry of `authors` is looked up in `window.PEOPLE`. If it matches a
key, the person's `name` is rendered as a link to their `url`. If it does not match, the string is
rendered verbatim as plain text. This lets lab members get automatic personal links while external
co-authors are written inline as `"Jane Doe (SNU)"`.

**Link rule.** Keys of `links` that are absent or `null` produce no button. Button labels are fixed:
Paper, Code, Model, Data, Project.

**Media rule.** `media.type: "video"` renders a muted, looping, inline `<video>` with the poster as
its still frame. `"image"` renders an `<img>`. When `media` is absent, the card falls back to a
typographic layout (large title on tinted background) so a missing asset never produces a broken card.

### `data/strings.js`

```js
window.STRINGS = {
  ko: {
    "hero.tagline": "KAIST AI의 Vision-Language-Action 모델 및 로봇 조작 연구 그룹",
    "section.research": "연구",
    // ... one key per [data-i18n] node in index.html
  },
};
```

## 5. Page layout

One scrolling page, in this order.

**Header** (sticky, thin). Left: the horizontal logo (height ~32px), linking to the top of the page,
followed by a small text link to davian.kaist.ac.kr — affiliation stays visible and traffic flows back
to the parent lab. The logo already reads "DAVIAN ROBOTICS", so no wordmark is typeset beside it. Right:
anchor links (Research, Releases, Team, Join), GitHub and HuggingFace icons, and an `EN | KR`
toggle. On mobile the anchors collapse; the icons and the toggle remain.

**Hero** (split). Left half: a looping demo video (`muted`, `autoplay`, `loop`, `playsinline`).
Right half: white background with the group name, a one-line identity statement, and GitHub /
HuggingFace buttons. On mobile the two halves stack, video first. A full-bleed video with overlaid
text was rejected: it fights the inherited white palette and its legibility depends on the clip.

**Highlights.** Projects with `featured: true` (expect 3–4) rendered as large cards.

**Research.** Every project as a smaller card in a grid, newest first. Above the grid, tag filter
chips (All plus each distinct tag). Filtering is a client-side toggle with no navigation.

**Releases.** A band that makes the group's open-science output explicit: three counts
(code releases, models, datasets) with links to the GitHub and HuggingFace organizations. The counts are
static copy written directly in `index.html`, not fetched from any API; they are approximate figures
refreshed by hand, not a live mirror of the organizations.

There is no News section. Announcements live on the parent lab's NEWS/GALLERY page, and a section that
must be updated on every acceptance is the first thing a lab site lets go stale.

**Team.** A thin section, not a page. PI and members rendered as a list of linked names pulled from
`window.PEOPLE`, followed by "See the full DAVIAN Lab team →" pointing at the parent PEOPLE page.
The sub-group's membership is fluid, so the site deliberately avoids asserting a hard roster.

**Join / Contact.** A short paragraph, a link to the parent lab's JOIN US page, and a contact email.

**Footer.** KAIST AI, parent lab link, GitHub, HuggingFace.

## 6. Visual system

### Brand assets

The group has an existing logo, committed at:

- `assets/logo/davian-robotics-horizontal.png` (2247×921, transparent) — header wordmark
- `assets/logo/davian-robotics-square.png` (376×376, transparent) — favicon and Open Graph image
- `assets/logo/kaist-ai.svg` — KAIST AI mark, footer affiliation only (the only vector asset, so it
  stays crisp at any size)

The logo is a node-and-link graph in deep purple, pink, salmon, and sand, above a `DAVIAN` wordmark
whose letters carry those same four hues, with `ROBOTICS` beneath. The node-link motif is reused as a
subtle section marker and as a faint background pattern behind the hero's typographic half, so the
brand extends into the layout instead of sitting on it as a sticker.

### Color

White base (`#ffffff`), tinted section band (`#f7f8f9`), body text (`#16181d`), muted text (`#6b7280`),
hairline borders (`#e5e7eb`).

A single accent — **the logo's deep purple `#4A3372`** — used only for links, the active filter chip,
button hover, and section markers. The accent is taken from the logo rather than from KAIST's
institutional blue: the logo contains no blue at all, and a blue accent beside a purple/pink/salmon
wordmark in a permanently visible header reads as two brands stapled together. KAIST blue appears
nowhere on the site except inside the KAIST AI logo in the footer, where it belongs.

The logo's salmon and sand are held in reserve. They are not part of the interactive palette; at most
they tint a decorative node in the hero motif. Restricting interaction to one hue keeps the page calm
even though the video thumbnails are individually busy.

All values are declared as CSS custom properties (`--accent`, `--bg`, `--fg`, ...) so a rebrand is a
one-line change.

**Typography.** A single sans-serif family (Inter with a system fallback stack) for both headings and
body. Serif was rejected: it reads as generic-academic against robotics demos, and Korean serif
rendering is inconsistent across platforms. Hierarchy comes from size contrast — a large tight hero
title, 16–17px body, small muted metadata for venue and authors.

**Cards.** Separated by a 1px border and generous whitespace rather than drop shadows, which look
muddy under video thumbnails. On hover the border takes the accent color and the video plays. Card
order: media → title → venue badge → authors → link buttons.

**Responsive.** Three breakpoints: mobile (single column, stacked hero), tablet (two columns),
desktop (three columns, 1200px max-width container). The grid uses
`repeat(auto-fill, minmax(320px, 1fr))` so intermediate widths degrade gracefully.

**Motion.** Restrained: a fade-in as cards enter the viewport. Card videos play on hover on desktop
and via `IntersectionObserver` on mobile, where only the card currently in view plays and the rest are
paused, protecting data and battery. `prefers-reduced-motion` disables playback and pins each card to
its poster image.

**Performance.** Demo video is the main risk to page weight. Every card video uses `preload="none"`
with a required poster and loads only when playback begins; the hero video uses `preload="metadata"`.
The README mandates the encoding budget: 3–6 second loop, H.264 MP4, ≤2 MB.

## 7. Robustness without a build step

There is no schema validation, so the renderer must be defensive. `render.js` skips any project
missing a required field (`id`, `title`, `authors`, `year`, `summary.en`) instead of throwing, and
emits a `console.warn` naming the offending `id` and the missing field. One malformed entry never
prevents the remaining cards from rendering. Contributors are told in the README to open the page and
check the console for warnings before opening a pull request.

## 8. Internationalization

`index.html` carries English copy as its literal content, with `data-i18n="<key>"` attributes on every
translatable node. `js/i18n.js` reads `window.STRINGS.ko` and swaps text content when the user selects
KR; the choice persists in `localStorage` and can be deep-linked with `?lang=ko`. Project titles,
author names, and venues stay in English in both modes; only static copy, `summary`, and news text are
translated.

This keeps a single HTML file. The rejected alternative — `index.html` plus `ko/index.html` — gives each
language a real URL but duplicates the markup, and duplicated lab pages reliably drift out of sync.
The accepted cost is that the Korean view is not separately indexed by search engines, which is
acceptable for a site people reach by name.

## 9. Deployment

GitHub Pages serves the `main` branch root. No workflow file, so no Actions minutes are consumed. The
site is published at `https://davian-robotics.github.io`. A custom domain would require only a `CNAME`
file.

## 10. Contributor documentation (`README.md`, English)

The README is the safety net that replaces the build step. It covers: adding a project (drop media in
`assets/media/`, append an object to `data/projects.js`, add any new author to `data/people.js`), the
annotated template object at the top of `data/projects.js`, required versus optional fields, the media
encoding budget, how to preview locally (open `index.html`), and the pre-PR check (no console warnings).
