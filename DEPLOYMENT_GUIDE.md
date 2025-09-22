# Deployment Guide for Grad-Sync with Socket.IO

This guide will help you deploy your application with working real-time chat features.

## Architecture Overview

Your app has two parts:
1. **Frontend (React + Vite)** - Deploy to Vercel, Netlify, or similar
2. **Socket Server (Node.js)** - Deploy to Railway, Render, or Heroku

## Step 1: Deploy Socket Server

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Create a new project from your GitHub repository
3. Set service name to `socket-server`
4. Set start command to: `node socket-server.js`
5. Add environment variables:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app` (you'll get this in Step 2)

### Option B: Render
1. Go to [Render.com](https://render.com) and connect your GitHub
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `node socket-server.js`
5. Set environment variables:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`

### Option C: Heroku
1. Install Heroku CLI and login
2. Create a new Heroku app: `heroku create your-socket-server-name`
3. Add buildpack: `heroku buildpacks:set heroku/nodejs`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL=https://your-frontend-domain.vercel.app
   ```
5. Deploy: `git push heroku main`

## Step 2: Deploy Frontend

### Option A: Vercel (Recommended)
1. Go to [Vercel.com](https://vercel.com) and import your GitHub repository
2. Set build command: `npm run build:prod`
3. Set environment variables:
   - `VITE_SUPABASE_PROJECT_ID=cchvsqeqiavhanurnbeo`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `VITE_SUPABASE_URL=https://cchvsqeqiavhanurnbeo.supabase.co`
   - `VITE_SOCKET_URL=https://your-socket-server.railway.app` (from Step 1)

### Option B: Netlify
1. Go to [Netlify.com](https://netlify.com) and connect your GitHub repository
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Add environment variables (same as Vercel above)

## Step 3: Update CORS Configuration

After getting your frontend domain from Step 2:

1. Go back to your socket server deployment platform
2. Update the `CLIENT_URL` environment variable with your actual frontend domain
3. In your socket-server.js, replace the placeholder URLs:
   ```javascript
   const corsOrigins = process.env.NODE_ENV === 'production' 
     ? [
         process.env.CLIENT_URL,
         'https://your-actual-frontend-domain.vercel.app', // Your real domain
       ].filter(Boolean)
     : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'];
   ```

## Step 4: Test the Deployment

1. Visit your frontend URL
2. Open browser console and look for socket connection messages
3. Try the chat features
4. If socket connection fails, chat will still work without real-time features

## Troubleshooting

### Socket Connection Issues:
1. Check browser console for error messages
2. Verify `VITE_SOCKET_URL` points to your deployed socket server
3. Ensure socket server is running (check deployment logs)
4. Verify CORS settings include your frontend domain

### Environment Variables:
- Frontend env vars must start with `VITE_`
- Socket server env vars: `NODE_ENV`, `CLIENT_URL`
- Double-check all URLs (no trailing slashes)

### Common Problems:
1. **"Socket connection error"** → Check if socket server is deployed and running
2. **CORS errors** → Update CLIENT_URL to match your frontend domain
3. **Chat works but not real-time** → Socket connection failed, but fallback mode is working

## Development vs Production

- **Development**: Socket runs on localhost:3002
- **Production**: Socket runs on your deployed server URL

The app automatically detects the environment and switches URLs accordingly.