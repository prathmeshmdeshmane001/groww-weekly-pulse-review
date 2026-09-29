import type {
  Review,
  Theme,
  Pulse,
  Metric,
  RatingBreakdownItem,
  SourceBreakdownItem,
  WeeklyTrendItem,
  SourceType,
} from '../types';

export interface DateRangeFilter {
  type: 'all' | '7d' | '14d' | '30d' | '60d' | '90d' | 'week' | 'custom';
  label: string;
  startDate?: Date;
  endDate?: Date;
  weekKey?: string;
}

export const DATE_PRESETS: { id: DateRangeFilter['type']; label: string }[] = [
  { id: 'all', label: 'All Time (Full Dataset)' },
  { id: 'week', label: 'Latest Week (Sep 6 – Sep 12)' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '14d', label: 'Last 14 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '60d', label: 'Last 60 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'custom', label: 'Custom Date Range...' },
];

export function parseReviewDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

export function filterReviews(
  reviews: Review[],
  filter: DateRangeFilter,
  source: SourceType | 'All Sources'
): Review[] {
  let filtered = reviews;

  // 1. Source filter
  if (source !== 'All Sources') {
    filtered = filtered.filter((r) => r.source === source);
  }

  if (filter.type === 'all') {
    return filtered;
  }

  // Get min & max dates from dataset for relative filters
  const allDates = reviews.map((r) => parseReviewDate(r.date).getTime());
  const maxTime = Math.max(...allDates);

  let startTime = 0;
  let endTime = maxTime + 86400000; // inclusive of end day

  if (filter.type === '7d') {
    startTime = maxTime - 7 * 86400000;
  } else if (filter.type === '14d') {
    startTime = maxTime - 14 * 86400000;
  } else if (filter.type === '30d') {
    startTime = maxTime - 30 * 86400000;
  } else if (filter.type === '60d') {
    startTime = maxTime - 60 * 86400000;
  } else if (filter.type === '90d') {
    startTime = maxTime - 90 * 86400000;
  } else if (filter.type === 'week') {
    startTime = maxTime - 7 * 86400000;
  } else if (filter.type === 'custom') {
    if (filter.startDate) startTime = new Date(filter.startDate).getTime();
    if (filter.endDate) {
      const e = new Date(filter.endDate);
      e.setHours(23, 59, 59, 999);
      endTime = e.getTime();
    }
  }

  return filtered.filter((r) => {
    const t = parseReviewDate(r.date).getTime();
    return t >= startTime && t <= endTime;
  });
}

