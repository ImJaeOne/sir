export type Tier =
  | 'white'
  | 'red'
  | 'blue'
  | 'black'
  | 'white_plus'
  | 'red_plus'
  | 'blue_plus'
  | 'black_plus';

export const TIER_LABELS: Record<Tier, string> = {
  white: '화이트',
  red: '레드',
  blue: '블루',
  black: '블랙',
  white_plus: '화이트+',
  red_plus: '레드+',
  blue_plus: '블루+',
  black_plus: '블랙+',
};

export const TIER_OPTIONS: Tier[] = [
  'white',
  'red',
  'blue',
  'black',
  'white_plus',
  'red_plus',
  'blue_plus',
  'black_plus',
];

export type SubscriptionDuration = 1 | 3 | 6 | 12;

export const DURATION_OPTIONS: { value: SubscriptionDuration; label: string }[] = [
  { value: 1, label: '1개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
];
