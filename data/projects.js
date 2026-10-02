/* The project list. This is the file you edit when a paper lands.
 *
 * Template — copy this object, fill it in, delete the fields you do not have:
 *
 *   {
 *     id: 'short-slug',                       // required, unique, lowercase
 *     title: 'PAPER: Full Title',             // required
 *     authors: ['pmh9960', 'Jane Doe (SNU)'], // required; ids link, plain strings do not
 *     equal: 2,                               // optional; the first N authors are co-first authors (marked *)
 *     venue: 'NeurIPS 2025',                  // optional; leave it out for a preprint and the card says "Preprint"
 *     honor: 'Spotlight',                     // optional; Oral / Spotlight / an award, shown in red beside the venue
 *     year: 2025,                             // required, shown/implied by the badge; use venue year if present, else arXiv posting year
 *     date: '2025-09',                        // required, 'YYYY-MM', SORTS the grid (newest first)
 *     tags: ['vla', 'manipulation'],          // optional; only: rl, vla, manipulation, locomotion, sim2real, generative model
 *     media: {                                // optional; omit until the file exists
 *       type: 'video',                        // 'video' | 'image'
 *       src: 'assets/media/slug.mp4',
 *       poster: 'assets/media/slug.jpg',      // required when type is 'video'
 *     },
 *     summary: { en: 'One or two sentences.' },  // English summary
 *     links: {                                // optional; a missing key renders no button
 *       paper: 'https://arxiv.org/abs/...',
 *       code: 'https://github.com/DAVIAN-Robotics/...',
 *       model: 'https://huggingface.co/DAVIAN-Robotics/...',
 *       data: 'https://huggingface.co/datasets/DAVIAN-Robotics/...',
 *       project: 'https://...',
 *     },
 *     featured: true,                         // inert: the Highlights band this promoted to is gone
 *   }
 *
 * On `date` — it carries exactly the meaning it carries in data/news.js, and it
 * is the same date: an ACCEPTANCE is dated by the venue's official
 * author-notification date (not a per-paper timestamp, which is not public), a
 * RELEASE by its release. The sources for every one of these dates are cited in
 * a table at the top of data/news.js — read that before adding a date here, and
 * do not guess one. Month precision, always: 'YYYY-MM', never 'YYYY-MM-DD'.
 * `date` must agree with `year` (a test enforces it), and it is what orders the
 * grid — so the Research grid and the News list stay in one order.
 *
 * Media budget: 3-6 second loop, H.264 MP4, 2 MB or less, poster image required.
 */
