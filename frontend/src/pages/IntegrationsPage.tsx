import React from 'react';
import { FileText, Mail, CheckCircle2, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const IntegrationsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">MCP Integrations</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Model Context Protocol (MCP) server endpoints for delivering executive pulse reports to Google Workspace.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Google Docs MCP Server</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Publishes idempotent formatted Markdown documents directly into Google Drive folders.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Configure Server
          </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Gmail MCP Server</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates executive email drafts in Gmail with direct links to the published Google Doc.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Configure Server
          </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Google GenAI (Gemini 3.6 Flash)</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Powers batch theme clustering, quote selection, and prioritized action idea generation.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Model Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
