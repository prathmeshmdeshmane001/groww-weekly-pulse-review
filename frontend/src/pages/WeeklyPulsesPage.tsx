import React, { useState } from 'react';
import { Calendar, Plus, Search, ExternalLink, Eye } from 'lucide-react';
import type { HistoricalPulseItem } from '../types';
import { Button } from '../components/ui/Button';

interface WeeklyPulsesPageProps {
  pulses: HistoricalPulseItem[];
  onSelectPulse: (id: string) => void;
  onOpenGenerateModal: () => void;
}

export const WeeklyPulsesPage: React.FC<WeeklyPulsesPageProps> = ({
  pulses,
  onSelectPulse,
  onOpenGenerateModal,
}) => {
  const [search, setSearch] = useState('');

  const filteredPulses = pulses.filter(
    (p) =>
      p.week.toLowerCase().includes(search.toLowerCase()) ||
      p.topTheme.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Weekly Pulses</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historical archive of AI-generated customer feedback pulses and Google Docs deliverables.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenGenerateModal}
        >
          Generate New Pulse
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by week or top theme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredPulses.length}</span> weekly reports
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 border-b border-slate-200/80">
                <th className="py-3 px-4">Week Period</th>
                <th className="py-3 px-4">Reviews Analyzed</th>
                <th className="py-3 px-4">Dominant Theme</th>
                <th className="py-3 px-4 text-center">Sentiment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPulses.map((pulse) => (
                <tr
                  key={pulse.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {pulse.week}
                        </p>
                        <p className="text-[11px] text-slate-400">{pulse.dateRange}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    <span className="font-semibold text-slate-800">{pulse.reviews.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px] block">App & Play Store</span>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                      {pulse.topTheme}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pulse.sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pulse.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {pulse.sentiment}
                    </span>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        pulse.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pulse.status === 'Published' ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                      />
                      {pulse.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-slate-500 whitespace-nowrap" onClick={() => onSelectPulse(pulse.id)}>
                    {pulse.publishedDate}
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectPulse(pulse.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200/80 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        title="View pulse detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <a
                        href={pulse.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200/80 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        title="Open in Google Docs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Doc</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
