'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Shield, Check, Save } from 'lucide-react';

interface ProviderConfig {
  id: string;
  name: string;
  type: 'opencode' | 'openrouter' | 'custom';
  baseUrl: string;
  apiKey: string;
  isEnabled: boolean;
}

export const Settings: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleUpdate = async (id: string, updates: Partial<ProviderConfig>) => {
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setSaveSuccess(id);
        setTimeout(() => setSaveSuccess(null), 2500);
        fetchProviders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-white flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-teal-400" />
          Provider Connections & Settings
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Configure upstream model provider credentials and custom endpoints.
        </p>
      </div>

      <div className="space-y-5">
        {providers.map((prov) => (
          <div key={prov.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{prov.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">ID: {prov.id}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <button
                  onClick={() => handleUpdate(prov.id, { isEnabled: !prov.isEnabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    prov.isEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {prov.isEnabled ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Upstream Base URL</label>
                <input
                  type="text"
                  value={prov.baseUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setProviders(prev => prev.map(p => p.id === prov.id ? { ...p, baseUrl: newUrl } : p));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>Upstream Provider API Key (Optional for OpenCode Zen Free Tier)</span>
                  <Shield className="w-3 h-3 text-teal-400" />
                </label>
                <input
                  type="password"
                  placeholder="e.g. sk-..."
                  value={prov.apiKey}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    setProviders(prev => prev.map(p => p.id === prov.id ? { ...p, apiKey: newKey } : p));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleUpdate(prov.id, { baseUrl: prov.baseUrl, apiKey: prov.apiKey })}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-500/20"
              >
                {saveSuccess === prov.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
