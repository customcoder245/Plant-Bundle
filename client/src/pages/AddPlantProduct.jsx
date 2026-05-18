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
    MenuVerticalIcon, ImageIcon, CheckCircleIcon
} from '@shopify/polaris-icons';

/* ─────────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────────── */

function MediaUploadCard() {
    return (
        <Card>
            <Box padding="400">
                <BlockStack gap="400">
                    <InlineStack align="space-between">
                        <Text variant="headingMd">Media</Text>
                        <Button variant="tertiary" size="slim">Add from URL</Button>
                    </InlineStack>
                    <div style={{
                        border: '1px dashed #c4cdd5',
                        borderRadius: '8px',
                        padding: '40px',
                        textAlign: 'center',
                        background: '#f9fafb',
                        cursor: 'pointer'
                    }}>
                        <BlockStack gap="200" align="center">
                            <Icon source={ImageIcon} tone="subdued" />
                            <Text variant="bodyMd" tone="subdued">Upload images or drag and drop</Text>
                            <Button>Add</Button>
                        </BlockStack>
                    </div>
                </BlockStack>
            </Box>
        </Card>
    );
}

function VariantsCard({ variants, onAddVariant, onUpdateVariant, onRemoveVariant, potSizeOptions }) {
    return (
        <Card padding="0">
            <Box padding="400">
                <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingMd">Variants</Text>
                        <Button onClick={onAddVariant} icon={PlusIcon} variant="plain">Add variant</Button>
                    </InlineStack>
                    <Text tone="subdued">Add sizes and map them to pot inventory categories.</Text>
                </BlockStack>
            </Box>
            <Divider />

            {variants.map((v, i) => (
                <div key={i} style={{ borderBottom: i < variants.length - 1 ? '1px solid #f1f2f3' : 'none' }}>
                    <Box padding="400">
                        <FormLayout>
                            <InlineStack gap="400" align="space-between" blockAlign="end">
                                <div style={{ flex: 2 }}>
                                    <TextField
                                        label="Size Label"
                                        value={v.title}
                                        onChange={(val) => onUpdateVariant(i, 'title', val)}
                                        placeholder="e.g. 4-inch Pot"
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <TextField
                                        label="Price"
                                        value={v.price}
                                        onChange={(val) => onUpdateVariant(i, 'price', val)}
                                        prefix="$"
                                        type="number"
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1.5 }}>
                                    <Select
                                        label="Deducts from Pot Size"
                                        options={potSizeOptions}
                                        value={v.pot_size}
                                        onChange={(val) => onUpdateVariant(i, 'pot_size', val)}
                                    />
                                </div>
                                <Button
                                    icon={DeleteIcon}
                                    tone="critical"
                                    onClick={() => onRemoveVariant(i)}
                                    disabled={variants.length === 1}
                                />
                            </InlineStack>
                        </FormLayout>
                    </Box>
                </div>
            ))}
        </Card>
    );
}

function Sidebar({ status, setStatus, organization, setOrganization, tags, setTags }) {
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    return (
        <BlockStack gap="400">
            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Status</Text>
                        <Select
                            label="Product Status"
                            labelHidden
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Draft', value: 'draft' },
                                { label: 'Archived', value: 'archived' }
                            ]}
                            value={status}
                            onChange={setStatus}
                        />
                    </BlockStack>
                </Box>
            </Card>

            <Card>
                <Box padding="400">
                    <BlockStack gap="400">
                        <Text variant="headingMd">Product organization</Text>
                        <FormLayout>
                            <TextField
                                label="Type"
                                value={organization.type}
                                onChange={(v) => setOrganization({ ...organization, type: v })}
                                autoComplete="off"
                                placeholder="e.g. Drought-tolerant"
                            />
                            <TextField
                                label="Vendor"
                                value={organization.vendor}
                                onChange={(v) => setOrganization({ ...organization, vendor: v })}
                                autoComplete="off"
                                placeholder="Planet Desert"
                            />
                            <TextField
                                label="Collections"
                                value={organization.collection}
                                onChange={(v) => setOrganization({ ...organization, collection: v })}
                                autoComplete="off"
                                helpText="Add to target bundle collection"
                            />
                        </FormLayout>
                    </BlockStack>
                </Box>
            </Card>

            <Card>
                <Box padding="400">
                    <BlockStack gap="300">
                        <Text variant="headingMd">Tags</Text>
                        <TextField
                            label="Add tags"
                            labelHidden
                            value={tagInput}
                            onChange={setTagInput}
                            onBlur={handleAddTag}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            autoComplete="off"
                            placeholder="Watering_Needs:Low, Houseplant..."
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
}

