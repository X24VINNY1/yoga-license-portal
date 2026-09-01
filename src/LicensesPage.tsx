import { useState, useMemo } from 'react';
import type { AppData, AppActions } from './App';
import type { License, LicenseStatus } from './store';
import { generateKey, newId, fmtDate, fmtDateTime, PLANS, DURATION_DAYS, addDaysFromNow } from './store';

interface Props { data: AppData; actions: AppActions; }

// ── Status & Plan Badges ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LicenseStatus }) {
  const map: Record<LicenseStatus, { bg: string; border: string; dot: string; text: string; label: string }> = {
    active:    { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   dot: '#22c55e', text: '#86efac', label: 'Active' },
    expired:   { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.2)', dot: '#64748b', text: '#94a3b8', label: 'Expired' },
    suspended: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  dot: '#f59e0b', text: '#fcd34d', label: 'Suspended' },
    revoked:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444', text: '#fca5a5', label: 'Revoked' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Starter:      { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
    Professional: { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd' },
    Enterprise:   { bg: 'rgba(139,92,246,0.12)',  color: '#c4b5fd' },
  };
  const s = map[plan] ?? map.Starter;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {plan}
    </span>
  );
}

function Btn({
  children, variant = 'ghost', onClick, disabled,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base: Record<string, { bg: string; color: string; hoverBg: string }> = {
    primary: { bg: '#2563eb', color: '#fff', hoverBg: '#1d4ed8' },
    ghost:   { bg: 'rgba(255,255,255,0.05)', color: '#64748b', hoverBg: 'rgba(255,255,255,0.08)' },
    danger:  { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5', hoverBg: 'rgba(239,68,68,0.15)' },
  };
  const s = base[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
      style={{
        background: s.bg,
        color: s.color,
        border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.08)' : variant === 'danger' ? '1px solid rgba(239,68,68,0.2)' : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = s.hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = s.bg; }}
    >
      {children}
    </button>
  );
}

function FieldInput({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#64748b' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all duration-150"
        style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
    </div>
  );
}

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all duration-150"
        style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: '#111827' }}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl scale-in"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: '#475569' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Generate License Modal ───────────────────────────────────────────────────

function GenerateModal({
  onClose, actions, currentUser,
}: {
  onClose: () => void; actions: AppActions; currentUser: any;
}) {
  const [plan, setPlan]         = useState('Professional');
  const [duration, setDuration] = useState('1 Year');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [notes, setNotes]       = useState('');
  const [error, setError]       = useState('');

  function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in customer name and email.');
      return;
    }
    const key = generateKey();
    const days = DURATION_DAYS[duration] ?? 365;
    actions.addLicense({
      key,
      status: 'active',
      plan,
      assignedTo: name.trim(),
      assignedEmail: email.trim(),
      createdAt: new Date().toISOString(),
      expiresAt: addDaysFromNow(days),
      createdBy: currentUser.name,
      deviceId: null,
      deviceName: null,
      devicePlatform: null,
      deviceAssociatedAt: null,
      notes: notes.trim(),
    });
    actions.addAudit({
      action: 'License Created',
      targetType: 'license',
      target: key,
      details: `Created ${plan} license for ${name.trim()} (${email.trim()})`,
      ipAddress: '198.51.100.1',
      severity: 'info',
    });
    actions.showToast('License generated successfully');
    onClose();
  }

  return (
    <Modal title="Generate New License" onClose={onClose}>
      <div className="space-y-4">
        <FieldSelect label="Plan" value={plan} onChange={setPlan} options={PLANS} />
        <FieldInput label="Customer Name" value={name} onChange={setName} placeholder="Jane Smith" required />
        <FieldInput label="Email Address" value={email} onChange={setEmail} type="email" placeholder="customer@email.com" required />
        <FieldSelect label="Duration" value={duration} onChange={setDuration} options={Object.keys(DURATION_DAYS)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: '#64748b' }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes about this license..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
          />
        </div>
        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit}>Generate License</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── View / Manage HWID / Delete Modal ────────────────────────────────────────

