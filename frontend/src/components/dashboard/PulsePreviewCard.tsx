import React, { useState } from 'react';
import { FileText, Mail, CheckCircle2, ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';
import type { Pulse } from '../../types';
import { Button } from '../ui/Button';
import { publishPulseToGoogleDocs, createGmailDraft } from '../../services/publishingService';

interface PulsePreviewCardProps {
  pulse: Pulse;
  onViewFullPulse: () => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string; actionText?: string; actionUrl?: string }) => void;
}

export const PulsePreviewCard: React.FC<PulsePreviewCardProps> = ({
  pulse,
  onViewFullPulse,
  onShowToast,
}) => {
  const [docsState, setDocsState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [gmailState, setGmailState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [docUrl, setDocUrl] = useState<string>(pulse.docUrl || '');

  const wordPercent = Math.min(100, Math.round((pulse.wordCount / pulse.maxWords) * 100));

  const handlePublishDocs = async () => {
    try {
      setDocsState('loading');
      const res = await publishPulseToGoogleDocs(pulse);
      if (res.success && res.docUrl) {
        setDocUrl(res.docUrl);
        setDocsState('success');
        onShowToast({
          type: 'success',
          title: 'Published to Google Docs',
          message: 'Weekly Pulse document has been created and synced with latest themes.',
          actionText: 'Open Google Doc',
          actionUrl: res.docUrl,
        });
      }
    } catch {
      setDocsState('idle');
      onShowToast({
        type: 'error',
        title: 'Publishing Failed',
        message: 'Could not connect to Google Docs MCP server. Please retry.',
      });
    }
  };

  const handleCreateDraft = async () => {
    try {
      setGmailState('loading');
      const res = await createGmailDraft(pulse, docUrl || pulse.docUrl || '');
      if (res.success && res.draftId) {
        setGmailState('success');
        onShowToast({
          type: 'success',
          title: 'Gmail Draft Created',
          message: 'Executive summary draft ready in your Gmail Drafts folder.',
          actionText: 'Open Gmail',
          actionUrl: 'https://mail.google.com',
        });
      }
    } catch {
      setGmailState('idle');
      onShowToast({
        type: 'error',
        title: 'Gmail Draft Failed',
        message: 'Could not connect to Gmail MCP server. Please check MCP status.',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Weekly Pulse</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{pulse.weekLabel}</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pulse.status}
          </span>
        </div>

        {/* Deliverable Summary Description */}
        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          A concise summary of what Groww users are saying this week, with key themes, real user quotes, and prioritized action ideas.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          {docsState === 'success' ? (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100/70 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Published to Google Docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            </a>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center text-xs sm:text-sm py-2.5"
              leftIcon={<FileText className="w-4 h-4" />}
              isLoading={docsState === 'loading'}
              onClick={handlePublishDocs}
            >
              Publish to Google Docs
            </Button>
          )}

          {gmailState === 'success' ? (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gmail Draft Created</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </a>
          ) : (
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center text-xs sm:text-sm py-2.5"
              leftIcon={<Mail className="w-4 h-4 text-slate-600" />}
              isLoading={gmailState === 'loading'}
              onClick={handleCreateDraft}
            >
              Create Gmail Draft
            </Button>
          )}
        </div>

        {/* Word Count Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {pulse.wordCount} / {pulse.maxWords} words
            </span>
            <span className="text-slate-400 font-medium">{wordPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pulse.wordCount <= pulse.maxWords ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${wordPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div
        onClick={onViewFullPulse}
        className="p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 flex items-center justify-between cursor-pointer transition-colors group mt-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">
            From feedback to a better Groww. Every week.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
};
