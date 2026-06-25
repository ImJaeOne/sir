import type { CriticalType } from '@/types/common';

// 색은 CollectionSnapshot 의 4 채널 팔레트(#362cff/#9747ff/#ff0000/#17d82d) 를
// risk type 4종에 1:1 매핑. 의미 매칭은 명예훼손=빨강(심각), 욕설=보라(자극),
// 루머=진파랑(불확실), 스팸=초록(노이즈).
export const REPORT_RISK_TYPES: { key: CriticalType; label: string; color: string }[] = [
  { key: 'defamation', label: '명예훼손', color: '#ff0000' },
  { key: 'insult', label: '욕설/비방', color: '#9747ff' },
  { key: 'rumor', label: '루머', color: '#362cff' },
  { key: 'spam', label: '스팸', color: '#17d82d' },
];

export const REPORT_RISK_LABEL: Record<CriticalType, string> = REPORT_RISK_TYPES.reduce(
  (acc, type) => {
    acc[type.key] = type.label;
    return acc;
  },
  {} as Record<CriticalType, string>,
);

export const REPORT_RISK_COLOR: Record<CriticalType, string> = REPORT_RISK_TYPES.reduce(
  (acc, type) => {
    acc[type.key] = type.color;
    return acc;
  },
  {} as Record<CriticalType, string>,
);

export const REPORT_RISK_DESCRIPTION: Record<CriticalType, string> = {
  defamation: '구체적 사실 또는 허위사실로 평판을 떨어뜨리는 게시물',
  insult: '사실 주장 없이 상대를 깎아내리거나 조롱하는 게시물',
  rumor: '확인되지 않은 내용을 추정형으로 퍼뜨리는 게시물',
  spam: '리딩방 홍보/반복성 도배/상업성 링크 유도 게시물',
};
