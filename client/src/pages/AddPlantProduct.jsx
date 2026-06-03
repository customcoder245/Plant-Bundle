import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, FormLayout, TextField, Button,
    InlineStack, Select, BlockStack, Text, Box,
    Divider, Banner, Badge, Tabs, Thumbnail, Spinner,
    Icon, Tag
} from '@shopify/polaris';
import {
    PlusIcon, DeleteIcon, SearchIcon, RefreshIcon,
    ChevronLeftIcon, DuplicateIcon, ViewIcon, ShareIcon,
    MenuVerticalIcon, ImageIcon, CheckCircleIcon,
    ChevronDownIcon, ChevronUpIcon, EditIcon, AlertCircleIcon
} from '@shopify/polaris-icons';

/* ─────────────────────────────────────────────────────────────
   HELPERS & SHARED
   ───────────────────────────────────────────────────────────── */
const MediaUploadCard = ({ imageUrl, onUpload }) => (
    <Card>
        <Box padding="400">
            <BlockStack gap="400">
                <Text variant="headingMd">Media</Text>
                <div style={{ border: '2px dashed #c4cdd5', borderRadius: '8px', padding: '40px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }}>
                    <BlockStack gap="200" align="center">
                        <Icon source={ImageIcon} tone="subdued" />
                        {imageUrl ? <img src={imageUrl} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'cover' }} /> : <Text variant="bodyMd" tone="subdued">Upload images or drag and drop</Text>}
                        <Button onClick={() => onUpload && onUpload('https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=300&h=300&q=80')}>Mock Upload</Button>
                    </BlockStack>
                </div>
            </BlockStack>
        </Box>
    </Card>
);

