import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, TextField, Button, InlineStack, Badge, Text, Banner } from '@shopify/polaris';

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        try { const res = await fetch('/api/inventory'); setInventory(await res.json()); }
        catch (error) { console.error('Failed to fetch inventory:', error); }
        finally { setLoading(false); }
    };

    const handleQuantityChange = (id, value) => { setEditedQuantities({ ...editedQuantities, [id]: parseInt(value) || 0 }); };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(editedQuantities).map(([id, quantity]) => ({ id: parseInt(id), quantity }));
            await fetch('/api/inventory/bulk-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
            setEditedQuantities({}); fetchInventory();
        } catch (error) { console.error('Failed to save inventory:', error); }
        finally { setSaving(false); }
    };

    const lowStockCount = inventory.filter(i => i.is_low_stock).length;

    const rows = inventory.map(item => [
        <InlineStack gap="200" align="center"><div style={{ width: 20, height: 20, backgroundColor: item.hex_code, borderRadius: 4, border: '1px solid #ccc' }} /><Text>{item.color_name}</Text></InlineStack>,
        item.size,
        <TextField type="number" value={(editedQuantities[item.id] ?? item.quantity).toString()} onChange={(value) => handleQuantityChange(item.id, value)} autoComplete="off" min={0} />,
        item.low_stock_threshold,
        item.is_low_stock ? <Badge tone="warning">Low Stock</Badge> : <Badge tone="success">In Stock</Badge>
    ]);

    return (
        <Page title="Pot Inventory" primaryAction={{ content: 'Save Changes', onAction: handleSaveAll, loading: saving, disabled: Object.keys(editedQuantities).length === 0 }}>
            <Layout>
                {lowStockCount > 0 && <Layout.Section><Banner tone="warning">{lowStockCount} item(s) are running low on stock.</Banner></Layout.Section>}
                <Layout.Section><Card><DataTable columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text']} headings={['Color', 'Size', 'Quantity', 'Low Stock Threshold', 'Status']} rows={rows} loading={loading} /></Card></Layout.Section>
            </Layout>
        </Page>
    );
}

export default Inventory;
