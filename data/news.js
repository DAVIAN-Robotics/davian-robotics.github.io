/* The news list — acceptances and releases, newest first.
 *
 * Template — copy this object, fill it in, put it at the TOP of its year:
 *
 *   {
 *     id: 'slug-venue',                       // required, unique, lowercase
 *     year: 2026,                             // required, sorts the list (newest first)
 *     kind: 'acceptance',                     // required: 'acceptance' | 'release'
 *     title: 'PAPER',                         // required, the short project name
 *     text: {                                 // en required, ko optional
 *       en: 'Accepted to CoRL 2026.',
 *       ko: 'CoRL 2026에 채택되었습니다.',
 *     },
 *     link: 'https://arxiv.org/abs/...',      // required, where the item points
 *   }
 *
 * We do not print dates: no acceptance date on this list is sourced, and a
 * guessed one would read as fact. The year is the ordering key and the only
 * temporal claim the list makes. js/render.js sorts by year descending with a
 * stable sort, so within one year the order below is the order that renders —
 * put the newest item first.
 */
window.NEWS = [
  {
    id: 'flashsac-rss-2026',
    year: 2026,
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
    year: 2026,
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
    year: 2026,
    kind: 'acceptance',
    title: 'ACG',
    text: {
      en: 'Accepted to ICRA 2026.',
      ko: 'ICRA 2026에 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2510.22201',
  },
  {
    id: '3d-hamster-iros-2026',
    year: 2026,
    kind: 'acceptance',
    title: '3D HAMSTER',
    text: {
      en: 'Accepted to IROS 2026.',
      ko: 'IROS 2026에 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2606.31329',
  },
  {
    id: 'simbav2-icml-2025',
    year: 2025,
    kind: 'acceptance',
    title: 'SimbaV2',
    text: {
      en: 'Accepted to ICML 2025 as a spotlight.',
      ko: 'ICML 2025에 spotlight으로 채택되었습니다.',
    },
    link: 'https://arxiv.org/abs/2502.15280',
  },
  {
    // No accepted venue: this is a preprint with a released dataset, so it is
    // written as a release. Do not turn it into an acceptance without one.
    id: 'phuma-release-2025',
    year: 2025,
    kind: 'release',
    title: 'PHUMA',
    text: {
      en: 'Preprint on arXiv, with the humanoid locomotion dataset released on Hugging Face.',
      ko: 'arXiv 프리프린트를 공개하고, 휴머노이드 보행 데이터셋을 Hugging Face에 배포했습니다.',
    },
    link: 'https://arxiv.org/abs/2510.26236',
  },
];
