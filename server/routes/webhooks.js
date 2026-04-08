const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { logActivity } = require('../services/activityService');
const inventoryService = require('../services/inventoryService');

function verifyWebhook(req) {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const body = req.body;
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!hmac || !secret) return false;
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    try {
        return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
    } catch (e) {
        return false;
    }
}

router.post('/orders/create', async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
        const order = JSON.parse(req.body);
        await inventoryService.processOrder(order, 'deduct');
        await logActivity('ORDER_CREATED', `Processed order ${order.id}`, { order_id: order.id, order_number: order.order_number });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        await logActivity('WEBHOOK_ERROR', `Order create webhook failed: ${error.message}`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/orders/cancelled', async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
        const order = JSON.parse(req.body);
        await inventoryService.processOrder(order, 'restore');
        await logActivity('ORDER_CANCELLED', `Restored inventory for order ${order.id}`, { order_id: order.id });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        await logActivity('WEBHOOK_ERROR', `Order cancelled webhook failed: ${error.message}`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/orders/refunded', async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
        const order = JSON.parse(req.body);
        if (order.financial_status === 'refunded') {
            await inventoryService.processOrder(order, 'restore');
            await logActivity('ORDER_REFUNDED', `Restored inventory for refunded order ${order.id}`, { order_id: order.id });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

const pool = require('../db/pool');

router.post('/products/delete', async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
        const data = JSON.parse(req.body);
        const shopifyProductId = data.id;

        console.log(`Webhook received: Sync-deleting product ${shopifyProductId} from DB because it was deleted in Shopify...`);

        // Remove from our database
        await pool.query('DELETE FROM product_pot_config WHERE shopify_product_id = $1', [shopifyProductId]);
        await logActivity('SHOPIFY_SYNC_DELETE', `Auto-deleted config for product ${shopifyProductId} via Shopify webhook`, { shopify_id: shopifyProductId });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Product sync delete failed:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/products/update', async (req, res) => {
    try {
        if (!verifyWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
        const data = JSON.parse(req.body);
        const shopifyProductId = data.id;
        const status = data.status; // 'active' or 'draft'
        const isEnabled = status === 'active';

        console.log(`Webhook received: Syncing status for product ${shopifyProductId} (Enabled: ${isEnabled}) from Shopify...`);

        // Update our database status
        await pool.query('UPDATE product_pot_config SET is_enabled = $1 WHERE shopify_product_id = $2', [isEnabled, shopifyProductId]);
        await logActivity('SHOPIFY_SYNC_UPDATE', `Synced status for product ${shopifyProductId} to ${status} via Shopify webhook`, { shopify_id: shopifyProductId, status });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Product sync update failed:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