/* ─────────────────────────────────────────────────────────────
   PICK FROM SHOPIFY (TAB 1)
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
                pot_size: v.title.includes('4') ? '4" Pot' : v.title.includes('6') ? '6" Pot' : v.title.includes('8') ? '8" Pot' : 'Medium'
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
                <Spinner size="large" />
                <Box marginTop="400">
                    <Text tone="subdued">Syncing Shopify Plants…</Text>
                </Box>
            </div>
        </Box>
    );

    return (
        <BlockStack gap="400">
            {msg.text && (
                <Banner tone={msg.type === 'success' ? 'success' : 'critical'}>
                    <p>{msg.text}</p>
                </Banner>
            )}

            <Card padding="0">
                <Box padding="400">
                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200">
                            <Text variant="headingMd">Shopify Inventory</Text>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: '#f1f2f3' }}>
                    {filtered.map(product => {
                        const isConfigured = configuredIds.has(String(product.id));
                        const imgUrl = product.image?.src || product.images?.[0]?.src;
                        return (
                            <div key={product.id} style={{ background: '#fff', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ height: 180, background: '#f9fafb', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                                    <img src={imgUrl || 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {isConfigured && (
                                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                            <Badge tone="success">Connected</Badge>
                                        </div>
                                    )}
                                </div>
                                <Text variant="bodyMd" fontWeight="semibold">{product.title}</Text>
                                <div style={{ marginTop: 'auto' }}>
                                    {isConfigured ? (
                                        <Button fullWidth disabled icon={CheckCircleIcon}>Ready</Button>
                                    ) : (
                                        <Button fullWidth variant="primary" loading={addingId === product.id} onClick={() => addToBundle(product)}>Connect to Bundle</Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   CREATE NEW PRODUCT (TAB 2) - THE "PERFECT" UI
   ───────────────────────────────────────────────────────────── */
