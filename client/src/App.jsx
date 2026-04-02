import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Frame, Navigation } from '@shopify/polaris';
import { HomeIcon, ColorIcon, InventoryIcon, ProductIcon, ImageIcon, ClockIcon, SettingsIcon } from '@shopify/polaris-icons';
import Dashboard from './pages/Dashboard';
import PotColors from './pages/PotColors';
import Inventory from './pages/Inventory';
import ProductConfig from './pages/ProductConfig';
import Images from './pages/Images';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';

function App() {
    const navigationMarkup = (
        <Navigation location="/">
            <Navigation.Section
                items={[
                    { url: '/', label: 'Dashboard', icon: HomeIcon },
                    { url: '/pot-colors', label: 'Pot Colors', icon: ColorIcon },
                    { url: '/inventory', label: 'Pot Inventory', icon: InventoryIcon },
                    { url: '/products', label: 'Product Config', icon: ProductIcon },
                    { url: '/images', label: 'Images', icon: ImageIcon },
                    { url: '/activity', label: 'Activity Log', icon: ClockIcon },
                    { url: '/settings', label: 'Settings', icon: SettingsIcon },
                ]}
            />
        </Navigation>
    );

    return (
        <BrowserRouter>
            <Frame navigation={navigationMarkup}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pot-colors" element={<PotColors />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/products" element={<ProductConfig />} />
                    <Route path="/images" element={<Images />} />
                    <Route path="/activity" element={<ActivityLog />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Frame>
        </BrowserRouter>
    );
}

export default App;
