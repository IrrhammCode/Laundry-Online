// API Configuration
// Update this file untuk production deployment

// Safe way to get environment variable
const getAPIURL = () => {
    try {
        // Try Vite environment variable first (if available)
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
    } catch (e) {
        // import.meta.env not available, continue to fallback
    }
    
    // Try window variable (set by HTML script tag)
    if (typeof window !== 'undefined' && window.VITE_API_URL) {
        return window.VITE_API_URL;
    }
    
    // Default fallback
    return 'http://localhost:3001/api';
};

export const API_CONFIG = {
    baseURL: getAPIURL(),
};

export default API_CONFIG;


