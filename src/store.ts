export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked';
export type StaffRole = 'owner' | 'admin' | 'staff';
export type StaffStatus = 'active' | 'disabled';
export type AuditTarget = 'license' | 'staff' | 'device' | 'auth' | 'system';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface License {
  id: string;
  key: string;
  status: LicenseStatus;
  plan: string;
  assignedTo: string;
  assignedEmail: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  deviceId: string | null;
  machineId?: string | null;
  deviceName: string | null;
  devicePlatform: string | null;
  deviceAssociatedAt: string | null;
  notes: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  createdAt: string;
  lastLogin: string | null;
  password: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: StaffRole;
  action: string;
  targetType: AuditTarget;
  target: string;
  details: string;
  ipAddress: string;
  severity: AuditSeverity;
}

export function generateKey(duration: string = '1 Year'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len = 4) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  let durTag = 'Y01';
  if (duration === '1 Month') durTag = 'M01';
  else if (duration === '3 Months') durTag = 'M03';
  else if (duration === '6 Months') durTag = 'M06';
  else if (duration === '1 Year') durTag = 'Y01';
  else if (duration === '2 Years') durTag = 'Y02';
  else if (duration === 'Lifetime') durTag = 'LFT';

  return `YV27-${durTag}-${seg(4)}-${seg(4)}`;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function ts(): string {
  return new Date().toISOString();
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function addDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const DURATION_DAYS: Record<string, number> = {
  '1 Day': 1,
  '3 Days': 3,
  '5 Days': 5,
  '7 Days': 7,
  '1 Month': 30,
  '3 Months': 90,
  '6 Months': 180,
  '1 Year': 365,
  '2 Years': 730,
  'Lifetime': 36500,
};

export const PLANS = ['Starter', 'Professional', 'Enterprise'];

export const STAFF_SEED: StaffMember[] = [
  {
    id: 's1',
    name: 'Owner',
    email: 'owner@yogavision.app',
    role: 'owner',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    password: 'owner123',
  },
];

export const LICENSE_SEED: License[] = [
  {
    id: 'l1',
    key: 'YV27-A3K7-M9PX-Q2RN',
    status: 'active',
    plan: 'Professional',
    assignedTo: 'Tyler Brooks',
    assignedEmail: 'tyler.brooks@gmail.com',
    createdAt: '2025-01-15T10:00:00Z',
    expiresAt: '2027-01-15T10:00:00Z',
    createdBy: 'Owner',
    deviceId: null,
    deviceName: null,
    devicePlatform: null,
    deviceAssociatedAt: null,
    notes: 'Initial production key',
  },
  {
    id: 'l2',
    key: 'YV27-B8HJ-T4WZ-K6LS',
    status: 'active',
    plan: 'Enterprise',
    assignedTo: 'Courtney Navarro',
    assignedEmail: 'cnavarro@promail.io',
    createdAt: '2025-02-01T11:00:00Z',
    expiresAt: '2027-02-01T11:00:00Z',
    createdBy: 'Owner',
    deviceId: null,
    deviceName: null,
    devicePlatform: null,
    deviceAssociatedAt: null,
    notes: 'Priority customer',
  },
];

export const AUDIT_SEED: AuditEntry[] = [
  {
    id: 'a1',
    timestamp: '2025-09-01T08:30:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'Login',
    targetType: 'auth',
    target: 'owner@yogavision.app',
    details: 'Successful login from browser session',
    ipAddress: '104.28.91.14',
    severity: 'info',
  },
  {
    id: 'a2',
    timestamp: '2025-08-31T14:22:00Z',
    actor: 'Sarah Chen',
    actorRole: 'admin',
    action: 'Login',
    targetType: 'auth',
    target: 'admin@yogavision.app',
    details: 'Successful login from browser session',
    ipAddress: '72.21.196.65',
    severity: 'info',
  },
  {
    id: 'a3',
    timestamp: '2025-08-31T14:35:00Z',
    actor: 'Sarah Chen',
    actorRole: 'admin',
    action: 'License Created',
    targetType: 'license',
    target: 'YV27-H2WM-K9NB-R6TX',
    details: 'Created Professional license for Priya Sharma (priya.s@mailbox.org)',
    ipAddress: '72.21.196.65',
    severity: 'info',
  },
  {
    id: 'a4',
    timestamp: '2025-08-30T10:45:00Z',
    actor: 'Jordan Price',
    actorRole: 'staff',
    action: 'Login',
    targetType: 'auth',
    target: 'staff@yogavision.app',
    details: 'Successful login from browser session',
    ipAddress: '185.60.144.23',
    severity: 'info',
  },
  {
    id: 'a5',
    timestamp: '2025-08-30T11:02:00Z',
    actor: 'Jordan Price',
    actorRole: 'staff',
    action: 'License Created',
    targetType: 'license',
    target: 'YV27-J5PK-L8ZC-Q4NF',
    details: 'Created Starter license for Ethan Rhodes (ethan.rhodes@gmail.com)',
    ipAddress: '185.60.144.23',
    severity: 'info',
  },
  {
    id: 'a6',
    timestamp: '2025-08-28T16:10:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'License Suspended',
    targetType: 'license',
    target: 'YV27-D2QX-W6TM-B8NP',
    details: 'Suspended license for James Whitfield — payment issue',
    ipAddress: '104.28.91.14',
    severity: 'warning',
  },
  {
    id: 'a7',
    timestamp: '2025-08-25T09:15:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'License Revoked',
    targetType: 'license',
    target: 'YV27-G7VN-X5JW-P1RH',
    details: 'Revoked license for Cameron Hughes — Terms of Service violation',
    ipAddress: '104.28.91.14',
    severity: 'critical',
  },
  {
    id: 'a8',
    timestamp: '2025-08-20T13:40:00Z',
    actor: 'Sarah Chen',
    actorRole: 'admin',
    action: 'Device Reset',
    targetType: 'device',
    target: 'YV27-B8HJ-T4WZ-K6LS',
    details: 'Device association reset for Courtney Navarro license',
    ipAddress: '72.21.196.65',
    severity: 'warning',
  },
  {
    id: 'a9',
    timestamp: '2025-08-15T10:22:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'Staff Disabled',
    targetType: 'staff',
    target: 'Alex Torres',
    details: 'Account alex@yogavision.app disabled',
    ipAddress: '104.28.91.14',
    severity: 'warning',
  },
  {
    id: 'a10',
    timestamp: '2025-08-10T11:55:00Z',
    actor: 'Jordan Price',
    actorRole: 'staff',
    action: 'License Viewed',
    targetType: 'license',
    target: 'YV27-C5MP-R7KN-H9XQ',
    details: 'Viewed license details for Devon Mills',
    ipAddress: '185.60.144.23',
    severity: 'info',
  },
  {
    id: 'a11',
    timestamp: '2025-08-05T08:30:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'License Created',
    targetType: 'license',
    target: 'YV27-F4TZ-S8LQ-J2KM',
    details: 'Created Enterprise license for Dominic Park (dpark@techmail.net)',
    ipAddress: '104.28.91.14',
    severity: 'info',
  },
  {
    id: 'a12',
    timestamp: '2025-07-28T15:05:00Z',
    actor: 'System',
    actorRole: 'owner',
    action: 'License Expired',
    targetType: 'license',
    target: 'YV27-E9RK-N3ZJ-G7VW',
    details: 'License for Maya Foster passed expiration date',
    ipAddress: '—',
    severity: 'warning',
  },
  {
    id: 'a13',
    timestamp: '2025-07-15T09:00:00Z',
    actor: 'Alex Torres',
    actorRole: 'staff',
    action: 'Login',
    targetType: 'auth',
    target: 'alex@yogavision.app',
    details: 'Successful login from browser session',
    ipAddress: '67.183.217.42',
    severity: 'info',
  },
  {
    id: 'a14',
    timestamp: '2025-07-01T12:30:00Z',
    actor: 'Sarah Chen',
    actorRole: 'admin',
    action: 'Failed Login Attempt',
    targetType: 'auth',
    target: 'admin@yogavision.app',
    details: 'Invalid credentials entered — 1 attempt',
    ipAddress: '72.21.196.65',
    severity: 'warning',
  },
  {
    id: 'a15',
    timestamp: '2025-06-15T11:10:00Z',
    actor: 'Marcus Webb',
    actorRole: 'owner',
    action: 'Staff Added',
    targetType: 'staff',
    target: 'Jordan Price',
    details: 'New staff account created for staff@yogavision.app with role: Staff',
    ipAddress: '104.28.91.14',
    severity: 'info',
  },
];
