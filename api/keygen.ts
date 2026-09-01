import type { VercelRequest, VercelResponse } from '@vercel/node';

const KEYGEN_ACCOUNT_ID = 'b74d3a4e-2882-4275-8f0d-b6106ed0e220';
const KEYGEN_POLICY_ID  = 'dd3292f7-ad4e-4e26-bdd1-a4ae8deb9ffd';
const KEYGEN_TOKEN      = 'admin-399429246438a778d4bd5a4a0d30c0e5e4b247126915969a858ee7d5c02a2721v3';

const KEYGEN_HEADERS = {
  Authorization: `Bearer ${KEYGEN_TOKEN}`,
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ── 1. GET: Fetch all licenses and linked machines directly from Keygen.sh ──
    if (req.method === 'GET') {
      const [licRes, machRes] = await Promise.all([
        fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, { headers: KEYGEN_HEADERS }),
        fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`, { headers: KEYGEN_HEADERS }),
      ]);

      const licData = await licRes.json();
      const machData = await machRes.json();

      const machines = machData.data || [];
      const licenses = (licData.data || []).map((l: any) => {
        const attrs = l.attributes || {};
        const meta = attrs.metadata || {};

        // Find linked machine
        const machine = machines.find((m: any) => m.relationships?.license?.data?.id === l.id);

        let status = 'active';
        if (attrs.status === 'SUSPENDED') status = 'suspended';
        else if (attrs.status === 'EXPIRED') status = 'expired';
        else if (attrs.status === 'BANNED') status = 'revoked';

        return {
          id: l.id,
          key: attrs.key,
          status,
          plan: meta.plan || 'Professional',
          assignedTo: attrs.name || 'Customer',
          assignedEmail: meta.email || 'customer@yogavision.app',
          createdAt: attrs.created,
          expiresAt: attrs.expiry || '2099-01-01T00:00:00Z',
          createdBy: 'Keygen Admin',
          deviceId: machine ? machine.attributes.fingerprint : null,
          machineId: machine ? machine.id : null,
          deviceName: machine ? machine.attributes.name : null,
          devicePlatform: machine ? machine.attributes.platform : null,
          deviceAssociatedAt: machine ? machine.attributes.created : null,
          notes: meta.notes || '',
        };
      });

      return res.status(200).json({ success: true, licenses, machines });
    }

    // ── 2. POST: Actions (Create License, Reset Machine HWID, Suspend, Revoke) ──
    if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      // ACTION: Create License
      if (action === 'create') {
        const { name, email, plan, duration, notes } = payload || {};
        let expiryDate: string | null = null;

        if (duration !== 'Lifetime') {
          const daysMap: Record<string, number> = {
            '1 Month': 30,
            '3 Months': 90,
            '6 Months': 180,
            '1 Year': 365,
            '2 Years': 730,
          };
          const days = daysMap[duration] || 365;
          const d = new Date();
          d.setDate(d.getDate() + days);
          expiryDate = d.toISOString();
        }

        const bodyPayload: any = {
          data: {
            type: 'licenses',
            attributes: {
              name: name || 'Active Customer',
              metadata: {
                email: email || '',
                plan: plan || 'Professional',
                notes: notes || '',
                duration: duration || '1 Year',
              },
            },
            relationships: {
              policy: {
                data: { type: 'policies', id: KEYGEN_POLICY_ID },
              },
            },
          },
        };

        if (expiryDate) {
          bodyPayload.data.attributes.expiry = expiryDate;
        }

        const createRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, {
          method: 'POST',
          headers: KEYGEN_HEADERS,
          body: JSON.stringify(bodyPayload),
        });

        const createdJson = await createRes.json();
        if (!createRes.ok) {
          return res.status(createRes.status).json({ success: false, error: createdJson });
        }

        return res.status(201).json({ success: true, data: createdJson.data });
      }

      // ACTION: Delete License
      if (action === 'delete') {
        const { licenseId } = payload || {};
        if (!licenseId) return res.status(400).json({ success: false, message: 'licenseId is required' });

        const delRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/${licenseId}`, {
          method: 'DELETE',
          headers: KEYGEN_HEADERS,
        });

        if (!delRes.ok && delRes.status !== 204) {
          const err = await delRes.text();
          return res.status(delRes.status).json({ success: false, error: err });
        }

        return res.status(200).json({ success: true, message: 'License deleted from Keygen.sh' });
      }

      // ACTION: Reset Machine HWID
      if (action === 'reset_machine') {
        const { machineId } = payload || {};
        if (!machineId) return res.status(400).json({ success: false, message: 'machineId is required' });

        const delMachRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines/${machineId}`, {
          method: 'DELETE',
          headers: KEYGEN_HEADERS,
        });

        if (!delMachRes.ok && delMachRes.status !== 204) {
          const err = await delMachRes.text();
          return res.status(delMachRes.status).json({ success: false, error: err });
        }

        return res.status(200).json({ success: true, message: 'Machine unlinked from Keygen.sh' });
      }

      // ACTION: Suspend / Reinstate / Revoke
      if (action === 'suspend' || action === 'reinstate') {
        const { licenseId } = payload || {};
        const actUrl = `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/${licenseId}/actions/${action}`;
        const actRes = await fetch(actUrl, { method: 'POST', headers: KEYGEN_HEADERS });
        const actJson = await actRes.json();
        return res.status(actRes.status).json({ success: actRes.ok, data: actJson });
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
