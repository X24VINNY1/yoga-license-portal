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

    // Delegate to keygen.js — single unified source of truth for all licenses
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || 'yoga-license-portal.vercel.app';
    const keygenUrl = ${proto}://System.Management.Automation.Internal.Host.InternalHost/api/keygen;

    const response = await fetch(keygenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        payload: { key, hwid, deviceName, devicePlatform }
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Server error verifying license: ' + err.message });
  }
}
