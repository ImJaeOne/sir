import { CONTACT_URL } from '@/lib/contact';

export function ServiceUpgradeButton() {
  return (
    <div className="px-3 w-full">
      <a
        href={CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-2.5 rounded-lg text-sm bg-bg-dark transition-colors cursor-pointer justify-center px-3 py-2.5"
      >
        <span className="text-white font-semibold text-center">서비스 업그레이드</span>
      </a>
    </div>
  );
}
