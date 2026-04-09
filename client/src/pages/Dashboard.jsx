import React, { useState, useEffect } from 'react';
import {
    Page,
    Layout,
    Text,
    BlockStack,
    InlineStack,
    Badge,
    SkeletonBodyText,
    Banner,
    CalloutCard,
    Grid,
    Box,
    Divider,
    EmptyState,
    List,
    Card
} from '@shopify/polaris';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Package,
    Settings,
    PlusCircle,
    ArrowRight,
    History,
    TrendingUp,
    Box as BoxIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, label, icon: Icon, color, delay }) => (
    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="premium-card"
        >
            <BlockStack gap="400">
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon size={24} />
                </div>
                <BlockStack gap="100">
                    <Text variant="headingSm" as="h3" tone="subdued">{title}</Text>
                    <div className="stat-value gradient-text">{value}</div>
                    <Text variant="bodySm" tone="subdued">{label}</Text>
                </BlockStack>
            </BlockStack>

            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                <Icon size={80} />
            </div>
        </motion.div>
    </Grid.Cell>
);

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

    if (loading) return (
        <Page title="Dashboard">
            <Layout>
                <Layout.Section><SkeletonBodyText lines={15} /></Layout.Section>
            </Layout>
        </Page>
    );

    return (
        <Page fullWidth>
            <BlockStack gap="600">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Box paddingBlockEnd="400">
                        <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="100">
                                <Text variant="heading2xl" as="h1">Dashboard Overview</Text>
                                <Text variant="bodyLg" tone="subdued">Real-time insights into your Plant + Pot bundle performance.</Text>
                            </BlockStack>
                            <Badge tone="success">System Online</Badge>
                        </InlineStack>
                    </Box>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Banner title="Sync Issue Detected" tone="critical" onDismiss={() => setError(false)}>
                                <p>We're having trouble reaching the local database. Please ensure your server is running.</p>
                            </Banner>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <CalloutCard
                        title="Start building your first bundle"
                        illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customize-checkout-concept-f139051d05e3751897c7b32d43f3d745a76da7d1ca86bc9ad25091763ef4991c.svg"
                        primaryAction={{
                            content: 'Create Bundle',
                            url: '/add-product',
                        }}
                    >
                        <p>Combine any plant with our custom pot colors to increase your average order value.</p>
                    </CalloutCard>
                </motion.div>

                <Grid>
                    <StatCard
                        title="Available Colors"
                        value={stats?.totalColors || 0}
                        label="Custom pot options"
                        icon={Palette}
                        color="#2b6cb0"
                        delay={0.2}
                    />
                    <StatCard
                        title="Pot Inventory"
                        value={stats?.totalPots || 0}
                        label={stats?.lowStockItems > 0 ? `${stats.lowStockItems} low stock alerts` : "Stock levels healthy"}
                        icon={BoxIcon}
                        color={stats?.lowStockItems > 0 ? "#c05621" : "#2f855a"}
                        delay={0.3}
                    />
                    <StatCard
                        title="Active Bundles"
                        value={stats?.configuredProducts || 0}
                        label="Configured in store"
                        icon={Package}
                        color="#6b46c1"
                        delay={0.4}
                    />
                </Grid>

                <Layout>
                    <Layout.Section variant="oneHalf">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card>
                                <Box padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between">
                                            <InlineStack gap="200">
                                                <History size={20} className="gradient-text" />
                                                <Text variant="headingMd" as="h2">Recent Activity</Text>
                                            </InlineStack>
                                            <TrendingUp size={16} tone="subdued" />
                                        </InlineStack>

                                        <Divider />

                                        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
                                            <EmptyState
                                                heading="No activity yet"
                                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                                            >
                                                <p>Your store activity will appear here once customers start browsing your bundles.</p>
                                            </EmptyState>
                                        ) : (
                                            <List type="bullet">
                                                {stats.recentActivity.slice(0, 5).map((item, index) => (
                                                    <List.Item key={index}>
                                                        <InlineStack align="space-between">
                                                            <Text fontWeight="semibold">{item.event_type.replace(/_/g, ' ')}</Text>
                                                            <Badge tone="info">{item.count} events</Badge>
                                                        </InlineStack>
                                                    </List.Item>
                                                ))}
                                            </List>
                                        )}
                                    </BlockStack>
                                </Box>
                            </Card>
                        </motion.div>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Card>
                                <Box padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack gap="200">
                                            <Settings size={20} className="gradient-text" />
                                            <Text variant="headingMd" as="h2">Quick Management</Text>
                                        </InlineStack>

                                        <Divider />

                                        <BlockStack gap="300">
                                            <Link to="/inventory" className="quick-action-btn">
                                                <BoxIcon size={20} />
                                                <span style={{ flex: 1 }}>Update Pot Inventory</span>
                                                <ArrowRight size={16} />
                                            </Link>
                                            <Link to="/products" className="quick-action-btn">
                                                <Package size={20} />
                                                <span style={{ flex: 1 }}>Review Configurations</span>
                                                <ArrowRight size={16} />
                                            </Link>
                                            <Link to="/settings" className="quick-action-btn">
                                                <Settings size={20} />
                                                <span style={{ flex: 1 }}>App Settings</span>
                                                <ArrowRight size={16} />
                                            </Link>
                                        </BlockStack>
                                    </BlockStack>
                                </Box>
                            </Card>
                        </motion.div>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}

export default Dashboard;
