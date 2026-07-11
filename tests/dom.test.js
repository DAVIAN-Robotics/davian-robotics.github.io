'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Shared mixin: real DOM addEventListener stacks handlers per type instead of
// replacing them, so a stub that only stores the latest handler can hide a
// double-bind bug. dispatch() lets tests fire a synthetic event through
// every handler currently registered for a type, same as a real browser.
function withListeners(target) {
  target._handlers = {};
  target.addEventListener = function (type, handler) {
    (this._handlers[type] = this._handlers[type] || []).push(handler);
  };
  target.removeEventListener = function (type, handler) {
    if (!this._handlers[type]) return;
    this._handlers[type] = this._handlers[type].filter((h) => h !== handler);
  };
  target.dispatch = function (type, event) {
    (this._handlers[type] || []).forEach((handler) => handler(event || {}));
  };
  return target;
}

function makeElement(id) {
  const element = {
    id: id,
    innerHTML: '',
    children: [],
    dataset: {},
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
    querySelectorAll() {
      return [];
    },
  };
  return withListeners(element);
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

// --- media/reveal test doubles -------------------------------------------

function makeVideo() {
  return {
    playCalls: 0,
    pauseCalls: 0,
    paused: true,
    readyState: 0,
    play() {
      this.playCalls += 1;
      this.paused = false;
      return undefined;
    },
    pause() {
      this.pauseCalls += 1;
      this.paused = true;
    },
  };
}

function makeCard(video) {
  const card = withListeners({
    classList: {
      _added: [],
      _removed: [],
      add(cls) {
        this._added.push(cls);
      },
      remove(cls) {
        this._removed.push(cls);
      },
      toggle() {},
    },
    dataset: {},
    closest(sel) {
      return sel === '.card' ? card : null;
    },
  });
  if (video) video.closest = (sel) => (sel === '.card' ? card : null);
  return card;
}

// A grid stub whose querySelectorAll understands the two selectors
// attachMedia/attachReveal actually use, backed by real card/video doubles
// so hover, hasten play/pause, and observer targets are all inspectable.
function makeGrid(pairs, id) {
  const grid = makeElement(id || 'grid');
  grid.querySelectorAll = (sel) => {
    if (sel === '.card video') return pairs.map((p) => p.video).filter(Boolean);
    if (sel === '.card') return pairs.map((p) => p.card);
    return [];
  };
  return grid;
}

// Records every IntersectionObserver instance created so a test can find the
// one it cares about (media observers pass {threshold}, reveal observers
// don't) and fire its callback with hand-picked entries.
function makeObserverFactory() {
  const instances = [];
  function FakeObserver(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    this.disconnected = false;
    instances.push(this);
  }
  FakeObserver.prototype.observe = function (target) {
    this.observed.push(target);
  };
  FakeObserver.prototype.unobserve = function (target) {
    this.observed = this.observed.filter((t) => t !== target);
  };
  FakeObserver.prototype.disconnect = function () {
    this.disconnected = true;
    this.observed = [];
  };
  FakeObserver.instances = instances;
  return FakeObserver;
}

function isMediaObserver(observer) {
  return !!(observer.options && observer.options.threshold);
}

function makeMatchMedia(map) {
  return (query) => ({ matches: !!map[query], addEventListener() {} });
}

// The chip click handler resolves the tag via event.target.closest('.chip'),
// so the target can be the chip button itself or a child of it.
function chipClickTarget(tag) {
  const chip = { getAttribute: (attr) => (attr === 'data-tag' ? tag : null) };
  return { getAttribute: () => null, closest: (sel) => (sel === '.chip' ? chip : null) };
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

test('with IntersectionObserver available, grids that exist do get .is-revealing, and cards actually become visible', () => {
  const sandbox = load();
  // A positive control: fires the observer callback synchronously on
  // observe(), same as a real IntersectionObserver does for a target that
  // is already on screen. Without this, the old test only checked the
  // grid-level class and would still pass if no card ever revealed.
  sandbox.IntersectionObserver = function (callback) {
    return {
      observe(target) {
        callback([{ target: target, isIntersecting: true }]);
      },
      unobserve() {},
      disconnect() {},
    };
  };
  const doc = makeDocument(IDS);
  const cardA = makeCard();
  const cardB = makeCard();
  doc.elements['highlights-grid'] = makeGrid([{ card: cardA }], 'highlights-grid');
  doc.elements['research-grid'] = makeGrid([{ card: cardB }], 'research-grid');
  sandbox.DR.mount(doc);
  assert.ok((doc.elements['highlights-grid'].classList._added || []).includes('is-revealing'));
  assert.ok((doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
  assert.ok((cardA.classList._added || []).includes('is-visible'));
  assert.ok((cardB.classList._added || []).includes('is-visible'));
});

// --- media/observer regression tests --------------------------------------

test('a second applyFilter disconnects the media and reveal observers the first one created', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const video = makeVideo();
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  const mediaObservers = () => Observer.instances.filter(isMediaObserver);
  const revealObservers = () => Observer.instances.filter((o) => !isMediaObserver(o));
  assert.strictEqual(mediaObservers().length, 1);
  assert.strictEqual(revealObservers().length, 1);
  const firstMedia = mediaObservers()[0];
  const firstReveal = revealObservers()[0];

  sandbox.DR.applyFilter(doc, 'all');
  assert.strictEqual(mediaObservers().length, 2, 'a new media observer is created');
  assert.strictEqual(revealObservers().length, 2, 'a new reveal observer is created');
  assert.ok(firstMedia.disconnected, 'the first media observer must be disconnected');
  assert.ok(firstReveal.disconnected, 'the first reveal observer must be disconnected');
});

test('re-rendering the research grid does not disconnect the highlights grid observers', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const highlightsVideo = makeVideo();
  const highlightsCard = makeCard(highlightsVideo);
  doc.elements['highlights-grid'] = makeGrid(
    [{ card: highlightsCard, video: highlightsVideo }],
    'highlights-grid'
  );
  const researchVideo = makeVideo();
  const researchCard = makeCard(researchVideo);
  doc.elements['research-grid'] = makeGrid(
    [{ card: researchCard, video: researchVideo }],
    'research-grid'
  );

  sandbox.DR.mount(doc);
  // Identify highlights-grid's observers by what they actually observed,
  // since mount() also creates research-grid's own observers in the same
  // pass and those are expected to get disconnected below.
  const highlightsObservers = Observer.instances.filter(
    (o) => o.observed.includes(highlightsVideo) || o.observed.includes(highlightsCard)
  );
  assert.strictEqual(highlightsObservers.length, 2, 'expected one media + one reveal observer for highlights-grid');

  sandbox.DR.applyFilter(doc, 'humanoid');
  highlightsObservers.forEach((observer) => {
    assert.ok(!observer.disconnected, 'a highlights-grid observer must survive a research-grid re-render');
  });
});

test('exactly one video plays when two cards clear the intersection threshold at once', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const videoA = makeVideo();
  const cardA = makeCard(videoA);
  const videoB = makeVideo();
  const cardB = makeCard(videoB);
  doc.elements['research-grid'] = makeGrid(
    [{ card: cardA, video: videoA }, { card: cardB, video: videoB }],
    'research-grid'
  );

  sandbox.DR.applyFilter(doc, 'all');
  const mediaObserver = Observer.instances.filter(isMediaObserver).pop();

  mediaObserver.callback([
    { target: videoA, isIntersecting: true, intersectionRatio: 0.7 },
    { target: videoB, isIntersecting: true, intersectionRatio: 0.9 },
  ]);
  assert.strictEqual(videoB.playCalls, 1, 'the higher-ratio video plays');
  assert.strictEqual(videoA.playCalls, 0, 'the lower-ratio video never plays');
  assert.strictEqual(videoB.paused, false);

  // Scroll on: only A still clears the threshold now.
  mediaObserver.callback([
    { target: videoA, isIntersecting: true, intersectionRatio: 0.8 },
    { target: videoB, isIntersecting: false, intersectionRatio: 0.1 },
  ]);
  assert.strictEqual(videoA.playCalls, 1, 'the new winner plays');
  assert.ok(videoB.pauseCalls >= 1, 'the previous winner is paused');
});

test('hover-capable device attaches hover listeners, not the media IntersectionObserver', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': false });
  const doc = makeDocument(IDS);
  const video = makeVideo();
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  assert.strictEqual(Observer.instances.filter(isMediaObserver).length, 0);
  assert.ok(card._handlers.mouseenter && card._handlers.mouseenter.length === 1);

  card.dispatch('mouseenter', {});
  assert.strictEqual(video.playCalls, 1);
  card.dispatch('mouseleave', {});
  assert.strictEqual(video.pauseCalls, 1);
});

