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
    try {
        const result = await pool.query(
            `INSERT INTO composite_images (product_config_id, pot_color_id, size, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *`,
            [product_config_id, pot_color_id, size, image_url]
        );
        await logActivity('IMAGE_UPLOADED', `Uploaded composite image for product ${product_config_id}`, { product_config_id, pot_color_id, size });
        res.json(result.rows[0]);
    } catch (error) {
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
