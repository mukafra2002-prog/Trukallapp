# TrukAll Deployment Guide

## Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel       │────▶│     Render      │────▶│  MongoDB Atlas  │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   React PWA     │     │   FastAPI       │     │   Free Tier     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Step 1: MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account → Create Cluster (Free M0)
3. Click "Connect" → "Connect your application"
4. Copy connection string: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/trukall_db`
5. **Save this URL** - you'll need it for Render

---

## Step 2: Deploy Backend to Render

### Option A: From GitHub (Recommended)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect GitHub repo → Select `/backend` folder
4. Settings:
   - **Name**: trukall-api
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Option B: Using render.yaml
1. Push code with `render.yaml` to GitHub
2. Go to Render → New → Blueprint
3. Connect repo → Render reads `render.yaml` automatically

### Environment Variables (Set in Render Dashboard):
```
MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/trukall_db
DB_NAME=trukall_db
CORS_ORIGINS=https://your-app.vercel.app
STRIPE_API_KEY=sk_live_xxxxx (or keep test key)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx (or keep test key)
```

### After Deploy:
- Note your Render URL: `https://trukall-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### From GitHub:
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo → Select `/frontend` folder
3. Framework Preset: **Create React App**
4. Build Settings:
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

### Environment Variables (Set in Vercel Dashboard):
```
REACT_APP_BACKEND_URL=https://trukall-api.onrender.com
```

### After Deploy:
- Your app is live at: `https://your-app.vercel.app`

---

## Step 4: Update CORS

Go back to Render → Environment Variables:
```
CORS_ORIGINS=https://your-app.vercel.app
```

---

## Quick Reference

### Render Environment Variables:
| Variable | Value |
|----------|-------|
| MONGO_URL | `mongodb+srv://...` (from Atlas) |
| DB_NAME | `trukall_db` |
| CORS_ORIGINS | `https://your-app.vercel.app` |
| STRIPE_API_KEY | `sk_test_...` or `sk_live_...` |
| STRIPE_PUBLISHABLE_KEY | `pk_test_...` or `pk_live_...` |

### Vercel Environment Variables:
| Variable | Value |
|----------|-------|
| REACT_APP_BACKEND_URL | `https://trukall-api.onrender.com` |

---

## Costs (Free Tier)

| Service | Cost | Limits |
|---------|------|--------|
| MongoDB Atlas | FREE | 512MB storage |
| Render | FREE | Spins down after 15min inactivity |
| Vercel | FREE | 100GB bandwidth/month |

**Note**: Render free tier "sleeps" after inactivity. First request takes ~30 seconds to wake up. Upgrade to $7/month for always-on.

---

## Troubleshooting

### Backend not connecting to MongoDB?
- Check MONGO_URL has correct password
- Whitelist `0.0.0.0/0` in Atlas Network Access

### CORS errors?
- Update CORS_ORIGINS in Render to match your Vercel URL exactly

### Frontend can't reach backend?
- Check REACT_APP_BACKEND_URL is set correctly in Vercel
- Make sure it includes `https://` and no trailing slash

---

## Custom Domain (Optional)

### Vercel:
1. Settings → Domains → Add your domain
2. Update DNS: CNAME → `cname.vercel-dns.com`

### Render:
1. Settings → Custom Domain → Add domain
2. Update DNS as instructed

---

## Live URLs After Deployment

- **Frontend**: https://trukall.vercel.app (or custom domain)
- **Backend API**: https://trukall-api.onrender.com/api
- **Health Check**: https://trukall-api.onrender.com/api/health
