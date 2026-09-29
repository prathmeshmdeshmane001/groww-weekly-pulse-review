import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { TopThemesTable } from '../components/dashboard/TopThemesTable';
import { RatingDistribution } from '../components/dashboard/RatingDistribution';
import { PulsePreviewCard } from '../components/dashboard/PulsePreviewCard';
import { RecentReviewsTable } from '../components/dashboard/RecentReviewsTable';
import { TrendChart } from '../components/dashboard/TrendChart';
import { TopQuoteBanner, BottomImpactBanner } from '../components/dashboard/Banners';
import type {
  Pulse,
  Metric,
  Theme,
  RatingBreakdownItem,
  SourceBreakdownItem,
  WeeklyTrendItem,
  Review,
} from '../types';
import type { DateRangeFilter } from '../utils/analytics';

interface OverviewPageProps {
  currentPulse: Pulse;
  metrics: Metric[];
  themes: Theme[];
  ratingBreakdown: RatingBreakdownItem[];
  sourceBreakdown: SourceBreakdownItem[];
  weeklyTrends: WeeklyTrendItem[];
  recentReviews: Review[];
  filteredCount: number;
  dateFilter: DateRangeFilter;
  onSelectTheme: (id: string) => void;
  onSelectReview: (id: string) => void;
  onViewAllThemes: () => void;
  onViewAllReviews: () => void;
  onViewFullPulse: () => void;
  onOpenDownloadModal: () => void;
  onShowToast: (toast: {
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
    actionText?: string;
    actionUrl?: string;
  }) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  currentPulse,
  metrics,
  themes,
  ratingBreakdown,
  sourceBreakdown,
  weeklyTrends,
  recentReviews,
  filteredCount,
  dateFilter,
  onSelectTheme,
  onSelectReview,
  onViewAllThemes,
  onViewAllReviews,
  onViewFullPulse,
  onOpenDownloadModal,
  onShowToast,
}) => {
  const avgRatingNum = parseFloat(String(metrics.find((m) => m.id === 'rating')?.value || '3.2'));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Quote Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Weekly Pulse
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {dateFilter.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real customer feedback intelligence computed dynamically across {filteredCount.toLocaleString()} reviews.
          </p>
        </div>

        <div className="w-full lg:max-w-md">
          <TopQuoteBanner />
        </div>
      </div>

      {/* Low Reviews Alert Banner */}
      {filteredCount < 15 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Few reviews in this selected time range ({filteredCount} total).</span>{' '}
              <span>Download more historical reviews from Google Play Store & Apple App Store to increase sample size.</span>
            </div>
          </div>
          <button
            onClick={onOpenDownloadModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Reviews
          </button>
        </div>
      )}

      {/* Dynamic 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Middle Grid: Top Themes, Rating Distribution, Pulse Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col">
          <TopThemesTable
            themes={themes}
            onSelectTheme={onSelectTheme}
            onViewAll={onViewAllThemes}
          />
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <RatingDistribution
            ratings={ratingBreakdown}
            sources={sourceBreakdown}
            averageRating={avgRatingNum}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <PulsePreviewCard
            pulse={currentPulse}
            onViewFullPulse={onViewFullPulse}
            onShowToast={onShowToast}
          />
        </div>
      </div>

      {/* Bottom Grid: Recent Reviews & Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <RecentReviewsTable
            reviews={recentReviews}
            onSelectReview={onSelectReview}
            onViewAll={onViewAllReviews}
          />
        </div>

        <div className="lg:col-span-5">
          <TrendChart data={weeklyTrends} />
        </div>
      </div>

      {/* Bottom Impact Banner */}
      <BottomImpactBanner onAction={onViewAllThemes} />
    </div>
  );
};
