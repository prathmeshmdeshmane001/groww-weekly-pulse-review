import type { Pulse, HistoricalPulseItem } from '../types';
import { mockCurrentPulse, mockHistoricalPulses, mockThemes } from '../data/mockData';

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

export async function generateNewPulse(
  onProgress?: (p: GenerationProgress) => void
): Promise<Pulse> {
  onProgress?.({
    step: 'ingestion',
    message: 'Ingesting 1,284 reviews from App Store & Play Store...',
    progressPercent: 25,
  });
  await new Promise((resolve) => setTimeout(resolve, 600));

  onProgress?.({
    step: 'clustering',
    message: 'Clustering reviews with Gemini AI engine...',
    progressPercent: 55,
  });
  await new Promise((resolve) => setTimeout(resolve, 800));

  onProgress?.({
    step: 'ranking',
    message: 'Selecting verbatim user quotes and verifying PII redaction...',
    progressPercent: 80,
  });
  await new Promise((resolve) => setTimeout(resolve, 600));

  onProgress?.({
    step: 'assembly',
    message: 'Enforcing 250-word constraint and assembling Markdown report...',
    progressPercent: 95,
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  onProgress?.({
    step: 'complete',
    message: 'Weekly Pulse ready for review and delivery!',
    progressPercent: 100,
  });

  return {
    ...mockCurrentPulse,
    id: `pulse-generated-${Date.now()}`,
    status: 'Ready to publish',
    weekLabel: 'Current Week Pulse',
    wordCount: 187,
  };
}
