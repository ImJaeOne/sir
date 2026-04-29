'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { TIER_FEATURES, TIER_LABELS, TIER_OPTIONS, type Tier } from '@/types/subscription';

interface TierPickerProps {
  value: Tier | undefined;
  onChange: (tier: Tier) => void;
  disabled?: boolean;
}

const FEATURE_KEYS = [
  { key: 'has_daily', label: '일간 보고서' },
  { key: 'has_armor', label: '아머 (신고 대행)' },
  { key: 'has_booster', label: '부스터' },
] as const;

export function TierPicker({ value, onChange, disabled }: TierPickerProps) {
  return (
    <div>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton className="flex w-full items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="text-slate-700 flex-1 text-left">
              {value ? TIER_LABELS[value] : '선택'}
            </span>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </ListboxButton>
          <ListboxOptions className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg bg-white border border-slate-200 shadow-lg py-1">
            {TIER_OPTIONS.map((t) => (
              <ListboxOption
                key={t}
                value={t}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[focus]:bg-blue-50 transition-colors"
              >
                {({ selected: isSelected }) => (
                  <>
                    <Check size={14} className={isSelected ? 'text-blue-600' : 'text-transparent'} />
                    <span className={isSelected ? 'font-semibold text-blue-600' : 'text-slate-700'}>
                      {TIER_LABELS[t]}
                    </span>
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
      {value && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FEATURE_KEYS.map(({ key, label }) => {
            const on = TIER_FEATURES[value][key];
            return (
              <span
                key={key}
                className={
                  on
                    ? 'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-600 font-medium'
                    : 'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-400'
                }
              >
                {on ? '●' : '○'} {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