function CreateNewProduct() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');
    const [organization, setOrganization] = useState({ type: '', vendor: '', collection: '' });
    const [tags, setTags] = useState([]);
    const [variants, setVariants] = useState([
        { title: '4" Pot', price: '29.99', pot_size: '4" Pot' },
        { title: '6" Pot', price: '45.99', pot_size: '6" Pot' }
    ]);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const potSizeOptions = [
        { label: '4" Pot', value: '4" Pot' },
        { label: '6" Pot', value: '6" Pot' },
        { label: '8" Pot', value: '8" Pot' },
        { label: 'Extra Large', value: 'Extra Large' }
    ];

    const addVariant = () => setVariants([...variants, { title: '', price: '0.00', pot_size: '6" Pot' }]);
    const removeVariant = (idx) => setVariants(variants.filter((_, i) => i !== idx));
    const updateVariant = (idx, field, val) => {
        const next = [...variants];
        next[idx][field] = val;
        setVariants(next);
    };

    const handleCreate = async () => {
        if (!title) { setMsg({ text: 'Product title is required.', type: 'error' }); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/products/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    variants: variants.map(v => ({ title: v.title, price: v.price, pot_size: v.pot_size }))
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ text: `✅ "${title}" has been created and connected perfectly!`, type: 'success' });
                // Reset form
                setTitle(''); setDescription(''); setVariants([{ title: '4" Pot', price: '29.99', pot_size: '4" Pot' }]);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            setMsg({ text: `❌ ${e.message}`, type: 'error' });
        } finally {
            setSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <BlockStack gap="500">
            {msg.text && (
                <Banner tone={msg.type === 'success' ? 'success' : 'critical'}>
                    <p>{msg.text}</p>
                </Banner>
            )}

            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        {/* Title & Description */}
                        <Card>
                            <Box padding="400">
                                <FormLayout>
                                    <TextField
                                        label="Title"
                                        value={title}
                                        onChange={setTitle}
                                        placeholder="e.g. Rosemary Christmas Tree 'Salvia rosmarinus'"
                                        autoComplete="off"
                                    />
                                    <div style={{ marginBottom: 4 }}>
                                        <Text variant="bodyMd">Description</Text>
                                    </div>
                                    <div style={{ border: '1px solid #c4cdd5', borderRadius: 8, overflow: 'hidden' }}>
                                        {/* Simplified Toolbar to mimic screenshot */}
                                        <div style={{ background: '#f6f6f7', padding: '8px', borderBottom: '1px solid #c4cdd5', display: 'flex', gap: 8 }}>
                                            <Button variant="tertiary" size="slim"><b>B</b></Button>
                                            <Button variant="tertiary" size="slim"><i>I</i></Button>
                                            <Button variant="tertiary" size="slim"><u>U</u></Button>
                                            <Button variant="tertiary" size="slim">A</Button>
                                            <Divider vertical />
                                            <Button variant="tertiary" size="slim">List</Button>
                                            <Button variant="tertiary" size="slim">Img</Button>
                                            <div style={{ flex: 1 }} />
                                            <Button variant="tertiary" size="slim">{'</>'}</Button>
                                        </div>
                                        <TextField
                                            label="Description"
                                            labelHidden
                                            value={description}
                                            onChange={setDescription}
                                            multiline={12}
                                            autoComplete="off"
                                            placeholder="Introduce this beautiful plant to your customers..."
                                            borderless
                                        />
                                    </div>
                                </FormLayout>
                            </Box>
                        </Card>

                        {/* Media */}
                        <MediaUploadCard />

                        {/* Variants */}
                        <VariantsCard
                            variants={variants}
                            onAddVariant={addVariant}
                            onUpdateVariant={updateVariant}
                            onRemoveVariant={removeVariant}
                            potSizeOptions={potSizeOptions}
                        />

                        {/* Metafields Placeholder */}
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <Text variant="headingMd">Product metafields</Text>
                                    <FormLayout>
                                        <TextField label="Watering" placeholder="Every 2 weeks" autoComplete="off" />
                                        <TextField label="Light Needs" placeholder="Full Sun" autoComplete="off" />
                                        <TextField label="Difficulty" placeholder="Easy" autoComplete="off" />
                                    </FormLayout>
                                </BlockStack>
                            </Box>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                {/* Sidebar */}
                <Layout.Section variant="oneThird">
                    <Sidebar
                        status={status}
                        setStatus={setStatus}
                        organization={organization}
                        setOrganization={setOrganization}
                        tags={tags}
                        setTags={setTags}
                    />
                </Layout.Section>
            </Layout>

            <Divider />

            <Box paddingBlockEnd="800">
                <InlineStack align="end" gap="400">
                    <Button size="large">Discard</Button>
                    <Button variant="primary" size="large" loading={saving} onClick={handleCreate} icon={PlusIcon}>Save & Create Product</Button>
                </InlineStack>
            </Box>
        </BlockStack>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
function AddPlantProduct() {
    const [selectedTab, setSelectedTab] = useState(0);

    const tabs = [
        { id: 'pick-existing', content: 'Connect Existing', panelID: 'pick-panel' },
        { id: 'create-new', content: 'Create Brand New', panelID: 'create-panel' },
    ];

    return (
        <Page
            backAction={{ content: 'Dashboard', url: '/' }}
            title={selectedTab === 1 ? "Add New Plant" : "Connect Shopify Product"}
            subtitle="Everything you need to sync your plants with the pot bundling system."
            primaryAction={selectedTab === 1 ? { content: 'Save Product', onAction: () => { }, variant: 'primary' } : null}
            secondaryActions={[
                { content: 'Duplicate', icon: DuplicateIcon },
                { content: 'View', icon: ViewIcon },
                { content: 'Share', icon: ShareIcon },
            ]}
        >
            <BlockStack gap="400">
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
                </Card>

                <div style={{ marginTop: 8 }}>
                    {selectedTab === 0 ? <PickFromShopify /> : <CreateNewProduct />}
                </div>
            </BlockStack>
        </Page>
    );
}

export default AddPlantProduct;
