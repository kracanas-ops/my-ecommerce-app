# Forma.store

A full-stack storefront built with React, Vite, Tailwind CSS, Express, MongoDB, and Stripe.

## Run locally

1. Install Node.js 20.19+ (or 22.12+) and start a MongoDB instance.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, a strong `JWT_SECRET`, Stripe test-mode keys, and `OPENAI_API_KEY` to enable the web-search shopping assistant.
3. Copy `frontend/.env.example` to `frontend/.env.local`. Set `VITE_STRIPE_PUBLISHABLE_KEY` to the matching Stripe publishable key.
4. In one terminal, run `cd backend`, `npm install`, then `npm run dev`.
5. In another terminal, run `cd frontend`, `npm install`, then `npm run dev`.

The backend inserts a small starter collection the first time it connects to an empty database. For local Stripe webhooks, run `stripe listen --forward-to localhost:5000/api/stripe/webhook` and put the CLI's signing secret in `STRIPE_WEBHOOK_SECRET`.

## Product photography

Starter product photos are optimized JPEGs bundled in `frontend/public/products` and served locally at `/products/...`, so product pages do not depend on Unsplash at runtime. The photos were sourced from Unsplash:

- [Headphones](https://images.unsplash.com/photo-1505740420928-5e560c06d30e)
- [Keyboard](https://images.unsplash.com/photo-1595225476474-87563907a212)
- [Monitor](https://images.unsplash.com/photo-1527443224154-c4a3942d3acf)

Add a product image through the admin dashboard with a local `/products/filename.jpg` path or an HTTPS image URL.

## Accounts and admin access

Register a regular account in the storefront. To grant administrator access, update that user's `isAdmin` field to `true` in the MongoDB `users` collection. The API checks the current database role for every protected request; registration never accepts a client-supplied admin flag.

## API overview

- `GET /api/products`, `GET /api/products/:id`
- `POST /api/users/register`, `POST /api/users/login`
- `POST /api/create-payment-intent` (authenticated; prices are read from MongoDB)
- `POST /api/orders/confirm`, `GET /api/orders` (authenticated)
- `POST /api/ai/chat` (JSON `{ "message": "..." }`; returns an assistant reply and web citations)
- `POST /api/products`, `DELETE /api/products/:id` (administrator)
- `POST /api/stripe/webhook` (Stripe signature verified when configured)

Keep Stripe secret/webhook keys and the JWT secret on the server only. The frontend uses only the publishable Stripe key. Set `FRONTEND_URL` to the deployed frontend origin(s), comma-separated if needed.
