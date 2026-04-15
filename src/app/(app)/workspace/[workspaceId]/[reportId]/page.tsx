'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';
import { AdminButton } from '@/components/ui/AdminButton';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { useReportInfo, reportKeys } from '@/hooks/report/useReportQuery';
import { createClient } from '@/lib/supabase/client';

const BG_COLORS = {
  'bg-light': 'var(--color-bg-light)',
  blue: '#f5faff',
} as const;

function SectionBg({
  color,
  gradient,
  children,
}: {
  color: keyof typeof BG_COLORS;
  gradient?: 'from-light' | 'from-blue';
  children: React.ReactNode;
}) {
  const bg = BG_COLORS[color];
  const gradientFrom =
    gradient === 'from-light'
      ? BG_COLORS['bg-light']
      : gradient === 'from-blue'
        ? BG_COLORS.blue
        : null;

  return (
    <div style={{ backgroundColor: bg }}>
      {gradientFrom && (
        <div
          className="h-10"
          style={{ background: `linear-gradient(to bottom, ${gradientFrom}, ${bg})` }}
        />
      )}
      <div className="mx-auto max-w-[1200px] px-10 py-5">{children}</div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: report } = useReportInfo(reportId);
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);

  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    if (isFetching === 0 && startedRef.current) setReady(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isFetching]);

  const isPublished = report?.status === 'published';

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('reports')
        .update({ status: 'published' })
        .eq('id', reportId);
      if (error) throw error;
      await queryClient.refetchQueries({ queryKey: reportKeys.info(reportId) });
      toast.success('보고서가 발행되었습니다.');
    } catch {
      toast.error('발행에 실패했습니다.');
    } finally {
      setPublishing(false);
    }
  };

  if (!ready) return <Loading />;

  return (
    <div className="min-h-full bg-slate-100 px-6 pt-8 lg:px-10 lg:pt-10 pb-0">
      <div className="mx-auto max-w-[1280px] flex flex-col gap-4">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link href="/workspace" className="text-text-muted hover:text-text-dark transition-colors">
              워크스페이스
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <Link href={`/workspace/${workspaceId}`} className="text-text-muted hover:text-text-dark transition-colors">
              {workspace?.company_name ?? '...'}
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-700 font-semibold">보고서</span>
          </nav>
          <Link
            href={`/report/${workspaceId}/${reportId}`}
            target="_blank"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            보고서 보기
            <ExternalLink
              size={13}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>

        {/* 종이 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.08)] overflow-hidden">
          <SectionBg color="bg-light">
            <div className="flex flex-col gap-10">
              <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
              <Highlight workspaceId={workspaceId} reportId={reportId} editable />
            </div>
          </SectionBg>
          <SectionBg color="blue" gradient="from-light">
            <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
          <SectionBg color="bg-light" gradient="from-blue">
            <TopContent workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
          <SectionBg color="blue" gradient="from-light">
            <RiskContent workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
          <SectionBg color="bg-light" gradient="from-blue">
            <Strategy workspaceId={workspaceId} reportId={reportId} editable />
          </SectionBg>
        </div>
      </div>

      {/* 종이와 발행 바 사이 여백 */}
      <div className="h-8 lg:h-10" />

      {/* 하단 고정 발행 바 */}
      <div className="sticky bottom-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200 -mx-6 lg:-mx-10">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPublished && <Check size={16} className="text-emerald-500" />}
            <span className={`text-sm font-medium ${isPublished ? 'text-emerald-600' : 'text-slate-500'}`}>
              {isPublished ? '발행됨' : '검토 대기'}
            </span>
          </div>
          <AdminButton
            variant={isPublished ? 'secondary' : 'primary'}
            onClick={handlePublish}
            disabled={publishing || isPublished}
          >
            {publishing ? '발행 중...' : isPublished ? '발행 완료' : '보고서 발행'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
