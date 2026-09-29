import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquareQuote,
  Layers,
  TrendingUp,
  FileText,
  Database,
  Settings,
  ChevronRight
} from 'lucide-react';
import { getInitials } from '../profile/ProfileModal';
import type { UserProfile } from '../profile/ProfileModal';

export type NavRoute =
  | 'overview'
  | 'pulses'
  | 'reviews'
  | 'themes'
  | 'insights'
  | 'reports'
  | 'datasources'
  | 'settings';

interface SidebarProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userProfile: UserProfile;
  onOpenProfileModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
  userProfile,
  onOpenProfileModal,
}) => {
  const mainNavItems = [
    { id: 'overview' as NavRoute, label: 'Overview', icon: LayoutDashboard },
    { id: 'pulses' as NavRoute, label: 'Weekly Pulses', icon: CalendarDays },
    { id: 'reviews' as NavRoute, label: 'Reviews', icon: MessageSquareQuote },
    { id: 'themes' as NavRoute, label: 'Themes', icon: Layers },
    { id: 'insights' as NavRoute, label: 'Insights', icon: TrendingUp },
    { id: 'reports' as NavRoute, label: 'Reports', icon: FileText },
  ];

  const workspaceNavItems = [
    { id: 'datasources' as NavRoute, label: 'Data Sources', icon: Database },
    { id: 'settings' as NavRoute, label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (route: NavRoute) => {
    onNavigate(route);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-250 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header & Logo */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.5c4-5 8-5 12 0c2 2.5 4 2.5 4 0" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-tight tracking-tight">Groww</h1>
              <p className="text-[11px] font-medium text-slate-500">Customer Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3.5 space-y-6 flex-1 py-2">
            {/* Main Nav */}
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Workspace Header */}
            <div>
              <p className="px-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                Workspace
              </p>
              <div className="space-y-1">
                {workspaceNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Callout Promo Banner */}
          <div className="px-4 py-3">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-emerald-50/70 to-teal-50/40 p-4 border border-emerald-100/80">
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                Turn user feedback into product action
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Real insights. Happier users. A better Groww.
              </p>
              <div className="mt-3 flex justify-end opacity-70">
                <svg className="w-20 h-6 text-emerald-300" viewBox="0 0 100 30" fill="currentColor">
                  <path d="M0 30 L25 12 L50 22 L75 5 L100 30 Z" opacity="0.4" />
                  <path d="M15 30 L45 8 L70 20 L85 10 L100 30 Z" opacity="0.7" />
                </svg>
              </div>
            </div>
          </div>

          {/* User Profile - Clickable to edit */}
          <div className="p-4 border-t border-slate-200/80">
            <button
              onClick={onOpenProfileModal}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {getInitials(userProfile.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{userProfile.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userProfile.email}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
