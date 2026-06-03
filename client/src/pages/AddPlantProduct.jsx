import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, FormLayout, TextField, Button,
    InlineStack, Select, BlockStack, Text, Box,
    Divider, Banner, Badge, Tabs, Thumbnail, Spinner,
    Icon, Tag, Tooltip, EmptyState, DataTable
} from '@shopify/polaris';
import {
    PlusIcon, DeleteIcon, SearchIcon, RefreshIcon,
    ChevronLeftIcon, DuplicateIcon, ViewIcon, ShareIcon,
    MenuVerticalIcon, ImageIcon, CheckCircleIcon,
    ChevronDownIcon, ChevronUpIcon, EditIcon, AlertCircleIcon,
    InfoIcon, SettingsIcon, ListIcon, ProductIcon
} from '@shopify/polaris-icons';

/* ─────────────────────────────────────────────────────────────
   HELPERS & UI COMPONENTS
   ───────────────────────────────────────────────────────────── */

const StepIndicator = ({ step, title, active }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: active ? 1 : 0.4,
        transition: 'opacity 0.3s ease'
    }}>
        <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: active ? '#008060' : '#e1e3e5',
            color: active ? 'white' : '#5c5f62',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
        }}>
            {step}
        </div>
        <Text variant="headingSm" tone={active ? 'base' : 'subdued'}>{title}</Text>
    </div>
);

const Sidebar = ({ status, setStatus, organization, setOrganization, tags, setTags }) => {
    const [tagInput, setTagInput] = useState('');
    return (
        <BlockStack gap="400">
            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Product Status</Text>
                        <Select
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Draft', value: 'draft' }
                            ]}
                            value={status}
                            onChange={setStatus}
                        />
                        <Text variant="bodySm" tone="subdued">This product will be {status === 'active' ? 'visible' : 'hidden'} in your store.</Text>
                    </BlockStack>
                </Box>
            </Card>
            <Card>
                <Box padding="400">
                    <BlockStack gap="400">
                        <Text variant="headingMd">Organization</Text>
                        <FormLayout>
                            <TextField label="Product Category" value={organization.type} onChange={(v) => setOrganization({ ...organization, type: v })} autoComplete="off" placeholder="e.g. Bundles" />
                            <TextField label="Vendor" value={organization.vendor} onChange={(v) => setOrganization({ ...organization, vendor: v })} autoComplete="off" />
                            <TextField label="Collections" value={organization.collection} onChange={(v) => setOrganization({ ...organization, collection: v })} autoComplete="off" helpText="Add this bundle to a specific collection" />
                        </FormLayout>
                    </BlockStack>
                </Box>
            </Card>
            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Tags</Text>
                        <TextField
                            value={tagInput}
                            onChange={setTagInput}
                            placeholder="Add tags (Enter to add)"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                    setTags([...tags, tagInput.trim()]);
                                    setTagInput('');
                                }
                            }}
                            autoComplete="off"
                        />
                        <InlineStack gap="100">
                            {tags.map((t, i) => (
                                <Tag key={i} onRemove={() => setTags(tags.filter((_, idx) => idx !== i))}>{t}</Tag>
                            ))}
                        </InlineStack>
                    </BlockStack>
                </Box>
            </Card>
        </BlockStack>
    );
};

/* ─────────────────────────────────────────────────────────────
   DETAILED VARIANT EDITOR
   ───────────────────────────────────────────────────────────── */
