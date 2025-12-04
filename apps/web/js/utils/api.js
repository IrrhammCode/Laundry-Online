// API Utility - Centralized API URL configuration
export const getAPIURL = () => {
    // Try window variable first (set by HTML script tag)
    if (typeof window !== 'undefined' && window.VITE_API_URL) {
        return window.VITE_API_URL;
    }
    
    // Try Vite environment variable (if available)
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
    } catch (e) {
        // import.meta.env not available, continue to fallback
    }
    
    // Default fallback
    return 'http://localhost:3001/api';
};

export const getBaseURL = () => {
    const apiURL = getAPIURL();
    return apiURL.replace('/api', '');
};

