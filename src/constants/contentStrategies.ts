import type { ContentStrategy } from '@/types/pipeline';

// TODO: API 연동 후 제거 — 선택된 URL 기반으로 AI가 생성
export const MOCK_CONTENT_STRATEGIES: ContentStrategy[] = [
  // 신고 불가능 → 대응 전략
  {
    url: 'https://news.naver.com/article/006',
    title: '삼성전자 리콜 이슈, 소비자 불만 확산 중',
    platform: '네이버 뉴스',
    category: '뉴스',
    reportable: false,
    strategy:
      '공식 보도자료를 통해 리콜 대응 현황 및 고객 보상 프로그램을 적극 홍보. 긍정적 CS 사례를 SNS에 공유하여 여론 전환 유도.',
  },
  {
    url: 'https://finance.naver.com/item/board_read.nhn?code=005930&nid=10',
    title: '삼전 경영진 무능하다 진짜',
    platform: '네이버증권 종목토론방',
    category: '커뮤니티',
    reportable: false,
    strategy:
      '경영 성과 데이터(실적, 투자, R&D) 기반 팩트체크 댓글 작성. IR 자료 링크를 포함한 정보성 컨텐츠로 대응.',
  },
  {
    url: 'https://finance.naver.com/item/board_read.nhn?code=005930&nid=11',
    title: '삼성 반도체 TSMC한테 밀리는 거 아님?',
    platform: '네이버증권 종목토론방',
    category: '커뮤니티',
    reportable: false,
    strategy:
      'HBM 수주 확대, 파운드리 기술 로드맵 등 경쟁력 데이터를 활용한 비교 분석 컨텐츠 제작. 증권사 리포트 인용으로 신뢰도 확보.',
  },
  {
    url: 'https://search.naver.com/search.nhn?query=samsung+quality',
    title: '삼성전자 품질 이슈 연이어 발생…소비자 신뢰 하락',
    platform: '네이버',
    category: '포털',
    reportable: false,
    strategy:
      '품질 관리 강화 조치 및 인증 현황을 정리한 SEO 최적화 블로그 컨텐츠 발행. 검색 결과 상위 노출을 통해 부정 검색 트렌드 상쇄.',
  },
  {
    url: 'https://cafe.naver.com/samsung/complaint1',
    title: '삼성전자 AS 최악 후기 공유',
    platform: '네이버 카페',
    category: 'SNS',
    reportable: false,
    strategy:
      'CS팀과 연계하여 해당 고객 직접 대응. 개선된 AS 프로세스를 카페 내 공식 계정으로 안내 게시글 작성.',
  },
  // 신고 가능 → 신고 대상
  {
    url: 'https://gall.dcinside.com/board/view/?id=stock&no=5',
    title: '삼성 망한다 ㅋㅋ 탈출각',
    platform: '디시인사이드 주식갤러리',
    category: '커뮤니티',
    reportable: true,
    reportReason: '근거 없는 허위 정보 유포 — 기업 신뢰도 훼손',
  },
  {
    url: 'https://gall.dcinside.com/board/view/?id=stock&no=6',
    title: '삼성 파운드리 수율 문제 심각하다는 소문',
    platform: '디시인사이드 주식갤러리',
    category: '커뮤니티',
    reportable: true,
    reportReason: '미확인 루머 유포 — 주가 조작 목적 의심',
  },
  {
    url: 'https://youtube.com/watch?v=flag1',
    title: '[폭로] 삼성전자 내부 사정 다 알려드림',
    platform: '유튜브',
    category: 'SNS',
    reportable: true,
    reportReason: '자극적·선정적 제목으로 허위 정보 유포 — 명예훼손 소지',
  },
];
