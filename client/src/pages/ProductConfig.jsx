import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, Button, Modal, FormLayout, TextField, Select, BlockStack, InlineStack } from '@shopify/polaris';

function ProductConfig() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ shopify_product_id: '', product_title: '', no_pot_discount: '10.00', size_mappings: [] });

    useEffect(() => { fetchConfigs(); }, []);

    const fetchConfigs = async () => {
        try { const res = await fetch('/api/product-config'); setConfigs(await res.json()); }
        catch (error) { console.error('Failed to fetch configs:', error); }
        finally { setLoading(false); }
    };

    const handleToggle = async (id) => { try { await fetch(`/api/product-config/${id}/toggle`, { method: 'PUT' }); fetchConfigs(); } catch (error) { console.error('Failed to toggle config:', error); } };
    const handleDelete = async (id) => { if (!confirm('Remove this product configuration?')) return; try { await fetch(`/api/product-config/${id}`, { method: 'DELETE' }); fetchConfigs(); } catch (error) { console.error('Failed to delete config:', error); } };

    const handleSave = async () => {
        try {
            await fetch('/api/product-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, shopify_product_id: parseInt(formData.shopify_product_id), no_pot_discount: parseFloat(formData.no_pot_discount) }) });
            setModalOpen(false); setFormData({ shopify_product_id: '', product_title: '', no_pot_discount: '10.00', size_mappings: [] }); fetchConfigs();
        } catch (error) { console.error('Failed to save config:', error); }
    };

    const addSizeMapping = () => { setFormData({ ...formData, size_mappings: [...formData.size_mappings, { shopify_variant_id: '', variant_title: '', pot_size: 'Medium' }] }); };
    const updateSizeMapping = (index, field, value) => { const updated = [...formData.size_mappings]; updated[index][field] = value; setFormData({ ...formData, size_mappings: updated }); };
    const removeSizeMapping = (index) => { setFormData({ ...formData, size_mappings: formData.size_mappings.filter((_, i) => i !== index) }); };

    return (
        <Page title="Product Configuration" primaryAction={{ content: 'Add Product', onAction: () => setModalOpen(true) }}>
            <Layout><Layout.Section><Card>
                <ResourceList loading={loading} items={configs} renderItem={(config) => (
                    <ResourceItem id={config.id.toString()}>
                        <InlineStack align="space-between">
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="bold">{config.product_title || `Product #${config.shopify_product_id}`}</Text>
                                <Text tone="subdued">Shopify ID: {config.shopify_product_id} | No-pot discount: ${config.no_pot_discount}</Text>
                                {config.size_mappings && <Text tone="subdued">{config.size_mappings.length} size mapping(s)</Text>}
                            </BlockStack>
                            <InlineStack gap="200">
                                <Badge tone={config.is_enabled ? 'success' : 'info'}>{config.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                <Button size="slim" onClick={() => handleToggle(config.id)}>{config.is_enabled ? 'Disable' : 'Enable'}</Button>
                                <Button size="slim" tone="critical" onClick={() => handleDelete(config.id)}>Remove</Button>
                            </InlineStack>
                        </InlineStack>
                    </ResourceItem>
                )} emptyState={<Text tone="subdued">No products configured yet.</Text>} />
            </Card></Layout.Section></Layout>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Configure Product for Pot Bundling" primaryAction={{ content: 'Save', onAction: handleSave }} secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]} large>
                <Modal.Section><FormLayout>
                    <TextField label="Shopify Product ID" value={formData.shopify_product_id} onChange={(value) => setFormData({ ...formData, shopify_product_id: value })} type="number" helpText="Find this in your Shopify admin URL" autoComplete="off" />
                    <TextField label="Product Title" value={formData.product_title} onChange={(value) => setFormData({ ...formData, product_title: value })} autoComplete="off" />
                    <TextField label="No-Pot Discount ($)" value={formData.no_pot_discount} onChange={(value) => setFormData({ ...formData, no_pot_discount: value })} type="number" autoComplete="off" />
                    <Text variant="headingMd">Size Mappings</Text>
                    {formData.size_mappings.map((mapping, index) => (
                        <InlineStack key={index} gap="200" align="center">
                            <TextField label="Variant ID" value={mapping.shopify_variant_id} onChange={(value) => updateSizeMapping(index, 'shopify_variant_id', value)} autoComplete="off" />
                            <TextField label="Variant Title" value={mapping.variant_title} onChange={(value) => updateSizeMapping(index, 'variant_title', value)} autoComplete="off" />
                            <Select label="Pot Size" options={[{ label: 'Small', value: 'Small' }, { label: 'Medium', value: 'Medium' }, { label: 'Large', value: 'Large' }, { label: 'Extra Large', value: 'Extra Large' }]} value={mapping.pot_size} onChange={(value) => updateSizeMapping(index, 'pot_size', value)} />
                            <Button tone="critical" onClick={() => removeSizeMapping(index)}>Remove</Button>
                        </InlineStack>
                    ))}
                    <Button onClick={addSizeMapping}>+ Add Size Mapping</Button>
                </FormLayout></Modal.Section>
            </Modal>
        </Page>
    );
}

export default ProductConfig;
