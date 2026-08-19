'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Search, Plus, Sparkles, Check, Server } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
  pricing: {
    prompt: number;
    completion: number;
  };
  description: string;
}

export const ModelCatalog: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newModel, setNewModel] = useState({
    id: '',
    name: '',
    provider: 'OpenCode Zen',
    contextLength: 32768,
    description: ''
  });

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.id || !newModel.name) return;

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewModel({ id: '', name: '', provider: 'OpenCode Zen', contextLength: 32768, description: '' });
        fetchModels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-teal-400" />
            Model Catalog & Registry
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse and connect models from OpenCode Zen free tier and custom upstream providers.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-teal-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    {model.provider}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2">{model.name}</h4>
                </div>
                {model.isFree && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3 mr-1" /> FREE
                  </span>
                )}
              </div>

              <div className="mt-3">
                <code className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 block truncate">
                  {model.id}
                </code>
              </div>

              <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                {model.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center">
                <Server className="w-3.5 h-3.5 mr-1 text-sky-400" />
                {(model.contextLength / 1024).toFixed(0)}k context
              </span>
              <span className="text-teal-400 font-semibold">$0.00 / 1M tokens</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 p-6 rounded-2xl border border-slate-800 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Sparkles className="w-4 h-4 text-teal-400 mr-2" /> Register New Upstream Model
            </h3>

            <form onSubmit={handleAddModel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Model ID (e.g. opencode/custom-model)</label>
                <input
                  type="text"
                  required
                  placeholder="opencode/deepseek-r1-free"
                  value={newModel.id}
                  onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Model Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="DeepSeek R1 Free"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Provider Name</label>
                <input
                  type="text"
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Context Window Length (tokens)</label>
                <input
                  type="number"
                  value={newModel.contextLength}
                  onChange={(e) => setNewModel({ ...newModel, contextLength: parseInt(e.target.value) || 32768 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-500/20"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
