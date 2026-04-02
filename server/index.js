require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const potRoutes = require('./routes/pots');
const inventoryRoutes = require('./routes/inventory');
const productConfigRoutes = require('./routes/productConfig');
const imageRoutes = require('./routes/images');
const webhookRoutes = require('./routes/webhooks');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/pots', potRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/product-config', productConfigRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/activity', activityRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Plant + Pot Bundle App running on port ${PORT}`);
});
