# Yoga Vision 27 — License Server & Dashboard

## Application Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend API**: Vercel Serverless Functions (`/api/verify`, `/api/state`)
- **Theme**: Dark obsidian `#080e1a` with sky blue `#60a5fa` accents
- **Role Permissions**:
  - `owner`: Full control (delete licenses, delete staff accounts, delete & clear audit logs, reset HWIDs)
  - `admin`: Manage & delete license keys
  - `staff`: Read-only / view operations
