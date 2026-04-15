import React, { useState, useEffect } from 'react';
import {
    Page, Layout, Card, ResourceList, ResourceItem,
    Select, Badge, Text, BlockStack, InlineStack,
    Box, Divider, EmptyState, Icon, Banner
} from '@shopify/polaris';
import { History, Filter, Info, AlertOctagon, TrendingUp, TrendingDown } from 'lucide-react';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(); }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const url = filter ? `/api/activity?event_type=${filter}&limit=100` : '/api/activity?limit=100';
            const res = await fetch(url);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventStyling = (eventType) => {
        const type = eventType.toLowerCase();
        if (type.includes('error')) return { tone: 'critical', icon: AlertOctagon };
        if (type.includes('deducted')) return { tone: 'warning', icon: TrendingDown };
        if (type.includes('restored')) return { tone: 'success', icon: TrendingUp };
        if (type.includes('created') || type.includes('uploaded')) return { tone: 'info', icon: Info };
        return { tone: 'default', icon: History };
    };

    const filterOptions = [
        { label: 'All Events', value: '' },
        { label: 'Inventory Deducted', value: 'INVENTORY_DEDUCTED' },
        { label: 'Inventory Restored', value: 'INVENTORY_RESTORED' },
        { label: 'Order Created', value: 'ORDER_CREATED' },
        { label: 'Order Cancelled', value: 'ORDER_CANCELLED' },
        { label: 'Pot Color Created', value: 'POT_COLOR_CREATED' },
        { label: 'Product Configured', value: 'PRODUCT_CONFIGURED' },
        { label: 'Errors', value: 'WEBHOOK_ERROR' }
    ];

    return (
        <Page title="Store Activity" subtitle="Real-time timeline of store events and inventory changes.">
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        <Card padding="0">
                            <Box padding="400">
                                <InlineStack align="space-between" blockAlign="center">
                                    <InlineStack gap="200">
                                        <Filter size={18} color="#636363" />
                                        <Text variant="headingMd">Event Filtering</Text>
                                    </InlineStack>
                                    <div style={{ width: '250px' }}>
                                        <Select
                                            label="Show event type:"
                                            labelHidden
                                            options={filterOptions}
                                            value={filter}
                                            onChange={setFilter}
                                        />
                                    </div>
                                </InlineStack>
                            </Box>
                            <Divider />

                            <ResourceList
                                loading={loading}
                                resourceName={{ singular: 'log', plural: 'logs' }}
                                items={logs}
                                renderItem={(log) => {
                                    const { tone, icon: EventIcon } = getEventStyling(log.event_type);
                                    const date = new Date(log.created_at);

                                    return (
                                        <ResourceItem id={log.id.toString()}>
                                            <InlineStack align="space-between" blockAlign="center">
                                                <InlineStack gap="400" blockAlign="center">
                                                    <div style={{
                                                        width: 36, height: 36,
                                                        borderRadius: '50%',
                                                        backgroundColor: tone === 'default' ? '#f4f4f4' : `var(--p-color-bg-surface-${tone})`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: `var(--p-color-text-${tone})`
                                                    }}>
                                                        <EventIcon size={18} />
                                                    </div>
                                                    <BlockStack gap="050">
                                                        <Text variant="bodyMd" fontWeight="semibold">
                                                            {log.event_type.replace(/_/g, ' ')}
                                                        </Text>
                                                        <Text tone="subdued" variant="bodySm">{log.description}</Text>
                                                    </BlockStack>
                                                </InlineStack>

                                                <BlockStack align="end" gap="100">
                                                    <Text variant="bodySm" tone="subdued">{date.toLocaleTimeString()} • {date.toLocaleDateString()}</Text>
                                                    {log.metadata && (
                                                        <Badge tone={tone} size="small">
                                                            Details: {Object.keys(log.metadata).length} tags
                                                        </Badge>
                                                    )}
                                                </BlockStack>
                                            </InlineStack>
                                        </ResourceItem>
                                    );
                                }}
                                emptyState={(
                                    <EmptyState
                                        heading="No log data found"
                                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                                    >
                                        <p>Activities will appear here once you start configuring products or receiving orders.</p>
                                    </EmptyState>
                                )}
                            />
                        </Card>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default ActivityLog;
