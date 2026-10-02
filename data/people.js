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
  entiff: { name: 'Jeonghoon Park', url: 'https://atjeong.github.io/' },
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
  choyi0521: { name: 'Youngin Cho', url: 'https://youngincho.com/' },
  // No homepage; the lab page links his GitHub.
  jimin9401: { name: 'Jimin Hong', url: 'https://github.com/Jimin9401' },
  yoonsangoh: { name: 'Yoonsang Oh', url: 'https://yoonsangoh.github.io/' },
  // Collaborators outside the lab; they sort into the People section like everyone else.
  anahrendra: { name: 'Aswin Nahrendra', url: 'https://anahrendra.github.io/' },
  takuseno: { name: 'Takuma Seno', url: 'https://takuseno.github.io/' },
};

/* DAVIAN Robotics members, rendered as the People section at the foot of the
 * page. Each entry names a key of window.PEOPLE above (so the name links the
 * same way it does under a paper), a role, and research interests. Interests
 * are at most two of the six research-card tags, in this order: RL, VLA, Manipulation,
 * Locomotion, Sim2Real, Generative Models, Embodied AI. The photo is assets/people/<person>.jpg, 300x400; `photo: false`
 * shows the person's initials until a photo is added.
 *
 *   role: 'professor' | 'postdoc' | 'phd' | 'ms' | 'alumni-phd' | 'alumni-ms' | 'collaborator'
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
  { person: 'entiff', role: 'phd', interests: 'VLA, Manipulation' },
  {
    person: 'deepshwang',
    role: 'alumni-phd',
    affiliation: 'Samsung',
    interests: 'VLA, Generative Models',
  },
  // M.S., graduated February 2023 (lab page). His GitHub avatar is a placeholder, so initials.
  {
    person: 'choyi0521',
    role: 'alumni-ms',
    affiliation: 'KRAFTON',
    interests: 'Embodied AI',
    photo: false,
  },
  { person: 'junhahyung', role: 'postdoc', interests: 'VLA, Generative Models' },
  { person: 'lee15253', role: 'phd', interests: 'VLA, Manipulation' },
  {
    person: 'joonleesky',
    role: 'alumni-phd',
    affiliation: 'Holiday Robotics',
    interests: 'RL, Manipulation',
  },
  { person: 'mynsng', role: 'alumni-phd', affiliation: 'KRAFTON', interests: 'RL, Embodied AI' },
  { person: 'jimin9401', role: 'alumni-phd', affiliation: 'KRAFTON', interests: 'Embodied AI' },
  { person: 'myyzzzoooo', role: 'phd', interests: 'VLA, Generative Models' },
  { person: 'pmh9960', role: 'postdoc', interests: 'VLA, Generative Models' },
  { person: 'godnpeter', role: 'phd', interests: 'RL, VLA' },
  {
    person: 'leeyngdo',
    role: 'alumni-ms',
    affiliation: 'Holiday Robotics',
    interests: 'RL, Sim2Real',
  },
  { person: 'kyungminn', role: 'phd', interests: 'RL, Locomotion' },
  { person: 'whit3snow', role: 'phd', interests: 'VLA, Generative Models' },
  { person: 'sibisibi', role: 'phd', interests: 'RL, Locomotion' },
  { person: 'k00dj19', role: 'phd', interests: 'VLA, Manipulation' },
  { person: 'keh0t0', role: 'phd', interests: 'Generative Models' },
  { person: 'aiclaudev', role: 'phd', interests: 'VLA, Manipulation' },
  {
    person: 'iamproto',
    role: 'alumni-ms',
    affiliation: 'Holiday Robotics',
    interests: 'RL, Manipulation',
  },
  { person: 'kinam0252', role: 'phd', interests: 'VLA, Generative Models' },
  { person: 'yoonsangoh', role: 'ms', interests: 'RL, Manipulation' },
  {
    person: 'anahrendra',
    role: 'collaborator',
    affiliation: 'Holiday Robotics',
    interests: 'Locomotion, Sim2Real',
  },
  { person: 'takuseno', role: 'collaborator', affiliation: 'Turing', interests: 'RL' },
];
