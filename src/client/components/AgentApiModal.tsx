import React, { useState } from 'react';
import { X, Copy, Check, Bot, Key, Sparkles, RefreshCw, Terminal, ExternalLink } from 'lucide-react';

interface AgentApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onRegenerateKey: () => Promise<string>;
}

export const AgentApiModal: React.FC<AgentApiModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onRegenerateKey,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3456';

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate your API key? Existing agent connections will stop working until updated.')) {
      setRegenerating(true);
      try {
        await onRegenerateKey();
      } finally {
        setRegenerating(false);
      }
    }
  };

  const agentSystemPrompt = `You have access to HabitCorp, the boring cousin of Habitica (non-gamified task, habit, and agenda manager).
Base URL: ${currentOrigin}/api/v1
Header: X-API-Key: ${apiKey}

Capabilities:
1. Create a task or todo:
   POST /tasks
   Body: {"title": "Task title", "type": "todo", "difficulty": "trivial|easy|medium|hard", "subtasks": ["Step 1", "Step 2"], "due_date": "YYYY-MM-DD"}

2. Schedule a task onto the user's Agenda:
   POST /tasks
   Body: {"title": "Deep Work", "type": "todo", "scheduled_date": "YYYY-MM-DD", "scheduled_start": "14:00", "scheduled_duration": 60}

3. Create a Periodical Habit:
   POST /tasks
   Body: {"title": "Morning Routine", "type": "daily", "frequency": "daily", "subtasks": ["Stretch", "Review day"]}

4. Inspect Agenda (meetings & scheduled tasks) to check user's availability:
   GET /agenda?start=YYYY-MM-DD&end=YYYY-MM-DD

5. Complete / Score a task:
   POST /tasks/:id/score (direction: "up" | "down")`;

  const curlCreateTask = `curl -X POST "${currentOrigin}/api/v1/tasks" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"title": "Review architecture doc", "difficulty": "medium", "subtasks": ["Read intro", "Check API schemas"]}'`;

  const curlGetAgenda = `curl "${currentOrigin}/api/v1/agenda?start=2026-10-28" \\
  -H "X-API-Key: ${apiKey}"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden my-8 text-stone-800">
        <div className="flex items-center justify-between p-5 border-b border-stone-200/80 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg text-stone-900">Agent & REST API</span>
              <p className="text-xs text-stone-500">Connect AI coding agents, background scripts, or cron jobs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* API Key Box */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Your Personal API Key</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 font-mono text-xs text-indigo-900 select-all focus:outline-none focus:border-indigo-400 focus:bg-white"
              />
              <button
                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-stone-200 shadow-2xs"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-rose-600 rounded-xl text-xs transition border border-stone-200"
                title="Regenerate API Key"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* One-Click Agent Prompt */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Agent System Prompt Instructions</span>
              </span>
              <button
                onClick={() => copyToClipboard(agentSystemPrompt, setCopiedPrompt)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-xs"
              >
                {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? 'Copied Prompt' : 'Copy Agent Prompt'}</span>
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Paste this block into the custom instructions or chat prompt of your AI agent (ChatGPT, Claude, Gemini, Antigravity, or Cursor). It gives your agent full instructions on how to push tasks and schedule your agenda.
            </p>
            <pre className="p-3 bg-white border border-indigo-100 rounded-xl text-[11px] font-mono text-stone-800 overflow-x-auto whitespace-pre shadow-2xs">
              {agentSystemPrompt}
            </pre>
          </div>

          {/* Curl Examples */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick cURL Examples</span>
            </span>

            {/* Example 1: Create Task */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-medium">Create Task with Subtasks</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(curlCreateTask);
                    setCopiedCurl('task');
                    setTimeout(() => setCopiedCurl(null), 2000);
                  }}
                  className="hover:text-stone-800 flex items-center gap-1 text-[10px]"
                >
                  {copiedCurl === 'task' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl === 'task' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-mono text-stone-800 overflow-x-auto shadow-2xs">
                {curlCreateTask}
              </pre>
            </div>

            {/* Example 2: Check Agenda */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-medium">Get Today&apos;s Agenda (Meetings + Scheduled Tasks)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(curlGetAgenda);
                    setCopiedCurl('agenda');
                    setTimeout(() => setCopiedCurl(null), 2000);
                  }}
                  className="hover:text-stone-800 flex items-center gap-1 text-[10px]"
                >
                  {copiedCurl === 'agenda' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl === 'agenda' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-mono text-stone-800 overflow-x-auto shadow-2xs">
                {curlGetAgenda}
              </pre>
            </div>
          </div>

          {/* OpenAPI Link */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>Machine-readable OpenAPI 3.1 specification:</span>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
            >
              <span>/api/v1/openapi.json</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
