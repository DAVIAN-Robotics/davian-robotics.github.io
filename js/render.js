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

  function renderInto(doc, id, html) {
    var node = doc.getElementById(id);
    if (!node) return null;
    node.innerHTML = html;
    return node;
  }

  function chipsHTML(tags) {
    var all = '<button class="chip chip--active" data-tag="all" data-i18n="filter.all">All</button>';
    return (
      all +
      tags
        .map(function (tag) {
          return '<button class="chip" data-tag="' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</button>';
        })
        .join('')
    );
  }

  function teamHTML(people) {
    return Object.keys(people || {})
      .map(function (id) {
        var person = people[id];
        return (
          '<li><a href="' + escapeHTML(person.url) + '" target="_blank" rel="noopener">' +
          escapeHTML(person.name) +
          '</a></li>'
        );
      })
      .join('');
  }

  // Module-scope observer state. Keyed by grid id so re-rendering one grid
  // (e.g. research-grid on a chip click) disconnects only that grid's
  // previous observer and never touches another grid's already-bound
  // videos/cards.
  var revealObservers = {};
  var mediaObservers = {};
  // videoRatios and currentlyPlayingVideo are intentionally page-wide, not
  // keyed by grid: "one video at a time" is a page-wide guarantee, and
  // IntersectionObserver only delivers entries for targets whose ratio
  // CHANGED, so the winner must be picked from the last known ratio of
  // EVERY tracked video, not just the videos mentioned in one callback
  // batch — a batch about an unrelated video must never look like "nothing
  // qualifies" for the video the user is actually looking at.
  var videoRatios = new Map(); // video element -> last known intersection ratio
  var currentlyPlayingVideo = null;
  // gridId -> videos that grid's last attachMedia call is tracking in
  // videoRatios, so the next re-render can purge exactly those entries
  // (and clear currentlyPlayingVideo if it was one of them) instead of
  // leaking references to nodes applyFilter already replaced via innerHTML.
  var mediaVideosByGrid = {};

  function handleMediaIntersect(entries) {
    entries.forEach(function (entry) {
      videoRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
    });
    // Pick the global max ratio that clears the threshold, reading the
    // whole page-wide map — not just this batch — so a video that hasn't
    // changed (and therefore isn't in this batch at all) still counts.
    var winnerVideo = null;
    var winnerRatio = 0.6;
    videoRatios.forEach(function (ratio, video) {
      if (ratio > winnerRatio) {
        winnerRatio = ratio;
        winnerVideo = video;
      }
    });
    if (currentlyPlayingVideo && currentlyPlayingVideo !== winnerVideo) {
      if (currentlyPlayingVideo.pause) currentlyPlayingVideo.pause();
      currentlyPlayingVideo = null;
    }
    if (winnerVideo && winnerVideo !== currentlyPlayingVideo) {
      var playPromise = winnerVideo.play();
      if (playPromise && typeof playPromise.then === 'function') {
        // play() returns a Promise that can reject (iOS Low Power Mode,
        // data-saver, a preload="none" source that failed to load). Only
        // record the video as playing once that Promise actually resolves
        // — recording it unconditionally would leave a false "this is
        // playing" entry that the winnerVideo !== currentlyPlayingVideo
        // guard above then refuses to ever retry. A rejection is normal
        // autoplay-policy behavior, not an error worth logging.
        playPromise.then(
          function () {
            currentlyPlayingVideo = winnerVideo;
          },
          function () {
            if (currentlyPlayingVideo === winnerVideo) currentlyPlayingVideo = null;
          }
        );
      } else {
        // Older browsers: play() returns undefined synchronously — that IS
        // the success path, so record it right away.
        currentlyPlayingVideo = winnerVideo;
      }
    }
  }

  function applyFilter(doc, tag) {
    var projects = sortProjects(validProjects(global.PROJECTS));
    var people = global.PEOPLE || {};
    renderInto(
      doc,
      'research-grid',
      filterProjects(projects, tag)
        .map(function (project) {
          return cardHTML(project, people, {});
        })
        .join('')
    );
    var chips = doc.getElementById('filter-chips');
    if (chips && chips.querySelectorAll) {
      Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (chip) {
        chip.classList.toggle('chip--active', chip.getAttribute('data-tag') === tag);
      });
    }
    attachMedia(doc, 'research-grid');
    attachReveal(doc, 'research-grid');
    if (global.I18N) global.I18N.apply(doc, doc.documentElement.lang || 'en');
  }

  /* Cards fade in as they enter the viewport. Fail-safe by construction: CSS
   * only hides a card once its grid carries .is-revealing, so a grid that
   * never gets that class (no IntersectionObserver, or reduced motion) just
   * leaves every card visible — never add .is-revealing without something
   * that will also add .is-visible back. Re-run per grid every time its
   * cards are (re)rendered, since filtering replaces the grid's children.
   * The previous observer for this grid (if any) is disconnected first, so
   * repeated re-renders never accumulate observers on detached nodes. */
  function attachReveal(doc, gridId) {
    var grid = doc.getElementById(gridId);
    if (!grid) return;
    if (revealObservers[gridId]) {
      revealObservers[gridId].disconnect();
      delete revealObservers[gridId];
    }
    var reduce =
      typeof global.matchMedia === 'function' &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof global.IntersectionObserver !== 'function') return;
    grid.classList.add('is-revealing');
    var cards = grid.querySelectorAll ? grid.querySelectorAll('.card') : [];
    var observer = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    });
    // A target that is already on screen when observe() is called still
    // fires once with isIntersecting: true (per spec, on the next callback
    // turn), so cards visible at first paint reveal immediately — no
    // separate "already visible" check needed here.
    Array.prototype.forEach.call(cards, function (card) {
      observer.observe(card);
    });
    revealObservers[gridId] = observer;
  }

  /* Exactly one playback path is attached per device, scoped to the grid
   * being (re)rendered: hover-capable devices get play-on-hover; devices
   * with no hover (matchMedia('(hover: none)') — chosen over
   * (pointer: coarse) because it asks the actual question this code cares
   * about, hover capability, rather than pointer precision, which also
   * covers coarse-pointer-but-hover-capable hybrids like some touchscreen
   * laptops) get one-at-a-time playback driven by scroll position. Reduced
   * motion pins every card to its poster regardless of device. The previous
   * media observer for this grid is disconnected first, same as
   * attachReveal, so re-filtering never stacks observers. */
  function attachMedia(doc, gridId) {
    var grid = doc.getElementById(gridId);
    if (!grid) return;
    if (mediaObservers[gridId]) {
      mediaObservers[gridId].disconnect();
      delete mediaObservers[gridId];
    }
    // applyFilter already replaced this grid's innerHTML before calling us,
    // so any videos this grid tracked last time are now detached nodes —
    // drop them from the page-wide ratio map (and the playing slot) before
    // they can outlive their DOM nodes.
    (mediaVideosByGrid[gridId] || []).forEach(function (video) {
      videoRatios.delete(video);
      if (currentlyPlayingVideo === video) currentlyPlayingVideo = null;
    });
    delete mediaVideosByGrid[gridId];
    var reduce =
      typeof global.matchMedia === 'function' &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var videos = grid.querySelectorAll ? grid.querySelectorAll('.card video') : [];
    if (reduce) {
      Array.prototype.forEach.call(videos, function (video) {
        if (video.pause) video.pause();
      });
      return;
    }
    var noHover =
      typeof global.matchMedia === 'function' && global.matchMedia('(hover: none)').matches;
    if (!noHover) {
      Array.prototype.forEach.call(videos, function (video) {
        var card = video.closest ? video.closest('.card') : null;
        if (!card) return;
        card.addEventListener('mouseenter', function () {
          var playing = video.play();
          if (playing && playing.catch) playing.catch(function () {});
        });
        card.addEventListener('mouseleave', function () {
          video.pause();
        });
      });
      return;
    }
    if (typeof global.IntersectionObserver !== 'function') return;
    // Both grids' media observers share this one callback (and the
    // page-wide videoRatios / currentlyPlayingVideo state it reads and
    // writes) — see handleMediaIntersect above for why the winner can't be
    // computed from one observer's own batch alone.
    var observer = new global.IntersectionObserver(handleMediaIntersect, { threshold: [0, 0.6] });
    Array.prototype.forEach.call(videos, function (video) {
      observer.observe(video);
    });
    mediaObservers[gridId] = observer;
    mediaVideosByGrid[gridId] = Array.prototype.slice.call(videos);
  }

  function mount(doc) {
    var people = global.PEOPLE || {};
    var projects = sortProjects(validProjects(global.PROJECTS));
    renderInto(
      doc,
      'highlights-grid',
      projects
        .filter(function (project) {
          return project.featured;
        })
        .map(function (project) {
          return cardHTML(project, people, { featured: true });
        })
        .join('')
    );
    renderInto(doc, 'filter-chips', chipsHTML(collectTags(projects)));
    renderInto(doc, 'team-list', teamHTML(people));
    applyFilter(doc, 'all');
    attachMedia(doc, 'highlights-grid');
    attachReveal(doc, 'highlights-grid');
    // Bind once: without this guard, a second mount() on the same
    // #filter-chips node would stack a second click listener and every chip
    // click would run applyFilter twice.
    var chips = doc.getElementById('filter-chips');
    if (chips && chips.addEventListener && !(chips.dataset && chips.dataset.filterBound)) {
      chips.addEventListener('click', function (event) {
        // closest('.chip'), not a direct getAttribute on event.target: the
        // click target can be a child of the chip button (e.g. an i18n
        // <span> wrapping its label), which has no data-tag of its own.
        var chip = event.target && event.target.closest && event.target.closest('.chip');
        var tag = chip && chip.getAttribute && chip.getAttribute('data-tag');
        if (tag) applyFilter(doc, tag);
      });
      if (chips.dataset) chips.dataset.filterBound = '1';
    }
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
    mount: mount,
    applyFilter: applyFilter,
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

    document.addEventListener('DOMContentLoaded', function () {
      mount(document);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
