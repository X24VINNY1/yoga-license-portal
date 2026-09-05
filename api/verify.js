import { getLicenses, saveLicenses } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { key, hwid, deviceName, devicePlatform } = body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ valid: false, message: 'License key is required.' });
    }

    if (!hwid || typeof hwid !== 'string') {
      return res.status(400).json({ valid: false, message: 'Hardware ID (HWID) is required.' });
    }

    const cleanKey = key.trim().toUpperCase();
    const cleanHwid = hwid.trim().toUpperCase();

    const licenses = getLicenses();
    let license = licenses.find(l => l.key.toUpperCase() === cleanKey);

    if (!license) {
      try {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['host'] || 'yoga-license-portal.vercel.app';
        const keygenUrl = `${proto}://${host}/api/keygen`;
        const keygenRes = await fetch(keygenUrl);
        const keygenData = await keygenRes.json();
        if (keygenData?.success && Array.isArray(keygenData.licenses)) {
          license = keygenData.licenses.find(l => l.key.toUpperCase() === cleanKey);
          if (license) {
            licenses.unshift(license);
            saveLicenses(licenses);
          }
        }
      } catch (e) {}
    }

    const YOGA_KEY_REGEX = /^YV27-[A-Z0-9]{3,4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

    if (!license && YOGA_KEY_REGEX.test(cleanKey)) {
      license = {
        id: 'lic_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        key: cleanKey,
        status: 'active',
        plan: 'Professional',
        assignedTo: 'Portal User',
        assignedEmail: '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        createdBy: 'Yoga Portal',
        deviceId: cleanHwid,
        deviceName: deviceName || 'Windows PC',
        devicePlatform: devicePlatform || 'Windows',
        deviceAssociatedAt: new Date().toISOString(),
        notes: 'Portal Generated Key — HWID Locked',
      };
      licenses.unshift(license);
      saveLicenses(licenses);

      return res.status(200).json({
        valid: true,
        plan: license.plan,
        assignedTo: license.assignedTo,
        expiresAt: license.expiresAt,
        deviceId: cleanHwid,
        message: 'License verified successfully!'
      });
    }

    if (!license) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid license key. Check your key or get access at https://discord.gg/yoga'
      });
    }

    if (license.status === 'revoked') {
      return res.status(403).json({ valid: false, message: 'This license has been revoked.' });
    }

    if (license.status === 'suspended') {
      return res.status(403).json({ valid: false, message: 'This license has been suspended.' });
    }

    if (license.expiresAt) {
      const expDate = new Date(license.expiresAt);
      if (expDate < new Date()) {
        return res.status(403).json({ valid: false, message: 'This license has expired.' });
      }
    }

    // Check HWID Lock
    if (license.deviceId && license.deviceId.toUpperCase() !== cleanHwid) {
      return res.status(403).json({
        valid: false,
        message: 'License is locked to a different computer. Reset HWID in the portal or contact staff.'
      });
    }

    // If device not yet locked, bind it
    if (!license.deviceId) {
      license.deviceId = cleanHwid;
      license.deviceName = deviceName || 'Windows PC';
      license.devicePlatform = devicePlatform || 'Windows';
      license.deviceAssociatedAt = new Date().toISOString();
      saveLicenses(licenses);
    }

    return res.status(200).json({
      valid: true,
      plan: license.plan || 'Professional',
      assignedTo: license.assignedTo || 'Valued User',
      expiresAt: license.expiresAt || '',
      deviceId: cleanHwid,
      message: 'License verified successfully!'
    });

  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Server error verifying license: ' + err.message });
  }
}
