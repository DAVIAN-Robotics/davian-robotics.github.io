'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function loadRenderer() {
  const warnings = [];
  const fakeWindow = {};
  const fakeConsole = { warn: (...args) => warnings.push(args.join(' ')) };
  const code = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8');
  // Run in this realm so the objects the renderer returns compare with
  // deepStrictEqual — a vm context would give them a foreign prototype.
  new Function('window', 'console', code)(fakeWindow, fakeConsole);
  return { DR: fakeWindow.DR, warnings };
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
  date: '2025-09',
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
  assert.deepStrictEqual(result.missing.sort(), ['authors', 'date', 'summary.en', 'year']);
});

test('an invalid project is skipped and warned about, and the valid ones survive', () => {
  const { DR, warnings } = loadRenderer();
  const kept = DR.validProjects([PROJECT, { id: 'broken', title: 'T' }]);
  assert.deepStrictEqual(kept.map((p) => p.id), ['phuma']);
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /broken/);
  assert.match(warnings[0], /authors/);
});

// The grid sorts on `date`, not `year` — sorting on the year is what used to
// drop every paper from one year into alphabetical order. These three share a
// year and must still come out newest month first.
test('projects sort newest first by date, not by year, with the title breaking a tie', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'jan', title: 'Z', year: 2026, date: '2026-01' },
    { ...PROJECT, id: 'jun-b', title: 'B', year: 2026, date: '2026-06' },
    { ...PROJECT, id: 'jun-a', title: 'A', year: 2026, date: '2026-06' },
    { ...PROJECT, id: 'old', title: 'A', year: 2024, date: '2024-11' },
  ]);
  assert.deepStrictEqual(sorted.map((p) => p.id), ['jun-a', 'jun-b', 'jan', 'old']);
});

test('a project with no date is skipped rather than sorted unpredictably', () => {
  const { DR, warnings } = loadRenderer();
  const { date, ...noDate } = PROJECT;
  const kept = DR.validProjects([PROJECT, { ...noDate, id: 'undated' }]);
  assert.deepStrictEqual(kept.map((p) => p.id), ['phuma']);
  assert.match(warnings[0], /undated/);
  assert.match(warnings[0], /date/);
});

test('filtering by a tag preserves the newest-first order', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'jan', date: '2026-01', tags: ['vla'] },
    { ...PROJECT, id: 'jun', date: '2026-06', tags: ['vla'] },
    { ...PROJECT, id: 'other', date: '2026-03', tags: ['humanoid'] },
  ]);
  assert.deepStrictEqual(DR.filterProjects(sorted, 'vla').map((p) => p.id), ['jun', 'jan']);
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
  const html = DR.cardHTML(PROJECT, PEOPLE);
  assert.match(html, /data-project-id="phuma"/);
  assert.match(html, /PHUMA/);
  assert.match(html, /NeurIPS 2025/);
  assert.match(html, /Minho Park/);
  assert.match(html, /A humanoid locomotion dataset\./);
});

// --- per-card tag labels ---------------------------------------------------

// The colour comes from the tag's NAME, via the TAG_TONES map in js/render.js —
// never from where the tag happens to sit on a card. A tone keyed by index is
// the bug this guards: 'manipulation' is the second tag on 3D HAMSTER and the
// second on ACG, but the first on some future paper, and it must not change
// colour when it moves.
test('a tag is one colour everywhere, keyed by its name and not by its position on a card', () => {
  const { DR } = loadRenderer();
  ['vla', 'manipulation', 'humanoid', 'dataset', 'reinforcement learning'].forEach((tag) => {
    assert.strictEqual(DR.tagTone(tag), DR.tagTone(tag));
    const tone = DR.tagTone(tag);
    assert.ok(tone >= 1 && tone <= 4, `${tag} must land on one of the four logo hues`);
  });
  // Same tag, two different positions in two different tag lists: same class.
  const first = DR.tagsHTML(['manipulation', 'vla']);
  const second = DR.tagsHTML(['planning', 'humanoid', 'manipulation']);
  const toneOf = (html, tag) => html.match(new RegExp(`tag--(\\d)">${tag}<`))[1];
  assert.strictEqual(
    toneOf(first, 'manipulation'),
    toneOf(second, 'manipulation'),
    'manipulation must be the same colour whether it is first or last on the card'
  );
});

// A tag missing from the map still renders (hashed fallback) rather than
// rendering colourless or throwing — but the map is the intended path.
test('a tag that is not in the map still gets a stable colour from the fallback', () => {
  const { DR } = loadRenderer();
  const tone = DR.tagTone('a tag nobody has added yet');
  assert.ok(tone >= 1 && tone <= 4);
  assert.strictEqual(tone, DR.tagTone('a tag nobody has added yet'), 'the fallback must be stable, not random');
});

test('tags render as labels, not controls — no button, no link, no data-tag', () => {
  const { DR } = loadRenderer();
  const html = DR.tagsHTML(['vla', 'manipulation']);
  assert.match(html, /<li class="tag tag--\d">vla<\/li>/);
  assert.match(html, /<li class="tag tag--\d">manipulation<\/li>/);
  assert.doesNotMatch(html, /<button|<a |data-tag=/, 'a tag label must not look or behave like the old filter chip');
});

