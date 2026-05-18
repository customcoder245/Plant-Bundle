require('dotenv').config();
const { Client } = require('pg');

async function syncInventory() {
    const shop = 'planet-desert.myshopify.com';
    const token = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        
        await client.connect();

        // Fetch products from Shopify
        const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=250`, {
            headers: { 'X-Shopify-Access-Token': token }
        });
        const data = await response.json();
        const products = data.products || [];

        // Map colors to their relevant 'Pot' products for stock tracking
        // (Just an example mapping based on the found products)
        const mappings = [
            { color: 'White', search: 'White Houseplant Pot' },
            { color: 'Black', search: 'Black Houseplant pot' },
            { color: 'Self Watering', search: 'Self Watering Pot' }
        ];

        for (const m of mappings) {
            const product = products.find(p => p.title.includes(m.search));
            if (product) {
                const totalStock = product.variants.reduce((acc, v) => acc + (v.inventory_quantity || 0), 0);

                // Get the pot_color_id
                const res = await client.query('SELECT id FROM pot_colors WHERE name = $1', [m.color]);
                if (res.rows.length > 0) {
                    const colorId = res.rows[0].id;
                    // Update all sizes for this color with this stock (or distribute it)
                    await client.query(
                        'UPDATE pot_inventory SET quantity = $1 WHERE pot_color_id = $2',
                        [totalStock, colorId]
                    );
                    console.log(`Synced inventory for ${m.color}: ${totalStock}`);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

syncInventory();
