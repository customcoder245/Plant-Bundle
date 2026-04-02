import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Select, Badge, Text } from '@shopify/polaris';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(); }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try { const url = filter ? `/api/activity?event_type=${filter}&limit=100` : '/api/activity?limit=100'; const res = await fetch(url); setLogs(await res.json()); }
        catch (error) { console.error('Failed to fetch logs:', error); }
        finally { setLoading(false); }
    };

    const getBadgeTone = (eventType) => {
        if (eventType.includes('ERROR')) return 'critical';
        if (eventType.includes('DEDUCTED')) return 'warning';
        if (eventType.includes('RESTORED')) return 'success';
        if (eventType.includes('CREATED') || eventType.includes('UPLOADED')) return 'info';
        return undefined;
    };

    const rows = logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        <Badge tone={getBadgeTone(log.event_type)}>{log.event_type.replace(/_/g, ' ')}</Badge>,
        log.description || '-',
        log.metadata ? JSON.stringify(log.metadata).substring(0, 50) + '...' : '-'
    ]);

    const filterOptions = [
        { label: 'All Events', value: '' }, { label: 'Inventory Deducted', value: 'INVENTORY_DEDUCTED' }, { label: 'Inventory Restored', value: 'INVENTORY_RESTORED' },
        { label: 'Order Created', value: 'ORDER_CREATED' }, { label: 'Order Cancelled', value: 'ORDER_CANCELLED' }, { label: 'Pot Color Created', value: 'POT_COLOR_CREATED' },
        { label: 'Product Configured', value: 'PRODUCT_CONFIGURED' }, { label: 'Errors', value: 'WEBHOOK_ERROR' }
    ];

    return (
        <Page title="Activity Log">
            <Layout>
                <Layout.Section><Card><Select label="Filter by Event Type" options={filterOptions} value={filter} onChange={setFilter} /></Card></Layout.Section>
                <Layout.Section><Card><DataTable columnContentTypes={['text', 'text', 'text', 'text']} headings={['Time', 'Event', 'Description', 'Details']} rows={rows} loading={loading} />{logs.length === 0 && !loading && <Text tone="subdued">No activity logs found.</Text>}</Card></Layout.Section>
            </Layout>
        </Page>
    );
}

export default ActivityLog;
