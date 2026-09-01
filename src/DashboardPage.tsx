import type { AppData, AppActions, View } from './App';
import { fmtDateTime } from './store';
import type { AuditSeverity } from './store';

interface Props {
  data: AppData;
  actions: AppActions;
  onNav: (v: View) => void;
}

function StatCard({
  label, value, sub, dot,
}: {
  label: string; value: number | string; sub: string; dot: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
        <span className="text-xs font-medium tracking-wide" style={{ color: '#475569' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#e2e8f0', lineHeight: 1 }}>{value}</p>
      <p className="text-xs" style={{ color: '#334155' }}>{sub}</p>
    </div>
  );
}

const SEVERITY_COLOR: Record<AuditSeverity, { dot: string; label: string }> = {
  info:     { dot: '#3b82f6', label: '#64748b'  },
  warning:  { dot: '#f59e0b', label: '#78716c'  },
  critical: { dot: '#ef4444', label: '#7f1d1d'  },
};

export default function DashboardPage({ data, onNav }: Props) {
  const { licenses, staff, auditLog } = data;

  const active    = licenses.filter((l) => l.status === 'active').length;
  const expired   = licenses.filter((l) => l.status === 'expired').length;
  const suspended = licenses.filter((l) => l.status === 'suspended').length;
  const revoked   = licenses.filter((l) => l.status === 'revoked').length;
  const total     = licenses.length;
  const withDevice = licenses.filter((l) => l.deviceId).length;
  const activeStaff = staff.filter((s) => s.status === 'active').length;

  const recentActivity = auditLog.slice(0, 8);

  const statusDistribution = [
    { label: 'Active',    count: active,    color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Expired',   count: expired,   color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
    { label: 'Suspended', count: suspended, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Revoked',   count: revoked,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Licenses" value={active}    sub={`${total} total issued`}  dot="#22c55e" />
        <StatCard label="Expired"         value={expired}   sub="Awaiting renewal"          dot="#64748b" />
        <StatCard label="Suspended"       value={suspended} sub="Pending review"            dot="#f59e0b" />
        <StatCard label="Revoked"         value={revoked}   sub="Permanently disabled"      dot="#ef4444" />
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Recent activity */}
        <div
          className="col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Recent Activity</p>
            <button
              onClick={() => onNav('audit')}
              className="text-xs transition-colors duration-150"
              style={{ color: '#3b82f6' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#60a5fa'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#3b82f6'; }}
            >
              View all &rarr;
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {recentActivity.map((entry) => {
              const sc = SEVERITY_COLOR[entry.severity];
              return (
                <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: sc.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>
                        {entry.action}
                      </span>
                      <span className="text-xs truncate" style={{ color: '#334155' }}>
                        {entry.target}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: '#475569' }}>
                        {entry.actor}
                      </span>
                      <span style={{ color: '#1e293b' }}>·</span>
                      <span className="text-[11px]" style={{ color: '#334155' }}>
                        {fmtDateTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* License distribution */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>
              License Distribution
            </p>
            <div className="space-y-2.5">
              {statusDistribution.map((s) => {
                const pct = total ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#64748b' }}>{s.label}</span>
                      <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{s.count}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>
              Quick Stats
            </p>
            <div className="space-y-3">
              {[
                { label: 'Active Staff',       value: activeStaff },
                { label: 'Devices Linked',     value: withDevice },
                { label: 'Unlinked Licenses',  value: active - withDevice < 0 ? 0 : active - withDevice },
                { label: 'Total Audit Events', value: auditLog.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#475569' }}>{row.label}</span>
                  <span className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System status */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>
              System Status
            </p>
            <div className="space-y-2.5">
              {[
                { service: 'License Engine',  status: 'Operational' },
                { service: 'Authentication',  status: 'Operational' },
                { service: 'Audit Engine',    status: 'Active' },
                { service: 'Device Registry', status: 'Operational' },
              ].map((row) => (
                <div key={row.service} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#475569' }}>{row.service}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                    <span className="text-[11px] font-medium" style={{ color: '#6ee7b7' }}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
