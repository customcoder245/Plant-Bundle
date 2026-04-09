import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link as ReactRouterLink } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import './index.css';
import App from './App';

const Link = ({ children, url, ...rest }) => {
    return (
        <ReactRouterLink to={url} {...rest}>
            {children}
        </ReactRouterLink>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppProvider linkComponent={Link}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AppProvider>
    </React.StrictMode>
);
