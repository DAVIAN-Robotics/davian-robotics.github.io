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
test('projects sort newest first by date, not by year, keeping the authored order in a tie', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'jan', title: 'Z', year: 2026, date: '2026-01' },
    { ...PROJECT, id: 'jun-b', title: 'B', year: 2026, date: '2026-06' },
    { ...PROJECT, id: 'jun-a', title: 'A', year: 2026, date: '2026-06' },
    { ...PROJECT, id: 'old', title: 'A', year: 2024, date: '2024-11' },
  ]);
  assert.deepStrictEqual(sorted.map((p) => p.id), ['jun-b', 'jun-a', 'jan', 'old']);
});

test('a project with no date is skipped rather than sorted unpredictably', () => {
  const { DR, warnings } = loadRenderer();
  const { date, ...noDate } = PROJECT;
  const kept = DR.validProjects([PROJECT, { ...noDate, id: 'undated' }]);
  assert.deepStrictEqual(kept.map((p) => p.id), ['phuma']);
  assert.match(warnings[0], /undated/);
  assert.match(warnings[0], /date/);
});

test('preprints sort above published papers, each group newest first', () => {
  const { DR } = loadRenderer();
  const { venue, ...preprint } = PROJECT;
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'pub-new', date: '2026-09' },
    { ...preprint, id: 'pre-old', date: '2026-07' },
    { ...PROJECT, id: 'pub-old', date: '2025-01' },
    { ...preprint, id: 'pre-new', date: '2026-08' },
  ]);
  assert.deepStrictEqual(sorted.map((p) => p.id), ['pre-new', 'pre-old', 'pub-new', 'pub-old']);
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

// Summaries expand on hover/focus instead of duplicating text in a tooltip.
test('no card duplicates its summary in a title tooltip', () => {
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
  id: 'icml-2025',
  date: '2025-05',
  kind: 'acceptance',
  title: 'ICML 2025',
  papers: [{ project: 'simbav2', name: 'SimbaV2', note: { en: 'spotlight', honor: true } }],
};

// The projects a news row resolves its destinations against. SimbaV2 has both a
// project page and a paper; the project page wins, same rule as the card.
const NEWS_PROJECTS = [
  { id: 'simbav2', links: { paper: 'https://arxiv.org/abs/2502.15280', project: 'https://davian-robotics.github.io/SimbaV2/' } },
  { id: 'paper-only', links: { paper: 'https://arxiv.org/abs/1' } },
  { id: 'nowhere', links: { code: 'https://github.com/x' } },
];

test('a complete news row validates, and an incomplete one reports every missing field', () => {
  const { DR } = loadRenderer();
  assert.deepStrictEqual(DR.validateNews(NEWS_ITEM), { ok: true, missing: [] });
  const result = DR.validateNews({ id: 'x', title: 'X' });
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.missing.sort(), ['date', 'papers']);
  assert.deepStrictEqual(DR.validateNews({ ...NEWS_ITEM, papers: [] }).missing, ['papers'], 'an empty papers list is missing');
});

test('an invalid news row is skipped and warned about, and the valid ones survive', () => {
  const { DR, warnings } = loadRenderer();
  const kept = DR.validNews([NEWS_ITEM, { id: 'broken', title: 'B' }]);
  assert.deepStrictEqual(kept.map((n) => n.id), ['icml-2025']);
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /broken/);
  assert.match(warnings[0], /papers/);
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

test('a news row renders its date as a machine-readable <time>, the venue as its title, a bilingual lead and a kind badge', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([NEWS_ITEM], NEWS_PROJECTS);
  assert.match(html, /data-news-id="icml-2025"/);
  assert.match(html, /<time class="news__date" datetime="2025-05">2025-05<\/time>/);
  assert.match(html, /<h3 class="news__title">ICML 2025<\/h3>/);
  assert.match(html, />1 paper accepted:</);
  assert.match(html, />Accepted</);
});

// Papers at one venue share one row, and each name is its own link — the row
// itself is not wrapped in an anchor any more.
test('a row with several papers counts them and links each name where its card links', () => {
  const { DR } = loadRenderer();
  const item = {
    id: 'corl', date: '2026-09', kind: 'acceptance', title: 'CoRL 2026',
    papers: [{ project: 'simbav2', name: 'A' }, { project: 'paper-only', name: 'B' }, { project: 'nowhere', name: 'C' }],
  };
  const html = DR.newsHTML([item], NEWS_PROJECTS);
  assert.match(html, />3 papers accepted:</);
  assert.match(html, /<a class="news__paper" href="https:\/\/davian-robotics\.github\.io\/SimbaV2\/">A<\/a>/);
  assert.match(html, /<a class="news__paper" href="https:\/\/arxiv\.org\/abs\/1">B<\/a>/);
  assert.strictEqual((html.match(/<a /g) || []).length, 2, 'one anchor per paper that has somewhere to go');
  assert.doesNotMatch(html, /class="news__link/, 'the row is not one big link');
});

// An <a href=""> reloads the page. A paper with nowhere to go is plain text.
test('a paper with no destination renders as plain text, not a dead link', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, papers: [{ project: 'nowhere', name: 'SimbaV2' }] }], NEWS_PROJECTS);
  assert.doesNotMatch(html, /<a /, 'no anchor at all');
  assert.doesNotMatch(html, /href=""/);
  assert.match(html, /<span class="news__paper news__paper--static">SimbaV2<\/span>/);
});

