'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Activity, Cpu, Key, Settings as SettingsIcon, Terminal, 
  Zap, Copy, Check, User
} from 'lucide-react';
import { Analytics } from '@/components/Analytics';
import { Playground } from '@/components/Playground';
import { ModelCatalog } from '@/components/ModelCatalog';
import { KeyManager } from '@/components/KeyManager';
import { Settings } from '@/components/Settings';
import { Docs } from '@/components/Docs';
import { Profile } from '@/components/Profile';

type Tab = 'playground' | 'analytics' | 'models' | 'keys' | 'settings' | 'docs' | 'profile';

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
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'docs', label: 'Docs', icon: Terminal },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. FAR-LEFT NARROW DOCK (Reference UI Column 1) */}
      <aside className="w-14 bg-[#09090b] border-r border-zinc-800/80 flex flex-col justify-between items-center py-3.5 z-50 flex-shrink-0">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div 
            onClick={() => setActiveTab('playground')}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-400 p-0.5 flex items-center justify-center cursor-pointer shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform"
            title="Codilore Router"
          >
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
          </div>

          <div className="w-8 h-[1px] bg-zinc-800 my-1" />

          {/* Navigation Icons Dock */}
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-teal-400 border border-zinc-700/80 shadow-md shadow-zinc-950'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Copy Base URL + User Avatar */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleCopyBaseUrl}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-teal-400 flex items-center justify-center transition-colors"
            title="Copy OpenAI Base URL: http://localhost:3000/v1"
          >
            {copiedBaseUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold font-mono transition-all ${
              activeTab === 'profile'
                ? 'bg-teal-500/30 border-teal-500/60 text-teal-200 shadow-md shadow-teal-500/20'
                : 'bg-teal-500/20 border-teal-500/40 text-teal-300 hover:bg-teal-500/30'
            }`}
            title="My Profile"
          >
            ZA
          </button>
        </div>

      </aside>

      {/* 2. MAIN VIEWPANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
        
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 bg-[#121215] px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              OpenCode Zen Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-zinc-300">http://localhost:3000/v1</span>
            </div>
          </div>
        </header>

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'playground' && <Playground />}
          {activeTab === 'analytics' && <div className="p-6"><Analytics /></div>}
          {activeTab === 'models' && <div className="p-6"><ModelCatalog /></div>}
          {activeTab === 'keys' && <div className="p-6"><KeyManager /></div>}
          {activeTab === 'settings' && <div className="p-6"><Settings /></div>}
          {activeTab === 'docs' && <div className="p-6"><Docs /></div>}
          {activeTab === 'profile' && <div className="p-6"><Profile /></div>}
        </main>

      </div>

    </div>
  );
}
