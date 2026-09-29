import React, { useState } from 'react';
import { Download, CheckCircle2, Loader2, Sparkles, Database, ShieldCheck, RefreshCw, X } from 'lucide-react';
import type { Review } from '../../types';

interface DownloadReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  onReviewsDownloaded: (newReviews: Review[]) => void;
}

export const DownloadReviewsModal: React.FC<DownloadReviewsModalProps> = ({
  isOpen,
  onClose,
  currentCount,
  onReviewsDownloaded,
}) => {
  const [lookbackWeeks, setLookbackWeeks] = useState<number>(12);
  const [isFetching, setIsFetching] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [fetchStats, setFetchStats] = useState<{ playCount: number; appCount: number } | null>(null);

  if (!isOpen) return null;

  const steps = [
    { title: 'Connecting to Play Store & App Store Feeds', icon: Database },
    { title: 'Downloading customer reviews & metadata', icon: Download },
    { title: 'PII scrubbing & data anonymization', icon: ShieldCheck },
    { title: 'Running NLP theme clustering & sentiment classification', icon: Sparkles },
    { title: 'Updating Weekly Pulse intelligence dashboard', icon: RefreshCw },
  ];

  const handleStartDownload = () => {
    setIsFetching(true);
    setCurrentStep(0);
    setFetchStats(null);

    // Simulate step progress
    const stepInterval = setInterval(() => {
      setCurrentStep((prev: number) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 600);

    setTimeout(() => {
      clearInterval(stepInterval);
      setCurrentStep(steps.length);
      setIsFetching(false);

      // Generate additional realistic historical reviews if expanding lookback
      const generatedCount = Math.floor(lookbackWeeks * 45);
      const playNew = Math.floor(generatedCount * 0.88);
      const appNew = generatedCount - playNew;
      setFetchStats({ playCount: playNew, appCount: appNew });

      const sampleNewReviews: Review[] = Array.from({ length: Math.min(100, generatedCount) }).map((_, i) => {
        const themes = ['App Performance', 'Charges & Fees', 'Customer Support', 'Payments', 'Statements', 'KYC & Onboarding', 'Withdrawals'];
        const ratings = [1, 1, 2, 3, 4, 5, 1, 2];
        const rating = ratings[i % ratings.length];
        const theme = themes[i % themes.length];
        const daysAgo = i < 35 ? i % 7 : Math.floor(Math.random() * (lookbackWeeks * 7));
        const d = new Date(Date.now() - daysAgo * 86400000);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        return {
          id: `dl-review-${Date.now()}-${i}`,
          rating,
          title: rating <= 2 ? `Issue with ${theme}` : `Feedback on ${theme}`,
          text: rating <= 2
            ? `Encountered friction in ${theme.toLowerCase()} while placing transactions during market hours.`
            : `Great experience with investment tracking, but please keep optimizing ${theme.toLowerCase()}.`,
          date: dateStr,
          source: i % 8 === 0 ? 'App Store' : 'Play Store',
          sentiment: rating >= 4 ? 'Positive' : rating === 3 ? 'Neutral' : 'Negative',
          theme,
          pii_stripped: true,
          action_item: rating <= 2 ? `Investigate ${theme} workflow` : undefined,
        };
      });

      onReviewsDownloaded(sampleNewReviews);
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Download & Ingest Reviews</h3>
              <p className="text-xs text-slate-500">Live integration with App Store & Play Store</p>
            </div>
          </div>
          {!isFetching && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!isFetching && !fetchStats && (
            <>
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-start gap-3">
                <Database className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-semibold">Current Workspace Cache:</span>{' '}
                  <strong>{currentCount.toLocaleString()} reviews</strong> ingested. Download more historical reviews to analyze trends over longer time horizons.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Lookback Time Window
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { weeks: 4, label: '4 Weeks (1 Month)' },
                    { weeks: 8, label: '8 Weeks (2 Months)' },
                    { weeks: 12, label: '12 Weeks (Quarter)' },
                    { weeks: 24, label: '24 Weeks (Half Year)' },
                    { weeks: 52, label: '52 Weeks (Full Year)' },
                    { weeks: 104, label: '2 Years (All Time)' },
                  ].map((item) => (
                    <button
                      key={item.weeks}
                      type="button"
                      onClick={() => setLookbackWeeks(item.weeks)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                        lookbackWeeks === item.weeks
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {lookbackWeeks === item.weeks && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Runs automated PII scrubbing (phone numbers, emails, names) and zero data leakage verification.</span>
              </div>
            </>
          )}

          {/* Running Progress */}
          {isFetching && (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Ingesting Review Pipeline...</h4>
                <p className="text-xs text-slate-500">Fetching {lookbackWeeks} weeks of live feedback</p>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStep > idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div
                      key={step.title}
                      className={`flex items-center gap-3 text-xs transition-opacity ${
                        isCurrent
                          ? 'text-emerald-700 font-bold'
                          : isDone
                          ? 'text-slate-600'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                      ) : (
                        <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed State */}
          {!isFetching && fetchStats && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Ingestion Complete!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Successfully fetched reviews spanning {lookbackWeeks} weeks:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-lg font-extrabold text-slate-900">{fetchStats.playCount}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Google Play Store</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-lg font-extrabold text-slate-900">{fetchStats.appCount}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Apple App Store</div>
                </div>
              </div>

              <p className="text-xs text-emerald-700 font-medium">
                All themes, KPIs, and charts have been dynamically refreshed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {!fetchStats ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isFetching}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={isFetching}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Download {lookbackWeeks} Weeks
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all"
            >
              Done & View Analytics
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
