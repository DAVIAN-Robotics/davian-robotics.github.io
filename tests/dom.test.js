'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function makeElement(id) {
  return {
    id: id,
    innerHTML: '',
    children: [],
    // add() records what was added (in addition to the brief's no-op
    // behavior) so tests can assert a class was, or was not, applied —
    // needed for the scroll-reveal fail-safe test below.
    classList: {
      add(cls) {
        (this._added = this._added || []).push(cls);
      },
      remove() {},
      toggle() {},
    },
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

// Loaded in this realm (not vm.createContext) so objects the renderer
// returns compare with assert.deepStrictEqual — a vm context would give
// them a foreign prototype (see tests/render.test.js for the same fix).
function load() {
  const fakeWindow = {};
  const fakeConsole = { warn() {} };
  const code = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8');
  new Function('window', 'console', code)(fakeWindow, fakeConsole);
  fakeWindow.IntersectionObserver = function () {
    return { observe() {}, unobserve() {}, disconnect() {} };
  };
  fakeWindow.matchMedia = () => ({ matches: false, addEventListener() {} });
  fakeWindow.PEOPLE = { pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' } };
  fakeWindow.PROJECTS = [
    { id: 'a', title: 'A', authors: ['pmh9960'], year: 2026, tags: ['vla'],
      summary: { en: 'Alpha.' }, featured: true },
    { id: 'b', title: 'B', authors: ['pmh9960'], year: 2025, tags: ['humanoid'],
      summary: { en: 'Beta.' } },
    { id: 'broken', title: 'Broken' },
  ];
  return fakeWindow;
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

test('with no IntersectionObserver, grids never get .is-revealing — cards stay visible', () => {
  const sandbox = load();
  delete sandbox.IntersectionObserver;
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  assert.ok(!(doc.elements['highlights-grid'].classList._added || []).includes('is-revealing'));
  assert.ok(!(doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
});

test('under prefers-reduced-motion, grids never get .is-revealing either', () => {
  const sandbox = load();
  sandbox.matchMedia = () => ({ matches: true, addEventListener() {} });
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  assert.ok(!(doc.elements['highlights-grid'].classList._added || []).includes('is-revealing'));
  assert.ok(!(doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
});

test('with IntersectionObserver available, grids that exist do get .is-revealing', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  assert.ok((doc.elements['highlights-grid'].classList._added || []).includes('is-revealing'));
  assert.ok((doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
});
