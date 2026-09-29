import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateNewPulse, resolveWindowBounds } from '../../services/pulseService';
import type { GenerationProgress, PulseWindowOption } from '../../services/pulseService';
import type { Pulse, Review } from '../../types';
import { mockReviewsList } from '../../data/mockData';

interface GeneratePulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPulseGenerated: (pulse: Pulse) => void;
  reviews?: Review[];
  onLiveReviewsMerged?: (mergedReviews: Review[]) => void;
}

const WINDOW_OPTIONS: { id: PulseWindowOption; title: string; subtitle: string }[] = [
  { id: 'current_week', title: 'Current Week', subtitle: 'Latest 7 days of reviews' },
  { id: 'prev_week', title: 'Previous Week', subtitle: '7–14 days ago' },
  { id: '14d', title: 'Last 14 Days', subtitle: 'Bi-weekly rolling window' },
  { id: '30d', title: 'Last 30 Days', subtitle: 'Monthly rolling window' },
  { id: '60d', title: 'Last 60 Days', subtitle: '2-month rolling window' },
  { id: 'all', title: 'All Ingested Reviews', subtitle: 'Complete 10-week dataset' },
];

export const GeneratePulseModal: React.FC<GeneratePulseModalProps> = ({
  isOpen,
  onClose,
  onPulseGenerated,
  reviews = mockReviewsList,
  onLiveReviewsMerged,
}) => {
  const [selectedWindow, setSelectedWindow] = useState<PulseWindowOption>('current_week');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedPulse, setGeneratedPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setProgress(null);
      setGeneratedPulse(null);
    }
  }, [isOpen]);

  const previewWindow = useMemo(
    () => resolveWindowBounds(reviews, selectedWindow),
    [reviews, selectedWindow]
  );

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGeneratedPulse(null);

    try {
      const pulse = await generateNewPulse(
        (p) => {
          setProgress(p);
        },
        reviews,
        selectedWindow,
        onLiveReviewsMerged
      );
      setGeneratedPulse(pulse);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (generatedPulse) {
      onPulseGenerated(generatedPulse);
      onClose();
    }
  };

  const steps = [
    { id: 'ingestion', label: '1. Ingest & sanitize app store reviews' },
    { id: 'clustering', label: '2. Cluster themes with Gemini AI' },
    { id: 'ranking', label: '3. Rank themes & select verbatim quotes' },
    { id: 'assembly', label: '4. Validate constraints (≤250 words)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isGenerating ? () => {} : onClose}
      title="Generate Weekly Pulse"
      subtitle="Select a review window to cluster themes, extract quotes, and generate an executive pulse"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {!isGenerating && !generatedPulse && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="leading-relaxed">
              This pipeline loads reviews from the selected period, strips PII, clusters top themes using Gemini AI, selects representative verbatim quotes, and enforces the 250-word delivery constraint.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Select Analysis Period
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WINDOW_OPTIONS.map((opt) => {
                  const isSelected = selectedWindow === opt.id;
                  const bounds = resolveWindowBounds(reviews, opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedWindow(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{opt.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {bounds.filtered.length.toLocaleString()} reviews • {bounds.label.split(' (')[0]}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Pipeline parameters
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Sources:</span>{' '}
                  <span className="font-semibold text-slate-800">Play Store, App Store</span>
                </div>
                <div>
                  <span className="text-slate-400">Selected window:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {previewWindow.filtered.length.toLocaleString()} reviews
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">AI Model:</span>{' '}
                  <span className="font-semibold text-emerald-700">Gemini 2.5 Flash</span>
                </div>
                <div>
                  <span className="text-slate-400">Constraint:</span>{' '}
                  <span className="font-semibold text-slate-800">Max 250 words</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleStartGeneration}
              >
                Start AI Analysis
              </Button>
            </div>
          </div>
        )}

        {isGenerating && progress && (
          <div className="py-4 space-y-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                {progress.message}
              </span>
              <span>{progress.progressPercent}%</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>

            <div className="space-y-2 pt-2 text-xs">
              {steps.map((s, idx) => {
                const currentStepIdx =
                  progress.step === 'ingestion'
                    ? 0
                    : progress.step === 'clustering'
                    ? 1
                    : progress.step === 'ranking'
                    ? 2
                    : 3;
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {generatedPulse && !isGenerating && (
          <div className="py-2 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Weekly Pulse Generated Successfully! ({generatedPulse.weekLabel})
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  {generatedPulse.reviewCount.toLocaleString()} reviews analyzed ({generatedPulse.weekStart} to {generatedPulse.weekEnd}). Top theme: <strong>{generatedPulse.themes[0]?.name}</strong>. Total word count: {generatedPulse.wordCount} / 250 words.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleComplete}
              >
                View Generated Pulse
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
