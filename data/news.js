/* The news list — one row per VENUE EVENT, newest first.
 *
 * A row is "CoRL 2026 — 3 papers accepted: PHUMA (Spotlight), PAM, ...": the
 * venue is the title, and every paper it is about is listed in `papers`. Papers
 * that land at the same venue share ONE row; do not add a second row for the
 * same venue and kind. An honour (Spotlight, Oral, an award) is a red note on
 * its paper, not a row of its own. js/render.js shows the newest ten rows and
 * folds the rest behind "Show more".
 *
 * READ THIS BEFORE ADDING A DATE.
 *
 * We have no per-paper acceptance timestamp for any of these papers, and there is
 * no public source for one. So the date on an ACCEPTANCE row is NOT the day that
 * paper was accepted — it is the VENUE'S OFFICIAL AUTHOR-NOTIFICATION DATE, the
 * day the venue notified all of its authors. That is a real, citable date, and
 * it is the only one we can stand behind:
 *
 *   CoRL 2026   2026-09-04   https://www.corl.org/contributions/call-for-demos
 *   IROS 2026   2026-06-16  https://2026.ieee-iros.org/about/important-dates/
 *   RSS 2026    2026-04-27   https://roboticsconference.org/information/cfp/
 *   CVPR 2026   2026-02-21   https://cvpr.thecvf.com/Conferences/2026/Dates
 *   ICRA 2026   2026-01-31   https://2026.ieee-icra.org/contribute/call-for-icra-2026-papers-now-accepting-submissions/
 *   ICML 2025   2025-05-01   https://icml.cc/Conferences/2025/Dates
 *
 * Two rules follow, and tests enforce both:
 *
 *   1. `date` is MONTH precision — 'YYYY-MM', never 'YYYY-MM-DD'. Printing the day
 *      would present the venue's notification day as if it were this paper's, and
 *      we do not know that. The sourced day belongs in the table above, not on the
 *      page.
 *   2. Adding a row means finding its venue's date and citing it in that table.
 *      Do not guess one, and do not copy a neighbour's.
 *
 * A RELEASE row is dated by the release itself (SeeR-VLA's arXiv id
 * 2607.11498 puts it in July 2026) and claims no venue; its title is 'Preprint'.
 *
 * Template — copy this object and fill it in:
 *
 *   {
 *     id: 'venue-year',                       // required, unique, lowercase
 *     date: '2026-06',                        // required, 'YYYY-MM' — see above
 *     kind: 'acceptance',                     // required: 'acceptance' | 'release'
 *     title: 'IROS 2026',                     // required, the venue (or 'Preprint')
 *     papers: [                               // required, one entry per paper
 *       {
 *         project: 'slug',                    // the id in data/projects.js
 *         name: 'PAPER',                      // the short name printed in the row
 *         note: { en: 'Spotlight', honor: true },  // optional, shown
 *                                             // in ( ); honor: true prints it in red
 *       },
 *     ],
 *   }
 *
 * The words before the names are generated: "1 paper accepted:" / "3 papers
 * accepted:" for an acceptance, "1 preprint released:" for a release.
 *
 * Each paper name links wherever that project's card points — its project page,
 * or its paper if it has no project page. A row carries no URL of its own: every
 * link for a paper lives in data/projects.js, in one place, so the row and the
 * card can never drift apart. A `project` that matches nothing renders as plain
 * text rather than a dead link.
 *
 * js/render.js sorts by `date`, newest first — the date decides the order on the
 * page, not the order in this file.
 */
window.NEWS = [
  {
    id: 'corl-2026',
    date: '2026-09',
    kind: 'acceptance',
    title: 'CoRL 2026',
    papers: [
      { project: 'phuma', name: 'PHUMA', note: { en: 'Spotlight', honor: true } },
      { project: 'pam', name: 'PAM' },
      { project: 'residual-rl', name: 'OCRL' },
    ],
  },
  {
    // A preprint with no arXiv id: dated by its project page, whose repo
    // (DAVIAN-Robotics/FlashDexRetarget) has its first commit on 2026-09-23.
    id: 'preprint-2026-09',
    date: '2026-09',
    kind: 'release',
    title: 'Preprint',
    papers: [{ project: 'flashdexretarget', name: 'FlashDexRetarget' }],
  },
  {
    // No accepted venue yet: a preprint, so it is written as a release and dated
    // by the arXiv posting (2607.11498 -> July 2026). Do not give it a venue.
    id: 'preprint-2026-07',
    date: '2026-07',
    kind: 'release',
    title: 'Preprint',
    papers: [{ project: 'pointmap', name: 'SeeR-VLA' }],
  },
  {
    id: 'iros-2026',
    date: '2026-06',
    kind: 'acceptance',
    title: 'IROS 2026',
    papers: [{ project: '3d-hamster', name: '3D HAMSTER' }],
  },
  {
    // The Outstanding Paper Award was presented at the conference in July 2026;
    // the row keeps the acceptance date, and the award rides on the paper.
    id: 'rss-2026',
    date: '2026-04',
    kind: 'acceptance',
    title: 'RSS 2026',
    papers: [
      {
        project: 'flashsac',
        name: 'FlashSAC',
        note: { en: 'Outstanding Paper Award', honor: true },
      },
    ],
  },
  {
    id: 'cvpr-2026',
    date: '2026-02',
    kind: 'acceptance',
    title: 'CVPR 2026',
    papers: [{ project: 'egox', name: 'EgoX' }],
  },
  {
    id: 'icra-2026',
    date: '2026-01',
    kind: 'acceptance',
    title: 'ICRA 2026',
    // The GT7 racing paper is an RA-L paper presented at ICRA 2026; it rides on
    // the ICRA row and its date, with 'RA-L' as a plain note.
    papers: [
      { project: 'acg', name: 'ACG' },
      { project: 'gt7-racing', name: 'GT7 Racing Agent', note: { en: 'RA-L' } },
    ],
  },
  {
    id: 'icml-2025',
    date: '2025-05',
    kind: 'acceptance',
    title: 'ICML 2025',
    papers: [{ project: 'simbav2', name: 'SimbaV2', note: { en: 'Spotlight', honor: true } }],
  },
  {
    id: 'iclr-2025',
    date: '2025-01',
    kind: 'acceptance',
    title: 'ICLR 2025',
    papers: [{ project: 'simba', name: 'SimBa', note: { en: 'Spotlight', honor: true } }],
  },
  {
    id: 'neurips-2023',
    date: '2023-09',
    kind: 'acceptance',
    title: 'NeurIPS 2023',
    papers: [{ project: 'disco-dance', name: 'DISCO-DANCE' }],
  },
];