function ViewModal({
  license, onClose, actions, currentUser,
}: {
  license: License; onClose: () => void; actions: AppActions; currentUser: any;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = currentUser.role === 'owner' || currentUser.role === 'admin';

  function doRevoke() {
    actions.updateLicense(license.id, { status: 'revoked' });
    actions.addAudit({ action: 'License Revoked', targetType: 'license', target: license.key, details: `Revoked license for ${license.assignedTo}`, ipAddress: '198.51.100.1', severity: 'critical' });
    actions.showToast('License revoked', 'error');
    onClose();
  }

  function doDelete() {
    if (!canDelete) {
      actions.showToast('Permission denied: Only Owner & Admin can delete license keys.', 'error');
      return;
    }
    actions.deleteLicense(license.id);
    actions.addAudit({ action: 'License Deleted', targetType: 'license', target: license.key, details: `Permanently deleted license for ${license.assignedTo}`, ipAddress: '198.51.100.1', severity: 'critical' });
    actions.showToast('License deleted permanently', 'info');
    onClose();
  }

  function doResetHwid() {
    actions.updateLicense(license.id, {
      deviceId: null,
      deviceName: null,
      devicePlatform: null,
      deviceAssociatedAt: null,
    });
    actions.addAudit({ action: 'HWID Reset', targetType: 'device', target: license.key, details: `Reset HWID lock for ${license.assignedTo}`, ipAddress: '198.51.100.1', severity: 'warning' });
    actions.showToast('HWID unlocked. User can now activate on a new machine.');
  }

  function doSuspend() {
    const next: LicenseStatus = license.status === 'suspended' ? 'active' : 'suspended';
    actions.updateLicense(license.id, { status: next });
    actions.addAudit({ action: next === 'suspended' ? 'License Suspended' : 'License Activated', targetType: 'license', target: license.key, details: `${next === 'suspended' ? 'Suspended' : 'Reactivated'} license for ${license.assignedTo}`, ipAddress: '198.51.100.1', severity: next === 'suspended' ? 'warning' : 'info' });
    actions.showToast(next === 'suspended' ? 'License suspended' : 'License activated');
    onClose();
  }

  function doRenew() {
    const days = DURATION_DAYS['1 Year'];
    const newExp = addDaysFromNow(days);
    actions.updateLicense(license.id, { status: 'active', expiresAt: newExp });
    actions.addAudit({ action: 'License Renewed', targetType: 'license', target: license.key, details: `Renewed license for ${license.assignedTo} for 1 year`, ipAddress: '198.51.100.1', severity: 'info' });
    actions.showToast('License renewed for 1 year');
    onClose();
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      actions.showToast(`${label} copied to clipboard`, 'info');
    });
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="w-32 shrink-0 text-xs font-medium" style={{ color: '#475569' }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );

  return (
    <Modal title="License & Hardware Lock Details" onClose={onClose}>
      <div className="space-y-0">
        <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <code
            className="flex-1 text-sm font-mono rounded-lg px-3 py-2"
            style={{ background: '#0d1828', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            {license.key}
          </code>
          <button
            onClick={() => copyText(license.key, 'License key')}
            className="p-2 rounded-lg transition-all duration-150 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Copy key"
          >
            📋
          </button>
        </div>
        <Row label="Status" value={<StatusBadge status={license.status} />} />
        <Row label="Plan" value={<PlanBadge plan={license.plan} />} />
        <Row label="Assigned User" value={`${license.assignedTo} (${license.assignedEmail})`} />
        <Row label="Created" value={fmtDate(license.createdAt)} />
        <Row label="Expires" value={fmtDate(license.expiresAt)} />
        <Row
          label="Hardware ID (HWID)"
          value={
            license.deviceId ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-[#0d1828] text-[#38bdf8] font-mono text-xs border border-[rgba(56,189,248,0.25)] font-bold">
                    {license.deviceId}
                  </code>
                  <button
                    onClick={() => copyText(license.deviceId!, 'HWID')}
                    className="px-2 py-1 rounded text-[11px] bg-[rgba(255,255,255,0.06)] text-[#93c5fd] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer"
                  >
                    Copy
                  </button>
                  <button
                    onClick={doResetHwid}
                    className="px-2 py-1 rounded text-[11px] bg-[rgba(245,158,11,0.15)] text-[#fcd34d] hover:bg-[rgba(245,158,11,0.25)] cursor-pointer"
                  >
                    Unlock / Reset HWID
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: '#64748b' }}>
                  {license.deviceName || 'PC'} · {license.devicePlatform || 'Windows'} · Locked on {license.deviceAssociatedAt ? fmtDate(license.deviceAssociatedAt) : 'Active'}
                </p>
              </div>
            ) : (
              <span className="text-[#64748b] font-medium">Unlinked (Will automatically lock on first activation)</span>
            )
          }
        />
        {license.notes && <Row label="Notes" value={<span style={{ color: '#64748b' }}>{license.notes}</span>} />}
      </div>

      {confirmRevoke && (
        <div className="mt-4 p-3.5 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
          <p className="text-xs mb-3 text-[#fca5a5]">Are you sure you want to revoke this license?</p>
          <div className="flex gap-2">
            <Btn onClick={() => setConfirmRevoke(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={doRevoke}>Confirm Revoke</Btn>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="mt-4 p-3.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]">
          <p className="text-xs mb-3 text-[#fca5a5]">
            Permanently delete license {license.key}? It will be completely removed from the database.
          </p>
          <div className="flex gap-2">
            <Btn onClick={() => setConfirmDelete(false)}>Cancel</Btn>
            <button
              onClick={doDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#dc2626] text-white cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {!confirmRevoke && !confirmDelete && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {(license.status === 'expired' || license.status === 'suspended') && (
            <Btn variant="primary" onClick={doRenew}>Renew (1 Year)</Btn>
          )}
          {(license.status === 'active' || license.status === 'suspended') && (
            <Btn onClick={doSuspend}>
              {license.status === 'suspended' ? 'Activate' : 'Suspend'}
            </Btn>
          )}
          {license.status !== 'revoked' && (
            <Btn variant="danger" onClick={() => setConfirmRevoke(true)}>Revoke</Btn>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(239,68,68,0.12)] text-[#fca5a5] border border-[rgba(239,68,68,0.25)] cursor-pointer"
          >
            Delete License
          </button>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      )}
    </Modal>
  );
}

// ── Main Licenses Page ───────────────────────────────────────────────────────

export default function LicensesPage({ data, actions }: Props) {
  const { licenses, currentUser } = data;

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewLicense, setViewLicense]   = useState<License | null>(null);

  const counts = useMemo(() => {
    return {
      all: licenses.length,
      active: licenses.filter((l) => l.status === 'active').length,
      revoked: licenses.filter((l) => l.status === 'revoked').length,
      expired: licenses.filter((l) => l.status === 'expired').length,
      suspended: licenses.filter((l) => l.status === 'suspended').length,
    };
  }, [licenses]);

  const filtered = useMemo(() => {
    let list = licenses;
    if (filterStatus !== 'all') list = list.filter((l) => l.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.key.toLowerCase().includes(q) ||
          l.assignedTo.toLowerCase().includes(q) ||
          l.assignedEmail.toLowerCase().includes(q) ||
          (l.deviceId && l.deviceId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [licenses, search, filterStatus]);

  const canManage = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Filter Organization Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] pb-3 flex-wrap">
        {[
          { id: 'all', label: 'All Licenses', count: counts.all },
          { id: 'active', label: 'Active', count: counts.active, color: '#34d399' },
          { id: 'revoked', label: 'Revoked', count: counts.revoked, color: '#f87171' },
          { id: 'expired', label: 'Expired', count: counts.expired, color: '#94a3b8' },
          { id: 'suspended', label: 'Suspended', count: counts.suspended, color: '#fbbf24' },
        ].map((tab) => {
          const active = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                color: active ? '#38bdf8' : '#64748b',
                border: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                  color: tab.color || '#cbd5e1',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {canManage && (
          <button
            onClick={() => setShowGenerate(true)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] text-white hover:bg-[#0369a1] transition-all cursor-pointer"
          >
            + Generate License
          </button>
        )}
      </div>

      {/* ── Search Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-sm">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by license key, customer name, email, or HWID…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: '#e2e8f0' }}
        />
      </div>

      {/* ── Licenses Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: '#0b1220' }}>
              {['License Key', 'Status', 'Plan', 'Assigned User', 'Hardware ID (HWID)', 'Expires', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase"
                  style={{ color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#64748b]">
                  No licenses found in this category.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr
                  key={l.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f1520' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d2e'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f1520'; }}
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold text-[#60a5fa]">{l.key}</code>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3"><PlanBadge plan={l.plan} /></td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#e2e8f0]">{l.assignedTo}</p>
                    <p className="text-[11px] text-[#475569]">{l.assignedEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {l.deviceId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[rgba(56,189,248,0.1)] text-[#38bdf8] border border-[rgba(56,189,248,0.2)]">
                        🔒 {l.deviceId}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#475569]">Unbound</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">{fmtDate(l.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewLicense(l)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#93c5fd] hover:bg-[rgba(96,165,250,0.1)] border border-[rgba(255,255,255,0.07)] cursor-pointer"
                      >
                        View
                      </button>
                      {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                        <button
                          onClick={() => {
                            actions.deleteLicense(l.id);
                            actions.showToast('License deleted', 'info');
                          }}
                          className="text-xs px-2 py-1 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#fca5a5] hover:bg-[rgba(239,68,68,0.2)] cursor-pointer"
                          title="Delete license"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          actions={actions}
          currentUser={currentUser}
        />
      )}

      {viewLicense && (
        <ViewModal
          license={viewLicense}
          onClose={() => setViewLicense(null)}
          actions={actions}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
