import React, { useState, useEffect } from 'react';
import { Page, Layout, Text, BlockStack, InlineStack, Badge, SkeletonBodyText, Banner } from '@shopify/polaris';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Package,
    Settings,
    PlusCircle,
    ArrowRight,
    History,
    AlertCircle,
    TrendingUp,
    Box
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, label, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="premium-card"
    >
        <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={24} />
        </div>
        <Text variant="headingSm" as="h3" tone="subdued">{title}</Text>
        <div className="stat-value gradient-text">{value.toLocaleString()}</div>
        <Text variant="bodySm" tone="subdued">{label}</Text>

        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
            <Icon size={80} />
        </div>
    </motion.div>
);

const QuickAction = ({ title, icon: Icon, to, delay, primary }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <Link to={to} className="quick-action-btn" style={primary ? { background: 'var(--primary)', color: 'white' } : {}}>
            <Icon size={20} />
            <span style={{ flex: 1 }}>{title}</span>
            <ArrowRight size={16} />
        </Link>
    </motion.div>
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
                <Layout.Section><SkeletonBodyText lines={10} /></Layout.Section>
            </Layout>
        </Page>
    );

    return (
        <Page fullWidth>
            <div className="dashboard-container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '2rem' }}
                >
                    <BlockStack gap="200">
                        <Text variant="heading2xl" as="h1">Welcome back!</Text>
                        <Text variant="bodyLg" tone="subdued">Manage your Plant + Pot bundles and inventory with ease.</Text>
                    </BlockStack>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginBottom: '2rem' }}
                        >
                            <Banner title="Connection Warning" tone="warning" onDismiss={() => setError(false)}>
                                <p>There was an issue connecting to the backend. Please check your Shopify API credentials in the Settings.</p>
                            </Banner>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <StatCard
                        title="Available Colors"
                        value={stats?.totalColors || 0}
                        label="Custom pot options"
                        icon={Palette}
                        color="#2b6cb0"
                        delay={0.1}
                    />
                    <StatCard
                        title="Total Pot Inventory"
                        value={stats?.totalPots || 0}
                        label={stats?.lowStockItems > 0 ? `${stats.lowStockItems} low stock alerts` : "Stock levels healthy"}
                        icon={Box}
                        color={stats?.lowStockItems > 0 ? "#c05621" : "#2f855a"}
                        delay={0.2}
                    />
                    <StatCard
                        title="Configured Bundles"
                        value={stats?.configuredProducts || 0}
                        label="Active store pairings"
                        icon={Package}
                        color="#6b46c1"
                        delay={0.3}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="premium-card"
                    >
                        <BlockStack gap="500">
                            <InlineStack align="space-between">
                                <InlineStack gap="200">
                                    <History size={20} className="gradient-text" />
                                    <Text variant="headingMd" as="h2">Recent Activity</Text>
                                </InlineStack>
                                <TrendingUp size={16} tone="subdued" />
                            </InlineStack>

                            <div className="activity-list">
                                {stats?.recentActivity?.slice(0, 5).map((item, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-point" />
                                        <div style={{ flex: 1 }}>
                                            <InlineStack align="space-between">
                                                <Text variant="bodyMd" fontWeight="semibold">{item.event_type.replace(/_/g, ' ')}</Text>
                                                <Badge tone="info">{item.count}</Badge>
                                            </InlineStack>
                                            <Text variant="bodySm" tone="subdued">Generated from recent store events</Text>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <AlertCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                        <Text tone="subdued">No recent activity recorded.</Text>
                                    </div>
                                )}
                            </div>
                        </BlockStack>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="premium-card"
                    >
                        <BlockStack gap="500">
                            <InlineStack gap="200">
                                <Settings size={20} className="gradient-text" />
                                <Text variant="headingMd" as="h2">Quick Actions</Text>
                            </InlineStack>

                            <BlockStack gap="300">
                                <QuickAction
                                    title="Add New Bundle"
                                    icon={PlusCircle}
                                    to="/add-product"
                                    primary
                                    delay={0.6}
                                />
                                <QuickAction
                                    title="Manage Inventory"
                                    icon={Box}
                                    to="/inventory"
                                    delay={0.7}
                                />
                                <QuickAction
                                    title="View Configurations"
                                    icon={Package}
                                    to="/products"
                                    delay={0.8}
                                />
                                <QuickAction
                                    title="App Settings"
                                    icon={Settings}
                                    to="/settings"
                                    delay={0.9}
                                />
                            </BlockStack>
                        </BlockStack>
                    </motion.div>
                </div>
            </div>
        </Page>
    );
}

export default Dashboard;
