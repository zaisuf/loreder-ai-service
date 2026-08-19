'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, Check } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callback') || '/';
  const editorName = callbackUrl.startsWith('http') ? 'redirect'
    : callbackUrl === 'close' ? 'App'
    : (callbackUrl.split(':')[0] || 'Editor') + ' Extension';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [authUser, setAuthUser] = useState<{email?: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem('loreder:token', data.token);
      localStorage.setItem('loreder:user', JSON.stringify(data.user));
      setAuthToken(data.token);
      setAuthUser(data.user);
      setSuccess(true);

      // Try auto-redirect immediately (works in some browsers for custom schemes)
      const isCustomScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(callbackUrl) && !callbackUrl.startsWith('http');
      const isHttpUrl = callbackUrl.startsWith('http');
      if (isHttpUrl || isCustomScheme) {
        const separator = callbackUrl.includes('?') ? '&' : '?';
        const finalUrl = `${callbackUrl}${separator}token=${encodeURIComponent(data.token)}`;
        // Try immediately (user action context - best chance of working)
        try { window.location.href = finalUrl; } catch {}
        // Also try after a short delay as fallback
        setTimeout(() => { try { window.location.href = finalUrl; } catch {} }, 500);
      } else if (callbackUrl === 'close') {
        window.parent?.postMessage({ type: 'LOREDER_AUTH_SUCCESS', token: data.token, user: data.user }, '*');
        window.opener?.postMessage({ type: 'LOREDER_AUTH_SUCCESS', token: data.token, user: data.user }, '*');
        setTimeout(() => window.close(), 500);
      }

    } catch (err) {
      setError('Connection error. Make sure Codilore is running.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 font-sans">

      {/* Brand */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-400 p-0.5 shadow-xl shadow-teal-500/20 mb-2">
          <div className="w-full h-full bg-[#09090b] rounded-[14px] flex items-center justify-center">
            <Zap className="w-6 h-6 text-teal-400" />
          </div>
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Codilore</h1>
        <p className="text-xs text-zinc-400 font-mono">Sign in to continue</p>
        {callbackUrl && callbackUrl !== '/' && (
          <p className="text-[11px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
          Authenticating for {editorName}
          </p>
        )}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl space-y-5">

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Signed In Successfully!</h2>
              {authUser?.email && <p className="text-xs text-zinc-400 mt-1">{authUser.email}</p>}
            </div>
            {(callbackUrl.includes('://') && !callbackUrl.startsWith('http')) && (
              <div className="space-y-2">
                <a
                  href={`${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(authToken)}`}
                  className="block w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs text-center transition-all shadow-lg shadow-teal-500/20"
                >
                  ↩ Return to {editorName}
                </a>
                <p className="text-[10px] text-zinc-500">If the editor didn&apos;t open automatically, click the button above.</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-[11px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="loreder123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Default password: <span className="font-mono text-zinc-400">loreder123</span></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-zinc-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-teal-500/20"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500">
          Codilore — Local AI Aggregator Service
        </div>
      </div>

    </div>
  );
}