const Sidebar = ({ status, setStatus, organization, setOrganization, tags, setTags }) => {
    const [tagInput, setTagInput] = useState('');
    return (
        <BlockStack gap="400">
            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Status</Text>
                        <Select options={[{ label: 'Active', value: 'active' }, { label: 'Draft', value: 'draft' }]} value={status} onChange={setStatus} />
                    </BlockStack>
                </Box>
            </Card>
            <Card>
                <Box padding="400">
                    <BlockStack gap="400">
                        <Text variant="headingMd">Organization</Text>
                        <TextField label="Type" value={organization.type} onChange={(v) => setOrganization({ ...organization, type: v })} autoComplete="off" />
                        <TextField label="Vendor" value={organization.vendor} onChange={(v) => setOrganization({ ...organization, vendor: v })} autoComplete="off" />
                        <TextField label="Collection" value={organization.collection} onChange={(v) => setOrganization({ ...organization, collection: v })} autoComplete="off" />
                    </BlockStack>
                </Box>
            </Card>
            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Tags</Text>
                        <TextField value={tagInput} onChange={setTagInput} placeholder="Add tags..." onBlur={() => { if (tagInput) { setTags([...tags, tagInput]); setTagInput(''); } }} autoComplete="off" />
                        <InlineStack gap="100">{tags.map((t, i) => <Tag key={i} onRemove={() => setTags(tags.filter((_, idx) => idx !== i))}>{t}</Tag>)}</InlineStack>
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

    if (!activeVariant) return null;

    return (
        <div style={{ background: '#f6f6f7', minHeight: '100vh', padding: '20px' }}>
            <Page backAction={{ content: 'Back', onClick: onCancel }} title={`Editing ${activeVariant.title}`}>
                <Layout>
                    <Layout.Section>
                        <Card>
                            <Box padding="400">
                                <FormLayout>
                                    <TextField label="Price" value={price} onChange={setPrice} prefix="$" autoComplete="off" />
                                    <TextField label="Inventory" type="number" value={quantity} onChange={setQuantity} autoComplete="off" />
                                </FormLayout>
                            </Box>
                        </Card>
                    </Layout.Section>
                    <Layout.Section variant="oneThird">
                        <Card>
                            <Box padding="400">
                                <Text variant="headingMd">Variant List</Text>
                                <BlockStack gap="200" marginTop="400">
                                    {variants.map((v, i) => (
                                        <Button key={i} variant={i === editingIndex ? 'primary' : 'plain'} onClick={() => setEditingIndex(i)}>{v.title}</Button>
                                    ))}
                                </BlockStack>
                            </Box>
                        </Card>
                    </Layout.Section>
                </Layout>
                <Box marginTop="400">
                    <InlineStack align="end" gap="300">
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" onClick={() => onSaveVariant(editingIndex, { ...activeVariant, price, inventory_quantity: quantity })}>Save</Button>
                    </InlineStack>
                </Box>
            </Page>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TABS: PICK VS CREATE
   ───────────────────────────────────────────────────────────── */
function PickFromShopify() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products').then(res => res.json()).then(data => {
            setProducts(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Box padding="800" textAlign="center"><Spinner /></Box>;

    return (
        <Card padding="0">
            <table style={{ width: '100%', textAlign: 'left' }}>
                <thead><tr style={{ background: '#f6f6f7' }}><th style={{ padding: '12px' }}>Product</th><th style={{ padding: '12px' }}>Action</th></tr></thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td style={{ padding: '12px' }}>{p.title}</td>
                            <td style={{ padding: '12px' }}><Button variant="primary">Connect to Bundle</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}

function CreateNewProduct() {
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('active');
    const [organization, setOrganization] = useState({ type: '', vendor: '', collection: '' });
    const [tags, setTags] = useState([]);
    const [bundleComponents, setBundleComponents] = useState([
        { id: '1', title: 'Select Plant Product...', type: 'plant', variants: [] },
        { id: '2', title: 'Select Pot Product...', type: 'pot', variants: [] }
    ]);
    const [mergedVariants, setMergedVariants] = useState([]);
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

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
                        mapping: { plant: pv, pot: pov }
                    });
                });
            });
            setMergedVariants(combos);
        }
    }, [bundleComponents]);

    const handleCreate = async () => {
        setSaving(true);
        setTimeout(() => {
            setMsg({ text: '✅ Bundle created!', type: 'success' });
            setSaving(false);
        }, 1000);
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
            {msg.text && <Banner tone="success">{msg.text}</Banner>}
            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        <Card><Box padding="400"><TextField label="Bundle Title" value={title} onChange={setTitle} autoComplete="off" /></Box></Card>
                        <Card>
                            <Box padding="400">
                                <Text variant="headingMd">Components</Text>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                                    {bundleComponents.map((comp, idx) => (
                                        <div key={comp.id} style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>
                                            {comp.variants.length ? (
                                                <BlockStack gap="200">
                                                    <Text fontWeight="bold">{comp.title}</Text>
                                                    <Button variant="plain" onClick={() => {
                                                        const next = [...bundleComponents];
                                                        next[idx].variants = [];
                                                        setBundleComponents(next);
                                                    }}>Remove</Button>
                                                </BlockStack>
                                            ) : (
                                                <Button onClick={() => {
                                                    const next = [...bundleComponents];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        title: comp.type === 'plant' ? 'Rosemary' : 'Pot',
                                                        variants: [{ title: 'Small', price: '10.00', inventory_quantity: 5 }]
                                                    };
                                                    setBundleComponents(next);
                                                }}>Select {comp.type}</Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Box>
                        </Card>
                        <Card padding="0">
                            <table style={{ width: '100%', textAlign: 'left' }}>
                                <thead style={{ background: '#f6f6f7' }}><tr><th style={{ padding: '12px' }}>Variant</th><th style={{ padding: '12px' }}>Inventory</th><th style={{ padding: '12px' }}>Action</th></tr></thead>
                                <tbody>
                                    {mergedVariants.map((v, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{v.title}</td>
                                            <td style={{ padding: '12px' }}>{v.inventory_quantity}</td>
                                            <td style={{ padding: '12px' }}><Button icon={EditIcon} onClick={() => setEditingVariantIndex(i)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </BlockStack>
                </Layout.Section>
                <Layout.Section variant="oneThird">
                    <Sidebar status={status} setStatus={setStatus} organization={organization} setOrganization={setOrganization} tags={tags} setTags={setTags} />
                </Layout.Section>
            </Layout>
            <InlineStack align="end" gap="400">
                <Button loading={saving} variant="primary" onClick={handleCreate}>Save Bundle</Button>
            </InlineStack>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   ROOT COMPONENT
   ───────────────────────────────────────────────────────────── */
function AddPlantProduct() {
    const [selectedTab, setSelectedTab] = useState(1);
    const tabs = [
        { id: 'pick', content: 'Sync from Shopify', panelID: 'pick-panel' },
        { id: 'create', content: 'Create Combined Bundle', panelID: 'create-panel' }
    ];

    return (
        <Page title="Products" primaryAction={{ content: 'Add product', variant: 'primary' }}>
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
