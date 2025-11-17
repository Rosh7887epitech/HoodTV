import axios from 'axios';

const API_URL = 'http://localhost:8000';

const authService = {
  register: async (name, password = null, age = null) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        password,
        age
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({ name }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de l\'inscription';
    }
  },

  login: async (name, password = null) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        name,
        password
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la connexion';
    }
  },

  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data.users;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la récupération des utilisateurs';
    }
  },

  updateUser: async (id, data) => {
    try {
      const token = authService.getToken();
      const response = await axios.put(`${API_URL}/users/${id}`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la mise à jour de l\'utilisateur';
    }
  },

  deleteUser: async (id) => {
    try {
      const token = authService.getToken();
      const response = await axios.delete(`${API_URL}/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la suppression de l\'utilisateur';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  verifyToken: async () => {
    try {
      const token = authService.getToken();
      if (!token) return false;

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return true;
      }
      return false;
    } catch (error) {
      authService.logout();
      return false;
    }
  }
};

export default authService;
