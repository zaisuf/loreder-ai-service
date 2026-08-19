'use client';

import React, { useState, useEffect } from 'react';
import { Code, Copy, Check, RefreshCw, Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface VSCodeToken {
  token: string;
  endpoint: string;
  deepLinkUri: string;
  user: { name: string; email: string };
}

export default function VSCodeAuthPage() {
  const [data, setData] = useState<VSCodeToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [launched, setLaunched] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/vscode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionName: 'VS Code / Cursor IDE' })
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleLaunch = () => {
    if (data?.deepLinkUri) {
      window.location.href = data.deepLinkUri;
      setLaunched(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Back link */}
      <Link href="/" className="mb-6 flex items-center text-xs text-zinc-400 hover:text-teal-400 transition-colors self-start max-w-lg w-full">
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dashboard
      </Link>

      {/* Card */}
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 bg-[#18181b] flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Code className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">VS Code / Cursor Extension Auth</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Authorize your IDE to access Codilore's OpenAI-compatible API.</p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* 1-Click launch */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center">
              <span className="mr-2 text-teal-400">① </span>1-Click Extension Connect
            </h3>
            <p className="text-[11px] text-zinc-400">
              Click to automatically open VS Code / Cursor and inject your API key and endpoint.
            </p>
            <button
              onClick={handleLaunch}
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                launched
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-lg shadow-teal-500/20'
              }`}
            >
              {launched ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Launched! Check VS Code / Cursor</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in VS Code / Cursor IDE</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] text-zinc-500 font-mono">OR MANUAL SETUP</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Manual Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center">
              <span className="mr-2 text-teal-400">② </span>Manual Configuration
            </h3>

            {/* Endpoint */}
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                OpenAI-Compatible Base URL
              </label>
              <div className="flex items-center bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
                <span className="flex-1 px-3 py-2.5 text-[11px] font-mono text-teal-300 truncate">
                  {data?.endpoint || 'http://localhost:3000/v1'}
                </span>
                <button
                  onClick={() => copy(data?.endpoint || 'http://localhost:3000/v1', setCopiedUrl)}
                  className="px-3 py-2.5 border-l border-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium flex justify-between">
                <span>Your API Token</span>
                <button
                  onClick={fetchToken}
                  className="flex items-center text-zinc-500 hover:text-teal-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </button>
              </label>
              <div className="flex items-center bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
                <span className="flex-1 px-3 py-2.5 text-[11px] font-mono text-zinc-300 truncate">
                  {loading ? 'Generating token...' : data?.token}
                </span>
                <button
                  onClick={() => data?.token && copy(data.token, setCopiedToken)}
                  className="px-3 py-2.5 border-l border-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 space-y-2 text-[11px]">
            <p className="font-bold text-zinc-300">How to configure in Cursor / Continue.dev:</p>
            <ol className="list-decimal list-inside text-zinc-400 space-y-1">
              <li>Open Settings → AI / Provider</li>
              <li>Set Provider to <span className="text-teal-400 font-mono">OpenAI</span></li>
              <li>Set Base URL to <span className="text-teal-400 font-mono">http://localhost:3000/v1</span></li>
              <li>Paste your API token above into the API Key field</li>
              <li>Pick any model like <span className="text-teal-400 font-mono">opencode/deepseek-v4-flash-free</span></li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}
