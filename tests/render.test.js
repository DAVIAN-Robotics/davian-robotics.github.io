'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function loadRenderer() {
  const warnings = [];
  const fakeWindow = {};
  const fakeConsole = { warn: (...args) => warnings.push(args.join(' ')) };
  const code = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8');
  // Run in this realm so the objects the renderer returns compare with
  // deepStrictEqual — a vm context would give them a foreign prototype.
  new Function('window', 'console', code)(fakeWindow, fakeConsole);
  return { DR: fakeWindow.DR, warnings };
}

const PEOPLE = {
  pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' },
};

const PROJECT = {
  id: 'phuma',
  title: 'PHUMA',
  authors: ['pmh9960', 'Jane Doe (SNU)'],
  venue: 'NeurIPS 2025',
  year: 2025,
  tags: ['humanoid', 'dataset'],
  summary: { en: 'A humanoid locomotion dataset.' },
  links: { paper: 'https://arxiv.org/abs/2510.26236', code: null },
};

test('a complete project validates', () => {
  const { DR } = loadRenderer();
  assert.deepStrictEqual(DR.validateProject(PROJECT), { ok: true, missing: [] });
});

test('a project missing required fields reports every one of them', () => {
  const { DR } = loadRenderer();
  const result = DR.validateProject({ id: 'broken', title: 'T' });
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.missing.sort(), ['authors', 'summary.en', 'year']);
});

test('an invalid project is skipped and warned about, and the valid ones survive', () => {
  const { DR, warnings } = loadRenderer();
  const kept = DR.validProjects([PROJECT, { id: 'broken', title: 'T' }]);
  assert.deepStrictEqual(kept.map((p) => p.id), ['phuma']);
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /broken/);
  assert.match(warnings[0], /authors/);
});

test('projects sort newest first, then by title', () => {
  const { DR } = loadRenderer();
  const sorted = DR.sortProjects([
    { ...PROJECT, id: 'b', title: 'B', year: 2024 },
    { ...PROJECT, id: 'c', title: 'C', year: 2026 },
    { ...PROJECT, id: 'a', title: 'A', year: 2026 },
  ]);
  assert.deepStrictEqual(sorted.map((p) => p.id), ['a', 'c', 'b']);
});

test('tags are collected distinct and alphabetical', () => {
  const { DR } = loadRenderer();
  const tags = DR.collectTags([PROJECT, { ...PROJECT, id: 'x', tags: ['vla', 'humanoid'] }]);
  assert.deepStrictEqual(tags, ['dataset', 'humanoid', 'vla']);
});

test('filtering by a tag keeps only matching projects; all keeps everything', () => {
  const { DR } = loadRenderer();
  const other = { ...PROJECT, id: 'x', tags: ['vla'] };
  assert.deepStrictEqual(DR.filterProjects([PROJECT, other], 'vla').map((p) => p.id), ['x']);
  assert.strictEqual(DR.filterProjects([PROJECT, other], 'all').length, 2);
});

test('a known author becomes a link and an unknown one stays plain text', () => {
  const { DR } = loadRenderer();
  const html = DR.authorsHTML(PROJECT.authors, PEOPLE);
  assert.match(html, /<a [^>]*href="https:\/\/pmh9960\.github\.io"[^>]*>Minho Park<\/a>/);
  assert.match(html, /Jane Doe \(SNU\)/);
  assert.doesNotMatch(html, /<a[^>]*>Jane Doe/);
});

test('only present links render buttons, with fixed labels', () => {
  const { DR } = loadRenderer();
  const html = DR.linksHTML(PROJECT.links);
  assert.match(html, />Paper</);
  assert.doesNotMatch(html, />Code</);
  assert.doesNotMatch(html, />Model</);
});

test('linksHTML tolerates a missing links object', () => {
  const { DR } = loadRenderer();
  assert.strictEqual(DR.linksHTML(undefined), '');
});

test('a video renders with preload none and its poster', () => {
  const { DR } = loadRenderer();
  const html = DR.mediaHTML(
    { type: 'video', src: 'assets/media/phuma.mp4', poster: 'assets/media/phuma.jpg' },
    'PHUMA'
  );
  assert.match(html, /<video[^>]*preload="none"/);
  assert.match(html, /poster="assets\/media\/phuma\.jpg"/);
  assert.match(html, /muted/);
  assert.match(html, /playsinline/);
});

test('absent media falls back to a typographic card, not a broken tag', () => {
  const { DR } = loadRenderer();
  const html = DR.mediaHTML(undefined, 'PHUMA');
  assert.doesNotMatch(html, /<video|<img/);
  assert.match(html, /card__fallback/);
});

test('a card carries its id, title, venue, authors, and summary', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(PROJECT, PEOPLE, {});
  assert.match(html, /data-project-id="phuma"/);
  assert.match(html, /PHUMA/);
  assert.match(html, /NeurIPS 2025/);
  assert.match(html, /Minho Park/);
  assert.match(html, /A humanoid locomotion dataset\./);
});

test('the featured variant is marked so CSS can enlarge it', () => {
  const { DR } = loadRenderer();
  assert.match(DR.cardHTML(PROJECT, PEOPLE, { featured: true }), /card--featured/);
});

test('user-supplied text is escaped, so a stray angle bracket cannot inject markup', () => {
  const { DR } = loadRenderer();
  const html = DR.cardHTML(
    { ...PROJECT, id: 'xss', title: '<img src=x onerror=alert(1)>' },
    PEOPLE,
    {}
  );
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});
