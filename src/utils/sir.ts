/**
 * SIR(Social Investment Risk) 지수 계산
 *
 * 최적 파라미터 (넵튠 1개월 데이터 기반 시뮬레이션, 일치율 61.1%):
 * - 뉴스 캡: 무제한 (신작 흥행 등 실제 호재 반영)
 * - 커뮤니티 캡: 12건 (노이즈 과다 방지)
 * - 부정 스케일: 1.5 (넓은 범위, EMA 24.6~61.8)
 * - 신뢰도 k: 3 (적은 건수에서도 반영)
 * - EMA 기간: 3 (빠른 반응)
 *
 * 결과: 0~100 (50 = 중립, 100 = 최상, 0 = 최악)
 */

const CHANNEL_WEIGHTS: Record<string, number> = {
  report: 5,
  news: 3,
  sns: 2,
  community: 3,
};

const SENTIMENT_SCORES: Record<string, Record<string, number>> = {
  report:    { positive: 1.0, neutral: 0, negative: -2.0, critical: -3.0 },
  news:      { positive: 1.0, neutral: 0, negative: -2.0, critical: -3.0 },
  sns:       { positive: 0.7, neutral: 0, negative: -1.4, critical: -2.5 },
  community: { positive: 0.5, neutral: 0, negative: -1.2, critical: -2.5 },
};

// 채널별 일일 건수 캡 (뉴스 무제한, 커뮤니티 노이즈 방지)
const DAILY_CAPS: Record<string, number> = {
  news: 999,
  community: 12,
  sns: 20,
  report: 999,
};

const PLATFORM_CHANNEL: Record<string, string> = {
  'news': 'news',
  'naver-blog': 'sns',
  'youtube': 'sns',
  'naver-stock-forum': 'community',
  'dcinside-stock': 'community',
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
  if (channels.length === 0) return 50;

  // 채널별 가중치 = 신뢰도 × min(건수, 캡)
  const channelWeights = channels.map(({ channel, items: channelItems }) => {
    const cap = DAILY_CAPS[channel] ?? 999;
    const count = Math.min(channelItems.length, cap);
    return {
      channel,
      count,
      weight: (CHANNEL_WEIGHTS[channel] ?? 2) * count,
    };
  });
  const totalWeight = channelWeights.reduce((sum, cw) => sum + cw.weight, 0);

  let sir = 0;
  for (const { channel, items: channelItems } of channels) {
    const scores = SENTIMENT_SCORES[channel] ?? SENTIMENT_SCORES.news;
    const cw = channelWeights.find(w => w.channel === channel)!;
    const weight = cw.weight / totalWeight;

    const sentimentSum = channelItems.slice(0, cw.count).reduce((sum, item) => {
      return sum + (scores[item.sentiment ?? 'neutral'] ?? 0);
    }, 0);

    const channelScore = sentimentSum / cw.count;
    sir += weight * channelScore;
  }

  // 비대칭 스케일 (부정 /1.5 → 넓은 범위)
  let sir100: number;
  if (sir >= 0) {
    sir100 = 50 + (sir / 1.0) * 50;
  } else {
    sir100 = 50 + (sir / 1.5) * 50;
  }

  // 신뢰도 보정 (k=3)
  const totalCount = channelWeights.reduce((sum, cw) => sum + cw.count, 0);
  const confidence = 1 - 1 / (1 + totalCount / 3);
  sir100 = 50 + (sir100 - 50) * confidence;

  sir100 = Math.round(sir100 * 10) / 10;
  return Math.max(0, Math.min(100, sir100));
}

/**
 * 일별 SIR 지수 계산 (EMA 누적 이동 방식)
 * EMA period=3 (smoothing=0.5, 빠른 반응)
 */
export function calculateDailySir(
  items: { platform_id: string; sentiment: string | null; published_at: string | null }[],
  emaPeriod: number = 3
): Record<string, number> {
  const grouped = new Map<string, SirItem[]>();

  for (const item of items) {
    if (!item.published_at || !item.sentiment) continue;
    const date = item.published_at.slice(0, 10);
    const list = grouped.get(date) ?? [];
    list.push({ platform_id: item.platform_id, sentiment: item.sentiment });
    grouped.set(date, list);
  }

  const sortedDates = [...grouped.keys()].sort();
  const result: Record<string, number> = {};
  const smoothing = 2 / (emaPeriod + 1);
  let prevSir = 50;

  for (const date of sortedDates) {
    const dailyScore = calculateSir(grouped.get(date)!);
    const sir = prevSir + (dailyScore - prevSir) * smoothing;
    result[date] = Math.round(sir * 10) / 10;
    prevSir = result[date];
  }

  return result;
}
