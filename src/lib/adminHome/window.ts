// 클라이언트 컴포넌트(AdminHomeWindowToggle 등) 와 서버 쿼리 양쪽에서 공유되는
// window 토글 상수/타입 모음. server.ts(`next/headers`) 를 끌어오면 클라이언트
// 빌드가 깨지므로 server import 가 없는 별도 파일로 둠.

export type AdminHomeWindowHours = 24 | 48 | 72;

export const ADMIN_HOME_WINDOWS: AdminHomeWindowHours[] = [24, 48, 72];

export function parseAdminHomeWindow(raw: string | undefined): AdminHomeWindowHours {
  if (raw === '48') return 48;
  if (raw === '72') return 72;
  return 24;
}
