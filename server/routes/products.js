const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { logActivity } = require('../services/activityService');
const { shopify } = require('../index');

// POST /api/products/create - Create a new plant product in Shopify and configure it
router.post('/create', async (req, res) => {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    let accessToken = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;

    // FALLBACK: If no permanent token is in .env, try to find an active session (for local dev)
    if (!accessToken) {
        try {
            const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
            if (sessions && sessions.length > 0) {
                accessToken = sessions[0].accessToken;
                console.log("Using fallover OAuth session token for local development.");
            }
        } catch (e) {
            console.error("Session lookup failed:", e.message);
        }
    }

    if (!accessToken) {
        return res.status(500).json({ error: 'No access token found. Add SHOPIFY_ACCESS_TOKEN to .env or log in through /api/auth.' });
    }

    const { title, description, variants } = req.body;

    try {
        console.log(`Attempting to create product "${title}" on ${shop}...`);

        const shopifyRes = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({
                product: {
                    title,
                    body_html: description,
                    variants: variants.map(v => ({ option1: v.title, price: v.price })),
                },
            }),
        });

        if (!shopifyRes.ok) {
            const errText = await shopifyRes.text();
            console.error('Shopify API Error Response:', errText);
            return res.status(shopifyRes.status).json({ error: `Shopify rejected creation: ${errText}` });
        }

        const shopifyData = await shopifyRes.json();
        const shopifyProduct = shopifyData.product;
        const shopifyProductId = shopifyProduct.id;

        // Save configuration to Database
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
            console.log("Product successfully configured in Database.");
            await logActivity('PRODUCT_CREATED', `Created and configured product: ${title}`, { shopify_product_id: shopifyProductId });
        } catch (e) {
            await clientDb.query('ROLLBACK');
            console.error("Database Save Error:", e.message);
            throw e;
        } finally {
            clientDb.release();
        }

        res.json({ success: true, product: shopifyProduct });
    } catch (error) {
        console.error('SERVER FATAL ERROR:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// GET /api/products - Get all products from Shopify for configuration
router.get('/', async (req, res) => {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
        // Fallback for local dev session
        try {
            const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
            if (sessions && sessions.length > 0) {
                const session = sessions[0];
                const client = new shopify.api.clients.Rest({ session });
                const response = await client.get({ path: 'products' });
                return res.json(response.body.products);
            }
        } catch (e) {
            console.error("Local session lookup failed:", e);
        }
        return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not found for syncing.' });
    }

    try {
        const shopifyRes = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const data = await shopifyRes.json();
        res.json(data.products || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
