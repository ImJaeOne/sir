/**
 * Python `services/sir_calculator.py:calculate_sir` 의 TS 포팅.
 *
 * 기존 `src/utils/sir.ts:calculateSir` 는 옛 공식 (caps, k=3, channel weights 다름) 이고
 * pipeline 컴포넌트가 의존해서 건드리지 않음. 이 파일은 현재 백엔드 공식과 정확히 일치.
 *
 * 동기화 책임: Python `sir_calculator.py` 가 바뀌면 이 파일도 같이 수정.
 */
const PLATFORM_CHANNEL: Record<string, 'news' | 'sns' | 'community'> = {
  naver_news: 'news',
  naver_blog: 'sns',
  youtube: 'sns',
  naver_stock: 'community',
  dcinside: 'community',
};

const CHANNEL_WEIGHTS: Record<'news' | 'sns' | 'community', number> = {
  news: 4,
  sns: 3,
  community: 3,
};

const SENTIMENT_SCORES: Record<'news' | 'sns' | 'community', Record<string, number>> = {
  news: { positive: 1.0, neutral: 0, negative: -2.0 },
  sns: { positive: 0.7, neutral: 0, negative: -1.4 },
  community: { positive: 0.5, neutral: 0, negative: -1.2 },
};

interface SirItem {
  platform_id: string;
  sentiment: string | null;
}

/** raw items 에서 SIR 점수(0~1000) 계산. 데이터 없으면 500. */
export function calculateSir(items: SirItem[]): number {
  type Channel = 'news' | 'sns' | 'community';
  const channelCounts: Record<Channel, Record<string, number>> = {
    news: {},
    sns: {},
    community: {},
  };

  for (const item of items) {
    if (!item.sentiment) continue;
    const channel = PLATFORM_CHANNEL[item.platform_id];
    if (!channel) continue;
    channelCounts[channel][item.sentiment] = (channelCounts[channel][item.sentiment] ?? 0) + 1;
  }

  const activeChannels: Channel[] = (Object.keys(channelCounts) as Channel[]).filter(
    (ch) => Object.keys(channelCounts[ch]).length > 0,
  );
  if (activeChannels.length === 0) return 500;

  const channelScores: Partial<Record<Channel, number>> = {};
  const channelTotalCounts: Partial<Record<Channel, number>> = {};
  for (const ch of activeChannels) {
    const scores = SENTIMENT_SCORES[ch];
    const sentiments = channelCounts[ch];
    const totalCount = Object.values(sentiments).reduce((a, b) => a + b, 0);
    if (totalCount === 0) continue;
    const weightedSum = Object.entries(sentiments).reduce(
      (sum, [s, c]) => sum + (scores[s] ?? 0) * c,
      0,
    );
    channelScores[ch] = weightedSum / totalCount;
    channelTotalCounts[ch] = totalCount;
  }

  const scoredChannels = Object.keys(channelScores) as Channel[];
  if (scoredChannels.length === 0) return 500;

  const activeWeightSum = scoredChannels.reduce((s, ch) => s + CHANNEL_WEIGHTS[ch], 0);
  const sirRaw = scoredChannels.reduce(
    (s, ch) => s + (CHANNEL_WEIGHTS[ch] / activeWeightSum) * (channelScores[ch] as number),
    0,
  );

  // 비대칭 스케일 (부정 /1.5 → 넓은 범위)
  let sir1000 = sirRaw >= 0 ? 500 + sirRaw * 500 : 500 + (sirRaw / 1.5) * 500;

  // 신뢰도 보정 (k=5)
  const totalCount = scoredChannels.reduce(
    (s, ch) => s + (channelTotalCounts[ch] as number),
    0,
  );
  const confidence = 1 - 1 / (1 + totalCount / 5);
  sir1000 = 500 + (sir1000 - 500) * confidence;

  return Math.round(Math.max(0, Math.min(1000, sir1000)));
}
