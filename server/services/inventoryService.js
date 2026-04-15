const pool = require('../db/pool');
const { logActivity } = require('./activityService');

/**
 * processOrder - Handles inventory deduction/restoration based on Shopify order webhooks
 * @param {Object} order - The Shopify order object
 * @param {String} action - 'deduct' or 'restore'
 */
async function processOrder(order, action = 'deduct') {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log(`Processing Order ${order.name} (${order.id}) - Action: ${action}`);

        for (const lineItem of order.line_items) {
            // 1. Check if this product is managed as a bundle in our app
            const configResult = await client.query(
                'SELECT * FROM product_pot_config WHERE shopify_product_id = $1 AND is_enabled = true',
                [lineItem.product_id]
            );

            if (configResult.rows.length === 0) {
                console.log(`Skipping non-bundle product: ${lineItem.title}`);
                continue;
            }

            // 2. Extract the Pot selection
            // A. Check Line Item Properties (Bundle Builder logic)
            let potValue = '';
            const potColorProperty = lineItem.properties?.find(p => {
                const name = p.name.toLowerCase();
                return name.includes('pot') || name.includes('color');
            });

            if (potColorProperty) {
                potValue = potColorProperty.value;
            } else {
                // B. Fallback: Check Variant Title (Insta-Build variants structure: "Size / Color")
                // Parsing "4\" Pot / White" -> "White"
                const variantTitle = lineItem.variant_title || '';
                if (variantTitle.includes(' / ')) {
                    const parts = variantTitle.split(' / ');
                    potValue = parts[parts.length - 1].trim(); // Take the last part (Color)
                    console.log(`Extracted color "${potValue}" from variant title: ${variantTitle}`);
                }
            }

            if (!potValue) {
                console.log(`No pot selection detected for ${lineItem.title} (ID: ${lineItem.variant_id}). Skipping.`);
                continue;
            }

            // 3. Handle "NO POT" or "Bare Root"
            if (['NO POT', 'BARE ROOT', 'NONE'].includes(potValue.toUpperCase())) {
                console.log(`User selected "${potValue}" for ${lineItem.title}. No inventory deduction needed.`);
                continue;
            }

            // 4. Resolve Pot Color ID from Name
            let colorResult = await client.query(
                'SELECT id FROM pot_colors WHERE LOWER(name) = LOWER($1)',
                [potValue]
            );

            // Special case: sometimes name vs type mismatch. Check type too.
            if (colorResult.rows.length === 0) {
                colorResult = await client.query(
                    'SELECT id FROM pot_colors WHERE LOWER(type) = LOWER($1)',
                    [potValue]
                );
            }

            if (colorResult.rows.length === 0) {
                console.warn(`Could not find color in DB matching: "${potValue}"`);
                continue;
            }

            const potColorId = colorResult.rows[0].id;

            // 5. Resolve Pot Size from Variant Mapping
            const sizeResult = await client.query(
                'SELECT pot_size FROM size_mappings WHERE shopify_variant_id = $1',
                [lineItem.variant_id]
            );

            const potSize = sizeResult.rows[0]?.pot_size || 'Medium'; // Default to medium if unknown
            const quantity = lineItem.quantity;

            // 6. Update Port Inventory
            if (action === 'deduct') {
                console.log(`Deducting ${quantity} x ${potValue} (${potSize}) for order ${order.name}...`);
                await client.query(
                    `UPDATE pot_inventory SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE pot_color_id = $2 AND size = $3`,
                    [quantity, potColorId, potSize]
                );
            } else {
                console.log(`Restoring ${quantity} x ${potValue} (${potSize}) for order ${order.name}...`);
                await client.query(
                    `UPDATE pot_inventory SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE pot_color_id = $2 AND size = $3`,
                    [quantity, potColorId, potSize]
                );
            }

            // 7. Log Activity
            await logActivity(
                action === 'deduct' ? 'INVENTORY_DEDUCTED' : 'INVENTORY_RESTORED',
                `${action === 'deduct' ? 'Deducted' : 'Restored'} ${quantity} unit(s) of "${potValue}" (${potSize}) for order ${order.name}`,
                {
                    order_id: order.id,
                    order_number: order.order_number,
                    item: lineItem.title,
                    color: potValue,
                    size: potSize,
                    quantity
                }
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Inventory processing failed for order ${order.id}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { processOrder };
