import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge,
    Button, Modal, FormLayout, TextField, Select, BlockStack,
    InlineStack, EmptyState, Banner, SkeletonBodyText
} from '@shopify/polaris';
import { Package, Plus, RefreshCw, AlertCircle, Search } from 'lucide-react';

function ProductConfig() {
    const [configs, setConfigs] = useState([]);
    const [shopifyProducts, setShopifyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncLoading, setSyncLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        shopify_product_id: '',
        product_title: '',
        no_pot_discount: '10.00',
        size_mappings: []
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchConfigs(), fetchShopifyProducts()]);
        } catch (error) {
            console.error('Initial fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/product-config');
            const data = await res.json();
            setConfigs(Array.isArray(data) ? data : []);
        } catch (error) { console.error('Failed to fetch configs:', error); }
    };

    const fetchShopifyProducts = async () => {
        setSyncLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setShopifyProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch Shopify products:', error);
        } finally {
            setSyncLoading(false);
        }
    };

    const handleToggle = async (id) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/product-config/${id}/toggle`, { method: 'PUT' });
            if (res.ok) fetchConfigs();
        } catch (error) { console.error('Toggle failed:', error); }
        finally { setActionLoading(null); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this configuration? This will hide the pot selector on the store front.')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/product-config/${id}`, { method: 'DELETE' });
            if (res.ok) fetchConfigs();
        } catch (error) { console.error('Delete failed:', error); }
        finally { setActionLoading(null); }
    };

    const handleConfigSelect = (product) => {
        setFormData({
            shopify_product_id: product.id.toString(),
            product_title: product.title,
            no_pot_discount: '10.00',
            size_mappings: product.variants.map(v => ({
                shopify_variant_id: v.id.toString(),
                variant_title: v.title,
                pot_size: 'Medium'
            }))
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/product-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    shopify_product_id: parseInt(formData.shopify_product_id),
                    no_pot_discount: parseFloat(formData.no_pot_discount)
                })
            });
            if (res.ok) {
                setModalOpen(false);
                setFormData({ shopify_product_id: '', product_title: '', no_pot_discount: '10.00', size_mappings: [] });
                fetchConfigs();
            }
        } catch (error) { console.error('Save failed:', error); }
    };

    const filteredShopifyProducts = shopifyProducts.filter(p => {
        const isAlreadyConfigured = configs.some(c => c.shopify_product_id.toString() === p.id.toString());
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return !isAlreadyConfigured && matchesSearch;
    });

    if (loading) return <Page title="Product Setup"><SkeletonBodyText lines={15} /></Page>;

    return (
        <Page
            title="Product Setup"
            subtitle="Connect your Shopify products to the Pot Selector app."
            primaryAction={{ content: 'Refresh Shopify List', onAction: fetchShopifyProducts, loading: syncLoading }}
        >
            <BlockStack gap="500">
                {/* Section 1: Active configurations */}
                <Card>
                    <div style={{ padding: '16px' }}>
                        <Text variant="headingMd">Currently Active Bundles</Text>
                    </div>
                    <ResourceList
                        resourceName={{ singular: 'config', plural: 'configs' }}
                        items={configs}
                        renderItem={(config) => (
                            <ResourceItem id={config.id.toString()}>
                                <InlineStack align="space-between">
                                    <BlockStack gap="100">
                                        <Text variant="bodyMd" fontWeight="bold">{config.product_title}</Text>
                                        <Text tone="subdued">ID: {config.shopify_product_id} • Discount: ${config.no_pot_discount}</Text>
                                    </BlockStack>
                                    <InlineStack gap="200">
                                        <Badge tone={config.is_enabled ? 'success' : 'info'}>{config.is_enabled ? 'Active' : 'Draft'}</Badge>
                                        <Button onClick={() => handleToggle(config.id)} loading={actionLoading === config.id}>
                                            {config.is_enabled ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button tone="critical" onClick={() => handleDelete(config.id)} loading={actionLoading === config.id}>Remove</Button>
                                    </InlineStack>
                                </InlineStack>
                            </ResourceItem>
                        )}
                        emptyState={(
                            <EmptyState
                                heading="No products configured"
                                action={{ content: 'Configure from Shopify List', onAction: () => { } }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>Select a product from the list below to enable pot bundling.</p>
                            </EmptyState>
                        )}
                    />
                </Card>

                {/* Section 2: Shopify Sync List */}
                <Card>
                    <div style={{ padding: '16px' }}>
                        <BlockStack gap="200">
                            <Text variant="headingMd">Find Unconfigured Shopify Products</Text>
                            <TextField
                                prefix={<Search size={16} />}
                                placeholder="Search Shopify store..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                autoComplete="off"
                            />
                        </BlockStack>
                    </div>
                    <ResourceList
                        items={filteredShopifyProducts}
                        loading={syncLoading}
                        renderItem={(product) => (
                            <ResourceItem id={product.id.toString()} onClick={() => handleConfigSelect(product)}>
                                <InlineStack align="space-between" blockAlign="center">
                                    <InlineStack gap="300">
                                        <div style={{ width: 40, height: 40, borderRadius: 4, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyCenter: 'center', overflow: 'hidden' }}>
                                            {product.image ? <img src={product.image.src} style={{ width: '100%' }} /> : <Package size={20} />}
                                        </div>
                                        <BlockStack>
                                            <Text variant="bodyMd" fontWeight="bold">{product.title}</Text>
                                            <Text tone="subdued">{product.variants.length} variants available</Text>
                                        </BlockStack>
                                    </InlineStack>
                                    <Button primary onClick={() => handleConfigSelect(product)}>Configure</Button>
                                </InlineStack>
                            </ResourceItem>
                        )}
                    />
                </Card>
            </BlockStack>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Configure Pot Mapping" primaryAction={{ content: 'Enable Bundle', onAction: handleSave }} secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]} large>
                <Modal.Section>
                    <FormLayout>
                        <Banner tone="info">
                            Map your Shopify variants to Pot Sizes (Small, Medium, etc) to enable inventory tracking.
                        </Banner>
                        <TextField label="Product Title" value={formData.product_title} onChange={(value) => setFormData({ ...formData, product_title: value })} autoComplete="off" />
                        <TextField label="No-Pot Discount ($)" value={formData.no_pot_discount} onChange={(value) => setFormData({ ...formData, no_pot_discount: value })} type="number" prefix="$" />

                        <Text variant="headingMd">Variant Mapping</Text>
                        {formData.size_mappings.map((mapping, index) => (
                            <Card sectioned key={index}>
                                <InlineStack gap="400" align="space-between">
                                    <BlockStack>
                                        <Text fontWeight="bold">{mapping.variant_title}</Text>
                                        <Text tone="subdued">ID: {mapping.shopify_variant_id}</Text>
                                    </BlockStack>
                                    <div style={{ minWidth: "150px" }}>
                                        <Select
                                            label="Maps to Pot Size:"
                                            options={[
                                                { label: 'Small', value: 'Small' },
                                                { label: 'Medium', value: 'Medium' },
                                                { label: 'Large', value: 'Large' },
                                                { label: 'Extra Large', value: 'Extra Large' }
                                            ]}
                                            value={mapping.pot_size}
                                            onChange={(v) => {
                                                const updated = [...formData.size_mappings];
                                                updated[index].pot_size = v;
                                                setFormData({ ...formData, size_mappings: updated });
                                            }}
                                        />
                                    </div>
                                </InlineStack>
                            </Card>
                        ))}
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>
    );
}

export default ProductConfig;
