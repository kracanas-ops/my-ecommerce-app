const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../index');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('the API health route is public', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Ecommerce API is running/);
});

test('checkout requires an authenticated user', async () => {
  const response = await fetch(`${baseUrl}/api/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] })
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Sign in to continue.' });
});

test('order history requires an authenticated user', async () => {
  const response = await fetch(`${baseUrl}/api/orders`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Sign in to continue.' });
});

test('product management requires an authenticated administrator', async () => {
  const response = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized item', price: 1, stock: 1 })
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Sign in to continue.' });
});

test('the shopping assistant rejects empty messages', async () => {
  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /non-empty string/);
});

test('the shopping assistant rejects messages over the length limit', async () => {
  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(2001) })
  });
  assert.equal(response.status, 400);
});

test('the shopping assistant reports missing API configuration', async (t) => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  t.after(() => {
    if (previousKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousKey;
    }
  });

  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Compare reviews of wireless headphones.' })
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'The shopping assistant is not configured.' });
});
