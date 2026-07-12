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

// play() returns a real Promise by default (like every real browser), so the
// rejected-play path — a real possibility (iOS Low Power Mode, data-saver, a
// preload="none" source that failed to load) — is representable at all.
// Pass { rejectPlay: true } for that path.
function makeVideo(options) {
  const opts = options || {};
  return {
    playCalls: 0,
    pauseCalls: 0,
    paused: true,
    readyState: 0,
    play() {
      this.playCalls += 1;
      this.paused = false;
      return opts.rejectPlay
        ? Promise.reject(new Error('play() rejected (test double)'))
        : Promise.resolve();
    },
    pause() {
      this.pauseCalls += 1;
      this.paused = true;
    },
  };
}

// One microtask tick — enough to let a .then()/.catch() attached directly to
// an already-settled Promise (which is what render.js does) actually run,
// since Promise reactions never run synchronously even for a pre-settled
// Promise. Await this between firing a callback that triggers play() and
// firing a subsequent callback/assertion that depends on the outcome having
// been recorded.
function flushMicrotask() {
  return Promise.resolve();
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

// --- whole-card click doubles ---------------------------------------------

// A click target inside a card. `anchor` is the nearest <a> the real DOM's
// closest('a') would find — null for the regions that have none (the summary
// text, the author paragraph's whitespace, the expanded body's overflow), which
// are exactly the regions the delegated handler exists to cover.
function makeClickTarget(options) {
  const opts = options || {};
  const link = { getAttribute: (n) => (n === 'href' ? opts.cardHref || 'https://example.org/project' : null) };
  const card = {
    querySelector: (sel) => (sel === '.card__link' && !opts.unlinked ? link : null),
  };
  return {
    closest(sel) {
      if (sel === 'a') return opts.anchor || null;
      if (sel === '.card--linked') return opts.unlinked ? null : card;
      return null;
    },
  };
}

// Shelved with the tag filter it belongs to (see the chip tests below): the chip
// click handler resolved the tag via event.target.closest('.chip'), so the target
// could be the chip button itself or a child of it.
// function chipClickTarget(tag) {
//   const chip = { getAttribute: (attr) => (attr === 'data-tag' ? tag : null) };
//   return { getAttribute: () => null, closest: (sel) => (sel === '.chip' ? chip : null) };
// }

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
    { id: 'a', title: 'A', authors: ['pmh9960'], year: 2026, date: '2026-06', tags: ['vla'],
      summary: { en: 'Alpha.' }, links: { project: 'https://example.org/a-project' } },
    { id: 'b', title: 'B', authors: ['pmh9960'], year: 2025, date: '2025-10', tags: ['humanoid'],
      summary: { en: 'Beta.' }, links: { paper: 'https://example.org/b-paper' } },
    { id: 'broken', title: 'Broken' },
  ];
  // Each news item points at the project it is news about; the destination comes
  // from that project's links, not from the news item.
  fakeWindow.NEWS = [
    { id: 'old', date: '2025-10', kind: 'release', title: 'Old',
      text: { en: 'Released.' }, project: 'b' },
    { id: 'new', date: '2026-06', kind: 'acceptance', title: 'New',
      text: { en: 'Accepted.' }, project: 'a' },
  ];
  return fakeWindow;
}

const IDS = ['research-grid', 'filter-chips', 'news-list'];

test('mount renders the news list, newest date first', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const html = doc.elements['news-list'].innerHTML;
  assert.ok(html.indexOf('data-news-id="new"') < html.indexOf('data-news-id="old"'));
  assert.match(html, /href="https:\/\/example\.org\/a-project"/, "the row points where project a's card points");
});

test('mount renders every valid project into the research grid, newest first', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const html = doc.elements['research-grid'].innerHTML;
  assert.ok(html.indexOf('data-project-id="a"') < html.indexOf('data-project-id="b"'));
  assert.doesNotMatch(html, /data-project-id="broken"/);
});

// The tag filter is deliberately shelved (six projects are not worth filtering)
// but NOT deleted — chipsHTML / collectTags / filterProjects are still exercised
// in tests/render.test.js so the logic stays correct for when it comes back.
// This test guards the shelving itself: mount must not render the chip row and
// must not bind anything to it. If someone re-enables the filter, they have to
// come here and say so on purpose.
test('the tag filter is shelved: mount renders no chips and binds no chip handler', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  const chips = doc.elements['filter-chips'];
  assert.strictEqual(chips.innerHTML, '', 'the chip row must stay empty while the filter is shelved');
  assert.strictEqual(chips._handlers.click, undefined, 'no click handler may be bound to the chip row');
  assert.strictEqual(chips.dataset.filterBound, undefined);
});

