import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem,
    TextField, Button, InlineStack, Badge, Text,
    Banner, BlockStack, Box, Divider, EmptyState,
    SkeletonBodyText, Tabs, Thumbnail, Spinner,
    Toast, Frame
} from '@shopify/polaris';
import { SaveIcon, RefreshIcon, SearchIcon, PlusIcon, ProductIcon } from '@shopify/polaris-icons';
import { Box as BoxIcon, AlertTriangle, Package } from 'lucide-react';

// ─── POT INVENTORY TAB ────────────────────────────────────────────────────────
function PotInventoryTab() {
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

    const lowStockItems = Array.isArray(inventory) ? inventory.filter(i => i.is_low_stock) : [];
    const hasChanges = Object.keys(editedQuantities).length > 0;

    const filteredInventory = Array.isArray(inventory) ? inventory.filter(item =>
        item.color_name.toLowerCase().includes(queryValue.toLowerCase()) ||
        item.size.toLowerCase().includes(queryValue.toLowerCase())
    ) : [];

    if (loading && inventory.length === 0) return <SkeletonBodyText lines={15} />;

    return (
        <BlockStack gap="500">
            <InlineStack align="end" gap="200">
                <Button onClick={fetchInventory} icon={RefreshIcon} variant="tertiary">Refresh</Button>
                <Button
                    onClick={handleSaveAll}
                    loading={saving}
                    disabled={!hasChanges}
                    icon={SaveIcon}
                    variant="primary"
                >
                    Save Inventory
                </Button>
            </InlineStack>

            {lowStockItems.length > 0 && (
                <Banner tone="warning" title={`${lowStockItems.length} items are low on stock`}>
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
                            prefix={<SearchIcon style={{ width: 18 }} />}
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
    );
}

// ─── SHOPIFY PRODUCTS TAB ─────────────────────────────────────────────────────
function ShopifyProductsTab() {
    const [products, setProducts] = useState([]);
    const [configuredIds, setConfiguredIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [addingId, setAddingId] = useState(null);
    const [queryValue, setQueryValue] = useState('');
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [prodRes, configRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/product-config')
            ]);
            const prodData = await prodRes.json();
            const configData = await configRes.json();

            setProducts(Array.isArray(prodData) ? prodData : []);
            const ids = new Set(
                Array.isArray(configData)
                    ? configData.map(c => String(c.shopify_product_id))
                    : []
            );
            setConfiguredIds(ids);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToBundle = async (product) => {
        setAddingId(product.id);
        try {
            // Build size_mappings from variants
            const size_mappings = (product.variants || []).map(v => ({
                shopify_variant_id: v.id,
                variant_title: v.title,
                pot_size: v.title === 'Default Title' ? 'Medium' : v.title
            }));

            const res = await fetch('/api/product-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopify_product_id: product.id,
                    product_title: product.title,
                    no_pot_discount: 10.00,
                    size_mappings
                })
            });

            if (res.ok) {
                setConfiguredIds(prev => new Set([...prev, String(product.id)]));
                setToastMessage(`"${product.title}" added to bundle config!`);
                setToastError(false);
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add product');
            }
        } catch (error) {
            setToastMessage(`Error: ${error.message}`);
            setToastError(true);
        } finally {
            setAddingId(null);
            setToastActive(true);
        }
    };

    const filteredProducts = products.filter(p =>
        p.title?.toLowerCase().includes(queryValue.toLowerCase()) ||
        p.product_type?.toLowerCase().includes(queryValue.toLowerCase())
    );

    const toastMarkup = toastActive ? (
        <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
            error={toastError}
            duration={3000}
        />
    ) : null;

    if (loading) {
        return (
            <Box padding="800">
                <InlineStack align="center">
                    <BlockStack gap="400" align="center">
                        <Spinner size="large" />
                        <Text tone="subdued">Loading Shopify products…</Text>
                    </BlockStack>
                </InlineStack>
            </Box>
        );
    }

    return (
        <>
            {toastMarkup}
            <BlockStack gap="500">
                <InlineStack align="end" gap="200">
                    <Button onClick={fetchAll} icon={RefreshIcon} variant="tertiary">Refresh</Button>
                </InlineStack>

                <Banner tone="info">
                    <p>
                        Browse all products from your Shopify store. Click <strong>Add to Bundle</strong> on any product to make it available for pot bundling in the Product Config tab.
                    </p>
                </Banner>

                <Card padding="0">
                    <Box padding="400">
                        <BlockStack gap="300">
                            <InlineStack gap="200" blockAlign="center">
                                <Package size={20} color="#636363" />
                                <Text variant="headingMd">All Shopify Products</Text>
                                <Badge tone="info">{products.length} total</Badge>
                            </InlineStack>
                            <TextField
                                prefix={<SearchIcon style={{ width: 18 }} />}
                                placeholder="Search by product name or type..."
                                value={queryValue}
                                onChange={setQueryValue}
                                autoComplete="off"
                                clearButton
                                onClearButtonClick={() => setQueryValue('')}
                            />
                        </BlockStack>
                    </Box>
                    <Divider />

                    {filteredProducts.length === 0 ? (
                        <EmptyState
                            heading="No products found"
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>No Shopify products match your search, or your store has no products yet.</p>
                        </EmptyState>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: '#e1e3e5' }}>
                            {filteredProducts.map(product => {
                                const isConfigured = configuredIds.has(String(product.id));
                                const isAdding = addingId === product.id;
                                const imageUrl = product.image?.src || product.images?.[0]?.src;
                                const variants = product.variants || [];
                                const priceRange = variants.length > 0
                                    ? variants.length === 1
                                        ? `$${parseFloat(variants[0].price).toFixed(2)}`
                                        : `$${parseFloat(Math.min(...variants.map(v => parseFloat(v.price)))).toFixed(2)} – $${parseFloat(Math.max(...variants.map(v => parseFloat(v.price)))).toFixed(2)}`
                                    : 'No price';

                                return (
                                    <div
                                        key={product.id}
                                        style={{ background: '#fff', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                                    >
                                        {/* Product Header */}
                                        <InlineStack gap="300" blockAlign="start">
                                            <div style={{ flexShrink: 0 }}>
                                                {imageUrl ? (
                                                    <Thumbnail
                                                        source={imageUrl}
                                                        alt={product.title}
                                                        size="medium"
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: 60, height: 60,
                                                        background: '#f6f6f7',
                                                        borderRadius: 8,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#8c9196'
                                                    }}>
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <BlockStack gap="100" align="start">
                                                <Text variant="bodyMd" fontWeight="semibold">{product.title}</Text>
                                                <Text variant="bodySm" tone="subdued">{priceRange}</Text>
                                                {product.product_type && (
                                                    <Badge>{product.product_type}</Badge>
                                                )}
                                            </BlockStack>
                                        </InlineStack>

                                        {/* Variants Summary */}
                                        {variants.length > 0 && (
                                            <div style={{ background: '#f6f6f7', borderRadius: 8, padding: '8px 12px' }}>
                                                <Text variant="bodySm" tone="subdued" fontWeight="medium">
                                                    {variants.length} variant{variants.length > 1 ? 's' : ''}: {' '}
                                                    {variants.slice(0, 4).map(v => v.title).join(', ')}
                                                    {variants.length > 4 ? ` +${variants.length - 4} more` : ''}
                                                </Text>
                                            </div>
                                        )}

                                        {/* Status & Action */}
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Badge tone={product.status === 'active' ? 'success' : 'attention'}>
                                                {product.status === 'active' ? 'Active' : product.status || 'Unknown'}
                                            </Badge>

                                            {isConfigured ? (
                                                <Badge tone="success" icon={PlusIcon}>
                                                    In Bundle Config
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="slim"
                                                    icon={PlusIcon}
                                                    loading={isAdding}
                                                    onClick={() => handleAddToBundle(product)}
                                                    variant="primary"
                                                >
                                                    Add to Bundle
                                                </Button>
                                            )}
                                        </InlineStack>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </BlockStack>
        </>
    );
}

// ─── MAIN INVENTORY PAGE ──────────────────────────────────────────────────────
function Inventory() {
    const [selectedTab, setSelectedTab] = useState(0);

    const tabs = [
        { id: 'pot-stock', content: 'Pot Stock', panelID: 'pot-stock-panel' },
        { id: 'shopify-products', content: 'Shopify Products', panelID: 'shopify-products-panel' },
    ];

    return (
        <Page title="Inventory">
            <Card padding="0">
                <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
            </Card>

            <div style={{ marginTop: '16px' }}>
                {selectedTab === 0 ? <PotInventoryTab /> : <ShopifyProductsTab />}
            </div>
        </Page>
    );
}

export default Inventory;
