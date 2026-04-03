import React, { useState } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Button, InlineStack, Select } from '@shopify/polaris';

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
            variants: [...formData.variants, { title: '', price: '', pot_size: 'Medium' }],
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
        setSaving(true);
        try {
            const res = await fetch('/api/products/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert('Product created and configured successfully!');
                // Redirect or reset form
                setFormData({
                    title: '',
                    description: '',
                    variants: [{ title: 'Small', price: '50.00', pot_size: 'Small' }],
                });
            } else {
                throw new Error('Failed to create product');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating product');
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
        <Page title="Add New Plant Product" primaryAction={{ content: 'Create Product', onAction: handleSubmit, loading: saving }}>
            <Layout>
                <Layout.Section>
                    <Card>
                        <FormLayout>
                            <TextField label="Product Title" value={formData.title} onChange={(value) => handleChange('title', value)} autoComplete="off" />
                            <TextField label="Description" value={formData.description} onChange={(value) => handleChange('description', value)} multiline={4} autoComplete="off" />
                            <h2>Variants (Sizes)</h2>
                            {formData.variants.map((variant, index) => (
                                <InlineStack key={index} gap="200">
                                    <TextField label="Variant Title (e.g., Small)" value={variant.title} onChange={(value) => updateVariant(index, 'title', value)} />
                                    <TextField label="Price" value={variant.price} onChange={(value) => updateVariant(index, 'price', value)} type="number" />
                                    <Select label="Pot Size Mapping" options={potSizeOptions} value={variant.pot_size} onChange={(value) => updateVariant(index, 'pot_size', value)} />
                                    <Button tone="critical" onClick={() => removeVariant(index)}>Remove</Button>
                                </InlineStack>
                            ))}
                            <Button onClick={addVariant}>+ Add Variant</Button>
                        </FormLayout>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default AddPlantProduct;
