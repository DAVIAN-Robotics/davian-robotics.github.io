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
