# DAVIAN Robotics Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a build-free static single-page showcase for DAVIAN Robotics at `https://davian-robotics.github.io`, driven by hand-edited JavaScript data files.

**Architecture:** `index.html` carries all static English copy and section skeletons. `data/*.js` files assign plain objects to `window` globals and are loaded before `js/render.js`, which generates only the repeating lists (project cards, author links, filter chips). `js/i18n.js` swaps `[data-i18n]` text nodes for the Korean toggle. No `fetch`, so the page works when opened directly from disk. GitHub Pages serves the `main` branch root with no workflow.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, CSS Grid), vanilla ES2015+ JavaScript. Tests use Node's built-in `node --test` runner (dev-time only; zero dependencies, no `package.json`, never required to deploy or to add a project).

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from `docs/superpowers/specs/2026-07-11-davian-robotics-site-design.md`.

- **No build step.** No `package.json`, no bundler, no transpiler, no GitHub Actions workflow. The repository is served as-is from the `main` branch root.
- **No `fetch`, no ES modules.** Data files assign to `window` globals and are loaded with plain `<script>` tags, so `index.html` works from `file://`.
- **Site copy is English.** Korean exists only as translation values inside `data/strings.js`. No mixed-language copy anywhere in `index.html`.
- **Accent color is `#4A3372`** (the logo's deep purple), used only for links, the active filter chip, button hover, and section markers. KAIST blue appears nowhere except inside `assets/logo/kaist-ai.svg` in the footer.
- **Palette:** background `#ffffff`, tinted band `#f7f8f9`, body text `#16181d`, muted text `#6b7280`, borders `#e5e7eb`. All declared as CSS custom properties.
- **Typography:** one sans-serif family — Inter with a system fallback stack. No serif.
- **Cards** use a 1px border and whitespace, never drop shadows.
- **Layout:** 1200px max-width container; grid is `repeat(auto-fill, minmax(320px, 1fr))`; three breakpoints (mobile 1 column, tablet 2, desktop 3).
- **Video:** every card video uses `preload="none"` with a required `poster`; the hero video uses `preload="metadata"`. Cards play on hover (desktop) and via `IntersectionObserver` (mobile, one at a time). `prefers-reduced-motion` disables playback and pins each card to its poster.
- **Media budget (README rule):** 3–6 second loop, H.264 MP4, ≤2 MB.
- **Renderer is defensive:** a project missing a required field (`id`, `title`, `authors`, `year`, `summary.en`) is skipped, not thrown on, and emits a `console.warn` naming the offending `id` and the missing field. One malformed entry never blocks the remaining cards.
- **Author linking rule:** each entry of `authors` is looked up in `window.PEOPLE`. A key match renders the person's `name` as a link to their `url`; a non-match renders the string verbatim as plain text.
- **Link rule:** keys of `links` that are absent or `null` render no button. Button labels are fixed: Paper, Code, Model, Data, Project.
- **No News section.** Announcements stay on the parent lab's NEWS/GALLERY page.
- A static server is already running on port 8101 serving the repository root: `http://localhost:8101`. Do not start another one.
- **Never fabricate a person's name, an author list, or a paper venue.** Every such value must come from a source fetched during the task (arXiv, GitHub, HuggingFace). If a value cannot be sourced, leave the optional field out; if a required field cannot be sourced, stop and ask the user.

---

### Task 1: Data layer

Creates the three data files and the regression net that keeps contributors from breaking them.

**Files:**
- Create: `data/people.js`
- Create: `data/projects.js`
- Create: `data/strings.js`
- Create: `tests/data.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `window.PEOPLE` — `Record<string, { name: string, url: string }>`
  - `window.PROJECTS` — `Array<Project>` where
    `Project = { id: string, title: string, authors: string[], year: number, summary: { en: string, ko?: string }, venue?: string, tags?: string[], media?: { type: "video"|"image", src: string, poster?: string }, links?: { paper?: string, code?: string, model?: string, data?: string, project?: string }, featured?: boolean }`
  - `window.STRINGS` — `{ ko: Record<string, string> }`

- [ ] **Step 1: Source the real content — do not invent it**

Fetch each of these and record what you find. These are the only permitted sources for names, author lists, venues, and links:

- `https://github.com/DAVIAN-Robotics` — repository list, descriptions, member handles
- `https://github.com/DAVIAN-Robotics/EgoX`, `.../PHUMA`, `.../SimbaV2`, `.../ACG`, `.../3D_HAMSTER` — each README's title, author list, arXiv link, project page link
- `https://arxiv.org/abs/2510.26236` (PHUMA) and `https://arxiv.org/abs/2510.22201` (ACG) — authoritative title and author list
- `https://huggingface.co/DAVIAN-Robotics` — model and dataset URLs to use as `links.model` / `links.data`
- `https://github.com/<handle>` for each member handle (`godnpeter`, `junhahyung`, `pmh9960`, `myyzzzoooo`, `kyungminn`) — the display name and the personal website link on the profile

Two facts are already known and need no fetch: `pmh9960` is **Minho Park** (`https://pmh9960.github.io`), and the PI is **Jaegul Choo** (`https://sites.google.com/site/jaegulchoo/`).

If a GitHub profile shows no real name, omit that handle from `PEOPLE` entirely and write the author as plain text in `projects.js` instead. An unlinked correct name beats a linked wrong one.

- [ ] **Step 2: Write the failing test**

Create `tests/data.test.js`. It loads the data files into a fake browser global and asserts the invariants a contributor could break.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

/** Evaluate the data scripts in a sandbox that looks like a browser window. */
function loadData() {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['data/people.js', 'data/projects.js', 'data/strings.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox;
}

const REQUIRED = ['id', 'title', 'authors', 'year', 'summary'];

test('every person has a name and a url', () => {
  const { PEOPLE } = loadData();
  assert.ok(Object.keys(PEOPLE).length > 0, 'PEOPLE is empty');
  for (const [id, person] of Object.entries(PEOPLE)) {
    assert.ok(person.name, `${id}: missing name`);
    assert.match(person.url, /^https?:\/\//, `${id}: url must be absolute`);
  }
});

test('every project has the required fields', () => {
  const { PROJECTS } = loadData();
  assert.ok(PROJECTS.length > 0, 'PROJECTS is empty');
  for (const p of PROJECTS) {
    for (const field of REQUIRED) {
      assert.ok(p[field] !== undefined && p[field] !== null, `${p.id}: missing ${field}`);
    }
    assert.ok(Array.isArray(p.authors) && p.authors.length > 0, `${p.id}: authors must be a non-empty array`);
    assert.ok(typeof p.summary.en === 'string' && p.summary.en.length > 0, `${p.id}: summary.en is required`);
  }
});

test('project ids are unique', () => {
  const { PROJECTS } = loadData();
  const ids = PROJECTS.map((p) => p.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'duplicate project id');
});

test('a video needs a poster and every media path stays local', () => {
  const { PROJECTS } = loadData();
  for (const p of PROJECTS) {
    if (!p.media) continue;
    assert.ok(['video', 'image'].includes(p.media.type), `${p.id}: media.type must be video or image`);
    assert.match(p.media.src, /^assets\/media\//, `${p.id}: media.src must live under assets/media/`);
    if (p.media.type === 'video') {
      assert.ok(p.media.poster, `${p.id}: a video needs a poster`);
    }
  }
});

test('every link is an absolute url', () => {
  const { PROJECTS } = loadData();
  for (const p of PROJECTS) {
    for (const [key, url] of Object.entries(p.links || {})) {
      if (url === null || url === undefined) continue;
      assert.match(url, /^https?:\/\//, `${p.id}: links.${key} must be absolute`);
    }
  }
});

test('exactly the featured projects are marked, and there are three or four', () => {
  const { PROJECTS } = loadData();
  const featured = PROJECTS.filter((p) => p.featured);
  assert.ok(featured.length >= 3 && featured.length <= 4, `expected 3-4 featured projects, got ${featured.length}`);
});

test('every Korean string key is a string', () => {
  const { STRINGS } = loadData();
  assert.ok(STRINGS.ko, 'STRINGS.ko is missing');
  for (const [key, value] of Object.entries(STRINGS.ko)) {
    assert.strictEqual(typeof value, 'string', `STRINGS.ko.${key} must be a string`);
  }
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module` / `ENOENT: no such file or directory, open '.../data/people.js'`

- [ ] **Step 4: Write `data/people.js`**

Use the names and URLs sourced in Step 1. This is the shape; the entries are whatever Step 1 actually found.

```js
/* Every person the site can link to.
 *
 * The key is the id you write in a project's `authors` array.
 * Adding someone here makes their name a link everywhere it appears.
 * A name in `authors` that is NOT a key here renders as plain text —
 * that is how external co-authors are written, e.g. "Jane Doe (SNU)".
 */
window.PEOPLE = {
  jaegulchoo: { name: 'Jaegul Choo', url: 'https://sites.google.com/site/jaegulchoo/' },
  pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' },
  // ... one entry per member handle whose real name Step 1 resolved
};
```

- [ ] **Step 5: Write `data/projects.js`**

Newest first. Mark the three or four strongest as `featured: true` — EgoX (733★), PHUMA (228★), and SimbaV2 (107★) are the obvious ones by reach; add ACG (82★) if you want four.

Do not reference a file under `assets/media/` that does not exist yet: leave `media` out of a project until its video is committed. The renderer falls back to a typographic card, which is a correct-looking state, not a broken one.

```js
/* The project list. This is the file you edit when a paper lands.
 *
 * Template — copy this object, fill it in, delete the fields you do not have:
 *
 *   {
 *     id: 'short-slug',                       // required, unique, lowercase
 *     title: 'PAPER: Full Title',             // required
 *     authors: ['pmh9960', 'Jane Doe (SNU)'], // required; ids link, plain strings do not
 *     venue: 'NeurIPS 2025',                  // optional, shown as a badge
 *     year: 2025,                             // required, sorts the grid (newest first)
 *     tags: ['manipulation', 'vla'],          // optional, drives the filter chips
 *     media: {                                // optional; omit until the file exists
 *       type: 'video',                        // 'video' | 'image'
 *       src: 'assets/media/slug.mp4',
 *       poster: 'assets/media/slug.jpg',      // required when type is 'video'
 *     },
 *     summary: { en: 'One or two sentences.', ko: '한두 문장.' },  // en required, ko optional
 *     links: {                                // optional; a missing key renders no button
 *       paper: 'https://arxiv.org/abs/...',
 *       code: 'https://github.com/DAVIAN-Robotics/...',
 *       model: 'https://huggingface.co/DAVIAN-Robotics/...',
 *       data: 'https://huggingface.co/datasets/DAVIAN-Robotics/...',
 *       project: 'https://...',
 *     },
 *     featured: true,                         // optional; promotes it to the Highlights band
 *   }
 *
 * Media budget: 3-6 second loop, H.264 MP4, 2 MB or less, poster image required.
 */
window.PROJECTS = [
  // one object per project, filled from the sources in Step 1
];
```

- [ ] **Step 6: Write `data/strings.js`**

Only the keys that `index.html` will actually carry. Task 5 adds the `data-i18n` attributes that consume them; keep the two in sync.

```js
/* Korean translations of the site's static copy.
 *
 * The English text lives in index.html as the literal content of each node.
 * Each key here matches a data-i18n="<key>" attribute there.
 * A key that is missing simply leaves the English text in place.
 */
window.STRINGS = {
  ko: {
    'hero.tagline': 'KAIST AI의 Vision-Language-Action 모델 및 로봇 조작 연구 그룹',
    'hero.blurb': '...',
    'nav.research': '연구',
    'nav.releases': '공개 자료',
    'nav.team': '구성원',
    'nav.join': '함께하기',
    'section.highlights': '주요 연구',
    'section.research': '연구',
    'section.releases': '공개 자료',
    'section.team': '구성원',
    'section.join': '함께하기',
    'filter.all': '전체',
    'team.more': 'DAVIAN Lab 전체 구성원 보기 →',
    'join.body': '...',
    'links.paper': '논문',
    'links.code': '코드',
    'links.model': '모델',
    'links.data': '데이터',
    'links.project': '프로젝트',
  },
};
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — `# pass 7`, `# fail 0`

- [ ] **Step 8: Commit**

```bash
git add data tests
git commit -m "feat: add people, projects, and strings data with invariant tests"
```

---

### Task 2: Renderer core (pure functions)

All of `render.js`'s logic, testable without a DOM. Task 4 wires it to the page.

**Files:**
- Create: `js/render.js`
- Create: `tests/render.test.js`

**Interfaces:**
- Consumes: `window.PEOPLE`, `window.PROJECTS` from Task 1.
- Produces: `window.DR` —
  - `validateProject(project) -> { ok: boolean, missing: string[] }`
  - `validProjects(projects) -> Project[]` (skips invalid, `console.warn`s each)
  - `sortProjects(projects) -> Project[]` (year descending, then title ascending)
  - `collectTags(projects) -> string[]` (distinct, alphabetical)
  - `filterProjects(projects, tag) -> Project[]` (`tag === 'all'` returns all)
  - `authorsHTML(authors, people) -> string`
  - `linksHTML(links) -> string`
  - `mediaHTML(media, title) -> string`
  - `cardHTML(project, people, opts) -> string` (`opts.featured` selects the large variant)
  - `escapeHTML(value) -> string`

- [ ] **Step 1: Write the failing test**

Create `tests/render.test.js`.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadRenderer() {
  const warnings = [];
  const sandbox = { console: { warn: (...args) => warnings.push(args.join(' ')) } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8'), sandbox, {
    filename: 'js/render.js',
  });
  return { DR: sandbox.DR, warnings };
}

const PEOPLE = {
  pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' },
};

const PROJECT = {
  id: 'phuma',
  title: 'PHUMA',
  authors: ['pmh9960', 'Jane Doe (SNU)'],
  venue: 'NeurIPS 2025',
  year: 2025,
  tags: ['humanoid', 'dataset'],
  summary: { en: 'A humanoid locomotion dataset.' },
  links: { paper: 'https://arxiv.org/abs/2510.26236', code: null },
};

test('a complete project validates', () => {
  const { DR } = loadRenderer();
  assert.deepStrictEqual(DR.validateProject(PROJECT), { ok: true, missing: [] });
});

test('a project missing required fields reports every one of them', () => {
  const { DR } = loadRenderer();
  const result = DR.validateProject({ id: 'broken', title: 'T' });
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.missing.sort(), ['authors', 'summary.en', 'year']);
});

test('an invalid project is skipped and warned about, and the valid ones survive', () => {
  const { DR, warnings } = loadRenderer();
  const kept = DR.validProjects([PROJECT, { id: 'broken', title: 'T' }]);
  assert.deepStrictEqual(kept.map((p) => p.id), ['phuma']);
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /broken/);
  assert.match(warnings[0], /authors/);
});

test('projects sort newest first, then by title', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'b', title: 'B', year: 2024 },
    { ...PROJECT, id: 'c', title: 'C', year: 2026 },
    { ...PROJECT, id: 'a', title: 'A', year: 2026 },
  ]);
  assert.deepStrictEqual(sorted.map((p) => p.id), ['a', 'c', 'b']);
});

