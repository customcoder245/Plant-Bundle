import React, { useState, useEffect } from 'react';
import {
    Page,
    Layout,
    Card,
    ResourceList,
    ResourceItem,
    Text,
    Badge,
    Button,
    Modal,
    FormLayout,
    TextField,
    Select,
    BlockStack,
    InlineStack,
    EmptyState,
    Box,
    Divider,
    Icon
} from '@shopify/polaris';
import { motion } from 'framer-motion';
import {
    Package,
    ExternalLink,
    Settings2,
    Trash2,
    Power,
    PlusCircle,
    Hash,
    DollarSign
} from 'lucide-react';

function ProductConfig() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ shopify_product_id: '', product_title: '', no_pot_discount: '10.00', size_mappings: [] });

    useEffect(() => { fetchConfigs(); }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/product-config');
            const data = await res.json();
            setConfigs(Array.isArray(data) ? data : []);
        }
        catch (error) { console.error('Failed to fetch configs:', error); }
        finally { setLoading(false); }
    };

    const handleToggle = async (id) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/product-config/${id}/toggle`, { method: 'PUT' });
            if (res.ok) {
                fetchConfigs();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to toggle status'}`);
            }
        } catch (error) {
            console.error('Failed to toggle config:', error);
            alert('Server error while toggling status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this product configuration and deep-delete from Shopify?')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/product-config/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchConfigs();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to delete product'}`);
            }
        } catch (error) {
            console.error('Failed to delete config:', error);
            alert('Server error while deleting product');
        } finally {
            setActionLoading(null);
        }
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
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to save config'}`);
            }
        } catch (error) { console.error('Failed to save config:', error); }
    };

    const addSizeMapping = () => {
        setFormData({
            ...formData,
            size_mappings: [...formData.size_mappings, { shopify_variant_id: '', variant_title: '', pot_size: 'Medium' }]
        });
    };

    const updateSizeMapping = (index, field, value) => {
        const updated = [...formData.size_mappings];
        updated[index][field] = value;
        setFormData({ ...formData, size_mappings: updated });
    };

    const removeSizeMapping = (index) => {
        setFormData({ ...formData, size_mappings: formData.size_mappings.filter((_, i) => i !== index) });
    };

    const resourceName = {
        singular: 'bundle configuration',
        plural: 'bundle configurations',
    };

    return (
        <Page
            title="Product Bundles"
            primaryAction={{
                content: 'Register New Product',
                icon: PlusCircle,
                onAction: () => setModalOpen(true)
            }}
        >
            <Box paddingBlockEnd="600">
                <Text variant="bodyLg" tone="subdued">
                    Configure which Shopify products are offered with pot customization.
                </Text>
            </Box>

            <Layout>
                <Layout.Section>
                    <Card padding="0">
                        <ResourceList
                            resourceName={resourceName}
                            items={configs}
                            loading={loading}
                            emptyState={
                                <EmptyState
                                    heading="No product bundles yet"
                                    action={{ content: 'Configure first product', onAction: () => setModalOpen(true) }}
                                    image="https://cdn.shopify.com/s/files/1/2376/6963/t/1/assets/empty-state-cart.svg"
                                >
                                    <p>Launch your bundling strategy by adding products that should feature pot selection.</p>
                                </EmptyState>
                            }
                            renderItem={(config) => {
                                const { id, product_title, shopify_product_id, no_pot_discount, is_enabled, size_mappings } = config;

                                return (
                                    <ResourceItem
                                        id={id.toString()}
                                        media={
                                            <div className="stat-icon-wrapper" style={{ background: 'var(--accent)', color: 'var(--primary)' }}>
                                                <Package size={20} />
                                            </div>
                                        }
                                        accessibilityLabel={`View details for ${product_title}`}
                                    >
                                        <InlineStack align="space-between" blockAlign="center">
                                            <BlockStack gap="100">
                                                <Text variant="bodyMd" fontWeight="bold">
                                                    {product_title || `Untitiled Product`}
                                                </Text>
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Badge tone="info">PID: {shopify_product_id}</Badge>
                                                    <Badge tone="attention">-{no_pot_discount}% Discount</Badge>
                                                    {size_mappings && (
                                                        <Text tone="subdued" variant="bodySm">
                                                            {size_mappings.length} size variations
                                                        </Text>
                                                    )}
                                                </InlineStack>
                                            </BlockStack>

                                            <InlineStack gap="200">
                                                <Badge tone={is_enabled ? 'success' : 'subdued'}>
                                                    {is_enabled ? 'Active' : 'Paused'}
                                                </Badge>
                                                <Button
                                                    icon={is_enabled ? Power : Power}
                                                    variant="tertiary"
                                                    onClick={() => handleToggle(id)}
                                                    loading={actionLoading === id}
                                                    tone={is_enabled ? 'critical' : 'success'}
                                                >
                                                    {is_enabled ? 'Deactivate' : 'Activate'}
                                                </Button>
                                                <Button
                                                    icon={Trash2}
                                                    variant="tertiary"
                                                    tone="critical"
                                                    onClick={() => handleDelete(id)}
                                                    loading={actionLoading === id}
                                                />
                                            </InlineStack>
                                        </InlineStack>
                                    </ResourceItem>
                                );
                            }}
                        />
                    </Card>
                </Layout.Section>
            </Layout>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Configure Dynamic Bundle"
                primaryAction={{ content: 'Create Configuration', onAction: handleSave }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
                large
            >
                <Modal.Section>
                    <FormLayout>
                        <BlockStack gap="400">
                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                    <TextField
                                        label="Shopify Product ID"
                                        value={formData.shopify_product_id}
                                        onChange={(value) => setFormData({ ...formData, shopify_product_id: value })}
                                        type="number"
                                        prefix={<Hash size={16} />}
                                        helpText="The unique ID from your Shopify Admin URL"
                                        autoComplete="off"
                                    />
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                    <TextField
                                        label="No-Pot Discount"
                                        value={formData.no_pot_discount}
                                        onChange={(value) => setFormData({ ...formData, no_pot_discount: value })}
                                        type="number"
                                        prefix={<DollarSign size={16} />}
                                        helpText="Percentage discount if customer opts out of a pot"
                                        autoComplete="off"
                                    />
                                </Grid.Cell>
                            </Grid>

                            <TextField
                                label="Admin Reference Title"
                                value={formData.product_title}
                                onChange={(value) => setFormData({ ...formData, product_title: value })}
                                autoComplete="off"
                                placeholder="Green Fern Bundle 2024"
                            />

                            <Divider />

                            <InlineStack align="space-between">
                                <Text variant="headingMd">Size Mappings</Text>
                                <Button
                                    icon={PlusCircle}
                                    onClick={addSizeMapping}
                                    variant="plain"
                                >
                                    Add Variation
                                </Button>
                            </InlineStack>

                            <BlockStack gap="200">
                                {formData.size_mappings.length === 0 && (
                                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                        <Text tone="subdued" alignment="center">No size mappings added. Add variations to link Shopify variants to pot sizes.</Text>
                                    </Box>
                                )}
                                {formData.size_mappings.map((mapping, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <Card padding="300">
                                            <InlineStack gap="300" blockAlign="center">
                                                <Box flex="1">
                                                    <TextField
                                                        label="Variant ID"
                                                        value={mapping.shopify_variant_id}
                                                        onChange={(value) => updateSizeMapping(index, 'shopify_variant_id', value)}
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                                <Box flex="1">
                                                    <TextField
                                                        label="Variant Name"
                                                        value={mapping.variant_title}
                                                        onChange={(value) => updateSizeMapping(index, 'variant_title', value)}
                                                        autoComplete="off"
                                                    />
                                                </Box>
                                                <Box flex="1">
                                                    <Select
                                                        label="Target Pot Size"
                                                        options={[
                                                            { label: 'Small', value: 'Small' },
                                                            { label: 'Medium', value: 'Medium' },
                                                            { label: 'Large', value: 'Large' },
                                                            { label: 'XL', value: 'Extra Large' }
                                                        ]}
                                                        value={mapping.pot_size}
                                                        onChange={(value) => updateSizeMapping(index, 'pot_size', value)}
                                                    />
                                                </Box>
                                                <Button
                                                    icon={Trash2}
                                                    tone="critical"
                                                    variant="tertiary"
                                                    onClick={() => removeSizeMapping(index)}
                                                />
                                            </InlineStack>
                                        </Card>
                                    </motion.div>
                                ))}
                            </BlockStack>
                        </BlockStack>
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>
    );
}

export default ProductConfig;
