import React from 'react';
import { FileText, Star, Frown, LayoutGrid, ArrowUp, ArrowDown } from 'lucide-react';
import type { Metric } from '../../types';

interface MetricCardProps {
  metric: Metric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getIcon = () => {
    switch (metric.id) {
      case 'reviews':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'rating':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/60">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
        );
      case 'negative':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/60">
            <Frown className="w-5 h-5" />
          </div>
        );
      case 'themes':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/60">
            <LayoutGrid className="w-5 h-5" />
          </div>
        );
    }
  };

  const isGood = metric.trendIsGood;
  const isUp = metric.trendDirection === 'up';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-subtle transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {metric.value}
            </h3>
          </div>
        </div>

        <div className="flex items-end gap-1 h-8 pt-1">
          {metric.sparkline.map((height, idx) => {
            const barColor =
              metric.id === 'negative'
                ? 'bg-rose-300'
                : 'bg-emerald-300';
            return (
              <div
                key={idx}
                className={`w-1 rounded-xs transition-all duration-300 ${barColor}`}
                style={{ height: `${Math.max(15, height * 0.28)}px` }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs">
        <span
          className={`inline-flex items-center font-semibold gap-0.5 ${
            isGood ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          {metric.change}
        </span>
        <span className="text-slate-400">{metric.changeText}</span>
      </div>
    </div>
  );
};
