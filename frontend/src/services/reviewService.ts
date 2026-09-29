import type { Review, SourceType, SentimentType } from '../types';
import { mockReviewsList } from '../data/mockData';

export interface ReviewFilterOptions {
  search?: string;
  rating?: number | 'all';
  source?: SourceType | 'all';
  theme?: string | 'all';
  sentiment?: SentimentType | 'all';
}

export async function fetchReviews(filters?: ReviewFilterOptions): Promise<Review[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  let results = [...mockReviewsList];

  if (!filters) return results;

  if (filters.search && filters.search.trim()) {
    const query = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.text.toLowerCase().includes(query) ||
        (r.title && r.title.toLowerCase().includes(query)) ||
        r.theme.toLowerCase().includes(query)
    );
  }

  if (filters.rating && filters.rating !== 'all') {
    results = results.filter((r) => r.rating === filters.rating);
  }

  if (filters.source && filters.source !== 'all') {
    results = results.filter((r) => r.source === filters.source);
  }

  if (filters.theme && filters.theme !== 'all') {
    results = results.filter((r) => r.theme === filters.theme);
  }

  if (filters.sentiment && filters.sentiment !== 'all') {
    results = results.filter((r) => r.sentiment === filters.sentiment);
  }

  return results;
}

export async function fetchReviewById(id: string): Promise<Review | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockReviewsList.find((r) => r.id === id) || null;
}
