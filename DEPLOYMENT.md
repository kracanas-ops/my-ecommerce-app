# Deployment Guide for Forma.store

This project is a full-stack e-commerce application with:
- **Backend**: Express.js server (port 5000) with MongoDB
- **Frontend**: React + Vite (port 5173)

## Option 1: Deploy with Railway (Recommended - Simplest)

Railway provides a seamless way to deploy both your backend and frontend as separate services.

### Step 1: Sign up for Railway
Go to [https://railway.app](https://railway.app) and sign up with GitHub.

### Step 2: Deploy Backend

1. Click **New Project** → **Deploy from GitHub repo**
2. Select your `my-ecommerce-app` repository
3. Configure the backend:
   - **Service Name**: forma-store-backend
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`
   - **Port**: 5000
   - **Environment Variables** (add these):
     ```
     NODE_ENV=production
     MONGO_URI=mongodb+srv://kracanas_db_user:HZ27aNWJxZYa7l4i@cluster0.kuwol7f.mongodb.net/?appName=Cluster0
     JWT_SECRET=mySuperSecretKey123
     FRONTEND_URL=https://your-frontend-url.vercel.app
     STRIPE_SECRET_KEY=your_stripe_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     OPENROUTER_API_KEY=your_openrouter_key
     ```
4. Click **Deploy**

### Step 3: Deploy Frontend

1. Click **New Project** → **Deploy from GitHub repo**
2. Select your `my-ecommerce-app` repository
3. Configure the frontend:
   - **Service Name**: forma-store-frontend
   - **Root Directory**: `frontend`
   - **Start Command**: `npm run build && npm run preview` (or just `vite`)
   - **Port**: 5173
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.up.railway.app
     VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key
     ```
4. Click **Deploy**

### Step 4: Update Backend with Frontend URL
Once frontend is deployed, update the backend's `FRONTEND_URL` environment variable with the actual frontend URL.

---

## Option 2: Deploy Backend on Render + Frontend on Vercel

### Backend on Render

1. Go to [https://render.com](https://render.com) and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: forma-store-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     MONGO_URI=mongodb+srv://kracanas_db_user:HZ27aNWJxZYa7l4i@cluster0.kuwol7f.mongodb.net/?appName=Cluster0
     JWT_SECRET=mySuperSecretKey123
     FRONTEND_URL=https://your-frontend.vercel.app
     PORT=5000
     ```
5. Click **Create Web Service**

### Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend.onrender.com
     VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key
     ```
5. Click **Deploy**

---

## Option 3: Docker Deployment (Advanced)

### Backend Dockerfile
A `Dockerfile` is already provided in the `/backend` directory.

#### Build and Run:
```bash
# Build backend image
cd backend
docker build -t forma-store-backend .

# Run with environment variables
docker run -p 5000:5000 \
  -e MONGO_URI=mongodb+srv://... \
  -e JWT_SECRET=... \
  -e FRONTEND_URL=https://... \
  forma-store-backend
```

### Frontend Dockerfile
Create a `Dockerfile` in the `/frontend` directory:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## Required Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://kracanas_db_user:HZ27aNWJxZYa7l4i@cluster0.kuwol7f.mongodb.net/?appName=Cluster0
JWT_SECRET=mySuperSecretKey123
FRONTEND_URL=https://your-frontend-url.com
PORT=5000
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEEPSEEK_MODEL=deepseek/deepseek-chat
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Frontend (.env.local)
```
VITE_API_URL=https://your-backend-url.com
VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key
```

---

## Post-Deployment Steps

1. **Set up Stripe Webhooks** (if using payments):
   ```bash
   stripe listen --forward-to https://your-backend-url.com/api/stripe/webhook
   ```
   Add the webhook secret to your backend's `STRIPE_WEBHOOK_SECRET` env var.

2. **Create Admin User**:
   - Register a user through the frontend
   - In your MongoDB database, update the user's `isAdmin` field to `true`

3. **Add Products**:
   - Use the admin dashboard at `/admin` to add products

---

## Current Live URLs (After Deployment)

Once deployed, you'll have:
- **Backend API**: `https://your-backend-service-url.com`
- **Frontend**: `https://your-frontend-url.com`

The frontend will automatically connect to the backend API.
