import { useState, useEffect } from 'react';

interface Props {
  onLogin: (email: string, password: string, remember: boolean) => boolean;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [rememberMe, setRememberMe]   = useState(true);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('yv27-saved-email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('yv27-saved-email', email.trim());
    } else {
      localStorage.removeItem('yv27-saved-email');
    }

    const ok = onLogin(email.trim(), password.trim(), rememberMe);
    if (!ok) {
      setError('Invalid email or password.');
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
          <h2 className="text-base font-semibold mb-1" style={{ color: '#e2e8f0' }}>
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
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                style={{
                  background: '#0d1828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                }}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#0d1828] border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Remember my login
                </span>
              </label>
            </div>

            {error && (
              <div
                className="rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <span>⚠️ {error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mt-1 cursor-pointer"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2563eb'; }}
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-6" style={{ color: '#334155' }}>
          Protected by Hardware ID & Dual-Signature Security
        </p>
      </div>
    </div>
  );
}
