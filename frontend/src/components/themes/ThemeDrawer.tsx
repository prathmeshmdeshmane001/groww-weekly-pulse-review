import React from 'react';
import { ArrowUp, ArrowDown, AlertTriangle, Lightbulb, MessageSquare } from 'lucide-react';
import type { Theme } from '../../types';
import { Drawer } from '../ui/Drawer';
import { SeverityBadge } from '../ui/Badge';
import { mockReviewsList } from '../../data/mockData';

interface ThemeDrawerProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectReview?: (id: string) => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({
  theme,
  isOpen,
  onClose,
  onSelectReview,
}) => {
  if (!theme) return null;

  const isPositiveTrend = theme.trend > 0;
  const relatedReviews = mockReviewsList.filter((r) => r.theme === theme.name);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={theme.name}
      subtitle={`Theme Rank #${theme.rank} • ${theme.percentage}% Share of Feedback`}
      width="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-slate-500 text-[11px]">Total reviews</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{theme.reviewCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-slate-500 text-[11px]">Severity level</p>
            <div className="mt-1.5">
              <SeverityBadge severity={theme.severity} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-slate-500 text-[11px]">Weekly trend</p>
            <p
              className={`text-sm font-bold mt-1 inline-flex items-center gap-0.5 ${
                isPositiveTrend ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isPositiveTrend ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              {Math.abs(theme.trend)}%
            </p>
          </div>
        </div>

        {theme.description && (
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
              Overview
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{theme.description}</p>
          </div>
        )}

        {theme.commonComplaints && theme.commonComplaints.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Common Complaint Patterns
              </h4>
            </div>
            <div className="space-y-2">
              {theme.commonComplaints.map((complaint, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs text-slate-800 font-medium"
                >
                  {complaint}
                </div>
              ))}
            </div>
          </div>
        )}

        {theme.relatedActions && theme.relatedActions.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recommended Action Ideas
              </h4>
            </div>
            <div className="space-y-2">
              {theme.relatedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60 text-xs text-emerald-950 font-medium flex items-start gap-2.5"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sample User Feedback ({relatedReviews.length})
            </h4>
          </div>
          <div className="space-y-2">
            {relatedReviews.slice(0, 3).map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectReview?.(r.id)}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer text-xs group"
              >
                <p className="text-slate-800 font-medium leading-relaxed group-hover:text-emerald-800 transition-colors">
                  "{r.text}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>{r.source} • {r.rating}★</span>
                  <span>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
