import { db, getLicenses, saveLicenses } from './db.js';

export default async function handler(req, res) {
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
    return res.status(200).json({
      success: true,
      data: {
        licenses: getLicenses(),
        staff: db.staff,
        auditLog: db.auditLog
      },
    });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { licenses, staff, auditLog } = body;

    if (Array.isArray(licenses)) {
      saveLicenses(licenses);
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
      data: {
        licenses: getLicenses(),
        staff: db.staff,
        auditLog: db.auditLog
      },
    });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
