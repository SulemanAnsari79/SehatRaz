import api from './Api';

const OrderService = {
  /**
   * Get all orders for the current user
   * @returns {Promise} - Response containing list of orders
   */
  getUserOrders: async () => {
    try {
      const response = await api.post('/api/order/userorders', {headers:{Authorization: `Bearer ${localStorage.getItem('token')}`}});
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user orders:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch orders';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Get a specific order by ID
   * @param {string} orderId - The order ID
   * @returns {Promise} - Response containing order details
   */
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/api/user/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order details:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch order details';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Create a new order
   * @param {object} orderData - Order data including items, address, payment method, etc.
   * @returns {Promise} - Response containing created order details
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/api/user/order', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Update order (for address or other details before payment)
   * @param {string} orderId - The order ID
   * @param {object} updateData - Data to update
   * @returns {Promise} - Response containing updated order
   */
  updateOrder: async (orderId, updateData) => {
    try {
      const response = await api.put(`/api/user/order/${orderId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update order:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update order';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Cancel an order
   * @param {string} orderId - The order ID
   * @param {string} reason - Reason for cancellation
   * @returns {Promise} - Response confirming cancellation
   */
  cancelOrder: async (orderId, reason = '') => {
    try {
      const response = await api.post(`/api/user/order/${orderId}/cancel`, { reason }, {headers:{Authorization: `Bearer ${localStorage.getItem('token')}`}});
      return response.data;
    } catch (error) {
      console.error('Failed to cancel order:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel order';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Get order status
   * @param {string} orderId - The order ID
   * @returns {Promise} - Response containing current order status
   */
  getOrderStatus: async (orderId) => {
    try {
      const response = await api.get(`/api/user/order/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order status:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch order status';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Apply coupon or discount to an order
   * @param {string} orderId - The order ID
   * @param {string} couponCode - Coupon code
   * @returns {Promise} - Response with updated order total
   */
  applyCoupon: async (orderId, couponCode) => {
    try {
      const response = await api.post(`/api/user/order/${orderId}/apply-coupon`, { couponCode });
      return response.data;
    } catch (error) {
      console.error('Failed to apply coupon:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply coupon';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Process payment for an order
   * @param {string} orderId - The order ID
   * @param {object} paymentData - Payment details (method, razorpay_id, etc.)
   * @returns {Promise} - Response confirming payment
   */
  processPayment: async (orderId, paymentData) => {
    try {
      const response = await api.post(`/api/user/order/${orderId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Failed to process payment:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process payment';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Track order shipment
   * @param {string} orderId - The order ID
   * @returns {Promise} - Response containing tracking information
   */
  trackOrder: async (orderId) => {
    try {
      const response = await api.get(`/api/user/order/${orderId}/track`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tracking info:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tracking info';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Request return/refund for an order
   * @param {string} orderId - The order ID
   * @param {string} reason - Reason for return
   * @returns {Promise} - Response confirming return request
   */
  requestReturn: async (orderId, reason) => {
    try {
      const response = await api.post(`/api/user/order/${orderId}/return`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to request return:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to request return';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Get return/refund status
   * @param {string} orderId - The order ID
   * @returns {Promise} - Response containing return status
   */
  getReturnStatus: async (orderId) => {
    try {
      const response = await api.get(`/api/user/order/${orderId}/return-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch return status:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch return status';
      throw { message: errorMessage, ...error.response?.data };
    }
  },

  /**
   * Download invoice for an order
   * @param {string} orderId - The order ID
   * @returns {Promise} - Response containing invoice URL or file
   */
  downloadInvoice: async (orderId) => {
    try {
      const response = await api.get(`/api/user/order/${orderId}/invoice`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download invoice:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download invoice';
      throw { message: errorMessage, ...error.response?.data };
    }
  },
};

export default OrderService;
