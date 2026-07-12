'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Loaded in this realm (not vm.createContext) so objects compare with
// deepStrictEqual and behave with the real Object prototype — a vm context
// would give them a foreign prototype (see tests/render.test.js, tests/dom.test.js
// for the same fix).
function load() {
  const fakeConsole = { warn() {} };
  const fakeWindow = {};
  const code = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  new Function('window', 'console', code)(fakeWindow, fakeConsole);
  fakeWindow.STRINGS = { ko: { 'nav.research': '연구' } };
  return fakeWindow;
}

// A getAttribute that behaves like the real DOM: honors the attribute name
// asked for and returns null (not undefined, not some unrelated string) for
// one it doesn't have. This project has been bitten before by stubs that
// return the same value regardless of argument — that kind of stub can mask
// a real bug (see the '.card__summary' clobber below) or, as here, produce
// one that isn't there.
function makeAttrNode(attrs, extra) {
  return Object.assign(
    {
      dataset: {},
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
      },
      setAttribute(name, value) {
        attrs[name] = value;
      },
    },
    extra
  );
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
  const node = makeAttrNode(
    { 'data-i18n': 'nav.missing' },
    { textContent: 'Untranslated' }
  );
  // Filter by selector, same as the previous test's doc stub: a plain
  // querySelectorAll: () => [node] would hand this same [data-i18n] node
  // back for the '.card__summary' query too, and (before makeAttrNode) a
  // getAttribute that ignored which attribute it was asked for would let
  // the summary pass clobber the correctly-restored English text — a false
  // failure caused by an unrealistic stub, not a real bug in apply().
  const doc = {
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [node] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.textContent, 'Untranslated');
});

// --- data-i18n-aria (translatable attribute) coverage ---------------------