function DetailedVariantDetailsEditor({ productTitle, variants, editingIndex, setEditingIndex, onSaveVariant, onCancel }) {
    const activeVariant = variants[editingIndex];
    const [price, setPrice] = useState(activeVariant?.price || '0.00');
    const [quantity, setQuantity] = useState(activeVariant?.inventory_quantity || '0');
    const [sku, setSku] = useState(activeVariant?.sku || '');

    useEffect(() => {
        if (activeVariant) {
            setPrice(activeVariant.price);
            setQuantity(activeVariant.inventory_quantity);
            setSku(activeVariant.sku || '');
        }
    }, [activeVariant]);

    if (!activeVariant) return null;

    return (
        <div style={{ background: '#f6f6f7', minHeight: '100vh' }}>
            <Box padding="400" paddingBottom="800">
                <BlockStack gap="500">
                    <InlineStack align="space-between" blockAlign="center">
                        <Button icon={ChevronLeftIcon} onClick={onCancel}>Back to Bundle</Button>
                        <InlineStack gap="300">
                            <Button onClick={onCancel}>Discard</Button>
                            <Button variant="primary" onClick={() => onSaveVariant(editingIndex, { ...activeVariant, price, inventory_quantity: quantity, sku })}>Save Variant</Button>
                        </InlineStack>
                    </InlineStack>

                    <Layout>
                        <Layout.Section>
                            <BlockStack gap="400">
                                <Card>
                                    <Box padding="500">
                                        <Text variant="headingLg">{activeVariant.title}</Text>
                                        <Text tone="subdued">Component breakdown: {activeVariant.mapping?.plant?.title || 'Plant'} + {activeVariant.mapping?.pot?.title || 'Pot'}</Text>
                                    </Box>
                                </Card>

                                <Card>
                                    <Box padding="500">
                                        <BlockStack gap="400">
                                            <Text variant="headingMd">Pricing & Inventory</Text>
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField label="Price" value={price} onChange={setPrice} prefix="$" autoComplete="off" />
                                                    <TextField label="SKU (Optional)" value={sku} onChange={setSku} autoComplete="off" />
                                                </FormLayout.Group>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <TextField label="Inventory Stock" type="number" value={quantity} onChange={setQuantity} autoComplete="off" helpText="The bundle quantity is usually synced with components." />
                                                    </div>
                                                    <Badge tone="info">Synced with Components</Badge>
                                                </div>
                                            </FormLayout>
                                        </BlockStack>
                                    </Box>
                                </Card>

                                <Card>
                                    <Box padding="500">
                                        <BlockStack gap="400">
                                            <Text variant="headingMd">Component Mapping</Text>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                <Box padding="400" background="bg-surface-secondary-active" borderRadius="200">
                                                    <BlockStack gap="200">
                                                        <Text fontWeight="bold">Plant Component</Text>
                                                        <Text variant="bodyMd">{activeVariant.mapping?.plant?.title || 'N/A'}</Text>
                                                        <Badge>{activeVariant.mapping?.plant?.price || '0.00'}</Badge>
                                                    </BlockStack>
                                                </Box>
                                                <Box padding="400" background="bg-surface-secondary-active" borderRadius="200">
                                                    <BlockStack gap="200">
                                                        <Text fontWeight="bold">Pot Component</Text>
                                                        <Text variant="bodyMd">{activeVariant.mapping?.pot?.title || 'N/A'}</Text>
                                                        <Badge>{activeVariant.mapping?.pot?.price || '0.00'}</Badge>
                                                    </BlockStack>
                                                </Box>
                                            </div>
                                        </BlockStack>
                                    </Box>
                                </Card>
                            </BlockStack>
                        </Layout.Section>

                        <Layout.Section variant="oneThird">
                            <Card>
                                <Box padding="400">
                                    <Text variant="headingMd">Quick Switch</Text>
                                    <Box marginTop="400">
                                        <BlockStack gap="100">
                                            {variants.map((v, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setEditingIndex(i)}
                                                    style={{
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        background: i === editingIndex ? '#edf4fe' : 'transparent',
                                                        border: i === editingIndex ? '1px solid #005bd3' : '1px solid transparent'
                                                    }}
                                                >
                                                    <Text variant="bodyMd" fontWeight={i === editingIndex ? 'bold' : 'regular'}>{v.title}</Text>
                                                </div>
                                            ))}
                                        </BlockStack>
                                    </Box>
                                </Box>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </BlockStack>
            </Box>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TABS: PICK FROM SHOPIFY
   ───────────────────────────────────────────────────────────── */
function PickFromShopify() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/products').then(res => res.json()).then(data => {
            setProducts(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <Box padding="800" textAlign="center"><Spinner size="large" /></Box>;

    return (
        <BlockStack gap="400">
            <Card>
                <Box padding="400">
                    <TextField
                        prefix={<Icon source={SearchIcon} />}
                        placeholder="Search existing Shopify products to configure as bundles..."
                        value={search}
                        onChange={setSearch}
                        autoComplete="off"
                    />
                </Box>
            </Card>

            <Card padding="0">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f6f6f7', textAlign: 'left' }}>
                            <th style={{ padding: '16px', borderBottom: '1px solid #e1e3e5' }}>Product Details</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid #e1e3e5' }}>Status</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid #e1e3e5' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map(p => (
                                <tr key={p.id}>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f2f3' }}>
                                        <InlineStack gap="300" blockAlign="center">
                                            <Thumbnail source={p.image?.src || ImageIcon} alt={p.title} size="small" />
                                            <Text variant="bodyMd" fontWeight="bold">{p.title}</Text>
                                        </InlineStack>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f2f3' }}>
                                        <Badge tone="success">Ready for Bundle</Badge>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f2f3' }}>
                                        <Button variant="secondary">Configure</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ padding: '40px', textAlign: 'center' }}>
                                    <Text tone="subdued">No products found matching your search.</Text>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT: CREATE NEW
   ───────────────────────────────────────────────────────────── */
function CreateNewProduct() {
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('active');
    const [organization, setOrganization] = useState({ type: 'Bundles', vendor: 'Planet Desert', collection: '' });
    const [tags, setTags] = useState([]);
    const [bundleComponents, setBundleComponents] = useState([
        { id: '1', title: '', type: 'plant', variants: [] },
        { id: '2', title: '', type: 'pot', variants: [] }
    ]);
    const [mergedVariants, setMergedVariants] = useState([]);
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    // Progress stepper logic
    const currentStep = !title ? 1 : (bundleComponents.every(c => c.variants.length > 0) ? 3 : 2);

    useEffect(() => {
        if (bundleComponents[0].variants.length && bundleComponents[1].variants.length) {
            const p1 = bundleComponents[0];
            const p2 = bundleComponents[1];
            const combos = [];
            p1.variants.forEach(pv => {
                p2.variants.forEach(pov => {
                    combos.push({
                        title: `${pv.title} / ${pov.title}`,
                        price: (parseFloat(pv.price) + parseFloat(pov.price)).toFixed(2),
                        inventory_quantity: Math.min(pv.inventory_quantity, pov.inventory_quantity),
                        mapping: { plant: pv, pot: pov },
                        sku: `${pv.sku || 'P'}-${pov.sku || 'POT'}`.toUpperCase()
                    });
                });
            });
            setMergedVariants(combos);
        } else {
            setMergedVariants([]);
        }
    }, [bundleComponents]);

    const handleCreate = async () => {
        if (!title) {
            setMsg({ text: '⚠️ Please enter a bundle title first!', type: 'error' });
            return;
        }
        setSaving(true);
        // Mock server save
        setTimeout(() => {
            setMsg({ text: '✅ Bundle published successfully to Shopify!', type: 'success' });
            setSaving(false);
        }, 1500);
    };

    const selectMockProduct = (idx, type) => {
        const next = [...bundleComponents];
        if (type === 'plant') {
            next[idx] = {
                ...next[idx],
                title: 'Snake Plant Zeynica',
                variants: [
                    { title: '4" Houseplant', price: '12.49', inventory_quantity: 45, sku: 'SNK-4' },
                    { title: '6" Houseplant', price: '22.49', inventory_quantity: 20, sku: 'SNK-6' }
                ]
            };
        } else {
            next[idx] = {
                ...next[idx],
                title: 'Terra Cotta Pot',
                variants: [
                    { title: 'Small Terracotta', price: '4.00', inventory_quantity: 100, sku: 'POT-TC-S' },
                    { title: 'Classic Terracotta', price: '8.00', inventory_quantity: 50, sku: 'POT-TC-M' }
                ]
            };
        }
        setBundleComponents(next);
    };

    if (editingVariantIndex !== null) {
        return (
            <DetailedVariantDetailsEditor
                productTitle={title}
                variants={mergedVariants}
                editingIndex={editingVariantIndex}
                setEditingIndex={setEditingVariantIndex}
                onSaveVariant={(idx, obj) => {
                    const next = [...mergedVariants];
                    next[idx] = obj;
                    setMergedVariants(next);
                    setEditingVariantIndex(null);
                }}
                onCancel={() => setEditingVariantIndex(null)}
            />
        );
    }

    return (
        <BlockStack gap="500">
            {msg.text && (
                <Banner tone={msg.type === 'success' ? 'success' : 'critical'} onDismiss={() => setMsg({ text: '', type: '' })}>
                    <p>{msg.text}</p>
                </Banner>
            )}

            {/* Premium Header with Stepper */}
            <Card>
                <Box padding="500">
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                            <Text variant="headingLg">Configure Bundle</Text>
                            <Text tone="subdued">Create a multi-product bundle that syncs inventory automatically.</Text>
                        </BlockStack>
                        <InlineStack gap="600">
                            <StepIndicator step="1" title="Basics" active={currentStep >= 1} />
                            <StepIndicator step="2" title="Components" active={currentStep >= 2} />
                            <StepIndicator step="3" title="Variants" active={currentStep >= 3} />
                        </InlineStack>
                    </InlineStack>
                </Box>
            </Card>

            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        {/* Step 1: Basics */}
                        <Card>
                            <Box padding="500">
                                <BlockStack gap="400">
                                    <InlineStack gap="200" blockAlign="center">
                                        <Icon source={InfoIcon} tone="base" />
                                        <Text variant="headingMd">Bundle Basics</Text>
                                    </InlineStack>
                                    <TextField
                                        label="Bundle Name (Visible to customers)"
                                        value={title}
                                        onChange={setTitle}
                                        autoComplete="off"
                                        placeholder="e.g. Starter Plant & Pot Set"
                                    />
                                </BlockStack>
                            </Box>
                        </Card>

                        {/* Step 2: Components */}
                        <Card>
                            <Box padding="500">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <InlineStack gap="200" blockAlign="center">
                                            <Icon source={ProductIcon} tone="base" />
                                            <Text variant="headingMd">Bundle Components</Text>
                                        </InlineStack>
                                        <Badge tone="info">2 Items Required</Badge>
                                    </InlineStack>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {bundleComponents.map((comp, idx) => (
                                            <div
                                                key={comp.id}
                                                style={{
                                                    border: '1px solid #e1e3e5',
                                                    borderRadius: '12px',
                                                    padding: '24px',
                                                    textAlign: 'center',
                                                    background: comp.variants.length ? '#f8f9fa' : 'white',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: comp.variants.length ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {comp.variants.length ? (
                                                    <BlockStack gap="300" align="center">
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                            <Icon source={CheckCircleIcon} tone="success" />
                                                        </div>
                                                        <BlockStack gap="050">
                                                            <Text fontWeight="bold" variant="bodyLg">{comp.title}</Text>
                                                            <Text tone="subdued" variant="bodySm">{comp.variants.length} variations linked</Text>
                                                        </BlockStack>
                                                        <Button variant="plain" tone="critical" onClick={() => {
                                                            const next = [...bundleComponents];
                                                            next[idx].variants = [];
                                                            next[idx].title = '';
                                                            setBundleComponents(next);
                                                        }}>Remove Item</Button>
                                                    </BlockStack>
                                                ) : (
                                                    <BlockStack gap="300" align="center">
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f2f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Icon source={PlusIcon} tone="subdued" />
                                                        </div>
                                                        <Text tone="subdued">Select the {comp.type} for this bundle</Text>
                                                        <Button variant="primary" onClick={() => selectMockProduct(idx, comp.type)}>
                                                            Select {comp.type === 'plant' ? 'Plant' : 'Pot'}
                                                        </Button>
                                                    </BlockStack>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </BlockStack>
                            </Box>
                        </Card>

                        {/* Step 3: Combined Variants Table */}
                        {mergedVariants.length > 0 && (
                            <Card padding="0">
                                <Box padding="500">
                                    <InlineStack align="space-between">
                                        <InlineStack gap="200" blockAlign="center">
                                            <Icon source={ListIcon} tone="base" />
                                            <Text variant="headingMd">Resulting Variants</Text>
                                        </InlineStack>
                                        <Text tone="subdued">{mergedVariants.length} combinations created</Text>
                                    </InlineStack>
                                </Box>
                                <Divider />
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f9fafb' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '16px', fontWeight: '600', color: '#5c5f62' }}>Combination Name</th>
                                            <th style={{ padding: '16px', fontWeight: '600', color: '#5c5f62' }}>Price</th>
                                            <th style={{ padding: '16px', fontWeight: '600', color: '#5c5f62' }}>Available Stock</th>
                                            <th style={{ padding: '16px', fontWeight: '600', color: '#5c5f62' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mergedVariants.map((v, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #f1f2f3', transition: 'background 0.2s ease' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <BlockStack gap="050">
                                                        <Text fontWeight="bold">{v.title}</Text>
                                                        <Text variant="bodySm" tone="subdued">{v.sku}</Text>
                                                    </BlockStack>
                                                </td>
                                                <td style={{ padding: '16px' }}><Badge>${v.price}</Badge></td>
                                                <td style={{ padding: '16px' }}>
                                                    <InlineStack gap="200" blockAlign="center">
                                                        <Text fontWeight="medium" tone={v.inventory_quantity < 10 ? 'critical' : 'base'}>
                                                            {v.inventory_quantity} units
                                                        </Text>
                                                        {v.inventory_quantity < 10 && <Icon source={AlertCircleIcon} tone="critical" size="small" />}
                                                    </InlineStack>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <Tooltip content="Edit specific pricing/SKU for this variant">
                                                        <Button icon={EditIcon} onClick={() => setEditingVariantIndex(i)} />
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Box padding="400" background="bg-surface-secondary">
                                    <Text tone="subdued" variant="bodySm" alignment="center">
                                        💡 Inventory is calculated using the minimum available quantity among components.
                                    </Text>
                                </Box>
                            </Card>
                        )}
                    </BlockStack>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Sidebar status={status} setStatus={setStatus} organization={organization} setOrganization={setOrganization} tags={tags} setTags={setTags} />
                </Layout.Section>
            </Layout>

            <Divider />

            <div style={{ paddingBottom: '100px' }}>
                <InlineStack align="end" gap="400">
                    <Button onClick={() => window.location.reload()}>Discard Changes</Button>
                    <Button loading={saving} variant="primary" size="large" onClick={handleCreate} disabled={!title || mergedVariants.length === 0}>
                        Publish Bundle Product
                    </Button>
                </InlineStack>
            </div>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   ROOT COMPONENT
   ───────────────────────────────────────────────────────────── */
function AddPlantProduct() {
    const [selectedTab, setSelectedTab] = useState(1);
    const tabs = [
        { id: 'pick', content: 'Configure Existing', panelID: 'pick-panel' },
        { id: 'create', content: 'Create Combined Bundle', panelID: 'create-panel' }
    ];

    return (
        <Page
            title="Bundle Architect"
            backAction={{ content: 'Back to Store', url: '/' }}
            compactTitle
        >
            <BlockStack gap="500">
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
                </Card>
                {selectedTab === 0 ? <PickFromShopify /> : <CreateNewProduct />}
            </BlockStack>
        </Page>
    );
}

export default AddPlantProduct;