test('hover-less device attaches the media IntersectionObserver, not hover listeners', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const video = makeVideo();
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  assert.strictEqual(Observer.instances.filter(isMediaObserver).length, 1);
  assert.ok(!card._handlers.mouseenter);
});

test('under prefers-reduced-motion, attachMedia never plays a video, on any device', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({
    '(prefers-reduced-motion: reduce)': true,
    '(hover: none)': true,
  });
  const doc = makeDocument(IDS);
  const video = makeVideo();
  video.paused = false;
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  assert.strictEqual(video.playCalls, 0);
  assert.ok(video.pauseCalls >= 1);
  assert.strictEqual(Observer.instances.filter(isMediaObserver).length, 0);
  assert.ok(!card._handlers.mouseenter);
});

// --- chip click handler regression tests ----------------------------------

test('mount binds the chip click handler only once — a second mount does not double-fire applyFilter', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  sandbox.DR.mount(doc);

  const chips = doc.elements['filter-chips'];
  // Every applyFilter run constructs exactly one new reveal observer for
  // research-grid, so counting new instances is a reliable proxy for how
  // many times applyFilter actually ran off of this one click.
  const before = Observer.instances.length;
  chips.dispatch('click', { target: chipClickTarget('humanoid') });
  const after = Observer.instances.length;
  assert.strictEqual(after - before, 1, 'applyFilter must run exactly once per click');
});

test('chip click handler uses closest(".chip"), so a click on a wrapped label span still filters', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const chips = doc.elements['filter-chips'];
  chips.dispatch('click', { target: chipClickTarget('humanoid') });
  const html = doc.elements['research-grid'].innerHTML;
  assert.match(html, /data-project-id="b"/);
  assert.doesNotMatch(html, /data-project-id="a"/);
});
