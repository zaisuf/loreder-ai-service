'use client';

import React, { useState } from 'react';
import { Activity, Sparkles, Cpu, Key, Settings as SettingsIcon, Terminal, Copy, Check, Zap, ShieldCheck } from 'lucide-react';
import { Analytics } from '@/components/Analytics';
import { Playground } from '@/components/Playground';
import { ModelCatalog } from '@/components/ModelCatalog';
import { KeyManager } from '@/components/KeyManager';
import { Settings } from '@/components/Settings';
import { Docs } from '@/components/Docs';

type Tab = 'analytics' | 'playground' | 'models' | 'keys' | 'settings' | 'docs';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('playground');
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText('http://localhost:3000/v1');
    setCopiedBaseUrl(true);
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  const navItems = [
    { id: 'playground', label: 'Playground', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'models', label: 'Models Catalog', icon: Cpu },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'settings', label: 'Provider Settings', icon: SettingsIcon },
    { id: 'docs', label: 'SDK Docs', icon: Terminal },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">Loreder AI</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Aggregator v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">OpenCode Zen Router & Gateway</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">OpenCode Zen Engine:</span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>

            {/* Base URL Quick Copy */}
            <button
              onClick={handleCopyBaseUrl}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-xs font-mono transition-all"
            >
              <span>http://localhost:3000/v1</span>
              {copiedBaseUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Subbar */}
      <div className="border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-md shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'playground' && <Playground />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'models' && <ModelCatalog />}
        {activeTab === 'keys' && <KeyManager />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'docs' && <Docs />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Loreder AI Aggregator — Powered by OpenCode Zen Free Models</span>
          <span className="font-mono text-slate-600">OpenAI API Compatible Endpoint: /v1/chat/completions</span>
        </div>
      </footer>
    </div>
  );
}