test('tags are collected distinct and alphabetical', () => {
  const { DR } = loadRenderer();
  const tags = DR.collectTags([PROJECT, { ...PROJECT, id: 'x', tags: ['vla', 'humanoid'] }]);
  assert.deepStrictEqual(tags, ['dataset', 'humanoid', 'vla']);
});

test('filtering by a tag keeps only matching projects; all keeps everything', () => {
  const { DR } = loadRenderer();
  const other = { ...PROJECT, id: 'x', tags: ['vla'] };
  assert.deepStrictEqual(DR.filterProjects([PROJECT, other], 'vla').map((p) => p.id), ['x']);
  assert.strictEqual(DR.filterProjects([PROJECT, other], 'all').length, 2);
});

test('a known author becomes a link and an unknown one stays plain text', () => {
  const { DR } = loadRenderer();
  const html = DR.authorsHTML(PROJECT.authors, PEOPLE);
  assert.match(html, /<a [^>]*href="https:\/\/pmh9960\.github\.io"[^>]*>Minho Park<\/a>/);
  assert.match(html, /Jane Doe \(SNU\)/);
  assert.doesNotMatch(html, /<a[^>]*>Jane Doe/);
});

test('only present links render buttons, with fixed labels', () => {
  const { DR } = loadRenderer();
  const html = DR.linksHTML(PROJECT.links);
  assert.match(html, />Paper</);
  assert.doesNotMatch(html, />Code</);
  assert.doesNotMatch(html, />Model</);
});

