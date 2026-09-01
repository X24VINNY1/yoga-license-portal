import { useState } from 'react';
import type { AppData, AppActions } from './App';
import type { StaffMember, StaffRole } from './store';
import { newId, ts, fmtDate, fmtDateTime } from './store';

interface Props { data: AppData; actions: AppActions; }

function RoleBadge({ role }: { role: StaffRole }) {
  const map = {
    owner: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#c4b5fd' },
    admin: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)',  color: '#93c5fd' },
    staff: { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
  };
  const s = map[role];
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: 'active' | 'disabled' }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: status === 'active' ? '#22c55e' : '#475569' }}
      />
      <span className="text-xs" style={{ color: status === 'active' ? '#86efac' : '#475569' }}>
        {status === 'active' ? 'Active' : 'Disabled'}
      </span>
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

function FieldInput({ label, value, onChange, type = 'text', placeholder, required }: {
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

function AddStaffModal({
  onClose, actions, currentUser,
}: {
  onClose: () => void; actions: AppActions; currentUser: StaffMember;
}) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState<StaffRole>('staff');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const availableRoles: StaffRole[] = currentUser.role === 'owner'
    ? ['staff', 'admin', 'owner']
    : ['staff'];

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    actions.addStaff({
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'active',
      createdAt: ts(),
      lastLogin: null,
      password: password.trim(),
    });
    actions.addAudit({
      action: 'Staff Added',
      targetType: 'staff',
      target: name.trim(),
      details: `New ${role} account created for ${email.trim()}`,
      ipAddress: '198.51.100.1',
      severity: 'info',
    });
    actions.showToast('Staff member added');
    onClose();
  }

  return (
    <Modal title="Add Staff Member" onClose={onClose}>
      <div className="space-y-4">
        <FieldInput label="Full Name" value={name} onChange={setName} placeholder="Jane Smith" required />
        <FieldInput label="Email Address" value={email} onChange={setEmail} type="email" placeholder="jane@yogavision.app" required />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: '#64748b' }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none appearance-none"
            style={{ background: '#0d1828', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(96,165,250,0.4)'; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
        <FieldInput label="Initial Password" value={password} onChange={setPassword} type="password" placeholder="Set a secure password" required />
        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: '#2563eb', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563eb'; }}
          >
            Add Member
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditModal({
  member, onClose, actions, currentUser,
}: {
  member: StaffMember; onClose: () => void; actions: AppActions; currentUser: StaffMember;
}) {
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = member.id === currentUser.id;
  const canEdit = currentUser.role === 'owner' || (currentUser.role === 'admin' && member.role === 'staff');

  function toggleStatus() {
    const next = member.status === 'active' ? 'disabled' : 'active';
    actions.updateStaff(member.id, { status: next });
    actions.addAudit({
      action: next === 'disabled' ? 'Staff Disabled' : 'Staff Enabled',
      targetType: 'staff',
      target: member.name,
      details: `Account ${member.email} ${next === 'disabled' ? 'disabled' : 're-enabled'}`,
      ipAddress: '198.51.100.1',
      severity: 'warning',
    });
    actions.showToast(next === 'disabled' ? 'Account disabled' : 'Account re-enabled');
    setConfirmDisable(false);
    onClose();
  }

  function doDelete() {
    actions.deleteStaff(member.id);
    actions.addAudit({
      action: 'Staff Deleted',
      targetType: 'staff',
      target: member.name,
      details: `Permanently deleted account ${member.email}`,
      ipAddress: '198.51.100.1',
      severity: 'critical',
    });
    actions.showToast(`Deleted ${member.name}'s credentials`, 'info');
    setConfirmDelete(false);
    onClose();
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="w-24 shrink-0 text-xs" style={{ color: '#475569' }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );

  return (
    <Modal title="Staff Account" onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}
        >
          {member.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{member.name}</p>
          <p className="text-xs" style={{ color: '#475569' }}>{member.email}</p>
        </div>
      </div>
      <div>
        <Row label="Role"       value={<RoleBadge role={member.role} />} />
        <Row label="Status"     value={<StatusDot status={member.status} />} />
        <Row label="Created"    value={fmtDate(member.createdAt)} />
        <Row label="Last login" value={member.lastLogin ? fmtDateTime(member.lastLogin) : 'Never'} />
      </div>

      {confirmDisable && !isSelf && canEdit && (
        <div
          className="mt-4 p-3.5 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-xs mb-3" style={{ color: '#fca5a5' }}>
            {member.status === 'active'
              ? 'This account will be disabled and the user will no longer be able to log in.'
              : 'Re-enable this account to allow the user to log in again.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDisable(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              onClick={toggleStatus}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {confirmDelete && !isSelf && canEdit && (
        <div
          className="mt-4 p-3.5 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <p className="text-xs mb-3" style={{ color: '#fca5a5' }}>
            Are you sure you want to permanently delete credentials for {member.name}? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              onClick={doDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ background: '#dc2626', color: '#ffffff', border: 'none' }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {!confirmDisable && !confirmDelete && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!isSelf && canEdit && (
            <>
              <button
                onClick={() => setConfirmDisable(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: member.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  color: member.status === 'active' ? '#fca5a5' : '#86efac',
                  border: `1px solid ${member.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                }}
              >
                {member.status === 'active' ? 'Disable Account' : 'Enable Account'}
              </button>
              {currentUser.role === 'owner' && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  Delete Account
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

export default function StaffPage({ data, actions }: Props) {
  const { staff, currentUser } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);

  const canAdd = currentUser.role === 'owner' || currentUser.role === 'admin';

  const sorted = [...staff].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, staff: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: '#475569' }}>
          {staff.filter((s) => s.status === 'active').length} active · {staff.filter((s) => s.status === 'disabled').length} disabled
        </p>
        {canAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ background: '#2563eb', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563eb'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Staff Member
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: '#0b1220' }}>
              {['Member', 'Role', 'Status', 'Created', 'Last Login', ''].map((col) => (
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
            {sorted.map((member) => (
              <tr
                key={member.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f1520' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d2e'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f1520'; }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: member.status === 'disabled' ? 'rgba(71,85,105,0.2)' : 'rgba(96,165,250,0.12)',
                        color: member.status === 'disabled' ? '#475569' : '#60a5fa',
                      }}
                    >
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: member.status === 'disabled' ? '#475569' : '#cbd5e1' }}>
                        {member.name}
                        {member.id === currentUser.id && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[11px]" style={{ color: '#334155' }}>{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={member.role} /></td>
                <td className="px-4 py-3"><StatusDot status={member.status} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: '#475569' }}>{fmtDate(member.createdAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: '#475569' }}>
                    {member.lastLogin ? fmtDateTime(member.lastLogin) : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditTarget(member)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#93c5fd'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,165,250,0.2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          actions={actions}
          currentUser={currentUser}
        />
      )}
      {editTarget && (
        <EditModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          actions={actions}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
