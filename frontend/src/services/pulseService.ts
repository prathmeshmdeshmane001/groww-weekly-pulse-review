import type { Pulse, HistoricalPulseItem, Review } from '../types';
import { mockCurrentPulse, mockHistoricalPulses, mockReviewsList, mockThemes } from '../data/mockData';
import {
  computeFilteredAnalytics,
  formatIsoDate,
  formatShortDate,
  parseReviewDate,
} from '../utils/analytics';

export async function fetchCurrentPulse(): Promise<Pulse> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { ...mockCurrentPulse };
}

export async function fetchHistoricalPulses(): Promise<HistoricalPulseItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [...mockHistoricalPulses];
}

export async function fetchPulseById(id: string): Promise<Pulse | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (id === mockCurrentPulse.id || id === 'current') {
    return { ...mockCurrentPulse };
  }
  const hist = mockHistoricalPulses.find((p) => p.id === id);
  if (!hist) return null;

  return {
    id: hist.id,
    weekStart: hist.dateRange.split(' to ')[0],
    weekEnd: hist.dateRange.split(' to ')[1],
    weekLabel: `${hist.week}, 2026`,
    status: hist.status,
    themes: mockThemes.slice(0, 3),
    quotes: mockCurrentPulse.quotes,
    actionIdeas: mockCurrentPulse.actionIdeas,
    wordCount: 194,
    maxWords: 250,
    reviewCount: hist.reviews,
    averageRating: 4.1,
    negativePercentage: 18.7,
    docUrl: hist.docUrl,
    draftId: 'draft-sample-' + hist.id,
  };
}

export interface GenerationProgress {
  step: 'ingestion' | 'clustering' | 'ranking' | 'assembly' | 'complete';
  message: string;
  progressPercent: number;
}

export type PulseWindowOption =
  | 'current_week'
  | 'prev_week'
  | '14d'
  | '30d'
  | '60d'
  | 'all';

export function resolveWindowBounds(
  allReviews: Review[],
  windowId: PulseWindowOption
): { startDate: Date; endDate: Date; label: string; filtered: Review[] } {
  const sourceReviews = allReviews.length > 0 ? allReviews : mockReviewsList;
  const times = sourceReviews.map((r) => parseReviewDate(r.date).getTime());
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  let startMs = minTime;
  let endMs = maxTime;

  if (windowId === 'current_week') {
    startMs = maxTime - 6 * 86400000;
    endMs = maxTime;
  } else if (windowId === 'prev_week') {
    endMs = maxTime - 7 * 86400000;
    startMs = endMs - 6 * 86400000;
  } else if (windowId === '14d') {
    startMs = maxTime - 13 * 86400000;
    endMs = maxTime;
  } else if (windowId === '30d') {
    startMs = maxTime - 29 * 86400000;
    endMs = maxTime;
  } else if (windowId === '60d') {
    startMs = maxTime - 59 * 86400000;
    endMs = maxTime;
  }

  const startDate = new Date(startMs);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endMs);
  endDate.setHours(23, 59, 59, 999);

  const filtered = sourceReviews.filter((r) => {
    const t = parseReviewDate(r.date).getTime();
    return t >= startDate.getTime() && t <= endDate.getTime();
  });

  const rangeStr = `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
  const label =
    windowId === 'current_week'
      ? `${rangeStr} (Current Week)`
      : windowId === 'prev_week'
      ? `${rangeStr} (Previous Week)`
      : windowId === '14d'
      ? `${rangeStr} (Last 14 Days)`
      : windowId === '30d'
      ? `${rangeStr} (Last 30 Days)`
      : windowId === '60d'
      ? `${rangeStr} (Last 60 Days)`
      : `${rangeStr} (Full Dataset)`;

  return {
    startDate,
    endDate,
    label,
    filtered: filtered.length > 0 ? filtered : sourceReviews,
  };
}

export async function generateNewPulse(
  onProgress?: (p: GenerationProgress) => void,
  reviews: Review[] = mockReviewsList,
  windowId: PulseWindowOption = 'current_week'
): Promise<Pulse> {
  const { startDate, endDate, label, filtered } = resolveWindowBounds(reviews, windowId);
  const startIso = formatIsoDate(startDate);
  const endIso = formatIsoDate(endDate);

  onProgress?.({
    step: 'ingestion',
    message: `Ingesting ${filtered.length.toLocaleString()} reviews (${startIso} to ${endIso})...`,
    progressPercent: 25,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  onProgress?.({
    step: 'clustering',
    message: 'Clustering themes & sentiment with Gemini AI engine...',
    progressPercent: 55,
  });
  await new Promise((resolve) => setTimeout(resolve, 650));

  onProgress?.({
    step: 'ranking',
    message: 'Selecting verbatim user quotes and verifying PII redaction...',
    progressPercent: 80,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  onProgress?.({
    step: 'assembly',
    message: 'Enforcing 250-word constraint and assembling Markdown report...',
    progressPercent: 95,
  });
  await new Promise((resolve) => setTimeout(resolve, 350));

  const computed = computeFilteredAnalytics(filtered, reviews, {
    type: 'custom',
    label,
    startDate,
    endDate,
  });

  onProgress?.({
    step: 'complete',
    message: 'Weekly Pulse ready for review and delivery!',
    progressPercent: 100,
  });

  if (computed.pulse) {
    return {
      ...computed.pulse,
      id: `pulse-${startIso}-to-${endIso}`,
      weekStart: startIso,
      weekEnd: endIso,
      weekLabel: label,
      status: 'Ready to publish',
    };
  }

  return {
    ...mockCurrentPulse,
    id: `pulse-${startIso}-to-${endIso}`,
    weekStart: startIso,
    weekEnd: endIso,
    weekLabel: label,
    status: 'Ready to publish',
  };
}
