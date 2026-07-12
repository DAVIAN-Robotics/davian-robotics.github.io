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
      'DAVIAN Robotics는 비전-언어-행동 모델, 강화학습, 휴머노이드 보행을 아우르는 로봇 조작 연구를 수행합니다.',
    // The affiliation line is split around the DAVIAN Lab link, so the two
    // halves carry the Korean word order between them: "KAIST AI [DAVIAN Lab]
    // (주재걸 교수)의 로보틱스 연구 그룹입니다."
    'hero.affiliation.pre': 'KAIST AI',
    'hero.affiliation.post': '(주재걸 교수)의 로보틱스 연구 그룹입니다.',
    'hero.figure': '그림 1 — 계획된 엔드 이펙터 궤적',
    'nav.news': '소식',
    'nav.research': '연구',
    'nav.releases': '공개 자료',
    'section.news': '소식',
    'section.research': '연구',
    'section.releases': '공개 자료',
    'news.kind.acceptance': '채택',
    'news.kind.release': '공개',
    'filter.all': '전체',
    'releases.lede': '논문에서 공개한 코드, 모델 가중치, 데이터셋을 모두 공개하고 있습니다.',
    'releases.code': '코드 공개',
    'releases.models': '모델',
    'releases.datasets': '데이터셋',
    'links.paper': '논문',
    'links.code': '코드',
    'links.model': '모델',
    'links.data': '데이터',
    'links.project': '프로젝트',
  },
};
