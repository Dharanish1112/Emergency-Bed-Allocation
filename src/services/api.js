// API Service for Backend Integration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://emergency-bed-backend.onrender.com' // Your backend Render URL
  : 'http://localhost:5001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (this.getToken()) {
      config.headers.Authorization = `Bearer ${this.getToken()}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      this.setToken(data.token);
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  }

  async register(userData) {
    return await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyToken() {
    return await this.request('/api/auth/verify');
  }

  // Hospital methods
  async getHospitals(location = '') {
    const params = location ? `?location=${location}` : '';
    return await this.request(`/api/hospitals${params}`);
  }

  async getHospital(id) {
    return await this.request(`/api/hospitals/${id}`);
  }

  async updateHospitalBeds(id, bedTypes) {
    return await this.request(`/api/hospitals/${id}/beds`, {
      method: 'PUT',
      body: JSON.stringify({ bedTypes }),
    });
  }

  async getUniqueLocations() {
    return await this.request('/api/hospitals/locations/unique');
  }

  // Request methods
  async getRequests(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/api/requests?${params}`);
  }

  async getHospitalRequests(hospitalId) {
    return await this.request(`/api/requests/hospital/${hospitalId}`);
  }

  async getDriverRequests(driverId) {
    return await this.request(`/api/requests/driver/${driverId}`);
  }

  async createRequest(requestData) {
    return await this.request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequestStatus(bookingId, status) {
    return await this.request(`/api/requests/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getRequest(bookingId) {
    return await this.request(`/api/requests/${bookingId}`);
  }

  async deleteRequest(bookingId) {
    return await this.request(`/api/requests/${bookingId}`, {
      method: 'DELETE',
    });
  }

  async getRequestStats() {
    return await this.request('/api/requests/stats/summary');
  }

  // User methods
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/api/users?${params}`);
  }

  async getUser(id) {
    return await this.request(`/api/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUsersByRole(role) {
    return await this.request(`/api/users/role/${role}`);
  }

  // Health check
  async healthCheck() {
    return await this.request('/api/health');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
