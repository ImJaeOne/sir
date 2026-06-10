/** 서비스 업그레이드/문의는 모달 대신 외부 문의 페이지로 연결 */
export const CONTACT_URL = 'https://s-ir.kr/contact/';

export function openContactPage() {
  window.open(CONTACT_URL, '_blank', 'noopener,noreferrer');
}
