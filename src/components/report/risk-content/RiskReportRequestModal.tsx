'use client';

import { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { createClient } from '@/lib/supabase/client';
import { reportKeys } from '@/hooks/report/useReportQuery';
import type { RiskItem } from '@/lib/api/reportApi';

const REPORT_REASONS = [
  '명예훼손',
  '욕설 및 비방',
  '루머',
  '스팸',
] as const;

const ACCEPTED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg',
  '.ppt', '.pptx', '.xlsx', '.xls', '.zip',
];

const TERMS_OF_SERVICE = `개인정보의 수집 및 이용 목적
㈜이노다이브는(이하 '회사'는)는 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다. 회사는 개인정보취급방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다. 회사는 개인정보취급방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.

■ 수집하는 개인정보 항목 회사는 회원가입, 상담, 서비스 신청 등등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
- 수집항목 : 문의자 성함, 연락처, 이메일, 소속, 문의내용
- 개인정보 수집방법 : 홈페이지 고객문의 항목

■ 개인정보의 수집 및 이용목적 회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.
- 서비스 문의에 관한 답변 및 서비스 이행

■ 개인정보의 보유 및 이용기간 원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 정보를 보관합니다.
- 보존 항목 : 회사명, 문의자 성함, 연락처, 이메일, 소속, 문의내용
- 보존 근거 : 신용정보의 이용 및 보호에 관한 법률
- 보존 기간 : 5년
- 계약 또는 청약철회 등에 관한 기록 : 5년 (전자상거래등에서의 소비자보호에 관한 법률)`;

const SOURCE_TABLE_MAP: Record<string, string> = {
  naver_news: 'news_items',
  naver_blog: 'sns_items',
  youtube: 'sns_items',
  naver_stock: 'community_items',
  dcinside: 'community_items',
};

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold text-text-dark">
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

interface RiskReportRequestModalProps {
  open: boolean;
  onClose: () => void;
  item: RiskItem | null;
  workspaceId: string;
  reportId: string;
}

export function RiskReportRequestModal({ open, onClose, item, workspaceId, reportId }: RiskReportRequestModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const reset = () => {
    setReason(null);
    setEvidence('');
    setFiles([]);
    setAgreed(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValid = reason !== null && evidence.trim().length > 0 && agreed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      console.log('new files:', newFiles.map(f => f.name));
      setFiles((prev) => {
        const merged = [...prev, ...newFiles];
        console.log('total files:', merged.map(f => f.name));
        return merged;
      });
    }
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      const supabase = createClient();

      // 1. 파일 업로드 (Storage 직접)
      const fileUrls: string[] = [];
      for (const f of files) {
        const ext = f.name.rsplit?.('.').pop() ?? f.name.split('.').pop() ?? '';
        const path = `${workspaceId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('risk-attachments').upload(path, f);
        if (error) throw error;
        fileUrls.push(path);
      }

      // 2. DB INSERT (Supabase 직접)
      const insertData = {
        workspace_id: workspaceId,
        report_id: reportId,
        source_table: SOURCE_TABLE_MAP[item.platform_id] ?? 'community_items',
        source_id: item.id,
        platform_id: item.platform_id,
        title: item.title,
        link: item.link,
        critical_type: item.critical_type,
        reason: reason!,
        evidence,
        file_urls: fileUrls,
        status: 'requested',
      };
      const { error } = await supabase.from('risk_reports').insert(insertData);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(workspaceId, reportId) });
      toast.success('신고 대행 요청이 접수되었습니다.');
      setShowConfirm(false);
      handleClose();
    } catch {
      toast.error('신고 요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="신고 대행 요청"
        size="lg"
        footer={
          <Button onClick={handleSubmit} disabled={!isValid || submitting} fullWidth>
            {submitting ? '요청 중...' : '신청하기'}
          </Button>
        }
      >
        {/* 신고 요청 콘텐츠 */}
        <div className="flex flex-col gap-2">
          <RequiredLabel>신고 요청 콘텐츠</RequiredLabel>
          <div className="bg-bg-blue rounded-lg px-4 py-3">
            <p className="text-sm font-light text-text-accent">{item?.title ?? ''}</p>
          </div>
        </div>

        {/* 신고 사유 선택 */}
        <div className="flex flex-col gap-2">
          <RequiredLabel>신고 사유 선택</RequiredLabel>
          <div className="flex flex-col gap-1">
            {REPORT_REASONS.map((r, i) => {
              const selected = reason === r;
              return (
                <label
                  key={r}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selected ? 'bg-bg-blue' : 'hover:bg-bg-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={selected}
                    onChange={() => setReason(r)}
                    className="accent-bg-accent"
                  />
                  <span
                    className={`text-sm ${selected ? 'text-text-accent font-semibold' : 'text-text-muted'}`}
                  >
                    {i + 1}. {r}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 신고 근거 */}
        <div className="flex flex-col gap-2">
          <RequiredLabel>신고 근거</RequiredLabel>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="신고 근거를 작성해주세요."
            rows={4}
            className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors resize-none"
          />
        </div>

        {/* 관련 자료 첨부 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-dark">관련 자료 첨부</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 border border-dashed border-border-light rounded-lg px-4 py-3 text-sm text-text-muted hover:bg-bg-light hover:text-text-dark transition-colors cursor-pointer"
          >
            <Paperclip size={16} />
            파일 첨부
          </button>
          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((file, i) => {
                const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
                const size = file.size < 1024 * 1024
                  ? `${(file.size / 1024).toFixed(0)}KB`
                  : `${(file.size / 1024 / 1024).toFixed(1)}MB`;
                return (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 bg-bg-light rounded-lg"
                  >
                    <Paperclip size={14} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-text-dark truncate flex-1">{file.name}</span>
                    <span className="text-[10px] text-text-muted shrink-0">{size}</span>
                    <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded shrink-0">{ext}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      aria-label="파일 삭제"
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 서비스 이용 약관 */}
        <div className="flex flex-col gap-2">
          <RequiredLabel>서비스 이용 약관</RequiredLabel>
          <div className="bg-bg-light rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
              {TERMS_OF_SERVICE}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="accent-bg-accent"
            />
            <span
              className={`text-sm font-light ${agreed ? 'text-text-accent' : 'text-text-muted'}`}
            >
              이용약관에 동의합니다.
            </span>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmedSubmit}
        title="신고 대행 요청"
        message={
          <>
            한 번 신청하면 되돌리기 어렵습니다.
            <br />
            신고 요청을 진행하시겠습니까?
          </>
        }
      />
    </>
  );
}
