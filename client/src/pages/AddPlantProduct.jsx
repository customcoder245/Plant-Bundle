import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, FormLayout, TextField, Button,
    InlineStack, Select, BlockStack, Text, Box,
    Divider, Banner, Badge, Tabs, Thumbnail, Spinner
} from '@shopify/polaris';
import { PlusIcon, DeleteIcon, SearchIcon, RefreshIcon } from '@shopify/polaris-icons';

/* ─────────────────────────────────────────────────────────────
   TAB 1: Pick from existing Shopify products
   ───────────────────────────────────────────────────────────── */
function PickFromShopify({ onAdded }) {
    const [products, setProducts] = useState([]);
    const [configuredIds, setConfiguredIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [addingId, setAddingId] = useState(null);
    const [query, setQuery] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/product-config')
            ]);
            const pData = await pRes.json();
            const cData = await cRes.json();
            setProducts(Array.isArray(pData) ? pData : []);
            setConfiguredIds(new Set(Array.isArray(cData) ? cData.map(c => String(c.shopify_product_id)) : []));
        } catch (e) {
            setMsg({ text: 'Could not load products. Make sure the server is running.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const addToBundle = async (product) => {
        setAddingId(product.id);
        try {
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
                setMsg({ text: `✅ "${product.title}" is ready for pot bundling!`, type: 'success' });
                if (onAdded) onAdded(product.title);
            } else {
                const err = await res.json();
                throw new Error(err.error);
            }
        } catch (e) {
            setMsg({ text: `❌ ${e.message}`, type: 'error' });
        } finally {
            setAddingId(null);
            setTimeout(() => setMsg({ text: '', type: '' }), 5000);
        }
    };

    const filtered = products.filter(p =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.product_type?.toLowerCase().includes(query.toLowerCase())
    );

    if (loading) return (
        <Box padding="800">
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40, height: 40, border: '4px solid #e4e5e7',
                    borderTop: '4px solid #008060', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
                }} />
                <Text tone="subdued">Loading plants from Shopify…</Text>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </Box>
    );

    return (
        <BlockStack gap="400">
            {msg.text && (
                <Banner tone={msg.type === 'success' ? 'success' : 'critical'}>
                    <p>{msg.text}</p>
                </Banner>
            )}

            <Banner tone="info">
                <p>
                    Select any plant from your Shopify store and click <strong>Enable Bundle</strong> to start configuring pot options for it.
                    Products already enabled show a green badge.
                </p>
            </Banner>

            <Card padding="0">
                <Box padding="400">
                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200">
                            <Text variant="headingMd">🌿 Your Shopify Plants</Text>
                            <Badge>{products.length} products</Badge>
                        </InlineStack>
                        <Button onClick={fetchAll} icon={RefreshIcon} variant="tertiary" size="slim">Refresh</Button>
                    </InlineStack>
                    <div style={{ marginTop: 12 }}>
                        <TextField
                            prefix={<SearchIcon style={{ width: 18 }} />}
                            placeholder="Search plants..."
                            value={query}
                            onChange={setQuery}
                            autoComplete="off"
                            clearButton
                            onClearButtonClick={() => setQuery('')}
                        />
                    </div>
                </Box>
                <Divider />

                {filtered.length === 0 ? (
                    <Box padding="800">
                        <div style={{ textAlign: 'center', color: '#8c9196' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <Text tone="subdued">No products match your search.</Text>
                        </div>
                    </Box>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '1px',
                        background: '#e1e3e5'
                    }}>
                        {filtered.map(product => {
                            const isConfigured = configuredIds.has(String(product.id));
                            const isAdding = addingId === product.id;
                            const imgUrl = product.image?.src || product.images?.[0]?.src;
                            const variants = product.variants || [];
                            const prices = variants.map(v => parseFloat(v.price)).filter(Boolean);
                            const price = prices.length
                                ? (Math.min(...prices) === Math.max(...prices)
                                    ? `$${Math.min(...prices).toFixed(2)}`
                                    : `$${Math.min(...prices).toFixed(2)}–$${Math.max(...prices).toFixed(2)}`)
                                : '';

                            return (
                                <div key={product.id} style={{ background: '#fff', display: 'flex', flexDirection: 'column' }}>
                                    {/* Image */}
                                    <div style={{ position: 'relative', height: 180, background: '#f6f6f7', overflow: 'hidden' }}>
                                        {imgUrl ? (
                                            <img
                                                src={imgUrl} alt={product.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4cdd5' }}>
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}
                                        {/* badges */}
                                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                background: product.status === 'active' ? '#d4edda' : '#fff3cd',
                                                color: product.status === 'active' ? '#155724' : '#856404'
                                            }}>
                                                {product.status === 'active' ? '● Active' : '● Draft'}
                                            </span>
                                        </div>
                                        {isConfigured && (
                                            <div style={{ position: 'absolute', top: 8, left: 8 }}>
                                                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#c6f6d5', color: '#22543d' }}>
                                                    ✓ Bundle ON
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <Text variant="bodyMd" fontWeight="semibold">{product.title}</Text>
                                        {price && <Text variant="bodyMd" fontWeight="bold" tone="success">{price}</Text>}
                                        {variants.length > 0 && (
                                            <div style={{ fontSize: 12, color: '#8c9196', background: '#f6f6f7', borderRadius: 6, padding: '4px 8px' }}>
                                                {variants.length} size{variants.length !== 1 ? 's' : ''}: {variants.slice(0, 3).map(v => v.title).join(', ')}{variants.length > 3 ? ` +${variants.length - 3}` : ''}
                                            </div>
                                        )}
                                        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                                            {isConfigured ? (
                                                <div style={{
                                                    textAlign: 'center', padding: '7px', borderRadius: 6,
                                                    background: '#f0fff4', border: '1px solid #9ae6b4',
                                                    color: '#276749', fontWeight: 600, fontSize: 13
                                                }}>
                                                    ✓ Pot Bundling Enabled
                                                </div>
                                            ) : (
                                                <Button fullWidth variant="primary" loading={isAdding} onClick={() => addToBundle(product)}>
                                                    Enable Bundle
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB 2: Create brand-new product in Shopify
   ───────────────────────────────────────────────────────────── */
function CreateNewProduct() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        variants: [{ title: 'Small', price: '50.00', pot_size: 'Small' }],
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const potSizeOptions = [
        { label: 'Small', value: 'Small' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Large', value: 'Large' },
        { label: 'Extra Large', value: 'Extra Large' },
    ];

    const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

    const addVariant = () => setFormData({
        ...formData,
        variants: [...formData.variants, { title: '', price: '10.00', pot_size: 'Medium' }],
    });

    const updateVariant = (index, field, value) => {
        const updated = [...formData.variants];
        updated[index][field] = value;
        setFormData({ ...formData, variants: updated });
    };

    const removeVariant = (index) => setFormData({
        ...formData,
        variants: formData.variants.filter((_, i) => i !== index)
    });

    const handleSubmit = async () => {
        if (!formData.title) { setMsg({ text: 'Please enter a product title.', type: 'error' }); return; }
        setSaving(true);
        setMsg({ text: '', type: '' });
        try {
            const res = await fetch('/api/products/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ text: `✅ "${formData.title}" created in Shopify and configured for pot bundling!`, type: 'success' });
                setFormData({ title: '', description: '', variants: [{ title: 'Small', price: '50.00', pot_size: 'Small' }] });
            } else {
                throw new Error(data.error || 'Failed to create product');
            }
        } catch (error) {
            setMsg({ text: `❌ ${error.message}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <Layout.Section>
                <BlockStack gap="500">
                    {msg.text && (
                        <Banner tone={msg.type === 'success' ? 'success' : 'critical'}>
                            <p>{msg.text}</p>
                        </Banner>
                    )}

                    <Banner tone="info">
                        This creates a brand-new product directly in your Shopify Admin and automatically enables it for pot bundling.
                    </Banner>

                    <Card>
                        <Box padding="500">
                            <FormLayout>
                                <BlockStack gap="400">
                                    <Text variant="headingMd">Basic Information</Text>
                                    <TextField
                                        label="Product Title"
                                        value={formData.title}
                                        onChange={(v) => handleChange('title', v)}
                                        autoComplete="off"
                                        placeholder="e.g. Madagascar Palm Plant"
                                    />
                                    <TextField
                                        label="Public Description"
                                        value={formData.description}
                                        onChange={(v) => handleChange('description', v)}
                                        multiline={4}
                                        autoComplete="off"
                                        placeholder="Describe this plant..."
                                    />
                                </BlockStack>
                            </FormLayout>
                        </Box>
                    </Card>

                    <Card padding="0">
                        <Box padding="500">
                            <BlockStack gap="400">
                                <InlineStack align="space-between">
                                    <Text variant="headingMd">Size Variants & Prices</Text>
                                    <Badge tone="info">{formData.variants.length} variants</Badge>
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
                                                onChange={(v) => updateVariant(index, 'title', v)}
                                                placeholder="e.g. 4-inch Pot"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <TextField
                                                label="Base Price"
                                                value={variant.price}
                                                onChange={(v) => updateVariant(index, 'price', v)}
                                                type="number"
                                                prefix="$"
                                            />
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <Select
                                                label="Pot size mapping"
                                                options={potSizeOptions}
                                                value={variant.pot_size}
                                                onChange={(v) => updateVariant(index, 'pot_size', v)}
                                            />
                                        </div>
                                        <Button
                                            tone="critical"
                                            icon={DeleteIcon}
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
                            <Button onClick={addVariant} icon={PlusIcon}>Add Another Size Variant</Button>
                        </Box>
                    </Card>

                    <InlineStack align="end">
                        <Button variant="primary" size="large" loading={saving} onClick={handleSubmit} icon={PlusIcon}>
                            Create &amp; Sync to Shopify
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Layout.Section>

            <Layout.Section variant="oneThird">
                <Card>
                    <Box padding="400">
                        <BlockStack gap="300">
                            <Text variant="headingSm">💡 How it works</Text>
                            <Text variant="bodySm" tone="subdued">
                                1. Fill in the plant title and description.
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                                2. Add size variants (Small / Medium / Large) with prices.
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                                3. Map each size to a pot category so the system knows which pot inventory to deduct.
                            </Text>
                            <Divider />
                            <Text variant="bodySm" tone="subdued">
                                After creation, go to <strong>Product Config</strong> to manage pot pairing options, or <strong>Images</strong> to upload composite photos.
                            </Text>
                        </BlockStack>
                    </Box>
                </Card>
            </Layout.Section>
        </Layout>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
function AddPlantProduct() {
    const [selectedTab, setSelectedTab] = useState(0);

    const tabs = [
        { id: 'pick-existing', content: '🌿 Pick from Shopify Inventory', panelID: 'pick-panel' },
        { id: 'create-new', content: '➕ Create New Product', panelID: 'create-panel' },
    ];

    return (
        <Page
            title="Add Plant Bundle"
            subtitle="Enable a Shopify product for pot bundling, or create a brand-new one."
        >
            <BlockStack gap="400">
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
                </Card>

                <div style={{ marginTop: 4 }}>
                    {selectedTab === 0 ? <PickFromShopify /> : <CreateNewProduct />}
                </div>
            </BlockStack>
        </Page>
    );
}

export default AddPlantProduct;
