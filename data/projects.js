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
      en:
        'A high-quality humanoid locomotion dataset built from large-scale human motion data, using careful curation and physics-constrained retargeting to eliminate physical artifacts.',
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
      en:
        'A proactive robot assistant that helps before being asked. A VLM uses Procedural Assistance Memory, which represents the user\'s daily routine as a finite-state machine, to decide when and how to help. A VLA executes the task, and a reflection VLM refines the memory at the end of each day without retraining.',
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
    summary: {
      en:
        'A residual RL policy uses object poses to correct a VLA\'s actions. Trained entirely in simulation, it transfers to a real Franka robot without additional training, improving the success rate from 42% to 76% across five manipulation tasks.',
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
    date: '2026-09',
    tags: ['rl', 'manipulation', 'sim2real'],
    media: {
      type: 'video',
      src: 'assets/media/flashdexretarget.mp4',
      poster: 'assets/media/flashdexretarget.jpg',
    },
    summary: {
      en:
        'A single reference-conditioned RL policy, trained with FlashSAC across a whole collection of human hand-object demonstrations, retargets them into physically grounded dexterous robot trajectories. It reaches 90% success on a 50-motion benchmark with about 100x less compute than per-demonstration retargeting, and the retargeted motions replay on a real robot hand.',
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
      en:
        'Robot-centric pointmaps provide a VLA with per-pixel 3D coordinates in the same reference frame as its actions. With just one additional encoder and an element-wise addition, the policy remains robust as camera viewpoint variation increases during training.',
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
      en:
        'A depth-aware VLM planner predicts 3D end-effector trajectories at real-world scale from a single RGB-D observation and a language instruction. These trajectories directly guide a point-cloud-based low-level policy.',
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
      en:
        'A video generation framework that produces first-person egocentric video from a single third-person exocentric video, built on large-scale video diffusion models and lightweight LoRA adaptation.',
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
      en:
        'A training-free, test-time guidance algorithm that improves temporal and spatial action consistency in flow-based Vision-Language-Action models, reducing motion jitter and trajectory drift.',
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
      en:
        'A reinforcement learning architecture that stabilizes training via hyperspherical normalization, achieving state-of-the-art results on 57 continuous control tasks by scaling model capacity and compute.',
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
      en:
        'FlashSAC is a fast and stable off-policy reinforcement learning algorithm built on Soft Actor-Critic that sharply reduces gradient updates while scaling up model size and data throughput, bounding weight, feature, and gradient norms to curb critic error accumulation. Across more than 60 tasks in 10 simulators it outperforms PPO and strong off-policy baselines, and in sim-to-real humanoid locomotion it cuts training time from hours to minutes.',
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
      en:
        'A network architecture that injects a simplicity bias into deep RL, using observation normalization, a residual feedforward block, and layer normalization so that scaling up parameters steadily improves sample efficiency.',
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
      en:
        'A vision-based RL racing agent for Gran Turismo 7 that drives from ego-centric camera images and onboard sensors alone, without global position information, and outperforms the best human drivers in competitive races.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2504.09021',
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
      type: 'image',
      src: 'assets/media/disco-dance.jpg',
    },
    summary: {
      en:
        'An unsupervised skill discovery algorithm that improves exploration by selecting a guide skill and steering unconverged skills toward it, then spreading them out to learn diverse, task-agnostic behaviors.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2310.20178',
      code: 'https://github.com/dojeon-ai/discodance',
      project: 'https://mynsng.github.io/discodance/',
    },
  },
];
