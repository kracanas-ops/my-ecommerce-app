# ⚡ QUICK DEPLOY - Get Live in 5 Minutes

Follow these EXACT steps to deploy your website immediately.

---

## 🎯 RECOMMENDED: Railway (Both Backend + Frontend in ONE place)

### Step 1: Open Railway and Sign Up (30 seconds)
👉 Go to: [https://railway.app?referralCode=formastore](https://railway.app?referralCode=formastore)
- Click **Sign Up with GitHub**
- Authorize Railway

### Step 2: Deploy Backend (2 minutes)
1. Click **"New Project"** (top right)
2. Click **"Deploy from GitHub repo"**
3. Select your repository: `my-ecommerce-app`
4. Configure the backend service:
   - **Service Name**: `forma-backend`
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`
   - **Port**: `5000`
   - **Environment Variables** (click "Add Variable" for each):
     
     | Key | Value | Required |
     |-----|-------|----------|
     | `NODE_ENV` | `production` | ✅ |
     | `MONGO_URI` | `mongodb+srv://kracanas_db_user:HZ27aNWJxZYa7l4i@cluster0.kuwol7f.mongodb.net/?appName=Cluster0` | ✅ |
     | `JWT_SECRET` | `mySuperSecretKey123` | ✅ |
     | `FRONTEND_URL` | `https://forma-frontend.up.railway.app` | ✅ |
     | `STRIPE_SECRET_KEY` | (leave empty for now) | ❌ |
     | `OPENROUTER_API_KEY` | (leave empty for now) | ❌ |
   
5. Click **"Deploy"** button
6. **WAIT** for deployment to complete (you'll see a green checkmark ✅)
7. Note the **backend URL** (e.g., `https://forma-backend.up.railway.app`)

### Step 3: Deploy Frontend (2 minutes)
1. In Railway, click **"New"** → **"New Service"**
2. Select **"Deploy from GitHub repo"** again
3. Select the same repository: `my-ecommerce-app`
4. Configure the frontend service:
   - **Service Name**: `forma-frontend`
   - **Root Directory**: `frontend`
   - **Start Command**: `npm run build && npm run preview`
   - **Port**: `5173`
   - **Environment Variables**:
     
     | Key | Value | Required |
     |-----|-------|----------|
     | `VITE_API_URL` | `https://forma-backend.up.railway.app` | ✅ |
     | `VITE_STRIPE_PUBLISHABLE_KEY` | (leave empty for now) | ❌ |
   
5. Click **"Deploy"**
6. **WAIT** for deployment (green checkmark ✅)
7. Note the **frontend URL** (e.g., `https://forma-frontend.up.railway.app`)

### Step 4: Update Backend with Frontend URL (1 minute)
1. Go to your **backend service** in Railway
2. Click **"Variables"** tab
3. Find `FRONTEND_URL` variable
4. **Update its value** to match your actual frontend URL
5. Click **"Save"** → Railway will restart the backend

### Step 5: Test It!
👉 Open your **frontend URL** in a browser

✅ **YOU'RE LIVE!** Your website is now accessible to anyone on the internet.

---

## 🔄 Alternative: Render + Vercel

### If you prefer separate services:

#### Backend on Render:
1. Go to [https://render.com](https://render.com)
2. **New Web Service** → Connect GitHub → Select repo
3. **Root Directory**: `backend`
4. **Start Command**: `node index.js`
5. Add Environment Variables (same as Railway above)
6. Deploy

#### Frontend on Vercel:
1. Go to [https://vercel.com](https://vercel.com)
2. **Add New Project** → Import GitHub repo
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add Environment Variables:
   - `VITE_API_URL` = your Render backend URL
7. Deploy

---

## 📋 What You'll Get

After deployment, you'll have:

### Backend API Endpoints (all at your backend URL):
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/create-payment-intent` - Create Stripe payment
- `GET /api/orders` - Get user's orders
- `POST /api/orders/confirm` - Confirm order
- `POST /api/ai/chat` - AI shopping assistant
- `GET /` - Health check (returns "Ecommerce API is running successfully!")

### Frontend Pages:
- `/` - Homepage with product listings
- `/products/:id` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Checkout with Stripe
- `/orders` - Order history
- `/login` - Login page
- `/register` - Registration page
- `/admin` - Admin dashboard (requires admin user)

---

## ⚠️ Important Notes

1. **MongoDB is already configured** - Your existing Atlas connection works
2. **First user is admin** - After registering, you need to manually set `isAdmin: true` in MongoDB
3. **Add products** - Use the admin dashboard to add products
4. **Stripe keys** - Add them later when you're ready for real payments

---

## 🎉 Success!

Once you complete these steps, you'll have a **live, working e-commerce website** that anyone can visit!

**Share your URL with friends, family, or customers!**

Need help? The deployment usually takes 2-5 minutes total. If you get stuck, check:
- Railway/Render/Vercel logs for errors
- Ensure all environment variables are set correctly
- Your MongoDB connection is working
