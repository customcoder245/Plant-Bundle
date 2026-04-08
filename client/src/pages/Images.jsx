import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Thumbnail, Button, Select, TextField, EmptyState } from '@shopify/polaris';

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
        try {
            const [configsRes, colorsRes] = await Promise.all([fetch('/api/product-config'), fetch('/api/pots/colors')]);
            const configsData = await configsRes.json(); const colorsData = await colorsRes.json();
            setConfigs(Array.isArray(configsData) ? configsData : []); setColors(Array.isArray(colorsData) ? colorsData : []);
            if (configsData.length > 0) setSelectedProduct(configsData[0].id.toString());
        } catch (error) { console.error('Failed to fetch data:', error); }
        finally { setLoading(false); }
    };

    const fetchImages = async (productConfigId) => { try { const res = await fetch(`/api/images/product/${productConfigId}`); setImages(await res.json()); } catch (error) { console.error('Failed to fetch images:', error); } };

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

    const handleDeleteImage = async (id) => { if (!confirm('Delete this image?')) return; try { await fetch(`/api/images/${id}`, { method: 'DELETE' }); fetchImages(selectedProduct); } catch (error) { console.error('Failed to delete image:', error); } };

    const productOptions = configs.map(c => ({ label: c.product_title || `Product #${c.shopify_product_id}`, value: c.id.toString() }));
    const colorOptions = [{ label: 'Select color...', value: '' }, ...colors.map(c => ({ label: c.name, value: c.id.toString() }))];
    const sizeOptions = [{ label: 'Select size...', value: '' }, { label: 'Small', value: 'Small' }, { label: 'Medium', value: 'Medium' }, { label: 'Large', value: 'Large' }, { label: 'Extra Large', value: 'Extra Large' }];

    if (configs.length === 0 && !loading) return <Page title="Composite Images"><EmptyState heading="No products configured" action={{ content: 'Configure Products', url: '/products' }}><p>Configure products first.</p></EmptyState></Page>;

    return (
        <Page title="Composite Images">
            <Layout>
                <Layout.Section><Card><BlockStack gap="400"><Select label="Select Product" options={productOptions} value={selectedProduct} onChange={setSelectedProduct} /></BlockStack></Card></Layout.Section>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">Upload New Image</Text>
                    <InlineStack gap="400" align="end">
                        <Select label="Pot Color" options={colorOptions} value={newImage.pot_color_id} onChange={(value) => setNewImage({ ...newImage, pot_color_id: value })} />
                        <Select label="Size" options={sizeOptions} value={newImage.size} onChange={(value) => setNewImage({ ...newImage, size: value })} />
                        <div style={{ flex: 1 }}>
                            <Text variant="bodySm">Select File</Text>
                            <input type="file" accept="image/*" onChange={(e) => setNewImage({ ...newImage, file: e.target.files[0] })} style={{ marginTop: '4px' }} />
                        </div>
                        <Button variant="primary" onClick={handleAddImage} loading={uploading} disabled={!newImage.pot_color_id || !newImage.size || !newImage.file}>Upload to Shopify</Button>
                    </InlineStack>
                </BlockStack></Card></Layout.Section>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">Live Shopify Images</Text>
                    {images.length === 0 ? <Text tone="subdued">No images uploaded for this product yet.</Text> : (
                        <InlineStack gap="400" wrap>
                            {images.map(img => (<Card key={img.id}><BlockStack gap="200"><Thumbnail source={img.image_url} alt={`${img.color_name} ${img.size}`} size="large" /><Text>{img.color_name} - {img.size}</Text><Button size="slim" tone="critical" onClick={() => handleDeleteImage(img.id)}>Delete</Button></BlockStack></Card>))}
                        </InlineStack>
                    )}
                </BlockStack></Card></Layout.Section>
            </Layout>
        </Page>
    );
}

export default Images;
