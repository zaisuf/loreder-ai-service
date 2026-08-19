'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Search, Plus, Sparkles, Check, Server } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
  pricing: { prompt: number; completion: number };
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-teal-400" />
            Registered Upstream Models ({models.length})
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            OpenCode Zen models catalog automatically exposed on `/v1/models`.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-500/20 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="bg-[#121215] p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between hover:border-teal-500/40 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    {model.provider}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-2">{model.name}</h4>
                </div>
                {model.isFree && (
                  <span className="inline-flex items-center text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3 mr-1" /> FREE
                  </span>
                )}
              </div>

              <div className="mt-2.5">
                <code className="text-[11px] font-mono text-zinc-400 bg-[#18181b] px-2 py-1 rounded border border-zinc-800 block truncate">
                  {model.id}
                </code>
              </div>

              <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {model.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span className="flex items-center">
                <Server className="w-3 h-3 mr-1 text-sky-400" />
                {(model.contextLength / 1024).toFixed(0)}k context
              </span>
              <span className="text-teal-400 font-semibold">$0.00 / Free</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800 w-full max-w-md space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center">
              <Sparkles className="w-4 h-4 text-teal-400 mr-2" /> Add Upstream Model ID
            </h3>

            <form onSubmit={handleAddModel} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Model ID (e.g. opencode/custom-model)</label>
                <input
                  type="text"
                  required
                  placeholder="opencode/deepseek-v4-flash-free"
                  value={newModel.id}
                  onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Model Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="DeepSeek V4 Flash Free"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Provider Name</label>
                <input
                  type="text"
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Context Window (tokens)</label>
                <input
                  type="number"
                  value={newModel.contextLength}
                  onChange={(e) => setNewModel({ ...newModel, contextLength: parseInt(e.target.value) || 32768 })}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-teal-500/20"
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
