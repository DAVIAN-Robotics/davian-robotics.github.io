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
  for (const file of ['data/people.js', 'data/projects.js', 'data/news.js', 'data/strings.js']) {
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

test('every news item has the required fields, a known kind, and an absolute link', () => {
  const { NEWS } = loadData();
  assert.ok(NEWS.length > 0, 'NEWS is empty');
  for (const item of NEWS) {
    for (const field of ['id', 'title', 'date', 'kind', 'link']) {
      assert.ok(item[field] !== undefined && item[field] !== null, `${item.id}: missing ${field}`);
    }
    assert.ok(['acceptance', 'release'].includes(item.kind), `${item.id}: kind must be acceptance or release`);
    assert.match(item.link, /^https?:\/\//, `${item.id}: link must be absolute`);
    assert.ok(typeof item.text.en === 'string' && item.text.en.length > 0, `${item.id}: text.en is required`);
  }
});

test('news ids are unique', () => {
  const { NEWS } = loadData();
  const ids = NEWS.map((n) => n.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'duplicate news id');
});

// An acceptance item's date is the VENUE'S author-notification date, not this
// paper's — see the header of data/news.js. Month precision is the whole point:
// a 'YYYY-MM-DD' here would publish the venue's notification day as if we knew it
// was the day this paper was accepted, which we do not.
test('every news date is month precision — YYYY-MM, never a day', () => {
  const { NEWS } = loadData();
  for (const item of NEWS) {
    assert.match(item.date, /^\d{4}-(0[1-9]|1[0-2])$/, `${item.id}: date must be 'YYYY-MM'`);
  }
});

// The Research grid and the News list are one story told twice: the same six
// papers, dated the same way. They are sorted by the same key in the same
// direction (see sortProjects / sortNews), so if a date drifts in one file and
// not the other, the two sections silently disagree about what is newest.
test('every project is dated the same as its news item, so the grid and the list are in one order', () => {
  const { PROJECTS, NEWS } = loadData();
  for (const p of PROJECTS) {
    const items = NEWS.filter((n) => n.id.startsWith(p.id));
    assert.strictEqual(items.length, 1, `${p.id}: expected exactly one news item (id prefixed by the project id)`);
    assert.strictEqual(
      items[0].date,
      p.date,
      `${p.id}: project date ${p.date} != news date ${items[0].date}`
    );
  }
  const byDateDesc = (a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1);
  assert.deepStrictEqual(
    [...PROJECTS].sort(byDateDesc).map((p) => p.date),
    [...NEWS].sort(byDateDesc).map((n) => n.date),
    'the two sections must present the same dates in the same order'
  );
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

test('every Korean string key is a string', () => {
  const { STRINGS } = loadData();
  assert.ok(STRINGS.ko, 'STRINGS.ko is missing');
  for (const [key, value] of Object.entries(STRINGS.ko)) {
    assert.strictEqual(typeof value, 'string', `STRINGS.ko.${key} must be a string`);
  }
});