window.PROJECTS = [
  {
    id: 'phuma',
    equal: 2,
    title: 'PHUMA: Physically Reliable Humanoid Locomotion Dataset',
    venue: 'CoRL 2026',
    honor: 'Spotlight',
    authors: [
      'kyungminn',
      'sibisibi',
      'leeyngdo',
      'pmh9960',
      'mynsng',
      'godnpeter',
      'iamproto',
      'joonleesky',
      'jaegulchoo',
    ],
    year: 2026,
    date: '2026-09',
    tags: ['locomotion'],
    media: {
      type: 'video',
      src: 'assets/media/phuma.mp4',
      poster: 'assets/media/phuma.jpg',
    },
    summary: {
      en: 'A large humanoid locomotion dataset, retargeted from human motion with physics constraints to remove artifacts.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2510.26236',
      code: 'https://github.com/DAVIAN-Robotics/PHUMA',
      data: 'https://huggingface.co/datasets/DAVIAN-Robotics/PHUMA',
      project: 'https://davian-robotics.github.io/PHUMA/',
    },
    featured: true,
  },
  {
    id: 'pam',
    equal: 2,
    title: 'Procedural Assistance Memory for Proactive Robot',
    venue: 'CoRL 2026',
    authors: [
      'aiclaudev',
      'pmh9960',
      'entiff',
      'godnpeter',
      'junhahyung',
      'deepshwang',
      'lee15253',
      'jaegulchoo',
    ],
    year: 2026,
    date: '2026-09',
    tags: ['vla', 'manipulation'],
    summary: {
      en: "A proactive robot that remembers a user's daily routine and helps before being asked.",
    },
    links: {
      code: 'https://github.com/DAVIAN-Robotics/PAM',
      project: 'https://davian-robotics.github.io/PAM/',
    },
  },
  {
    id: 'residual-rl',
    title: 'Object-Centric Residual RL for Zero-Shot Sim-to-Real VLA Enhancement',
    venue: 'CoRL 2026',
    authors: [
      'kinam0252',
      'Namiko Saito',
      'Heecheol Kim',
      'Katsushi Ikeuchi',
      'jaegulchoo',
      'Yasuyuki Matsushita',
    ],
    year: 2026,
    date: '2026-09',
    tags: ['rl', 'vla', 'manipulation', 'sim2real'],
    // "Stand Cup Up, Base VLA + Residual" from the project page.
    media: {
      type: 'video',
      src: 'assets/media/residual-rl.mp4',
      poster: 'assets/media/residual-rl.jpg',
    },
    summary: {
      en: "A sim-trained residual RL policy that corrects a VLA's actions, raising real-robot success from 42% to 76%.",
    },
    links: {
      paper: 'https://arxiv.org/abs/2606.18953',
      project: 'https://www.microsoft.com/en-us/research/articles/object-centric-residual-rl/',
    },
  },
  {
    id: 'flashdexretarget',
    equal: 4,
    title: 'FlashDexRetarget: Accelerating Dexterous Manipulation Data Generation through Multi-Motion Retargeting',
    authors: [
      'kyungminn',
      'sibisibi',
      'godnpeter',
      'yoonsangoh',
      'iamproto',
      'leeyngdo',
      'anahrendra',
      'jaegulchoo',
      'joonleesky',
    ],
    year: 2026,
    date: '2026-10',
    tags: ['rl', 'manipulation', 'sim2real'],
    media: {
      type: 'video',
      src: 'assets/media/flashdexretarget.mp4',
      poster: 'assets/media/flashdexretarget.jpg',
    },
    summary: {
      en: 'One RL policy retargets a whole collection of human hand-object demos to a robot hand, with about 100x less compute.',
    },
    links: {
      paper: 'https://davian-robotics.github.io/FlashDexRetarget/static/FlashDexRetarget.pdf',
      project: 'https://davian-robotics.github.io/FlashDexRetarget/',
    },
  },
  {
    id: 'pointmap',
    equal: 2,
    title: 'See like a Robot: Robot-Centric Pointmaps for VLA Models',
    authors: ['lee15253', 'godnpeter', 'k00dj19', 'joonleesky', 'mynsng', 'jaegulchoo', 'pmh9960'],
    year: 2026,
    date: '2026-07',
    tags: ['vla', 'manipulation'],
    media: {
      type: 'video',
      src: 'assets/media/pointmap.mp4',
      poster: 'assets/media/pointmap.jpg',
    },
    summary: {
      en: 'Robot-centric pointmaps give a VLA 3D input in its action frame, making it robust to camera viewpoint changes.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2607.11498',
    },
  },
  {
    id: '3d-hamster',
    equal: 3,
    title:
      '3D HAMSTER: Bridging Planning and Control in Hierarchical Vision Language Action Models through 3D Trajectory Guidance',
    authors: [
      'godnpeter',
      'lee15253',
      'k00dj19',
      'whit3snow',
      'myyzzzoooo',
      'Jueun Mun',
      'pmh9960',
      'joonleesky',
      'mynsng',
      'jaegulchoo',
    ],
    venue: 'IROS 2026',
    year: 2026,
    date: '2026-06',
    tags: ['vla', 'manipulation'],
    media: {
      type: 'video',
      src: 'assets/media/3d-hamster.mp4',
      poster: 'assets/media/3d-hamster.jpg',
    },
    summary: {
      en: 'A VLM planner predicts 3D end-effector trajectories that guide a point-cloud low-level policy.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2606.31329',
      code: 'https://github.com/DAVIAN-Robotics/3D_HAMSTER',
      model: 'https://huggingface.co/DAVIAN-Robotics/3D_HAMSTER',
      project: 'https://davian-robotics.github.io/3D_HAMSTER/',
    },
  },
  {
    id: 'egox',
    equal: 3,
    title: 'EgoX: Egocentric Video Generation from a Single Exocentric Video',
    authors: ['keh0t0', 'kinam0252', 'Dohyeon Kim', 'pmh9960', 'junhahyung', 'jaegulchoo'],
    venue: 'CVPR 2026',
    year: 2026,
    date: '2026-02',
    tags: ['generative model'],
    media: {
      type: 'video',
      src: 'assets/media/egox.mp4',
      poster: 'assets/media/egox.jpg',
    },
    summary: {
      en: 'Generates first-person video from a single third-person video with a video diffusion model.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2512.08269',
      code: 'https://github.com/DAVIAN-Robotics/EgoX',
      model: 'https://huggingface.co/DAVIAN-Robotics/EgoX',
      project: 'https://keh0t0.github.io/EgoX/',
    },
    featured: true,
  },
  {
    id: 'acg',
    equal: 2,
    title: 'ACG: Action Coherence Guidance for Flow-based Vision-Language-Action Models',
    authors: [
      'pmh9960',
      'kinam0252',
      'junhahyung',
      'whit3snow',
      'myyzzzoooo',
      'yeolj00',
      'joonleesky',
      'jaegulchoo',
    ],
    venue: 'ICRA 2026',
    year: 2026,
    date: '2026-01',
    tags: ['vla', 'manipulation', 'generative model'],
    media: {
      type: 'video',
      src: 'assets/media/acg.mp4',
      poster: 'assets/media/acg.jpg',
    },
    summary: {
      en: 'Training-free test-time guidance that makes flow-based VLA actions smoother and more consistent.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2510.22201',
      code: 'https://github.com/DAVIAN-Robotics/ACG',
      model: 'https://huggingface.co/collections/DAVIAN-Robotics/acg-gr00t-n1-2b-post-trained-models',
      project: 'https://davian-robotics.github.io/ACG',
    },
    featured: true,
  },
  {
    id: 'simbav2',
    equal: 2,
    title: 'SimbaV2: Hyperspherical Normalization for Scalable Deep Reinforcement Learning',
    authors: ['joonleesky', 'leeyngdo', 'takuseno', 'iamproto', 'Peter Stone', 'jaegulchoo'],
    venue: 'ICML 2025',
    honor: 'Spotlight',
    year: 2025,
    date: '2025-05',
    tags: ['rl'],
    media: {
      type: 'video',
      src: 'assets/media/simbav2.mp4',
      poster: 'assets/media/simbav2.jpg',
    },
    summary: {
      en: 'Hyperspherical normalization stabilizes RL training so performance keeps improving as models and compute scale.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2502.15280',
      code: 'https://github.com/DAVIAN-Robotics/SimbaV2',
      // The README still points these at dojeon-ai.github.io/SimbaV2/, which is dead.
      // These are the live ones: the repo's Pages site is served from master's docs/,
      // which holds index.html and dataset/index.html.
      data: 'https://davian-robotics.github.io/SimbaV2/dataset/',
      project: 'https://davian-robotics.github.io/SimbaV2/',
    },
    featured: true,
  },
  {
    id: 'flashsac',
    equal: 2,
    title: 'FlashSAC: Fast and Stable Off-Policy Reinforcement Learning for High-Dimensional Robot Control',
    authors: [
      'iamproto',
      'leeyngdo',
      'pmh9960',
      'kinam0252',
      'anahrendra',
      'takuseno',
      'Sehee Min',
      'Daniel Palenicek',
      'Florian Vogt',
      'Danica Kragic',
      'Jan Peters',
      'jaegulchoo',
      'joonleesky',
    ],
    venue: 'RSS 2026',
    honor: 'Outstanding Paper Award',
    year: 2026,
    date: '2026-04',
    tags: ['rl', 'locomotion', 'sim2real'],
    media: {
      type: 'video',
      src: 'assets/media/flashsac.mp4',
      poster: 'assets/media/flashsac.jpg',
    },
    summary: {
      en: 'A fast, stable off-policy RL algorithm that cuts sim-to-real humanoid training from hours to minutes.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2604.04539',
      code: 'https://github.com/Holiday-Robot/FlashSAC',
      project: 'https://holiday-robot.github.io/FlashSAC/',
    },
  },
  {
    id: 'simba',
    equal: 2,
    title: 'SimBa: Simplicity Bias for Scaling Up Parameters in Deep Reinforcement Learning',
    authors: [
      'joonleesky',
      'godnpeter',
      'iamproto',
      'mynsng',
      'Jun Jet Tai',
      'Kaushik Subramanian',
      'Peter R. Wurman',
      'jaegulchoo',
      'Peter Stone',
      'takuseno',
    ],
    venue: 'ICLR 2025',
    honor: 'Spotlight',
    year: 2025,
    date: '2025-01',
    tags: ['rl'],
    media: {
      type: 'video',
      src: 'assets/media/simba.mp4',
      poster: 'assets/media/simba.jpg',
    },
    summary: {
      en: 'An RL network architecture with a simplicity bias, so adding parameters steadily improves performance.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2410.09754',
      code: 'https://github.com/SonyResearch/simba',
      project: 'https://sonyresearch.github.io/simba/',
    },
  },
  {
    id: 'gt7-racing',
    equal: 3,
    title: 'A Champion-level Vision-based Reinforcement Learning Agent for Competitive Racing in Gran Turismo 7',
    authors: [
      'joonleesky',
      'takuseno',
      'Jun Jet Tai',
      'Kaushik Subramanian',
      'Kenta Kawamoto',
      'Peter R. Wurman',
      'Peter Stone',
    ],
    venue: 'RA-L & ICRA 2026',
    year: 2026,
    date: '2026-01',
    tags: ['rl'],
    media: {
      type: 'video',
      src: 'assets/media/gt7-racing.mp4',
      poster: 'assets/media/gt7-racing.jpg',
    },
    summary: {
      en: 'A vision-only RL agent that beats top human drivers in Gran Turismo 7.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2504.09021',
    },
  },
  {
    id: 'dodont',
    title: "Do's and Don'ts: Learning Desirable Skills with Instruction Videos",
    authors: ['mynsng', 'lee15253', 'joonleesky', 'godnpeter', 'iamproto', 'jaegulchoo'],
    venue: 'NeurIPS 2024',
    year: 2024,
    date: '2024-09',
    tags: ['rl', 'locomotion'],
    media: {
      type: 'image',
      src: 'assets/media/dodont.jpg',
    },
    summary: {
      en: "Skill discovery guided by \"do\" and \"don't\" videos, learning desirable skills while avoiding unsafe ones.",
    },
    links: {
      paper: 'https://arxiv.org/abs/2406.00324',
      project: 'https://mynsng.github.io/dodont/',
    },
  },
  {
    id: 'disco-dance',
    equal: 2,
    title: 'DISCO-DANCE: Learning to Discover Skills through Guidance',
    authors: ['mynsng', 'lee15253', 'joonleesky', 'godnpeter', 'jaegulchoo'],
    venue: 'NeurIPS 2023',
    year: 2023,
    date: '2023-09',
    tags: ['rl'],
    media: {
      type: 'video',
      src: 'assets/media/disco-dance.mp4',
      poster: 'assets/media/disco-dance.jpg',
    },
    summary: {
      en: 'Skill discovery that explores better by guiding unconverged skills toward a chosen guide skill.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2310.20178',
      code: 'https://github.com/dojeon-ai/discodance',
      project: 'https://mynsng.github.io/discodance/',
    },
  },
];
