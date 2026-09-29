export type SourceType = 'Play Store' | 'App Store';
export type SentimentType = 'Positive' | 'Neutral' | 'Negative';
export type SeverityType = 'High' | 'Medium' | 'Low';
export type PulseStatus = 'Ready to publish' | 'Published' | 'Draft';

export interface Review {
  id: string;
  rating: number; // 1 to 5
  title: string | null;
  text: string;
  date: string;
  source: SourceType;
  theme: string;
  sentiment: SentimentType;
  pii_stripped: boolean;
}

export interface Theme {
  id: string;
  name: string;
  reviewCount: number;
  percentage: number;
  severity: SeverityType;
  trend: number; // e.g., +12 for +12%, -4 for -4%
  rank: number;
  description?: string;
  commonComplaints?: string[];
  relatedActions?: string[];
}

export interface Quote {
  id: string;
  text: string;
  rating: number;
  source: SourceType;
  date: string;
  pii_stripped: boolean;
  theme: string;
}

export interface Pulse {
  id: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  status: PulseStatus;
  themes: Theme[];
  quotes: Quote[];
  actionIdeas: string[];
  wordCount: number;
  maxWords: number;
  reviewCount: number;
  averageRating: number;
  negativePercentage: number;
  docUrl?: string;
  draftId?: string;
  publishedAt?: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  change: string;
  changeText: string;
  trendDirection: 'up' | 'down' | 'neutral';
  trendIsGood: boolean;
  sparkline: number[];
}

export interface RatingBreakdownItem {
  stars: 1 | 2 | 3 | 4 | 5;
  percentage: number;
  count: number;
}

export interface SourceBreakdownItem {
  source: SourceType;
  percentage: number;
  count: number;
}

export interface WeeklyTrendItem {
  week: string;
  totalReviews: number;
  negativePct: number;
}

export interface HistoricalPulseItem {
  id: string;
  week: string;
  dateRange: string;
  reviews: number;
  topTheme: string;
  sentiment: 'Positive' | 'Mixed' | 'Negative';
  status: PulseStatus;
  publishedDate: string;
  docUrl: string;
}
