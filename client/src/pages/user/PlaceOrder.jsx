import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OrderService from "../../services/OrderService.js";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";

const PlaceOrder = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [replaceReason, setReplaceReason] = useState('');

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setError(null);
      const response = await OrderService.getUserOrders();
      if (response.success) {
        setOrders(response.orders || []);
      } else {
        setError(response.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError(error.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Check if can cancel order
  const canCancelOrder = (order) => {
    return ['Pending', 'Processing'].includes(order.status);
  };

  // Check if can return/replace order
  const canReturnOrReplace = (order) => {
    if (order.status !== 'Delivered') return false;
    const referenceDate = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!referenceDate) return false;

    const deliveredDate = new Date(referenceDate);
    const currentDate = new Date();
    const daysDifference = (currentDate - deliveredDate) / (1000 * 60 * 60 * 24);
    
    return daysDifference <= 7;
  };

  // Get remaining days for return/replace
  const getRemainingDays = (order) => {
    const referenceDate = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!referenceDate) return 0;

    const deliveredDate = new Date(referenceDate);
    const returnDeadline = new Date(deliveredDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const currentDate = new Date();
    const remainingTime = returnDeadline - currentDate;
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
  };


  // Handle cancel order
  const handleCancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    try {
      setActionLoading({ ...actionLoading, [orderId]: true });
      const response = await OrderService.cancelOrder(orderId, cancelReason);
      
      if (response.success) {
        setSuccessMessage('Order cancelled successfully');
        setCancelReason('');
        setShowCancelModal(null);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      alert(error.message || 'Failed to cancel order');
    } finally {
      setActionLoading({ ...actionLoading, [orderId]: false });
    }
  };

  // Handle return request
  const handleReturnRequest = async (orderId) => {
    if (!returnReason.trim()) {
      alert('Please provide a reason for return');
      return;
    }
    
    try {
      setActionLoading({ ...actionLoading, [orderId]: true });
      const response = await OrderService.requestReturn(orderId, returnReason);
      
      if (response.success) {
        setSuccessMessage('Return request submitted successfully');
        setReturnReason('');
        setShowReturnModal(null);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert(response.message || 'Failed to submit return request');
      }
    } catch (error) {
      alert(error.message || 'Failed to submit return request');
    } finally {
      setActionLoading({ ...actionLoading, [orderId]: false });
    }
  };

  // Handle replace request
  const handleReplaceRequest = async (orderId) => {
    if (!replaceReason.trim()) {
      alert('Please provide a reason for replacement');
      return;
    }
    
    try {
      setActionLoading({ ...actionLoading, [orderId]: true });
      const response = await OrderService.requestReplace(orderId, replaceReason);
      
      if (response.success) {
        setSuccessMessage('Replacement request submitted successfully');
        setReplaceReason('');
        setShowReplaceModal(null);
        fetchOrders();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert(response.message || 'Failed to submit replacement request');
      }
    } catch (error) {
      alert(error.message || 'Failed to submit replacement request');
    } finally {
      setActionLoading({ ...actionLoading, [orderId]: false });
    }
  };

  const filteredOrders = orders;

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Page Header */}
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
            <p className="text-gray-600">View all your orders and manage returns/cancellations</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {successMessage}
            </div>
          )}

          {/* Orders List */}
          <div className="bg-white p-6 rounded-xl shadow">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button 
                  onClick={fetchOrders}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Try Again
                </button>
              </div>
            ) : ordersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No orders yet</p>
                <Link to="/products">
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                    Start Shopping
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order, index) => (
                  <div key={order._id || index} className={`border rounded-lg p-3 ${
                    order.status === 'Cancelled' ? 'bg-red-50 border-red-300' :
                    order.status === 'Delivered' ? 'bg-green-50 border-green-300' :
                    '  border-gray-300'
                  }`}>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-sm text-gray-500 font-bold">Order ID: {order._id?.substring(0, 12)}</p>
                        <p className="text-sm text-gray-500">Order Placed: {new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
                        {order.deliveredAt && (
                          <p className="text-sm text-gray-500">Delivered: {new Date(order.deliveredAt).toLocaleDateString("en-GB")}</p>
                        )}
                        <div className="mt-2">
                          <span className={`font-medium px-3 py-1 rounded-full text-white inline-block mb-2 ${
                            order.status === 'Delivered' ? 'bg-green-600' :
                            order.status === 'Shipped' ? 'bg-blue-600' :
                            order.status === 'Processing' ? 'bg-yellow-600' :
                            order.status === 'Pending' ? 'bg-orange-600' :
                            order.status === 'Cancelled' ? 'bg-red-600' :
                            'bg-gray-600'
                          }`}>
                            {order.status || 'Placed'}
                          </span>
                          {order.paymentStatus && (
                            <span className={`text-xs font-medium px-2 py-1 rounded block w-fit ${
                              order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              Payment: {order.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 bg-white p-2 rounded-lg  ">
                        {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex gap-3 bg-gray-50 p-2 rounded-lg">
                              <div className="shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                                ) : (
                                  <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>

                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-800">{item.name || 'Product'}</p>
                                <p className="text-xs text-gray-500">Size: {item.size || 'N/A'} | Qty: {item.quantity}</p>
                                <p className="font-medium text-sm text-indigo-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No items in order</p>
                        )}
                      </div>

                      <div className="bg-white p-3 rounded-lg  ">
                        <p className="text-sm text-gray-600">Payment Method: {order.paymentMethod || 'N/A'}</p>
                        <p className="font-semibold text-base mt-1">Total Amount: ₹{(order.totalAmount || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Cancel Reason Display */}
                    {order.cancelReason && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-red-700">❌ Cancellation Reason:</p>
                        <p className="text-sm text-red-600">{order.cancelReason}</p>
                      </div>
                    )}

                    {/* Return/Replace Status Display */}
                    {order.returnRequest?.status && order.returnRequest?.status !== 'None' && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-yellow-700">🔄 Return Request Status: {order.returnRequest.status}</p>
                        <p className="text-sm text-yellow-600">Reason: {order.returnRequest.reason}</p>
                        {order.returnRequest.adminNotes && (
                          <p className="text-sm text-yellow-600 mt-1">Admin Notes: {order.returnRequest.adminNotes}</p>
                        )}
                      </div>
                    )}

                    {order.replaceRequest?.status && order.replaceRequest?.status !== 'None' && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-blue-700">🔀 Replacement Request Status: {order.replaceRequest.status}</p>
                        <p className="text-sm text-blue-600">Reason: {order.replaceRequest.reason}</p>
                        {order.replaceRequest.adminNotes && (
                          <p className="text-sm text-blue-600 mt-1">Admin Notes: {order.replaceRequest.adminNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {/* Cancel Button */}
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => setShowCancelModal(order._id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                          >
                            ❌ Cancel Order
                          </button>
                        )}

                        {/* Return Button */}
                        {canReturnOrReplace(order) && order.returnRequest?.status === 'None' && (
                          <button
                            onClick={() => setShowReturnModal(order._id)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm font-semibold"
                          >
                            📦 Return Product
                          </button>
                        )}

                        {/* Replace Button */}
                        {canReturnOrReplace(order) && order.replaceRequest?.status === 'None' && (
                          <button
                            onClick={() => setShowReplaceModal(order._id)}
                            className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition text-sm font-semibold"
                          >
                            🔄 Replace Product
                          </button>
                        )}
                      </div>

                      {/* Days Remaining Info */}
                      {order.status === 'Delivered' && (
                        <div className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                          getRemainingDays(order) <= 2 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {getRemainingDays(order)} days left
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Cancel Order</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              className="w-full border rounded-lg p-3 mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCancelOrder(showCancelModal)}
                disabled={actionLoading[showCancelModal]}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:bg-red-300"
              >
                {actionLoading[showCancelModal] ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Request Return</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for return:</p>
            
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Enter reason for return (e.g., Defective, Wrong item, Quality issues, etc.)..."
              className="w-full border rounded-lg p-3 mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(null);
                  setReturnReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReturnRequest(showReturnModal)}
                disabled={actionLoading[showReturnModal]}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:bg-orange-300"
              >
                {actionLoading[showReturnModal] ? 'Processing...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Request Replacement</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for replacement:</p>
            
            <textarea
              value={replaceReason}
              onChange={(e) => setReplaceReason(e.target.value)}
              placeholder="Enter reason for replacement (e.g., Defective, Wrong size, Wrong color, etc.)..."
              className="w-full border rounded-lg p-3 mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplaceModal(null);
                  setReplaceReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplaceRequest(showReplaceModal)}
                disabled={actionLoading[showReplaceModal]}
                className="flex-1 bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition disabled:bg-violet-300"
              >
                {actionLoading[showReplaceModal] ? 'Processing...' : 'Submit Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PlaceOrder;
