import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import type { Theme } from '../../types';
import { SeverityBadge } from '../ui/Badge';

interface TopThemesTableProps {
  themes: Theme[];
  onSelectTheme: (id: string) => void;
  onViewAll: () => void;
}

export const TopThemesTable: React.FC<TopThemesTableProps> = ({
  themes,
  onSelectTheme,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Top themes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The issues appearing most frequently in this week's feedback.
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

        {/* Table / List */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                <th className="pb-2 pl-1 w-6">#</th>
                <th className="pb-2">Theme</th>
                <th className="pb-2 min-w-[130px]">Share of reviews</th>
                <th className="pb-2 text-center">Trend</th>
                <th className="pb-2 text-right pr-1">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {themes.slice(0, 5).map((theme, idx) => {
                const isPositiveTrend = theme.trend > 0;
                return (
                  <tr
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 pl-1 font-semibold text-slate-400 group-hover:text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-3 pr-2">
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {theme.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{theme.reviewCount} reviews</p>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-slate-700 min-w-[28px]">
                          {theme.percentage}%
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden max-w-[80px]">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, theme.percentage * 2)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          isPositiveTrend ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isPositiveTrend ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {Math.abs(theme.trend)}%
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <SeverityBadge severity={theme.severity} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
