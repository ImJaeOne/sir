import { Building2, Radio, Database, TrendingUp } from 'lucide-react';

// TODO: API 연동
const STATS = [
  { label: '관리 클라이언트', value: '12', unit: '개사', icon: Building2, color: 'text-blue-500' },
  { label: '모니터링 채널', value: '8', unit: '개', icon: Radio, color: 'text-emerald-500' },
  { label: '금주 수집 데이터', value: '24,830', unit: '건', icon: Database, color: 'text-violet-500' },
  { label: '평균 SIR 지수', value: '724', unit: '/ 1000', icon: TrendingUp, color: 'text-amber-500' },
];

export function HeroStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl mt-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 shadow-sm"
          >
            <Icon size={20} className={stat.color} />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-xs text-slate-400">{stat.unit}</span>
            </div>
            <span className="text-xs text-slate-500">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
