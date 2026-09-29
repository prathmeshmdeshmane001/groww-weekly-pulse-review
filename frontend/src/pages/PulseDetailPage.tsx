import React, { useState } from 'react';
import {
  FileText,
  Mail,
  ShieldCheck,
  Star,
  ArrowLeft,
  Copy,
  Check,
  Layers,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import type { Pulse } from '../types';
import { Button } from '../components/ui/Button';
import { SeverityBadge, SourceBadge } from '../components/ui/Badge';
import { publishPulseToGoogleDocs, createGmailDraft } from '../services/publishingService';

interface PulseDetailPageProps {
  pulse: Pulse;
  onBack: () => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string; actionText?: string; actionUrl?: string }) => void;
}

export const PulseDetailPage: React.FC<PulseDetailPageProps> = ({
  pulse,
  onBack,
  onShowToast,
}) => {
  const [docsLoading, setDocsLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const wordPercent = Math.min(100, Math.round((pulse.wordCount / pulse.maxWords) * 100));

  const handlePublishDocs = async () => {
    try {
      setDocsLoading(true);
      const res = await publishPulseToGoogleDocs(pulse);
      if (res.success && res.docUrl) {
        onShowToast({
          type: 'success',
          title: 'Published to Google Docs',
          message: 'Weekly Pulse deliverable document is live (Markdown copied to clipboard).',
          actionText: 'Open Document',
          actionUrl: res.docUrl,
        });
      }
    } finally {
      setDocsLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    try {
      setGmailLoading(true);
      const res = await createGmailDraft(pulse, pulse.docUrl || '');
      if (res.success) {
        onShowToast({
          type: 'success',
          title: 'Gmail Draft Created',
          message: 'Weekly Pulse ready in your Gmail compose window.',
          actionText: 'Open Gmail',
          actionUrl: res.gmailUrl || 'https://mail.google.com',
        });
      }
    } finally {
      setGmailLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `# Weekly Pulse — Groww App | ${pulse.weekLabel}

## 1. Top Themes
${pulse.themes.map((t, idx) => `0${idx + 1} ${t.name} (${t.percentage}% of reviews)`).join('\n')}

## 2. User Voice
${pulse.quotes.map((q) => `> "${q.text}"\n> — ${q.rating}★ (${q.source})`).join('\n\n')}

## 3. Prioritized Action Ideas
${pulse.actionIdeas.map((a, idx) => `${idx + 1}. ${a}`).join('\n')}

---
Generated from ${pulse.reviewCount.toLocaleString()} reviews (App Store + Play Store) | Word Count: ${pulse.wordCount}/${pulse.maxWords}
`;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Weekly Pulse</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {pulse.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-500 mt-1">{pulse.weekLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyMarkdown}
            >
              {copiedMd ? 'Copied' : 'Copy MD'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Mail className="w-3.5 h-3.5 text-slate-600" />}
              isLoading={gmailLoading}
              onClick={handleCreateDraft}
            >
              Gmail Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              isLoading={docsLoading}
              onClick={handlePublishDocs}
            >
              Publish to Google Docs
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-700 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Word Constraint: {pulse.wordCount} / {pulse.maxWords} words
              </p>
              <p className="text-[11px] text-slate-500">
                Strict ≤250 word limit enforced for high executive readability.
              </p>
            </div>
          </div>
          <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pulse.wordCount <= pulse.maxWords ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${wordPercent}%` }}
            />
          </div>
        </div>

        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              01 Top Themes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {pulse.themes.map((theme, idx) => (
              <div
                key={theme.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-extrabold text-slate-400 text-[11px]">0{idx + 1}</span>
                  <SeverityBadge severity={theme.severity} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{theme.name}</h3>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>{theme.reviewCount} reviews</span>
                  <span className="font-semibold text-slate-700">{theme.percentage}% share</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                02 User Voice (Verbatim Quotes)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Sourced from reviews • NOT AI generated
            </span>
          </div>

          <div className="space-y-3">
            {pulse.quotes.map((quote) => (
              <div
                key={quote.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
              >
                <p className="text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed">
                  "{quote.text}"
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < quote.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <SourceBadge source={quote.source} />
                    <span className="text-slate-400 text-[11px]">• {quote.theme}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> PII Stripped
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              03 Prioritized Action Ideas
            </h2>
          </div>

          <div className="space-y-2.5">
            {pulse.actionIdeas.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                  {action}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Generated from <span className="font-semibold text-slate-700">{pulse.reviewCount.toLocaleString()} reviews</span> (App Store + Play Store)
          </p>
          <p>Strictly compliant with Google Docs & Gmail MCP publishing schema.</p>
        </div>
      </div>
    </div>
  );
};
