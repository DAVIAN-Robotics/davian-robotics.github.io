/* The project list. This is the file you edit when a paper lands.
 *
 * Template — copy this object, fill it in, delete the fields you do not have:
 *
 *   {
 *     id: 'short-slug',                       // required, unique, lowercase
 *     title: 'PAPER: Full Title',             // required
 *     authors: ['pmh9960', 'Jane Doe (SNU)'], // required; ids link, plain strings do not
 *     venue: 'NeurIPS 2025',                  // optional, shown as a badge
 *     year: 2025,                             // required, shown/implied by the badge; use venue year if present, else arXiv posting year
 *     date: '2025-09',                        // required, 'YYYY-MM', SORTS the grid (newest first)
 *     tags: ['manipulation', 'vla'],          // optional, drives the filter chips
 *     media: {                                // optional; omit until the file exists
 *       type: 'video',                        // 'video' | 'image'
 *       src: 'assets/media/slug.mp4',
 *       poster: 'assets/media/slug.jpg',      // required when type is 'video'
 *     },
 *     summary: { en: 'One or two sentences.', ko: '한두 문장.' },  // en required, ko optional
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
    id: 'pointmap',
    title: 'See like a Robot: Robot-Centric Pointmaps for Vision-Language-Action Models',
    authors: ['lee15253', 'godnpeter', 'k00dj19', 'joonleesky', 'pmh9960', 'jaegulchoo'],
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
        'Robot-centric pointmaps give a VLA per-pixel 3D in the frame where actions are defined, keeping the policy robust as training-time camera viewpoint variation grows, with one extra encoder and one element-wise addition.',
      ko:
        '로봇 좌표계 포인트맵으로 VLA에 픽셀 단위 3D를 제공해, 학습 시 카메라 시점 변화가 커져도 정책이 강건하게 유지됩니다. 인코더 하나와 element-wise 덧셈만 추가하면 됩니다.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2607.11498',
      project: 'https://davian-robotics.github.io/pointmap/',
    },
  },
  {
    id: '3d-hamster',
    title:
      '3D HAMSTER: Bridging Planning and Control in Hierarchical Vision Language Action Models through 3D Trajectory Guidance',
    authors: [
      'godnpeter',
      'lee15253',
      'k00dj19',
      'whit3snow',
      'myyzzzoooo',
      'moon1x21',
      'pmh9960',
      'joonleesky',
      'mynsng',
      'jaegulchoo',
    ],
    venue: 'IROS 2026',
    year: 2026,
    date: '2026-06',
    tags: ['vla', 'manipulation', 'planning'],
    media: {
      type: 'video',
      src: 'assets/media/3d-hamster.mp4',
      poster: 'assets/media/3d-hamster.jpg',
    },
    summary: {
      en:
        'A depth-aware VLM planner that predicts metrically grounded 3D end-effector trajectories from a single RGB-D observation and a language instruction, feeding directly into a point-cloud low-level policy.',
      ko:
        '단일 RGB-D 관측과 언어 지시로부터 3D 종단 이펙터 궤적을 예측하는 깊이 인지 VLM 플래너로, 포인트 클라우드 기반 저수준 정책으로 바로 연결됩니다.',
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
    title: 'EgoX: Egocentric Video Generation from a Single Exocentric Video',
    authors: ['keh0t0', 'kinam0252', 'Dohyeon Kim', 'pmh9960', 'junhahyung', 'jaegulchoo'],
    venue: 'CVPR 2026',
    year: 2026,
    date: '2026-02',
    tags: ['video generation', 'egocentric'],
    media: {
      type: 'video',
      src: 'assets/media/egox.mp4',
      poster: 'assets/media/egox.jpg',
    },
    summary: {
      en:
        'A video generation framework that produces first-person egocentric video from a single third-person exocentric video, built on large-scale video diffusion models and lightweight LoRA adaptation.',
      ko:
        '단일 3인칭 영상으로부터 1인칭 시점 영상을 생성하는 프레임워크로, 대규모 비디오 디퓨전 모델과 경량 LoRA 적응을 기반으로 합니다.',
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
    tags: ['vla', 'manipulation', 'test-time guidance'],
    media: {
      type: 'video',
      src: 'assets/media/acg.mp4',
      poster: 'assets/media/acg.jpg',
    },
    summary: {
      en:
        'A training-free, test-time guidance algorithm that improves temporal and spatial action consistency in flow-based Vision-Language-Action models, reducing motion jitter and trajectory drift.',
      ko:
        '학습 없이 추론 시점에서 흐름 기반 VLA 모델의 시간적·공간적 행동 일관성을 개선하여 모션 지터와 궤적 이탈을 줄이는 가이던스 알고리즘입니다.',
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
    id: 'phuma',
    title: 'PHUMA: Physically Reliable Humanoid Locomotion Dataset',
    // No accepted venue. This is what it is — do not upgrade it to a conference
    // without an acceptance. Its news item says the same thing (a release).
    venue: 'Preprint (arXiv)',
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
    year: 2025,
    date: '2025-10',
    tags: ['humanoid', 'locomotion', 'dataset'],
    media: {
      type: 'video',
      src: 'assets/media/phuma.mp4',
      poster: 'assets/media/phuma.jpg',
    },
    summary: {
      en:
        'A high-quality humanoid locomotion dataset built from large-scale human motion data, using careful curation and physics-constrained retargeting to eliminate physical artifacts.',
      ko:
        '대규모 인간 동작 데이터를 정교한 큐레이션과 물리 제약 리타겟팅으로 정제하여 물리적 아티팩트를 제거한 고품질 휴머노이드 보행 데이터셋입니다.',
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
    id: 'simbav2',
    title: 'SimbaV2: Hyperspherical Normalization for Scalable Deep Reinforcement Learning',
    authors: ['joonleesky', 'leeyngdo', 'Takuma Seno', 'iamproto', 'Peter Stone', 'jaegulchoo'],
    venue: 'ICML 2025 (spotlight)',
    year: 2025,
    date: '2025-05',
    tags: ['reinforcement learning'],
    media: {
      type: 'video',
      src: 'assets/media/simbav2.mp4',
      poster: 'assets/media/simbav2.jpg',
    },
    summary: {
      en:
        'A reinforcement learning architecture that stabilizes training via hyperspherical normalization, achieving state-of-the-art results on 57 continuous control tasks by scaling model capacity and compute.',
      ko:
        '초구면 정규화를 통해 학습을 안정화하는 강화학습 아키텍처로, 모델 용량과 연산량을 확장하여 57개 연속 제어 태스크에서 최고 성능을 달성합니다.',
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
    title: 'FlashSAC: Fast and Stable Off-Policy Reinforcement Learning for High-Dimensional Robot Control',
    authors: [
      'iamproto',
      'leeyngdo',
      'pmh9960',
      'kinam0252',
      'I Made Aswin Nahendra',
      'Takuma Seno',
      'Sehee Min',
      'Daniel Palenicek',
      'Florian Vogt',
      'Danica Kragic',
      'Jan Peters',
      'jaegulchoo',
      'joonleesky',
    ],
    venue: 'RSS 2026',
    year: 2026,
    date: '2026-04',
    tags: ['reinforcement learning', 'sim2real'],
    media: {
      type: 'video',
      src: 'assets/media/flashsac.mp4',
      poster: 'assets/media/flashsac.jpg',
    },
    summary: {
      en:
        'FlashSAC is a fast and stable off-policy reinforcement learning algorithm built on Soft Actor-Critic that sharply reduces gradient updates while scaling up model size and data throughput, bounding weight, feature, and gradient norms to curb critic error accumulation. Across more than 60 tasks in 10 simulators it outperforms PPO and strong off-policy baselines, and in sim-to-real humanoid locomotion it cuts training time from hours to minutes.',
      ko:
        'FlashSAC는 Soft Actor-Critic 기반의 빠르고 안정적인 오프폴리시 강화학습 알고리즘으로, 그래디언트 업데이트 횟수를 크게 줄이는 대신 모델 크기와 데이터 처리량을 확장하고 가중치·특징·그래디언트 노름을 제한하여 크리틱 오차 누적을 억제합니다. 10개의 시뮬레이터에서 60개 이상의 태스크에 대해 PPO 및 강력한 오프폴리시 베이스라인을 능가하며, 시뮬레이션-실환경 휴머노이드 보행 전이에서는 학습 시간을 시간 단위에서 분 단위로 단축합니다.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2604.04539',
      code: 'https://github.com/Holiday-Robot/FlashSAC',
      project: 'https://holiday-robot.github.io/FlashSAC/',
    },
  },
];