test('the shelved filter still works — chipsHTML and applyFilter are alive for when it is switched back on', () => {
  const sandbox = load();
  const doc = makeDocument(IDS);
  const html = sandbox.DR.chipsHTML(sandbox.DR.collectTags(sandbox.PROJECTS));
  assert.match(html, /data-tag="all"/);
  assert.match(html, /data-tag="humanoid"/);
  assert.match(html, /data-tag="vla"/);
  sandbox.DR.applyFilter(doc, 'humanoid');
  assert.match(doc.elements['research-grid'].innerHTML, /data-project-id="b"/);
  assert.doesNotMatch(doc.elements['research-grid'].innerHTML, /data-project-id="a"/);
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
  assert.ok(!(doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
});

test('under prefers-reduced-motion, grids never get .is-revealing either', () => {
  const sandbox = load();
  sandbox.matchMedia = () => ({ matches: true, addEventListener() {} });
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  assert.ok(!(doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
});

test('with IntersectionObserver available, a grid that exists does get .is-revealing, and its cards actually become visible', () => {
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
  const card = makeCard();
  doc.elements['research-grid'] = makeGrid([{ card }], 'research-grid');
  sandbox.DR.mount(doc);
  assert.ok((doc.elements['research-grid'].classList._added || []).includes('is-revealing'));
  assert.ok((card.classList._added || []).includes('is-visible'));
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

// The page mounts one card grid today, but attachMedia/attachReveal are keyed
// by grid id and share one page-wide playback winner, so a second grid opting
// in must not be collateral damage when the first one re-renders. These two
// tests drive a second grid through the exported attachers directly.
test('re-rendering the research grid does not disconnect another grid\'s observers', () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const otherVideo = makeVideo();
  const otherCard = makeCard(otherVideo);
  doc.elements['other-grid'] = makeGrid([{ card: otherCard, video: otherVideo }], 'other-grid');
  const researchVideo = makeVideo();
  const researchCard = makeCard(researchVideo);
  doc.elements['research-grid'] = makeGrid(
    [{ card: researchCard, video: researchVideo }],
    'research-grid'
  );

  sandbox.DR.mount(doc);
  sandbox.DR.attachMedia(doc, 'other-grid');
  sandbox.DR.attachReveal(doc, 'other-grid');
  // Identify other-grid's observers by what they actually observed, since
  // research-grid has its own and those are expected to get disconnected.
  const otherObservers = Observer.instances.filter(
    (o) => o.observed.includes(otherVideo) || o.observed.includes(otherCard)
  );
  assert.strictEqual(otherObservers.length, 2, 'expected one media + one reveal observer for other-grid');

  sandbox.DR.applyFilter(doc, 'humanoid');
  otherObservers.forEach((observer) => {
    assert.ok(!observer.disconnected, 'another grid\'s observer must survive a research-grid re-render');
  });
});

test('exactly one video plays when two cards clear the intersection threshold at once', async () => {
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
  await flushMicrotask(); // let B's resolved play() Promise record it as playing

  // Scroll on: only A still clears the threshold now.
  mediaObserver.callback([
    { target: videoA, isIntersecting: true, intersectionRatio: 0.8 },
    { target: videoB, isIntersecting: false, intersectionRatio: 0.1 },
  ]);
  assert.strictEqual(videoA.playCalls, 1, 'the new winner plays');
  assert.ok(videoB.pauseCalls >= 1, 'the previous winner is paused');
});

test('a delta batch that omits the playing video must not pause it — a real observer only reports what changed', async () => {
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

  // A is parked dead-centre and clears the threshold. Nothing about A
  // changes afterward, so a real IntersectionObserver would never mention
  // it again.
  mediaObserver.callback([{ target: videoA, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(videoA.playCalls, 1);
  await flushMicrotask(); // let A's resolved play() Promise record it as playing

  // A later batch about a DIFFERENT, non-qualifying video — no entry for A
  // at all. This must be a no-op for A: still playing, not paused again.
  mediaObserver.callback([{ target: videoB, isIntersecting: true, intersectionRatio: 0.3 }]);
  assert.strictEqual(videoA.pauseCalls, 0, 'A must not be paused by a batch that never mentions it');
  assert.strictEqual(videoA.playCalls, 1, 'A, already recorded as playing, must not be re-played either');
  assert.strictEqual(videoA.paused, false, 'A must still be the one playing');
  assert.strictEqual(videoB.playCalls, 0, 'B never qualified, so it must never play');
});

test('a video whose ratio later drops below threshold IS paused (the fix must not stop pausing altogether)', async () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const video = makeVideo();
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  const mediaObserver = Observer.instances.filter(isMediaObserver).pop();

  mediaObserver.callback([{ target: video, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(video.playCalls, 1);
  await flushMicrotask(); // let the resolved play() Promise record it as playing

  // The SAME video reports a drop below threshold — must be paused.
  mediaObserver.callback([{ target: video, isIntersecting: true, intersectionRatio: 0.4 }]);
  assert.strictEqual(video.pauseCalls, 1, 'a genuine ratio drop for the playing video must pause it');
  assert.strictEqual(video.paused, true);
});

test('a successful play() IS recorded as playing, so a later no-op batch does not call play() again', async () => {
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

  mediaObserver.callback([{ target: videoA, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(videoA.playCalls, 1);
  await flushMicrotask(); // let the resolved play() Promise record A as playing

  // A different, non-qualifying video shows up in a later batch. If the
  // success hadn't been recorded, currentlyPlayingVideo would still be
  // null and A — still the only qualifying entry — would get play() called
  // on it a second time here.
  mediaObserver.callback([{ target: videoB, isIntersecting: true, intersectionRatio: 0.2 }]);
  assert.strictEqual(videoA.playCalls, 1, 'a recorded, still-qualifying winner must not be re-played');
  assert.strictEqual(videoA.pauseCalls, 0);
});

test('a rejected play() is not recorded as playing, so a subsequent callback retries it', async () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const video = makeVideo({ rejectPlay: true });
  const card = makeCard(video);
  doc.elements['research-grid'] = makeGrid([{ card, video }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  const mediaObserver = Observer.instances.filter(isMediaObserver).pop();

  mediaObserver.callback([{ target: video, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(video.playCalls, 1);
  await flushMicrotask(); // let the rejected play() Promise clear the false "playing" record

  // The same video is still the top-ratio entry in a later batch. Since the
  // previous attempt was never recorded as playing, this must retry — a
  // frozen poster that never plays again would be the bug.
  mediaObserver.callback([{ target: video, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(video.playCalls, 2, 'a rejected play must be retried on the next qualifying callback, not frozen');
});

test('two grids share one page-wide winner — a batch from one must not pause a video playing in the other', async () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const otherVideo = makeVideo();
  const otherCard = makeCard(otherVideo);
  doc.elements['other-grid'] = makeGrid([{ card: otherCard, video: otherVideo }], 'other-grid');
  const researchVideo = makeVideo();
  const researchCard = makeCard(researchVideo);
  doc.elements['research-grid'] = makeGrid(
    [{ card: researchCard, video: researchVideo }],
    'research-grid'
  );

  sandbox.DR.mount(doc);
  sandbox.DR.attachMedia(doc, 'other-grid');
  const otherObserver = Observer.instances.find((o) => isMediaObserver(o) && o.observed.includes(otherVideo));
  const researchObserver = Observer.instances.find((o) => isMediaObserver(o) && o.observed.includes(researchVideo));
  assert.ok(otherObserver && researchObserver && otherObserver !== researchObserver);

  // The research video is fully on screen and playing.
  researchObserver.callback([{ target: researchVideo, isIntersecting: true, intersectionRatio: 1 }]);
  assert.strictEqual(researchVideo.playCalls, 1);
  await flushMicrotask(); // let the resolved play() Promise record it as playing

  // The user has scrolled away from the other grid; its observer fires with a
  // single non-qualifying entry. This must not touch the research video at
  // all — the two grids share one page-wide winner, not one each.
  otherObserver.callback([{ target: otherVideo, isIntersecting: true, intersectionRatio: 0.1 }]);
  assert.strictEqual(researchVideo.pauseCalls, 0, 'the research video must not be paused by another grid\'s batch');
  assert.strictEqual(researchVideo.paused, false);
  assert.strictEqual(otherVideo.playCalls, 0, 'the non-qualifying video must never play');
});

test('re-rendering a grid purges its stale videos from the page-wide ratio state', async () => {
  const sandbox = load();
  const Observer = makeObserverFactory();
  sandbox.IntersectionObserver = Observer;
  sandbox.matchMedia = makeMatchMedia({ '(hover: none)': true });
  const doc = makeDocument(IDS);
  const videoA = makeVideo();
  const cardA = makeCard(videoA);
  doc.elements['research-grid'] = makeGrid([{ card: cardA, video: videoA }], 'research-grid');

  sandbox.DR.applyFilter(doc, 'all');
  const firstObserver = Observer.instances.filter(isMediaObserver).pop();
  // Old video A is at a HIGH ratio (0.9) when the grid gets re-rendered out
  // from under it — the worst case for a stale entry, since it would
  // outrank a genuinely-on-screen replacement at a lower-but-qualifying
  // ratio.
  firstObserver.callback([{ target: videoA, isIntersecting: true, intersectionRatio: 0.9 }]);
  assert.strictEqual(videoA.playCalls, 1);
  await flushMicrotask(); // confirm A is genuinely, fully recorded as playing before it gets torn down

  // Re-render research-grid with a brand new video in the same slot.
  const videoC = makeVideo();
  const cardC = makeCard(videoC);
  doc.elements['research-grid'] = makeGrid([{ card: cardC, video: videoC }], 'research-grid');
  sandbox.DR.applyFilter(doc, 'all');
  const secondObserver = Observer.instances.filter(isMediaObserver).pop();

  // videoC qualifies (0.7 > 0.6) but is lower than videoA's stale 0.9. If
  // videoA were not purged from videoRatios on re-render, it would still
  // "win" (higher ratio) and videoC would never play — even though videoA
  // is a detached node no observer will ever report on again.
  secondObserver.callback([{ target: videoC, isIntersecting: true, intersectionRatio: 0.7 }]);
  assert.strictEqual(videoC.playCalls, 1, 'the new video must play — the old grid\'s stale entry must not block it');
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

// --- whole-card click ------------------------------------------------------

test('clicking a dead region of a card — the summary, or the expanded overflow — navigates to the project page', () => {
  const sandbox = load();
  sandbox.location = { href: '' };
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  doc.elements['research-grid'].dispatch('click', {
    target: makeClickTarget({ cardHref: 'https://davian-robotics.github.io/ACG' }),
  });
  assert.strictEqual(sandbox.location.href, 'https://davian-robotics.github.io/ACG');
});

// The pair that is easy to break while fixing the above: a click that lands on a
// real link must be left entirely alone, or every Paper button and every author
// name would be hijacked to the project page.
test('clicking a real link inside a card — a link button, an author — is left alone', () => {
  const sandbox = load();
  sandbox.location = { href: '' };
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  doc.elements['research-grid'].dispatch('click', {
    target: makeClickTarget({ anchor: { href: 'https://arxiv.org/abs/2510.22201' } }),
  });
  assert.strictEqual(sandbox.location.href, '', 'the anchor must handle its own click — the card must not steal it');
});

test('a card with no destination does not navigate anywhere', () => {
  const sandbox = load();
  sandbox.location = { href: '' };
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  doc.elements['research-grid'].dispatch('click', { target: makeClickTarget({ unlinked: true }) });
  assert.strictEqual(sandbox.location.href, '');
});

// Selecting the summary text ends in a click. Navigating on it would yank the
// reader off the page mid-selection.
test('a click that ends a text selection does not navigate', () => {
  const sandbox = load();
  sandbox.location = { href: '' };
  sandbox.getSelection = () => ({ toString: () => 'some text the reader just selected' });
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  doc.elements['research-grid'].dispatch('click', { target: makeClickTarget({}) });
  assert.strictEqual(sandbox.location.href, '');
});

test('the card click handler is bound once — a second mount does not double-navigate', () => {
  const sandbox = load();
  sandbox.location = { href: '' };
  const doc = makeDocument(IDS);
  sandbox.DR.mount(doc);
  sandbox.DR.mount(doc);
  assert.strictEqual(
    doc.elements['research-grid']._handlers.click.length,
    1,
    'exactly one click handler on the grid'
  );
});

// The two tests that used to live here drove the chip click wiring end to end
// (bind-once, and closest('.chip') resolving a click on a nested label). That
// wiring is commented out in mount() while the filter is shelved, so they have
// nothing to drive. Restore them from git history alongside the filter — they
// are the tests that catch the double-bind bug if it comes back.
