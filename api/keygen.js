import { getLicenses, saveLicenses } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const licenses = getLicenses();

    // GET: Return all licenses directly to the portal
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        licenses: licenses,
        machines: licenses.filter(l => l.deviceId).map(l => ({
          id: l.id,
          attributes: {
            fingerprint: l.deviceId,
            name: l.deviceName,
            platform: l.devicePlatform,
            created: l.deviceAssociatedAt
          }
        }))
      });
    }

    // POST: Create, Delete, Reset Machine HWID
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { action, payload } = body;

      if (action === 'create') {
        const { name, email, plan, duration, notes } = payload || {};
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const seg = (len = 4) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        
        let durTag = 'Y01';
        let days = 365;
        if (duration === '1 Day') { durTag = 'D01'; days = 1; }
        else if (duration === '3 Days') { durTag = 'D03'; days = 3; }
        else if (duration === '5 Days') { durTag = 'D05'; days = 5; }
        else if (duration === '1 Month') { durTag = 'M01'; days = 30; }
        else if (duration === '3 Months') { durTag = 'M03'; days = 90; }
        else if (duration === '6 Months') { durTag = 'M06'; days = 180; }
        else if (duration === '1 Year') { durTag = 'Y01'; days = 365; }
        else if (duration === '2 Years') { durTag = 'Y02'; days = 730; }
        else if (duration === 'Lifetime') { durTag = 'LFT'; days = 36500; }

        const key = `YV27-${durTag}-${seg(4)}-${seg(4)}`;
        const expDate = new Date(Date.now() + days * 86400000).toISOString();

        const newLicense = {
          id: 'lic_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          key,
          status: 'active',
          plan: plan || 'Professional',
          assignedTo: name || 'Customer',
          assignedEmail: email || '',
          createdAt: new Date().toISOString(),
          expiresAt: expDate,
          createdBy: 'Portal Admin',
          deviceId: null,
          deviceName: null,
          devicePlatform: null,
          deviceAssociatedAt: null,
          notes: notes || '',
        };

        licenses.unshift(newLicense);
        saveLicenses(licenses);

        return res.status(200).json({
          success: true,
          license: newLicense,
          message: 'License created successfully in Yoga Portal!'
        });
      }

      if (action === 'delete') {
        const { licenseId } = payload || {};
        const idx = licenses.findIndex(l => l.id === licenseId || l.key === licenseId);
        if (idx !== -1) {
          licenses.splice(idx, 1);
          saveLicenses(licenses);
        }
        return res.status(200).json({ success: true, message: 'License deleted from portal.' });
      }

      if (action === 'reset_machine') {
        const { machineId, licenseId } = payload || {};
        const lic = licenses.find(l => l.id === machineId || l.id === licenseId || l.deviceId === machineId);
        if (lic) {
          lic.deviceId = null;
          lic.deviceName = null;
          lic.devicePlatform = null;
          lic.deviceAssociatedAt = null;
          saveLicenses(licenses);
        }
        return res.status(200).json({ success: true, message: 'Machine HWID unlinked successfully.' });
      }

      if (action === 'suspend') {
        const { licenseId } = payload || {};
        const lic = licenses.find(l => l.id === licenseId);
        if (lic) {
          lic.status = lic.status === 'suspended' ? 'active' : 'suspended';
          saveLicenses(licenses);
        }
        return res.status(200).json({ success: true, message: 'License status updated.' });
      }

      if (action === 'bind_hwid') {
        const { key, hwid, deviceName, devicePlatform } = payload || {};
        const cleanKey = (key || '').trim().toUpperCase();
        const cleanHwid = (hwid || '').trim().toUpperCase();
        const lic = licenses.find(l => l.key.toUpperCase() === cleanKey);
        if (!lic) {
          return res.status(404).json({ success: false, message: 'License key not found.' });
        }
        if (lic.deviceId && lic.deviceId.toUpperCase() !== cleanHwid) {
          return res.status(403).json({
            success: false,
            message: 'License is locked to a different computer (HWID mismatch). Reset HWID in portal.'
          });
        }
        lic.deviceId = cleanHwid;
        lic.deviceName = deviceName || 'Windows PC';
        lic.devicePlatform = devicePlatform || 'Windows';
        lic.deviceAssociatedAt = new Date().toISOString();
        saveLicenses(licenses);
        return res.status(200).json({
          success: true,
          message: 'Hardware ID locked to this machine.',
          deviceId: cleanHwid
        });
      }

      if (action === 'verify') {
        const { key, hwid, deviceName, devicePlatform } = payload || {};
        const cleanKey = (key || '').trim().toUpperCase();
        const cleanHwid = (hwid || '').trim().toUpperCase();
        const lic = licenses.find(l => l.key.toUpperCase() === cleanKey);
        if (!lic) {
          return res.status(404).json({ valid: false, message: 'Invalid license key. Check your key or get access at https://discord.gg/yoga' });
        }
        if (lic.status === 'revoked') {
          return res.status(403).json({ valid: false, message: 'This license has been revoked.' });
        }
        if (lic.status === 'suspended') {
          return res.status(403).json({ valid: false, message: 'This license has been suspended.' });
        }
        if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) {
          return res.status(403).json({ valid: false, message: 'This license has expired.' });
        }
        if (lic.deviceId && lic.deviceId.toUpperCase() !== cleanHwid) {
          return res.status(403).json({
            valid: false,
            message: 'License is locked to a different computer. Reset HWID in the portal or contact staff.'
          });
        }
        if (!lic.deviceId) {
          lic.deviceId = cleanHwid;
          lic.deviceName = deviceName || 'Windows PC';
          lic.devicePlatform = devicePlatform || 'Windows';
          lic.deviceAssociatedAt = new Date().toISOString();
          saveLicenses(licenses);
        }
        return res.status(200).json({
          valid: true,
          plan: lic.plan || 'Professional',
          assignedTo: lic.assignedTo || 'Valued User',
          expiresAt: lic.expiresAt || '',
          deviceId: cleanHwid,
          message: 'License verified successfully!'
        });
      }

      return res.status(400).json({ success: false, message: 'Unknown action: ' + action });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
