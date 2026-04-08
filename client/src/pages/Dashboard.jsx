import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, SkeletonBodyText, Button } from '@shopify/polaris';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const [inventoryRes, colorsRes, configRes, activityRes] = await Promise.all([
                fetch('/api/inventory'), fetch('/api/pots/colors'), fetch('/api/product-config'), fetch('/api/activity/stats')
            ]);

            if (!inventoryRes.ok || !colorsRes.ok || !configRes.ok) throw new Error('API Error');

            const inventory = await inventoryRes.json();
            const colors = await colorsRes.json();
            const configs = await configRes.json();
            const activity = await activityRes.json();

            const lowStock = inventory.filter(i => i.is_low_stock).length;
            const totalPots = inventory.reduce((sum, i) => sum + i.quantity, 0);

            setStats({
                totalColors: colors.length,
                totalPots,
                lowStockItems: lowStock,
                configuredProducts: configs.length,
                recentActivity: activity
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Page title="Dashboard"><Layout><Layout.Section><Card><SkeletonBodyText lines={5} /></Card></Layout.Section></Layout></Page>;

    return (
        <Page title="Plant + Pot Bundle Manager">
            <Layout>
                {error && (
                    <Layout.Section>
                        <Card background="bg-surface-warning">
                            <BlockStack gap="200">
                                <Text variant="headingMd" tone="warning">Connection Warning</Text>
                                <Text>There was an issue connecting to the backend. Please check your Shopify API credentials in the Settings.</Text>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                )}
                <Layout.Section oneThird>
                    <Card roundedAbove="sm">
                        <BlockStack gap="200">
                            <Text variant="headingMd" as="h2">Pot Colors</Text>
                            <Text variant="heading2xl" as="p">{stats?.totalColors || 0}</Text>
                            <Text tone="subdued" as="p">Active colors available</Text>
                        </BlockStack>
                    </Card>
                </Layout.Section>
                <Layout.Section oneThird>
                    <Card roundedAbove="sm">
                        <BlockStack gap="200">
                            <Text variant="headingMd" as="h2">Total Pot Inventory</Text>
                            <Text variant="heading2xl" as="p">{stats?.totalPots || 0}</Text>
                            <InlineStack gap="200">
                                {stats?.lowStockItems > 0 ? (
                                    <Badge tone="warning">{stats.lowStockItems} low stock alerts</Badge>
                                ) : (
                                    <Badge tone="success">Stock Healthy</Badge>
                                )}
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
                <Layout.Section oneThird>
                    <Card roundedAbove="sm">
                        <BlockStack gap="200">
                            <Text variant="headingMd" as="h2">Bundled Products</Text>
                            <Text variant="heading2xl" as="p">{stats?.configuredProducts || 0}</Text>
                            <Text tone="subdued" as="p">Products with pot selection</Text>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                    <Card title="Recent Activity">
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Activity Log (7 days)</Text>
                            <BlockStack gap="200">
                                {stats?.recentActivity?.slice(0, 5).map((item, index) => (
                                    <InlineStack key={index} align="space-between">
                                        <Text variant="bodyMd">{item.event_type.replace(/_/g, ' ')}</Text>
                                        <Badge tone="info">{item.count}</Badge>
                                    </InlineStack>
                                ))}
                                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                                    <Text tone="subdued">No recent activity recorded.</Text>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Quick Actions</Text>
                            <BlockStack gap="200">
                                <Button url="/add-product" variant="primary">Create New Plant + Pot Bundle</Button>
                                <Button url="/inventory">Manage Pot Stock</Button>
                                <Button url="/products">Review Configurations</Button>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default Dashboard;