// Honours are the one thing in red: an honour note on a paper, and the lead of
// an award row.
test('honour notes and award leads carry the honour class; plain notes do not', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([NEWS_ITEM], NEWS_PROJECTS);
  assert.match(html, /class="news__note news__note--honor">\(spotlight\)</);
  const plain = DR.newsHTML([{ ...NEWS_ITEM, papers: [{ project: 'simbav2', name: 'X', note: { en: 'with Y' } }] }], NEWS_PROJECTS);
  assert.match(plain, /class="news__note">\(with Y\)</);
  const award = DR.newsHTML([{ ...NEWS_ITEM, kind: 'award', lead: { en: 'Best Paper Award:' } }], NEWS_PROJECTS);
  assert.match(award, /class="news__lead news__lead--honor">Best Paper Award:</);
  assert.match(award, />Award</);
});

// Only the newest rows show; the rest sit behind "Show more", inert until opened.
test('rows past the visible count fold behind a "Show more" button', () => {
  const { DR } = loadRenderer();
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ ...NEWS_ITEM, id }));
  const html = DR.newsHTML(items, NEWS_PROJECTS, 5);
  const [shown, folded] = html.split('<li class="news__more">');
  assert.strictEqual((shown.match(/data-news-id=/g) || []).length, 5, 'five rows show');
  assert.strictEqual((folded.match(/data-news-id=/g) || []).length, 2, 'the rest are folded');
  assert.match(folded, /<div class="news__earlier" id="news-earlier" inert>/, 'folded rows are inert while closed');
  assert.match(folded, /<button type="button" class="news__toggle" aria-expanded="false" aria-controls="news-earlier">/);
  assert.match(folded, />Show more</);
  assert.ok(folded.indexOf('news__earlier') < folded.indexOf('news__toggle'), 'the rows sit above the button, so they open downward');
  assert.doesNotMatch(DR.newsHTML(items.slice(0, 5), NEWS_PROJECTS, 5), /news__more/, 'no more rows than the limit: no button');
});

test('ten rows show by default before anything folds', () => {
  const { DR } = loadRenderer();
  const ten = Array.from({ length: 10 }, (_, i) => ({ ...NEWS_ITEM, id: 'n' + i }));
  assert.doesNotMatch(DR.newsHTML(ten, NEWS_PROJECTS), /news__more/);
  assert.match(DR.newsHTML([...ten, { ...NEWS_ITEM, id: 'n10' }], NEWS_PROJECTS), /news__more/);
});

test('the toggle opens and closes the folded rows and relabels itself in English', () => {
  const { DR } = loadRenderer();
  const attrs = { 'aria-expanded': 'false' };
  const span = { attrs: {}, textContent: 'Show more', setAttribute(k, v) { this.attrs[k] = v; } };
  const button = {
    getAttribute: (k) => attrs[k],
    setAttribute: (k, v) => { attrs[k] = v; },
    querySelector: () => span,
  };
  const classes = new Set();
  const earlierAttrs = { inert: '' };
  const earlier = {
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    setAttribute: (k, v) => { earlierAttrs[k] = v; },
    removeAttribute: (k) => { delete earlierAttrs[k]; },
  };
  assert.strictEqual(DR.toggleNews(button, earlier), true);
  assert.strictEqual(attrs['aria-expanded'], 'true');
  assert.ok(classes.has('news__earlier--open'));
  assert.ok(!('inert' in earlierAttrs), 'open rows are focusable');
  assert.strictEqual(span.textContent, 'Show less');
  assert.strictEqual(DR.toggleNews(button, earlier), false);
  assert.strictEqual(attrs['aria-expanded'], 'false');
  assert.ok(!classes.has('news__earlier--open'));
  assert.ok('inert' in earlierAttrs, 'closed rows are inert again');
  assert.strictEqual(span.textContent, 'Show more');
});

test('a release row counts preprints the same way an acceptance row counts papers', () => {
  const { DR } = loadRenderer();
  assert.deepStrictEqual(DR.newsLead({ kind: 'release', papers: [{}] }), { en: '1 preprint released:' });
  assert.deepStrictEqual(DR.newsLead({ kind: 'acceptance', papers: [{}, {}] }), { en: '2 papers accepted:' });
});

// --- where a news name points ----------------------------------------------

