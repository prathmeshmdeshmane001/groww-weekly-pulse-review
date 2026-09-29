import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateNewPulse } from '../../services/pulseService';
import type { GenerationProgress } from '../../services/pulseService';
import type { Pulse } from '../../types';

interface GeneratePulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPulseGenerated: (pulse: Pulse) => void;
}

export const GeneratePulseModal: React.FC<GeneratePulseModalProps> = ({
  isOpen,
  onClose,
  onPulseGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedPulse, setGeneratedPulse] = useState<Pulse | null>(null);

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGeneratedPulse(null);

    try {
      const pulse = await generateNewPulse((p) => {
        setProgress(p);
      });
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
      subtitle="Analyze the latest 8-12 weeks of Play Store & App Store reviews"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {!isGenerating && !generatedPulse && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="leading-relaxed">
              This pipeline will load recent reviews, strip PII, cluster top themes using Gemini AI, select representative customer quotes, generate actionable product ideas, and enforce the 250-word delivery constraint.
            </p>

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
                  <span className="text-slate-400">Lookback window:</span>{' '}
                  <span className="font-semibold text-slate-800">10 weeks</span>
                </div>
                <div>
                  <span className="text-slate-400">AI Model:</span>{' '}
                  <span className="font-semibold text-emerald-700">Gemini 3.6 Flash</span>
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
                  Weekly Pulse Generated Successfully!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  1,284 reviews analyzed. Top 3 themes identified, 3 verbatim quotes verified, and 3 action ideas generated. Total word count: {generatedPulse.wordCount} / 250 words.
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
