import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared database interface for Vercel Serverless
interface License {
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

// In-memory / Environment store cache
let globalLicenses: License[] = [];

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

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  const { key, hwid, deviceName, devicePlatform } = req.body || {};

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ valid: false, message: 'License key is required.' });
  }

  if (!hwid || typeof hwid !== 'string') {
    return res.status(400).json({ valid: false, message: 'Hardware ID (HWID) is required.' });
  }

  const cleanKey = key.trim().toUpperCase();
  const cleanHwid = hwid.trim().toUpperCase();

  // Find license in database
  // If database integration is set (e.g. Upstash, Supabase, KV), query it here
  let license = globalLicenses.find((l) => l.key.toUpperCase() === cleanKey);

  // If no DB match, accept standard format or seed check
  if (!license) {
    // Check fallback or sample active keys
    return res.status(404).json({
      valid: false,
      message: 'Invalid license key. Please check your key or purchase a valid license.',
    });
  }

  // Check Status
  if (license.status === 'revoked') {
    return res.status(403).json({
      valid: false,
      message: 'This license key has been revoked due to a terms of service violation.',
    });
  }

  if (license.status === 'suspended') {
    return res.status(403).json({
      valid: false,
      message: 'This license key is currently suspended. Please contact support.',
    });
  }

  // Check Expiration
  if (new Date(license.expiresAt).getTime() < Date.now()) {
    license.status = 'expired';
    return res.status(403).json({
      valid: false,
      message: `This license expired on ${new Date(license.expiresAt).toLocaleDateString()}. Please renew your subscription.`,
    });
  }

  // Check HWID binding
  if (!license.deviceId) {
    // First time activation — bind to this machine's HWID
    license.deviceId = cleanHwid;
    license.deviceName = deviceName || 'Windows PC';
    license.devicePlatform = devicePlatform || 'Windows';
    license.deviceAssociatedAt = new Date().toISOString();

    return res.status(200).json({
      valid: true,
      plan: license.plan,
      assignedTo: license.assignedTo,
      expiresAt: license.expiresAt,
      bound: true,
      message: `License successfully activated and locked to device: ${license.deviceName} (${cleanHwid})`,
    });
  }

  // Existing HWID binding check
  if (license.deviceId.toUpperCase() !== cleanHwid) {
    return res.status(403).json({
      valid: false,
      message: `Hardware mismatch: This license is locked to another machine (${license.deviceName || license.deviceId}). Reset your device in the dashboard to transfer.`,
    });
  }

  // HWID matched & active
  return res.status(200).json({
    valid: true,
    plan: license.plan,
    assignedTo: license.assignedTo,
    expiresAt: license.expiresAt,
    bound: true,
    message: 'License verified successfully.',
  });
}
