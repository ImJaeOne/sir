import { AdminLoading } from '@/components/ui/AdminLoading';

// (app) 라우트 그룹 전체에 적용되는 loading UI.
// AppShell(layout) 은 그대로 유지되고 본문만 이 컴포넌트로 교체됨 → RSC 가 도착하면 실제 페이지로 swap.
export default function AppLoading() {
  // AppShell <main> 은 `flex-1 overflow-y-auto` 라 flex 컨테이너가 아님 → AdminLoading 의
  // `flex-1 + justify-center` 가 먹히도록 h-full flex wrapper 로 감싸야 상하 중앙정렬됨.
  return (
    <div className="h-full w-full flex">
      <AdminLoading />
    </div>
  );
}
