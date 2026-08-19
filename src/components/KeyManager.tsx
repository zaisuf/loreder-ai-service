'use client';

import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, Trash2, ShieldCheck } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  totalRequests: number;
  totalTokens: number;
  status: 'active' | 'revoked';
}

export const KeyManager: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeys(data);
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName || 'New API Key' })
      });
      if (res.ok) {
        setKeyName('');
        setShowCreateModal(false);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key?')) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (keyStr: string, id: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center">
            <Key className="w-4 h-4 mr-2 text-teal-400" />
            API Keys & Authentication
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Generate custom bearer tokens (`sk-loreder-...`) for OpenAI SDKs, cURL, and VS Code.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate API Key</span>
        </button>
      </div>

      <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="text-zinc-400 bg-[#18181b] uppercase font-semibold text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Secret Key</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requests</th>
                <th className="py-3 px-4">Tokens Used</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{k.name}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-300">
                    <div className="flex items-center space-x-2">
                      <span>{k.key.slice(0, 14)}...{k.key.slice(-4)}</span>
                      <button
                        onClick={() => handleCopy(k.key, k.id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-400 transition-colors"
                        title="Copy Key"
                      >
                        {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {k.status === 'active' ? (
                      <span className="inline-flex items-center text-emerald-400 font-medium text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-400 font-medium text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">{k.totalRequests.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">{k.totalTokens.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {k.status === 'active' && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800 w-full max-w-md space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center">
              <Key className="w-4 h-4 text-teal-400 mr-2" /> Generate New API Key
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cursor IDE, VS Code Extension"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-teal-500/20"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
