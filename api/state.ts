import type { VercelRequest, VercelResponse } from '@vercel/node';

// Full Persistent State Store for Vercel Serverless
let stateStore: {
  licenses: any[];
  staff: any[];
  auditLog: any[];
} = {
  licenses: [
    {
      id: 'l1',
      key: 'YV27-A3K7-M9PX-Q2RN',
      status: 'active',
      plan: 'Professional',
      assignedTo: 'Tyler Brooks',
      assignedEmail: 'tyler.brooks@gmail.com',
      createdAt: '2025-01-15T10:00:00Z',
      expiresAt: '2027-01-15T10:00:00Z',
      createdBy: 'Marcus Webb',
      deviceId: null,
      deviceName: null,
      devicePlatform: null,
      deviceAssociatedAt: null,
      notes: 'Initial activation key',
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
      createdBy: 'Marcus Webb',
      deviceId: null,
      deviceName: null,
      devicePlatform: null,
      deviceAssociatedAt: null,
      notes: 'VIP Customer',
    },
  ],
  staff: [
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
  ],
  auditLog: [
    {
      id: 'a1',
      timestamp: new Date().toISOString(),
      actor: 'System',
      actorRole: 'owner',
      action: 'System Initialized',
      targetType: 'system',
      target: 'Vercel Deployment',
      details: 'License server active and ready for HWID verification.',
      ipAddress: '127.0.0.1',
      severity: 'info',
    },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(stateStore);
  }

  if (req.method === 'POST') {
    const { licenses, staff, auditLog } = req.body || {};
    if (Array.isArray(licenses)) stateStore.licenses = licenses;
    if (Array.isArray(staff)) stateStore.staff = staff;
    if (Array.isArray(auditLog)) stateStore.auditLog = auditLog;

    return res.status(200).json({ success: true, count: stateStore.licenses.length });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
