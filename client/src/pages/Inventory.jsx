import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem,
    TextField, Button, InlineStack, Badge, Text,
    Banner, BlockStack, Box, Divider, EmptyState,
    SkeletonBodyText
} from '@shopify/polaris';
import { Box as BoxIcon, AlertTriangle, Save, RefreshCw, Search } from 'lucide-react';

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [saving, setSaving] = useState(false);
    const [queryValue, setQueryValue] = useState('');

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            setInventory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (id, value) => {
        setEditedQuantities({ ...editedQuantities, [id]: value === '' ? '' : parseInt(value) || 0 });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(editedQuantities)
                .filter(([_, qty]) => qty !== '')
                .map(([id, quantity]) => ({ id: parseInt(id), quantity }));

            const res = await fetch('/api/inventory/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (res.ok) {
                setEditedQuantities({});
                fetchInventory();
            }
        } catch (error) {
            console.error('Failed to save inventory:', error);
        } finally {
            setSaving(false);
        }
    };

    const lowStockItems = inventory.filter(i => i.is_low_stock);
    const hasChanges = Object.keys(editedQuantities).length > 0;

    const filteredInventory = inventory.filter(item =>
        item.color_name.toLowerCase().includes(queryValue.toLowerCase()) ||
        item.size.toLowerCase().includes(queryValue.toLowerCase())
    );

    if (loading && inventory.length === 0) return (
        <Page title="Inventory Management">
            <SkeletonBodyText lines={15} />
        </Page>
    );

    return (
        <Page
            title="Pot Inventory"
            primaryAction={{
                content: 'Save Inventory',
                onAction: handleSaveAll,
                loading: saving,
                disabled: !hasChanges,
                icon: Save
            }}
            secondaryActions={[{ content: 'Refresh', onAction: fetchInventory, icon: RefreshCw }]}
        >
            <BlockStack gap="500">
                {lowStockItems.length > 0 && (
                    <Banner tone="warning" title={`${lowStockItems.length} items are low on stock`} icon={AlertTriangle}>
                        <p>Customers might see "Out of Stock" messages for these pot options soon.</p>
                    </Banner>
                )}

                <Card padding="0">
                    <Box padding="400">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <InlineStack gap="200">
                                    <BoxIcon size={20} color="#636363" />
                                    <Text variant="headingMd">Stock Levels</Text>
                                </InlineStack>
                                {hasChanges && (
                                    <Badge tone="attention">You have unsaved changes</Badge>
                                )}
                            </InlineStack>

                            <TextField
                                prefix={<Search size={18} />}
                                placeholder="Filter by color or size..."
                                value={queryValue}
                                onChange={setQueryValue}
                                autoComplete="off"
                                clearButton
                                onClearButtonClick={() => setQueryValue('')}
                            />
                        </BlockStack>
                    </Box>
                    <Divider />

                    <ResourceList
                        resourceName={{ singular: 'stock item', plural: 'stock items' }}
                        items={filteredInventory}
                        renderItem={(item) => (
                            <ResourceItem id={item.id.toString()}>
                                <InlineStack align="space-between" blockAlign="center">
                                    <InlineStack gap="400" blockAlign="center">
                                        <div style={{
                                            width: 40, height: 40,
                                            backgroundColor: item.hex_code,
                                            borderRadius: 8,
                                            border: '2px solid rgba(0,0,0,0.05)',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                        }} />
                                        <BlockStack gap="050">
                                            <Text variant="bodyMd" fontWeight="bold">{item.color_name}</Text>
                                            <Text tone="subdued" variant="bodySm">Size: {item.size}</Text>
                                        </BlockStack>
                                    </InlineStack>

                                    <InlineStack gap="400" blockAlign="center">
                                        <div style={{ width: '120px' }}>
                                            <TextField
                                                type="number"
                                                label="In Stock"
                                                labelHidden
                                                value={(editedQuantities[item.id] !== undefined ? editedQuantities[item.id] : item.quantity).toString()}
                                                onChange={(val) => handleQuantityChange(item.id, val)}
                                                autoComplete="off"
                                                suffix="Units"
                                                align="right"
                                            />
                                        </div>
                                        <div style={{ minWidth: '100px', textAlign: 'right' }}>
                                            {item.is_low_stock ? (
                                                <Badge tone="warning">Low Stock</Badge>
                                            ) : (
                                                <Badge tone="success">Healthy</Badge>
                                            )}
                                        </div>
                                    </InlineStack>
                                </InlineStack>
                            </ResourceItem>
                        )}
                        emptyState={(
                            <EmptyState
                                heading="No matching inventory"
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>Adjust your filters or add new pot colors in the Colors tab.</p>
                            </EmptyState>
                        )}
                    />
                </Card>
            </BlockStack>
        </Page>
    );
}

export default Inventory;
