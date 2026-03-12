import { useState, useCallback } from 'react';

export function useToggleSet(initial?: string[]) {
  const [set, setSet] = useState<Set<string>>(() => new Set(initial));

  const toggle = useCallback((key: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const has = useCallback((key: string) => set.has(key), [set]);

  return { has, toggle };
}