test('apply swaps a data-i18n-aria attribute to Korean and restores the original English', () => {
  const sandbox = load();
  sandbox.STRINGS = { ko: { 'toggle.lang': 'EN | KR 언어 전환, 현재 한국어' } };
  const node = makeAttrNode({
    'aria-label': 'EN | KR language toggle, currently English',
    'data-i18n-aria': 'toggle.lang',
  });
  const doc = {
    querySelectorAll: (selector) => (selector === '[data-i18n-aria]' ? [node] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.getAttribute('aria-label'), 'EN | KR 언어 전환, 현재 한국어');
  sandbox.I18N.apply(doc, 'en');
  assert.strictEqual(node.getAttribute('aria-label'), 'EN | KR language toggle, currently English');
});

test('a data-i18n-aria key with no Korean translation keeps the original aria-label', () => {
  const sandbox = load();
  const node = makeAttrNode({
    'aria-label': 'Untranslated label',
    'data-i18n-aria': 'toggle.missing',
  });
  const doc = {
    querySelectorAll: (selector) => (selector === '[data-i18n-aria]' ? [node] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.getAttribute('aria-label'), 'Untranslated label');
});

// --- .card__summary coverage ------------------------------------------------
// Previously uncovered: both prior doc stubs returned [] for this selector,
// so the summary swap — and its empty-string fallback — were never actually
// exercised. A blank card summary would have shipped silently.

test('the card summary pass swaps to Korean, restores to English, and falls back to English when the Korean summary is empty', () => {
  const sandbox = load();
  const translated = makeAttrNode(
    { 'data-summary-en': 'An English summary.', 'data-summary-ko': '한국어 요약입니다.' },
    { textContent: 'An English summary.' }
  );
  const noKorean = makeAttrNode(
    { 'data-summary-en': 'Still English only.', 'data-summary-ko': '' },
    { textContent: 'Still English only.' }
  );
  const doc = {
    querySelectorAll: (selector) => (selector === '.card__summary' ? [translated, noKorean] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(translated.textContent, '한국어 요약입니다.');
  assert.strictEqual(noKorean.textContent, 'Still English only.', 'an empty Korean summary must not blank the card');
  sandbox.I18N.apply(doc, 'en');
  assert.strictEqual(translated.textContent, 'An English summary.');
  assert.strictEqual(noKorean.textContent, 'Still English only.');
});

// --- .news__text coverage ---------------------------------------------------
// Same node-carried mechanism as .card__summary, on the text js/render.js
// generates from data/news.js.

test('the news text pass swaps to Korean, restores to English, and falls back to English when the Korean text is empty', () => {
  const sandbox = load();
  const translated = makeAttrNode(
    { 'data-news-en': 'Accepted to RSS 2026.', 'data-news-ko': 'RSS 2026에 채택되었습니다.' },
    { textContent: 'Accepted to RSS 2026.' }
  );
  const noKorean = makeAttrNode(
    { 'data-news-en': 'Released.', 'data-news-ko': '' },
    { textContent: 'Released.' }
  );
  const doc = {
    querySelectorAll: (selector) => (selector === '.news__text' ? [translated, noKorean] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(translated.textContent, 'RSS 2026에 채택되었습니다.');
  assert.strictEqual(noKorean.textContent, 'Released.', 'an empty Korean text must not blank the item');
  sandbox.I18N.apply(doc, 'en');
  assert.strictEqual(translated.textContent, 'Accepted to RSS 2026.');
});

// --- init() coverage ---------------------------------------------------------
// Previously uncovered: the localStorage read/write, the private-mode
// try/catch, and the click wiring — five tests exercised resolveLang three
// times over but init() itself, end to end, had none.

function makeToggle() {
  const handlers = {};
  return Object.assign(
    makeAttrNode({}),
    {
      addEventListener(type, handler) {
        (handlers[type] = handlers[type] || []).push(handler);
      },
      dispatch(type) {
        (handlers[type] || []).forEach((handler) => handler());
      },
    }
  );
}

function makeDoc(node, toggle) {
  return {
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [node] : []),
    documentElement: {},
    getElementById: (id) => (id === 'lang-toggle' ? toggle : null),
  };
}

function makeI18nNode(text) {
  return {
    textContent: text,
    dataset: {},
    getAttribute: (name) => (name === 'data-i18n' ? 'nav.research' : null),
  };
}

test('init honors a stored Korean preference when the query string says nothing', () => {
  const sandbox = load();
  sandbox.localStorage = { getItem: () => 'ko', setItem() {} };
  sandbox.location = { search: '' };
  const node = makeI18nNode('Research');
  const doc = makeDoc(node, makeToggle());
  sandbox.I18N.init(doc);
  assert.strictEqual(node.textContent, '연구');
  assert.strictEqual(doc.documentElement.lang, 'ko');
});

test('init lets ?lang= override a stored preference', () => {
  const sandbox = load();
  sandbox.localStorage = { getItem: () => 'ko', setItem() {} };
  sandbox.location = { search: '?lang=en' };
  const node = makeI18nNode('Research');
  const doc = makeDoc(node, makeToggle());
  sandbox.I18N.init(doc);
  assert.strictEqual(node.textContent, 'Research');
  assert.strictEqual(doc.documentElement.lang, 'en');
});

test('init persists the resolved language immediately, so a ?lang= deep link is not lost on the next plain visit', () => {
  const sandbox = load();
  const writes = [];
  sandbox.localStorage = { getItem: () => null, setItem: (key, value) => writes.push([key, value]) };
  sandbox.location = { search: '?lang=ko' };
  const node = makeI18nNode('Research');
  const doc = makeDoc(node, makeToggle());
  sandbox.I18N.init(doc);
  assert.deepStrictEqual(writes, [['dr-lang', 'ko']]);
});

test('clicking the toggle flips the language and persists the new choice each time', () => {
  const sandbox = load();
  const writes = [];
  sandbox.localStorage = { getItem: () => null, setItem: (key, value) => writes.push([key, value]) };
  sandbox.location = { search: '' };
  const node = makeI18nNode('Research');
  const toggle = makeToggle();
  const doc = makeDoc(node, toggle);
  sandbox.I18N.init(doc);
  assert.strictEqual(node.textContent, 'Research');
  writes.length = 0; // clear the persist-on-load write from init() itself

  toggle.dispatch('click');
  assert.strictEqual(node.textContent, '연구');
  assert.deepStrictEqual(writes, [['dr-lang', 'ko']]);

  toggle.dispatch('click');
  assert.strictEqual(node.textContent, 'Research');
  assert.deepStrictEqual(writes, [['dr-lang', 'ko'], ['dr-lang', 'en']]);
});

test('a localStorage that throws on every access does not prevent the toggle from working', () => {
  const sandbox = load();
  sandbox.localStorage = {
    getItem() {
      throw new Error('SecurityError: private mode');
    },
    setItem() {
      throw new Error('SecurityError: private mode');
    },
  };
  sandbox.location = { search: '' };
  const node = makeI18nNode('Research');
  const toggle = makeToggle();
  const doc = makeDoc(node, toggle);
  assert.doesNotThrow(() => sandbox.I18N.init(doc));
  assert.strictEqual(node.textContent, 'Research');
  assert.doesNotThrow(() => toggle.dispatch('click'));
  assert.strictEqual(node.textContent, '연구');
});
