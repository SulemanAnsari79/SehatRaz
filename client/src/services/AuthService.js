import api from './Api';

const AuthService = {
  /**
   * Register a new user
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User role (user, doctor, admin)
   * @returns {Promise} - Response from server
   */
  register: async (name, email, password, role) => {
    try {
      const response = await api.post(`/api/${role}/register`, {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Register error response:', error.response?.data);
      console.error('Register error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Login a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User role (user, doctor, admin)
   * @returns {Promise} - Response containing user data and token
   */
  login: async (email, password, role) => {
    try {
      console.log('Attempting login with:', { email, role });
      
      const response = await api.post(`/api/${role}/login`, {
        email,
        password,
      });

      console.log('Login response:', response.data);

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Login error response:', error.response?.data);
      console.error('Login error status:', error.response?.status);
      console.error('Login error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Logout user
   * @returns {Promise} - Response from server
   */
  logout: async () => {
    try {
      const response = await api.post('/api/user/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      // Even if request fails, clear local data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
      throw { message: errorMessage };
    }
  },

  /**
   * Get current user from token (optional - if backend supports)
   * @returns {Promise} - Current user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/user/profile');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user';
      throw { message: errorMessage };
    }
  },
};

export default AuthService;