test('a project with no tags renders no tag row at all', () => {
  const { DR } = loadRenderer();
  assert.strictEqual(DR.tagsHTML([]), '');
  assert.strictEqual(DR.tagsHTML(undefined), '');
});

test('a card carries its tags, and they are escaped like everything else', () => {
  const { DR } = loadRenderer();
  assert.match(DR.cardHTML(PROJECT, PEOPLE), /class="card__tags"/);
  assert.match(DR.tagsHTML(['<img src=x>']), /&lt;img src=x&gt;/);
});

// --- the card's own destination -------------------------------------------

test('the card links to its project page, falling back to the paper, and to nothing at all if it has neither', () => {
  const { DR } = loadRenderer();
  assert.strictEqual(
    DR.cardHref({ project: 'https://davian-robotics.github.io/ACG', paper: 'https://arxiv.org/abs/1' }),
    'https://davian-robotics.github.io/ACG',
    'a project page wins'
  );
  assert.strictEqual(
    DR.cardHref({ paper: 'https://arxiv.org/abs/2502.15280', code: 'https://github.com/x' }),
    'https://arxiv.org/abs/2502.15280',
    'no project page falls back to the paper — this is SimbaV2'
  );
  assert.strictEqual(DR.cardHref({ code: 'https://github.com/x' }), '');
  assert.strictEqual(DR.cardHref(undefined), '');
});

test('a card with a destination wraps its title in the stretched link', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML({ ...PROJECT, links: { project: 'https://example.org/p' } }, PEOPLE);
  assert.match(html, /class="card card--linked"/);
  assert.match(html, /<h3 class="card__title"><a class="card__link" href="https:\/\/example\.org\/p"/);
});

// An empty href reloads the page — worse than a card that simply does not click.
test('a card with no destination is not a link and is not marked clickable', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML({ ...PROJECT, links: { code: 'https://github.com/x' } }, PEOPLE);
  assert.doesNotMatch(html, /card--linked/);
  assert.doesNotMatch(html, /class="card__link"/); // not /card__link/ — .card__links is the button row
  assert.doesNotMatch(html, /href=""/);
  assert.match(html, /<h3 class="card__title">PHUMA<\/h3>/);
});

// The inner links are what the overlay must not swallow. They are still real
// anchors in the markup — CSS raises them above the overlay.
test('the card link never nests around the inner links — they stay separate anchors', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(
    { ...PROJECT, links: { project: 'https://example.org/p', paper: 'https://arxiv.org/abs/1' } },
    PEOPLE
  );
  assert.doesNotMatch(html, /<a[^>]*>\s*<article/, 'the card must not be wrapped in an anchor');
  assert.match(html, /<a class="author" href="https:\/\/pmh9960\.github\.io"/);
  assert.match(html, /<a class="btn btn--link" href="https:\/\/arxiv\.org\/abs\/1"/);
});

// A `title` tooltip would be a second copy of a string that has two languages,
// and the copy does not go through js/i18n.js's swap — the last one showed the
// English summary to a reader who had switched the page to Korean. The clamps now
// come off on hover/focus instead, so there is nothing a tooltip would add.
test('no card carries a title attribute — it would leak English into Korean mode', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(PROJECT, PEOPLE);
  assert.doesNotMatch(html, /\stitle="/);
});

test('user-supplied text is escaped, so a stray angle bracket cannot inject markup', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML({ ...PROJECT, id: 'xss', title: '<img src=x onerror=alert(1)>' }, PEOPLE);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

// --- news ------------------------------------------------------------------

const NEWS_ITEM = {
  id: 'simbav2-icml-2025',
  date: '2025-05',
  kind: 'acceptance',
  title: 'SimbaV2',
  text: { en: 'Accepted to ICML 2025 as a spotlight.', ko: 'ICML 2025에 spotlight으로 채택되었습니다.' },
  project: 'simbav2',
};

// The projects a news item resolves its destination against. SimbaV2 has both a
// project page and a paper; the project page wins, same rule as the card.
const NEWS_PROJECTS = [
  { id: 'simbav2', links: { paper: 'https://arxiv.org/abs/2502.15280', project: 'https://davian-robotics.github.io/SimbaV2/' } },
  { id: 'paper-only', links: { paper: 'https://arxiv.org/abs/1' } },
  { id: 'nowhere', links: { code: 'https://github.com/x' } },
];

test('a complete news item validates, and an incomplete one reports every missing field', () => {
  const { DR } = loadRenderer();
  assert.deepStrictEqual(DR.validateNews(NEWS_ITEM), { ok: true, missing: [] });
  const result = DR.validateNews({ id: 'x', title: 'X' });
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.missing.sort(), ['date', 'project', 'text.en']);
});

