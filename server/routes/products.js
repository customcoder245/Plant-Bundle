const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { logActivity } = require('../services/activityService');
const { shopify } = require('../index'); // Import shopify object from index.js

// POST /api/products/create - Create a new plant product in Shopify and configure it
router.post('/create', async (req, res) => {
    // Pull the real Access Token for your store from the active database
    const shop = 'democms2.myshopify.com';
    let session = undefined;

    try {
        const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
        if (sessions && sessions.length > 0) {
            session = sessions[0]; // grab the most recently authenticated session
        }
    } catch (e) {
        console.error("Error finding session:", e);
    }

    if (!session) {
        return res.status(401).json({ error: 'Shopify Session not found. Please open the App entirely once.' });
    }

    const { title, description, variants } = req.body;

    try {
        const client = new shopify.api.clients.Rest({ session });

        const productData = {
            product: {
                title,
                body_html: description,
                variants: variants.map(v => ({ option1: v.title, price: v.price })),
            },
        };

        // Make the REST request to Shopify
        const response = await client.post({ path: 'products', data: productData, type: 'application/json' });

        const shopifyProduct = response.body.product;
        const shopifyProductId = shopifyProduct.id;

        // Save to your DB
        const clientDb = await pool.connect();
        try {
            await clientDb.query('BEGIN');
            const configResult = await clientDb.query(
                `INSERT INTO product_pot_config (shopify_product_id, product_title, no_pot_discount) VALUES ($1, $2, 10.00) RETURNING *`,
                [shopifyProductId, title]
            );
            const configId = configResult.rows[0].id;

            for (let i = 0; i < variants.length; i++) {
                await clientDb.query(
                    `INSERT INTO size_mappings (product_config_id, shopify_variant_id, variant_title, pot_size) VALUES ($1, $2, $3, $4)`,
                    [configId, shopifyProduct.variants[i].id, variants[i].title, variants[i].pot_size]
                );
            }
            await clientDb.query('COMMIT');
            await logActivity('PRODUCT_CREATED', `Created and configured product: ${title}`, { shopify_product_id: shopifyProductId });
        } catch (e) {
            await clientDb.query('ROLLBACK');
            throw e;
        } finally {
            clientDb.release();
        }

        res.json({ success: true, product: shopifyProduct });
    } catch (error) {
        console.error('Product creation failed:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

module.exports = router;
