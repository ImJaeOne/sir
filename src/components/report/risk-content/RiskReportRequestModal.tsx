'use client';

import { useState, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const REPORT_REASONS = [
  '명예훼손, 모욕',
  '업무 방해',
  '허위 사실',
  '주가조작, 시세조종',
  '스팸, 리딩방',
] as const;

const ACCEPTED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpeg',
  '.jpg',
  '.ppt',
  '.pptx',
  '.xlsx',
  '.xls',
  '.zip',
];

const TERMS_OF_SERVICE = `개인정보의 수집 및 이용 목적
㈜이노다이브는(이하 ‘회사’는)는 고객님의 개인정보를 중요시하며, “정보통신망 이용촉진 및 정보보호”에 관한 법률을 준수하고 있습니다. 회사는 개인정보취급방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다. 회사는 개인정보취급방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.

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

interface RiskReportRequestModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

export function RiskReportRequestModal({ open, onClose, title }: RiskReportRequestModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ''; // 같은 파일 재선택 가능하게
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = () => {
    // TODO: 실제 신고 API 호출
    console.log({ title, reason, evidence, files });
    setShowConfirm(false);
    handleClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="신고 대행 요청"
        size="lg"
        footer={
          <Button onClick={handleSubmit} disabled={!isValid} fullWidth>
            신청하기
          </Button>
        }
      >
        {/* 신고 요청 콘텐츠 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-dark">신고 요청 콘텐츠</label>
          <div className="bg-bg-blue rounded-lg px-4 py-3">
            <p className="text-sm font-light text-text-accent">{title}</p>
          </div>
        </div>

        {/* 신고 사유 선택 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-dark">신고 사유 선택</label>
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
          <label className="text-sm font-semibold text-text-dark">신고 근거</label>
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
            <ul className="flex flex-col gap-1">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 bg-bg-light rounded-lg text-xs"
                >
                  <span className="text-text-dark truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-2"
                    aria-label="파일 삭제"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 서비스 이용 약관 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-dark">서비스 이용 약관</label>
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
