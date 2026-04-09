import React, { useState, useEffect } from 'react';
import {
    Page,
    Layout,
    Card,
    Button,
    Modal,
    FormLayout,
    TextField,
    InlineStack,
    Badge,
    Text,
    Grid,
    Box,
    BlockStack,
    EmptyState
} from '@shopify/polaris';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Edit2,
    Trash2,
    Plus,
    Move
} from 'lucide-react';

function PotColors() {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [formData, setFormData] = useState({ name: '', hex_code: '#000000', display_order: 0 });

    useEffect(() => { fetchColors(); }, []);

    const fetchColors = async () => {
        try {
            const res = await fetch('/api/pots/colors');
            const data = await res.json();
            setColors(data.sort((a, b) => a.display_order - b.display_order));
        }
        catch (error) { console.error('Failed to fetch colors:', error); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            const url = editingColor ? `/api/pots/colors/${editingColor.id}` : '/api/pots/colors';
            await fetch(url, {
                method: editingColor ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            setModalOpen(false);
            setEditingColor(null);
            setFormData({ name: '', hex_code: '#000000', display_order: 0 });
            fetchColors();
        } catch (error) { console.error('Failed to save color:', error); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this color?')) return;
        try {
            await fetch(`/api/pots/colors/${id}`, { method: 'DELETE' });
            fetchColors();
        }
        catch (error) { console.error('Failed to delete color:', error); }
    };

    const openEditModal = (color) => {
        setEditingColor(color);
        setFormData({ name: color.name, hex_code: color.hex_code, display_order: color.display_order });
        setModalOpen(true);
    };

    const ColorCard = ({ color, index }) => (
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="premium-card"
                style={{ height: '100%', position: 'relative' }}
            >
                <BlockStack gap="400">
                    <div
                        style={{
                            height: '100px',
                            backgroundColor: color.hex_code,
                            borderRadius: '12px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                    />
                    <BlockStack gap="100">
                        <InlineStack align="space-between">
                            <Text variant="headingMd" as="h3">{color.name}</Text>
                            <Badge tone={color.is_active ? "success" : "subdued"}>
                                {color.is_active ? "Active" : "Hidden"}
                            </Badge>
                        </InlineStack>
                        <InlineStack gap="100" blockAlign="center">
                            <Text tone="subdued" variant="bodySm">{color.hex_code}</Text>
                            <Divider borderColor="transparent" />
                            <InlineStack gap="100">
                                <Move size={12} className="text-muted" />
                                <Text tone="subdued" variant="bodySm">Order: {color.display_order}</Text>
                            </InlineStack>
                        </InlineStack>
                    </BlockStack>

                    <InlineStack gap="200" align="end">
                        <Button
                            icon={Edit2}
                            variant="tertiary"
                            onClick={() => openEditModal(color)}
                        />
                        <Button
                            icon={Trash2}
                            variant="tertiary"
                            tone="critical"
                            onClick={() => handleDelete(color.id)}
                        />
                    </InlineStack>
                </BlockStack>
            </motion.div>
        </Grid.Cell>
    );

    return (
        <Page
            title="Pot Color Palette"
            primaryAction={{
                content: 'Add New Color',
                icon: Plus,
                onAction: () => {
                    setEditingColor(null);
                    setFormData({ name: '', hex_code: '#000000', display_order: colors.length });
                    setModalOpen(true);
                }
            }}
        >
            <Box paddingBlockEnd="600">
                <Text variant="bodyLg" tone="subdued">
                    Manage the available pot color options for your bundles.
                </Text>
            </Box>

            {loading ? (
                <Grid>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid.Cell key={i} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                            <Card padding="400">
                                <BlockStack gap="400">
                                    <div style={{ height: '100px', backgroundColor: '#f4f6f8', borderRadius: '12px' }} />
                                    <div style={{ height: '20px', backgroundColor: '#f4f6f8', width: '60%' }} />
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    ))}
                </Grid>
            ) : colors.length === 0 ? (
                <Card>
                    <EmptyState
                        heading="No colors defined"
                        action={{
                            content: 'Add your first color',
                            onAction: () => setModalOpen(true)
                        }}
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                        <p>Colors added here will be available for customers to choose when purchasing plant bundles.</p>
                    </EmptyState>
                </Card>
            ) : (
                <Grid>
                    {colors.map((color, index) => (
                        <ColorCard key={color.id} color={color} index={index} />
                    ))}
                </Grid>
            )}

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingColor ? 'Edit Pot Color' : 'Add Pot Color'}
                primaryAction={{ content: 'Save Color', onAction: handleSave }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
            >
                <Modal.Section>
                    <FormLayout>
                        <TextField
                            label="Color Name"
                            value={formData.name}
                            onChange={(value) => setFormData({ ...formData, name: value })}
                            autoComplete="off"
                            placeholder="e.g. Terracotta, Minimalist Grey"
                        />
                        <TextField
                            label="Hex Code"
                            value={formData.hex_code}
                            onChange={(value) => setFormData({ ...formData, hex_code: value })}
                            autoComplete="off"
                            prefix={<div style={{ width: 24, height: 24, backgroundColor: formData.hex_code, borderRadius: '50%', border: '1px solid #ccc' }} />}
                            placeholder="#000000"
                        />
                        <TextField
                            label="Display Order"
                            type="number"
                            value={formData.display_order.toString()}
                            onChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })}
                            autoComplete="off"
                            helpText="Determines the sequence in which colors appear to customers."
                        />
                    </FormLayout>
                </Modal.Section>
            </Modal>
        </Page>
    );
}

export default PotColors;
