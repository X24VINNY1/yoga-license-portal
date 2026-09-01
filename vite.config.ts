import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const KEYGEN_ACCOUNT_ID = 'b74d3a4e-2882-4275-8f0d-b6106ed0e220'
const KEYGEN_POLICY_ID  = 'dd3292f7-ad4e-4e26-bdd1-a4ae8deb9ffd'
const KEYGEN_TOKEN      = 'admin-399429246438a778d4bd5a4a0d30c0e5e4b247126915969a858ee7d5c02a2721v3'

const KEYGEN_HEADERS = {
  Authorization: `Bearer ${KEYGEN_TOKEN}`,
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
}

function keygenDevServerPlugin(): Plugin {
  return {
    name: 'keygen-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        if (req.url.startsWith('/api/keygen')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', '*')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          if (req.method === 'GET') {
            try {
              const [licRes, machRes] = await Promise.all([
                fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, { headers: KEYGEN_HEADERS }),
                fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`, { headers: KEYGEN_HEADERS }),
              ])

              const licData = await licRes.json()
              const machData = await machRes.json()

              const machines = machData.data || []
              const licenses = (licData.data || []).map((l: any) => {
                const attrs = l.attributes || {}
                const meta = attrs.metadata || {}
                const machine = machines.find((m: any) => m.relationships?.license?.data?.id === l.id)

                let status = 'active'
                if (attrs.status === 'SUSPENDED') status = 'suspended'
                else if (attrs.status === 'EXPIRED') status = 'expired'
                else if (attrs.status === 'BANNED') status = 'revoked'

                return {
                  id: l.id,
                  key: attrs.key,
                  status,
                  plan: meta.plan || 'Professional',
                  assignedTo: attrs.name || 'Customer',
                  assignedEmail: meta.email || 'customer@yogavision.app',
                  createdAt: attrs.created,
                  expiresAt: attrs.expiry || '2099-01-01T00:00:00Z',
                  createdBy: 'Keygen Cloud',
                  deviceId: machine ? machine.attributes.fingerprint : null,
                  machineId: machine ? machine.id : null,
                  deviceName: machine ? machine.attributes.name : null,
                  devicePlatform: machine ? machine.attributes.platform : null,
                  deviceAssociatedAt: machine ? machine.attributes.created : null,
                  notes: meta.notes || '',
                }
              })

              res.statusCode = 200
              res.end(JSON.stringify({ success: true, licenses, machines }))
            } catch (err: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const { action, payload } = JSON.parse(body || '{}')

                if (action === 'create') {
                  const { name, email, plan, duration, notes } = payload || {}
                  let expiryDate: string | null = null

                  if (duration !== 'Lifetime') {
                    const daysMap: Record<string, number> = {
                      '1 Day': 1,
                      '3 Days': 3,
                      '5 Days': 5,
                      '7 Days': 7,
                      '1 Month': 30,
                      '3 Months': 90,
                      '6 Months': 180,
                      '1 Year': 365,
                      '2 Years': 730,
                    }
                    const days = daysMap[duration] || 365
                    const d = new Date()
                    d.setDate(d.getDate() + days)
                    expiryDate = d.toISOString()
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
                  }

                  if (expiryDate) {
                    bodyPayload.data.attributes.expiry = expiryDate
                  }

                  const createRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, {
                    method: 'POST',
                    headers: KEYGEN_HEADERS,
                    body: JSON.stringify(bodyPayload),
                  })

                  const createdJson = await createRes.json()
                  res.statusCode = createRes.status
                  res.end(JSON.stringify({ success: createRes.ok, data: createdJson.data }))
                  return
                }

                if (action === 'delete') {
                  const { licenseId } = payload || {}
                  const delRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/${licenseId}`, {
                    method: 'DELETE',
                    headers: KEYGEN_HEADERS,
                  })
                  res.statusCode = 200
                  res.end(JSON.stringify({ success: true, message: 'License deleted' }))
                  return
                }

                if (action === 'reset_machine') {
                  const { machineId } = payload || {}
                  const delMachRes = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines/${machineId}`, {
                    method: 'DELETE',
                    headers: KEYGEN_HEADERS,
                  })
                  res.statusCode = 200
                  res.end(JSON.stringify({ success: true, message: 'Machine unlinked' }))
                  return
                }

                if (action === 'suspend' || action === 'reinstate') {
                  const { licenseId } = payload || {}
                  const actUrl = `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/${licenseId}/actions/${action}`
                  const actRes = await fetch(actUrl, { method: 'POST', headers: KEYGEN_HEADERS })
                  const actJson = await actRes.json()
                  res.statusCode = actRes.status
                  res.end(JSON.stringify({ success: actRes.ok, data: actJson }))
                  return
                }

                res.statusCode = 400
                res.end(JSON.stringify({ success: false, message: 'Unknown action' }))
              } catch (e: any) {
                res.statusCode = 500
                res.end(JSON.stringify({ success: false, error: e.message }))
              }
            })
            return
          }
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keygenDevServerPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
