const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { logActivity } = require('../services/activityService');

router.get('/product/:productConfigId', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT ci.*, pc.name as color_name, pc.hex_code
      FROM composite_images ci
      JOIN pot_colors pc ON ci.pot_color_id = pc.id
      WHERE ci.product_config_id = $1
      ORDER BY pc.display_order, ci.size
    `, [req.params.productConfigId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { product_config_id, pot_color_id, size, image_url } = req.body;
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;

    try {
        // 1. Save to local database
        const result = await pool.query(
            `INSERT INTO composite_images (product_config_id, pot_color_id, size, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *`,
            [product_config_id, pot_color_id, size, image_url]
        );

        // 2. Sync to Shopify if we have a token
        if (accessToken && shop) {
            // Find the Shopify Product ID for this config
            const configResult = await pool.query('SELECT shopify_product_id FROM product_pot_config WHERE id = $1', [product_config_id]);

            if (configResult.rows.length > 0) {
                const shopifyProductId = configResult.rows[0].shopify_product_id;
                console.log(`Syncing new image for Product ${shopifyProductId} to Shopify...`);

                await fetch(`https://${shop}/admin/api/2023-10/products/${shopifyProductId}/images.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken
                    },
                    body: JSON.stringify({
                        image: {
                            src: image_url,
                            alt: `Composite view: ${size} size`
                        }
                    })
                });
            }
        }

        await logActivity('IMAGE_UPLOADED', `Uploaded and synced composite image for product ${product_config_id}`, { product_config_id, pot_color_id, size });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Image sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM composite_images WHERE id = $1', [req.params.id]);
        await logActivity('IMAGE_DELETED', `Deleted composite image ID: ${req.params.id}`, { image_id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
