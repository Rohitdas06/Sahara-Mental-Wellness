# 🚀 Vercel Deployment Guide - Sahara Mental Wellness

## ✅ What I've Prepared

### Files Created:
- ✅ `vercel.json` - Main Vercel configuration
- ✅ `frontend/vercel.json` - Frontend-specific config
- ✅ `backend/vercel.json` - Backend-specific config
- ✅ `backend/api/index.js` - Vercel serverless function
- ✅ `backend/api/package.json` - API dependencies
- ✅ Updated `frontend/src/config.js` - For Vercel API routes

## 🚀 Step-by-Step Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy the Project
```bash
# From the root directory
vercel
```

### Step 4: Set Environment Variables
After deployment, you'll need to set your Google Gemini API key:

```bash
# Set the environment variable
vercel env add GEMINI_API_KEY
# Enter your API key when prompted
```

Or through the Vercel dashboard:
1. Go to your project dashboard
2. Go to Settings → Environment Variables
3. Add `GEMINI_API_KEY` with your Google Gemini API key

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

## 🔧 Alternative: Deploy via GitHub

### Option 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Add environment variables in the dashboard
7. Deploy!

### Option 2: Manual Upload
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Upload your project folder
4. Vercel will use the `vercel.json` configuration
5. Add environment variables
6. Deploy!

## 📋 Project Structure for Vercel

```
Sahara-Mental-Wellness/
├── vercel.json                 # Main config
├── frontend/
│   ├── vercel.json            # Frontend config
│   ├── src/
│   │   └── config.js          # Updated for Vercel
│   └── package.json
├── backend/
│   ├── vercel.json            # Backend config
│   └── api/
│       ├── index.js           # Serverless function
│       └── package.json       # API dependencies
└── routes/
    └── journal.js             # Journal routes
```

## 🌐 How It Works

### Frontend:
- Deployed as a static site
- Serves from `/` (root)
- All routes redirect to `index.html` for SPA routing

### Backend:
- Deployed as serverless functions
- API routes available at `/api/*`
- Main API handler at `/api/index.js`

### Routing:
- `/` → Frontend (React app)
- `/api/*` → Backend API
- All other routes → Frontend (for SPA routing)

## 🔑 Environment Variables Needed

### Required:
- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional:
- `NODE_ENV` - Set to "production" (auto-set by Vercel)

## 🧪 Testing Your Deployment

### 1. Test Frontend:
- Visit your Vercel URL
- Try logging in as a guest
- Test the chat interface

### 2. Test Backend:
- Visit `https://your-app.vercel.app/api/session-info`
- Should return JSON response

### 3. Test Full Integration:
- Use the chat feature
- Try journaling
- Check browser console for errors

## 🐛 Troubleshooting

### If frontend shows 404:
- Check that `frontend/vercel.json` exists
- Verify the build command in `package.json`
- Check Vercel build logs

### If API calls fail:
- Verify `GEMINI_API_KEY` is set
- Check Vercel function logs
- Ensure API routes are working

### If build fails:
- Check Node.js version (Vercel uses 18.x)
- Verify all dependencies are in `package.json`
- Check for any syntax errors

## 📊 Vercel Dashboard

After deployment, you can:
- View deployment logs
- Monitor function performance
- Manage environment variables
- View analytics
- Set up custom domains

## 🎯 Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check status
vercel ls
```

## ✅ Success Checklist

- [ ] Vercel CLI installed
- [ ] Project deployed to Vercel
- [ ] Environment variables set
- [ ] Frontend loads correctly
- [ ] API endpoints working
- [ ] Chat functionality working
- [ ] Journal functionality working
- [ ] No console errors

## 🎉 Benefits of Vercel

- ✅ **Easy deployment** - One command deploy
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Serverless functions** - No server management
- ✅ **Git integration** - Auto-deploy on push
- ✅ **Environment management** - Easy config management
- ✅ **Free tier** - Great for personal projects

Your Sahara Mental Wellness app will be live on Vercel! 🚀
