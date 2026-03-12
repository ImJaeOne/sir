export interface Platform {
  id: string;
  label: string;
  category: string;
}

export const PLATFORMS: Platform[] = [
  // 뉴스
  { id: 'naver-news', label: '네이버 뉴스', category: '뉴스' },
  // 커뮤니티
  { id: 'naver-stock-forum', label: '네이버증권 종목토론방', category: '커뮤니티' },
  { id: 'paxnet', label: '팍스넷', category: '커뮤니티' },
  { id: 'dcinside-stock', label: '디시인사이드 주식갤러리', category: '커뮤니티' },
  { id: 'ppomppu-stock', label: '뽐뿌 주식포럼', category: '커뮤니티' },
  // 포털
  { id: 'google', label: '구글', category: '포털' },
  { id: 'naver', label: '네이버', category: '포털' },
  // SNS
  { id: 'youtube', label: '유튜브', category: 'SNS' },
  { id: 'instagram', label: '인스타그램', category: 'SNS' },
  { id: 'naver-cafe', label: '네이버 카페', category: 'SNS' },
  { id: 'naver-blog', label: '네이버 블로그', category: 'SNS' },
  // 포털사이트
];

export const PLATFORM_CATEGORIES = [...new Set(PLATFORMS.map((p) => p.category))];