test('linksHTML tolerates a missing links object', () => {
  const { DR } = loadRenderer();
  assert.strictEqual(DR.linksHTML(undefined), '');
});

test('a video renders with preload none and its poster', () => {
  const { DR } = loadRenderer();
  const html = DR.mediaHTML(
    { type: 'video', src: 'assets/media/phuma.mp4', poster: 'assets/media/phuma.jpg' },
    'PHUMA'
  );
  assert.match(html, /<video[^>]*preload="none"/);
  assert.match(html, /poster="assets\/media\/phuma\.jpg"/);
  assert.match(html, /muted/);
  assert.match(html, /playsinline/);
});

test('absent media falls back to a typographic card, not a broken tag', () => {
  const { DR } = loadRenderer();
  const html = DR.mediaHTML(undefined, 'PHUMA');
  assert.doesNotMatch(html, /<video|<img/);
  assert.match(html, /card__fallback/);
});

test('a card carries its id, title, venue, authors, and summary', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(PROJECT, PEOPLE, {});
  assert.match(html, /data-project-id="phuma"/);
  assert.match(html, /PHUMA/);
  assert.match(html, /NeurIPS 2025/);
  assert.match(html, /Minho Park/);
  assert.match(html, /A humanoid locomotion dataset\./);
});

test('the featured variant is marked so CSS can enlarge it', () => {
  const { DR } = loadRenderer();
  assert.match(DR.cardHTML(PROJECT, PEOPLE, { featured: true }), /card--featured/);
});

