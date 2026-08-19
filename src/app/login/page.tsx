'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callback') || '/';
  const editorName = callbackUrl.startsWith('http') ? 'redirect'
    : callbackUrl === 'close' ? 'App'
    : (callbackUrl.split(':')[0] || 'Editor') + ' Extension';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [authUser, setAuthUser] = useState<{email?: string; name?: string; image?: string} | null>(null);

  const handleRedirect = (token: string, user: any) => {
    localStorage.setItem('loreder:token', token);
    localStorage.setItem('loreder:user', JSON.stringify(user));
    setAuthToken(token);
    setAuthUser(user);
    setSuccess(true);

    const isCustomScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(callbackUrl) && !callbackUrl.startsWith('http');
    const isHttpUrl = callbackUrl.startsWith('http');
    if (isHttpUrl || isCustomScheme) {
      const separator = callbackUrl.includes('?') ? '&' : '?';
      const extraParams = user?.name ? `&name=${encodeURIComponent(user.name)}&image=${encodeURIComponent(user.image || '')}` : '';
      const finalUrl = `${callbackUrl}${separator}token=${encodeURIComponent(token)}${extraParams}`;
      try { window.location.href = finalUrl; } catch {}
      setTimeout(() => { try { window.location.href = finalUrl; } catch {} }, 500);
    } else if (callbackUrl === 'close') {
      window.parent?.postMessage({ type: 'LOREDER_AUTH_SUCCESS', token, user }, '*');
      window.opener?.postMessage({ type: 'LOREDER_AUTH_SUCCESS', token, user }, '*');
      setTimeout(() => window.close(), 500);
    }
  };

  // Check if already authenticated via NextAuth / Google
  useEffect(() => {
    let isMounted = true;
    async function checkExistingAuth() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user?.apiKey) {
            handleRedirect(data.user.apiKey, data.user);
          }
        }
      } catch {}
    }
    checkExistingAuth();
    return () => { isMounted = false; };
  }, [callbackUrl]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: window.location.href });
    } catch (err: any) {
      setError(err?.message || 'Failed to start Google sign-in. Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured in .env.local.');
      setGoogleLoading(false);
    }
  };

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

      handleRedirect(data.token, data.user);
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
                  href={`${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(authToken)}${authUser?.name ? `&name=${encodeURIComponent(authUser.name)}&image=${encodeURIComponent(authUser.image || '')}` : ''}`}
                  className="block w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs text-center transition-all shadow-lg shadow-teal-500/20"
                >
                  ↩ Return to {editorName}
                </a>
                <p className="text-[10px] text-zinc-500">If the editor didn&apos;t open automatically, click the button above.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-[11px]">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C1.1 8.8.7 10.4.7 12s.4 3.2 1.2 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-zinc-800"></div>
              <span className="px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">or email</span>
              <div className="flex-1 border-t border-zinc-800"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Password</label>
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
                disabled={loading || googleLoading}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-zinc-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <span>{loading ? 'Signing In...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500">
          Codilore — Local AI Aggregator Service
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 text-xs">
        Loading Codilore...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
