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
5. **Important**: Go to Network Access → Add IP → Allow `0.0.0.0/0` (allows all IPs)
6. **Save this URL** - you'll need it for Render

---

## Step 2: Deploy Backend to Render

### Option A: From GitHub (Recommended)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect GitHub repo → Select `/backend` folder as Root Directory
4. Settings:
   - **Name**: trukall-api
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Option B: Using render.yaml (Blueprint)
1. Push code with `render.yaml` to GitHub
2. Go to Render → New → Blueprint
3. Connect repo → Render reads `render.yaml` automatically

### Environment Variables (Set in Render Dashboard):

| Variable | Value | Required |
|----------|-------|----------|
| `MONGO_URL` | `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/trukall_db` | ✅ Yes |
| `DB_NAME` | `trukall_db` | ✅ Yes |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | ✅ Yes |
| `STRIPE_API_KEY` | `sk_test_...` or `sk_live_...` | ✅ Yes |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | ✅ Yes |
| `FMCSA_WEBKEY` | Get free from mobile.fmcsa.dot.gov | Optional |
| `EIA_API_KEY` | Get free from eia.gov/opendata | Optional |

### After Deploy:
- Note your Render URL: `https://trukall-api.onrender.com`
- Test health check: `https://trukall-api.onrender.com/api/health`

---

## Step 3: Deploy Frontend to Vercel

### From GitHub:
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo → Select `/frontend` folder as Root Directory
3. Framework Preset: **Create React App**
4. Build Settings:
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

### Environment Variables (Set in Vercel Dashboard):

| Variable | Value |
|----------|-------|
| `REACT_APP_BACKEND_URL` | `https://trukall-api.onrender.com` |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Your Google Maps API key |

### After Deploy:
- Your app is live at: `https://your-app.vercel.app`

---

## Step 4: Update CORS (Important!)

Go back to Render → Environment Variables and update:
```
CORS_ORIGINS=https://your-app.vercel.app
```

If you have multiple domains (e.g., custom domain + vercel subdomain):
```
CORS_ORIGINS=https://your-app.vercel.app,https://trukall.com
```

---

## Step 5: Optional Free APIs (Recommended)

### FMCSA API (Carrier Verification)
1. Go to [mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess](https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess)
2. Create account with Login.gov (free)
3. Go to "My WebKeys" → Generate new key
4. Add to Render: `FMCSA_WEBKEY=your_key_here`

### EIA API (Fuel Prices)
1. Go to [eia.gov/opendata](https://www.eia.gov/opendata/)
2. Register for free API key
3. Add to Render: `EIA_API_KEY=your_key_here`

---

## Quick Reference

### All Backend Environment Variables:
```bash
MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/trukall_db
DB_NAME=trukall_db
CORS_ORIGINS=https://your-app.vercel.app
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
FMCSA_WEBKEY=your_fmcsa_key  # Optional
EIA_API_KEY=your_eia_key     # Optional
```

### All Frontend Environment Variables:
```bash
REACT_APP_BACKEND_URL=https://trukall-api.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## Costs (Free Tier)

| Service | Cost | Limits |
|---------|------|--------|
| MongoDB Atlas | FREE | 512MB storage, shared cluster |
| Render | FREE | Spins down after 15min inactivity |
| Vercel | FREE | 100GB bandwidth/month |
| FMCSA API | FREE | Unlimited (fair use) |
| EIA API | FREE | 1000 requests/hour |

**Note**: Render free tier "sleeps" after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up. Upgrade to Starter ($7/month) for always-on.

---

## Troubleshooting

### Backend not connecting to MongoDB?
- Check MONGO_URL has correct username and password
- Whitelist `0.0.0.0/0` in MongoDB Atlas → Network Access
- Make sure cluster is active (not paused)

### CORS errors in browser console?
- Update `CORS_ORIGINS` in Render to match your Vercel URL exactly
- Include `https://` prefix
- No trailing slash
- Redeploy after changing

### Frontend can't reach backend?
- Check `REACT_APP_BACKEND_URL` is set correctly in Vercel
- Include `https://` and no trailing slash
- Check Render logs for backend errors

### Stripe payments not working?
- Use test keys for testing: `sk_test_...` and `pk_test_...`
- Test card: `4242 4242 4242 4242` (any future date, any CVC)
- For production, switch to live keys: `sk_live_...` and `pk_live_...`

### PWA install not working?
- PWA requires HTTPS (Vercel provides this automatically)
- Check manifest.json is being served
- Clear browser cache and try again

---

## Custom Domain (Optional)

### Vercel (Frontend):
1. Settings → Domains → Add your domain
2. Update DNS: CNAME → `cname.vercel-dns.com`

### Render (Backend):
1. Settings → Custom Domain → Add domain
2. Update DNS as instructed by Render

---

## Post-Deployment Checklist

- [ ] Backend health check works: `/api/health`
- [ ] Frontend loads without errors
- [ ] Login works with test account: `driver@test.com` / `password123`
- [ ] Google Maps loads (if API key configured)
- [ ] Stripe checkout works with test card
- [ ] PWA can be installed on mobile
- [ ] FMCSA verification works (if key configured)

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Driver | driver@test.com | password123 |
| Partner | partner@test.com | password123 |
| Admin | admin@test.com | password123 |
| Demo | Click "Try Demo Account" | Auto-generated |

**Stripe Test Card**: `4242 4242 4242 4242` (any future date, any 3-digit CVC)

---

## Live URLs After Deployment

- **Frontend**: https://trukall.vercel.app (or your custom domain)
- **Backend API**: https://trukall-api.onrender.com/api
- **Health Check**: https://trukall-api.onrender.com/api/health
- **API Docs**: https://trukall-api.onrender.com/docs (FastAPI auto-generated)

---

## Need Help?

1. **Render Issues**: [render.com/docs](https://render.com/docs)
2. **Vercel Issues**: [vercel.com/docs](https://vercel.com/docs)
3. **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
