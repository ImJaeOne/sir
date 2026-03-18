/**
 * SIR(Social Investment Risk) 지수 계산
 *
 * 채널별 가중치 × 채널별 감성 점수(채널마다 다름)를 조합하여 산출.
 * 결과: 0~100 (50 = 중립, 100 = 최상, 0 = 최악)
 */

// 채널별 가중치 (원점수)
const CHANNEL_WEIGHTS: Record<string, number> = {
  report: 5,
  news: 4,
  sns: 2,
  community: 2,
};

// 채널별 감성 점수 매트릭스
const SENTIMENT_SCORES: Record<string, Record<string, number>> = {
  report:    { positive: 1.0, neutral: 0, negative: -1.3, critical: -2.0 },
  news:      { positive: 1.0, neutral: 0, negative: -1.5, critical: -2.0 },
  sns:       { positive: 0.7, neutral: 0, negative: -0.8, critical: -1.5 },
  community: { positive: 0.5, neutral: 0, negative: -0.7, critical: -1.5 },
};

// 플랫폼 → 채널 매핑
const PLATFORM_CHANNEL: Record<string, string> = {
  naver_news: 'news',
  google_news: 'news',
  naver_blog: 'sns',
  youtube: 'sns',
  naver_cafe: 'community',
  stock_discussion: 'community',
};

interface SirItem {
  platform_id: string;
  sentiment: string | null;
}

interface ChannelData {
  channel: string;
  items: SirItem[];
}

function groupByChannel(items: SirItem[]): ChannelData[] {
  const channelMap = new Map<string, SirItem[]>();

  for (const item of items) {
    if (!item.sentiment) continue;
    const channel = PLATFORM_CHANNEL[item.platform_id] ?? 'news';
    const list = channelMap.get(channel) ?? [];
    list.push(item);
    channelMap.set(channel, list);
  }

  return Array.from(channelMap.entries()).map(([channel, items]) => ({
    channel,
    items,
  }));
}

/**
 * SIR 지수 계산 (0~100 스케일)
 */
export function calculateSir(items: SirItem[]): number {
  const channels = groupByChannel(items);
  if (channels.length === 0) return 50; // 데이터 없으면 중립

  // 활성 채널 가중치 재정규화
  const totalWeight = channels.reduce(
    (sum, ch) => sum + (CHANNEL_WEIGHTS[ch.channel] ?? 2),
    0
  );

  let sir = 0;
  for (const { channel, items: channelItems } of channels) {
    const scores = SENTIMENT_SCORES[channel] ?? SENTIMENT_SCORES.news;
    const weight = (CHANNEL_WEIGHTS[channel] ?? 2) / totalWeight;

    const sentimentSum = channelItems.reduce((sum, item) => {
      return sum + (scores[item.sentiment ?? 'neutral'] ?? 0);
    }, 0);

    const channelScore = sentimentSum / channelItems.length;
    sir += weight * channelScore;
  }

  // 0~100 스케일 변환: ((sir + 2) / 3) * 100
  const sir100 = Math.round(((sir + 2) / 3) * 100 * 10) / 10;
  return Math.max(0, Math.min(100, sir100));
}

/**
 * 일별 SIR 지수 계산
 */
export function calculateDailySir(
  items: { platform_id: string; sentiment: string | null; published_at: string | null }[]
): Record<string, number> {
  const grouped = new Map<string, SirItem[]>();

  for (const item of items) {
    if (!item.published_at || !item.sentiment) continue;
    const date = item.published_at.slice(0, 10);
    const list = grouped.get(date) ?? [];
    list.push({ platform_id: item.platform_id, sentiment: item.sentiment });
    grouped.set(date, list);
  }

  const result: Record<string, number> = {};
  for (const [date, dateItems] of grouped.entries()) {
    result[date] = calculateSir(dateItems);
  }
  return result;
}
