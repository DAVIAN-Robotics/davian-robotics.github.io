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
  // Filter by selector, same as the previous test's doc stub: a plain
  // querySelectorAll: () => [node] would hand this same [data-i18n] node
  // back for the '.card__summary' query too, and since its getAttribute
  // stub also ignores which attribute name it's asked for, the summary
  // pass would then clobber the correctly-restored English text — a false
  // failure caused by an unrealistic stub, not a real bug in apply().
  const doc = {
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [node] : []),
    documentElement: {},
  };
  sandbox.I18N.apply(doc, 'ko');
  assert.strictEqual(node.textContent, 'Untranslated');
});
