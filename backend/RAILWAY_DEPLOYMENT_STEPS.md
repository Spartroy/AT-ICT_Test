# AT-ICT Backend Deployment on Railway

## Step-by-Step Instructions

### 1. Push the new files to your repository

Make sure to push the new files I've created to your repository:
- `backend/railway.Dockerfile`
- `backend/railway.toml`

### 2. Create a new Railway project

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 3. Important: Configure the root directory

1. In the project settings, find "Root Directory" 
2. **Set it to `/backend`** - this is critical!
3. Railway will now only build your backend folder

### 4. Add environment variables

Add these in the "Variables" tab:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/atict
JWT_SECRET=generate_a_strong_random_secret_here
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
```

### 5. MongoDB Atlas setup

If you haven't set up MongoDB Atlas yet:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account and cluster
3. Create a database user and password
4. Click "Connect" and choose "Connect your application"
5. Copy the connection string and replace `<username>`, `<password>`, and `<dbname>` with your values

### 6. Test your deployment

1. Wait for Railway to finish deploying
2. Visit your Railway URL + "/health" (e.g., https://your-backend.up.railway.app/health)
3. You should see a health status response

### 7. Connect your Vercel frontend

1. Go to your Vercel project settings
2. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```
3. Redeploy your frontend

### Troubleshooting

- If deployment fails, check Railway logs for errors
- If you see "Exit code 137" errors, your app may need more memory - upgrade Railway plan
- If you see connection errors to MongoDB, check your MONGO_URI is correct

### File uploads

For file uploads to work properly in production:
1. Set up a Cloudinary account
2. Add these environment variables to Railway:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Testing everything works

Once deployed:
1. Test login functionality
2. Test real-time chat (Socket.IO)
3. Test file uploads
4. Test other critical features

Let me know if you encounter any issues! 