const Stripe = require('stripe');

let stripe;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe is not configured. Set STRIPE_SECRET_KEY on the server.');
    error.status = 503;
    throw error;
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

module.exports = { getStripe };
