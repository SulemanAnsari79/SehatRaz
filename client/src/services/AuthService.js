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
   * Register a doctor with additional fields
   * @param {string} name - Doctor's full name
   * @param {string} email - Doctor's email
   * @param {string} password - Doctor's password
   * @param {string} phone - Doctor's phone number
   * @param {string} specialization - Doctor's specialization
   * @param {number} experience - Doctor's years of experience
   * @param {string} qualifications - Doctor's qualifications
   * @returns {Promise} - Response from server
   */
  doctorRegister: async (name, email, password, phone, specialization, experience, qualifications) => {
    try {
      const response = await api.post('/api/doctor/register', {
        name,
        email,
        password,
        phone,
        specialization,
        experience,
        qualifications,
      });
      return response.data;
    } catch (error) {
      console.error('Doctor register error response:', error.response?.data);
      console.error('Doctor register error status:', error.response?.status);
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
      const response = await api.post(`/api/${role}/login`, { email, password});

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
      const response = await api.get('/api/user/profile', {headers:{Authorization: `Bearer ${localStorage.getItem('token')}`}});
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user';
      throw { message: errorMessage };
    }
  },
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/user/update-profile', profileData, {headers:{Authorization: `Bearer ${localStorage.getItem('token')}`}});
      return response.data;
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      throw { message: errorMessage };
    }
  },
  
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post('/api/user/upload-profile-image', formData, {headers: {'Content-Type': 'multipart/form-data',Authorization: `Bearer ${localStorage.getItem('token')}`}});
      return response.data;
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
      throw { message: errorMessage };
    }
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} - Response from server
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/api/user/change-password', 
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      throw { message: errorMessage };
    }
  },

  /**
   * Delete user account
   * @param {string} password - User password for verification
   * @returns {Promise} - Response from server
   */
  deleteAccount: async (password) => {
    try {
      const response = await api.delete('/api/user/delete-account', {headers: { Authorization: `Bearer ${localStorage.getItem('token')}`},data: { password }});
      // Clear local storage after successful deletion
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return response.data;
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account';
      throw { message: errorMessage };
    }
  },

  sendForgotPasswordOtp: async (email) => {
    try {
      const response = await api.post('/api/user/forgot-password/send-otp', { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP';
      throw { message: errorMessage };
    }
  },

  verifyForgotPasswordOtp: async (email, otp) => {
    try {
      const response = await api.post('/api/user/forgot-password/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify OTP';
      throw { message: errorMessage };
    }
  },

  resetPasswordWithOtp: async (email, newPassword) => {
    try {
      const response = await api.post('/api/user/forgot-password/reset-password', { email, newPassword });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password';
      throw { message: errorMessage };
    }
  }
};

export default AuthService;
