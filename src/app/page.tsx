import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { HeroStats } from '@/components/home/HeroStats';
import { ProcessPipeline } from '@/components/home/ProcessPipeline';
import { StatusSnapshot } from '@/components/home/StatusSnapshot';
import { RecentActivityFeed } from '@/components/home/RecentActivityFeed';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-0">
      <main className="flex-1 flex flex-col gap-0">
        {/* ── Hero Section ── */}
        <section className="relative bg-linear-to-b from-white via-blue-50/50 to-slate-50 px-6 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 font-medium text-sm tracking-tight">InnoPlan</span>
              <span className="text-slate-800 font-bold text-3xl sm:text-4xl tracking-tight">
                SIR
              </span>
            </div>
            <p className="text-blue-600 text-sm font-medium tracking-widest uppercase">
              디지털 기업 가치 관리 서비스
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800 leading-relaxed max-w-2xl">
              기업 온라인 평판을 AI로 모니터링하고
              <br />
              자동 대응하는 원스톱 플랫폼
            </h1>

            {/* Key Stats */}
            <HeroStats />

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Link
                href={ROUTES.DASHBOARD}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
              >
                워크스페이스
              </Link>
              <button className="bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all border border-slate-200 shadow-sm">
                새 클라이언트 등록
              </button>
            </div>
          </div>
        </section>

        {/* ── Process Pipeline ── */}
        <section className="px-6 py-14 sm:py-18 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                운영 프로세스 파이프라인
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                5단계 자동화 프로세스로 평판 리스크를 실시간 감지하고 대응합니다.
              </p>
            </div>
            <ProcessPipeline />
          </div>
        </section>

        {/* ── Real-time Status Snapshot ── */}
        <section className="px-6 py-14 sm:py-18 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">실시간 현황</h2>
              <p className="text-slate-500 text-sm mt-2">
                현재 시스템 운영 상태를 한눈에 확인하세요.
              </p>
            </div>
            <StatusSnapshot />
          </div>
        </section>

        <section className="px-6 py-14 sm:py-18 bg-slate-50">
          <div className="max-w-6xl mx-auto gap-8">
            <h2 className="text-lg font-bold text-slate-900 mb-5">최근 활동</h2>
            <RecentActivityFeed />
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 bg-slate-50 border-t border-slate-100">
        &copy; 2026 InnoPlan SIR. All rights reserved.
      </footer>
    </div>
  );
}