test('user-supplied text is escaped, so a stray angle bracket cannot inject markup', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(
    { ...PROJECT, id: 'xss', title: '<img src=x onerror=alert(1)>' },
    PEOPLE,
    {}
  );
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/render.test.js`
Expected: FAIL — `ENOENT: no such file or directory, open '.../js/render.js'`

- [ ] **Step 3: Write `js/render.js`**

The IIFE takes the global object, so the same file runs in the browser (where the global is `window`) and in the test sandbox. The DOM wiring at the bottom is added in Task 4; for now the file only defines and exports the pure functions.

```js
/* Renders the repeating lists from the data files.
 * Static copy lives in index.html — this file never generates it.
 */
(function (global) {
  'use strict';

  var REQUIRED = ['id', 'title', 'authors', 'year', 'summary.en'];
  var LINK_LABELS = { paper: 'Paper', code: 'Code', model: 'Model', data: 'Data', project: 'Project' };
  var LINK_ORDER = ['paper', 'code', 'model', 'data', 'project'];

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function has(project, field) {
    if (field === 'summary.en') {
      return !!(project.summary && typeof project.summary.en === 'string' && project.summary.en);
    }
    var value = project[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }

  function validateProject(project) {
    var missing = REQUIRED.filter(function (field) {
      return !has(project, field);
    });
    return { ok: missing.length === 0, missing: missing };
  }

  function validProjects(projects) {
    return (projects || []).filter(function (project) {
      var result = validateProject(project);
      if (!result.ok) {
        console.warn(
          'render: skipping project "' + (project && project.id ? project.id : '(no id)') +
            '" — missing required field(s): ' + result.missing.join(', ')
        );
      }
      return result.ok;
    });
  }

  function sortProjects(projects) {
    return projects.slice().sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      return String(a.title).localeCompare(String(b.title));
    });
  }

  function collectTags(projects) {
    var seen = {};
    projects.forEach(function (project) {
      (project.tags || []).forEach(function (tag) {
        seen[tag] = true;
      });
    });
    return Object.keys(seen).sort();
  }

  function filterProjects(projects, tag) {
    if (!tag || tag === 'all') return projects.slice();
    return projects.filter(function (project) {
      return (project.tags || []).indexOf(tag) !== -1;
    });
  }

  function authorsHTML(authors, people) {
    var dict = people || {};
    return (authors || [])
      .map(function (entry) {
        var person = dict[entry];
        if (!person) return escapeHTML(entry);
        return (
          '<a class="author" href="' + escapeHTML(person.url) + '" target="_blank" rel="noopener">' +
          escapeHTML(person.name) +
          '</a>'
        );
      })
      .join(', ');
  }

  function linksHTML(links) {
    if (!links) return '';
    return LINK_ORDER.filter(function (key) {
      return links[key];
    })
      .map(function (key) {
        return (
          '<a class="btn btn--link" href="' + escapeHTML(links[key]) + '" target="_blank" rel="noopener">' +
          '<span data-i18n="links.' + key + '">' + LINK_LABELS[key] + '</span></a>'
        );
      })
      .join('');
  }

  function mediaHTML(media, title) {
    if (!media || !media.src) {
      return '<div class="card__media card__fallback" aria-hidden="true"><span>' + escapeHTML(title) + '</span></div>';
    }
    if (media.type === 'image') {
      return (
        '<div class="card__media"><img src="' + escapeHTML(media.src) + '" alt="' + escapeHTML(title) +
        '" loading="lazy"></div>'
      );
    }
    return (
      '<div class="card__media">' +
      '<video preload="none" poster="' + escapeHTML(media.poster || '') + '" muted loop playsinline ' +
      'src="' + escapeHTML(media.src) + '" aria-label="' + escapeHTML(title) + ' demo"></video>' +
      '</div>'
    );
  }

  function cardHTML(project, people, opts) {
    var options = opts || {};
    var classes = 'card' + (options.featured ? ' card--featured' : '');
    var venue = project.venue
      ? '<span class="card__venue">' + escapeHTML(project.venue) + '</span>'
      : '';
    return (
      '<article class="' + classes + '" data-project-id="' + escapeHTML(project.id) + '">' +
      mediaHTML(project.media, project.title) +
      '<div class="card__body">' +
      '<h3 class="card__title">' + escapeHTML(project.title) + '</h3>' +
      venue +
      '<p class="card__authors">' + authorsHTML(project.authors, people) + '</p>' +
      '<p class="card__summary" data-summary-en="' + escapeHTML(project.summary.en) + '" ' +
      'data-summary-ko="' + escapeHTML(project.summary.ko || '') + '">' +
      escapeHTML(project.summary.en) +
      '</p>' +
      '<div class="card__links">' + linksHTML(project.links) + '</div>' +
      '</div>' +
      '</article>'
    );
  }

  global.DR = {
    escapeHTML: escapeHTML,
    validateProject: validateProject,
    validProjects: validProjects,
    sortProjects: sortProjects,
    collectTags: collectTags,
    filterProjects: filterProjects,
    authorsHTML: authorsHTML,
    linksHTML: linksHTML,
    mediaHTML: mediaHTML,
    cardHTML: cardHTML,
  };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — all Task 1 and Task 2 tests, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add js/render.js tests/render.test.js
git commit -m "feat: add renderer core with author linking, validation, and filtering"
```

---

### Task 3: Page skeleton and design system

The visual identity. This is the task where design quality is decided.

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `.nojekyll`
- Create: `assets/media/.gitkeep`

**Interfaces:**
- Consumes: `assets/logo/davian-robotics-horizontal.png`, `assets/logo/davian-robotics-square.png`, `assets/logo/kaist-ai.svg` (already committed).
- Produces: the DOM contract Task 4 and Task 5 depend on —
  - `#highlights-grid` — container the featured cards are rendered into
  - `#research-grid` — container all cards are rendered into
  - `#filter-chips` — container the tag chips are rendered into
  - `#team-list` — container the member name links are rendered into
  - `#lang-toggle` — the `EN | KR` control
  - `.hero__video` — the hero `<video>` element
  - Every translatable static node carries `data-i18n="<key>"`

- [ ] **Step 1: Invoke the frontend-design skill**

Before writing any CSS, invoke the `frontend-design` skill and apply its guidance to this page. The spec's palette, typography, and card rules in Global Constraints are hard requirements the skill must work within, not suggestions it may override.

- [ ] **Step 2: Write `index.html`**

All copy is English and literal — a crawler or a JS-disabled browser sees the real content. `data-i18n` keys mark what Task 5 can translate. Containers are empty; Task 4 fills them.

Structure, in order:

1. `<head>`: `<title>DAVIAN Robotics — KAIST AI</title>`, meta description, `<link rel="icon" href="assets/logo/davian-robotics-square.png">`, Open Graph tags (`og:title`, `og:description`, `og:image` → `assets/logo/davian-robotics-square.png`, `og:url` → `https://davian-robotics.github.io`), `<link rel="stylesheet" href="css/style.css">`, and the Inter webfont **self-hosted or omitted** — do not add a third-party font CDN, which would make the page depend on a network the spec does not assume. If Inter is not committed as a local file, the system stack alone is correct.
2. `<header class="site-header">`: logo `<img src="assets/logo/davian-robotics-horizontal.png" alt="DAVIAN Robotics" height="32">` linking to `#top`; a small text link `DAVIAN Lab` → `https://davian.kaist.ac.kr/`; nav anchors (`#research`, `#releases`, `#team`, `#join`) each with a `data-i18n` key; GitHub and HuggingFace icon links; `<button id="lang-toggle">`.
3. `<section class="hero">`: left half `<video class="hero__video" src="assets/media/hero.mp4" poster="assets/media/hero.jpg" preload="metadata" muted loop playsinline autoplay></video>`; right half with `<h1>DAVIAN Robotics</h1>`, a tagline `data-i18n="hero.tagline"`, a short blurb `data-i18n="hero.blurb"`, and two buttons (GitHub org, HuggingFace org). The node-link motif from the logo appears as a faint background behind the right half (inline SVG or a CSS background, no new asset).
4. `<section id="highlights">`: heading `data-i18n="section.highlights"`, `<div id="highlights-grid" class="grid grid--featured"></div>`.
5. `<section id="research">`: heading `data-i18n="section.research"`, `<div id="filter-chips" class="chips"></div>`, `<div id="research-grid" class="grid"></div>`.
6. `<section id="releases" class="band">`: heading `data-i18n="section.releases"`, three counts written as literal numbers with links to `https://github.com/DAVIAN-Robotics` and `https://huggingface.co/DAVIAN-Robotics`. Use the figures from Task 1's fetch, and add an HTML comment saying they are refreshed by hand.
7. `<section id="team">`: heading `data-i18n="section.team"`, `<ul id="team-list"></ul>`, and a link `data-i18n="team.more"` → `https://davian.kaist.ac.kr/` PEOPLE page.
8. `<section id="join">`: heading `data-i18n="section.join"`, a paragraph `data-i18n="join.body"`, a link to the parent lab's JOIN US page, a contact email.
9. `<footer>`: `assets/logo/kaist-ai.svg`, parent lab link, GitHub, HuggingFace.
10. Scripts, in this exact order, at the end of `<body>`:

```html
<script src="data/people.js"></script>
<script src="data/projects.js"></script>
<script src="data/strings.js"></script>
<script src="js/render.js"></script>
<script src="js/i18n.js"></script>
```

- [ ] **Step 3: Write `css/style.css`**

Open with the custom properties. Every other rule reads from them — no hard-coded hex below this block.

```css
:root {
  --bg: #ffffff;
  --bg-band: #f7f8f9;
  --fg: #16181d;
  --fg-muted: #6b7280;
  --border: #e5e7eb;
  --accent: #4a3372;
  --accent-hover: #5d4390;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  --container: 1200px;
  --radius: 10px;
}
```

Then: reset, container, sticky header, split hero (CSS Grid, two columns, stacking to one on mobile with the video first), the grid (`repeat(auto-fill, minmax(320px, 1fr))`), the card (1px `--border`, no shadow; `:hover` moves the border to `--accent`), the featured card variant, the venue badge, the author links, the link buttons, the filter chips (active chip filled with `--accent`), the tinted `.band` section, the footer, and the three breakpoints. Cards fade in on scroll (Task 4 adds the class; define the transition here).

Close with the reduced-motion block:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 4: Create `.nojekyll` and `assets/media/.gitkeep`**

```bash
touch .nojekyll assets/media/.gitkeep
```

`.nojekyll` stops GitHub Pages from running the files through Jekyll, which would otherwise ignore any path beginning with an underscore and adds needless build latency.

- [ ] **Step 5: Verify the page serves and is valid**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8101/`
Expected: `200`

Run: `curl -s http://localhost:8101/ | grep -c 'data-i18n'`
Expected: a number ≥ 10 (every translatable node carries a key)

Run: `curl -s http://localhost:8101/ | grep -o 'src="[^"]*"' | sort -u`
Expected: every referenced path exists; no absolute URLs to third-party CDNs

Then open `http://localhost:8101` in a browser and confirm: the logo sits in the header, the hero splits with video on the left, the accent is purple and no blue appears outside the footer KAIST mark, and the page has no horizontal scrollbar at 375px, 768px, and 1440px widths.

- [ ] **Step 6: Commit**

```bash
git add index.html css/style.css .nojekyll assets/media/.gitkeep
git commit -m "feat: add page skeleton and design system"
```

---

### Task 4: DOM wiring — cards, filters, video playback

**Files:**
- Modify: `js/render.js` (append the DOM layer inside the existing IIFE, above the `global.DR` assignment)
- Create: `tests/dom.test.js`

**Interfaces:**
- Consumes: `window.DR` (Task 2), the DOM ids from Task 3, `window.PEOPLE` / `window.PROJECTS` (Task 1).
- Produces: `window.DR.mount(document)` — idempotent; renders highlights, the grid, the chips, and the team list, then attaches the filter and video behavior.

- [ ] **Step 1: Write the failing test**

Node 20 has no DOM, so the test drives `mount` against a hand-rolled stub that records what the renderer writes. This tests the wiring — which container gets which HTML, and that filtering re-renders the grid — without pulling in a DOM library, which the no-dependency constraint forbids.

Create `tests/dom.test.js`.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function makeElement(id) {
  return {
    id: id,
    innerHTML: '',
    children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, handler) {
      (this.handlers = this.handlers || {})[type] = handler;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function makeDocument(ids) {
  const elements = {};
  ids.forEach((id) => {
    elements[id] = makeElement(id);
  });
  return {
    elements,
    getElementById: (id) => elements[id] || null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
}

function load() {
  const sandbox = {
    console: { warn() {} },
    IntersectionObserver: function () {
      return { observe() {}, unobserve() {}, disconnect() {} };
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8'), sandbox, {
    filename: 'js/render.js',
  });
  sandbox.PEOPLE = { pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' } };
  sandbox.PROJECTS = [
    { id: 'a', title: 'A', authors: ['pmh9960'], year: 2026, tags: ['vla'],
      summary: { en: 'Alpha.' }, featured: true },
    { id: 'b', title: 'B', authors: ['pmh9960'], year: 2025, tags: ['humanoid'],
      summary: { en: 'Beta.' } },
    { id: 'broken', title: 'Broken' },
  ];
  return sandbox;
}

const IDS = ['highlights-grid', 'research-grid', 'filter-chips', 'team-list'];

test('mount renders featured projects into the highlights grid only', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const html = doc.elements['highlights-grid'].innerHTML;
  assert.match(html, /data-project-id="a"/);
  assert.doesNotMatch(html, /data-project-id="b"/);
  assert.match(html, /card--featured/);
});

test('mount renders every valid project into the research grid, newest first', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const html = doc.elements['research-grid'].innerHTML;
  assert.ok(html.indexOf('data-project-id="a"') < html.indexOf('data-project-id="b"'));
  assert.doesNotMatch(html, /data-project-id="broken"/);
});

test('mount renders an All chip plus one chip per tag', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const html = doc.elements['filter-chips'].innerHTML;
  assert.match(html, /data-tag="all"/);
  assert.match(html, /data-tag="humanoid"/);
  assert.match(html, /data-tag="vla"/);
});

test('applyFilter re-renders the grid with only the matching projects', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  sandbox.DR.applyFilter(doc, 'humanoid');
  const html = doc.elements['research-grid'].innerHTML;
  assert.match(html, /data-project-id="b"/);
  assert.doesNotMatch(html, /data-project-id="a"/);
});

test('mount renders the team list from PEOPLE', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  assert.match(doc.elements['team-list'].innerHTML, /Minho Park/);
  assert.match(doc.elements['team-list'].innerHTML, /https:\/\/pmh9960\.github\.io/);
});

test('mount is idempotent — running it twice does not duplicate cards', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  sandbox.DR.mount(doc);
  const matches = doc.elements['research-grid'].innerHTML.match(/data-project-id="a"/g);
  assert.strictEqual(matches.length, 1);
});

