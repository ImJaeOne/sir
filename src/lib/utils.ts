import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(e: unknown, fallback = 'Unknown error'): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return fallback;
}
