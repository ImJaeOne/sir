import { AlertTriangle, FileText, SearchCode, ShieldAlert, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Activity {
  time: string;
  message: string;
  type: 'risk' | 'report' | 'crawl' | 'legal' | 'content';
  icon: LucideIcon;
  color: string;
}

// TODO: API 연동
const ACTIVITIES: Activity[] = [
  { time: '3분 전', message: '[A전자] 유튜브 채널에서 리스크 콘텐츠 탐지', type: 'risk', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  { time: '28분 전', message: '[B바이오] 네이버 뉴스 크롤링 완료 — 142건 수집', type: 'crawl', icon: SearchCode, color: 'text-blue-500 bg-blue-50' },
  { time: '1시간 전', message: '[D금융] 주간 보고서 자동 생성 완료', type: 'report', icon: FileText, color: 'text-emerald-500 bg-emerald-50' },
  { time: '2시간 전', message: '[C건설] SEO 밀어내기 콘텐츠 3건 발행 완료', type: 'content', icon: Megaphone, color: 'text-amber-500 bg-amber-50' },
  { time: '3시간 전', message: '[A전자] 허위정보 신고 접수 완료 (처리 대기)', type: 'legal', icon: ShieldAlert, color: 'text-violet-500 bg-violet-50' },
  { time: '5시간 전', message: '[E에너지] SIR 지수 69 → 주의 단계 전환', type: 'risk', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
];

export function RecentActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
      {ACTIVITIES.map((activity, idx) => {
        const Icon = activity.icon;
        const [iconColor, iconBg] = activity.color.split(' ');
        return (
          <div key={idx} className="flex items-start gap-3 px-5 py-4">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon size={15} className={iconColor} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">{activity.message}</p>
              <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