test('mount survives a page that is missing a container', () => {
  const sandbox = load();
  const doc = makeDocument(['research-grid']);
  assert.doesNotThrow(() => sandbox.DR.mount(doc));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/dom.test.js`
Expected: FAIL — `sandbox.DR.mount is not a function`

- [ ] **Step 3: Add the DOM layer to `js/render.js`**

Insert above the `global.DR = {...}` assignment, then add `mount` and `applyFilter` to that object.

```js
  function renderInto(doc, id, html) {
    var node = doc.getElementById(id);
    if (!node) return null;
    node.innerHTML = html;
    return node;
  }

  function chipsHTML(tags) {
    var all = '<button class="chip chip--active" data-tag="all" data-i18n="filter.all">All</button>';
    return (
      all +
      tags
        .map(function (tag) {
          return '<button class="chip" data-tag="' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</button>';
        })
        .join('')
    );
  }

  function teamHTML(people) {
    return Object.keys(people || {})
      .map(function (id) {
        var person = people[id];
        return (
          '<li><a href="' + escapeHTML(person.url) + '" target="_blank" rel="noopener">' +
          escapeHTML(person.name) +
          '</a></li>'
        );
      })
      .join('');
  }

  function applyFilter(doc, tag) {
    var projects = sortProjects(validProjects(global.PROJECTS));
    var people = global.PEOPLE || {};
    renderInto(
      doc,
      'research-grid',
      filterProjects(projects, tag)
        .map(function (project) {
          return cardHTML(project, people, {});
        })
        .join('')
    );
    var chips = doc.getElementById('filter-chips');
    if (chips && chips.querySelectorAll) {
      Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (chip) {
        chip.classList.toggle('chip--active', chip.getAttribute('data-tag') === tag);
      });
    }
    attachMedia(doc);
  }

  /* Cards play on hover on the desktop and one-at-a-time in the viewport on
   * mobile. Reduced motion pins every card to its poster. */
  function attachMedia(doc) {
    var reduce =
      typeof global.matchMedia === 'function' &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var videos = doc.querySelectorAll ? doc.querySelectorAll('.card video') : [];
    if (reduce) {
      Array.prototype.forEach.call(videos, function (video) {
        if (video.pause) video.pause();
      });
      return;
    }
    Array.prototype.forEach.call(videos, function (video) {
      var card = video.closest ? video.closest('.card') : null;
      if (!card || card.dataset && card.dataset.mediaBound) return;
      if (card.dataset) card.dataset.mediaBound = '1';
      card.addEventListener('mouseenter', function () {
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      });
      card.addEventListener('mouseleave', function () {
        video.pause();
      });
    });
    if (typeof global.IntersectionObserver !== 'function') return;
    var observer = new global.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            var playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          } else if (video.pause) {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.6] }
    );
    Array.prototype.forEach.call(videos, function (video) {
      observer.observe(video);
    });
  }

  function mount(doc) {
    var people = global.PEOPLE || {};
    var projects = sortProjects(validProjects(global.PROJECTS));
    renderInto(
      doc,
      'highlights-grid',
      projects
        .filter(function (project) {
          return project.featured;
        })
        .map(function (project) {
          return cardHTML(project, people, { featured: true });
        })
        .join('')
    );
    renderInto(doc, 'filter-chips', chipsHTML(collectTags(projects)));
    renderInto(doc, 'team-list', teamHTML(people));
    applyFilter(doc, 'all');
    var chips = doc.getElementById('filter-chips');
    if (chips && chips.addEventListener) {
      chips.addEventListener('click', function (event) {
        var tag = event.target && event.target.getAttribute && event.target.getAttribute('data-tag');
        if (tag) applyFilter(doc, tag);
      });
    }
  }
