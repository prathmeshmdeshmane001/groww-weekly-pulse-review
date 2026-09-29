// Vercel Serverless Function: Live Real-Time Review Ingestion from Google Play Store & Apple App Store
// Endpoint: GET /api/live-reviews

const PLAY_STORE_PACKAGE = 'com.nextbillion.groww';
const APP_STORE_ID = '1404871703';

function stripPii(text) {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, '[PHONE_REDACTED]')
    .replace(/\b\d{10,12}\b/g, '[ID_REDACTED]')
    .replace(/https?:\/\/\S+/gi, '[URL_REDACTED]')
    .trim();
}

function removeEmojis(text) {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function isEnglish(text) {
  const letters = text.match(/[a-zA-Z]/g) || [];
  const nonAscii = text.match(/[^\x00-\x7F]/g) || [];
  return letters.length >= 10 && nonAscii.length <= letters.length * 0.25;
}

function detectTheme(text) {
  const t = ` ${text.toLowerCase()} `;
  const scores = {
    'Charges & Fees': [
      'charge',
      'fee',
      'brokerage',
      'hidden',
      'cost',
      ' rs ',
      'rs.',
      '₹',
      'rupee',
      'maintenance',
      'gst',
      'cut money',
      'deduct',
      'dp charge',
      'penalty',
      'auto square',
    ].filter((k) => t.includes(k)).length,
    'App Performance': [
      'lag',
      'slow',
      'crash',
      'freeze',
      'bug',
      'glitch',
      'chart',
      'update',
      'stuck',
      'performance',
      'loading',
      'speed',
      'battery',
      'hanging',
      'black screen',
      'server',
      'down',
      'error',
    ].filter((k) => t.includes(k)).length,
    'Customer Support': [
      'support',
      'customer service',
      'customer care',
      'helpdesk',
      'agent',
      'ticket',
      'helpline',
      'contact',
      'call',
      'response',
      'email support',
      'phone number',
      'complaint',
      'resolve',
    ].filter((k) => t.includes(k)).length,
    Payments: [
      'payment',
      'upi',
      'gpay',
      'phonepe',
      'autopay',
      'mandate',
      'deposit',
      'add money',
      'net banking',
      'sip',
      'deduction',
      'failed payment',
      'bank',
    ].filter((k) => t.includes(k)).length,
    'KYC & Onboarding': [
      'kyc',
      'aadhaar',
      'aadhar',
      'pan',
      'onboarding',
      'document',
      'verify',
      'verification',
      'digilocker',
      'selfie',
      'account open',
      'sign up',
      'login',
      'otp',
    ].filter((k) => t.includes(k)).length,
    Withdrawals: [
      'withdraw',
      'withdrawal',
      'payout',
      'bank transfer',
      'uncredited',
      'settlement',
      'credit in bank',
      'funds transfer',
    ].filter((k) => t.includes(k)).length,
    Statements: [
      'statement',
      'p&l',
      'profit',
      'loss',
      'tax',
      'report',
      'contract note',
      'capital gain',
      'download',
      'pdf',
      'excel',
      'ledger',
      'invoice',
      'portfolio',
    ].filter((k) => t.includes(k)).length,
  };

  let bestTheme = 'General & Usability';
  let bestScore = 0;
  for (const [theme, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }
  return bestTheme;
}

function formatDateDisplay(dateObj) {
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

async function fetchPlayStoreBatch(count = 200, paginationToken = null) {
  const url = 'https://play.google.com/_/PlayStoreUi/data/batchexecute?hl=en&gl=in';
  const body = paginationToken
    ? `f.req=%5B%5B%5B%22oCPfdb%22%2C%22%5Bnull%2C%5B2%2C2%2C%5B${count}%2Cnull%2C%5C%22${paginationToken}%5C%22%5D%2Cnull%2C%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%5D%5D%2C%5B%5C%22${PLAY_STORE_PACKAGE}%5C%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D%0A`
    : `f.req=%5B%5B%5B%22oCPfdb%22%2C%22%5Bnull%2C%5B2%2C2%2C%5B${count}%5D%2Cnull%2C%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%5D%5D%2C%5B%5C%22${PLAY_STORE_PACKAGE}%5C%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D%0A`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    body,
  });

  if (!resp.ok) return { items: [], nextToken: null };
  const rawText = await resp.text();
  const lines = rawText.replace(/^\)\]\}'\s*/, '').split('\n');
  const jsonLine = lines.find((line) => line.trim().startsWith('[[')) || lines[0];
  const outer = JSON.parse(jsonLine);
  const innerStr = outer?.[0]?.[2];
  if (!innerStr) return { items: [], nextToken: null };

  const parsed = JSON.parse(innerStr);
  const items = Array.isArray(parsed?.[0]) ? parsed[0] : [];
  const nextToken =
    typeof parsed?.[parsed.length - 2]?.[parsed[parsed.length - 2].length - 1] === 'string'
      ? parsed[parsed.length - 2][parsed[parsed.length - 2].length - 1]
      : null;

  return { items, nextToken };
}

