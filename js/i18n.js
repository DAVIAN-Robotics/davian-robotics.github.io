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
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-i18n');
      if (node.dataset.i18nEn === undefined) node.dataset.i18nEn = node.textContent;
      var translated = dict[key];
      node.textContent = lang === 'en' || !translated ? node.dataset.i18nEn : translated;
    });
    var summaries = doc.querySelectorAll('.card__summary');
    Array.prototype.forEach.call(summaries, function (node) {
      var ko = node.getAttribute('data-summary-ko');
      var en = node.getAttribute('data-summary-en');
      node.textContent = lang === 'ko' && ko ? ko : en;
    });
    if (doc.documentElement) doc.documentElement.lang = lang;
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
    var toggle = doc.getElementById && doc.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.setAttribute('data-lang', lang);
    toggle.addEventListener('click', function () {
      lang = lang === 'en' ? 'ko' : 'en';
      apply(doc, lang);
      toggle.setAttribute('data-lang', lang);
      try {
        if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, lang);
      } catch (err) {
        /* private mode: the toggle still works, it just does not persist */
      }
    });
  }

  global.I18N = { resolveLang: resolveLang, apply: apply, init: init };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
