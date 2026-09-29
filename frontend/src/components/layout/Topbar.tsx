import { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ChevronDown, Menu, Download, Check, CalendarDays } from 'lucide-react';
import type { SourceType } from '../../types';
import { getInitials } from '../profile/ProfileModal';
import type { UserProfile } from '../profile/ProfileModal';
import { DATE_PRESETS } from '../../utils/analytics';
import type { DateRangeFilter } from '../../utils/analytics';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  dateFilter: DateRangeFilter;
  onChangeDateFilter: (filter: DateRangeFilter) => void;
  selectedSource: SourceType | 'All Sources';
  onSelectSource: (source: SourceType | 'All Sources') => void;
  userProfile: UserProfile;
  onOpenProfileModal: () => void;
  onOpenDownloadModal: () => void;
  totalFilteredCount: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  onOpenCommandPalette,
  dateFilter,
  onChangeDateFilter,
  selectedSource,
  onSelectSource,
  userProfile,
  onOpenProfileModal,
  onOpenDownloadModal,
  totalFilteredCount,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>('2026-07-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-15');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: typeof DATE_PRESETS[number]) => {
    if (preset.id === 'custom') {
      return; // keep open to edit custom dates
    }
    onChangeDateFilter({
      type: preset.id,
      label: preset.label,
    });
    setIsDatePickerOpen(false);
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    onChangeDateFilter({
      type: 'custom',
      label: `${customStart} to ${customEnd}`,
      startDate: new Date(customStart),
      endDate: new Date(customEnd),
    });
    setIsDatePickerOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span className="text-slate-500 group-hover:text-slate-700 text-xs sm:text-sm">
              Search reviews, themes, or keywords...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Open-ended Dynamic Date Selector Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDatePickerOpen((prev: boolean) => !prev)}
            aria-expanded={isDatePickerOpen}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200/90 rounded-xl pl-3 pr-3 py-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
              {dateFilter.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isDatePickerOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <span>Select Date Range</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {totalFilteredCount.toLocaleString()} reviews
                </span>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Preset Horizons
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {DATE_PRESETS.filter((p) => p.id !== 'custom').map((preset) => {
                    const isSelected = dateFilter.type === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Open-ended Custom Date Range */}
              <form onSubmit={handleApplyCustomRange} className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Open-Ended Custom Window
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeDateFilter({ type: 'all', label: 'All Time (Full Dataset)' });
                      setIsDatePickerOpen(false);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Reset to All
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Source Dropdown */}
        <div className="relative group hidden md:block">
          <select
            value={selectedSource}
            onChange={(e) => onSelectSource(e.target.value as SourceType | 'All Sources')}
            aria-label="Select review source"
            className="appearance-none bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200/90 rounded-xl pl-8 pr-8 py-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All Sources">All Sources</option>
            <option value="Play Store">Play Store</option>
            <option value="App Store">App Store</option>
          </select>
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10M7 12h10M7 17h10" />
          </svg>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Download More Reviews Trigger Button */}
        <button
          onClick={onOpenDownloadModal}
          title="Download more reviews from Google Play & App Store"
          className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Download Reviews</span>
        </button>

        {/* User avatar pill - Clickable to open profile settings */}
        <button
          onClick={onOpenProfileModal}
          title={`Signed in as ${userProfile.name} (${userProfile.email})`}
          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-xs transition-colors cursor-pointer"
        >
          {getInitials(userProfile.name)}
        </button>
      </div>
    </header>
  );
};
