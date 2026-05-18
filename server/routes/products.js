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

        // NEW: Add to Collection
        const collectionId = process.env.SHOPIFY_COLLECTION_ID || 320337641590;
        try {
            await fetch(`https://${shop}/admin/api/2023-10/collects.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({
                    collect: {
                        collection_id: collectionId,
                        product_id: shopifyProductId
                    }
                })
            });
            console.log(`Product ${shopifyProductId} added to collection ${collectionId}.`);
        } catch (err) {
            console.error('Failed to add to collection:', err.message);
            // Non-fatal error for the product creation itself
        }

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
        const collectionId = process.env.SHOPIFY_COLLECTION_ID;
        let url = `https://${shop}/admin/api/2023-10/products.json`;

        // If collection ID is provided, fetch products from that specific collection
        if (collectionId) {
            console.log(`Fetching products specifically from collection: ${collectionId}`);
            url = `https://${shop}/admin/api/2023-10/collections/${collectionId}/products.json`;
        }

        const shopifyRes = await fetch(url, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });

        if (!shopifyRes.ok) {
            const errText = await shopifyRes.text();
            console.error(`Shopify API Error (${shopifyRes.status}):`, errText);
            return res.status(shopifyRes.status).json({ error: `Shopify Error: ${errText}` });
        }

        const data = await shopifyRes.json();
        console.log(`Successfully fetched ${data.products?.length || 0} products from collection ${collectionId}`);
        res.json(data.products || []);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/products/:id/generate-variants
router.post('/:id/generate-variants', async (req, res) => {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    let accessToken = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;
    const { id } = req.params;
    const { sizesConfig, colors } = req.body;

    if (!accessToken) return res.status(500).json({ error: 'No access token found' });

    try {
        const variants = [];
        sizesConfig.forEach(sizeObj => {
            colors.forEach(color => {
                variants.push({
                    option1: sizeObj.name,
                    option2: color.name, // e.g. "White"
                    price: sizeObj.price,
                    inventory_management: 'shopify',
                    inventory_quantity: parseInt(sizeObj.inventory) || 0
                });
            });
        });

        // 1. Update the product to have the right options
        const shopifyResOptions = await fetch(`https://${shop}/admin/api/2023-10/products/${id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
            body: JSON.stringify({
                product: {
                    id: id,
                    options: [
                        { name: "Size", values: sizesConfig.map(s => s.name) },
                        { name: "Color", values: colors.map(c => c.name) }
                    ],
                    variants: variants
                }
            })
        });

        if (!shopifyResOptions.ok) {
            const err = await shopifyResOptions.text();
            throw new Error(err);
        }

        const data = await shopifyResOptions.json();
        const shopifyProduct = data.product;

        // Auto-configure the product in our DB so it moves to "Configured Products"
        const clientDb = await pool.connect();
        try {
            await clientDb.query('BEGIN');
            const configResult = await clientDb.query(
                `INSERT INTO product_pot_config (shopify_product_id, product_title, no_pot_discount) VALUES ($1, $2, 10.00) ON CONFLICT (shopify_product_id) DO UPDATE SET product_title = EXCLUDED.product_title, updated_at = CURRENT_TIMESTAMP RETURNING *`,
                [shopifyProduct.id, shopifyProduct.title]
            );
            const configId = configResult.rows[0].id;

            // Clear old mappings just in case
            await clientDb.query('DELETE FROM size_mappings WHERE product_config_id = $1', [configId]);

            // Add new mappings safely
            if (shopifyProduct.variants && shopifyProduct.variants.length > 0) {
                for (const v of shopifyProduct.variants) {
                    await clientDb.query(
                        `INSERT INTO size_mappings (product_config_id, shopify_variant_id, variant_title, pot_size) VALUES ($1, $2, $3, $4)`,
                        [configId, v.id, v.title, v.option1]
                    );
                }
            }
            await clientDb.query('COMMIT');
            await logActivity('PRODUCT_CONFIGURED', `Insta-built and configured product: ${shopifyProduct.title}`, { shopify_product_id: shopifyProduct.id });
        } catch (e) {
            await clientDb.query('ROLLBACK');
            console.error("Database Save Error:", e.message);
        } finally {
            clientDb.release();
        }

        res.json({ success: true, product: shopifyProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
