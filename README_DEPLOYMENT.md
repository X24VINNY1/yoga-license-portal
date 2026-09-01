# 🏺 Yoga Vision 27 — License & HWID Portal Deployment Guide

## 🌐 Deploy to Vercel (1-Click Sync)

This portal provides:
1. **Admin Management Dashboard**: Manage Staff Credentials, Product License Keys, Plan Tiers, and Durations.
2. **HWID Locking Engine**: Tracks Machine Hardware IDs (`YV-XXXX-XXXX-XXXX-XXXX`) and automatically locks licenses to client devices.
3. **Vercel Serverless Verification API**: `/api/verify` handles real-time authentication with the desktop application (`YogaVision27.exe`).

---

### 🚀 Step 1: Push to your GitHub Repository

1. Initialize git in this directory (or drag & drop the folder into GitHub / GitHub Desktop):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Yoga Vision 27 License Portal"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/yoga-license-portal.git
   git push -u origin main
   ```

---

### ⚡ Step 2: Connect to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Select your imported GitHub repository (`yoga-license-portal`).
3. Set **Framework Preset**: `Vite`.
4. Click **Deploy**.

Vercel will automatically build the web dashboard and deploy the serverless functions in `/api/verify` and `/api/state`.

---

### 🔑 Default Owner Login

- **URL**: `https://your-domain.vercel.app`
- **Email**: `owner@yogavision.app`
- **Password**: `owner123` *(Change this in the Staff tab after logging in)*

---

### 🛡️ How HWID Verification Works in the Desktop App (`YogaVision27.exe`)

1. User opens `YogaVision27.exe` and clicks **Manage Key / HWID** (or clicks **START APP**).
2. The app detects the computer's unique Hardware ID (e.g. `YV-ED6D-CA4B-B998-ACD5`).
3. The user inputs their product key (e.g. `YV27-A3K7-M9PX-Q2RN`).
4. The client contacts `https://your-domain.vercel.app/api/verify`:
   - If the key is new, it binds the machine's HWID to the key.
   - If the key is already bound to another PC, access is denied (HWID Mismatch).
   - If active & matched, auto-green shooting is unlocked!
