export interface License {
  id: string;
  key: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  plan: string;
  assignedTo: string;
  assignedEmail: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  deviceId: string | null;
  deviceName: string | null;
  devicePlatform: string | null;
  deviceAssociatedAt: string | null;
  notes: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin: string | null;
  password: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'owner' | 'admin' | 'staff';
  action: string;
  targetType: 'license' | 'staff' | 'device' | 'auth' | 'system';
  target: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
}

// Global in-memory cache shared across invocations on Vercel instance
export const db = {
  licenses: [
    {
      id: 'l1',
      key: 'YV27-A3K7-M9PX-Q2RN',
      status: 'active' as const,
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
      status: 'active' as const,
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
  ] as License[],
  staff: [
    {
      id: 's1',
      name: 'Owner',
      email: 'owner@yogavision.app',
      role: 'owner' as const,
      status: 'active' as const,
      createdAt: '2025-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      password: 'owner123',
    },
  ] as StaffMember[],
  auditLog: [
    {
      id: 'a1',
      timestamp: new Date().toISOString(),
      actor: 'System',
      actorRole: 'owner' as const,
      action: 'System Initialized',
      targetType: 'system' as const,
      target: 'Vercel Deployment',
      details: 'License server active and ready for HWID verification.',
      ipAddress: '127.0.0.1',
      severity: 'info' as const,
    },
  ] as AuditEntry[],
};
