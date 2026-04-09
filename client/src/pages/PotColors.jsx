import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Button, Modal, FormLayout, TextField, InlineStack, Badge, Text } from '@shopify/polaris';

function PotColors() {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [formData, setFormData] = useState({ name: '', hex_code: '#000000', display_order: 0 });

    useEffect(() => { fetchColors(); }, []);

    const fetchColors = async () => {
        try { const res = await fetch('/api/pots/colors'); setColors(await res.json()); }
        catch (error) { console.error('Failed to fetch colors:', error); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            const url = editingColor ? `/api/pots/colors/${editingColor.id}` : '/api/pots/colors';
            await fetch(url, { method: editingColor ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            setModalOpen(false); setEditingColor(null); setFormData({ name: '', hex_code: '#000000', display_order: 0 }); fetchColors();
        } catch (error) { console.error('Failed to save color:', error); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this color?')) return;
        try { await fetch(`/api/pots/colors/${id}`, { method: 'DELETE' }); fetchColors(); }
        catch (error) { console.error('Failed to delete color:', error); }
    };

    const openEditModal = (color) => { setEditingColor(color); setFormData({ name: color.name, hex_code: color.hex_code, display_order: color.display_order }); setModalOpen(true); };

    const rows = colors.map(color => [
        <InlineStack gap="200" align="center"><div style={{ width: 24, height: 24, backgroundColor: color.hex_code, borderRadius: 4, border: '1px solid #ccc' }} /><Text>{color.name}</Text></InlineStack>,
        color.hex_code, color.display_order,
        color.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>,
        <InlineStack gap="200"><Button size="slim" onClick={() => openEditModal(color)}>Edit</Button><Button size="slim" tone="critical" onClick={() => handleDelete(color.id)}>Delete</Button></InlineStack>
    ]);

    return (
        <Page title="Pot Colors" primaryAction={{ content: 'Add Color', onAction: () => { setEditingColor(null); setFormData({ name: '', hex_code: '#000000', display_order: 0 }); setModalOpen(true); } }}>
            <Layout><Layout.Section><Card><DataTable columnContentTypes={['text', 'text', 'numeric', 'text', 'text']} headings={['Color', 'Hex Code', 'Order', 'Status', 'Actions']} rows={rows} loading={loading} /></Card></Layout.Section></Layout>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingColor ? 'Edit Pot Color' : 'Add Pot Color'} primaryAction={{ content: 'Save', onAction: handleSave }} secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}>
                <Modal.Section><FormLayout>
                    <TextField label="Color Name" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} autoComplete="off" />
                    <TextField label="Hex Code" value={formData.hex_code} onChange={(value) => setFormData({ ...formData, hex_code: value })} autoComplete="off" prefix={<div style={{ width: 20, height: 20, backgroundColor: formData.hex_code, borderRadius: 4 }} />} />
                    <TextField label="Display Order" type="number" value={formData.display_order.toString()} onChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })} autoComplete="off" />
                </FormLayout></Modal.Section>
            </Modal>
        </Page>
    );
}

export default PotColors;
