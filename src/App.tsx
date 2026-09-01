import { useState, useEffect, useCallback } from 'react';
import type { License, StaffMember, AuditEntry, StaffRole } from './store';
import { LICENSE_SEED, STAFF_SEED, AUDIT_SEED, newId, ts } from './store';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import LicensesPage from './LicensesPage';
import DevicesPage from './DevicesPage';
import StaffPage from './StaffPage';
import AuditLogPage from './AuditLogPage';

export type View = 'dashboard' | 'licenses' | 'devices' | 'staff' | 'audit';
type AuthState = 'login' | 'authenticating' | 'app';

export interface AppData {
  licenses: License[];
  staff: StaffMember[];
  auditLog: AuditEntry[];
  currentUser: StaffMember;
}

export interface AppActions {
  updateLicense: (id: string, changes: Partial<License>) => void;
  addLicense: (license: Omit<License, 'id'>) => void;
  updateStaff: (id: string, changes: Partial<StaffMember>) => void;
  addStaff: (member: Omit<StaffMember, 'id'>) => void;
  addAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'actor' | 'actorRole'>) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

function initFromStorage<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : seed;
  } catch {
    return seed;
  }
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen({ name }: { name: string }) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center fade-in"
      style={{ background: '#080e1a' }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <p
            className="text-3xl font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: '#60a5fa', letterSpacing: '0.18em' }}
          >
            YOGA VISION
          </p>
          <p className="text-xs tracking-[0.3em] uppercase mt-1" style={{ color: '#334155' }}>
            License Management Portal
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 w-64">
          <div
            className="w-full h-0.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full progress-fill"
              style={{ background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)' }}
            />
          </div>
          <p className="text-xs" style={{ color: '#334155' }}>
            Verifying credentials for <span style={{ color: '#60a5fa' }}>{name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: ToastState }) {
  const bg =
    toast.type === 'success'
      ? 'rgba(16,185,129,0.12)'
      : toast.type === 'error'
      ? 'rgba(239,68,68,0.12)'
      : 'rgba(59,130,246,0.12)';
  const border =
    toast.type === 'success'
      ? 'rgba(16,185,129,0.3)'
      : toast.type === 'error'
      ? 'rgba(239,68,68,0.3)'
      : 'rgba(59,130,246,0.3)';
  const color =
    toast.type === 'success' ? '#6ee7b7' : toast.type === 'error' ? '#fca5a5' : '#93c5fd';

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl slide-up"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {toast.type === 'success' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {toast.type === 'error' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {toast.type === 'info' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

// ── Nav icons ─────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="5.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 9l5 5M11 11.5l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconMonitor() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 14.5h5M8 11.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 7.5c1.5 0 3 .8 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconLog() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const ALL_NAV: { id: View; label: string; icon: React.ReactNode; minRole?: StaffRole }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'licenses',  label: 'Licenses',  icon: <IconKey /> },
  { id: 'devices',   label: 'Devices',   icon: <IconMonitor /> },
  { id: 'staff',     label: 'Staff',     icon: <IconUsers />, minRole: 'admin' },
  { id: 'audit',     label: 'Audit Log', icon: <IconLog />,   minRole: 'admin' },
];

function roleRank(r: StaffRole) {
  return r === 'owner' ? 2 : r === 'admin' ? 1 : 0;
}

function Sidebar({
  view,
  onNav,
  user,
  onLogout,
}: {
  view: View;
  onNav: (v: View) => void;
  user: StaffMember;
  onLogout: () => void;
}) {
  const navItems = ALL_NAV.filter(
    (n) => !n.minRole || roleRank(user.role) >= roleRank(n.minRole)
  );

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const roleColor =
    user.role === 'owner' ? '#a78bfa' : user.role === 'admin' ? '#60a5fa' : '#94a3b8';

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-full"
      style={{
        background: '#080e1a',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p
          className="text-lg font-bold tracking-[0.14em] uppercase leading-none"
          style={{ fontFamily: "'Rajdhani', sans-serif", color: '#60a5fa' }}
        >
          YOGA VISION
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            27
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: '#334155' }}>
            License Portal
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-150"
              style={{
                background: active ? 'rgba(96,165,250,0.1)' : 'transparent',
                color: active ? '#93c5fd' : '#475569',
                border: active ? '1px solid rgba(96,165,250,0.18)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = '#475569';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <span style={{ color: active ? '#60a5fa' : 'currentColor' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}
          >
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#cbd5e1' }}>
              {user.name}
            </p>
            <p className="text-[10px] font-medium" style={{ color: roleColor }}>
              {roleLabel}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 transition-colors duration-150"
            style={{ color: '#334155' }}
            title="Sign out"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; }}
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Header bar ────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<View, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard',  sub: 'Overview and system activity' },
  licenses:  { title: 'Licenses',   sub: 'Manage and issue license keys' },
  devices:   { title: 'Devices',    sub: 'Device associations and hardware locks' },
  staff:     { title: 'Staff',      sub: 'Administrator and staff accounts' },
  audit:     { title: 'Audit Log',  sub: 'Full system activity history' },
};

function Header({ view, user }: { view: View; user: StaffMember }) {
  const meta = PAGE_TITLES[view];
  return (
    <header
      className="shrink-0 px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0b1220' }}
    >
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>
          {meta.title}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#334155' }}>
          {meta.sub}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-6 px-2.5 rounded-md flex items-center text-[10px] font-semibold tracking-wide"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
          System Online
        </div>
        <div
          className="h-6 px-2.5 rounded-md flex items-center text-[10px] font-medium"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {user.email}
        </div>
      </div>
    </header>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [view, setView] = useState<View>('dashboard');

  const [licenses, setLicenses] = useState<License[]>(() =>
    initFromStorage('yv27-licenses', LICENSE_SEED)
  );
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    initFromStorage('yv27-staff', STAFF_SEED)
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() =>
    initFromStorage('yv27-audit', AUDIT_SEED)
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => { localStorage.setItem('yv27-licenses', JSON.stringify(licenses)); }, [licenses]);
  useEffect(() => { localStorage.setItem('yv27-staff',   JSON.stringify(staff));    }, [staff]);
  useEffect(() => { localStorage.setItem('yv27-audit',   JSON.stringify(auditLog)); }, [auditLog]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addAudit = useCallback(
    (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'actor' | 'actorRole'>) => {
      const user = currentUser;
      setAuditLog((prev) => [
        {
          id: newId(),
          timestamp: ts(),
          actor: user?.name ?? 'System',
          actorRole: user?.role ?? 'owner',
          ...entry,
        } as AuditEntry,
        ...prev,
      ]);
    },
    [currentUser]
  );

  const updateLicense = useCallback((id: string, changes: Partial<License>) => {
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l)));
  }, []);

  const addLicense = useCallback((license: Omit<License, 'id'>) => {
    setLicenses((prev) => [{ ...license, id: newId() }, ...prev]);
  }, []);

  const updateStaff = useCallback((id: string, changes: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  }, []);

  const addStaff = useCallback((member: Omit<StaffMember, 'id'>) => {
    setStaff((prev) => [...prev, { ...member, id: newId() }]);
  }, []);

  function handleLogin(email: string, password: string): boolean {
    const user = staff.find(
      (s) => s.email === email && s.password === password && s.status === 'active'
    );
    if (!user) return false;

    setAuthState('authenticating');
    setTimeout(() => {
      setCurrentUser(user);
      setStaff((prev) =>
        prev.map((s) => (s.id === user.id ? { ...s, lastLogin: ts() } : s))
      );
      setAuditLog((prev) => [
        {
          id: newId(),
          timestamp: ts(),
          actor: user.name,
          actorRole: user.role,
          action: 'Login',
          targetType: 'auth' as const,
          target: user.email,
          details: 'Successful login from browser session',
          ipAddress: '198.51.100.1',
          severity: 'info' as const,
        },
        ...prev,
      ]);
      setAuthState('app');
    }, 2000);
    return true;
  }

  function handleLogout() {
    setAuthState('login');
    setCurrentUser(null);
    setView('dashboard');
  }

  if (authState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (authState === 'authenticating') return <LoadingScreen name={currentUser?.name ?? '...'} />;

  const appData: AppData = {
    licenses,
    staff,
    auditLog,
    currentUser: currentUser!,
  };

  const appActions: AppActions = {
    updateLicense,
    addLicense,
    updateStaff,
    addStaff,
    addAudit,
    showToast,
  };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar view={view} onNav={setView} user={currentUser!} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header view={view} user={currentUser!} />
        <main className="flex-1 overflow-y-auto">
          <div className="fade-in" key={view}>
            {view === 'dashboard' && <DashboardPage data={appData} actions={appActions} onNav={setView} />}
            {view === 'licenses'  && <LicensesPage  data={appData} actions={appActions} />}
            {view === 'devices'   && <DevicesPage   data={appData} actions={appActions} />}
            {view === 'staff'     && <StaffPage     data={appData} actions={appActions} />}
            {view === 'audit'     && <AuditLogPage  data={appData} />}
          </div>
        </main>
      </div>
      {toast && <Toast toast={toast} />}
    </div>
  );
}
