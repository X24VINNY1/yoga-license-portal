// Standalone Portal License Database
import fs from 'fs';

const TMP_FILE = '/tmp/yoga_licenses.json';

const INITIAL_LICENSES = [
  {
    id: 'l1',
    key: 'YV27-A3K7-M9PX-Q2RN',
    status: 'active',
    plan: 'Professional',
    assignedTo: 'Tyler Brooks',
    assignedEmail: 'tyler.brooks@gmail.com',
    createdAt: '2025-01-15T10:00:00Z',
    expiresAt: '2028-01-15T10:00:00Z',
    createdBy: 'Owner',
    deviceId: null,
    deviceName: null,
    devicePlatform: null,
    deviceAssociatedAt: null,
    notes: 'Initial production key',
  },
  {
    id: 'l2',
    key: 'YV27-B8HJ-T4WZ-K6LS',
    status: 'active',
    plan: 'Enterprise',
    assignedTo: 'Courtney Navarro',
    assignedEmail: 'cnavarro@promail.io',
    createdAt: '2025-02-01T11:00:00Z',
    expiresAt: '2028-02-01T11:00:00Z',
    createdBy: 'Owner',
    deviceId: null,
    deviceName: null,
    devicePlatform: null,
    deviceAssociatedAt: null,
    notes: 'Priority customer',
  },
  {
    id: 'l3',
    key: 'YV27-Y01-TEST-VALID',
    status: 'active',
    plan: 'Lifetime',
    assignedTo: 'Official User',
    assignedEmail: 'user@yogavision.app',
    createdAt: new Date().toISOString(),
    expiresAt: '2099-01-01T00:00:00Z',
    createdBy: 'Owner',
    deviceId: null,
    deviceName: null,
    devicePlatform: null,
    deviceAssociatedAt: null,
    notes: 'Master activation key',
  }
];

let memLicenses = [...INITIAL_LICENSES];

export function getLicenses() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return memLicenses;
}

export function saveLicenses(licenses) {
  memLicenses = licenses;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(licenses, null, 2), 'utf-8');
  } catch (e) {}
}
