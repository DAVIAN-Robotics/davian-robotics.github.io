/* Renders the repeating lists from the data files.
 * Static copy lives in index.html — this file never generates it.
 */
(function (global) {
  'use strict';

  var REQUIRED = ['id', 'title', 'authors', 'year', 'summary.en'];
  var LINK_LABELS = { paper: 'Paper', code: 'Code', model: 'Model', data: 'Data', project: 'Project' };
  var LINK_ORDER = ['paper', 'code', 'model', 'data', 'project'];

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function has(project, field) {
    if (field === 'summary.en') {
      return !!(project.summary && typeof project.summary.en === 'string' && project.summary.en);
    }
    var value = project[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }

  function validateProject(project) {
    var missing = REQUIRED.filter(function (field) {
      return !has(project, field);
    });
    return { ok: missing.length === 0, missing: missing };
  }

  function validProjects(projects) {
    return (projects || []).filter(function (project) {
      var result = validateProject(project);
      if (!result.ok) {
        console.warn(
          'render: skipping project "' + (project && project.id ? project.id : '(no id)') +
            '" — missing required field(s): ' + result.missing.join(', ')
        );
      }
      return result.ok;
    });
  }

  function sortProjects(projects) {
    return projects.slice().sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      return String(a.title).localeCompare(String(b.title));
    });
  }

  function collectTags(projects) {
    var seen = {};
    projects.forEach(function (project) {
      (project.tags || []).forEach(function (tag) {
        seen[tag] = true;
      });
    });
    return Object.keys(seen).sort();
  }

  function filterProjects(projects, tag) {
    if (!tag || tag === 'all') return projects.slice();
    return projects.filter(function (project) {
      return (project.tags || []).indexOf(tag) !== -1;
    });
  }

  function authorsHTML(authors, people) {
    var dict = people || {};
    return (authors || [])
      .map(function (entry) {
        var person = dict[entry];
        if (!person) return escapeHTML(entry);
        return (
          '<a class="author" href="' + escapeHTML(person.url) + '" target="_blank" rel="noopener">' +
          escapeHTML(person.name) +
          '</a>'
        );
      })
      .join(', ');
  }

  function linksHTML(links) {
    if (!links) return '';
    return LINK_ORDER.filter(function (key) {
      return links[key];
    })
      .map(function (key) {
        return (
          '<a class="btn btn--link" href="' + escapeHTML(links[key]) + '" target="_blank" rel="noopener">' +
          '<span data-i18n="links.' + key + '">' + LINK_LABELS[key] + '</span></a>'
        );
      })
      .join('');
  }

  function mediaHTML(media, title) {
    if (!media || !media.src) {
      return '<div class="card__media card__fallback" aria-hidden="true"><span>' + escapeHTML(title) + '</span></div>';
    }
    if (media.type === 'image') {
      return (
        '<div class="card__media"><img src="' + escapeHTML(media.src) + '" alt="' + escapeHTML(title) +
        '" loading="lazy"></div>'
      );
    }
    return (
      '<div class="card__media">' +
      '<video preload="none" poster="' + escapeHTML(media.poster || '') + '" muted loop playsinline ' +
      'src="' + escapeHTML(media.src) + '" aria-label="' + escapeHTML(title) + ' demo"></video>' +
      '</div>'
    );
  }

  function cardHTML(project, people, opts) {
    var options = opts || {};
    var classes = 'card' + (options.featured ? ' card--featured' : '');
    var venue = project.venue
      ? '<span class="card__venue">' + escapeHTML(project.venue) + '</span>'
      : '';
    return (
      '<article class="' + classes + '" data-project-id="' + escapeHTML(project.id) + '">' +
      mediaHTML(project.media, project.title) +
      '<div class="card__body">' +
      '<h3 class="card__title">' + escapeHTML(project.title) + '</h3>' +
      venue +
      '<p class="card__authors">' + authorsHTML(project.authors, people) + '</p>' +
      '<p class="card__summary" data-summary-en="' + escapeHTML(project.summary.en) + '" ' +
      'data-summary-ko="' + escapeHTML(project.summary.ko || '') + '">' +
      escapeHTML(project.summary.en) +
      '</p>' +
      '<div class="card__links">' + linksHTML(project.links) + '</div>' +
      '</div>' +
      '</article>'
    );
  }

  global.DR = {
    escapeHTML: escapeHTML,
    validateProject: validateProject,
    validProjects: validProjects,
    sortProjects: sortProjects,
    collectTags: collectTags,
    filterProjects: filterProjects,
    authorsHTML: authorsHTML,
    linksHTML: linksHTML,
    mediaHTML: mediaHTML,
    cardHTML: cardHTML,
  };

  // Browser boot: reveal the hero video once it has real frames. 'loadeddata'
  // does not bubble, so the listener is registered on the capture phase at
  // the document root instead of on the (not-yet-rendered) element directly.
  // Guarded so this file stays loadable under Node for the test suite above.
  if (typeof document !== 'undefined') {
    document.addEventListener(
      'loadeddata',
      function (event) {
        var target = event.target;
        if (target && target.classList && target.classList.contains('hero__video')) {
          target.classList.add('is-loaded');
        }
      },
      true
    );

    // The listener above only catches the event firing after this script
    // runs. Since the script tag is at the end of <body>, a video served
    // from a warm cache or file:// can already be past HAVE_CURRENT_DATA
    // by the time we get here, in which case 'loadeddata' has already fired
    // and nothing above will ever add .is-loaded. Sweep for that case once,
    // synchronously, on top of (not instead of) the listener.
    var hero = document.querySelector('.hero__video');
    if (hero && hero.readyState >= 2) hero.classList.add('is-loaded');
  }
})(typeof window !== 'undefined' ? window : globalThis);
