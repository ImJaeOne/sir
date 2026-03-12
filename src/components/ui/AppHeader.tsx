'use client';

import { useState } from 'react';
import { useSidebarStore } from '@/store/sidebar';
import { Bell, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react';

export function AppHeader() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const toggle = useSidebarStore((s) => s.toggle);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 bg-white h-[49px] flex items-center px-[15px] shrink-0"
    >
      <div className="w-full flex items-center justify-between">
        {/* S 로고 (사이드바 토글) + InnoPlan SIR (홈 이동) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            className="group w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all relative"
            aria-label="메뉴 토글"
          >
            <span className="text-white text-[10px] font-bold group-hover:opacity-0 transition-opacity">S</span>
            {isOpen ? (
              <PanelLeftClose size={14} className="text-white absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <PanelLeftOpen size={14} className="text-white absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          <a href="/" className="hidden sm:flex items-baseline gap-1.5 hover:opacity-70 transition-opacity">
            <span className="text-slate-400 font-medium text-sm tracking-tight">InnoPlan</span>
            <span className="text-slate-800 font-bold text-lg tracking-tight">SIR</span>
          </a>
        </div>
        <div className="flex items-center gap-2">
          {/* 알림 */}
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="알림"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          {/* 구분선 */}
          <div className="w-px h-5 bg-slate-200" />

          {/* 사용자 정보 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600">임</span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                임재원<span className="text-slate-400 font-normal">(개발)</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* 드롭다운 메뉴 */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">임재원</p>
                    <p className="text-xs text-slate-400">개발</p>
                  </div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <User size={16} />
                    내 정보
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowUserMenu(false);
                      // TODO: 로그아웃 로직
                    }}
                  >
                    <LogOut size={16} />
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
