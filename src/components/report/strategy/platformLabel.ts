// 전략 action.platform 표시 라벨 정규화.
// '네이버 블로그' 만 'SNS' 로 치환, 그 외(유튜브/뉴스/커뮤니티 등) 는 원본 유지.
const PLATFORM_LABEL_OVERRIDE: Record<string, string> = {
  '네이버 블로그': 'SNS',
  naver_blog: 'SNS',
};

export function toDisplayPlatform(platform: string): string {
  return PLATFORM_LABEL_OVERRIDE[platform.trim()] ?? platform;
}
