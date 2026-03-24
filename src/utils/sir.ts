/**
 * SIR(Social Investment Risk) 지수 계산
 *
 * 연구 기반 가중치:
 * - Negativity bias: 부정 감성이 주가에 2~3배 강한 영향 (Akhtar et al.)
 * - 한국 시장: 뉴스 감성이 주가 방향성 선행, 커뮤니티는 변동성과 상관 (PMC 11076966)
 * - 커뮤니티 부정 감성: 주가 하락과 강한 상관 (네이버 종토방 논문, DBpia)
 * - EMA 방식 누적: 주별 예측이 일별보다 정확 (62% 정확도)
 *
 * 결과: 0~100 (50 = 중립, 100 = 최상, 0 = 최악)
 */

// 채널별 신뢰도 가중치 (건수와 곱해져서 최종 가중치 결정)
const CHANNEL_WEIGHTS: Record<string, number> = {
  report: 5,
  news: 3,       // 4→3: 뉴스 1건이 커뮤니티 다수를 압도하는 현상 완화
  sns: 2,
  community: 3,  // 2→3: 커뮤니티 감성의 실제 주가 영향력 반영 (종토방 논문)
};

// 채널별 감성 점수 매트릭스
// negativity bias 반영: 부정 가중치를 긍정의 약 2배로 설정
const SENTIMENT_SCORES: Record<string, Record<string, number>> = {
  report:    { positive: 1.0, neutral: 0, negative: -2.0, critical: -3.0 },
  news:      { positive: 1.0, neutral: 0, negative: -2.0, critical: -3.0 },
  sns:       { positive: 0.7, neutral: 0, negative: -1.4, critical: -2.5 },
  community: { positive: 0.5, neutral: 0, negative: -1.2, critical: -2.5 },
};

// 플랫폼 → 채널 매핑
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
 * 채널 가중치 = 신뢰도 × 건수 (건수가 많을수록 영향력 증가)
 */
export function calculateSir(items: SirItem[]): number {
  const channels = groupByChannel(items);
  if (channels.length === 0) return 50;

  // 활성 채널 가중치 = 신뢰도 × 건수
  const channelWeights = channels.map(({ channel, items: channelItems }) => ({
    channel,
    weight: (CHANNEL_WEIGHTS[channel] ?? 2) * channelItems.length,
  }));
  const totalWeight = channelWeights.reduce((sum, cw) => sum + cw.weight, 0);

  let sir = 0;
  for (const { channel, items: channelItems } of channels) {
    const scores = SENTIMENT_SCORES[channel] ?? SENTIMENT_SCORES.news;
    const cw = channelWeights.find(w => w.channel === channel)!;
    const weight = cw.weight / totalWeight;

    const sentimentSum = channelItems.reduce((sum, item) => {
      return sum + (scores[item.sentiment ?? 'neutral'] ?? 0);
    }, 0);

    const channelScore = sentimentSum / channelItems.length;
    sir += weight * channelScore;
  }

  // 0~100 스케일 변환 (비대칭: 중립=50 기준)
  let sir100: number;
  if (sir >= 0) {
    sir100 = 50 + (sir / 1.0) * 50;
  } else {
    sir100 = 50 + (sir / 3.0) * 50;
  }

  // 신뢰도 보정: 건수가 적을수록 50(중립)에 가깝게
  const totalCount = items.filter(i => i.sentiment).length;
  const confidence = 1 - 1 / (1 + totalCount / 10);
  sir100 = 50 + (sir100 - 50) * confidence;

  sir100 = Math.round(sir100 * 10) / 10;
  return Math.max(0, Math.min(100, sir100));
}

/**
 * 일별 SIR 지수 계산 (EMA 누적 이동 방식)
 *
 * EMA smoothing factor = 2 / (N + 1)
 * N=7 (주간 기준, 논문에서 주별 예측이 더 정확) → factor ≈ 0.25
 */
export function calculateDailySir(
  items: { platform_id: string; sentiment: string | null; published_at: string | null }[],
  emaPeriod: number = 7
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
  const smoothing = 2 / (emaPeriod + 1); // EMA factor
  let prevSir = 50; // 기준점: 중립

  for (const date of sortedDates) {
    const dailyScore = calculateSir(grouped.get(date)!);
    const sir = prevSir + (dailyScore - prevSir) * smoothing;
    result[date] = Math.round(sir * 10) / 10;
    prevSir = result[date];
  }

  return result;
}
