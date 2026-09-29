import React, { useState } from 'react';
import { Search, Star, RotateCcw } from 'lucide-react';
import type { Review, SourceType, SentimentType } from '../types';
import { SentimentBadge, SourceBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface ReviewsPageProps {
  reviews: Review[];
  onSelectReview: (id: string) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ reviews, onSelectReview }) => {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | 'all'>('all');

  const themesList = Array.from(new Set(reviews.map((r) => r.theme)));

  const filteredReviews = reviews.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        r.text.toLowerCase().includes(q) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        r.theme.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (themeFilter !== 'all' && r.theme !== themeFilter) return false;
    if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSearch('');
    setRatingFilter('all');
    setSourceFilter('all');
    setThemeFilter('all');
    setSentimentFilter('all');
  };

  const hasActiveFilters =
    search || ratingFilter !== 'all' || sourceFilter !== 'all' || themeFilter !== 'all' || sentimentFilter !== 'all';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reviews Explorer</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Browse, search, and inspect the raw customer feedback behind this week’s AI theme clustering.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feedback text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Filter by star rating"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Ratings (1★ - 5★)</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceType | 'all')}
              aria-label="Filter by app store source"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Sources</option>
              <option value="Play Store">Play Store</option>
              <option value="App Store">App Store</option>
            </select>
          </div>

          <div>
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              aria-label="Filter by detected theme"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Themes</option>
              {themesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value as SentimentType | 'all')}
              aria-label="Filter by sentiment"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Found <span className="font-bold text-slate-800">{filteredReviews.length}</span> matching reviews
          </span>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <EmptyState
          icon="search"
          title="No reviews match your criteria"
          description="Try adjusting your keywords, star ratings, or theme filters to see more results."
          actionText="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 border-b border-slate-200/80">
                  <th className="py-3 px-4 w-28">Rating</th>
                  <th className="py-3 px-4 min-w-[280px]">Review Feedback</th>
                  <th className="py-3 px-4">Detected Theme</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-center">Sentiment</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReviews.map((rev) => (
                  <tr
                    key={rev.id}
                    onClick={() => onSelectReview(rev.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < rev.rating
                                ? rev.rating <= 2
                                  ? 'fill-rose-400 text-rose-400'
                                  : 'fill-amber-400 text-amber-400'
                                : 'fill-slate-100 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 pr-6">
                      {rev.title && (
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-0.5">
                          {rev.title}
                        </p>
                      )}
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">{rev.text}</p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {rev.theme}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <SourceBadge source={rev.source} />
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <SentimentBadge sentiment={rev.sentiment} />
                    </td>

                    <td className="py-4 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                      {rev.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
