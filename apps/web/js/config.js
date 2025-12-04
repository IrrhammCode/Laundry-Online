// API Configuration
// Update this file untuk production deployment

export const API_CONFIG = {
    // Development
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    
    // Production - Update dengan backend URL production
    // baseURL: 'https://your-backend.railway.app/api',
    // baseURL: 'https://your-backend.onrender.com/api',
};

export default API_CONFIG;


