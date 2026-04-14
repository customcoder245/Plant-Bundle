import React, { useState } from 'react';
import {
    Page, Layout, Card, FormLayout, TextField, Button,
    InlineStack, Select, BlockStack, Text, Box,
    Divider, Banner, Badge, Icon
} from '@shopify/polaris';
import { PlusCircle, Trash2, Info, ChevronRight, PackagePlus } from 'lucide-react';

function AddPlantProduct() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        variants: [{ title: 'Small', price: '50.00', pot_size: 'Small' }],
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { title: '', price: '10.00', pot_size: 'Medium' }],
        });
    };

    const updateVariant = (index, field, value) => {
        const updated = [...formData.variants];
        updated[index][field] = value;
        setFormData({ ...formData, variants: updated });
    };

    const removeVariant = (index) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            alert('Please enter a product title');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/products/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                alert('Success: Product created in Shopify and configured locally.');
                setFormData({
                    title: '',
                    description: '',
                    variants: [{ title: 'Small', price: '50.00', pot_size: 'Small' }],
                });
            } else {
                throw new Error(data.error || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const potSizeOptions = [
        { label: 'Small', value: 'Small' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Large', value: 'Large' },
        { label: 'Extra Large', value: 'Extra Large' },
    ];

    return (
        <Page
            title="Create New Plant Bundle"
            backAction={{ content: 'Dashboard', url: '/' }}
            primaryAction={{
                content: 'Create & Sync to Shopify',
                onAction: handleSubmit,
                loading: saving,
                icon: PackagePlus
            }}
        >
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        <Banner tone="info" icon={Info}>
                            This tool creates a new product in your Shopify Admin and automatically configures it for pot bundling in this app.
                        </Banner>

                        <Card>
                            <Box padding="500">
                                <FormLayout>
                                    <BlockStack gap="400">
                                        <Text variant="headingMd">Basic Information</Text>
                                        <TextField
                                            label="Product Title"
                                            value={formData.title}
                                            onChange={(value) => handleChange('title', value)}
                                            autoComplete="off"
                                            placeholder="e.g. Madagascar Palm Plant"
                                        />
                                        <TextField
                                            label="Public Description"
                                            value={formData.description}
                                            onChange={(value) => handleChange('description', value)}
                                            multiline={4}
                                            autoComplete="off"
                                        />
                                    </BlockStack>
                                </FormLayout>
                            </Box>
                        </Card>

                        <Card padding="0">
                            <Box padding="500">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <Text variant="headingMd">Price Variants (Sizes)</Text>
                                        <Badge tone="info">{formData.variants.length} Variants</Badge>
                                    </InlineStack>
                                    <Text tone="subdued">Define different plant sizes and map them to pot categories.</Text>
                                </BlockStack>
                            </Box>
                            <Divider />

                            {formData.variants.map((variant, index) => (
                                <Box key={index} padding="500" background={index % 2 === 1 ? 'bg-surface-secondary' : 'bg-surface'}>
                                    <FormLayout>
                                        <InlineStack gap="400" align="space-between" blockAlign="end">
                                            <div style={{ flex: 2 }}>
                                                <TextField
                                                    label="Variant Name"
                                                    value={variant.title}
                                                    onChange={(value) => updateVariant(index, 'title', value)}
                                                    placeholder="e.g. 4-inch Pot"
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <TextField
                                                    label="Base Price"
                                                    value={variant.price}
                                                    onChange={(value) => updateVariant(index, 'price', value)}
                                                    type="number"
                                                    prefix="$"
                                                />
                                            </div>
                                            <div style={{ flex: 1.5 }}>
                                                <Select
                                                    label="Pot size mapping"
                                                    options={potSizeOptions}
                                                    value={variant.pot_size}
                                                    onChange={(value) => updateVariant(index, 'pot_size', value)}
                                                />
                                            </div>
                                            <Button
                                                tone="critical"
                                                icon={Trash2}
                                                onClick={() => removeVariant(index)}
                                                disabled={formData.variants.length === 1}
                                            >
                                                Remove
                                            </Button>
                                        </InlineStack>
                                    </FormLayout>
                                </Box>
                            ))}

                            <Box padding="500">
                                <Button onClick={addVariant} icon={PlusCircle}>Add Another Size Variant</Button>
                            </Box>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <BlockStack gap="400">
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="300">
                                    <Text variant="headingSm">Quick Tip</Text>
                                    <Text variant="bodySm" tone="subdued">
                                        The <strong>Pot Size Mapping</strong> tells the system which inventory to deduct when this specific size is purchased.
                                    </Text>
                                    <Divider />
                                    <Text variant="bodySm" tone="subdued">
                                        After creating, you will be able to upload custom composite images in the <strong>Images</strong> tab.
                                    </Text>
                                </BlockStack>
                            </Box>
                        </Card>

                        <Banner tone="success" title="Ready to Launch?">
                            <p>Clicking "Create & Sync" will make this product live on your store immediately.</p>
                        </Banner>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default AddPlantProduct;
