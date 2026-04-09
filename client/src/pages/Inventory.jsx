import React, { useState, useEffect } from 'react';
import {
    Page,
    Layout,
    Card,
    IndexTable,
    TextField,
    Button,
    InlineStack,
    Badge,
    Text,
    Banner,
    Box,
    BlockStack,
    useIndexResourceState,
    Divider
} from '@shopify/polaris';
import { motion } from 'framer-motion';
import { Box as BoxIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            setInventory(data);
        }
        catch (error) { console.error('Failed to fetch inventory:', error); }
        finally { setLoading(false); }
    };

    const handleQuantityChange = (id, value) => {
        setEditedQuantities({ ...editedQuantities, [id]: parseInt(value) || 0 });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(editedQuantities).map(([id, quantity]) => ({ id: parseInt(id), quantity }));
            await fetch('/api/inventory/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            setEditedQuantities({});
            fetchInventory();
        } catch (error) { console.error('Failed to save inventory:', error); }
        finally { setSaving(false); }
    };

    const lowStockCount = inventory.filter(i => i.is_low_stock).length;
    const totalPots = inventory.reduce((sum, item) => sum + item.quantity, 0);

    const resourceName = {
        singular: 'inventory item',
        plural: 'inventory items',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(inventory);

    const rowMarkup = inventory.map(
        ({ id, color_name, hex_code, size, quantity, low_stock_threshold, is_low_stock }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <InlineStack gap="300" blockAlign="center">
                        <div style={{ width: 24, height: 24, backgroundColor: hex_code, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' }} />
                        <Text variant="bodyMd" fontWeight="bold">
                            {color_name}
                        </Text>
                    </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>{size}</IndexTable.Cell>
                <IndexTable.Cell>
                    <div style={{ width: '100px' }}>
                        <TextField
                            type="number"
                            value={(editedQuantities[id] ?? quantity).toString()}
                            onChange={(value) => handleQuantityChange(id, value)}
                            autoComplete="off"
                            min={0}
                            suffix={editedQuantities[id] !== undefined ? <Text tone="success" variant="bodyXs">Edited</Text> : null}
                        />
                    </div>
                </IndexTable.Cell>
                <IndexTable.Cell>{low_stock_threshold}</IndexTable.Cell>
                <IndexTable.Cell>
                    {is_low_stock ? (
                        <Badge tone="warning">Low Stock</Badge>
                    ) : (
                        <Badge tone="success">Healthy</Badge>
                    )}
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page
            title="Pot Stock Management"
            primaryAction={{
                content: 'Sync with Shopify',
                onAction: () => { },
                variant: 'primary',
                disabled: true // Just a placeholder for now
            }}
            secondaryActions={[
                {
                    content: 'Save Quantities',
                    onAction: handleSaveAll,
                    loading: saving,
                    disabled: Object.keys(editedQuantities).length === 0
                }
            ]}
        >
            <BlockStack gap="600">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                            <Card padding="400">
                                <InlineStack gap="400" blockAlign="center">
                                    <div className="stat-icon-wrapper" style={{ background: 'rgba(26, 77, 46, 0.1)', color: 'var(--primary)' }}>
                                        <BoxIcon size={20} />
                                    </div>
                                    <BlockStack>
                                        <Text variant="headingSm" tone="subdued">Total Stock</Text>
                                        <Text variant="headingXl">{totalPots}</Text>
                                    </BlockStack>
                                </InlineStack>
                            </Card>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                            <Card padding="400">
                                <InlineStack gap="400" blockAlign="center">
                                    <div className="stat-icon-wrapper" style={{ background: lowStockCount > 0 ? 'rgba(192, 86, 33, 0.1)' : 'rgba(47, 133, 90, 0.1)', color: lowStockCount > 0 ? '#c05621' : '#2f855a' }}>
                                        {lowStockCount > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                                    </div>
                                    <BlockStack>
                                        <Text variant="headingSm" tone="subdued">Low Stock Items</Text>
                                        <Text variant="headingXl">{lowStockCount}</Text>
                                    </BlockStack>
                                </InlineStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </motion.div>

                {lowStockCount > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Banner tone="warning" title="Stock Replenishment Required">
                            <p>{lowStockCount} pot variations have fallen below their minimum threshold. Consider updating quantities soon.</p>
                        </Banner>
                    </motion.div>
                )}

                <Card padding="0">
                    <IndexTable
                        resourceName={resourceName}
                        itemCount={inventory.length}
                        selectedItemsCount={
                            allResourcesSelected ? 'All' : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        loading={loading}
                        headings={[
                            { title: 'Color' },
                            { title: 'Size' },
                            { title: 'Quantity' },
                            { title: 'Threshold' },
                            { title: 'Status' },
                        ]}
                    >
                        {rowMarkup}
                    </IndexTable>
                </Card>
            </BlockStack>
        </Page>
    );
}

export default Inventory;
