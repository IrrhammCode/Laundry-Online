// Authentication Service
export class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            // Handle rate limiting
            if (response.status === 429) {
                // Try to reset rate limit and retry once
                try {
                    await fetch('http://localhost:3001/api/reset-rate-limit', { method: 'POST' });
                    console.log('Rate limit reset, retrying login...');
                    // Retry the login request
                    const retryResponse = await fetch(`${this.baseURL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email, password })
                    });
                    
                    if (retryResponse.ok) {
                        const retryResult = await retryResponse.json();
                        return retryResult;
                    }
                } catch (resetError) {
                    console.log('Could not reset rate limit:', resetError);
                }
                throw new Error('Too many requests. Please wait a moment and try again.');
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            // Handle rate limiting
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for getCurrentUser');
            }
            
            const response = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                return result.data.user;
            } else if (response.status === 401) {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    console.log('Using localStorage fallback for user info');
                    return JSON.parse(userInfo);
                }
                return null;
            } else {
                throw new Error('Not authenticated');
            }
        } catch (error) {
            console.error('Get current user error:', error);
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                console.log('Using localStorage fallback for user info');
                return JSON.parse(userInfo);
            }
            return null;
        }
    }

    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.baseURL}/auth/forgot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    async resetPassword(token, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }
}


