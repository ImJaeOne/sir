'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BlacklistEditor } from '@/components/ui/BlacklistEditor';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils';

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

  const removedBloggers = initialBloggers.filter((v) => !bloggers.includes(v));
  const removedYt = initialYtBlacklist.filter((v) => !ytBlacklist.includes(v));
  const totalRemoved = removedBloggers.length + removedYt.length;

  const bloggerChanged =
    bloggers.length !== initialBloggers.length ||
    bloggers.some((v) => !initialBloggers.includes(v));
  const ytChanged =
    ytBlacklist.length !== initialYtBlacklist.length ||
    ytBlacklist.some((v) => !initialYtBlacklist.includes(v));
  const hasChanges = bloggerChanged || ytChanged;

  const [saving, setSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const persist = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // 네이버 블로거 — 전역(workspace_id NULL)
      if (bloggerChanged) {
        const added = bloggers.filter((v) => !initialBloggers.includes(v));
        if (removedBloggers.length > 0) {
          await supabase
            .from('content_blacklist')
            .delete()
            .eq('platform_id', 'naver_blog')
            .eq('type', 'author')
            .is('workspace_id', null)
            .in('value', removedBloggers);
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
        if (removedYt.length > 0) {
          await supabase
            .from('content_blacklist')
            .delete()
            .eq('platform_id', 'youtube')
            .eq('type', 'keyword')
            .eq('workspace_id', workspaceId)
            .in('value', removedYt);
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
      setShowRemoveConfirm(false);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, '저장에 실패했습니다.'));
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!hasChanges || saving) return;
    // 제거가 포함되면 ConfirmModal — 전역(블로거)는 워크스페이스 횡단 영향이라 특히 위험.
    if (totalRemoved > 0) {
      setShowRemoveConfirm(true);
      return;
    }
    void persist();
  };

  return (
    <>
      <Modal
        open={!showRemoveConfirm}
        onClose={onClose}
        title="블랙리스트 관리"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <span className="self-start text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            전역
          </span>
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
          <span className="self-start text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            이 워크스페이스
          </span>
          <BlacklistEditor
            title="유튜브 키워드 블랙리스트"
            description="제목/설명에 포함된 영상을 제외합니다"
            placeholder="예: LoL, 리그오브레전드"
            items={ytBlacklist}
            onAdd={(v) => setYtBlacklist((prev) => [...prev, v])}
            onRemove={(v) => setYtBlacklist((prev) => prev.filter((x) => x !== v))}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => void persist()}
        title="블랙리스트 항목 제거"
        confirmLabel="제거하고 저장"
        confirmVariant="danger"
        loading={saving}
        message={
          <div className="flex flex-col gap-3">
            <p>
              총 <span className="font-semibold">{totalRemoved}건</span>이 영구 제거됩니다.
              삭제된 항목은 다음 크롤부터 다시 수집될 수 있습니다.
            </p>
            {removedBloggers.length > 0 && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-rose-700 mb-1">
                  네이버 블로거 (전역) · {removedBloggers.length}건
                </p>
                <p className="text-xs text-rose-800 break-words">
                  {removedBloggers.join(', ')}
                </p>
              </div>
            )}
            {removedYt.length > 0 && (
              <div className="rounded-lg border border-bg-dark bg-bg-light px-3 py-2">
                <p className="text-[11px] font-semibold text-text-muted mb-1">
                  유튜브 키워드 · {removedYt.length}건
                </p>
                <p className="text-xs text-text-dark break-words">
                  {removedYt.join(', ')}
                </p>
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
