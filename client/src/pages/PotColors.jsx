import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem,
    Button, Modal, FormLayout, TextField, InlineStack,
    Badge, Text, BlockStack, Box, Divider, EmptyState,
    Thumbnail, Banner
} from '@shopify/polaris';
import { Palette, Plus, Edit3, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

function PotColors() {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [formData, setFormData] = useState({ name: '', hex_code: '#000000', display_order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchColors(); }, []);

    const fetchColors = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pots/colors');
            const data = await res.json();
            setColors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch colors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editingColor ? `/api/pots/colors/${editingColor.id}` : '/api/pots/colors';
            const method = editingColor ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setModalOpen(false);
                setEditingColor(null);
                setFormData({ name: '', hex_code: '#000000', display_order: 0 });
                fetchColors();
            }
        } catch (error) {
            console.error('Failed to save color:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Warning: Deleting this color will also remove its inventory and bundle images. Continue?')) return;
        try {
            const res = await fetch(`/api/pots/colors/${id}`, { method: 'DELETE' });
            if (res.ok) fetchColors();
        } catch (error) { console.error('Failed to delete color:', error); }
    };

    const openEditModal = (color) => {
        setEditingColor(color);
        setFormData({ name: color.name, hex_code: color.hex_code, display_order: color.display_order });
        setModalOpen(true);
    };

    return (
        <Page
            title="Pot Colors"
            primaryAction={{
                content: 'Add Brand Color',
                icon: Plus,
                onAction: () => {
                    setEditingColor(null);
                    setFormData({ name: '', hex_code: '#8fb149', display_order: colors.length });
                    setModalOpen(true);
                }
            }}
        >
            <BlockStack gap="500">
                <Banner tone="info">
                    These colors will appear as swatches on your product pages. Order them to control how they appear to customers.
                </Banner>

                <Card padding="0">
                    <Box padding="400">
                        <InlineStack gap="200" align="start" blockAlign="center">
                            <Palette size={20} color="#636363" />
                            <Text variant="headingMd">Available Swatches</Text>
                        </InlineStack>
                    </Box>
                    <Divider />

                    <ResourceList
                        resourceName={{ singular: 'color', plural: 'colors' }}
                        items={colors}
                        loading={loading}
                        renderItem={(color) => (
                            <ResourceItem id={color.id.toString()} verticalAlignment="center">
                                <InlineStack align="space-between" blockAlign="center">
                                    <InlineStack gap="400" blockAlign="center">
                                        <div style={{ padding: '0 8px', color: '#ccc' }}>
                                            <GripVertical size={20} />
                                        </div>
                                        <div style={{
                                            width: 44, height: 44,
                                            backgroundColor: color.hex_code,
                                            borderRadius: '50%',
                                            border: '3px solid #fff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }} />
                                        <BlockStack gap="050">
                                            <Text variant="bodyMd" fontWeight="bold">{color.name}</Text>
                                            <Text tone="subdued" variant="bodySm">{color.hex_code.toUpperCase()}</Text>
                                        </BlockStack>
                                    </InlineStack>

                                    <InlineStack gap="200">
                                        <Badge tone={color.is_active ? 'success' : 'info'}>
                                            {color.is_active ? 'Visible' : 'Hidden'}
                                        </Badge>
                                        <Button icon={Edit3} onClick={() => openEditModal(color)}>Edit</Button>
                                        <Button icon={Trash2} tone="critical" onClick={() => handleDelete(color.id)}>Delete</Button>
                                    </InlineStack>
                                </InlineStack>
                            </ResourceItem>
                        )}
                        emptyState={(
                            <EmptyState
                                heading="No colors created"
                                action={{ content: 'Create First Color', onAction: () => setModalOpen(true) }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>Add your pot colors here to start configuring bundles.</p>
                            </EmptyState>
                        )}
                    />
                </Card>
            </BlockStack>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingColor ? 'Edit Swatch' : 'Create New Swatch'}
                primaryAction={{ content: 'Save Color', onAction: handleSave, loading: saving }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
            >
                <Modal.Section>
                    <FormLayout>
                        <TextField
                            label="Friendly Name"
                            value={formData.name}
                            onChange={(value) => setFormData({ ...formData, name: value })}
                            autoComplete="off"
                            placeholder="e.g. Sage Green"
                        />
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <TextField
                                    label="Hex Color Code"
                                    value={formData.hex_code}
                                    onChange={(value) => setFormData({ ...formData, hex_code: value })}
                                    autoComplete="off"
                                    placeholder="#000000"
                                />
                            </div>
                            <div style={{
                                width: '100px', height: '36px',
                                backgroundColor: formData.hex_code,
                                borderRadius: '8px', border: '1px solid #ccc',
                                marginBottom: '2px'
                            }} />
                        </div>
                        <TextField
                            label="Sort Priority"
                            type="number"
                            value={formData.display_order.toString()}
                            onChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })}
                            autoComplete="off"
                            helpText="Lower numbers appear first in the customer swatch list."
                        />
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>
    );
}

export default PotColors;
