require('dotenv').config();
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect().then(() => client.query('SELECT shop, "accessToken" FROM shopify_sessions LIMIT 1'))
    .then(res => { console.log(res.rows[0]); client.end(); })
    .catch(console.error);
