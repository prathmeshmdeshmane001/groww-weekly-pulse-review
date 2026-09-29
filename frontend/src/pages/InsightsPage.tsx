import React from 'react';
import { TrendingUp, Award, AlertTriangle } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Insights</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Macro feedback trends, feature satisfaction scores, and resolution velocity across app versions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Top Praised Feature</h3>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-3">Clean User Interface</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Mentioned positively in over 340 reviews this cycle. Users highlight fast mutual fund search and watchlist layouts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Highest Severity Friction</h3>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-3">Aadhaar OTP Failures</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Responsible for 64% of 1-star onboarding reviews. Users experience timeout delays during UIDAI gateway peaks.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-teal-600">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Fastest Improving Theme</h3>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-3">App Performance</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Complaints decreased by 8% following recent Android chart rendering optimizations and memory profile fixes.
          </p>
        </div>
      </div>
    </div>
  );
};
