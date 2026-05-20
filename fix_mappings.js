require('dotenv').config();
const { Client } = require('pg');

async function fixMappings() {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.ADMIN_API || process.env.SHOPIFY_ACCESS_TOKEN;
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();

        // Get all products in our config
        const configsRes = await client.query('SELECT * FROM product_pot_config');
        const configs = configsRes.rows;

        if (configs.length === 0) return;
        
        const ids = configs.map(c => c.shopify_product_id);
        const prodRes = await fetch(`https://${shop}/admin/api/2023-10/products.json?ids=${ids.join(',')}&limit=250`, {
            headers: { 'X-Shopify-Access-Token': token }
        });
        
        const data = await prodRes.json();
        const products = data.products || [];

        for (const p of products) {
            const config = configs.find(c => c.shopify_product_id.toString() === p.id.toString());
            if (!config) continue;

            console.log(`Fixing mappings for: ${p.title}`);
            await client.query('DELETE FROM size_mappings WHERE product_config_id = $1', [config.id]);

            for (const v of p.variants) {
                // IMPORTANT: use option1 exactly as it comes from Shopify to group perfectly
                const sizeName = v.option1 || 'Unmapped';
                await client.query(
                    `INSERT INTO size_mappings (product_config_id, shopify_variant_id, variant_title, pot_size) 
                     VALUES ($1, $2, $3, $4)`,
                    [config.id, v.id, v.title, sizeName]
                );
            }
        }
        
        console.log('Successfully fixed size_mappings!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

fixMappings();
