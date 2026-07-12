/* EN/KR toggle. English is the literal content of index.html; Korean comes
 * from window.STRINGS.ko. A key with no translation keeps its English text. */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'dr-lang';

  function resolveLang(search, stored) {
    var match = /[?&]lang=([a-z]{2})/i.exec(search || '');
    var candidate = match ? match[1].toLowerCase() : stored;
    return candidate === 'ko' ? 'ko' : 'en';
  }

  function apply(doc, lang) {
    var dict = (global.STRINGS && global.STRINGS[lang]) || {};
    var nodes = doc.querySelectorAll('[data-i18n]');
    // Assigns textContent, which wipes out any child element — every
    // [data-i18n] node today holds plain text only; a node that gains child
    // markup later must not adopt this attribute as-is.
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-i18n');
      if (node.dataset.i18nEn === undefined) node.dataset.i18nEn = node.textContent;
      var translated = dict[key];
      node.textContent = lang === 'en' || !translated ? node.dataset.i18nEn : translated;
    });
    // Same restore/translate mechanism as above, but for a translatable
    // attribute instead of textContent. Currently only the toggle's
    // aria-label uses this, but the attribute name is fixed to aria-label
    // and the key comes from the node itself, so any node can opt in.
    var ariaNodes = doc.querySelectorAll('[data-i18n-aria]');
    Array.prototype.forEach.call(ariaNodes, function (node) {
      var key = node.getAttribute('data-i18n-aria');
      if (node.dataset.i18nAriaEn === undefined) {
        node.dataset.i18nAriaEn = node.getAttribute('aria-label');
      }
      var translated = dict[key];
      node.setAttribute(
        'aria-label',
        lang === 'en' || !translated ? node.dataset.i18nAriaEn : translated
      );
    });
    // Text that js/render.js generated from a data file carries both
    // languages on the node itself instead of a STRINGS key, since the copy
    // lives in data/projects.js and data/news.js. An empty Korean value falls
    // back to English rather than blanking the node.
    swapPairs(doc, '.card__summary', 'data-summary-en', 'data-summary-ko', lang);
    swapPairs(doc, '.news__text', 'data-news-en', 'data-news-ko', lang);
    if (doc.documentElement) doc.documentElement.lang = lang;
  }

  function swapPairs(doc, selector, enAttr, koAttr, lang) {
    var nodes = doc.querySelectorAll(selector);
    Array.prototype.forEach.call(nodes, function (node) {
      var ko = node.getAttribute(koAttr);
      var en = node.getAttribute(enAttr);
      var text = lang === 'ko' && ko ? ko : en;
      node.textContent = text;
      // A clamped card summary carries its full text in `title` so a truncated
      // one can still be read on hover. It is the same string, so it has to
      // follow the language too — otherwise the card reads Korean and its
      // tooltip answers in English.
      if (node.getAttribute('title') !== null) node.setAttribute('title', text);
    });
  }

  function persist(lang) {
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* private mode: the toggle still works, it just does not persist */
    }
  }

  function init(doc) {
    var stored = null;
    try {
      stored = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      stored = null;
    }
    var lang = resolveLang(global.location ? global.location.search : '', stored);
    apply(doc, lang);
    // A ?lang= deep link must behave like the toggle from then on: persist
    // the resolved language immediately, not only on the next click, so a
    // later visit to a plain URL keeps the visitor's choice.
    persist(lang);
    var toggle = doc.getElementById && doc.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      lang = lang === 'en' ? 'ko' : 'en';
      apply(doc, lang);
      persist(lang);
    });
  }

  global.I18N = { resolveLang: resolveLang, apply: apply, init: init };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
