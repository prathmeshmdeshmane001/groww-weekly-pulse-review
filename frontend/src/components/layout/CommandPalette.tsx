import React, { useState, useEffect } from 'react';
import { Search, Layers, MessageSquare, ArrowRight, X } from 'lucide-react';
import type { NavRoute } from './Sidebar';
import { mockThemes, mockReviewsList } from '../../data/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: NavRoute) => void;
  onSelectReview: (id: string) => void;
  onSelectTheme: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectReview,
  onSelectTheme,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredThemes = mockThemes.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredReviews = mockReviewsList.filter(
    (r) =>
      r.text.toLowerCase().includes(query.toLowerCase()) ||
      (r.title && r.title.toLowerCase().includes(query.toLowerCase())) ||
      r.theme.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      <div className="relative mx-auto max-w-xl transform rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all overflow-hidden">
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-3 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder="Type a command, theme, or search feedback..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Page Navigation */}
          {!query && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Navigation
              </p>
              <div className="space-y-0.5">
                {[
                  { route: 'overview' as NavRoute, label: 'Overview Dashboard' },
                  { route: 'pulses' as NavRoute, label: 'Weekly Pulses History' },
                  { route: 'reviews' as NavRoute, label: 'Browse All Reviews' },
                  { route: 'themes' as NavRoute, label: 'Theme Intelligence' },
                ].map((item) => (
                  <button
                    key={item.route}
                    onClick={() => {
                      onNavigate(item.route);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left"
                  >
                    <span className="font-medium">{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Themes Matches */}
          {filteredThemes.length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Themes ({filteredThemes.length})
              </p>
              <div className="space-y-0.5">
                {filteredThemes.slice(0, 4).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">{theme.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{theme.reviewCount} reviews</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Matches */}
          {filteredReviews.length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Reviews ({filteredReviews.length})
              </p>
              <div className="space-y-0.5">
                {filteredReviews.slice(0, 3).map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => {
                      onSelectReview(rev.id);
                      onClose();
                    }}
                    className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-800 font-medium truncate">{rev.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rev.theme} • {rev.source}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredThemes.length === 0 && filteredReviews.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching feedback or themes found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search Groww reviews & AI themes</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC to close</kbd>
        </div>
      </div>
    </div>
  );
};
