import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

export const TopQuoteBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-emerald-100/40 p-5 border border-emerald-100/80 flex items-center justify-between min-h-[90px]">
      <div className="relative z-10 max-w-sm">
        <p className="text-xs sm:text-sm italic font-medium text-slate-700 leading-snug">
          “Listen to your users. They show you the product’s future.”
        </p>
      </div>

      <div className="relative z-10 text-right shrink-0">
        <p className="text-xs font-bold text-emerald-800 tracking-tight">
          Build for what’s next.
        </p>
      </div>

      {/* Decorative mountain background */}
      <div className="absolute right-12 bottom-0 opacity-40 pointer-events-none">
        <svg className="w-48 h-20 text-emerald-400" viewBox="0 0 200 80" fill="currentColor">
          <path d="M20 80 L80 20 L130 55 L165 15 L200 80 Z" opacity="0.6" />
          <path d="M70 80 L115 25 L150 60 L180 30 L200 80 Z" opacity="0.9" fill="#00D09C" />
        </svg>
      </div>
    </div>
  );
};

export const BottomImpactBanner: React.FC<{ onAction?: () => void }> = ({ onAction }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-100/50 p-4 sm:p-5 border border-emerald-200/70 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-xs flex items-center justify-center shrink-0 border border-emerald-100">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            Same feedback. A better product tomorrow.
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Turn insights into impact.
          </p>
        </div>
      </div>

      {/* Action button & Mountain decoration */}
      <div className="flex items-center gap-6 relative z-10">
        <div className="hidden md:block opacity-40">
          <svg className="w-40 h-10 text-emerald-400" viewBox="0 0 160 40" fill="currentColor">
            <path d="M0 40 L40 10 L80 30 L120 5 L160 40 Z" opacity="0.5" />
            <path d="M30 40 L70 12 L110 28 L140 15 L160 40 Z" opacity="0.8" fill="#00B386" />
          </svg>
        </div>

        <button
          onClick={onAction}
          className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 shadow-xs border border-slate-200 flex items-center justify-center transition-all group"
          aria-label="View insights"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
