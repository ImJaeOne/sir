import Link from 'next/link';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { FEATURES } from '@/constants/features';
import { ROUTES } from '@/constants/routes';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-slate-800 font-semibold text-lg tracking-tight">SIR</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 gap-10 sm:gap-12 lg:gap-16">
        {/* Hero */}
        <section className="max-w-2xl text-center flex flex-col gap-4 sm:gap-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
            기업을 위한 <span className="text-blue-600">AI 기반 디지털 평판 관리 플랫폼</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
            자동으로 브랜드의 디지털 평판을 모니터링하고, 측정하고, 관리하세요.
          </p>
          <div>
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-block bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-sm"
            >
              → 대시보드 바로가기
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6">
        © 2026 SIR. All rights reserved.
      </footer>
    </div>
  );
}
