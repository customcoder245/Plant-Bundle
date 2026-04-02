const pool = require('../db/pool');
const { logActivity } = require('./activityService');

async function processOrder(order, action = 'deduct') {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const lineItem of order.line_items) {
            const configResult = await client.query(
                'SELECT * FROM product_pot_config WHERE shopify_product_id = $1 AND is_enabled = true',
                [lineItem.product_id]
            );

            if (configResult.rows.length === 0) continue;

            const potColorProperty = lineItem.properties?.find(p =>
                p.name.toLowerCase().includes('pot') || p.name.toLowerCase().includes('color')
            );

            if (potColorProperty?.value?.toUpperCase() === 'NO POT') continue;
            if (!potColorProperty) continue;

            const colorResult = await client.query(
                'SELECT id FROM pot_colors WHERE LOWER(name) = LOWER($1)',
                [potColorProperty.value]
            );

            if (colorResult.rows.length === 0) continue;

            const potColorId = colorResult.rows[0].id;

            const sizeResult = await client.query(
                'SELECT pot_size FROM size_mappings WHERE shopify_variant_id = $1',
                [lineItem.variant_id]
            );

            const potSize = sizeResult.rows[0]?.pot_size || 'Medium';
            const quantity = lineItem.quantity;

            if (action === 'deduct') {
                await client.query(
                    `UPDATE pot_inventory SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE pot_color_id = $2 AND size = $3`,
                    [quantity, potColorId, potSize]
                );
            } else {
                await client.query(
                    `UPDATE pot_inventory SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE pot_color_id = $2 AND size = $3`,
                    [quantity, potColorId, potSize]
                );
            }

            await logActivity(
                action === 'deduct' ? 'INVENTORY_DEDUCTED' : 'INVENTORY_RESTORED',
                `${action === 'deduct' ? 'Deducted' : 'Restored'} ${quantity} ${potColorProperty.value} ${potSize} pot(s) for order ${order.order_number}`,
                { order_id: order.id, pot_color_id: potColorId, size: potSize, quantity }
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { processOrder };
