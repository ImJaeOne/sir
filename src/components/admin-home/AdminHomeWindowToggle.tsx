'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import {
  ADMIN_HOME_WINDOWS,
  type AdminHomeWindowHours,
} from '@/lib/adminHome/window';

interface Props {
  current: AdminHomeWindowHours;
  generatedAt: string;
}

function formatRelative(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return '방금';
  if (diffSec < 60) return `${diffSec}초 전`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  return `${h}시간 전`;
}

export function AdminHomeWindowToggle({ current, generatedAt }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 1초 간격으로 "마지막 갱신 N초 전" 라벨만 갱신 (네트워크 호출 없음)
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = (h: AdminHomeWindowHours) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    if (h === 24) next.delete('window');
    else next.set('window', String(h));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname ?? '/');
  };

  const handleRefresh = () => router.refresh();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:pt-4">
      <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
        {ADMIN_HOME_WINDOWS.map((h) => {
          const active = current === h;
          return (
            <button
              key={h}
              type="button"
              onClick={() => handleSelect(h)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer tabular-nums ${
                active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {h}h
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="tabular-nums">갱신 {formatRelative(generatedAt)}</span>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
          aria-label="새로고침"
        >
          <RefreshCw size={12} />
          <span className="hidden sm:inline">새로고침</span>
        </button>
      </div>
    </div>
  );
}
