const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const multer = require('multer');
const { logActivity } = require('../services/activityService');

// Use memory storage for ephemeral Base64 conversion
const upload = multer({ storage: multer.memoryStorage() });

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

// POST /api/images - Handle real file upload
router.post('/', upload.single('image'), async (req, res) => {
    const { product_config_id, pot_color_id, size } = req.body;
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;

    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    try {
        let finalImageUrl = '';

        // 1. Sync to Shopify if possible
        if (accessToken && shop) {
            const configResult = await pool.query('SELECT shopify_product_id FROM product_pot_config WHERE id = $1', [product_config_id]);

            if (configResult.rows.length > 0) {
                const shopifyProductId = configResult.rows[0].shopify_product_id;
                const base64Image = req.file.buffer.toString('base64');

                console.log(`Uploading file as attachment to Shopify Product ${shopifyProductId}...`);

                const shopifyRes = await fetch(`https://${shop}/admin/api/2023-10/products/${shopifyProductId}/images.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken
                    },
                    body: JSON.stringify({
                        image: {
                            attachment: base64Image,
                            filename: req.file.originalname,
                            alt: `Composite view: ${size} size`
                        }
                    })
                });

                if (shopifyRes.ok) {
                    const shopifyData = await shopifyRes.json();
                    finalImageUrl = shopifyData.image.src;
                } else {
                    const errText = await shopifyRes.text();
                    throw new Error(`Shopify upload failed: ${errText}`);
                }
            }
        }

        // 2. Save the Shopify-hosted URL to our local database
        if (!finalImageUrl) throw new Error('Failed to get URL from Shopify after upload');

        const result = await pool.query(
            `INSERT INTO composite_images (product_config_id, pot_color_id, size, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
            [product_config_id, pot_color_id, size, finalImageUrl]
        );

        await logActivity('IMAGE_UPLOADED', `Uploaded and synced real file for product ${product_config_id}`, { product_config_id, pot_color_id });
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Image upload/sync error:', error);
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
