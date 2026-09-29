import React from 'react';
import type { SeverityType, SentimentType, SourceType } from '../../types';

interface SeverityBadgeProps {
  severity: SeverityType;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const styles: Record<SeverityType, string> = {
    High: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10',
    Medium: 'bg-amber-50 text-amber-800 border-amber-200/80 ring-1 ring-amber-500/10',
    Low: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 ring-1 ring-emerald-500/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[severity]} ${className}`}
    >
      {severity}
    </span>
  );
};

interface SentimentBadgeProps {
  sentiment: SentimentType;
  className?: string;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, className = '' }) => {
  const styles: Record<SentimentType, string> = {
    Positive: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    Neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-500/10',
    Negative: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[sentiment]} ${className}`}
    >
      {sentiment}
    </span>
  );
};

interface SourceBadgeProps {
  source: SourceType;
  showIcon?: boolean;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, showIcon = true, className = '' }) => {
  const isPlay = source === 'Play Store';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200/70 ${className}`}
    >
      {showIcon && (
        isPlay ? (
          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a1.993 1.993 0 0 1-.61-1.424V3.238c0-.555.228-1.057.609-1.424zM15.207 13.414l2.57 2.57-13.064 7.545 10.494-10.115zm0-2.828L4.713.471 17.777 8.016l-2.57 2.57zm1.414 1.414l3.774-2.18c.883-.51.883-1.344 0-1.854l-3.774-2.18 2.213 2.213a1.5 1.5 0 0 1 0 2.122l-2.213 2.213z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-slate-800 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-1.02.04-2.25.68-2.91 1.45-.58.67-1.09 1.74-.95 2.78 1.14.09 2.24-.61 2.85-1.36z"/>
          </svg>
        )
      )}
      {source}
    </span>
  );
};
