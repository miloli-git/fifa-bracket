# Deployment Guide

This guide will help you deploy your FIFA Tournament app to the web for free!

## Option 1: Render (Recommended - Easiest)

Render is the easiest option with persistent storage support.

### Steps:

1. **Sign up for Render**
   - Go to https://render.com
   - Sign up with GitHub (this makes deployment super easy)

2. **Deploy from GitHub**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your `fifa-bracket` repository
   - Render will auto-detect it's a Node.js app

3. **Configure the service**
   - Name: `fifa-bracket` (or whatever you prefer)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

4. **Deploy**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your app will be live at: `https://fifa-bracket-xxxx.onrender.com`

5. **Important Note**
   - Free tier spins down after 15 minutes of inactivity
   - First request after inactivity may take 30-60 seconds to wake up
   - Tournament data persists between restarts

---

## Option 2: Railway

Railway offers excellent free tier and automatic deployments.

### Steps:

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `fifa-bracket` repository

3. **Configuration**
   - Railway auto-detects Node.js and uses the correct start command
   - Click "Deploy Now"
   - Get your URL from the "Settings" tab under "Domains"

4. **Add a Domain**
   - In Settings → Domains
   - Click "Generate Domain"
   - Your app will be at: `https://fifa-bracket-production.up.railway.app`

---

## Option 3: Vercel

Vercel is great but has some limitations for persistent storage.

### Steps:

1. **Sign up for Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your `fifa-bracket` repository
   - Vercel auto-detects the framework

3. **Deploy**
   - Click "Deploy"
   - Your app will be live at: `https://fifa-bracket-xxxx.vercel.app`

4. **⚠️ Important Limitation**
   - Vercel's serverless functions are read-only
   - Tournament data won't persist between deployments
   - Consider adding a database (see "Adding Database Storage" below)

---

## Option 4: Fly.io

Free tier with good performance and persistent storage.

### Steps:

1. **Install Fly CLI**
   ```bash
   # On Mac
   brew install flyctl

   # On Linux
   curl -L https://fly.io/install.sh | sh

   # On Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Sign up and Login**
   ```bash
   fly auth signup
   # or
   fly auth login
   ```

3. **Deploy**
   ```bash
   cd fifa-bracket
   fly launch
   ```
   - App name: `fifa-bracket` (or your choice)
   - Region: Choose closest to you
   - Database: No (we're using JSON files)
   - Deploy now: Yes

4. **Your app is live!**
   - URL: `https://fifa-bracket.fly.dev`

---

## Option 5: Self-Hosting (Your Own Server)

If you have a VPS or home server:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fifa-bracket.git
   cd fifa-bracket
   npm install
   ```

2. **Run with PM2 (keeps app running)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name fifa-bracket
   pm2 startup  # Auto-start on reboot
   pm2 save
   ```

3. **Setup reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Upgrading: Adding Database Storage

For production use, replace JSON file storage with a database.

### Option A: MongoDB Atlas (Free Tier)

1. **Sign up at https://mongodb.com/cloud/atlas**
2. **Install mongoose**
   ```bash
   npm install mongoose
   ```

3. **Update server.js** to use MongoDB instead of JSON files

### Option B: PostgreSQL (Render/Railway)

Both Render and Railway offer free PostgreSQL databases:

1. **Add database to your service**
2. **Install pg library**
   ```bash
   npm install pg
   ```

3. **Update server.js** to use PostgreSQL

### Option C: Supabase (Free PostgreSQL + API)

1. **Sign up at https://supabase.com**
2. **Create project and get API keys**
3. **Install supabase-js**
   ```bash
   npm install @supabase/supabase-js
   ```

---

## Environment Variables

If you need to set environment variables (like database URLs):

### Render
- Settings → Environment → Add Environment Variable

### Railway
- Variables tab → Add Variable

### Vercel
- Settings → Environment Variables

### Example variables:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=your-database-url
```

---

## Custom Domain

All platforms support custom domains:

1. **Buy domain** (Namecheap, Google Domains, etc.)
2. **Add to platform**:
   - Render: Settings → Custom Domain
   - Railway: Settings → Domains → Custom Domain
   - Vercel: Settings → Domains → Add
3. **Update DNS** with provided records
4. **Wait for SSL** (auto-generated, takes 5-10 minutes)

---

## Monitoring Your Deployment

- **Render**: Built-in logs and metrics
- **Railway**: Deployment logs in dashboard
- **Vercel**: Analytics and logs tabs
- **Fly.io**: `fly logs` command

---

## Cost Comparison

| Platform | Free Tier | Limitations | Best For |
|----------|-----------|-------------|----------|
| **Render** | ✅ 750hrs/month | Spins down after 15min | Best overall |
| **Railway** | ✅ $5 credit/month | Usage-based billing | Active tournaments |
| **Vercel** | ✅ Unlimited | No persistent storage | Needs database |
| **Fly.io** | ✅ 3 VMs free | 256MB RAM | Good alternative |

---

## My Recommendation

**For casual use with friends (tournaments once a week):**
→ Use **Render** (free, easy, persistent storage)

**For frequent tournaments:**
→ Use **Railway** (fast, reliable, auto-deploys)

**For maximum control:**
→ Use **Fly.io** or self-host

---

## Need Help?

- Render docs: https://render.com/docs
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Fly.io docs: https://fly.io/docs
