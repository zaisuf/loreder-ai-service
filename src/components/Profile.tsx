'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Shield, Edit3, Check, Save, Camera, 
  Copy, Code, ExternalLink, Zap, Activity, Key
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio: string;
  createdAt: string;
  apiKey: string;
}

export const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', bio: '', role: '' });
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [stats, setStats] = useState({ totalRequests: 0, activeKeysCount: 0, totalTokens: 0 });

  useEffect(() => {
    fetchUser();
    fetchStats();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/user');
    const data = await res.json();
    setUser(data);
    setForm({ name: data.name, email: data.email, bio: data.bio || '', role: data.role || '' });
  };

  const fetchStats = async () => {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    setStats({
      totalRequests: data.totalRequests || 0,
      activeKeysCount: data.activeKeysCount || 0,
      totalTokens: data.totalTokens || 0
    });
  };

  const handleSave = async () => {
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const updated = await res.json();
    setUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copyKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const avatarInitials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AI';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center">
          <User className="w-4 h-4 mr-2 text-teal-400" />
          My Profile
        </h3>
        <p className="text-xs text-zinc-400 mt-1">Manage your account, view usage, and connect IDE extensions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN: Avatar & Quick Stats ── */}
        <div className="space-y-4">

          {/* Avatar Card */}
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-400 p-0.5 shadow-xl shadow-teal-500/20">
                <div className="w-full h-full bg-[#18181b] rounded-[14px] flex items-center justify-center text-2xl font-extrabold text-teal-300">
                  {avatarInitials}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">{user?.name || 'Loading...'}</h2>
              <p className="text-[11px] text-teal-400 font-mono">{user?.role}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Member since {memberSince}</p>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Usage Overview</h4>
            {[
              { label: 'Total Requests', value: stats.totalRequests.toLocaleString(), icon: Activity },
              { label: 'API Keys Active', value: stats.activeKeysCount, icon: Key },
              { label: 'Total Tokens', value: (stats.totalTokens / 1000).toFixed(1) + 'K', icon: Zap },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center text-[11px] text-zinc-400">
                    <Icon className="w-3 h-3 mr-2 text-zinc-600" />
                    {s.label}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-200">{s.value}</span>
                </div>
              );
            })}
          </div>

          {/* VS Code Connect */}
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center">
              <Code className="w-3.5 h-3.5 mr-1.5 text-teal-400" /> IDE Extensions
            </h4>
            <p className="text-[11px] text-zinc-400">Connect VS Code or Cursor IDE to your Codilore instance.</p>
            <a
              href="/auth/vscode"
              className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold py-2 rounded-xl text-[11px] flex items-center justify-center space-x-2 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open VS Code Auth Page</span>
            </a>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Edit Form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Profile Edit Card */}
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-zinc-200">Account Details</h4>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center text-[11px] text-zinc-400 hover:text-teal-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Edit3 className="w-3 h-3 mr-1.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center text-[11px] bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    {saved ? <Check className="w-3 h-3 mr-1.5" /> : <Save className="w-3 h-3 mr-1.5" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Display Name</label>
                <input
                  type="text"
                  value={form.name}
                  disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full bg-[#18181b] border rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none transition-colors ${editing ? 'border-zinc-700 focus:border-teal-500' : 'border-zinc-800/60 text-zinc-400 cursor-default'}`}
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full bg-[#18181b] border rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none transition-colors ${editing ? 'border-zinc-700 focus:border-teal-500' : 'border-zinc-800/60 text-zinc-400 cursor-default'}`}
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Role / Title</label>
                <input
                  type="text"
                  value={form.role}
                  disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={`w-full bg-[#18181b] border rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none transition-colors ${editing ? 'border-zinc-700 focus:border-teal-500' : 'border-zinc-800/60 text-zinc-400 cursor-default'}`}
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">User ID</label>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full bg-[#18181b] border border-zinc-800/60 rounded-xl px-3 py-2.5 text-zinc-500 font-mono cursor-default"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-zinc-400 mb-1.5 font-medium">Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className={`w-full bg-[#18181b] border rounded-xl px-3 py-2.5 text-zinc-200 resize-none focus:outline-none transition-colors ${editing ? 'border-zinc-700 focus:border-teal-500' : 'border-zinc-800/60 text-zinc-400 cursor-default'}`}
                />
              </div>
            </div>
          </div>

          {/* Master API Key Card */}
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-200 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Master API Key
              </h4>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">ACTIVE</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Use this key as the <code className="text-teal-400 font-mono">Authorization: Bearer</code> header when calling your Codilore endpoint.
            </p>
            <div className="flex items-center bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden">
              <span className="flex-1 px-3 py-2.5 text-[11px] font-mono text-zinc-300 truncate">
                {user?.apiKey || '...'}
              </span>
              <button
                onClick={copyKey}
                className="px-3 py-2.5 border-l border-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
