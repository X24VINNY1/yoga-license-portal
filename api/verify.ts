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
  let license = db.licenses.find((l) => l.key.toUpperCase() === cleanKey);

  // If key is generated on client or valid format but not seeded, register it
  if (!license && (cleanKey.startsWith('YV27-') || cleanKey.startsWith('YOGA-'))) {
    license = {
      id: `lic_${Date.now()}`,
      key: cleanKey,
      status: 'active',
      plan: 'Professional',
      assignedTo: 'Active Customer',
      assignedEmail: 'customer@yogavision.app',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'System Auto-Register',
      deviceId: cleanHwid,
      deviceName: deviceName || 'Windows PC',
      devicePlatform: devicePlatform || 'Windows',
      deviceAssociatedAt: new Date().toISOString(),
      notes: 'Activated from desktop client',
    };
    db.licenses.unshift(license);

    db.auditLog.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'License Server',
      actorRole: 'system' as any,
      action: 'HWID Bound',
      targetType: 'device',
      target: cleanKey,
      details: `Key ${cleanKey} registered and locked to HWID: ${cleanHwid}`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1',
      severity: 'info',
    });

    return res.status(200).json({
      valid: true,
      plan: license.plan,
      assignedTo: license.assignedTo,
      expiresAt: license.expiresAt,
      deviceId: cleanHwid,
      message: `License activated and locked to HWID: ${cleanHwid}`,
    });
  }

  if (!license) {
    return res.status(404).json({
      valid: false,
      message: 'Invalid license key. Please check your key or generate one in your portal.',
    });
  }

  // Check Status
  if (license.status === 'revoked') {
    return res.status(403).json({
      valid: false,
      message: 'This license key has been revoked.',
    });
  }

  if (license.status === 'suspended') {
    return res.status(403).json({
      valid: false,
      message: 'This license key is currently suspended.',
    });
  }

  // Check Expiration
  if (new Date(license.expiresAt).getTime() < Date.now()) {
    license.status = 'expired';
    return res.status(403).json({
      valid: false,
      message: `This license expired on ${new Date(license.expiresAt).toLocaleDateString()}.`,
    });
  }

  // Check HWID binding
  if (!license.deviceId) {
    // First time activation — bind permanently to this machine's HWID
    license.deviceId = cleanHwid;
    license.deviceName = deviceName || 'Windows PC';
    license.devicePlatform = devicePlatform || 'Windows';
    license.deviceAssociatedAt = new Date().toISOString();

    db.auditLog.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'License Server',
      actorRole: 'system' as any,
      action: 'HWID Bound',
      targetType: 'device',
      target: cleanKey,
      details: `Key locked to HWID ${cleanHwid} (${deviceName || 'Windows PC'})`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1',
      severity: 'info',
    });

    return res.status(200).json({
      valid: true,
      plan: license.plan,
      assignedTo: license.assignedTo,
      expiresAt: license.expiresAt,
      deviceId: cleanHwid,
      message: `License successfully locked to HWID: ${cleanHwid}`,
    });
  }

  // If already bound to HWID, verify match
  if (license.deviceId.toUpperCase() !== cleanHwid) {
    return res.status(403).json({
      valid: false,
      message: `Hardware ID mismatch. This key is locked to HWID: ${license.deviceId}. Reset HWID lock in your dashboard to transfer.`,
    });
  }

  // HWID matches
  return res.status(200).json({
    valid: true,
    plan: license.plan,
    assignedTo: license.assignedTo,
    expiresAt: license.expiresAt,
    deviceId: cleanHwid,
    message: `License verified on locked hardware: ${cleanHwid}`,
  });
}
