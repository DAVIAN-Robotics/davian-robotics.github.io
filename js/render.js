/* Renders the repeating lists from the data files.
 * Static copy lives in index.html — this file never generates it.
 */
(function (global) {
  'use strict';

  var REQUIRED = ['id', 'title', 'authors', 'year', 'date', 'summary.en'];
  var LINK_LABELS = { paper: 'Paper', post: 'Post', video: 'Video', code: 'Code', model: 'Model', data: 'Data', project: 'Project' };
  var LINK_ORDER = ['paper', 'post', 'video', 'code', 'model', 'data', 'project'];
  var NEWS_REQUIRED = ['id', 'title', 'date', 'papers'];
  var NEWS_KINDS = { acceptance: 'Accepted', release: 'Released', award: 'Award' };
  // How many news rows show before the rest fold behind "Show more".
  var NEWS_VISIBLE = 10;

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Reads a dotted path ('summary.en', 'text.en') off a record and asks
  // whether it holds something worth rendering.
  function has(record, field) {
    var value = record;
    var parts = field.split('.');
    for (var i = 0; i < parts.length; i += 1) {
      if (value === undefined || value === null) return false;
      value = value[parts[i]];
    }
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }

  function validate(record, required) {
    var missing = required.filter(function (field) {
      return !has(record, field);
    });
    return { ok: missing.length === 0, missing: missing };
  }

  function keepValid(records, required, what) {
    return (records || []).filter(function (record) {
      var result = validate(record, required);
      if (!result.ok) {
        console.warn(
          'render: skipping ' + what + ' "' + (record && record.id ? record.id : '(no id)') +
            '" — missing required field(s): ' + result.missing.join(', ')
        );
      }
      return result.ok;
    });
  }

  function validateProject(project) {
    return validate(project, REQUIRED);
  }

  function validProjects(projects) {
    return keepValid(projects, REQUIRED, 'project');
  }

  function validateNews(item) {
    return validate(item, NEWS_REQUIRED);
  }

  function validNews(items) {
    return keepValid(items, NEWS_REQUIRED, 'news item');
  }

  /* Newest first. Dates are 'YYYY-MM' (month precision — see the header of
   * data/news.js for why the day is deliberately not published), and that
   * format sorts correctly as a plain string. Array.prototype.sort is stable
   * (ES2019), so items sharing a month keep their order in the file. */
  function sortNews(items) {
    return items.slice().sort(function (a, b) {
      if (a.date === b.date) return 0;
      return a.date < b.date ? 1 : -1;
    });
  }

  /* A news row goes exactly where its project's CARD goes — same rule, same
   * function (cardHref): the project page, or the paper if there is no project
   * page. Clicking "Accepted to CVPR 2026" therefore lands in the same place as
   * clicking the EgoX card, which is the whole point.
   *
   * The destination is resolved from data/projects.js by id, not stored on the
   * news item: a URL written down twice is a URL that will eventually disagree
   * with itself. A news item whose project cannot be found, or whose project has
   * neither a project page nor a paper, renders as plain text — never as a dead
   * link. */
  function newsHref(item, projects) {
    var id = item && item.project;
    if (!id) return '';
    var match = (projects || []).filter(function (project) {
      return project.id === id;
    })[0];
    return match ? cardHref(match.links) : '';
  }

  function textSpan(cls, text) {
    return '<span class="' + cls + '">' + escapeHTML(text) + '</span>';
  }

  /* The words before the paper names, one pattern for every row: "1 paper
   * accepted:", "3 papers accepted:", "1 preprint released:". An item may still
   * carry its own `lead` for a row that fits none of these. */
  function newsLead(item) {
    if (item.lead && item.lead.en) return item.lead;
    var n = item.papers.length;
    if (item.kind === 'release') {
      return { en: n + (n > 1 ? ' preprints' : ' preprint') + ' released:' };
    }
    return { en: n + (n > 1 ? ' papers' : ' paper') + ' accepted:' };
  }

  /* One paper inside a row: its short name, linked wherever its CARD links
   * (newsHref -> cardHref), plus an optional note such as "(spotlight)". */
  function newsPaperHTML(paper, projects) {
    var href = newsHref(paper, projects);
    var name = escapeHTML(paper.name || paper.project);
    var html = href
      ? '<a class="news__paper" href="' + escapeHTML(href) + '">' + name + '</a>'
      : '<span class="news__paper news__paper--static">' + name + '</span>';
    if (paper.note && paper.note.en) {
      // An honour note ("spotlight", "oral", ...) is printed in red.
      html += ' ' + textSpan('news__note' + (paper.note.honor ? ' news__note--honor' : ''),
        '(' + paper.note.en + ')');
    }
    return html;
  }

  /* One row per venue event: "CoRL 2026 — 3 papers accepted: A, B, C." The row
   * itself is not a link any more (a row can name several papers); each paper
   * name is its own link. */
  function newsRowHTML(item, projects) {
    var kind = NEWS_KINDS[item.kind] ? item.kind : '';
    var badge = kind
      ? '<span class="news__kind">' + NEWS_KINDS[kind] + '</span>'
      : '';
    var lead = newsLead(item);
    var papers = item.papers
      .map(function (paper) {
        return newsPaperHTML(paper, projects);
      })
      .join(', ');
    // <time datetime> carries the same 'YYYY-MM' string it prints: a valid
    // month value, and the machine-readable form of exactly the precision we
    // are willing to claim.
    return (
      '<li class="news__item" data-news-id="' + escapeHTML(item.id) + '">' +
      '<div class="news__row">' +
      '<time class="news__date" datetime="' + escapeHTML(item.date) + '">' +
      escapeHTML(item.date) +
      '</time>' +
      '<h3 class="news__title">' + escapeHTML(item.title) + '</h3>' +
      '<p class="news__text">' +
      textSpan('news__lead' + (item.kind === 'award' ? ' news__lead--honor' : ''), lead.en) +
      ' ' + papers + '.</p>' +
      badge +
      '</div>' +
      '</li>'
    );
  }

  /* The newest `visible` rows, then the rest behind a "Show more" button. The
   * folded rows sit in .news__earlier ABOVE the button, so opening it slides them
   * down beneath the visible rows (a CSS grid-rows transition) and the button
   * ends up below them. While closed the block is `inert`: hidden rows must not
   * take keyboard focus. bindNewsToggle wires the click. */
  function newsHTML(items, projects, visible) {
    var limit = visible === undefined ? NEWS_VISIBLE : visible;
    var rows = items.map(function (item) {
      return newsRowHTML(item, projects);
    });
    if (rows.length <= limit) return rows.join('');
    return (
      rows.slice(0, limit).join('') +
      '<li class="news__more">' +
      '<div class="news__earlier" id="news-earlier" inert>' +
      '<ol class="news news--earlier">' + rows.slice(limit).join('') + '</ol>' +
      '</div>' +
      '<button type="button" class="news__toggle" aria-expanded="false" aria-controls="news-earlier">' +
      textSpan('news__toggle-label', NEWS_TOGGLE.more.en) +
      '</button>' +
      '</li>'
    );
  }

  var NEWS_TOGGLE = {
    more: { en: 'Show more' },
    less: { en: 'Show less' },
  };

  /* Opens or closes the folded rows. Pure DOM-in, DOM-out so a test can drive
   * it with plain objects: flips aria-expanded, the open class and `inert`, and
   * relabels the button. */
  function toggleNews(button, earlier) {
    var open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      earlier.classList.add('news__earlier--open');
      earlier.removeAttribute('inert');
    } else {
      earlier.classList.remove('news__earlier--open');
      earlier.setAttribute('inert', '');
    }
    var label = open ? NEWS_TOGGLE.less : NEWS_TOGGLE.more;
    var span = button.querySelector('.news__toggle-label');
    if (span) {
      span.textContent = label.en;
    }
    return open;
  }

  function bindNewsToggle(doc) {
    if (!doc.querySelector) return;
    var button = doc.querySelector('.news__toggle');
    var earlier = doc.getElementById('news-earlier');
    if (!button || !earlier || !button.addEventListener) return;
    button.addEventListener('click', function () {
      toggleNews(button, earlier);
    });
  }

  /* --- people -------------------------------------------------------------- */

  var MEMBER_ROLES = {
    professor: 'Professor',
    postdoc: 'Postdoc',
    phd: 'Ph.D. Student',
    ms: 'M.S. Student',
    'alumni-phd': 'Alumni',
    'alumni-ms': 'Alumni',
    collaborator: 'Collab',
  };

  // "Youngdo Lee" -> "YL", for a member who has no photo yet.
  function initials(name) {
    return String(name)
      .split(/\s+/)
      .map(function (part) {
        return part.charAt(0);
      })
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /* The People order is computed, not hand-kept: the professor first, then
   * everyone else by how many projects on this page list them as an author,
   * most first. A tie keeps the order of window.MEMBERS (sort is stable), so
   * adding a paper to data/projects.js re-orders the section by itself. */
  function paperCount(person, projects) {
    return (projects || []).filter(function (project) {
      return (project.authors || []).indexOf(person) !== -1;
    }).length;
  }

  function sortMembers(members, projects) {
    return (members || []).slice().sort(function (a, b) {
      var ap = a.role === 'professor' ? 1 : 0;
      var bp = b.role === 'professor' ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return paperCount(b.person, projects) - paperCount(a.person, projects);
    });
  }

  /* One card per member, in the order given: photo and name (one link to the
   * person's homepage), role, interests. A member whose
   * person key is not in PEOPLE is skipped — there is no name to print. */
  function peopleHTML(members, people) {
    var dict = people || {};
    return (members || [])
      .filter(function (member) {
        return member && dict[member.person];
      })
      .map(function (member) {
        var person = dict[member.person];
        // The role is its own span so the language swap (which assigns
        // textContent) leaves the affiliation after it alone.
        var roleLabel = MEMBER_ROLES[member.role]
          ? '<span>' + MEMBER_ROLES[member.role] + '</span>'
          : '';
        var affiliation = member.affiliation
          ? (roleLabel ? ' · ' : '') + escapeHTML(member.affiliation)
          : '';
        var role = roleLabel || affiliation
          ? '<p class="person__role">' + roleLabel + affiliation + '</p>'
          : '';
        var photo = member.photo === false
          ? '<div class="person__photo person__photo--initials" aria-hidden="true">' +
            escapeHTML(initials(person.name)) + '</div>'
          : '<img class="person__photo" src="assets/people/' + escapeHTML(member.person) +
            '.jpg" alt="" width="300" height="400" loading="lazy" />';
        var interests = member.interests
          ? '<p class="person__interests">' + escapeHTML(member.interests) + '</p>'
          : '';
        return (
          // Photo and name share one link, and the name is underlined with an
          // arrow at rest, so the card reads as clickable before any hover.
          '<li class="person"><a class="person__link" href="' + escapeHTML(person.url) + '">' +
          photo +
          '<p class="person__name"><span class="person__name-text">' + escapeHTML(person.name) +
          '</span><span class="person__arrow" aria-hidden="true">↗</span></p></a>' +
          role +
          interests +
          '</li>'
        );
      })
      .join('');
  }

  /* Preprints (no venue) first, then everything newest first by `date`.
   * 'YYYY-MM' sorts correctly as a plain string; `year` is for the venue badge,
   * not for ordering (sorting on it is what used to drop the four 2026 papers
   * into alphabetical order). A tie keeps the order of data/projects.js
   * (Array.prototype.sort is stable), so papers from the same month appear in
   * the order they are written there. The News list stays purely by date. */
  function sortProjects(projects) {
    return projects.slice().sort(function (a, b) {
      var ap = a.venue ? 1 : 0;
      var bp = b.venue ? 1 : 0;
      if (ap !== bp) return ap - bp;
      if (a.date === b.date) return 0;
      return a.date < b.date ? 1 : -1;
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

  /* `equal` is how many leading authors are co-first authors; each of them
   * gets a "*" (the legend sits under the Research heading in index.html). */
  function authorsHTML(authors, people, equal) {
    var dict = people || {};
    var marked = equal > 1 ? equal : 0;
    return (authors || [])
      .map(function (entry, index) {
        var person = dict[entry];
        var mark = index < marked ? '<span class="author__mark">*</span>' : '';
        if (!person) return escapeHTML(entry) + mark;
        return (
          '<a class="author" href="' + escapeHTML(person.url) + '">' +
          escapeHTML(person.name) +
          '</a>' + mark
        );
      })
      .join(', ');
  }

  /* A team paper's card can replace its author list with labelled lines
   * (`authorLines`), e.g. "PUBG Ally Team: ..., X, ..." / "Project Lead: ...".
   * `authors` still holds the full list, so People ordering is unaffected.
   * Here lab members (people ids) are bolded so they stand out among the
   * plain-text names. */
  function authorLinesHTML(lines, people) {
    var dict = people || {};
    return (lines || [])
      .map(function (line) {
        var names = (line.authors || [])
          .map(function (entry) {
            var person = dict[entry];
            if (!person) return escapeHTML(entry);
            return (
              '<strong><a class="author author--member" href="' + escapeHTML(person.url) + '">' +
              escapeHTML(person.name) +
              '</a></strong>'
            );
          })
          .join(', ');
        return '<span class="author__label">' + escapeHTML(line.label) + ':</span> ' + names;
      })
      .join('<br>');
  }

  function linksHTML(links) {
    if (!links) return '';
    return LINK_ORDER.filter(function (key) {
      return links[key];
    })
      .map(function (key) {
        return (
          '<a class="btn btn--link" href="' + escapeHTML(links[key]) + '">' +
          '<span>' + LINK_LABELS[key] + '</span></a>'
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

  /* Where a card goes when you click its body: its project page, or the arXiv
   * abstract when it has no project page (SimbaV2's old one 404s). A project
   * with neither is NOT a link — an empty href would reload the page, which is
   * worse than a card that simply does not click. */
  function cardHref(links) {
    if (!links) return '';
    return links.project || links.paper || '';
  }

  /* WHICH COLOUR EACH TAG WEARS. ADDING A TAG MEANS ADDING IT HERE.
   *
   * Keyed by the tag's NAME, never by its position on a card — a tag that took
   * its colour from its index would be purple on one card and sand on the next,
   * which is the whole thing this map exists to prevent. 'manipulation' is pink
   * on every card it appears on, today and after the next paper lands.
   *
   * The values are the four logo hues, defined as --tag-N-ink / --tag-N-bg in
   * css/style.css: 1 deep purple, 2 pink, 3 salmon/rust, 4 sand/bronze. The
   * tag set is closed at seven; the two embodiment tags share pink, and tags that
   * appear together on a card (vla + manipulation, rl + sim2real) never share
   * a hue.
   *
   * A tag that is NOT in this map still renders — it falls back to a hash of its
   * own name, so it is stable and it is one of the four, it just was not chosen.
   * That is the safety net, not the plan: put your tag in the map. */
  var TAG_TONES = {
    vla: 1,
    manipulation: 2,
    locomotion: 2,
    rl: 3,
    sim2real: 4,
    'generative model': 4,
    'embodied ai': 3,
  };

  function tagTone(tag) {
    var name = String(tag);
    if (Object.prototype.hasOwnProperty.call(TAG_TONES, name)) return TAG_TONES[name];
    var sum = 0;
    for (var i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
    return (sum % 4) + 1;
  }

  /* Labels, not controls: <li>s, not buttons. The tag filter they used to drive
   * is shelved (see mount), and these never had click behaviour anyway. */
  function tagsHTML(tags) {
    if (!tags || !tags.length) return '';
    return (
      '<ul class="card__tags">' +
      tags
        .map(function (tag) {
          return (
            '<li class="tag tag--' + tagTone(tag) + '">' + escapeHTML(tag) + '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function cardHTML(project, people) {
    // An honour (Spotlight, Oral, Outstanding Paper Award, ...) is set apart
    // from the venue and printed in red, beside the venue badge.
    var honor = project.honor
      ? '<span class="card__honor">' + escapeHTML(project.honor) + '</span>'
      : '';
    // A paper with no venue yet is a preprint: the row says so rather than
    // leaving the slot empty, so every card has the same line.
    var venue =
      '<div class="card__venue-row">' +
      '<span class="card__venue">' + escapeHTML(project.venue || 'Preprint') + '</span>' +
      honor + '</div>';
    var href = cardHref(project.links);
    // The stretched-link pattern: the title is the only anchor, and CSS blows
    // its ::after up to cover the whole card. It is NOT an <a> wrapped around
    // the card — the card already contains anchors (the link buttons, the author
    // names), and nesting anchors is invalid HTML that browsers silently
    // restructure. css/style.css raises those inner links back above the overlay
    // so they stay independently clickable.
    // CSS clamps the title, the author list and the summary, which is what makes
    // every card the same height. Nothing carries a `title` attribute: the clamps
    // come off on hover and on keyboard focus (see .card:hover / :focus-within in
    // css/style.css), so the full text is revealed in the card, in the selected
    // language. A `title` tooltip would have to be a second copy of the same
    // string — and the last one silently served English to Korean readers.
    var title = href
      ? '<h3 class="card__title"><a class="card__link" href="' + escapeHTML(href) +
        '">' + escapeHTML(project.title) + '</a></h3>'
      : '<h3 class="card__title">' + escapeHTML(project.title) + '</h3>';
    return (
      '<article class="card' + (href ? ' card--linked' : '') +
      '" data-project-id="' + escapeHTML(project.id) + '">' +
      mediaHTML(project.media, project.title) +
      '<div class="card__body">' +
      title +
      venue +
      '<p class="card__authors">' +
      (project.authorLines
        ? authorLinesHTML(project.authorLines, people)
        : authorsHTML(project.authors, people, project.equal)) +
      '</p>' +
      '<p class="card__summary">' +
      escapeHTML(project.summary.en) +
      '</p>' +
      tagsHTML(project.tags) +
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
    var all = '<button class="chip chip--active" data-tag="all">All</button>';
    return (
      all +
      tags
        .map(function (tag) {
          return '<button class="chip" data-tag="' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</button>';
        })
        .join('')
    );
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
          return cardHTML(project, people);
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

  /* THE TAG FILTER IS DELIBERATELY SHELVED — six projects are not worth
   * filtering, so the chip row is not rendered and nothing is bound. The logic
   * itself is alive and still tested (collectTags / filterProjects / chipsHTML /
   * applyFilter), because this comes back the moment the list is long enough to
   * justify it.
   *
   * To re-enable: uncomment the two blocks below, and uncomment #filter-chips in
   * index.html and the .chips / .chip rules in css/style.css. Nothing else has to
   * change — applyFilter(doc, tag) already does the work, and it is what renders
   * the grid today with the tag 'all'.
   */
  /* THE WHOLE CARD IS THE CLICK TARGET, INCLUDING THE PART THAT IS NOT IN IT.
   *
   * The stretched .card__link::after covers the card's own box, and that is not
   * the whole surface. Two regions escaped it:
   *   - the summary and the author paragraph, which sit ABOVE the overlay
   *     (z-index: 1, so the summary stays selectable); and
   *   - the expanded body, which on hover/focus overflows BELOW the card — the
   *     overlay's containing block is the card, whose box never grows, so the
   *     revealed text was a dead zone.
   * Neither is reachable by stretching the overlay, so the grid delegates
   * instead: a click anywhere inside a linked card that is not on a real link
   * goes where the card goes. The overlay stays — it is what gives the card a
   * genuine <a> (focusable, Enter works, the URL shows in the status bar).
   *
   * Bound on the grid, not per card, so re-rendering the cards (applyFilter
   * replaces innerHTML) cannot orphan or duplicate it; the guard makes a second
   * mount() a no-op rather than a double navigation. */
  function bindCardClicks(doc, gridId) {
    var grid = doc.getElementById(gridId);
    if (!grid || !grid.addEventListener) return;
    if (grid.dataset && grid.dataset.cardClickBound) return;
    grid.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      // A real link — a link button, an author's name, or the card's own title
      // anchor (and its ::after, whose clicks are dispatched to the anchor).
      // Leave it alone: it already knows where it is going.
      if (target.closest('a')) return;
      var card = target.closest('.card--linked');
      if (!card || !card.querySelector) return;
      var link = card.querySelector('.card__link');
      if (!link) return;
      // Selecting the summary ends in a click. That is a selection, not a
      // navigation — do not yank the reader off the page for it.
      var selection = global.getSelection && global.getSelection();
      if (selection && String(selection)) return;
      var href = link.getAttribute && link.getAttribute('href');
      if (href && global.location) global.location.href = href;
    });
    if (grid.dataset) grid.dataset.cardClickBound = '1';
  }

  function mount(doc) {
    var projects = sortProjects(validProjects(global.PROJECTS));
    renderInto(doc, 'news-list', newsHTML(sortNews(validNews(global.NEWS)), projects));
    bindNewsToggle(doc);
    renderInto(doc, 'people-list', peopleHTML(sortMembers(global.MEMBERS, projects), global.PEOPLE));
    // renderInto(doc, 'filter-chips', chipsHTML(collectTags(projects)));
    applyFilter(doc, 'all');
    bindCardClicks(doc, 'research-grid');
    // // Bind once: without this guard, a second mount() on the same
    // // #filter-chips node would stack a second click listener and every chip
    // // click would run applyFilter twice.
    // var chips = doc.getElementById('filter-chips');
    // if (chips && chips.addEventListener && !(chips.dataset && chips.dataset.filterBound)) {
    //   chips.addEventListener('click', function (event) {
    //     // closest('.chip'), not a direct getAttribute on event.target: the
    //     // click target can be a child of the chip button (e.g. a
    //     // <span> wrapping its label), which has no data-tag of its own.
    //     var chip = event.target && event.target.closest && event.target.closest('.chip');
    //     var tag = chip && chip.getAttribute && chip.getAttribute('data-tag');
    //     if (tag) applyFilter(doc, tag);
    //   });
    //   if (chips.dataset) chips.dataset.filterBound = '1';
    // }
  }

  global.DR = {
    escapeHTML: escapeHTML,
    validateProject: validateProject,
    validProjects: validProjects,
    sortProjects: sortProjects,
    collectTags: collectTags,
    filterProjects: filterProjects,
    // Exported although mount() no longer calls it: the tag filter is shelved,
    // not deleted, and this keeps it reachable (and tested) until it returns.
    chipsHTML: chipsHTML,
    authorsHTML: authorsHTML,
    authorLinesHTML: authorLinesHTML,
    linksHTML: linksHTML,
    mediaHTML: mediaHTML,
    cardHref: cardHref,
    // Exported so tests/data.test.js can assert that every tag the projects
    // actually use has been given a colour on purpose, rather than silently
    // landing on the hashed fallback.
    TAG_TONES: TAG_TONES,
    tagTone: tagTone,
    tagsHTML: tagsHTML,
    cardHTML: cardHTML,
    validateNews: validateNews,
    validNews: validNews,
    sortNews: sortNews,
    newsHref: newsHref,
    newsHTML: newsHTML,
    newsLead: newsLead,
    toggleNews: toggleNews,
    peopleHTML: peopleHTML,
    sortMembers: sortMembers,
    paperCount: paperCount,
    mount: mount,
    applyFilter: applyFilter,
    // The page mounts one card grid today, but both attachers are keyed by
    // grid id and share one page-wide "only one video plays" winner, so they
    // are exported rather than hidden: a second grid must be able to opt in
    // without duplicating that state.
    attachMedia: attachMedia,
    attachReveal: attachReveal,
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
