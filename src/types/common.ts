import { z } from 'zod';

// ── 공통 Enum ──

export const sentimentEnum = z.enum(['positive', 'neutral', 'negative']);
export type Sentiment = z.infer<typeof sentimentEnum>;

export const criticalTypeEnum = z.enum(['defamation', 'insult', 'rumor', 'spam']);
export type CriticalType = z.infer<typeof criticalTypeEnum>;
