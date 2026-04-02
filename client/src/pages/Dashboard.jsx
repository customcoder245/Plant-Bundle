import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, SkeletonBodyText } from '@shopify/polaris';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const [inventoryRes, colorsRes, configRes, activityRes] = await Promise.all([
                fetch('/api/inventory'), fetch('/api/pots/colors'), fetch('/api/product-config'), fetch('/api/activity/stats')
            ]);
            const inventory = await inventoryRes.json();
            const colors = await colorsRes.json();
            const configs = await configRes.json();
            const activity = await activityRes.json();
            const lowStock = inventory.filter(i => i.is_low_stock).length;
            const totalPots = inventory.reduce((sum, i) => sum + i.quantity, 0);
            setStats({ totalColors: colors.length, totalPots, lowStockItems: lowStock, configuredProducts: configs.length, recentActivity: activity });
        } catch (error) { console.error('Failed to fetch stats:', error); }
        finally { setLoading(false); }
    };

    if (loading) return <Page title="Dashboard"><Layout><Layout.Section><Card><SkeletonBodyText lines={5} /></Card></Layout.Section></Layout></Page>;

    return (
        <Page title="Plant + Pot Bundle Manager">
            <Layout>
                <Layout.Section oneThird>
                    <Card><BlockStack gap="200"><Text variant="headingMd">Pot Colors</Text><Text variant="heading2xl">{stats?.totalColors || 0}</Text><Text tone="subdued">Active colors available</Text></BlockStack></Card>
                </Layout.Section>
                <Layout.Section oneThird>
                    <Card><BlockStack gap="200"><Text variant="headingMd">Total Pot Inventory</Text><Text variant="heading2xl">{stats?.totalPots || 0}</Text><InlineStack gap="200">{stats?.lowStockItems > 0 && <Badge tone="warning">{stats.lowStockItems} low stock</Badge>}</InlineStack></BlockStack></Card>
                </Layout.Section>
                <Layout.Section oneThird>
                    <Card><BlockStack gap="200"><Text variant="headingMd">Configured Products</Text><Text variant="heading2xl">{stats?.configuredProducts || 0}</Text><Text tone="subdued">Products using pot bundles</Text></BlockStack></Card>
                </Layout.Section>
                <Layout.Section>
                    <Card><BlockStack gap="400"><Text variant="headingMd">Recent Activity (7 days)</Text>{stats?.recentActivity?.map((item, index) => (<InlineStack key={index} align="space-between"><Text>{item.event_type.replace(/_/g, ' ')}</Text><Badge>{item.count} events</Badge></InlineStack>))}{(!stats?.recentActivity || stats.recentActivity.length === 0) && <Text tone="subdued">No recent activity</Text>}</BlockStack></Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default Dashboard;
