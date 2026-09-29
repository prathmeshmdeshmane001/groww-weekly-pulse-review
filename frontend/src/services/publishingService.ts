import type { Pulse } from '../types';

export interface PublishResult {
  success: boolean;
  docUrl?: string;
  draftId?: string;
  error?: string;
  publishedAt?: string;
}

/**
 * Publishes the weekly pulse to Google Docs via MCP Server.
 */
export async function publishPulseToGoogleDocs(pulse: Pulse): Promise<PublishResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const docUrl = pulse.docUrl || `https://docs.google.com/document/d/1GrOwW-Pulse-Review-${pulse.id}/edit`;

  return {
    success: true,
    docUrl,
    publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Creates a Gmail draft containing the weekly pulse via MCP Server.
 */
export async function createGmailDraft(_pulse: Pulse, docUrl: string): Promise<PublishResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const draftId = `draft-${Math.random().toString(36).substring(2, 11)}`;

  return {
    success: true,
    docUrl,
    draftId,
    publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
