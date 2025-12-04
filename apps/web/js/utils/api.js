// API Utility - Centralized API URL configuration
export const getAPIURL = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

export const getBaseURL = () => {
    const apiURL = getAPIURL();
    return apiURL.replace('/api', '');
};

