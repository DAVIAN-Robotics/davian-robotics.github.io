/* Every person the site can link to.
 *
 * The key is the id you write in a project's `authors` array.
 * Adding someone here makes their name a link everywhere it appears.
 * A name in `authors` that is NOT a key here renders as plain text —
 * that is how external co-authors are written, e.g. "Jane Doe (SNU)".
 */
window.PEOPLE = {
  jaegulchoo: { name: 'Jaegul Choo', url: 'https://sites.google.com/site/jaegulchoo/' },
  pmh9960: { name: 'Minho Park', url: 'https://pmh9960.github.io' },
  aiclaudev: { name: 'Dohyun Lee', url: 'https://aiclaudev.github.io/' },
  // Listed on https://davian.kaist.ac.kr/people; GitHub is the only link the lab page gives.
  entiff: { name: 'Jeonghoon Park', url: 'https://github.com/entiff' },
  // Lab page alumni (Ph.D., 2026); homepage linked from there.
  deepshwang: { name: 'Sungwon Hwang', url: 'https://deepshwang.github.io/' },
  kyungminn: { name: 'Kyungmin Lee', url: 'https://kyungminn.github.io/' },
  myyzzzoooo: { name: 'Hoiyeong Jin', url: 'https://myyzzzoooo.github.io/' },
  godnpeter: { name: 'Dongyoon Hwang', url: 'https://godnpeter.github.io' },
  junhahyung: { name: 'Junha Hyung', url: 'https://junhahyung.github.io' },
  lee15253: { name: 'Byungkun Lee', url: 'https://lee15253.github.io/' },
  joonleesky: { name: 'Hojoon Lee', url: 'https://joonleesky.github.io/' },
  mynsng: { name: 'Hyunseung Kim', url: 'https://mynsng.github.io/' },
  keh0t0: { name: 'Taewoong Kang', url: 'https://keh0t0.github.io/' },
  kinam0252: { name: 'Kinam Kim', url: 'https://kinam0252.github.io/' },
  yeolj00: { name: 'Jooyeol Yun', url: 'https://yeolj00.github.io/' },
  // No personal homepage; the ACG README links her GitHub profile, so that is what we link.
  whit3snow: { name: 'Hyojin Jang', url: 'https://github.com/Whit3Snow' },
  k00dj19: { name: 'Dongjin Kim', url: 'https://k00dj-19.github.io/' },
  sibisibi: { name: 'Sibeen Kim', url: 'https://sibisibi.github.io/' },
  leeyngdo: { name: 'Youngdo Lee', url: 'https://leeyngdo.github.io/' },
  iamproto: { name: 'Donghu Kim', url: 'https://i-am-proto.github.io/' },
};

/* DAVIAN Robotics members, rendered as the People section at the foot of the
 * page. Each entry names a key of window.PEOPLE above (so the name links the
 * same way it does under a paper), a role, and research interests. Current
 * members' interests are copied from the lab page
 * (https://davian.kaist.ac.kr/people); alumni's are summarised from their own
 * homepages. The photo is assets/people/<person>.jpg, 300x400; `photo: false`
 * shows the person's initials until a photo is added.
 *
 *   role: 'professor' | 'postdoc' | 'phd' | 'ms' | 'alumni-phd' | 'alumni-ms'
 *   affiliation: optional, printed after the role ("Ph.D. Student · KRAFTON")
 *
 * Order on the page is automatic (sortMembers in js/render.js): the professor
 * first, then by number of papers in data/projects.js, most first. A tie is
 * broken by the order of THIS list, which is kept in the order people joined
 * the lab (earliest first). Insert a new member at the point where they joined,
 * not at the end.
 */
window.MEMBERS = [
  { person: 'jaegulchoo', role: 'professor' },
  { person: 'entiff', role: 'phd', interests: 'Computer Vision, Safety of AI' },
  {
    person: 'deepshwang',
    role: 'alumni-phd',
    affiliation: 'Samsung Research',
    interests: 'World Models, Robot Learning',
  },
  { person: 'junhahyung', role: 'postdoc', interests: 'NeRF, GAN, 3D Synthesis' },
  { person: 'lee15253', role: 'phd', interests: 'Reinforcement Learning' },
  {
    person: 'joonleesky',
    role: 'alumni-phd',
    affiliation: 'Holiday Robotics',
    interests: 'Deep Reinforcement Learning, Humanoid Manipulation',
  },
  { person: 'mynsng', role: 'phd', affiliation: 'KRAFTON', interests: 'Reinforcement Learning' },
  { person: 'myyzzzoooo', role: 'phd', interests: 'Computer Vision, Generative Models' },
  { person: 'pmh9960', role: 'postdoc', interests: 'Robotics, Diffusion, RL' },
  { person: 'godnpeter', role: 'phd', interests: 'Reinforcement Learning' },
  {
    person: 'leeyngdo',
    role: 'alumni-ms',
    affiliation: 'Holiday Robotics',
    interests: 'Deep Reinforcement Learning, Robot Learning',
  },
  { person: 'kyungminn', role: 'phd', interests: 'GAN, Diffusion Model, Reinforcement Learning' },
  { person: 'whit3snow', role: 'phd', interests: 'Computer Vision, Video Diffusion Models, 3D Vision' },
  { person: 'sibisibi', role: 'phd', interests: 'Medical, Reinforcement Learning' },
  { person: 'k00dj19', role: 'phd', interests: 'VLA, Multimodal' },
  { person: 'keh0t0', role: 'phd', interests: 'Computer Vision, Generative Models, 3D' },
  { person: 'aiclaudev', role: 'phd', interests: 'Natural Language Processing, Large Language Model' },
  {
    person: 'iamproto',
    role: 'alumni-ms',
    affiliation: 'Holiday Robotics',
    interests: 'Reinforcement Learning, Dexterous Manipulation',
  },
  { person: 'kinam0252', role: 'phd', interests: 'Computer Vision, Video Diffusion Models' },
];