// A name goes where the CARD goes: same rule, same cardHref.
test('a paper in a news row points at its project page, falling back to the paper', () => {
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

// --- co-first authors and honours on cards ---------------------------------

test('the first `equal` authors get a co-first mark, and nobody else does', () => {
  const { DR } = loadRenderer();
  const people = { a: { name: 'A', url: 'https://a.example' } };
  const html = DR.authorsHTML(['a', 'B', 'C'], people, 2);
  assert.strictEqual((html.match(/author__mark/g) || []).length, 2);
  assert.match(html, /<\/a><span class="author__mark">\*<\/span>, B<span class="author__mark">\*<\/span>, C$/);
  assert.doesNotMatch(DR.authorsHTML(['a', 'B'], people), /author__mark/, 'no equal: no marks');
});

test('a card prints its honour in red beside the venue badge', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(
    { id: 'x', title: 'X', authors: [], year: 2026, date: '2026-09', venue: 'CoRL 2026', honor: 'Spotlight', summary: { en: 'S' } },
    {}
  );
  assert.match(html, /<div class="card__venue-row"><span class="card__venue">CoRL 2026<\/span><span class="card__honor">Spotlight<\/span><\/div>/);
});

// --- people ----------------------------------------------------------------

test('a member card shows the photo, the linked name, the role and the interests', () => {
  const { DR } = loadRenderer();
  const people = { a: { name: 'A Person', url: 'https://a.example' } };
  const html = DR.peopleHTML([{ person: 'a', role: 'phd', interests: 'RL, VLA' }, { person: 'ghost', role: 'ms' }], people);
  assert.match(html, /<img class="person__photo" src="assets\/people\/a\.jpg"/);
  assert.match(html, /<a class="person__link" href="https:\/\/a\.example"><img class="person__photo"/);
  assert.match(html, /<span class="person__name-text">A Person<\/span>/);
  assert.match(html, />Ph\.D\. Student</);
  assert.match(html, /<p class="person__interests">RL, VLA<\/p>/);
  assert.strictEqual((html.match(/class="person"/g) || []).length, 1, 'a member with no PEOPLE entry is skipped');
});

test('an affiliation follows the role, and photo: false shows initials instead of an image', () => {
  const { DR } = loadRenderer();
  const people = { y: { name: 'Youngdo Lee', url: 'https://y.example' } };
  const html = DR.peopleHTML([{ person: 'y', role: 'alumni-ms', affiliation: 'Holiday Robotics', photo: false }], people);
  assert.match(html, /<p class="person__role"><span>Alumni<\/span> · Holiday Robotics<\/p>/);
  assert.match(html, /person__photo--initials" aria-hidden="true">YL</);
  assert.doesNotMatch(html, /<img /);
});

test('people sort with the professor first, then by paper count, keeping the listed order in a tie', () => {
  const { DR } = loadRenderer();
  const projects = [
    { authors: ['prof', 'b', 'c'] },
    { authors: ['prof', 'c'] },
    { authors: ['prof', 'd'] },
    { authors: ['collab', 'b', 'c'] },
  ];
  const members = [
    { person: 'a', role: 'phd' },
    { person: 'b', role: 'phd' },
    { person: 'c', role: 'postdoc' },
    { person: 'prof', role: 'professor' },
    { person: 'collab', role: 'collaborator' },
    { person: 'd', role: 'alumni-ms' },
  ];
  assert.deepStrictEqual(DR.sortMembers(members, projects).map((m) => m.person), ['prof', 'c', 'b', 'collab', 'd', 'a']);
  assert.strictEqual(DR.paperCount('c', projects), 3);
});

test('a card with no venue says Preprint in the venue slot', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML({ id: 'p', title: 'P', authors: [], year: 2026, date: '2026-07', summary: { en: 'S' } }, {});
  assert.match(html, /<div class="card__venue-row"><span class="card__venue">Preprint<\/span><\/div>/);
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

test('English leads and notes render without translation attributes', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML(
    [{ ...NEWS_ITEM, lead: { en: 'Released:' }, papers: [{ project: 'simbav2', name: 'X', note: { en: 'beta' } }] }],
    NEWS_PROJECTS
  );
  assert.match(html, />Released:</);
  assert.match(html, />\(beta\)</);
  assert.match(html, />Released:</);
});

test('an unknown news kind renders no badge rather than an empty one', () => {
  const { DR } = loadRenderer();
  const html = DR.newsHTML([{ ...NEWS_ITEM, kind: 'gossip' }], NEWS_PROJECTS);
  assert.doesNotMatch(html, /news__kind/);
});

test('news text is escaped too', () => {
  const { DR } = loadRenderer();
  const evil = '<img src=x onerror=alert(1)>';
  const html = DR.newsHTML(
    [{ ...NEWS_ITEM, title: evil, papers: [{ project: 'simbav2', name: evil, note: { en: evil } }] }],
    NEWS_PROJECTS
  );
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});
