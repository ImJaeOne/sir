'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BlacklistEditor } from '@/components/ui/BlacklistEditor';
import { createClient } from '@/lib/supabase/client';

interface BlacklistModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function BlacklistModal({ workspaceId, onClose }: BlacklistModalProps) {
  // 네이버 블로거 (전역 — workspace_id IS NULL)
  const [initialBloggers, setInitialBloggers] = useState<string[]>([]);
  const [bloggers, setBloggers] = useState<string[]>([]);

  // 유튜브 키워드 (이 워크스페이스 전용)
  const [initialYtBlacklist, setInitialYtBlacklist] = useState<string[]>([]);
  const [ytBlacklist, setYtBlacklist] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    // 전역 블로거
    supabase
      .from('content_blacklist')
      .select('value')
      .eq('platform_id', 'naver_blog')
      .eq('type', 'author')
      .is('workspace_id', null)
      .then(({ data }) => {
        const values = data?.map((d) => d.value) ?? [];
        setInitialBloggers(values);
        setBloggers(values);
      });

    // 워크스페이스 전용 유튜브 키워드
    supabase
      .from('content_blacklist')
      .select('value')
      .eq('platform_id', 'youtube')
      .eq('type', 'keyword')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => {
        const values = data?.map((d) => d.value) ?? [];
        setInitialYtBlacklist(values);
        setYtBlacklist(values);
      });
  }, [workspaceId]);

  const bloggerChanged =
    bloggers.length !== initialBloggers.length ||
    bloggers.some((v) => !initialBloggers.includes(v));
  const ytChanged =
    ytBlacklist.length !== initialYtBlacklist.length ||
    ytBlacklist.some((v) => !initialYtBlacklist.includes(v));
  const hasChanges = bloggerChanged || ytChanged;

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    const supabase = createClient();

    try {
      // 네이버 블로거 — 전역(workspace_id NULL)
      if (bloggerChanged) {
        const added = bloggers.filter((v) => !initialBloggers.includes(v));
        const removed = initialBloggers.filter((v) => !bloggers.includes(v));
        if (removed.length > 0) {
          await supabase
            .from('content_blacklist')
            .delete()
            .eq('platform_id', 'naver_blog')
            .eq('type', 'author')
            .is('workspace_id', null)
            .in('value', removed);
        }
        if (added.length > 0) {
          await supabase.from('content_blacklist').insert(
            added.map((value) => ({
              platform_id: 'naver_blog',
              type: 'author',
              value,
              workspace_id: null,
            })),
          );
        }
      }

      // 유튜브 키워드 — 워크스페이스 전용
      if (ytChanged) {
        const added = ytBlacklist.filter((v) => !initialYtBlacklist.includes(v));
        const removed = initialYtBlacklist.filter((v) => !ytBlacklist.includes(v));
        if (removed.length > 0) {
          await supabase
            .from('content_blacklist')
            .delete()
            .eq('platform_id', 'youtube')
            .eq('type', 'keyword')
            .eq('workspace_id', workspaceId)
            .in('value', removed);
        }
        if (added.length > 0) {
          await supabase.from('content_blacklist').insert(
            added.map((value) => ({
              platform_id: 'youtube',
              type: 'keyword',
              value,
              workspace_id: workspaceId,
            })),
          );
        }
      }

      toast.success('저장되었습니다.');
      onClose();
    } catch (e) {
      toast.error('저장에 실패했습니다.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">블랙리스트 관리</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                전역
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                모든 워크스페이스에 공통 적용됩니다. SEO 스팸 블로거처럼 어디서든 배제할
                대상만 추가하세요.
              </p>
            </div>
            <BlacklistEditor
              title="네이버 블로거 블랙리스트"
              description="작성자(bloggername) 단위로 크롤링 단계에서 제외합니다"
              placeholder="예: 스팸블로거123"
              items={bloggers}
              onAdd={(v) => setBloggers((prev) => [...prev, v])}
              onRemove={(v) => setBloggers((prev) => prev.filter((x) => x !== v))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                이 워크스페이스
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                이 워크스페이스 수집에서만 제외됩니다.
              </p>
            </div>
            <BlacklistEditor
              title="유튜브 키워드 블랙리스트"
              description="제목/설명에 포함된 영상을 제외합니다"
              placeholder="예: LoL, 리그오브레전드"
              items={ytBlacklist}
              onAdd={(v) => setYtBlacklist((prev) => [...prev, v])}
              onRemove={(v) => setYtBlacklist((prev) => prev.filter((x) => x !== v))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:shadow-none"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