```

Add to the export object: `mount: mount, applyFilter: applyFilter,`. Then, at the very bottom of the IIFE, boot in the browser only:

```js
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      mount(document);
    });
  }
```

Also handle a missing hero video: if `assets/media/hero.mp4` fails to load, the hero must not show a broken element.

```js
  if (typeof document !== 'undefined') {
    document.addEventListener(
      'error',
      function (event) {
        var target = event.target;
        if (target && target.classList && target.classList.contains('hero__video')) {
          target.classList.add('is-missing');
        }
      },
      true
    );
  }
```

Add a `css/style.css` rule so `.hero__video.is-missing` is hidden and the hero's motif panel fills the space instead.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — all three test files, `# fail 0`

- [ ] **Step 5: Verify in the browser**

Open `http://localhost:8101`. Confirm: the featured cards appear under Highlights, all cards appear under Research, clicking a chip filters the grid and moves the active state, and **the console shows exactly one warning** — for the deliberately invalid project if one is present, and none otherwise.

- [ ] **Step 6: Commit**

```bash
git add js/render.js css/style.css tests/dom.test.js
git commit -m "feat: wire cards, tag filters, and video playback to the DOM"
```

---

### Task 5: EN/KR toggle

**Files:**
- Create: `js/i18n.js`
- Create: `tests/i18n.test.js`
- Modify: `index.html` (only if a `data-i18n` key is missing from a translatable node)
- Modify: `data/strings.js` (only if a key used in `index.html` is missing)

