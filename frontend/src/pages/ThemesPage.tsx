import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ChevronRight, PieChart } from 'lucide-react';
import type { Theme } from '../types';
import { SeverityBadge } from '../components/ui/Badge';

interface ThemesPageProps {
  themes: Theme[];
  onSelectTheme: (id: string) => void;
}

export const ThemesPage: React.FC<ThemesPageProps> = ({ themes, onSelectTheme }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const filteredThemes = themes.filter((t) => {
    if (selectedSeverity !== 'all' && t.severity !== selectedSeverity) return false;
    return true;
  });

  const totalReviews = themes.reduce((acc, t) => acc + t.reviewCount, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Theme Intelligence</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            AI-detected customer feedback clusters categorized by severity, frequency, and weekly velocity.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {['all', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSeverity === sev
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sev === 'all' ? 'All Severities' : sev}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Theme Distribution Breakdown</h3>
          </div>
          <span className="text-slate-500 font-medium">
            Total feedback clustered: <strong className="text-slate-800">{totalReviews.toLocaleString()}</strong> reviews
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-xl h-4 overflow-hidden flex shadow-inner">
          {themes.map((t, idx) => {
            const colors = [
              'bg-emerald-500',
              'bg-teal-500',
              'bg-cyan-500',
              'bg-indigo-400',
              'bg-slate-400',
            ];
            return (
              <div
                key={t.id}
                style={{ width: `${t.percentage}%` }}
                className={`${colors[idx % colors.length]} h-full hover:opacity-90 transition-opacity cursor-pointer`}
                title={`${t.name}: ${t.percentage}% (${t.reviewCount} reviews)`}
                onClick={() => onSelectTheme(t.id)}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
          {themes.map((t, idx) => {
            const colors = [
              'bg-emerald-500',
              'bg-teal-500',
              'bg-cyan-500',
              'bg-indigo-400',
              'bg-slate-400',
            ];
            return (
              <div
                key={t.id}
                className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700"
                onClick={() => onSelectTheme(t.id)}
              >
                <span className={`w-2.5 h-2.5 rounded-sm ${colors[idx % colors.length]}`} />
                <span className="font-semibold text-slate-700">{t.name}</span>
                <span className="text-slate-400 text-[11px]">({t.percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredThemes.map((theme) => {
          const isPositiveTrend = theme.trend > 0;
          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                      #{theme.rank}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {theme.name}
                    </h3>
                  </div>
                  <SeverityBadge severity={theme.severity} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {theme.description || 'Customer sentiment and issue distribution clustered from feedback.'}
                </p>

                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Share of feedback</span>
                    <span className="font-bold text-slate-800">{theme.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, theme.percentage * 2.2)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {theme.reviewCount.toLocaleString()} reviews
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold ${
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
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
