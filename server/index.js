require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Fix: The official package is @shopify/shopify-api
const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');
const shopifyApp = require('@shopify/shopify-app-express').shopifyApp;
const { PostgreSQLSessionStorage } = require('@shopify/shopify-app-session-storage-postgresql');

// Routes will be required below after module.exports is set

const app = express();
const PORT = process.env.PORT || 3000;

// Use shopify-app-express for auth and session
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES ? process.env.SHOPIFY_SCOPES.split(',') : [],
    hostName: process.env.APP_URL ? process.env.APP_URL.replace(/https?:\/\//, '') : '',
    apiVersion: ApiVersion.October23,
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: new PostgreSQLSessionStorage(process.env.DATABASE_URL),
});

// Important: export shopify to use its API client in products.js
module.exports.shopify = shopify;

const authRoutes = require('./routes/auth');
const potRoutes = require('./routes/pots');
const inventoryRoutes = require('./routes/inventory');
const productConfigRoutes = require('./routes/productConfig');
const imageRoutes = require('./routes/images');
const webhookRoutes = require('./routes/webhooks');
const activityRoutes = require('./routes/activity');
const productRoutes = require('./routes/products'); // New route file

app.use(cors());
app.use(express.json());

// Shopify auth routes
app.get('/api/auth', shopify.auth.begin());
app.get('/api/auth/callback', shopify.auth.callback(), (req, res) => {
  const shop = req.query.shop;
  const host = req.query.host;
  res.redirect(`/?shop=${shop}&host=${host}`);
});

// Secure all /api/* routes with session validation (excluding auth and webhooks)
// app.use('/api/*', shopify.validateAuthenticatedSession());  <-- You can use this for production

// Your routes
app.use('/api/pots', potRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/product-config', productConfigRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/products', productRoutes); // New

// Webhooks (raw body)
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Add CSP header to allow Shopify to embed this app in an iframe
app.use((req, res, next) => {
  const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
  if (shop) {
    res.setHeader('Content-Security-Policy', `frame-ancestors https://${shop} https://admin.shopify.com;`);
  } else {
    res.setHeader('Content-Security-Policy', `frame-ancestors https://*.myshopify.com https://admin.shopify.com;`);
  }
  next();
});

// Always serve the React frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Plant + Pot Bundle App running on port ${PORT}`);
  });
}
