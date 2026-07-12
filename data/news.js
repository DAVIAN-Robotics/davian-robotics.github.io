/* The news list — acceptances and releases, newest first.
 *
 * READ THIS BEFORE ADDING A DATE.
 *
 * We have no per-paper acceptance timestamp for any of these papers, and there is
 * no public source for one. So the date on an ACCEPTANCE item is NOT the day that
 * paper was accepted — it is the VENUE'S OFFICIAL AUTHOR-NOTIFICATION DATE, the
 * day the venue notified all of its authors. That is a real, citable date, and it
 * is the only one we can stand behind:
 *
 *   IROS 2026   2026-06-16   https://2026.ieee-iros.org/about/important-dates/
 *   RSS 2026    2026-04-27   https://roboticsconference.org/information/cfp/
 *   CVPR 2026   2026-02-21   https://cvpr.thecvf.com/Conferences/2026/Dates
 *   ICRA 2026   2026-01-31   https://2026.ieee-icra.org/event/notifications-of-acceptance-rejection-sent/
 *   ICML 2025   2025-05-01   https://icml.cc/Conferences/2025/Dates
 *
 * Two rules follow, and tests enforce both:
 *
 *   1. `date` is MONTH precision — 'YYYY-MM', never 'YYYY-MM-DD'. Printing the day
 *      would present the venue's notification day as if it were this paper's, and
 *      we do not know that. The sourced day belongs in the table above, not on the
 *      page.
 *   2. Adding an item means finding its venue's notification date and citing it in
 *      that table. Do not guess one, and do not copy a neighbour's.
 *
 * A RELEASE item is dated by the release itself (PHUMA's arXiv id 2510.26236 puts
 * it in October 2025) and claims no venue.
 *
 * Template — copy this object and fill it in:
 *
 *   {
 *     id: 'slug-venue',                       // required, unique, lowercase
 *     date: '2026-06',                        // required, 'YYYY-MM' — see above
 *     kind: 'acceptance',                     // required: 'acceptance' | 'release'
 *     title: 'PAPER',                         // required, the short project name
 *     text: {                                 // en required, ko optional
 *       en: 'Accepted to CoRL 2026.',
 *       ko: 'CoRL 2026에 채택되었습니다.',
 *     },
 *     link: 'https://arxiv.org/abs/...',      // required, where the item points
 *   }
 *
 * js/render.js sorts by `date`, newest first — the date decides the order on the
 * page, not the order in this file.
 */
window.NEWS = [
  {
    id: '3d-hamster-iros-2026',
    date: '2026-06',
    kind: 'acceptance',
    title: '3D HAMSTER',
    text: {
      en: 'Accepted to IROS 2026.',
      ko: 'IROS 2026에 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2606.31329',
  },
  {
    id: 'flashsac-rss-2026',
    date: '2026-04',
    kind: 'acceptance',
    title: 'FlashSAC',
    text: {
      en: 'Accepted to RSS 2026. Joint work with Holiday Robotics.',
      ko: 'RSS 2026에 채택되었습니다. Holiday Robotics와의 공동 연구입니다.',
    },
    link: 'https://arxiv.org/abs/2604.04539',
  },
  {
    id: 'egox-cvpr-2026',
    date: '2026-02',
    kind: 'acceptance',
    title: 'EgoX',
    text: {
      en: 'Accepted to CVPR 2026.',
      ko: 'CVPR 2026에 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2512.08269',
  },
  {
    id: 'acg-icra-2026',
    date: '2026-01',
    kind: 'acceptance',
    title: 'ACG',
    text: {
      en: 'Accepted to ICRA 2026.',
      ko: 'ICRA 2026에 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2510.22201',
  },
  {
    // No accepted venue: a preprint with a released dataset, so it is written as a
    // release and dated by the arXiv posting. Do not give it a venue.
    id: 'phuma-release-2025',
    date: '2025-10',
    kind: 'release',
    title: 'PHUMA',
    text: {
      en: 'Dataset released on Hugging Face, with the preprint on arXiv.',
      ko: '데이터셋을 Hugging Face에 공개하고, 프리프린트를 arXiv에 게시했습니다.',
    },
    link: 'https://arxiv.org/abs/2510.26236',
  },
  {
    id: 'simbav2-icml-2025',
    date: '2025-05',
    kind: 'acceptance',
    title: 'SimbaV2',
    text: {
      en: 'Accepted to ICML 2025 as a spotlight.',
      ko: 'ICML 2025에 spotlight으로 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2502.15280',
  },
];
