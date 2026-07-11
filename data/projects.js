/* The project list. This is the file you edit when a paper lands.
 *
 * Template — copy this object, fill it in, delete the fields you do not have:
 *
 *   {
 *     id: 'short-slug',                       // required, unique, lowercase
 *     title: 'PAPER: Full Title',             // required
 *     authors: ['pmh9960', 'Jane Doe (SNU)'], // required; ids link, plain strings do not
 *     venue: 'NeurIPS 2025',                  // optional, shown as a badge
 *     year: 2025,                             // required, sorts the grid (newest first); use venue year if present, else arXiv posting year
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
 *     featured: true,                         // optional; promotes it to the Highlights band
 *   }
 *
 * Media budget: 3-6 second loop, H.264 MP4, 2 MB or less, poster image required.
 */
window.PROJECTS = [
  {
    id: '3d-hamster',
    title:
      '3D HAMSTER: Bridging Planning and Control in Hierarchical Vision Language Action Models through 3D Trajectory Guidance',
    authors: [
      'godnpeter',
      'Byungkun Lee',
      'Dongjin Kim',
      'Hyojin Jang',
      'myyzzzoooo',
      'Jueun Mun',
      'pmh9960',
      'Hojoon Lee',
      'Hyunseung Kim',
      'jaegulchoo',
    ],
    venue: 'IROS 2026',
    year: 2026,
    tags: ['vla', 'manipulation', 'planning'],
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
    authors: ['Taewoong Kang', 'Kinam Kim', 'Dohyeon Kim', 'pmh9960', 'junhahyung', 'jaegulchoo'],
    venue: 'CVPR 2026',
    year: 2026,
    tags: ['video generation', 'egocentric'],
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
      'Kinam Kim',
      'junhahyung',
      'Hyojin Jang',
      'myyzzzoooo',
      'Jooyeol Yun',
      'Hojoon Lee',
      'jaegulchoo',
    ],
    venue: 'ICRA 2026',
    year: 2026,
    tags: ['vla', 'manipulation', 'test-time guidance'],
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
    authors: [
      'kyungminn',
      'Sibeen Kim',
      'Youngdo Lee',
      'pmh9960',
      'Hyunseung Kim',
      'godnpeter',
      'Donghu Kim',
      'Hojoon Lee',
      'jaegulchoo',
    ],
    year: 2025,
    tags: ['humanoid', 'locomotion', 'dataset'],
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
    authors: ['Hojoon Lee', 'Youngdo Lee', 'Takuma Seno', 'Donghu Kim', 'Peter Stone', 'jaegulchoo'],
    venue: 'ICML 2025 (spotlight)',
    year: 2025,
    tags: ['reinforcement learning'],
    summary: {
      en:
        'A reinforcement learning architecture that stabilizes training via hyperspherical normalization, achieving state-of-the-art results on 57 continuous control tasks by scaling model capacity and compute.',
      ko:
        '초구면 정규화를 통해 학습을 안정화하는 강화학습 아키텍처로, 모델 용량과 연산량을 확장하여 57개 연속 제어 태스크에서 최고 성능을 달성합니다.',
    },
    links: {
      paper: 'https://arxiv.org/abs/2502.15280',
      code: 'https://github.com/DAVIAN-Robotics/SimbaV2',
      data: 'https://dojeon-ai.github.io/SimbaV2/dataset/',
      project: 'https://dojeon-ai.github.io/SimbaV2/',
    },
    featured: true,
  },
];
