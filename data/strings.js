/* Korean translations of the site's static copy.
 *
 * The English text lives in index.html as the literal content of each node.
 * Each key here matches a data-i18n="<key>" attribute there.
 * A key that is missing simply leaves the English text in place.
 *
 * The copy that comes out of a data file (project summaries, news items) is
 * NOT keyed here — it carries both languages on the rendered node itself.
 * See js/i18n.js.
 */
window.STRINGS = {
  ko: {
    'a11y.skipLink': '본문으로 건너뛰기',
    'toggle.lang': 'EN | KR 언어 전환, 현재 한국어',
    'hero.lead':
      'DAVIAN Robotics는 비전-언어-행동 모델과 시뮬레이션-실환경(sim-to-real) 강화학습을 중심으로, 학습 기반 로봇 조작 방법을 연구합니다.',
    // The affiliation line is split around the DAVIAN Lab link, so the two
    // halves carry the Korean word order between them: "DAVIAN Robotics는 KAIST AI
    // 주재걸 교수 연구실인 [DAVIAN Lab]의 로보틱스 연구 그룹입니다."
    'hero.affiliation.pre': 'DAVIAN Robotics는 KAIST AI 주재걸 교수 연구실인',
    'hero.affiliation.post': '의 로보틱스 연구 그룹입니다.',
    'hero.figure': '그림 1 — 계획된 엔드 이펙터 궤적',
    'nav.news': '소식',
    'nav.research': '연구',
    'section.news': '소식',
    'section.research': '연구',
    'news.kind.acceptance': '채택',
    'news.kind.release': '공개',
    'news.kind.award': '수상',
    'research.equal': '* 공동 제1저자',
    'filter.all': '전체',
    'links.paper': '논문',
    'links.code': '코드',
    'links.model': '모델',
    'links.data': '데이터',
    'links.project': '프로젝트',
  },
};
