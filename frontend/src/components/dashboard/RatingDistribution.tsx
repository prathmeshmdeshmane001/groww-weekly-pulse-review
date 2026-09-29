import React from 'react';
import { Star, ArrowUp, HelpCircle } from 'lucide-react';
import type { RatingBreakdownItem, SourceBreakdownItem } from '../../types';

interface RatingDistributionProps {
  ratings: RatingBreakdownItem[];
  sources: SourceBreakdownItem[];
  averageRating: number;
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  ratings,
  sources,
  averageRating,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-5">
      {/* Top: Rating Distribution */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-slate-900">Rating distribution</h3>
            <span title="Breakdown of app store ratings for the selected time window" className="cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {ratings.map((item) => (
            <div key={item.stars} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-medium text-slate-600 flex items-center gap-0.5">
                {item.stars} <Star className="w-3 h-3 text-slate-400 fill-slate-300" />
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium text-slate-500 text-[11px]">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>

        {/* Average Rating Summary Pill */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-base font-bold text-slate-900">{averageRating}</span>
            <span className="text-slate-500 text-xs">Average rating</span>
          </div>
          <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 text-[11px]">
            <ArrowUp className="w-3 h-3" />
            0.2 vs. previous week
          </span>
        </div>
      </div>

      {/* Bottom: Source Breakdown */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-slate-900">Source breakdown</h4>
            <span title="Reviews sourced across Google Play Store & Apple App Store" className="cursor-help">
              <HelpCircle className="w-3 h-3 text-slate-400" />
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {sources.map((src) => {
            const isPlay = src.source === 'Play Store';
            return (
              <div key={src.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isPlay ? (
                      <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.993 1.993 0 0 1-.61-1.424V3.238c0-.555.228-1.057.609-1.424zM15.207 13.414l2.57 2.57-13.064 7.545 10.494-10.115zm0-2.828L4.713.471 17.777 8.016l-2.57 2.57zm1.414 1.414l3.774-2.18c.883-.51.883-1.344 0-1.854l-3.774-2.18 2.213 2.213a1.5 1.5 0 0 1 0 2.122l-2.213 2.213z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-1.02.04-2.25.68-2.91 1.45-.58.67-1.09 1.74-.95 2.78 1.14.09 2.24-.61 2.85-1.36z"/>
                      </svg>
                    )}
                    <span className="font-medium text-slate-700">{src.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{src.percentage}%</span>
                    <span className="text-slate-400 text-[11px]">{src.count} reviews</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${isPlay ? 'bg-emerald-500' : 'bg-slate-700'} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
