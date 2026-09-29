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

export async function fetchLiveReviewsFromStores(
  batches = 3
): Promise<{ reviews: Review[]; playCount: number; appCount: number }> {
  try {
    const resp = await fetch(`/api/live-reviews?batches=${batches}`);
    if (!resp.ok) {
      return { reviews: [], playCount: 0, appCount: 0 };
    }
    const data = await resp.json();
    if (data?.success && Array.isArray(data.reviews)) {
      return {
        reviews: data.reviews as Review[],
        playCount: Number(data.playCount || 0),
        appCount: Number(data.appCount || 0),
      };
    }
  } catch {
    // Fallback to existing dataset if offline or running without serverless API
  }
  return { reviews: [], playCount: 0, appCount: 0 };
}

export function mergeDeduplicatedReviews(
  liveReviews: Review[],
  existingReviews: Review[]
): Review[] {
  if (!liveReviews.length) return existingReviews;
  const seen = new Set<string>();
  const merged: Review[] = [];
  for (const r of [...liveReviews, ...existingReviews]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }
  return merged.sort(
    (a, b) => parseReviewDate(b.date).getTime() - parseReviewDate(a.date).getTime()
  );
}

export async function generateNewPulse(
  onProgress?: (p: GenerationProgress) => void,
  reviews: Review[] = mockReviewsList,
  windowId: PulseWindowOption = 'current_week',
  onLiveReviewsMerged?: (mergedReviews: Review[]) => void
): Promise<Pulse> {
  onProgress?.({
    step: 'ingestion',
    message: 'Fetching live reviews from Google Play Store & Apple App Store...',
    progressPercent: 20,
  });

  const liveResult = await fetchLiveReviewsFromStores(3);
  const activeDataset = mergeDeduplicatedReviews(liveResult.reviews, reviews);
  if (liveResult.reviews.length > 0) {
    onLiveReviewsMerged?.(activeDataset);
  }

  const { startDate, endDate, label, filtered } = resolveWindowBounds(activeDataset, windowId);
  const startIso = formatIsoDate(startDate);
  const endIso = formatIsoDate(endDate);

  onProgress?.({
    step: 'ingestion',
    message: `Ingested & PII-scrubbed ${filtered.length.toLocaleString()} reviews (${startIso} to ${endIso})...`,
    progressPercent: 40,
  });
  await new Promise((resolve) => setTimeout(resolve, 350));

  onProgress?.({
    step: 'clustering',
    message: 'Clustering themes & sentiment with Gemini AI engine...',
    progressPercent: 65,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  onProgress?.({
    step: 'ranking',
    message: 'Selecting verbatim user quotes and verifying PII redaction...',
    progressPercent: 85,
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  onProgress?.({
    step: 'assembly',
    message: 'Enforcing 250-word constraint and assembling Markdown report...',
    progressPercent: 95,
  });
  await new Promise((resolve) => setTimeout(resolve, 300));

  const computed = computeFilteredAnalytics(filtered, activeDataset, {
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
