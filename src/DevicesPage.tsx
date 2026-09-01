import { useState } from 'react';
import type { AppData, AppActions } from './App';
import type { License } from './store';
import { fmtDate, fmtDateTime } from './store';

interface Props { data: AppData; actions: AppActions; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl scale-in"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: '#475569' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ResetModal({
  license, onClose, actions,
}: {
  license: License; onClose: () => void; actions: AppActions;
}) {
  function confirm() {
    actions.updateLicense(license.id, {
      deviceId: null,
      deviceName: null,
      devicePlatform: null,
      deviceAssociatedAt: null,
    });
    actions.addAudit({
      action: 'Device Reset',
      targetType: 'device',
      target: license.key,
      details: `Device association removed from license for ${license.assignedTo} (was: ${license.deviceName})`,
      ipAddress: '198.51.100.1',
      severity: 'warning',
    });
    actions.showToast('Device association removed');
    onClose();
  }

  return (
    <Modal title="Reset Device Association" onClose={onClose}>
      <div className="space-y-4">
        <div
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: '#fcd34d' }}>Confirm device reset</p>
          <p className="text-xs" style={{ color: '#78716c' }}>
            This will remove the hardware lock for this license. The customer will be able to
            activate the license on a new device.
          </p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'License', value: license.key },
            { label: 'Customer', value: license.assignedTo },
            { label: 'Device', value: license.deviceName ?? '—' },
            { label: 'Platform', value: license.devicePlatform ?? '—' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-20 text-xs shrink-0" style={{ color: '#475569' }}>{r.label}</span>
              <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.15)'; }}
          >
            Reset Device
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function DevicesPage({ data, actions }: Props) {
  const { licenses, currentUser } = data;
  const [resetTarget, setResetTarget] = useState<License | null>(null);
  const [showAll, setShowAll] = useState(false);

  const canManage = currentUser.role === 'owner' || currentUser.role === 'admin';

  const withDevice    = licenses.filter((l) => l.deviceId);
  const withoutDevice = licenses.filter((l) => !l.deviceId && l.status === 'active');
  const displayed     = showAll ? licenses : [...withDevice, ...withoutDevice];

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Devices Linked',       value: withDevice.length,    dot: '#22c55e' },
          { label: 'Awaiting Association',  value: withoutDevice.length, dot: '#f59e0b' },
          { label: 'Total Licenses',        value: licenses.length,      dot: '#3b82f6' },
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

      {/* Filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>
          {showAll ? 'All licenses' : 'Licenses with device activity'}
        </p>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
        >
          {showAll ? 'Show relevant only' : 'Show all licenses'}
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#0b1220' }}>
                {['License Key', 'Customer', 'Status', 'Device Name', 'Platform', 'Device ID', 'Associated', 'Actions'].map((col) => (
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
              {displayed.map((l) => {
                const linked = !!l.deviceId;
                return (
                  <tr
                    key={l.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f1520' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d2e'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f1520'; }}
                  >
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono" style={{ color: '#60a5fa' }}>{l.key}</code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{l.assignedTo}</p>
                      <p className="text-[11px]" style={{ color: '#475569' }}>{l.assignedEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: linked ? '#22c55e' : '#475569' }}
                        />
                        <span className="text-xs" style={{ color: linked ? '#86efac' : '#475569' }}>
                          {linked ? 'Linked' : 'Unlinked'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: linked ? '#cbd5e1' : '#334155' }}>
                        {l.deviceName ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: '#475569' }}>{l.devicePlatform ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {l.deviceId ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[rgba(56,189,248,0.1)] text-[#38bdf8] border border-[rgba(56,189,248,0.2)]">
                            {l.deviceId}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(l.deviceId!);
                              actions.showToast('HWID copied', 'info');
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#93c5fd] hover:bg-[rgba(255,255,255,0.12)] cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#475569]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: '#475569' }}>
                        {l.deviceAssociatedAt ? fmtDate(l.deviceAssociatedAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {linked && canManage && (
                        <button
                          onClick={() => setResetTarget(l)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.17)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)'; }}
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className="px-5 py-3"
          style={{ background: '#0b1220', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#334155' }}>
            {withDevice.length} linked · {withoutDevice.length} unlinked active
          </p>
        </div>
      </div>

      {resetTarget && (
        <ResetModal
          license={resetTarget}
          onClose={() => setResetTarget(null)}
          actions={actions}
        />
      )}
    </div>
  );
}
