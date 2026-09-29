import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import type { NavRoute } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/ui/Toast';
import type { ToastMessage } from './components/ui/Toast';

import { OverviewPage } from './pages/OverviewPage';
import { WeeklyPulsesPage } from './pages/WeeklyPulsesPage';
import { PulseDetailPage } from './pages/PulseDetailPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ThemesPage } from './pages/ThemesPage';
import { InsightsPage } from './pages/InsightsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SettingsPage } from './pages/SettingsPage';

import { ReviewDrawer } from './components/reviews/ReviewDrawer';
import { ThemeDrawer } from './components/themes/ThemeDrawer';
import { GeneratePulseModal } from './components/pulse/GeneratePulseModal';
import { DownloadReviewsModal } from './components/pulse/DownloadReviewsModal';
import { OnboardingModal, ProfileModal } from './components/profile/ProfileModal';
import type { UserProfile } from './components/profile/ProfileModal';

import {
  mockCurrentPulse,
  mockHistoricalPulses,
  mockReviewsList,
} from './data/mockData';
import { filterReviews, computeFilteredAnalytics } from './utils/analytics';
import type { DateRangeFilter } from './utils/analytics';
import {
  fetchLiveReviewsFromStores,
  mergeDeduplicatedReviews,
} from './services/pulseService';
import type { Pulse, HistoricalPulseItem, Review, Theme, SourceType } from './types';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('overview');

  // Open-ended dynamic Date Filter & Source Filter
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    type: 'all',
    label: 'All Time (Full Dataset)',
  });
  const [selectedSource, setSelectedSource] = useState<SourceType | 'All Sources'>('All Sources');

  // Reviews dataset (loaded with real 1,810 reviews, expandable on download)
  const [reviewsList, setReviewsList] = useState<Review[]>(mockReviewsList);

  // User Profile & Onboarding State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('groww_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { name: 'Full Name', email: 'example@gmail.com' };
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('groww_onboarded');
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Dynamically compute filtered analytics based on dateFilter and source
  const filteredReviews = useMemo(() => {
    return filterReviews(reviewsList, dateFilter, selectedSource);
  }, [reviewsList, dateFilter, selectedSource]);

  const analytics = useMemo(() => {
    return computeFilteredAnalytics(filteredReviews, reviewsList, dateFilter);
  }, [filteredReviews, reviewsList, dateFilter]);

  const currentPulse: Pulse = analytics.pulse || mockCurrentPulse;
  const [historicalPulses, setHistoricalPulses] = useState<HistoricalPulseItem[]>(mockHistoricalPulses);
  const [customPulsesById, setCustomPulsesById] = useState<Record<string, Pulse>>({});
  const [selectedPulseId, setSelectedPulseId] = useState<string | null>(null);

  const selectedPulse: Pulse = useMemo(() => {
    if (!selectedPulseId) return currentPulse;
    if (customPulsesById[selectedPulseId]) {
      return customPulsesById[selectedPulseId];
    }
    if (selectedPulseId === currentPulse.id) {
      return currentPulse;
    }
    const hist = historicalPulses.find((p) => p.id === selectedPulseId);
    if (hist) {
      const [startStr, endStr] = hist.dateRange.split(' to ');
      if (startStr && endStr) {
        const startDate = new Date(`${startStr}T00:00:00`);
        const endDate = new Date(`${endStr}T23:59:59`);
        const wkReviews = filterReviews(
          reviewsList,
          { type: 'custom', label: hist.week, startDate, endDate },
          'All Sources'
        );
        const wkAnalytics = computeFilteredAnalytics(wkReviews, reviewsList, {
          type: 'custom',
          label: `${hist.week}, 2026`,
          startDate,
          endDate,
        });
        if (wkAnalytics.pulse) {
          return {
            ...wkAnalytics.pulse,
            id: hist.id,
            weekStart: startStr,
            weekEnd: endStr,
            weekLabel: `${hist.week}, 2026`,
            status: hist.status,
            docUrl: hist.docUrl,
          };
        }
      }
    }
    return currentPulse;
  }, [selectedPulseId, customPulsesById, currentPulse, historicalPulses, reviewsList]);

  // Drawers & Modals
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('groww_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('groww_onboarded', 'true');
    } catch {
      // ignore
    }
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: `Signed in as ${newProfile.name} (${newProfile.email}).`
    });
  };

  const handleCompleteOnboarding = (profile: UserProfile) => {
    handleUpdateProfile(profile);
    setIsOnboardingOpen(false);
    addToast({
      type: 'success',
      title: 'Welcome aboard!',
      message: `Your Weekly Pulse workspace is personalized for ${profile.name}.`
    });
  };

  const handleReviewsDownloaded = (newReviews: Review[]) => {
    setReviewsList((prev) => {
      const merged = mergeDeduplicatedReviews(newReviews, prev);
      const addedCount = Math.max(0, merged.length - prev.length);
      addToast({
        type: 'success',
        title: 'Live Reviews Ingested',
        message:
          addedCount > 0
            ? `Fetched ${newReviews.length} live store reviews (${addedCount} new). Workspace now has ${merged.length.toLocaleString()} reviews.`
            : `Verified ${newReviews.length} latest live reviews from Play Store & App Store (${merged.length.toLocaleString()} total in workspace).`,
      });
      return merged;
    });
  };

  // Automatically sync latest live reviews from /api/live-reviews on startup
  useEffect(() => {
    let mounted = true;
    fetchLiveReviewsFromStores(2).then((res) => {
      if (mounted && res.reviews.length > 0) {
        setReviewsList((prev) => mergeDeduplicatedReviews(res.reviews, prev));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPulse = (id: string) => {
    setSelectedPulseId(id);
  };

  const handlePulseGenerated = (newPulse: Pulse) => {
    const dateRange = `${newPulse.weekStart} to ${newPulse.weekEnd}`;
    const sentiment: 'Positive' | 'Mixed' | 'Negative' =
      newPulse.negativePercentage >= 42
        ? 'Negative'
        : newPulse.averageRating >= 3.6 && newPulse.negativePercentage < 35
        ? 'Positive'
        : 'Mixed';

    const newHistItem: HistoricalPulseItem = {
      id: newPulse.id,
      week: newPulse.weekLabel,
      dateRange,
      reviews: newPulse.reviewCount,
      topTheme: newPulse.themes[0]?.name || 'App Performance',
      sentiment,
      status: 'Ready to publish',
      publishedDate: 'Just now',
      docUrl: newPulse.docUrl || 'https://docs.google.com/document/d/1EBODRQUvYK5oBVDrdKmIhqGB9EOwIz0qCFLQNdpPh3s/edit',
    };

    setCustomPulsesById((prev) => ({ ...prev, [newPulse.id]: newPulse }));
    setHistoricalPulses((prev) => [
      newHistItem,
      ...prev.filter((item) => item.id !== newPulse.id && item.dateRange !== dateRange),
    ]);
    setSelectedPulseId(newPulse.id);

    addToast({
      type: 'success',
      title: 'New Pulse Created',
      message: `${newPulse.weekLabel} (${newPulse.reviewCount.toLocaleString()} reviews) is ready to publish to Google Docs & Gmail.`,
    });
  };

  const activeReview: Review | null = reviewsList.find((r) => r.id === activeReviewId) || null;
  const activeTheme: Theme | null = analytics.themes.find((t) => t.id === activeThemeId) || null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => {
          setSelectedPulseId(null);
          setCurrentRoute(route);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userProfile={userProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation Bar with Open-Ended Date Selector */}
        <Topbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          dateFilter={dateFilter}
          onChangeDateFilter={setDateFilter}
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
          userProfile={userProfile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          totalFilteredCount={filteredReviews.length}
        />

        {/* Page Container */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {/* If a pulse is selected for detail view */}
          {selectedPulseId ? (
            <PulseDetailPage
              pulse={selectedPulse}
              onBack={() => setSelectedPulseId(null)}
              onShowToast={addToast}
            />
          ) : (
            <>
              {currentRoute === 'overview' && (
                <OverviewPage
                  currentPulse={currentPulse}
                  metrics={analytics.metrics}
                  themes={analytics.themes}
                  ratingBreakdown={analytics.ratingBreakdown}
                  sourceBreakdown={analytics.sourceBreakdown}
                  weeklyTrends={analytics.weeklyTrends}
                  recentReviews={filteredReviews}
                  filteredCount={filteredReviews.length}
                  dateFilter={dateFilter}
                  onSelectTheme={(id) => setActiveThemeId(id)}
                  onSelectReview={(id) => setActiveReviewId(id)}
                  onViewAllThemes={() => setCurrentRoute('themes')}
                  onViewAllReviews={() => setCurrentRoute('reviews')}
                  onViewFullPulse={() => setSelectedPulseId(currentPulse.id)}
                  onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
                  onShowToast={addToast}
                />
              )}

              {currentRoute === 'pulses' && (
                <WeeklyPulsesPage
                  pulses={historicalPulses}
                  onSelectPulse={handleSelectPulse}
                  onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
                />
              )}

              {currentRoute === 'reviews' && (
                <ReviewsPage
                  reviews={filteredReviews}
                  onSelectReview={(id) => setActiveReviewId(id)}
                />
              )}

              {currentRoute === 'themes' && (
                <ThemesPage
                  themes={analytics.themes}
                  onSelectTheme={(id) => setActiveThemeId(id)}
                />
              )}

              {currentRoute === 'insights' && <InsightsPage />}
              {currentRoute === 'reports' && (
                <WeeklyPulsesPage
                  pulses={historicalPulses}
                  onSelectPulse={handleSelectPulse}
                  onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
                />
              )}
              {currentRoute === 'datasources' && <DataSourcesPage />}
              {currentRoute === 'settings' && (
                <SettingsPage
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Slide-over Drawers */}
      <ReviewDrawer
        review={activeReview}
        isOpen={Boolean(activeReviewId)}
        onClose={() => setActiveReviewId(null)}
      />

      <ThemeDrawer
        theme={activeTheme}
        isOpen={Boolean(activeThemeId)}
        onClose={() => setActiveThemeId(null)}
        onSelectReview={(id) => {
          setActiveThemeId(null);
          setActiveReviewId(id);
        }}
      />

      {/* Modals & Command Palette */}
      <GeneratePulseModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onPulseGenerated={handlePulseGenerated}
        reviews={reviewsList}
        onLiveReviewsMerged={setReviewsList}
      />

      <DownloadReviewsModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        currentCount={reviewsList.length}
        onReviewsDownloaded={handleReviewsDownloaded}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(route) => {
          setSelectedPulseId(null);
          setCurrentRoute(route);
        }}
        onSelectReview={(id) => setActiveReviewId(id)}
        onSelectTheme={(id) => setActiveThemeId(id)}
      />

      {/* User Account Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={userProfile}
        onSave={handleUpdateProfile}
      />

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
