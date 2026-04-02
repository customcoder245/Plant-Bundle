import React from 'react';
import { Page, Layout, Card, Text, BlockStack, List } from '@shopify/polaris';

function Settings() {
    return (
        <Page title="Settings">
            <Layout>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">Webhook Configuration</Text>
                    <Text>Register these webhooks in your Shopify admin:</Text>
                    <List>
                        <List.Item><strong>orders/create</strong> - {window.location.origin}/webhooks/orders/create</List.Item>
                        <List.Item><strong>orders/cancelled</strong> - {window.location.origin}/webhooks/orders/cancelled</List.Item>
                        <List.Item><strong>orders/refunded</strong> - {window.location.origin}/webhooks/orders/refunded</List.Item>
                    </List>
                </BlockStack></Card></Layout.Section>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">Theme Integration</Text>
                    <Text>Add the pot selector to your product pages using the theme extension code.</Text>
                </BlockStack></Card></Layout.Section>
                <Layout.Section><Card><BlockStack gap="400">
                    <Text variant="headingMd">API Endpoints</Text>
                    <List>
                        <List.Item>GET /api/pots/colors - List all pot colors</List.Item>
                        <List.Item>GET /api/inventory - List all inventory</List.Item>
                        <List.Item>GET /api/product-config/:shopifyProductId - Get product config</List.Item>
                        <List.Item>GET /api/images/product/:configId - Get composite images</List.Item>
                    </List>
                </BlockStack></Card></Layout.Section>
            </Layout>
        </Page>
    );
}

export default Settings;
