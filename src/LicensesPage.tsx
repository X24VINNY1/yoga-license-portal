import { useState, useMemo } from 'react';
import type { AppData, AppActions } from './App';
import type { License, LicenseStatus } from './store';
import { generateKey, newId, fmtDate, fmtDateTime, PLANS, DURATION_DAYS, addDaysFromNow } from './store';

interface Props { data: AppData; actions: AppActions; }

// ── Shared primitives ──────────────────────────────────────────────────────────

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

function DeviceDot({ linked }: { linked: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: linked ? '#22c55e' : '#334155' }}
      />
      <span className="text-xs" style={{ color: linked ? '#86efac' : '#475569' }}>
        {linked ? 'Linked' : 'None'}
      </span>
    </div>
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
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
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
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all duration-150 appearance-none"
        style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
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
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
            style={{ color: '#475569', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  );
}

// ── Generate modal ────────────────────────────────────────────────────────────
function GenerateModal({
  onClose, actions, currentUser,
}: {
  onClose: () => void;
  actions: AppActions;
  currentUser: { name: string };
}) {
  const [plan, setPlan]       = useState('Professional');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [duration, setDuration] = useState('1 Year');
  const [notes, setNotes]     = useState('');
  const [error, setError]     = useState('');

  function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Customer name and email are required.');
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
            placeholder="Internal notes about this license..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all duration-150"
            style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
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

// ── View / Edit modal ─────────────────────────────────────────────────────────
function ViewModal({
  license, onClose, actions,
}: {
  license: License; onClose: () => void; actions: AppActions;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  function doRevoke() {
    actions.updateLicense(license.id, { status: 'revoked' });
    actions.addAudit({ action: 'License Revoked', targetType: 'license', target: license.key, details: `Revoked license for ${license.assignedTo}`, ipAddress: '198.51.100.1', severity: 'critical' });
    actions.showToast('License revoked', 'error');
    onClose();
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

  function copyKey() {
    navigator.clipboard.writeText(license.key).then(() => {
      actions.showToast('License key copied to clipboard', 'info');
    });
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="w-28 shrink-0 text-xs font-medium" style={{ color: '#475569' }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );

  return (
    <Modal title="License Details" onClose={onClose}>
      <div className="space-y-0">
        <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <code
            className="flex-1 text-sm font-mono rounded-lg px-3 py-2"
            style={{ background: '#0d1828', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            {license.key}
          </code>
          <button
            onClick={copyKey}
            className="p-2 rounded-lg transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#93c5fd'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            title="Copy key"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <Row label="Status"    value={<StatusBadge status={license.status} />} />
        <Row label="Plan"      value={<PlanBadge plan={license.plan} />} />
        <Row label="Assigned"  value={`${license.assignedTo} — ${license.assignedEmail}`} />
        <Row label="Created"   value={fmtDate(license.createdAt)} />
        <Row label="Expires"   value={fmtDate(license.expiresAt)} />
        <Row label="Created by" value={license.createdBy} />
        <Row label="Device"    value={
          license.deviceId ? (
            <span>
              {license.deviceName} <span style={{ color: '#475569' }}>({license.devicePlatform})</span>
              <br />
              <span style={{ color: '#334155', fontSize: '11px' }}>
                ID: {license.deviceId} · Associated {license.deviceAssociatedAt ? fmtDate(license.deviceAssociatedAt) : '—'}
              </span>
            </span>
          ) : (
            <span style={{ color: '#475569' }}>No device associated</span>
          )
        } />
        {license.notes && (
          <Row label="Notes" value={<span style={{ color: '#64748b' }}>{license.notes}</span>} />
        )}
      </div>

      {/* Confirm revoke */}
      {confirmRevoke && (
        <div
          className="mt-4 p-3.5 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-xs mb-3" style={{ color: '#fca5a5' }}>
            This action is permanent and cannot be undone. Are you sure you want to revoke this license?
          </p>
          <div className="flex gap-2">
            <Btn onClick={() => setConfirmRevoke(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={doRevoke}>Confirm Revoke</Btn>
          </div>
        </div>
      )}

      {/* Actions */}
      {!confirmRevoke && (
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
          <Btn onClick={onClose}>Close</Btn>
        </div>
      )}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LicensesPage({ data, actions }: Props) {
  const { licenses, currentUser } = data;

  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan]     = useState<string>('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewLicense, setViewLicense]   = useState<License | null>(null);

  const filtered = useMemo(() => {
    let list = licenses;
    if (filterStatus !== 'all') list = list.filter((l) => l.status === filterStatus);
    if (filterPlan !== 'all')   list = list.filter((l) => l.plan === filterPlan);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.key.toLowerCase().includes(q) ||
          l.assignedTo.toLowerCase().includes(q) ||
          l.assignedEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [licenses, search, filterStatus, filterPlan]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      actions.showToast('License key copied', 'info');
    });
  }

  function quickToggle(l: License) {
    const next: LicenseStatus = l.status === 'suspended' ? 'active' : 'suspended';
    actions.updateLicense(l.id, { status: next });
    actions.addAudit({
      action: next === 'suspended' ? 'License Suspended' : 'License Activated',
      targetType: 'license',
      target: l.key,
      details: `${next === 'suspended' ? 'Suspended' : 'Activated'} license for ${l.assignedTo}`,
      ipAddress: '198.51.100.1',
      severity: next === 'suspended' ? 'warning' : 'info',
    });
    actions.showToast(next === 'suspended' ? 'License suspended' : 'License activated');
  }

  function quickRenew(l: License) {
    const newExp = addDaysFromNow(DURATION_DAYS['1 Year']);
    actions.updateLicense(l.id, { status: 'active', expiresAt: newExp });
    actions.addAudit({ action: 'License Renewed', targetType: 'license', target: l.key, details: `Renewed for ${l.assignedTo}`, ipAddress: '198.51.100.1', severity: 'info' });
    actions.showToast('License renewed');
  }

  const canManage = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3.5 py-2 rounded-xl"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#334155', flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key, name, or email…"
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            style={{ color: '#e2e8f0' }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs outline-none appearance-none"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="revoked">Revoked</option>
        </select>

        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs outline-none appearance-none"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}
        >
          <option value="all">All Plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {canManage && (
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ background: '#2563eb', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563eb'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Generate License
          </button>
        )}
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
                {['License Key', 'Status', 'Plan', 'Assigned To', 'Expires', 'Device', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase"
                    style={{ color: '#334155', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#334155' }}>
                    No licenses match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f1520' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d2e'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f1520'; }}
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono" style={{ color: '#60a5fa' }}>{l.key}</code>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3"><PlanBadge plan={l.plan} /></td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium" style={{ color: '#cbd5e1' }}>{l.assignedTo}</p>
                    <p className="text-[11px]" style={{ color: '#475569' }}>{l.assignedEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: '#64748b' }}>{fmtDate(l.expiresAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DeviceDot linked={!!l.deviceId} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {/* Copy */}
                      <button
                        onClick={() => copyKey(l.key)}
                        className="p-1.5 rounded-lg transition-all duration-100"
                        style={{ color: '#334155', background: 'transparent' }}
                        title="Copy key"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#60a5fa'; (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <rect x="3.5" y="3.5" width="7.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M2 9V2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                      {/* View */}
                      <button
                        onClick={() => setViewLicense(l)}
                        className="p-1.5 rounded-lg transition-all duration-100"
                        style={{ color: '#334155', background: 'transparent' }}
                        title="View details"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#93c5fd'; (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1 6.5C2.5 3.5 4.3 2 6.5 2S10.5 3.5 12 6.5C10.5 9.5 8.7 11 6.5 11S2.5 9.5 1 6.5z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="6.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </button>
                      {/* Quick action */}
                      {canManage && (
                        <>
                          {(l.status === 'active' || l.status === 'suspended') && (
                            <button
                              onClick={() => quickToggle(l)}
                              className="p-1.5 rounded-lg transition-all duration-100"
                              style={{ color: '#334155', background: 'transparent' }}
                              title={l.status === 'suspended' ? 'Activate' : 'Suspend'}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fcd34d'; (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M6.5 2v2.5M6.5 8.5V11M2 6.5h2.5M8.5 6.5H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                            </button>
                          )}
                          {(l.status === 'expired') && (
                            <button
                              onClick={() => quickRenew(l)}
                              className="p-1.5 rounded-lg transition-all duration-100"
                              style={{ color: '#334155', background: 'transparent' }}
                              title="Renew 1 year"
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#86efac'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.08)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M2.5 6.5A4 4 0 0110.5 4M10.5 6.5A4 4 0 012.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                <path d="M10.5 2v2.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#0b1220', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#334155' }}>
            Showing {filtered.length} of {licenses.length} licenses
          </p>
        </div>
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
        />
      )}
    </div>
  );
}