**Interfaces:**
- Consumes: `window.STRINGS` (Task 1), the `[data-i18n]` nodes and `#lang-toggle` (Task 3), `data-summary-en` / `data-summary-ko` on `.card__summary` (Task 2).
- Produces: `window.I18N` — `resolveLang(search, stored) -> 'en'|'ko'`, `apply(doc, lang) -> void`, `init(doc) -> void`.

- [ ] **Step 1: Write the failing test**

Create `tests/i18n.test.js`.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function load() {
  const sandbox = { console: { warn() {} } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'), sandbox, {
    filename: 'js/i18n.js',
  });
  sandbox.STRINGS = { ko: { 'nav.research': '연구' } };
  return sandbox;
}

test('the query string wins over the stored preference', () => {
  const { I18N } = load();
  assert.strictEqual(I18N.resolveLang('?lang=ko', 'en'), 'ko');
  assert.strictEqual(I18N.resolveLang('?lang=en', 'ko'), 'en');
});

test('the stored preference is used when the query string says nothing', () => {
  const { I18N } = load();
  assert.strictEqual(I18N.resolveLang('', 'ko'), 'ko');
});

test('English is the default and an unknown language falls back to it', () => {
  const { I18N } = load();
  assert.strictEqual(I18N.resolveLang('', null), 'en');
  assert.strictEqual(I18N.resolveLang('?lang=fr', null), 'en');
});

test('apply swaps a node to Korean and restores the original English', () => {
  const sandbox = load();
  const node = {
    textContent: 'Research',
    dataset: {},
    getAttribute: (name) => (name === 'data-i18n' ? 'nav.research' : null),
  };
  const doc = {
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [node] : []),
    documentElement: { lang: 'en' },
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.textContent, '연구');
  assert.strictEqual(doc.documentElement.lang, 'ko');
  sandbox.I18N.apply(doc, 'en');
  assert.strictEqual(node.textContent, 'Research');
  assert.strictEqual(doc.documentElement.lang, 'en');
});

test('a key with no Korean translation keeps its English text', () => {
  const sandbox = load();
  const node = {
    textContent: 'Untranslated',
    dataset: {},
    getAttribute: () => 'nav.missing',
  };
  const doc = { querySelectorAll: () => [node], documentElement: {} };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.textContent, 'Untranslated');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/i18n.test.js`
Expected: FAIL — `ENOENT: no such file or directory, open '.../js/i18n.js'`

- [ ] **Step 3: Write `js/i18n.js`**

The first `apply` stashes each node's original English into `dataset.i18nEn`, so switching back to English is a restore, not a second translation table.

```js
/* EN/KR toggle. English is the literal content of index.html; Korean comes
 * from window.STRINGS.ko. A key with no translation keeps its English text. */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'dr-lang';

  function resolveLang(search, stored) {
    var match = /[?&]lang=([a-z]{2})/i.exec(search || '');
    var candidate = match ? match[1].toLowerCase() : stored;
    return candidate === 'ko' ? 'ko' : 'en';
  }

  function apply(doc, lang) {
    var dict = (global.STRINGS && global.STRINGS[lang]) || {};
    var nodes = doc.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-i18n');
      if (node.dataset.i18nEn === undefined) node.dataset.i18nEn = node.textContent;
      var translated = dict[key];
      node.textContent = lang === 'en' || !translated ? node.dataset.i18nEn : translated;
    });
    var summaries = doc.querySelectorAll('.card__summary');
    Array.prototype.forEach.call(summaries, function (node) {
      var ko = node.getAttribute('data-summary-ko');
      var en = node.getAttribute('data-summary-en');
      node.textContent = lang === 'ko' && ko ? ko : en;
    });
    if (doc.documentElement) doc.documentElement.lang = lang;
  }

  function init(doc) {
    var stored = null;
    try {
      stored = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      stored = null;
    }
    var lang = resolveLang(global.location ? global.location.search : '', stored);
    apply(doc, lang);
    var toggle = doc.getElementById && doc.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.setAttribute('data-lang', lang);
    toggle.addEventListener('click', function () {
      lang = lang === 'en' ? 'ko' : 'en';
      apply(doc, lang);
      toggle.setAttribute('data-lang', lang);
      try {
        if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, lang);
      } catch (err) {
        /* private mode: the toggle still works, it just does not persist */
      }
    });
  }

  global.I18N = { resolveLang: resolveLang, apply: apply, init: init };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

`i18n.js` loads after `render.js`, so its `DOMContentLoaded` handler runs second and translates the cards the renderer just created. Card summaries are re-rendered by `applyFilter`; call `global.I18N.apply(doc, doc.documentElement.lang || 'en')` at the end of `applyFilter` in `js/render.js` so a filtered grid keeps the selected language. Guard it — `if (global.I18N) ...` — because `render.js` must stay loadable on its own for its own tests.