async function fetchLivePlayStoreReviews(maxBatches = 3) {
  const normalized = [];
  let token = null;

  for (let b = 0; b < maxBatches; b++) {
    try {
      const { items, nextToken } = await fetchPlayStoreBatch(200, token);
      if (!items.length) break;

      for (const r of items) {
        const id = r?.[0];
        const rating = Number(r?.[2] || 0);
        const rawText = String(r?.[4] || '');
        const unixSec = r?.[5]?.[0];
        if (!id || !rawText || rating < 1 || rating > 5) continue;

        const clean = stripPii(removeEmojis(rawText));
        const wordCount = clean.split(/\s+/).filter(Boolean).length;
        if (wordCount <= 6 || !isEnglish(clean)) continue;

        const d = unixSec ? new Date(unixSec * 1000) : new Date();
        normalized.push({
          id: String(id),
          rating,
          title: null,
          text: clean,
          date: formatDateDisplay(d),
          timestamp: d.getTime(),
          source: 'Play Store',
          theme: detectTheme(clean),
          sentiment: rating >= 4 ? 'Positive' : rating === 3 ? 'Neutral' : 'Negative',
          pii_stripped: true,
        });
      }

      if (!nextToken) break;
      token = nextToken;
    } catch {
      break;
    }
  }

  return normalized;
}

async function fetchLiveAppStoreReviews(maxPages = 2) {
  const normalized = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://itunes.apple.com/in/rss/customerreviews/page=${page}/id=${APP_STORE_ID}/sortby=mostrecent/json`;
      const resp = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      if (!resp.ok) break;
      const data = await resp.json();
      const entries = data?.feed?.entry || [];
      if (!Array.isArray(entries) || entries.length === 0) break;

      for (const entry of entries) {
        if (!entry?.['im:rating']) continue;
        const id = entry?.id?.label;
        const rating = Number(entry?.['im:rating']?.label || 0);
        const rawTitle = String(entry?.title?.label || '');
        const rawText = String(entry?.content?.label || '');
        const dateStr = entry?.updated?.label;

        if (!id || !rawText || rating < 1 || rating > 5) continue;
        const clean = stripPii(removeEmojis(rawText));
        const wordCount = clean.split(/\s+/).filter(Boolean).length;
        if (wordCount <= 6 || !isEnglish(clean)) continue;

        const d = dateStr ? new Date(dateStr) : new Date();
        const cleanTitle = stripPii(removeEmojis(rawTitle)) || null;

        normalized.push({
          id: String(id),
          rating,
          title: cleanTitle,
          text: clean,
          date: formatDateDisplay(d),
          timestamp: d.getTime(),
          source: 'App Store',
          theme: detectTheme(clean),
          sentiment: rating >= 4 ? 'Positive' : rating === 3 ? 'Neutral' : 'Negative',
          pii_stripped: true,
        });
      }
    } catch {
      break;
    }
  }

  return normalized;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const batches = Math.min(5, Math.max(1, Number(req.query?.batches || 3)));
    const [playReviews, appReviews] = await Promise.all([
      fetchLivePlayStoreReviews(batches),
      fetchLiveAppStoreReviews(2),
    ]);

    const combined = [...playReviews, ...appReviews]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ timestamp, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      fetchedAt: new Date().toISOString(),
      playCount: playReviews.length,
      appCount: appReviews.length,
      totalCount: combined.length,
      reviews: combined,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch live reviews',
      reviews: [],
    });
  }
}
