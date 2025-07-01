# AT-ICT Backend Deployment on Railway

## Step-by-Step Guide

### 1. Create a Railway Account

1. Go to [Railway.app](https://railway.app/) and create an account
2. Connect your GitHub account

### 2. Create a New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your AT-ICT_Test repository
4. Railway will automatically detect the backend Node.js app

### 3. Configure the Project

1. In your project settings, go to the "Variables" tab
2. Add the following environment variables:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://[your-mongodb-connection-string]
JWT_SECRET=[your-secure-random-string]
CLIENT_URL=[your-vercel-frontend-url]
PORT=5000
```

3. Go to the "Settings" tab
4. Ensure that Railway is using Node.js 18 or higher

### 4. Deploy

1. Railway will automatically deploy your application
2. Wait for the deployment to complete (you'll see a green "Deployed" status)
3. Click the generated domain to access your API

### 5. Connect Your Vercel Frontend

1. Copy your Railway backend URL (e.g., https://atict-backend-production.up.railway.app)
2. Go to your Vercel project settings for the frontend
3. Add an environment variable:

```
REACT_APP_API_URL=https://your-railway-backend-url.app
```

4. Trigger a redeployment of your frontend

## Troubleshooting

### Issue: Application fails to start

**Solution**: Check the logs for errors. Common issues include:
- Missing environment variables
- MongoDB connection issues
- Port conflicts

### Issue: Socket.IO not working

**Solution**: Ensure your Railway app has WebSocket support enabled and your frontend is using the correct Socket.IO URL.

### Issue: File uploads not working

**Solution**: Railway's filesystem is ephemeral. Consider these alternatives:
1. Use Cloudinary for file storage (recommended)
2. Set up an AWS S3 bucket for file storage
3. Use MongoDB GridFS for storing files directly in your database

## MongoDB Setup

For production deployment, you should use MongoDB Atlas:

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up a database user with a secure password
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get your connection string and add it to your Railway environment variables

## Maintenance

### Logs
- View logs in the Railway dashboard under the "Logs" tab

### Monitoring
- Set up monitoring by connecting your Railway project to [UptimeRobot](https://uptimerobot.com/) using the health endpoint

### Scaling
- Upgrade your Railway plan if you need more resources

## Security Best Practices

1. **Never commit sensitive information** to your repository
2. Use environment variables for all secrets and configurations
3. Implement rate limiting to prevent abuse
4. Keep your dependencies updated to patch security vulnerabilities 