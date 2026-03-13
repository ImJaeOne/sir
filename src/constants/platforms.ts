export interface Platform {
  id: string;
  label: string;
  category: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'naver-news', label: '네이버 뉴스', category: 'news' },
  { id: 'naver-stock-forum', label: '네이버증권 종목토론방', category: 'community' },
  { id: 'paxnet', label: '팍스넷', category: 'community' },
  { id: 'dcinside-stock', label: '디시인사이드 주식갤러리', category: 'community' },
  { id: 'ppomppu-stock', label: '뽐뿌 주식포럼', category: 'community' },
  { id: 'google', label: '구글', category: 'portal' },
  { id: 'naver', label: '네이버', category: 'portal' },
  { id: 'youtube', label: '유튜브', category: 'sns' },
  { id: 'instagram', label: '인스타그램', category: 'sns' },
  { id: 'naver-cafe', label: '네이버 카페', category: 'sns' },
  { id: 'naver-blog', label: '네이버 블로그', category: 'sns' },
];

export const PLATFORM_CATEGORIES = [...new Set(PLATFORMS.map((p) => p.category))];

export const CATEGORY_LABELS: Record<string, string> = {
  news: '뉴스',
  community: '커뮤니티',
  portal: '포털',
  sns: 'SNS',
};
