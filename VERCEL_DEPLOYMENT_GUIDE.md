# Vercel Deployment Guide for AT-ICT LMS Frontend

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com)
- Your project pushed to GitHub

### 2. Backend Setup (Railway)
Your backend is already configured for Railway deployment. Make sure it's deployed and get the production URL.

### 3. Frontend Deployment on Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` folder as the root directory

3. **Configure Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add the following variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your React app

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to Client Directory**
   ```bash
   cd client
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔧 Configuration Files

### vercel.json
This file is already created and configured to:
- Handle React Router routing
- Optimize static file caching
- Set build commands

### Environment Variables
You need to set these in Vercel dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-backend-url.railway.app` | Your Railway backend URL |
| `NODE_ENV` | `production` | Environment setting |

## 📁 Project Structure for Vercel

```
client/
├── public/
├── src/
├── package.json
├── vercel.json          # Vercel configuration
├── tailwind.config.js
└── build/              # Build output (auto-generated)
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check if all dependencies are in `package.json`
   - Ensure `react-scripts` is installed
   - Verify Node.js version compatibility
   - **Fix for "react-scripts: command not found"**:
     - Updated `vercel.json` with `CI=false npm run build`
     - Added `.nvmrc` file for Node.js version
     - Downgraded React to v18.2.0 for better compatibility

2. **API Calls Fail**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check CORS configuration on backend
   - Ensure backend is deployed and accessible

3. **Routing Issues**
   - The `vercel.json` handles React Router
   - All routes should redirect to `index.html`

4. **Environment Variables Not Working**
   - Variables must start with `REACT_APP_`
   - Redeploy after adding variables
   - Check variable names for typos

## 🌐 Domain Configuration

### Custom Domain (Optional)
1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## 📊 Monitoring & Analytics

### Vercel Analytics
- Automatically available in Vercel dashboard
- Track page views, performance, and errors

### Google Analytics (Optional)
1. Add `REACT_APP_GA_TRACKING_ID` environment variable
2. Implement GA in your React app

## 🔄 Continuous Deployment

Vercel automatically deploys when you:
- Push to `main` branch (production)
- Push to other branches (preview deployments)
- Create pull requests (preview deployments)

## 📱 Performance Optimization

Your app is already optimized with:
- Static file caching
- React production build
- Tailwind CSS optimization
- Image optimization (if using Vercel's image optimization)

## 🛡️ Security

- HTTPS automatically enabled
- Security headers configured
- CORS properly handled
- Rate limiting on backend

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API connectivity
4. Review browser console for errors

## 🎯 Next Steps

After deployment:
1. Test all features (login, chat, file uploads)
2. Configure custom domain (if needed)
3. Set up monitoring and analytics
4. Test on different devices/browsers
5. Document any specific configurations

---

**Deployment Checklist:**
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] API connectivity tested
- [ ] All features working
- [ ] Custom domain configured (optional)
- [ ] Analytics set up (optional) 