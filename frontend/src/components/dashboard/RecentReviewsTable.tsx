import React from 'react';
import { Star, ArrowRight, MoreHorizontal } from 'lucide-react';
import type { Review } from '../../types';
import { SentimentBadge, SourceBadge } from '../ui/Badge';

interface RecentReviewsTableProps {
  reviews: Review[];
  onSelectReview: (id: string) => void;
  onViewAll: () => void;
}

export const RecentReviewsTable: React.FC<RecentReviewsTableProps> = ({
  reviews,
  onSelectReview,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent reviews</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest app-store reviews with AI-detected themes and sentiment.
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group transition-colors"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
              <th className="py-2.5 pl-1">Rating</th>
              <th className="py-2.5 min-w-[200px]">Review</th>
              <th className="py-2.5">Theme</th>
              <th className="py-2.5">Source</th>
              <th className="py-2.5 text-center">Sentiment</th>
              <th className="py-2.5 text-right">Date</th>
              <th className="py-2.5 text-right pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {reviews.slice(0, 5).map((rev) => (
              <tr
                key={rev.id}
                onClick={() => onSelectReview(rev.id)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                {/* Rating stars */}
                <td className="py-3 pl-1 whitespace-nowrap">
                  <div className="flex items-center gap-0.5 text-emerald-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3 h-3 ${
                          idx < rev.rating
                            ? rev.rating <= 2
                              ? 'text-rose-400 fill-rose-400'
                              : 'text-emerald-500 fill-emerald-500'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </td>

                {/* Review text */}
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-800 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                    {rev.text}
                  </p>
                </td>

                {/* Detected Theme */}
                <td className="py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {rev.theme}
                  </span>
                </td>

                {/* Source */}
                <td className="py-3 whitespace-nowrap">
                  <SourceBadge source={rev.source} />
                </td>

                {/* Sentiment */}
                <td className="py-3 text-center whitespace-nowrap">
                  <SentimentBadge sentiment={rev.sentiment} />
                </td>

                {/* Date */}
                <td className="py-3 text-right text-slate-400 text-[11px] whitespace-nowrap">
                  {rev.date.split(',')[0]}
                </td>

                {/* Action button */}
                <td className="py-3 text-right pr-1">
                  <button className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
