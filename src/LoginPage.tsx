import { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => boolean;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const ok = onLogin(email, password);
    if (!ok) {
      setError('Invalid credentials or account is disabled.');
      setLoading(false);
    }
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center"
      style={{ background: '#080e1a', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4 slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <p
            className="text-2xl font-bold tracking-[0.16em] uppercase"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: '#60a5fa' }}
          >
            YOGA VISION
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(96,165,250,0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(96,165,250,0.2)',
              }}
            >
              27
            </span>
            <span className="text-xs tracking-wider" style={{ color: '#334155' }}>
              License Management Portal
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-7 py-7"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: '#e2e8f0' }}
          >
            Administrator Sign In
          </h2>
          <p className="text-xs mb-6" style={{ color: '#475569' }}>
            Access is restricted to authorized personnel only.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yogavision.app"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                style={{
                  background: '#0d1828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                style={{
                  background: '#0d1828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mt-1 cursor-pointer"
              style={{
                background: loading ? 'rgba(37,99,248,0.5)' : '#0284c7',
                color: loading ? 'rgba(255,255,255,0.5)' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = '#0369a1';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = '#0284c7';
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] mt-6" style={{ color: '#334155' }}>
          &copy; 2026 Yoga Vision. All rights reserved. Hardware-Locked License Verification System.
        </p>
      </div>
    </div>
  );
}