- [ ] **Step 4: Reconcile the keys**

Every `data-i18n` key in `index.html` must exist in `data/strings.js`, and every key in `data/strings.js` must be used.

Run: `grep -o 'data-i18n="[^"]*"' index.html js/render.js | sed 's/.*="//;s/"//' | sort -u > /tmp/keys-used.txt`
Run: `grep -o "^\s*'[^']*':" data/strings.js | tr -d " ':" | sort -u > /tmp/keys-defined.txt`
Run: `diff /tmp/keys-used.txt /tmp/keys-defined.txt`
Expected: no output. Add any missing key to whichever file lacks it.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — all four test files, `# fail 0`

- [ ] **Step 6: Verify in the browser**

Open `http://localhost:8101`. Click the toggle: nav labels, section headings, the tagline, and card summaries switch to Korean; project titles, author names, and venues stay English. Reload — the choice persists. Open `http://localhost:8101/?lang=ko` — it loads in Korean directly. Filter by a tag while in Korean — the new cards are still Korean.

- [ ] **Step 7: Commit**

```bash
git add js/i18n.js js/render.js index.html data/strings.js tests/i18n.test.js
git commit -m "feat: add EN/KR toggle with localStorage and ?lang deep link"
```

---

### Task 6: Contributor documentation and repository hygiene

**Files:**
- Create: `README.md`
- Delete: `_logo.zip` (its three used assets are already committed under `assets/logo/`; ask the user before deleting if they have not confirmed)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing the code depends on.

- [ ] **Step 1: Write `README.md` (English)**

It must cover exactly these sections, with real commands, not descriptions of commands:

1. **What this is** — one paragraph, and the live URL.
2. **Add a project** — three steps: (a) put the video and its poster in `assets/media/`, (b) copy the template object at the top of `data/projects.js` and fill it in, (c) if an author is new, add them to `data/people.js`. Include the template object verbatim.
3. **Media rules** — 3–6 second loop, H.264 MP4, ≤2 MB, poster required. Give the exact ffmpeg commands:
   ```bash
   ffmpeg -i input.mov -t 6 -an -vf "scale=960:-2" -c:v libx264 -crf 28 -movflags +faststart assets/media/<slug>.mp4
   ffmpeg -i assets/media/<slug>.mp4 -vframes 1 -q:v 3 assets/media/<slug>.jpg
   ```
   Then check the size: `du -h assets/media/<slug>.mp4` — over 2 MB, raise `-crf`.
4. **Preview** — open `index.html` in a browser (no server needed), or `python3 -m http.server 8101` and visit `http://localhost:8101`.
5. **Before you open a PR** — open the page, check the browser console is free of `render:` warnings, and run `node --test tests/` (Node is needed only for the tests; the site itself has no build step and no dependencies).
6. **Translations** — add the Korean string to `data/strings.js` under the matching `data-i18n` key; a missing key keeps the English text.
7. **Deploy** — pushing to `main` publishes. There is no workflow and no build.

- [ ] **Step 2: Verify every command in the README actually runs**

Run each command block from a clean shell in the repository root. The ffmpeg lines may be checked with `ffmpeg -version` alone if no source clip exists; the `node --test tests/` line must actually pass.

Run: `node --test tests/`
Expected: PASS, `# fail 0`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document how to add a project, encode media, and preview"
```

---

### Task 7: Full-page review

**Files:** none created; fixes land in the files they belong to.

- [ ] **Step 1: Check the page against the spec's Global Constraints**

Read `docs/superpowers/specs/2026-07-11-davian-robotics-site-design.md` and walk the rendered page against every bullet in this plan's Global Constraints. Each one is a yes/no check, not a judgment call.

- [ ] **Step 2: Confirm no blue leaked in**

Run: `grep -riE '#00[0-9a-f]{2}(91|ff)|kaist blue|--accent:\s*#0' css/ index.html js/`
Expected: no output. The only blue on the site lives inside `assets/logo/kaist-ai.svg`.

- [ ] **Step 3: Confirm the page works without JavaScript**

Run: `curl -s http://localhost:8101/ | grep -iE 'DAVIAN Robotics|join|contact'`
Expected: the group name, the tagline, and the contact route are present in the raw HTML. If they only appear after JS runs, the static copy has leaked into the renderer and must move back into `index.html`.

- [ ] **Step 4: Confirm the page works from `file://`**

Open `index.html` directly (double-click, or `xdg-open index.html`). Expected: cards render and the toggle works, with no CORS error in the console. A `fetch` would break this — that is what the test is for.

- [ ] **Step 5: Request code review**

Use the `superpowers:requesting-code-review` skill.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address full-page review findings"
```

---

## Self-Review

**Spec coverage.** §3 architecture → Tasks 1–5 create exactly the files it lists (minus `data/news.js`, which the spec removed along with the News section). §4 data model → Task 1, with the author-linking, link, and media rules tested in Task 2. §5 layout → Task 3 builds each section in order; the Team section's parent-lab link is Task 3 step 2 item 7. §6 visual system → Task 3 steps 1–3, with the accent rule enforced by Task 7 step 2. §7 defensive rendering → Task 2's `validProjects` and its warning test. §8 i18n → Task 5. §9 deployment → `.nojekyll` in Task 3 and the README's deploy section in Task 6. §10 contributor docs → Task 6.

**Placeholders.** The `...` inside `data/strings.js` and `data/projects.js` in Task 1 are the only ellipses, and they are deliberate: their content is the real data fetched in Task 1 step 1, which the plan forbids inventing ahead of time. Every code step elsewhere carries complete code.

**Type consistency.** `window.DR` exports the same names Task 4 and Task 5 call (`mount`, `applyFilter`, `cardHTML`, `escapeHTML`). `window.I18N.apply(doc, lang)` is the same signature `applyFilter` invokes. The DOM ids Task 3 produces (`highlights-grid`, `research-grid`, `filter-chips`, `team-list`, `lang-toggle`) are the ids Task 4's `mount` and Task 5's `init` look up, and the ids Task 4's test stubs.

**Risk to watch.** Task 1 must fetch real names and author lists. A subagent that cannot resolve a name is instructed to omit the person rather than guess — an unlinked correct name beats a linked wrong one.