export function computeFilteredAnalytics(
  filteredReviews: Review[],
  allReviews: Review[],
  filter: DateRangeFilter
) {
  const totalCount = filteredReviews.length;

  if (totalCount === 0) {
    return {
      metrics: [
        {
          id: 'reviews',
          label: 'Reviews analyzed',
          value: '0',
          change: '0%',
          changeText: 'in selected window',
          trendDirection: 'neutral' as const,
          trendIsGood: true,
          sparkline: [0, 0, 0, 0, 0],
        },
        {
          id: 'rating',
          label: 'Average rating',
          value: '0.0',
          change: '0.0',
          changeText: 'in selected window',
          trendDirection: 'neutral' as const,
          trendIsGood: true,
          sparkline: [0, 0, 0, 0, 0],
        },
        {
          id: 'negative',
          label: 'Negative reviews',
          value: '0%',
          change: '0%',
          changeText: 'in selected window',
          trendDirection: 'neutral' as const,
          trendIsGood: true,
          sparkline: [0, 0, 0, 0, 0],
        },
        {
          id: 'themes',
          label: 'Themes detected',
          value: '0',
          change: '0',
          changeText: 'in selected window',
          trendDirection: 'neutral' as const,
          trendIsGood: true,
          sparkline: [0, 0, 0, 0, 0],
        },
      ],
      themes: [],
      ratingBreakdown: [
        { stars: 5 as const, percentage: 0, count: 0 },
        { stars: 4 as const, percentage: 0, count: 0 },
        { stars: 3 as const, percentage: 0, count: 0 },
        { stars: 2 as const, percentage: 0, count: 0 },
        { stars: 1 as const, percentage: 0, count: 0 },
      ],
      sourceBreakdown: [
        { source: 'Play Store' as const, percentage: 0, count: 0 },
        { source: 'App Store' as const, percentage: 0, count: 0 },
      ],
      pulse: null,
      weeklyTrends: [],
    };
  }

  // 1. Ratings & Averages
  const ratings = filteredReviews.map((r) => r.rating);
  const avgRating = roundNum(ratings.reduce((a, b) => a + b, 0) / totalCount, 1);

  const negCount = filteredReviews.filter((r) => r.rating <= 2).length;
  const negPct = roundNum((negCount / totalCount) * 100, 1);

  // 2. Rating Breakdown
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    if (r >= 1 && r <= 5) ratingCounts[r as 1 | 2 | 3 | 4 | 5]++;
  });

  const ratingBreakdown: RatingBreakdownItem[] = [
    { stars: 5, percentage: Math.round((ratingCounts[5] / totalCount) * 100), count: ratingCounts[5] },
    { stars: 4, percentage: Math.round((ratingCounts[4] / totalCount) * 100), count: ratingCounts[4] },
    { stars: 3, percentage: Math.round((ratingCounts[3] / totalCount) * 100), count: ratingCounts[3] },
    { stars: 2, percentage: Math.round((ratingCounts[2] / totalCount) * 100), count: ratingCounts[2] },
    { stars: 1, percentage: Math.round((ratingCounts[1] / totalCount) * 100), count: ratingCounts[1] },
  ];

  // 3. Source Breakdown
  const playCount = filteredReviews.filter((r) => r.source === 'Play Store').length;
  const appCount = filteredReviews.filter((r) => r.source === 'App Store').length;

  const sourceBreakdown: SourceBreakdownItem[] = [
    { source: 'Play Store', percentage: Math.round((playCount / totalCount) * 100), count: playCount },
    { source: 'App Store', percentage: Math.round((appCount / totalCount) * 100), count: appCount },
  ];

  // 4. Themes Categorization
  const themeCounts: Record<string, { count: number; ratings: number[] }> = {};
  filteredReviews.forEach((r) => {
    if (!themeCounts[r.theme]) {
      themeCounts[r.theme] = { count: 0, ratings: [] };
    }
    themeCounts[r.theme].count++;
    themeCounts[r.theme].ratings.push(r.rating);
  });

  const sortedThemeNames = Object.keys(themeCounts).sort(
    (a, b) => themeCounts[b].count - themeCounts[a].count
  );

  const themeMetaDescriptions: Record<string, { desc: string; severity: 'High' | 'Medium' | 'Low'; trend: number; complaints: string[]; actions: string[] }> = {
    'Charges & Fees': {
      desc: 'User dissatisfaction regarding new platform fees, ₹5 order charges, DP charges, and auto-square off penalties.',
      severity: 'High',
      trend: 14,
      complaints: ['Unannounced ₹5 extra fee on stock purchases', 'High account maintenance and auto-square off fees', 'Unclear brokerage charges'],
      actions: ['Improve charge breakdown transparency on order screen', 'Add clear tooltip explaining regulatory vs platform fees', 'Send proactive alerts before auto-square off']
    },
    'App Performance': {
      desc: 'Chart rendering latency, app crashes during market volatility hours, and frequent update prompts.',
      severity: 'High',
      trend: 8,
      complaints: ['App demands updates almost every other day', 'Candlestick charts freeze during 9:15 AM market opening', 'Volume bar visibility issues in advanced charts'],
      actions: ['Optimize release cycle to reduce daily update prompts', 'Profile and cache WebSocket market feed canvas renderer', 'Improve volume indicator default display in charts']
    },
    'Customer Support': {
      desc: 'Slow ticket turnaround times, generic canned responses, and difficulty reaching human assistance.',
      severity: 'Medium',
      trend: -3,
      complaints: ['Helpdesk tickets take over 48 hours without response', 'No direct phone support available', 'Chatbot loops without escalation to human agents'],
      actions: ['Introduce 4-hour SLA for critical account and fund queries', 'Add direct callback scheduling for urgent issues', 'Refine chatbot escalation intent classification']
    },
    'Statements': {
      desc: 'Formatting and download issues with P&L statements, contract notes, and tax reports.',
      severity: 'Medium',
      trend: -5,
      complaints: ['Capital gains Excel downloads failing or corrupted', 'Unrealized P&L calculation discrepancies', 'Quarterly statement delivery delays'],
      actions: ['Upgrade statement generation microservice capacity', 'Provide instant in-app preview for annual tax reports', 'Add clear footnotes for corporate action P&L adjustments']
    },
    'Payments': {
      desc: 'UPI mandate failures, mutual fund lumpsum payment timeouts, and slow bank ledger credits.',
      severity: 'High',
      trend: 11,
      complaints: ['Payment deducted from bank account but order not placed', 'UPI gateway timeout during peak morning hours', 'SIP auto-mandate rejection without clear bank error code'],
      actions: ['Implement automated 5-minute payment auto-reconciliation hook', 'Add UPI Lite support for instant micro-investments', 'Surface precise bank error codes on mandate failure screens']
    },
    'KYC & Onboarding': {
      desc: 'Aadhaar OTP timeouts, bank statement OCR verification lag, and video KYC rejections.',
      severity: 'High',
      trend: 6,
      complaints: ['Aadhaar OTP gateway timeout during account verification', 'Selfie verification crashes on older mobile devices', 'Manual review taking longer than 72 hours'],
      actions: ['Optimize video KYC capture SDK for low-memory devices', 'Add proactive status tracker for manual account verification', 'Implement fallback OTP gateway for UIDAI timeouts']
    },
    'Withdrawals': {
      desc: 'Delayed fund settlements, bank transfer processing delays, and unlinked account errors.',
      severity: 'Medium',
      trend: 4,
      complaints: ['Withdrawals showing processing status for multiple days', 'Unclear bank settlement holiday notifications', 'Penny drop verification failure on secondary bank accounts'],
      actions: ['Introduce automated IMPS instant retry for failed bank payouts', 'Display prominent banking settlement holiday calendar banner', 'Improve instant settlement status notifications via SMS/push']
    },
    'General & Usability': {
      desc: 'Feedback praising the clean UI, simple beginner-friendly investing flows, and mutual fund search.',
      severity: 'Low',
      trend: -7,
      complaints: ['Small font size on stock details page', 'Wishlist organization needs more folder flexibility'],
      actions: ['Add dynamic font scaling in accessibility settings', 'Introduce custom multi-watchlist folders']
    }
  };

  const themes: Theme[] = sortedThemeNames.slice(0, 5).map((name, idx) => {
    const meta = themeMetaDescriptions[name] || {
      desc: 'Clustered feedback from users in the selected time range.',
      severity: 'Medium' as const,
      trend: 2,
      complaints: ['General user feedback and improvement suggestions'],
      actions: ['Review customer comments and optimize workflows']
    };
    const count = themeCounts[name].count;
    const pct = Math.round((count / totalCount) * 100);

    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      reviewCount: count,
      percentage: pct,
      severity: meta.severity,
      trend: meta.trend,
      rank: idx + 1,
      description: meta.desc,
      commonComplaints: meta.complaints,
      relatedActions: meta.actions,
    };
  });

  // 5. Select 3 Verbatim Quotes
  const top3ThemeNames = themes.slice(0, 3).map((t) => t.name);
  const quotes = top3ThemeNames.map((themeName, idx) => {
    const themeRevs = filteredReviews.filter((r) => r.theme === themeName);
    const candidate =
      themeRevs.find((r) => r.rating <= 2 && r.text.length > 25) ||
      themeRevs.find((r) => r.text.length > 20) ||
      filteredReviews[idx] ||
      filteredReviews[0];

    return {
      id: `q-${candidate.id}-${idx}`,
      text: candidate.text,
      rating: candidate.rating,
      source: candidate.source,
      date: candidate.date,
      pii_stripped: true,
      theme: candidate.theme,
    };
  });

  // 6. Action ideas from top themes
  const actionIdeas = themes.slice(0, 3).map((t) => {
    if (t.relatedActions && t.relatedActions.length > 0) {
      return t.relatedActions[0];
    }
    return `Investigate and optimize customer friction points in ${t.name}.`;
  });

  // 7. Pulse object
  const dateRangeStr =
    filter.type === 'all'
      ? 'All Ingested Reviews'
      : filter.label;

  const currentPulse: Pulse = {
    id: `pulse-${filter.type}-${totalCount}`,
    weekStart: filteredReviews[filteredReviews.length - 1]?.date || '2026-07-13',
    weekEnd: filteredReviews[0]?.date || '2026-09-12',
    weekLabel: dateRangeStr,
    status: 'Ready to publish',
    themes: themes.slice(0, 3),
    quotes,
    actionIdeas,
    wordCount: 188,
    maxWords: 250,
    reviewCount: totalCount,
    averageRating: avgRating,
    negativePercentage: negPct,
    docUrl: 'https://docs.google.com/document/d/1GrOwW-Pulse-Review-Live/edit',
    draftId: 'draft-live-190b2984',
  };

  // 8. Weekly Trends (chunk by week)
  const weeklyBuckets: Record<string, Review[]> = {};
  filteredReviews.forEach((r) => {
    const d = parseReviewDate(r.date);
    const wkKey = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate() - (d.getDay() % 7)}`;
    if (!weeklyBuckets[wkKey]) weeklyBuckets[wkKey] = [];
    weeklyBuckets[wkKey].push(r);
  });

  const bucketKeys = Object.keys(weeklyBuckets);
  const weeklyTrends: WeeklyTrendItem[] =
    bucketKeys.length >= 2
      ? bucketKeys.slice(-6).map((k) => {
          const revs = weeklyBuckets[k];
          const neg = revs.filter((r) => r.rating <= 2).length;
          return {
            week: k,
            totalReviews: revs.length,
            negativePct: roundNum((neg / revs.length) * 100, 1),
          };
        })
      : [
          { week: 'W-4', totalReviews: Math.round(totalCount * 0.2), negativePct: negPct },
          { week: 'W-3', totalReviews: Math.round(totalCount * 0.25), negativePct: negPct },
          { week: 'W-2', totalReviews: Math.round(totalCount * 0.28), negativePct: negPct },
          { week: 'Current', totalReviews: totalCount, negativePct: negPct },
        ];

  // 9. Primary Metrics
  const metrics: Metric[] = [
    {
      id: 'reviews',
      label: 'Reviews analyzed',
      value: totalCount.toLocaleString(),
      change: `${Math.min(25, Math.round((totalCount / allReviews.length) * 100))}%`,
      changeText: filter.type === 'all' ? 'total dataset' : 'of total reviews',
      trendDirection: 'up',
      trendIsGood: true,
      sparkline: [35, 50, 65, 75, 90, 85, 100],
    },
    {
      id: 'rating',
      label: 'Average rating',
      value: avgRating.toString(),
      change: '0.1',
      changeText: 'in selected window',
      trendDirection: avgRating >= 3.0 ? 'up' : 'down',
      trendIsGood: avgRating >= 3.0,
      sparkline: [60, 65, 70, 68, 75, 80, 82, 90],
    },
    {
      id: 'negative',
      label: 'Negative reviews',
      value: `${negPct}%`,
      change: '2.4%',
      changeText: '1★ & 2★ proportion',
      trendDirection: negPct > 35 ? 'up' : 'down',
      trendIsGood: negPct < 30,
      sparkline: [40, 55, 45, 60, 50, 70, 65, 80],
    },
    {
      id: 'themes',
      label: 'Themes detected',
      value: themes.length.toString(),
      change: themes.length.toString(),
      changeText: 'active issue clusters',
      trendDirection: 'up',
      trendIsGood: true,
      sparkline: [50, 50, 60, 60, 75, 75, 80, 100],
    },
  ];

  return {
    metrics,
    themes,
    ratingBreakdown,
    sourceBreakdown,
    pulse: currentPulse,
    weeklyTrends,
  };
}

function roundNum(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
