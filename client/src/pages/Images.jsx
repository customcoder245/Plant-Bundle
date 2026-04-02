import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Thumbnail, Button, Select, TextField, EmptyState } from '@shopify/polaris';

function Images() {
    const [configs, setConfigs] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [images, setImages] = useState([]);
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newImage, setNewImage] = useState({ pot_color_id: '', size: '', image_url: '' });

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (selectedProduct) fetchImages(selectedProduct); }, [selectedProduct]);

    const fetchData = async () => {
        try {
            const [configsRes, colorsRes] = await Promise.all([fetch('/api/product-config'), fetch('/api/pots/colors')]);
            const configsData = await configsRes.json(); const colorsData = await colorsRes.json();
            setConfigs(configsData); setColors(colorsData);
            if (configsData.length > 0) setSelectedProduct(configsData[0].id.toString());
        } catch (error) { console.error('Failed to fetch data:', error); }
        finally { setLoading(false); }
    };

    const fetchImages = async (productConfigId) => { try { const res = await fetch(`/api/images/product/${productConfigId}`); setImages(await res.json()); } catch (error) { console.error('Failed to fetch images:', error); } };

    const handleAddImage = async () => {
        try {
            await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_config_id: parseInt(selectedProduct), pot_color_id: parseInt(newImage.pot_color_id), size: newImage.size, image_url: newImage.image_url }) });
            setNewImage({ pot_color_id: '', size: '', image_url: '' }); fetchImages(selectedProduct);
        } catch (error) { console.error('Failed to add image:', error); }
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
                    <Text variant="headingMd">Add New Image</Text>
                    <InlineStack gap="200" align="end">
                        <Select label="Pot Color" options={colorOptions} value={newImage.pot_color_id} onChange={(value) => setNewImage({ ...newImage, pot_color_id: value })} />
                        <Select label="Size" options={sizeOptions} value={newImage.size} onChange={(value) => setNewImage({ ...newImage, size: value })} />
                        <TextField label="Image URL" value={newImage.image_url} onChange={(value) => setNewImage({ ...newImage, image_url: value })} autoComplete="off" />
                        <Button primary onClick={handleAddImage} disabled={!newImage.pot_color_id || !newImage.size || !newImage.image_url}>Add Image</Button>
                    </InlineStack>
                </BlockStack></Card></Layout.Section>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">Uploaded Images</Text>
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
