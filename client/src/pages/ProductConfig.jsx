import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem, Text, Badge,
    Button, Modal, FormLayout, TextField, Select, BlockStack,
    InlineStack, EmptyState, Banner, SkeletonBodyText, Thumbnail,
    Box, Divider
} from '@shopify/polaris';
import { RefreshIcon, SearchIcon, SettingsIcon } from '@shopify/polaris-icons';
import { Leaf } from 'lucide-react';

function ProductConfig() {
    const [configs, setConfigs] = useState([]);
    const [shopifyProducts, setShopifyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncLoading, setSyncLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generateData, setGenerateData] = useState({ shopify_product_id: '', product_title: '', sizes: [], colors: [] });
    const [availableColors, setAvailableColors] = useState([]);
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
            const [configsRes, colorsRes] = await Promise.all([fetch('/api/product-config'), fetch('/api/pots/colors')]);
            const configsData = await configsRes.json();
            const colorsData = await colorsRes.json();
            setConfigs(Array.isArray(configsData) ? configsData : []);
            setAvailableColors(Array.isArray(colorsData) ? colorsData : []);
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
            setShopifyProducts([]);
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
        if (!confirm('This will disable the pot selector for customers. Continue?')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/product-config/${id}`, { method: 'DELETE' });
            if (res.ok) fetchConfigs();
        } catch (error) { console.error('Delete failed:', error); }
        finally { setActionLoading(null); }
    };

    const handleConfigSelect = (product) => {
        // Smart mapping prediction
        const initialMappings = (product.variants || []).map(v => {
            const title = (v.title || '').toLowerCase();
            let predictedSize = 'Medium';
            if (title.includes('2') || title.includes('small') || title.includes('4')) predictedSize = 'Small';
            if (title.includes('6') || title.includes('8') || title.includes('standard')) predictedSize = 'Medium';
            if (title.includes('10') || title.includes('large') || title.includes('gal')) predictedSize = 'Large';

            return {
                shopify_variant_id: v.id?.toString() || '',
                variant_title: v.title || 'Unknown',
                pot_size: predictedSize
            };
        });

        setFormData({
            shopify_product_id: product.id.toString(),
            product_title: product.title,
            no_pot_discount: '10.00',
            size_mappings: initialMappings
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
                fetchAllData(); // Refresh everything
            }
        } catch (error) { console.error('Save failed:', error); }
    };

    const handleGenerateOpen = (product) => {
        if (!product) return;
        setGenerateData({
            shopify_product_id: product.id?.toString() || '',
            product_title: product.title || 'Unknown Product',
            sizes: [{ name: '4" Pot', price: product.variants?.[0]?.price || '29.99', inventory: '100' }],
            colors: (Array.isArray(availableColors) ? availableColors : []).filter(c => c.is_active).map(c => c.name)
        });
        setGenerateModalOpen(true);
    };



    const handleGenerateSubmit = async () => {
        setActionLoading('generating');
        try {
            const sizesArr = generateData.sizes.filter(s => s.name.trim() !== '');
            const colorsArr = availableColors.filter(c => generateData.colors.includes(c.name));

            const res = await fetch(`/api/products/${generateData.shopify_product_id}/generate-variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sizesConfig: sizesArr,
                    colors: colorsArr
                })
            });

            if (res.ok) {
                setGenerateModalOpen(false);
                fetchAllData(); // Refresh everything from Shopify to see new variants
            } else {
                alert('Failed to generate variants');
            }
        } catch (e) {
            console.error('Generation err:', e);
        } finally {
            setActionLoading(null);
        }
    };


    const configuredIds = (Array.isArray(configs) ? configs : []).map(c => c.shopify_product_id.toString());
    const unconfiguredProducts = (Array.isArray(shopifyProducts) ? shopifyProducts : []).filter(p =>
        !configuredIds.includes(p.id?.toString()) &&
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );


    if (loading) return <Page title="Manage Bundles"><SkeletonBodyText lines={20} /></Page>;

    return (
        <Page
            title="Manage Bundles"
            primaryAction={{ content: 'Sync Shopify Products', onAction: fetchShopifyProducts, loading: syncLoading, icon: RefreshIcon }}
        >
            <BlockStack gap="600">
                <Card>
                    <Box padding="400">
                        <InlineStack gap="200" align="start" blockAlign="center">
                            <div style={{ padding: 6, background: '#f5f7f5', borderRadius: 8 }}>
                                <Leaf size={20} color="#1a4d2e" />
                            </div>
                            <Text variant="headingMd">Configured Products</Text>
                        </InlineStack>
                    </Box>
                    <Divider />
                    <ResourceList
                        resourceName={{ singular: 'bundle', plural: 'bundles' }}
                        items={configs}
                        renderItem={(config) => {
                            const shopifyProduct = shopifyProducts.find(p => p.id.toString() === config.shopify_product_id.toString());
                            const imageUrl = shopifyProduct?.image?.src || "";

                            return (
                                <ResourceItem id={config.id.toString()} verticalAlignment="center">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="400" blockAlign="center">
                                            <Thumbnail source={imageUrl || 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'} alt={config.product_title} size="medium" />
                                            <BlockStack gap="050">
                                                <Text variant="bodyMd" fontWeight="semibold">{config.product_title}</Text>
                                                <InlineStack gap="200">
                                                    <Badge tone={config.is_enabled ? 'success' : 'attention'}>
                                                        {config.is_enabled ? 'Active' : 'Disabled'}
                                                    </Badge>
                                                    <Text tone="subdued" variant="bodySm">{(config.size_mappings || []).length} Sizes mapped</Text>
                                                    <Text tone="subdued" variant="bodySm">{(shopifyProduct?.variants || []).length} Shopify Variants</Text>
                                                </InlineStack>
                                            </BlockStack>
                                        </InlineStack>

                                        <InlineStack gap="200">
                                            {shopifyProduct && (
                                                <Button size="slim" onClick={() => handleGenerateOpen(shopifyProduct)}>Insta-Build Variants</Button>
                                            )}

                                            <Badge tone={config.is_enabled ? 'success' : 'attention'}>
                                                {config.is_enabled ? 'Live' : 'Hidden'}
                                            </Badge>
                                            <Button variant="secondary" onClick={() => handleToggle(config.id)} loading={actionLoading === config.id}>
                                                {config.is_enabled ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button variant="tertiary" tone="critical" onClick={() => handleDelete(config.id)} loading={actionLoading === config.id}>Remove</Button>
                                        </InlineStack>
                                    </InlineStack>
                                </ResourceItem>
                            );
                        }}
                        emptyState={(
                            <EmptyState
                                heading="No Bundles Configured"
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>Pick a product from the Shopify list below to get started.</p>
                            </EmptyState>
                        )}
                    />
                </Card>

                <Card padding="0">
                    <Box padding="400">
                        <BlockStack gap="400">
                            <InlineStack gap="200" align="start" blockAlign="center">
                                <SettingsIcon style={{ width: 20 }} />
                                <Text variant="headingMd">Available from Shopify</Text>
                            </InlineStack>
                            <TextField
                                prefix={<SearchIcon style={{ width: 18 }} />}
                                placeholder="Find products to connect..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                autoComplete="off"
                                clearButton
                                onClearButtonClick={() => setSearchQuery('')}
                            />
                        </BlockStack>
                    </Box>
                    <Divider />
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <ResourceList
                            items={unconfiguredProducts}
                            loading={syncLoading}
                            renderItem={(product) => (
                                <ResourceItem
                                    id={product.id.toString()}
                                    onClick={() => handleConfigSelect(product)}
                                    verticalAlignment="center"
                                >
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="400" blockAlign="center">
                                            <Thumbnail source={product.image?.src || 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'} alt={product.title} size="medium" />
                                            <BlockStack>
                                                <Text variant="bodyMd" fontWeight="bold">{product.title}</Text>
                                                <Text tone="subdued" variant="bodySm">{(product.variants || []).length} variants available</Text>
                                            </BlockStack>
                                        </InlineStack>
                                        <InlineStack gap="200">
                                            <Button onClick={() => handleGenerateOpen(product)}>Insta-Build Variants</Button>
                                            <Button variant="primary" onClick={() => handleConfigSelect(product)}>Configure</Button>
                                        </InlineStack>
                                    </InlineStack>

                                </ResourceItem>
                            )}
                        />
                    </div>
                </Card>
            </BlockStack>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Pot Mapping Setup"
                primaryAction={{ content: 'Finish Setup', onAction: handleSave }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
                large
            >
                <Modal.Section>
                    <FormLayout>
                        <Banner tone="info">
                            Assign each Shopify variant to a Pot Size (Small, Medium, etc) to ensure inventory tracking works correctly.
                        </Banner>

                        <InlineStack gap="400">
                            <div style={{ flex: 2 }}>
                                <TextField label="Product Display Title" value={formData.product_title} onChange={(value) => setFormData({ ...formData, product_title: value })} autoComplete="off" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <TextField label="Bare-Root Discount" value={formData.no_pot_discount} onChange={(value) => setFormData({ ...formData, no_pot_discount: value })} type="number" prefix="$" />
                            </div>
                        </InlineStack>

                        <Divider />
                        <Text variant="headingMd">Variant-to-Pot Mapping</Text>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {(formData.size_mappings || []).map((mapping, index) => (

                                <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200" borderStyle="solid" borderWidth="025" borderColor="border-subdued">
                                    <BlockStack gap="300">
                                        <BlockStack gap="050">
                                            <Text fontWeight="bold" variant="bodySm">{mapping.variant_title}</Text>
                                            <Text tone="subdued" variant="bodyXs">SKU: {mapping.shopify_variant_id}</Text>
                                        </BlockStack>
                                        <Select
                                            label="Maps to size:"
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
                                    </BlockStack>
                                </Box>
                            ))}
                        </div>
                    </FormLayout>
                </Modal.Section>
            </Modal>

            <Modal
                open={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                title={`Generate Bundle Variants for ${generateData.product_title}`}
                primaryAction={{ content: 'Generate & Push to Shopify', onAction: handleGenerateSubmit, loading: actionLoading === 'generating' }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setGenerateModalOpen(false) }]}
            >
                <Modal.Section>
                    <FormLayout>
                        <Banner tone="info">
                            This will create a Size and Color grid directly in Shopify, replacing any existing variants. Perfect for fresh setups.
                        </Banner>
                        <Text variant="headingSm">Sizes, Prices & Inventory</Text>
                        <BlockStack gap="300">
                            {Array.isArray(generateData.sizes) && generateData.sizes.map((size, idx) => (
                                <InlineStack key={idx} gap="300" blockAlign="center">
                                    <div style={{ flex: 2 }}>
                                        <TextField
                                            label="Size Name" labelHidden
                                            placeholder='e.g. 4" Pot'
                                            value={size.name}
                                            onChange={v => {
                                                const s = [...generateData.sizes];
                                                s[idx].name = v;
                                                setGenerateData({ ...generateData, sizes: s });
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Price" labelHidden
                                            prefix="$"
                                            value={size.price}
                                            onChange={v => {
                                                const s = [...generateData.sizes];
                                                s[idx].price = v;
                                                setGenerateData({ ...generateData, sizes: s });
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextField
                                            label="Initial Inventory" labelHidden
                                            type="number"
                                            value={size.inventory}
                                            onChange={v => {
                                                const s = [...generateData.sizes];
                                                s[idx].inventory = v;
                                                setGenerateData({ ...generateData, sizes: s });
                                            }}
                                        />
                                    </div>
                                    <Button tone="critical" onClick={() => {
                                        const s = generateData.sizes.filter((_, i) => i !== idx);
                                        setGenerateData({ ...generateData, sizes: s });
                                    }}>Remove</Button>
                                </InlineStack>
                            ))}
                            <Button onClick={() => {
                                setGenerateData({ ...generateData, sizes: [...generateData.sizes, { name: '', price: '29.99', inventory: '100' }] });
                            }}>+ Add Another Size</Button>
                        </BlockStack>

                        <Divider />

                        <Text variant="headingSm">Include Colors:</Text>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {availableColors.map(c => (
                                <Badge
                                    key={c.id}
                                    tone={generateData.colors.includes(c.name) ? "success" : "new"}
                                    progress={generateData.colors.includes(c.name) ? "complete" : "incomplete"}
                                    onClick={() => {
                                        const prev = generateData.colors;
                                        const upd = prev.includes(c.name) ? prev.filter(x => x !== c.name) : [...prev, c.name];
                                        setGenerateData({ ...generateData, colors: upd });
                                    }}
                                >
                                    <span style={{ cursor: 'pointer' }}>{c.name} {generateData.colors.includes(c.name) && "✓"}</span>
                                </Badge>
                            ))}
                        </div>
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>

    );
}

export default ProductConfig;
