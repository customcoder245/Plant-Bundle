const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { logActivity } = require('../services/activityService');

// POST /api/products/create - Create a new plant product in Shopify and configure it
router.post('/create', async (req, res) => {
    const shop = process.env.SHOPIFY_STORE_DOMAIN || 'democms2.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
        return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured in environment variables.' });
    }

    const { title, description, variants } = req.body;

    try {
        // Use direct fetch to Shopify REST API - more reliable than SDK session objects
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
            console.error('Shopify API error:', errText);
            return res.status(shopifyRes.status).json({ error: `Shopify API error: ${errText}` });
        }

        const shopifyData = await shopifyRes.json();
        const shopifyProduct = shopifyData.product;
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