test('an invalid news item is skipped and warned about, and the valid ones survive', () => {
  const { DR, warnings } = loadRenderer();
  const kept = DR.validNews([NEWS_ITEM, { id: 'broken', title: 'B' }]);
  assert.deepStrictEqual(kept.map((n) => n.id), ['simbav2-icml-2025']);
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /broken/);
  assert.match(warnings[0], /project/);
});

test('news sorts newest date first, across years and within one, keeping the authored order in a tie', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortNews([
    { ...NEWS_ITEM, id: 'oldest', date: '2025-05' },
    { ...NEWS_ITEM, id: 'jan-2026', date: '2026-01' },
    { ...NEWS_ITEM, id: 'jun-2026', date: '2026-06' },
    { ...NEWS_ITEM, id: 'also-jun-2026', date: '2026-06' },
    { ...NEWS_ITEM, id: 'oct-2025', date: '2025-10' },
  ]);
  assert.deepStrictEqual(sorted.map((n) => n.id), [
    'jun-2026',
    'also-jun-2026',
    'jan-2026',
    'oct-2025',
    'oldest',
  ]);
});

test('a news item renders its date as a machine-readable <time>, its title, both languages of its text, and a kind badge', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([NEWS_ITEM], NEWS_PROJECTS);
  assert.match(html, /data-news-id="simbav2-icml-2025"/);
  assert.match(html, /<time class="news__date" datetime="2025-05">2025-05<\/time>/);
  assert.match(html, /<h3 class="news__title">SimbaV2<\/h3>/);
  assert.match(html, /data-news-en="Accepted to ICML 2025 as a spotlight\."/);
  assert.match(html, /data-news-ko="ICML 2025에 spotlight으로 채택되었습니다\."/);
  assert.match(html, /data-i18n="news.kind.acceptance">Accepted</);
});

// The row is the link. An <a> may not contain another <a>, so a title that
// re-grew its own anchor would be invalid markup and a second focus stop.
test('the whole row is one link and nothing inside it is a second link', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([NEWS_ITEM], NEWS_PROJECTS);
  assert.match(html, /<a class="news__link" href="https:\/\/davian-robotics\.github\.io\/SimbaV2\/">/);
  assert.strictEqual((html.match(/<a /g) || []).length, 1, 'exactly one anchor per row');
});

// --- where a news row points -----------------------------------------------

// The row goes where the CARD goes: same rule, same cardHref. A reader clicking
// "Accepted to ICML 2025" must land where clicking the SimbaV2 card lands.
test('a news row points at its project page, falling back to the paper', () => {
  const { DR } = loadRenderer();
  assert.strictEqual(
    DR.newsHref({ project: 'simbav2' }, NEWS_PROJECTS),
    'https://davian-robotics.github.io/SimbaV2/',
    'the project page wins, exactly as it does on the card'
  );
  assert.strictEqual(
    DR.newsHref({ project: 'paper-only' }, NEWS_PROJECTS),
    'https://arxiv.org/abs/1',
    'no project page falls back to the paper'
  );
  assert.strictEqual(DR.newsHref({ project: 'nowhere' }, NEWS_PROJECTS), '');
  assert.strictEqual(DR.newsHref({ project: 'not-a-project' }, NEWS_PROJECTS), '');
  assert.strictEqual(DR.newsHref({}, NEWS_PROJECTS), '');
});

// An <a href=""> reloads the page. A row with nowhere to go is not a link.
test('a news row with no destination renders as plain text, not a dead link', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, project: 'nowhere' }], NEWS_PROJECTS);
  assert.doesNotMatch(html, /<a /, 'no anchor at all');
  assert.doesNotMatch(html, /href=""/);
  assert.match(html, /<div class="news__link news__link--static">/);
  assert.match(html, /SimbaV2/, 'the row still renders — it just does not link');
});

// Nothing on this site opens a new tab. The renderer emits most of the page's
// links, so this is the test that keeps them in the same tab — a stray
// target="_blank" copied into any one of these builders fails here.
test('nothing the renderer emits opens a new tab', () => {
  const { DR } = loadRenderer();
  const everything = [
    DR.cardHTML(PROJECT, PEOPLE),
    DR.newsHTML([NEWS_ITEM], NEWS_PROJECTS),
    DR.authorsHTML(PROJECT.authors, PEOPLE),
    DR.linksHTML(PROJECT.links),
  ].join('');
  assert.doesNotMatch(everything, /target=/, 'no link may set a target');
  assert.doesNotMatch(everything, /_blank/);
  assert.doesNotMatch(everything, /rel="noopener"/, 'rel=noopener existed only to support target=_blank');
});

test('a news item with no Korean text still renders, with an empty ko attribute', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, text: { en: 'Released.' } }], NEWS_PROJECTS);
  assert.match(html, /data-news-ko=""/);
  assert.match(html, />Released\.</);
});

test('an unknown news kind renders no badge rather than an empty one', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, kind: 'gossip' }], NEWS_PROJECTS);
  assert.doesNotMatch(html, /news__kind/);
});

test('news text is escaped too', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, title: '<img src=x onerror=alert(1)>' }], NEWS_PROJECTS);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});
