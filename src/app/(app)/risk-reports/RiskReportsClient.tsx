'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDown, Check, CalendarDays, Paperclip, Download } from 'lucide-react';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';
import { useRiskReports, reportKeys } from '@/hooks/report/useReportQuery';
import { updateRiskReport } from '@/lib/api/reportApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { RiskReport } from '@/lib/api/reportApi';
import type { Workspace } from '@/types/workspace';

const ReportCalendarModal = dynamic(
  () => import('@/components/client/sidebar/ReportCalendarModal').then((m) => m.ReportCalendarModal),
  { ssr: false },
);

const STATUS_OPTIONS = [
  { value: 'requested', label: '요청 완료' },
  { value: 'pending', label: '결과 대기' },
  { value: 'resolved', label: '삭제 완료' },
  { value: 'rejected', label: '삭제 반려' },
] as const;

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  requested: { label: '요청 완료', className: 'bg-slate-100 text-slate-600' },
  pending: { label: '결과 대기', className: 'bg-amber-50 text-amber-600' },
  resolved: { label: '삭제 완료', className: 'bg-blue-50 text-blue-600' },
  rejected: { label: '삭제 반려', className: 'bg-red-50 text-red-600' },
};

const PLATFORM_LABELS: Record<string, string> = {
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  ...STATUS_OPTIONS.map((s) => ({ key: s.value, label: s.label })),
] as const;

// ── 워크스페이스 Combobox ──

