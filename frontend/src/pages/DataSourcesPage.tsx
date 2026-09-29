import React from 'react';
import { CheckCircle2, RefreshCw, Smartphone, Apple, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DataSourcesPage: React.FC = () => {
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1200);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Data Sources</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure App Store and Google Play Store review ingestion connectors and lookback intervals.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />}
          onClick={handleSync}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Play Store</h3>
                <p className="text-[11px] text-slate-400">Package: com.nextbillion.groww</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Ingested Reviews:</span>
              <strong className="text-slate-900">793 reviews (last 10w)</strong>
            </div>
            <div className="flex justify-between">
              <span>Average Rating:</span>
              <strong className="text-slate-900">4.2 ★</strong>
            </div>
            <div className="flex justify-between">
              <span>Last Ingestion:</span>
              <span className="text-slate-500">Today, 00:30 AM</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Apple App Store</h3>
                <p className="text-[11px] text-slate-400">App ID: 1404871703 (Groww iOS)</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Ingested Reviews:</span>
              <strong className="text-slate-900">491 reviews (last 10w)</strong>
            </div>
            <div className="flex justify-between">
              <span>Average Rating:</span>
              <strong className="text-slate-900">3.9 ★</strong>
            </div>
            <div className="flex justify-between">
              <span>Last Ingestion:</span>
              <span className="text-slate-500">Today, 00:30 AM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-emerald-950 text-sm">Privacy by Design</h4>
          <p className="text-emerald-800 leading-relaxed">
            All user names, emails, device IDs, and contact numbers are sanitized and stripped via regex redaction before reviews enter the Gemini LLM clustering pipeline or weekly pulse documents.
          </p>
        </div>
      </div>
    </div>
  );
};
