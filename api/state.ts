import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
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

  // GET: Return current database state (licenses, staff, auditLog)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: db,
    });
  }

  // POST: Sync / Update state from web admin dashboard
  if (req.method === 'POST') {
    const { licenses, staff, auditLog } = req.body || {};

    if (Array.isArray(licenses)) {
      // Merge or update
      for (const updated of licenses) {
        const idx = db.licenses.findIndex((l) => l.id === updated.id || l.key === updated.key);
        if (idx >= 0) {
          db.licenses[idx] = { ...db.licenses[idx], ...updated };
        } else {
          db.licenses.unshift(updated);
        }
      }
    }

    if (Array.isArray(staff)) {
      db.staff = staff;
    }

    if (Array.isArray(auditLog)) {
      db.auditLog = auditLog;
    }

    return res.status(200).json({
      success: true,
      message: 'State synchronized successfully.',
      data: db,
    });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
