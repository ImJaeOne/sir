'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { submitUpgradeInquiry } from '@/lib/api/inquiryApi';

interface ServiceUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  description?: React.ReactNode;
}

const DEFAULT_DESCRIPTION = (
  <>
    상품 업그레이드 안내가 필요하신가요?
    <br />
    아래 양식에 맞춰 접수하시면 신속하게 연락드리겠습니다.
  </>
);

const PRIVACY_TERMS = `개인정보의 수집 및 이용 목적
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

export function ServiceUpgradeModal({ open, onClose, description }: ServiceUpgradeModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCompanyName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setAgreed(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const isValid =
    companyName.trim() && contactName.trim() && phone.trim() && email.trim() && agreed;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await submitUpgradeInquiry({
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success('문의가 완료되었습니다.');
      reset();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="서비스 업그레이드"
      size="lg"
      footer={
        <Button onClick={handleSubmit} disabled={!isValid || submitting} fullWidth>
          {submitting ? '전송 중...' : '문의하기'}
        </Button>
      }
    >
      <p className="text-sm text-text-muted leading-relaxed">
        {description ?? DEFAULT_DESCRIPTION}
      </p>

      {/* 회사명 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">회사명</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="회사명을 입력해주세요."
          className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors"
        />
      </div>

      {/* 담당자 성함 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">담당자 성함</label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="담당자 성함을 입력해주세요."
          className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors"
        />
      </div>

      {/* 연락처 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">연락처</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="연락처를 입력해주세요."
          className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors"
        />
      </div>

      {/* 이메일 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력해주세요."
          className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors"
        />
      </div>

      {/* 개인정보 수집 및 활용 동의 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">개인정보 수집 및 활용 동의</label>
        <div className="bg-bg-light rounded-lg p-3 max-h-40 overflow-y-auto">
          <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
            {PRIVACY_TERMS}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="accent-bg-accent"
          />
          <span className={`text-sm font-light ${agreed ? 'text-text-accent' : 'text-text-muted'}`}>
            개인정보 수집 및 활용에 동의합니다.
          </span>
        </label>
      </div>
    </Modal>
  );
}
