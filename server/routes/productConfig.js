const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { logActivity } = require('../services/activityService');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT ppc.*,
        json_agg(json_build_object('id', sm.id, 'shopify_variant_id', sm.shopify_variant_id, 'variant_title', sm.variant_title, 'pot_size', sm.pot_size)) FILTER (WHERE sm.id IS NOT NULL) as size_mappings
      FROM product_pot_config ppc
      LEFT JOIN size_mappings sm ON ppc.id = sm.product_config_id
      GROUP BY ppc.id
      ORDER BY ppc.created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:shopifyProductId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product_pot_config WHERE shopify_product_id = $1', [req.params.shopifyProductId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product config not found' });
        const mappings = await pool.query('SELECT * FROM size_mappings WHERE product_config_id = $1', [result.rows[0].id]);
        res.json({ ...result.rows[0], size_mappings: mappings.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { shopify_product_id, product_title, no_pot_discount, size_mappings } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const configResult = await client.query(
            `INSERT INTO product_pot_config (shopify_product_id, product_title, no_pot_discount) VALUES ($1, $2, $3) ON CONFLICT (shopify_product_id) DO UPDATE SET product_title = $2, no_pot_discount = $3, updated_at = CURRENT_TIMESTAMP RETURNING *`,
            [shopify_product_id, product_title, no_pot_discount || 10.00]
        );
        const configId = configResult.rows[0].id;
        await client.query('DELETE FROM size_mappings WHERE product_config_id = $1', [configId]);
        if (size_mappings && size_mappings.length > 0) {
            for (const mapping of size_mappings) {
                await client.query(
                    `INSERT INTO size_mappings (product_config_id, shopify_variant_id, variant_title, pot_size) VALUES ($1, $2, $3, $4)`,
                    [configId, mapping.shopify_variant_id, mapping.variant_title, mapping.pot_size]
                );
            }
        }
        await client.query('COMMIT');
        await logActivity('PRODUCT_CONFIGURED', `Configured product: ${product_title}`, { shopify_product_id });
        res.json(configResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.put('/:id/toggle', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE product_pot_config SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        await logActivity('PRODUCT_TOGGLED', `Toggled product ID ${req.params.id}`, { config_id: req.params.id, is_enabled: result.rows[0].is_enabled });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM product_pot_config WHERE id = $1', [req.params.id]);
        await logActivity('PRODUCT_CONFIG_DELETED', `Deleted product config ID: ${req.params.id}`, { config_id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
