import React from 'react';
import { Star, ShieldCheck, Copy, Check } from 'lucide-react';
import type { Review } from '../../types';
import { Drawer } from '../ui/Drawer';
import { SentimentBadge, SourceBadge } from '../ui/Badge';

interface ReviewDrawerProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({ review, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!review) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(review.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Review details"
      subtitle={`Feedback ID: ${review.id}`}
      width="md"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-medium">Customer rating</p>
            <div className="flex items-center gap-1 mt-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-4 h-4 ${
                    idx < review.rating
                      ? review.rating <= 2
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-800 ml-1.5">{review.rating} / 5</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Recorded date</p>
            <p className="text-xs font-semibold text-slate-900 mt-1">{review.date}</p>
          </div>
        </div>

        <div className="space-y-2">
          {review.title && (
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{review.title}</h4>
          )}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs relative group">
            <p className="text-sm text-slate-800 leading-relaxed font-normal">{review.text}</p>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Copy review text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-slate-500 text-[11px] font-medium">Source store</p>
            <div className="mt-1.5">
              <SourceBadge source={review.source} />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-slate-500 text-[11px] font-medium">Sentiment analysis</p>
            <div className="mt-1.5">
              <SentimentBadge sentiment={review.sentiment} />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 col-span-2">
            <p className="text-slate-500 text-[11px] font-medium">Detected AI theme cluster</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{review.theme}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-900">Privacy & PII Protected</p>
            <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
              Reviewer names, emails, user IDs, and contact info are stripped during ingestion.
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
