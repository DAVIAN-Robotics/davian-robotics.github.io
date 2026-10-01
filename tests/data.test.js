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
  for (const file of ['data/people.js', 'data/projects.js', 'data/news.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox;
}

const REQUIRED = ['id', 'title', 'authors', 'year', 'date', 'summary'];
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

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

// The grid sorts on `date` and the badge reads `year`. If they disagree, a paper
// sorts into one year and displays another — the exact mistake a hurried
// contributor makes by copying a neighbouring entry and editing only one of them.
test('every project date is YYYY-MM and agrees with its year', () => {
  const { PROJECTS } = loadData();
  for (const p of PROJECTS) {
    assert.match(p.date, MONTH, `${p.id}: date must be 'YYYY-MM'`);
    assert.ok(
      p.date.startsWith(String(p.year)),
      `${p.id}: date ${p.date} disagrees with year ${p.year}`
    );
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

test('every news row has the required fields, a known kind, and at least one paper', () => {
  const { NEWS } = loadData();
  assert.ok(NEWS.length > 0, 'NEWS is empty');
  for (const item of NEWS) {
    for (const field of ['id', 'title', 'date', 'kind', 'papers']) {
      assert.ok(item[field] !== undefined && item[field] !== null, `${item.id}: missing ${field}`);
    }
    assert.ok(['acceptance', 'release', 'award'].includes(item.kind), `${item.id}: kind must be acceptance, release or award`);
    assert.ok(Array.isArray(item.papers) && item.papers.length > 0, `${item.id}: papers must list at least one paper`);
    for (const paper of item.papers) {
      assert.ok(paper.project, `${item.id}: a paper is missing its project id`);
      assert.ok(paper.name, `${item.id}: ${paper.project} is missing its short name`);
    }
    if (item.lead) assert.ok(item.lead.en, `${item.id}: a lead needs English text`);
  }
});

// A row carries no URL of its own — each paper name points wherever its
// project's card points. A `project` that matches nothing would render the name
// as plain text, silently dropping the link, so catch the typo here instead.
test('every paper in a news row points at a project that exists', () => {
  const { NEWS, PROJECTS } = loadData();
  const ids = new Set(PROJECTS.map((p) => p.id));
  for (const item of NEWS) {
    for (const paper of item.papers) {
      assert.ok(ids.has(paper.project), `${item.id}: project '${paper.project}' is not in data/projects.js`);
    }
  }
});

// The one thing that would make a name silently unclickable: a project with
// neither a project page nor a paper. Every project we ship has one.
test('every project a news row names has somewhere to send the reader', () => {
  const { NEWS, PROJECTS } = loadData();
  for (const item of NEWS) {
    for (const paper of item.papers) {
      const project = PROJECTS.find((p) => p.id === paper.project);
      const links = project.links || {};
      assert.ok(
        links.project || links.paper,
        `${item.id}: ${project.id} has neither a project page nor a paper, so its name would not link`
      );
    }
  }
});

test('news ids are unique', () => {
  const { NEWS } = loadData();
  const ids = NEWS.map((n) => n.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'duplicate news id');
});

// Papers at the same venue share one row. Two acceptance rows titled
// 'CoRL 2026' would split the venue back into per-paper rows.
test('one row per venue and kind', () => {
  const { NEWS } = loadData();
  const keys = NEWS.map((n) => `${n.title}|${n.kind}`);
  assert.strictEqual(new Set(keys).size, keys.length, 'two rows share a venue and kind — merge their papers');
});

// An acceptance row's date is the VENUE'S author-notification date, not this
// paper's — see the header of data/news.js. Month precision is the whole point:
// a 'YYYY-MM-DD' here would publish the venue's notification day as if we knew it
// was the day this paper was accepted, which we do not.
test('every news date is month precision — YYYY-MM, never a day', () => {
  const { NEWS } = loadData();
  for (const item of NEWS) {
    assert.match(item.date, /^\d{4}-(0[1-9]|1[0-2])$/, `${item.id}: date must be 'YYYY-MM'`);
  }
});

// The Research grid and the News list are one story told twice: every paper
// is dated the same way in both. Each project is named by exactly one
// acceptance or release row, dated the same as the project, so if a date
// drifts in one file and not the other, this fails. An award row comes on top
// of that and cannot predate the acceptance it follows.
test('every project is dated the same as its acceptance or release row', () => {
  const { PROJECTS, NEWS } = loadData();
  for (const p of PROJECTS) {
    const rows = NEWS.filter(
      (n) => n.kind !== 'award' && n.papers.some((paper) => paper.project === p.id)
    );
    assert.strictEqual(rows.length, 1, `${p.id}: expected exactly one acceptance or release row naming it`);
    assert.strictEqual(rows[0].date, p.date, `${p.id}: project date ${p.date} != news date ${rows[0].date}`);
  }
  for (const award of NEWS.filter((n) => n.kind === 'award')) {
    for (const paper of award.papers) {
      const p = PROJECTS.find((q) => q.id === paper.project);
      assert.ok(award.date >= p.date, `${award.id}: an award cannot predate ${p.id}'s acceptance`);
    }
  }
});

// `equal` marks the first N authors as co-first authors. It has to be a whole
// number that fits the author list, or the * would land on the wrong names.
test('every co-first count is a whole number between 2 and the author count', () => {
  const { PROJECTS } = loadData();
  for (const p of PROJECTS) {
    if (p.equal === undefined) continue;
    assert.ok(Number.isInteger(p.equal), `${p.id}: equal must be an integer`);
    assert.ok(p.equal >= 2 && p.equal <= p.authors.length, `${p.id}: equal must be 2..${p.authors.length}`);
  }
});

// Every People card needs a person to name, a known role and a photo on disk —
// a missing file would render as an empty grey box under a real person's name —
// unless the entry says photo: false, which shows initials instead.
test('every member is a known person with a known role and a photo', () => {
  const { MEMBERS, PEOPLE } = loadData();
  assert.ok(Array.isArray(MEMBERS) && MEMBERS.length > 0, 'MEMBERS is empty');
  assert.strictEqual(MEMBERS[0].role, 'professor', 'the professor comes first');
  const seen = new Set();
  for (const m of MEMBERS) {
    assert.ok(PEOPLE[m.person], `${m.person}: not a key of PEOPLE`);
    assert.ok(['professor', 'postdoc', 'phd', 'ms', 'alumni-phd', 'alumni-ms'].includes(m.role), `${m.person}: unknown role ${m.role}`);
    if (m.photo !== false) {
      assert.ok(fs.existsSync(path.join(ROOT, 'assets/people', m.person + '.jpg')), `${m.person}: assets/people/${m.person}.jpg is missing (or set photo: false)`);
    }
    assert.ok(!seen.has(m.person), `${m.person}: listed twice`);
    seen.add(m.person);
  }
});

// Adding a tag means adding it to TAG_TONES in js/render.js. Without this test
// a new tag silently takes whatever colour the hashed fallback gives it, which
// is stable but arbitrary — nobody chose it, and it may collide with a hue that
// means something else. Fail here instead, at the moment the tag is introduced.
test('every tag used by a project has been given a colour on purpose', () => {
  const { PROJECTS } = loadData();
  const fakeWindow = {};
  new Function('window', 'console', fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8'))(
    fakeWindow,
    { warn() {} }
  );
  const tones = fakeWindow.DR.TAG_TONES;
  const used = [...new Set(PROJECTS.flatMap((p) => p.tags || []))].sort();
  const missing = used.filter((tag) => !Object.prototype.hasOwnProperty.call(tones, tag));
  assert.deepStrictEqual(
    missing,
    [],
    `add these to TAG_TONES in js/render.js: ${missing.join(', ')}`
  );
});
