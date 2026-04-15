import { ReportCard } from '@/components/report/ReportCard';
import { LikeIcon } from '@/components/icons/LikeIcon';
import { DislikeIcon } from '@/components/icons/DislikeIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';
import type { ChannelStat } from '@/lib/api/reportApi';

type SentimentType = 'positive' | 'neutral' | 'negative';

function getSentimentType(sir: number): SentimentType {
  if (sir >= 601) return 'positive';
  if (sir >= 401) return 'neutral';
  return 'negative';
}

function getSentimentLabel(sir: number, mobile = false): string {
  if (sir >= 801)
    return mobile ? '매우 우호적인\n여론 환경이에요' : '매우 우호적인 여론 환경이에요';
  if (sir >= 601)
    return mobile ? '우호적 여론이\n우세한 상태예요' : '우호적 여론이 우세한 상태예요';
  if (sir >= 401)
    return mobile ? '여론이 혼재된\n중립 구간이에요' : '여론이 혼재된 중립 구간이에요';
  if (sir >= 201)
    return mobile ? '비우호적 여론이\n우세한 상태예요' : '비우호적 여론이 우세한 상태예요';
  return mobile ? '여론 위기 관리가\n시급한 상태예요' : '여론 위기 관리가 시급한 상태예요';
}

const SENTIMENT_CONFIG: Record<
  SentimentType,
  {
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    bgClass: string;
    textClass: string;
    shadow: string;
    badgeClass: string;
  }
> = {
  positive: {
    Icon: LikeIcon,
    bgClass: 'bg-text-accent',
    textClass: 'text-text-accent',
    shadow: '0 6px 16px rgba(54, 44, 255, 0.2)',
    badgeClass: 'text-text-accent bg-bg-blue',
  },
  neutral: {
    Icon: NeutralIcon,
    bgClass: 'bg-text-muted',
    textClass: 'text-text-muted',
    shadow: '0 6px 16px rgba(130, 142, 166, 0.2)',
    badgeClass: 'text-text-muted bg-bg-light',
  },
  negative: {
    Icon: DislikeIcon,
    bgClass: 'bg-text-danger',
    textClass: 'text-text-danger',
    shadow: '0 6px 16px rgba(255, 77, 61, 0.2)',
    badgeClass: 'text-text-danger bg-bg-danger',
  },
};

export function SirCard({
  stat,
  isInitial,
  prevIsInitial,
  prevSir,
}: {
  stat: ChannelStat;
  isInitial: boolean;
  prevIsInitial: boolean;
  prevSir?: number;
}) {
  const prevScore = prevSir ?? 500;
  const change = stat.sir - prevScore;
  const changeLabel = isInitial ? '기준점 대비' : prevIsInitial ? '전월 대비' : '전주 대비';
  const isUp = change >= 0;

  const type = getSentimentType(stat.sir);
  const config = SENTIMENT_CONFIG[type];
  const label = getSentimentLabel(stat.sir);
  const mobileLabel = getSentimentLabel(stat.sir, true);

  return (
    <ReportCard px={20} py={20}>
      <div className="flex flex-col gap-5">
        <span className="text-sm font-semibold text-text-muted">{stat.label}</span>
        <div className="flex flex-col items-center gap-2 lg:gap-4 lg:mb-4">
          <div
            className={`w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${config.bgClass}`}
            style={{ boxShadow: config.shadow }}
          >
            <span className="block lg:hidden">
              <config.Icon size={14} color="white" />
            </span>
            <span className="hidden lg:block">
              <config.Icon size={20} color="white" />
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <span className={`text-2xl font-bold ${config.textClass}`}>{stat.sir}점</span>
            <span className="text-xs text-text-muted font-base whitespace-pre-line text-center lg:hidden">
              {mobileLabel}
            </span>
            <span className="text-xs text-text-muted font-base hidden lg:block">{label}</span>
          </div>
        </div>
        <div
          className={`flex flex-wrap items-center justify-center gap-x-1 text-[10px] lg:text-xs font-semibold w-full rounded-md py-2 ${
            change === 0
              ? 'bg-bg-light text-text-muted'
              : isUp
                ? 'bg-bg-blue text-text-accent'
                : 'bg-bg-danger text-text-danger'
          }`}
        >
          {change === 0 ? (
            <span>{changeLabel} — 유지</span>
          ) : (
            <>
              <span>{changeLabel}</span>
              <span>{isUp ? '▲' : '▼'} {Math.abs(change)}점 {isUp ? '상승' : '하락'}</span>
            </>
          )}
        </div>
      </div>
    </ReportCard>
  );
}
