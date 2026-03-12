import { ShieldCheck, AlertTriangle, Target, FileCheck } from 'lucide-react';

// TODO: API 연동
const CLIENT_SIR = [
  { name: 'A전자', sir: 82, status: 'green' as const },
  { name: 'B바이오', sir: 61, status: 'yellow' as const },
  { name: 'C건설', sir: 45, status: 'red' as const },
  { name: 'D금융', sir: 78, status: 'green' as const },
  { name: 'E에너지', sir: 69, status: 'yellow' as const },
  { name: 'F IT', sir: 88, status: 'green' as const },
];

// TODO: API 연동
const SUMMARY_CARDS = [
  { label: '금주 탐지 리스크', value: '17건', sub: '전주 대비 -3건', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { label: '콘텐츠 전략 실행률', value: '84%', sub: 'Offense 12건 / Defense 8건', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: '신고 처리 현황', value: '5 / 7', sub: '완료 5건, 진행 중 2건', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const STATUS_COLORS = {
  green: { bg: 'bg-emerald-500', label: '안정', labelColor: 'text-emerald-700' },
  yellow: { bg: 'bg-amber-400', label: '주의', labelColor: 'text-amber-700' },
  red: { bg: 'bg-red-500', label: '위기', labelColor: 'text-red-700' },
} as const;

export function StatusSnapshot() {
  return (
    <div className="flex flex-col gap-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border-2 border-slate-200 p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={card.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client SIR cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">클라이언트별 SIR 지수</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CLIENT_SIR.map((client) => {
            const status = STATUS_COLORS[client.status];
            return (
              <div key={client.name} className="bg-white rounded-xl border-2 border-slate-200 p-4 text-center">
                <p className="text-xs font-medium text-slate-500 mb-2">{client.name}</p>
                <p className="text-2xl font-bold text-slate-900">{client.sir}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full ${status.bg}`} />
                  <span className={`text-[11px] font-medium ${status.labelColor}`}>{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
