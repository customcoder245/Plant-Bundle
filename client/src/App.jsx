import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Frame, Navigation } from '@shopify/polaris';
import { HomeIcon, ColorIcon, InventoryIcon, ProductIcon, ImageIcon, ClockIcon, SettingsIcon, PlusIcon } from '@shopify/polaris-icons';
import Dashboard from './pages/Dashboard';
import PotColors from './pages/PotColors';
import Inventory from './pages/Inventory';
import ProductConfig from './pages/ProductConfig';
import Images from './pages/Images';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import AddPlantProduct from './pages/AddPlantProduct';

function App() {
    const location = useLocation();

    const navigationMarkup = (
        <Navigation location={location.pathname}>
            <Navigation.Section
                items={[
                    { url: '/', label: 'Dashboard', icon: HomeIcon },
                    { url: '/add-product', label: 'Add Plant Product', icon: PlusIcon },
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
        <Frame navigation={navigationMarkup}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-product" element={<AddPlantProduct />} />
                <Route path="/pot-colors" element={<PotColors />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/products" element={<ProductConfig />} />
                <Route path="/images" element={<Images />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Frame>
    );
}

export default App;