function WorkspaceCombobox({
  workspaces,
  selectedId,
  onChange,
}: {
  workspaces: Workspace[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const allOption = { id: '', company_name: '전체 워크스페이스' } as Workspace;
  const options = [allOption, ...workspaces];
  const filtered = query
    ? options.filter((ws) => ws.company_name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = workspaces.find((ws) => ws.id === selectedId) ?? allOption;

  return (
    <Combobox
      value={selected}
      onChange={(ws) => onChange(ws?.id ?? '')}
      onClose={() => setQuery('')}
    >
      <div className="relative w-56">
        <div className="flex items-center border border-slate-200 rounded-lg focus-within:border-blue-400 transition-colors bg-white">
          <ComboboxInput
            className="w-full text-sm px-3 py-2 outline-none bg-transparent"
            displayValue={(ws: Workspace) => ws?.company_name ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="워크스페이스 검색"
          />
          <ComboboxButton className="px-2 text-slate-400 bg-transparent cursor-pointer">
            <ChevronDown size={16} />
          </ComboboxButton>
        </div>
        <ComboboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-white border border-slate-200 shadow-lg py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">검색 결과 없음</div>
          ) : (
            filtered.map((ws) => (
              <ComboboxOption
                key={ws.id || '_all'}
                value={ws}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[focus]:bg-blue-50 transition-colors"
              >
                {({ selected: isSelected }) => (
                  <>
                    <Check size={14} className={isSelected ? 'text-blue-600' : 'text-transparent'} />
                    <span className={isSelected ? 'font-semibold text-blue-600' : 'text-slate-700'}>
                      {ws.company_name}
                    </span>
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

// ── 보고서 달력 선택 ──

function ReportCalendarSelector({
  workspaceId,
  selectedReportId,
  onChange,
}: {
  workspaceId: string;
  selectedReportId: string;
  onChange: (reportId: string) => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  // 특정 workspace 선택 시 해당 workspace의 report만, 아니면 전체
  const { data: wsReports } = useReports(workspaceId);
  const { data: allReports } = useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const { data } = await createClient()
        .from('reports')
        .select('id, type, status, period_start, period_end')
        .order('period_end', { ascending: false });
      return data ?? [];
    },
    enabled: !workspaceId,
    staleTime: 5 * 60 * 1000,
  });
  const reports = workspaceId ? wsReports : allReports;

  const selectedReport = reports?.find((r) => r.id === selectedReportId);
  const label = selectedReport
    ? `${selectedReport.period_start.replace(/-/g, '.')} ~ ${selectedReport.period_end.replace(/-/g, '.')}`
    : '전체 보고서';

  const handleSelect = (reportId: string) => {
    onChange(reportId);
    setShowCalendar(false);
  };

  return (
    <>
      <button
        onClick={() => setShowCalendar(true)}
        className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <CalendarDays size={16} className="text-slate-400" />
        <span className={selectedReport ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
          {label}
        </span>
      </button>
      {showCalendar && reports && (
        <ReportCalendarModal
          reports={reports}
          currentReportId={selectedReportId}
          onSelect={handleSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}

// ── 상세 모달 ──

function DetailModal({ report, onClose, onUpdate }: { report: RiskReport; onClose: () => void; onUpdate: () => void }) {
  const [status, setStatus] = useState(report.status);
  const [adminNote, setAdminNote] = useState(report.admin_note ?? '');
  const [saving, setSaving] = useState(false);

  const hasChanges = status !== report.status || adminNote !== (report.admin_note ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRiskReport(report.id, { status, admin_note: adminNote });
      toast.success('업데이트 완료');
      onUpdate();
      onClose();
    } catch {
      toast.error('업데이트 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="신고 대행 요청 상세"
      size="lg"
      footer={
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">신고 게시물</label>
        <div className="bg-bg-blue rounded-lg px-4 py-3">
          <a href={report.link} target="_blank" rel="noopener noreferrer" className="text-sm text-text-accent hover:underline">
            {report.title}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-muted">채널</span>
          <span className="text-sm text-text-dark">{PLATFORM_LABELS[report.platform_id] ?? report.platform_id}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-muted">리스크 유형</span>
          <span className="text-sm text-text-dark">{report.critical_type}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">신고 사유</span>
        <span className="text-sm text-text-dark">{report.reason}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">신고 근거</span>
        <div className="bg-bg-light rounded-lg px-4 py-3 text-sm text-text-dark whitespace-pre-line">
          {report.evidence}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-muted">
          첨부 파일 {report.file_urls.length > 0 ? `(${report.file_urls.length})` : ''}
        </span>
        {report.file_urls.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {report.file_urls.map((url, i) => {
              const filename = url.split('/').pop() ?? url;
              const ext = filename.split('.').pop()?.toUpperCase() ?? '';
              const handleDownload = async () => {
                const supabase = createClient();
                const { data } = await supabase.storage.from('risk-attachments').download(url);
                if (data) {
                  const blobUrl = URL.createObjectURL(data);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(blobUrl);
                }
              };
              return (
                <li key={i} className="flex items-center gap-3 px-3 py-2 bg-bg-light rounded-lg">
                  <Paperclip size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-text-dark truncate flex-1">{filename}</span>
                  <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded shrink-0">{ext}</span>
                  <button onClick={handleDownload} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0">
                    <Download size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">없음</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">처리 상태</label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                status === s.value ? 'bg-bg-accent text-white' : 'bg-bg-light text-text-muted hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text-dark">관리자 메모</label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="처리 내용이나 메모를 입력하세요."
          rows={3}
          className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 outline-none focus:border-bg-accent transition-colors resize-none"
        />
      </div>
    </Modal>
  );
}

// ── 메인 페이지 ──

interface RiskReportsClientProps {
  // null → 전체 (super_admin), 배열 → 해당 id 만 (admin)
  assignedIds: string[] | null;
}

export function RiskReportsClient({ assignedIds }: RiskReportsClientProps) {
  const { data: allWorkspaces = [] } = useWorkspaces();
  const workspaces = useMemo(() => {
    if (assignedIds === null) return allWorkspaces;
    const allowed = new Set(assignedIds);
    return allWorkspaces.filter((ws) => allowed.has(ws.id));
  }, [allWorkspaces, assignedIds]);

  const [selectedWsId, setSelectedWsId] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<RiskReport | null>(null);
  const queryClient = useQueryClient();

  const { data: rawRiskReports, isLoading } = useRiskReports(
    selectedWsId || '_all',
    selectedReportId || undefined,
  );

  // admin 은 배정받은 ws 의 risk 만 보이도록 클라이언트에서 한 번 더 필터
  const riskReports = useMemo(() => {
    if (assignedIds === null) return rawRiskReports;
    const allowed = new Set(assignedIds);
    return (rawRiskReports ?? []).filter((r) => allowed.has(r.workspace_id));
  }, [rawRiskReports, assignedIds]);

  // workspace 변경 시 report 선택 초기화
  const handleWsChange = (wsId: string) => {
    setSelectedWsId(wsId);
    setSelectedReportId('');
  };

  const filtered = useMemo(() => {
    let list = riskReports ?? [];
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  }, [riskReports, statusFilter]);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(selectedWsId || '_all', selectedReportId || undefined) });
  };

  // workspace명 매핑
  const wsMap = useMemo(() => new Map(workspaces.map((ws) => [ws.id, ws.company_name])), [workspaces]);

  return (
    <div className="p-6 lg:p-8 h-full bg-slate-50">
      <div className="max-w-5xl mx-auto flex flex-col gap-6 h-full">
        <h1 className="text-xl font-bold text-slate-800 pb-2 border-b border-slate-100">
          리스크 관리
        </h1>

        {/* 필터 영역 */}
        <div className="flex items-center gap-4 flex-wrap">
          <WorkspaceCombobox
            workspaces={workspaces}
            selectedId={selectedWsId}
            onChange={handleWsChange}
          />

          <ReportCalendarSelector
            workspaceId={selectedWsId}
            selectedReportId={selectedReportId}
            onChange={setSelectedReportId}
          />
        </div>

        {/* 테이블 (탭 + 바디 통합) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* 상태 필터 (탭 스타일) */}
          <div className="flex gap-4 px-4 pt-3 border-b border-border-light shrink-0">
            {STATUS_FILTERS.map((f) => {
              const count = f.key === 'all'
                ? (riskReports ?? []).length
                : (riskReports ?? []).filter((r) => r.status === f.key).length;
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className={`text-xs px-2 transition-colors ${active ? 'text-text-dark font-semibold' : 'text-text-muted font-normal'}`}>
                    {f.label} ({count})
                  </span>
                  <div className={`h-0.5 w-full rounded-full transition-colors ${active ? 'bg-text-accent' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
          {/* 헤더 */}
          <div className="grid grid-cols-[8%_10%_8%_8%_1fr_12%] border-b border-slate-100 py-3 px-4 text-xs font-semibold text-slate-500 text-center shrink-0">
            <div>신고일</div>
            <div>회사명</div>
            <div>채널명</div>
            <div>신고 사유</div>
            <div className="text-left pl-2">세부 내용</div>
            <div>상태</div>
          </div>

          {/* 바디 */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-text-muted">불러오는 중...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-text-muted">신고 대행 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filtered.map((rr) => {
                const statusCfg = STATUS_STYLES[rr.status] ?? { label: rr.status, className: 'bg-slate-100 text-slate-600' };
                return (
                  <div
                    key={rr.id}
                    onClick={() => setSelected(rr)}
                    className="grid grid-cols-[8%_10%_8%_8%_1fr_12%] items-center py-3 px-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <div className="text-center text-xs text-slate-500">
                      {rr.requested_at?.slice(5, 10).replace(/-/g, '.') ?? ''}
                    </div>
                    <div className="text-center text-xs text-slate-500 truncate">
                      {wsMap.get(rr.workspace_id) ?? ''}
                    </div>
                    <div className="text-center text-xs text-slate-500">
                      {PLATFORM_LABELS[rr.platform_id] ?? rr.platform_id}
                    </div>
                    <div className="text-center text-xs text-slate-500">
                      {rr.reason}
                    </div>
                    <div className="pl-2 flex items-center gap-2 min-w-0">
                      <span className="text-sm text-slate-800 font-semibold truncate">
                        {rr.title}
                      </span>
                      {rr.file_urls.length > 0 && (
                        <span className="flex items-center gap-0.5 text-slate-400 shrink-0">
                          <Paperclip size={12} />
                          <span className="text-[10px]">{rr.file_urls.length}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-text-muted text-center py-2 shrink-0 border-t border-slate-50">총 {filtered.length}건</p>
        </div>
      </div>

      {selected && (
        <DetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
