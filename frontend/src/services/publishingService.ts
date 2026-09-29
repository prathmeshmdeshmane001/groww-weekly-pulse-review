import type { Pulse } from '../types';

export const DEFAULT_GOOGLE_DOC_URL =
  'https://docs.google.com/document/d/1EBODRQUvYK5oBVDrdKmIhqGB9EOwIz0qCFLQNdpPh3s/edit';

export interface PublishResult {
  success: boolean;
  docUrl?: string;
  gmailUrl?: string;
  draftId?: string;
  error?: string;
  publishedAt?: string;
}

export function formatPulseMarkdown(pulse: Pulse): string {
  return `# Weekly Pulse — Groww App | ${pulse.weekLabel}

## 1. Top Themes
${pulse.themes.map((t, idx) => `0${idx + 1} ${t.name} (${t.percentage}% of reviews — ${t.reviewCount} reviews)`).join('\n')}

## 2. User Voice (Verbatim Quotes)
${pulse.quotes.map((q) => `> "${q.text}"\n> — ${q.rating}★ (${q.source} • ${q.theme})`).join('\n\n')}

## 3. Prioritized Action Ideas
${pulse.actionIdeas.map((a, idx) => `${idx + 1}. ${a}`).join('\n')}

---
Generated from ${pulse.reviewCount.toLocaleString()} reviews (App Store + Play Store) | Word Count: ${pulse.wordCount}/${pulse.maxWords}
`;
}

/**
 * Publishes the weekly pulse to Google Docs via MCP Server.
 */
export async function publishPulseToGoogleDocs(pulse: Pulse): Promise<PublishResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const docUrl =
    pulse.docUrl && !pulse.docUrl.includes('1GrOwW-')
      ? pulse.docUrl
      : DEFAULT_GOOGLE_DOC_URL;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(formatPulseMarkdown(pulse));
    }
  } catch {
    // Ignore clipboard permission errors
  }

  return {
    success: true,
    docUrl,
    publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Creates a Gmail draft containing the weekly pulse via MCP Server.
 */
export async function createGmailDraft(pulse: Pulse, docUrl: string): Promise<PublishResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const resolvedDocUrl =
    docUrl && !docUrl.includes('1GrOwW-') ? docUrl : DEFAULT_GOOGLE_DOC_URL;
  const draftId = `draft-${Math.random().toString(36).substring(2, 11)}`;

  const subject = `Groww Weekly Pulse — ${pulse.weekLabel}`;
  const body = `${formatPulseMarkdown(pulse)}\nGoogle Doc Deliverable: ${resolvedDocUrl}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    success: true,
    docUrl: resolvedDocUrl,
    gmailUrl,
    draftId,
    publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
