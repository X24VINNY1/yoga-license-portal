import { useState, useMemo } from 'react';
import type { AppData, AppActions } from './App';
import type { AuditSeverity, AuditTarget } from './store';
import { fmtDateTime } from './store';

interface Props { data: AppData; actions: AppActions; }

const SEVERITY_MAP: Record<AuditSeverity, { dot: string; label: string; bg: string; border: string }> = {
  info:     { dot: '#3b82f6', label: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  warning:  { dot: '#f59e0b', label: '#fcd34d', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  critical: { dot: '#ef4444', label: '#fca5a5', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)' },
};

const TARGET_MAP: Record<AuditTarget, string> = {
  license: '#60a5fa',
  staff:   '#c4b5fd',
  device:  '#6ee7b7',
  auth:    '#94a3b8',
  system:  '#475569',
};

export default function AuditLogPage({ data, actions }: Props) {
  const { auditLog, currentUser } = data;
  const isOwner = currentUser.role === 'owner';

  const [search, setSearch]               = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterTarget, setFilterTarget]     = useState<string>('all');
  const [filterActor, setFilterActor]       = useState<string>('all');
  const [confirmClear, setConfirmClear]     = useState(false);

  const actors = useMemo(
    () => Array.from(new Set(auditLog.map((e) => e.actor))).sort(),
    [auditLog]
  );

  const filtered = useMemo(() => {
    let list = auditLog;
    if (filterSeverity !== 'all') list = list.filter((e) => e.severity === filterSeverity);
    if (filterTarget   !== 'all') list = list.filter((e) => e.targetType === filterTarget);
    if (filterActor    !== 'all') list = list.filter((e) => e.actor === filterActor);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [auditLog, search, filterSeverity, filterTarget, filterActor]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Events', value: auditLog.length, dot: '#3b82f6' },
          { label: 'Warnings',     value: auditLog.filter((e) => e.severity === 'warning').length,  dot: '#f59e0b' },
          { label: 'Critical',     value: auditLog.filter((e) => e.severity === 'critical').length, dot: '#ef4444' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#475569' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3.5 py-2 rounded-xl"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-xs">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, targets, actors…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#e2e8f0' }}
          />
        </div>

        {([
          { label: 'Severity', value: filterSeverity, set: setFilterSeverity, opts: ['all', 'info', 'warning', 'critical'] },
          { label: 'Type',     value: filterTarget,   set: setFilterTarget,   opts: ['all', 'license', 'staff', 'device', 'auth', 'system'] },
        ] as const).map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none appearance-none"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}
          >
            {f.opts.map((o) => (
              <option key={o} value={o} style={{ background: '#111827' }}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        ))}

        {actors.length > 1 && (
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none appearance-none"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}
          >
            <option value="all">All Actors</option>
            {actors.map((a) => (
              <option key={a} value={a} style={{ background: '#111827' }}>{a}</option>
            ))}
          </select>
        )}

        {isOwner && (
          <button
            onClick={() => setConfirmClear(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[rgba(239,68,68,0.12)] text-[#fca5a5] hover:bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.25)] transition-all cursor-pointer"
          >
            Clear Audit Log
          </button>
        )}
      </div>

      {confirmClear && isOwner && (
        <div className="mb-4 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] flex items-center justify-between">
          <p className="text-xs text-[#fca5a5]">
            ⚠️ Are you sure you want to permanently clear all audit history? This action is exclusive to the Owner.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg text-xs bg-[rgba(255,255,255,0.05)] text-[#cbd5e1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                actions.clearAuditLog();
                actions.showToast('Audit log cleared', 'info');
                setConfirmClear(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#dc2626] text-white cursor-pointer"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#0b1220' }}>
                {['Timestamp', 'Severity', 'Action', 'Target', 'Actor', 'Details', 'IP Address', ...(isOwner ? [''] : [])].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase"
                    style={{ color: '#334155', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 7} className="px-4 py-8 text-center text-xs text-[#64748b]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const sc = SEVERITY_MAP[entry.severity];
                  const tc = TARGET_MAP[entry.targetType] ?? '#94a3b8';
                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f1520' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d2e'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f1520'; }}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: '#475569' }}>
                          {fmtDateTime(entry.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{ background: sc.bg, color: sc.label, border: `1px solid ${sc.border}` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          {entry.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{entry.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold" style={{ color: tc }}>{entry.target}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: '#64748b' }}>
                          {entry.actor}{' '}
                          <span style={{ color: '#334155', fontSize: '10px' }}>({entry.actorRole})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs truncate" style={{ color: '#64748b' }} title={entry.details}>
                          {entry.details}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono" style={{ color: '#334155' }}>{entry.ipAddress}</code>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              actions.deleteAuditEntry(entry.id);
                              actions.showToast('Log entry removed', 'info');
                            }}
                            className="text-xs px-2 py-1 rounded bg-[rgba(239,68,68,0.1)] text-[#fca5a5] hover:bg-[rgba(239,68,68,0.25)] cursor-pointer"
                            title="Delete log entry"
                          >
                            🗑
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#0b1220', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#334155' }}>
            Showing {filtered.length} of {auditLog.length} events
          </p>
          <button
            className="text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
            onClick={() => {
              const csv = [
                ['Timestamp', 'Severity', 'Action', 'Target', 'Actor', 'Details', 'IP'].join(','),
                ...filtered.map((e) =>
                  [fmtDateTime(e.timestamp), e.severity, e.action, e.target, e.actor, `"${e.details}"`, e.ipAddress].join(',')
                ),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
