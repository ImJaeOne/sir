import { SirSymbol } from '@/components/icons/SirSymbol';
import { SirLogoIcon } from '@/components/icons/SirLogo.Icon';

export function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-100">
      <SirSymbol size={16} />
      <SirLogoIcon width={48} height={18} />
    </header>
  );
}
