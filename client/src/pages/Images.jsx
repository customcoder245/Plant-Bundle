import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, Text, BlockStack, InlineStack,
    Thumbnail, Button, Select, EmptyState, Badge,
    Box, Divider, Banner, SkeletonBodyText
} from '@shopify/polaris';
import { ImageIcon, UploadIcon, PackageIcon, CameraIcon } from '@shopify/polaris-icons';
import { Trash2 } from 'lucide-react';

function Images() {
    const [configs, setConfigs] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [images, setImages] = useState([]);
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newImage, setNewImage] = useState({ pot_color_id: '', size: '', file: null });

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (selectedProduct) fetchImages(selectedProduct); }, [selectedProduct]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configsRes, colorsRes] = await Promise.all([
                fetch('/api/product-config'),
                fetch('/api/pots/colors')
            ]);
            const configsData = await configsRes.json();
            const colorsData = await colorsRes.json();

            setConfigs(Array.isArray(configsData) ? configsData : []);
            setColors(Array.isArray(colorsData) ? colorsData : []);

            if (configsData.length > 0) setSelectedProduct(configsData[0].id.toString());
        } catch (error) { console.error('Failed to fetch data:', error); }
        finally { setLoading(false); }
    };

    const fetchImages = async (productConfigId) => {
        try {
            const res = await fetch(`/api/images/product/${productConfigId}`);
            setImages(await res.json());
        } catch (error) { console.error('Failed to fetch images:', error); }
    };

    const handleAddImage = async () => {
        if (!newImage.file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('product_config_id', selectedProduct);
        formData.append('pot_color_id', newImage.pot_color_id);
        formData.append('size', newImage.size);
        formData.append('image', newImage.file);

        try {
            const res = await fetch('/api/images', { method: 'POST', body: formData });
            if (res.ok) {
                setNewImage({ pot_color_id: '', size: '', file: null });
                fetchImages(selectedProduct);
            } else {
                const data = await res.json();
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to add image:', error);
            alert('Server error during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (id) => {
        if (!confirm('Permanently delete this bundle image from Shopify?')) return;
        try {
            await fetch(`/api/images/${id}`, { method: 'DELETE' });
            fetchImages(selectedProduct);
        } catch (error) { console.error('Failed to delete image:', error); }
    };

    const productOptions = configs.map(c => ({ label: c.product_title || `Product #${c.shopify_product_id}`, value: c.id.toString() }));
    const colorOptions = [{ label: 'Select color...', value: '' }, ...colors.map(c => ({ label: c.name, value: c.id.toString() }))];
    const sizeOptions = [{ label: 'Select size...', value: '' }, { label: 'Small', value: 'Small' }, { label: 'Medium', value: 'Medium' }, { label: 'Large', value: 'Large' }, { label: 'Extra Large', value: 'Extra Large' }];

    if (loading) return <Page title="Bundle Images"><SkeletonBodyText lines={20} /></Page>;

    if (configs.length === 0) return (
        <Page title="Bundle Images">
            <EmptyState
                heading="No products configured"
                action={{ content: 'Go to Product Setup', url: '/products' }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
                <p>You need to enable bundling for at least one product before you can manage composite images.</p>
            </EmptyState>
        </Page>
    );

    return (
        <Page
            title="Bundle Images"
            subtitle="Upload and manage the composite images that customers see when they pick a pot."
        >
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <InlineStack gap="200" align="start" blockAlign="center">
                                        <PackageIcon style={{ width: 20 }} />
                                        <Text variant="headingMd">1. Select Product to Manage</Text>
                                    </InlineStack>
                                    <Select
                                        label="Active Bundles"
                                        labelHidden
                                        options={productOptions}
                                        value={selectedProduct}
                                        onChange={setSelectedProduct}
                                    />
                                </BlockStack>
                            </Box>
                        </Card>

                        <Card padding="0">
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <InlineStack gap="200" align="start" blockAlign="center">
                                        <UploadIcon style={{ width: 20 }} />
                                        <Text variant="headingMd">2. Upload New Composite</Text>
                                    </InlineStack>
                                    <InlineStack gap="400" align="end" blockAlign="end">
                                        <div style={{ flex: 1 }}><Select label="Target Pot Color" options={colorOptions} value={newImage.pot_color_id} onChange={(value) => setNewImage({ ...newImage, pot_color_id: value })} /></div>
                                        <div style={{ flex: 1 }}><Select label="Target Plant Size" options={sizeOptions} value={newImage.size} onChange={(value) => setNewImage({ ...newImage, size: value })} /></div>
                                        <div style={{ flex: 2 }}>
                                            <Text variant="bodySm">Bundle Image File</Text>
                                            <input type="file" accept="image/*" onChange={(e) => setNewImage({ ...newImage, file: e.target.files[0] })} style={{ marginTop: '8px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                    </InlineStack>
                                    <Box paddingBlockStart="400">
                                        <Button variant="primary" onClick={handleAddImage} loading={uploading} disabled={!newImage.pot_color_id || !newImage.size || !newImage.file}>Upload & Link to Shopify</Button>
                                    </Box>
                                </BlockStack>
                            </Box>
                        </Card>

                        <Card padding="0">
                            <Box padding="400">
                                <InlineStack gap="200" align="start" blockAlign="center">
                                    <CameraIcon style={{ width: 20 }} />
                                    <Text variant="headingMd">Live Bundle Visuals</Text>
                                </InlineStack>
                            </Box>
                            <Divider />
                            <Box padding="400">
                                {images.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <ImageIcon style={{ width: 48, opacity: 0.1, margin: '0 auto 16px' }} />
                                        <Text tone="subdued">No bundle images uploaded for this product yet.</Text>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                        {images.map(img => (
                                            <Box key={img.id} background="bg-surface-secondary" borderRadius="300" borderStyle="solid" borderWidth="025" borderColor="border-subdued" padding="300">
                                                <BlockStack gap="300" align="center">
                                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <Thumbnail source={img.image_url} alt={`${img.color_name}`} size="large" />
                                                    </div>
                                                    <BlockStack gap="100" align="center">
                                                        <Text fontWeight="bold">{img.color_name}</Text>
                                                        <Badge size="small">{img.size}</Badge>
                                                    </BlockStack>
                                                    <Button variant="tertiary" tone="critical" onClick={() => handleDeleteImage(img.id)}>Delete</Button>
                                                </BlockStack>
                                            </Box>
                                        ))}
                                    </div>
                                )}
                            </Box>
                        </Card>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default Images;
