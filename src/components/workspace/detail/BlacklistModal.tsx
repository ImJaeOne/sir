'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { BlacklistEditor } from '@/components/ui/BlacklistEditor';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/utils';
import type { BloggerHashPair } from '@/lib/api/blacklistApi';
import { useNaverBloggerCount, useYoutubeKeywords } from '@/hooks/blacklist/useBlacklistQuery';
import {
  useAddNaverBloggers,
  useReplaceYoutubeKeywords,
} from '@/hooks/blacklist/useBlacklistMutation';

interface BlacklistModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function BlacklistModal({ workspaceId, onClose }: BlacklistModalProps) {
  const { data: bloggerCount } = useNaverBloggerCount();
  const { data: initialYtBlacklist = [] } = useYoutubeKeywords(workspaceId);

  const addBloggers = useAddNaverBloggers();
  const replaceYoutube = useReplaceYoutubeKeywords(workspaceId);
  const saving = addBloggers.isPending || replaceYoutube.isPending;

  const [bloggerInput, setBloggerInput] = useState('');
  const [pendingBloggers, setPendingBloggers] = useState<string[]>([]);

  // 유튜브 키워드는 query 결과를 초기값으로 받아 편집 — 저장 시 added/removed 계산.
  const [ytBlacklist, setYtBlacklist] = useState<string[]>([]);
  useEffect(() => {
    setYtBlacklist(initialYtBlacklist);
  }, [initialYtBlacklist]);

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [savedBloggerHashes, setSavedBloggerHashes] = useState<BloggerHashPair[] | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => {
        setCopiedHash((curr) => (curr === hash ? null : curr));
      }, 1500);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const removedYt = initialYtBlacklist.filter((v) => !ytBlacklist.includes(v));
  const addedYt = ytBlacklist.filter((v) => !initialYtBlacklist.includes(v));
  const totalRemoved = removedYt.length;

  const bloggerChanged = pendingBloggers.length > 0;
  const ytChanged = addedYt.length > 0 || removedYt.length > 0;
  const hasChanges = bloggerChanged || ytChanged;

  const handleAddBlogger = () => {
    const v = bloggerInput.trim();
    if (!v || pendingBloggers.includes(v)) return;
    setPendingBloggers((prev) => [...prev, v]);
    setBloggerInput('');
  };

  const persist = async () => {
    try {
      const newlyHashed: BloggerHashPair[] =
        pendingBloggers.length > 0 ? await addBloggers.mutateAsync(pendingBloggers) : [];

      if (ytChanged) {
        await replaceYoutube.mutateAsync({ added: addedYt, removed: removedYt });
      }

      toast.success('저장되었습니다.');
      setShowRemoveConfirm(false);
      setPendingBloggers([]);
      // 새로 hash 된 블로거가 있으면 한 번만 노출하는 모달. 없으면 바로 닫음.
      if (newlyHashed.length > 0) {
        setSavedBloggerHashes(newlyHashed);
      } else {
        onClose();
      }
    } catch (e) {
      toast.error(getErrorMessage(e, '저장에 실패했습니다.'));
      console.error(e);
    }
  };

  const handleSave = () => {
    if (!hasChanges || saving) return;
    if (totalRemoved > 0) {
      setShowRemoveConfirm(true);
      return;
    }
    void persist();
  };

  return (
    <>
      <Modal
        open={!showRemoveConfirm && !savedBloggerHashes}
        onClose={onClose}
        title="블랙리스트 관리"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="flex-1">
              {saving ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <span className="self-start text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            전역
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              네이버 블로거 블랙리스트
            </label>
            {bloggerCount !== undefined && (
              <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                현재 {bloggerCount.toLocaleString()}건 등록
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            작성자(bloggername) 단위로 크롤링 단계에서 제외합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={bloggerInput}
              onChange={(e) => setBloggerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBlogger();
                }
              }}
              placeholder="예: 스팸블로거123"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors"
            />
            <button
              type="button"
              onClick={handleAddBlogger}
              disabled={!bloggerInput.trim()}
              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              추가
            </button>
          </div>
          {pendingBloggers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {pendingBloggers.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-rose-200"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => setPendingBloggers((prev) => prev.filter((x) => x !== item))}
                    className="hover:text-rose-900 cursor-pointer ml-0.5"
                    aria-label={`${item} 추가 취소`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <span className="self-center text-[11px] text-slate-400">저장 시 적용됩니다</span>
            </div>
          )}
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
              총 <span className="font-semibold">{totalRemoved}건</span>이 영구 제거됩니다. 삭제된
              항목은 다음 크롤부터 다시 수집될 수 있습니다.
            </p>
            {removedYt.length > 0 && (
              <div className="rounded-lg border border-bg-dark bg-bg-light px-3 py-2">
                <p className="text-[11px] font-semibold text-text-muted mb-1">
                  유튜브 키워드 · {removedYt.length}건
                </p>
                <p className="text-xs text-text-dark wrap-break-word">{removedYt.join(', ')}</p>
              </div>
            )}
          </div>
        }
      />

      <Modal
        open={!!savedBloggerHashes}
        onClose={() => {
          setSavedBloggerHashes(null);
          onClose();
        }}
        title="저장된 블로거 해시 — 한 번만 표시됩니다"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!savedBloggerHashes) return;
                const tsv = savedBloggerHashes.map((p) => `${p.plaintext}\t${p.hash}`).join('\n');
                try {
                  await navigator.clipboard.writeText(tsv);
                  toast.success('클립보드에 복사되었습니다 (엑셀 붙여넣기 가능).');
                } catch {
                  toast.error('복사에 실패했습니다.');
                }
              }}
              className="flex-1"
            >
              엑셀용 TSV 복사
            </Button>
            <Button
              onClick={() => {
                setSavedBloggerHashes(null);
                onClose();
              }}
              className="flex-1"
            >
              저장했습니다, 닫기
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            PII 보호 정책상 블로거명은 단방향 해시로만 저장됩니다.
            <span className="font-semibold">
              {' '}
              이 화면을 닫으면 다시 볼 수 없으니 엑셀 등에 따로 보관해주세요.
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-bg-dark">
            <table className="w-full text-xs table-fixed">
              <colgroup>
                <col className="w-[140px]" />
                <col />
              </colgroup>
              <thead className="bg-bg-light text-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                    블로거명 (입력값)
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">저장된 해시 (DB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-dark">
                {savedBloggerHashes?.map((pair) => (
                  <tr key={pair.hash}>
                    <td className="px-3 py-2 text-text-dark wrap-break-word">{pair.plaintext}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        <span className="flex-1 font-mono text-[11px] text-text-muted break-all">
                          {pair.hash}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyHash(pair.hash)}
                          aria-label="해시 복사"
                          className="shrink-0 p-1 rounded text-text-muted hover:text-text-dark hover:bg-bg-light transition-colors cursor-pointer"
                        >
                          {copiedHash === pair.hash ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}
