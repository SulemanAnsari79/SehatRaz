/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
// import { get } from "mongoose";

export const AuthContext = createContext(null);

// Initialize state from localStorage
const initializeAuth = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      return {
        user: JSON.parse(storedUser),
        token: storedToken
      };
    }
  } catch (error) {
    console.error("Failed to parse stored auth data:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
  
  return { user: null, token: '' };
};

const AuthProvider = ({ children }) => {

  const currency = 'INR';
  const delivery_fee = 50;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  
  const initialAuth = initializeAuth();
  const [token, setToken] = useState(initialAuth.token);
  const [user, setUser] = useState(initialAuth.user);




  const login = (userData) => {
    // Ensure user has all necessary fields
    const userWithRole = {
      _id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || "user"
    };
    setUser(userWithRole);
    setToken(userData.token);
    localStorage.setItem("user", JSON.stringify(userWithRole));
    localStorage.setItem("token",userData.token);

  };

  const logout = () => {
    
    console.log("Logging out user");
    setUser(null);
    setToken('');
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select product size");
      return;
    }

    // Ensure itemId is a string for consistent key matching
    const productId = String(itemId);

    // frontend optimistic update
    setCartItems(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [size]: (prev[productId]?.[size] || 0) + 1
      }
    }));

    if (token) {
      try {
        const response = await axios.post(
          backendUrl + "/api/cart/add",
          { productId, quantity: 1, size },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.success) {
          toast.error(response.data.message || "Add to cart failed");
          getUserCart(token); // rollback from server
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Add to cart failed");
        getUserCart(token); // rollback
      }
    }
  };

  const getCartCount = useCallback(() => {
    let totalCount = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        if (cartItems[itemId][size] > 0) {
          totalCount += cartItems[itemId][size];
        }
      }
    }
    return totalCount;
  }, [cartItems]);

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue; // Skip if product not found
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalAmount += itemInfo.price * cartItems[items][item];
        }
      }
    }
    return totalAmount;
  }


  const updateQuantity = async (itemId, size, quantity) => {
    // Ensure itemId is a string for consistent key matching
    const productId = String(itemId);
    
    setCartItems(prev => ({...prev,[productId]: {...(prev[productId] || {}),[size]: quantity}}));
    if (token) {
      try {
        await axios.post(backendUrl + '/api/cart/update',{ productId, size, quantity },{ headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    }
  };

  const getProductData = useCallback(async () => { 
    try {
      const response = await axios.get(backendUrl + '/api/product/list');
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(error.message || 'Failed to load products')
    }
  }, [backendUrl]);
  

  const getUserCart = useCallback(async (token) => {
    try {
      const response = await axios.post(backendUrl + '/api/cart/getUserCart', {}, { headers:  {Authorization: `Bearer ${token}` } });

      if (response.data.success) {
        // Transform backend cart array to frontend nested structure
        const transformedCart = {};
        
        if (Array.isArray(response.data.cart)) {
          response.data.cart.forEach(item => {
            // Extract product ID (handle both cases: populated object or plain ID)
            let productId = item.productId;
            if (typeof productId === 'object' && productId !== null) {
              productId = productId._id || productId;
            }
            
            // Convert to string for consistent key usage
            const productIdStr = String(productId);
            const size = item.size || "";
            const quantity = item.quantity;
            
            if (!transformedCart[productIdStr]) {
              transformedCart[productIdStr] = {};
            }
            transformedCart[productIdStr][size] = quantity;
          });
        }
        
        setCartItems(transformedCart);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error(error.message || 'Failed to load cart')
    }
  }, [backendUrl]);

  const clearCart = useCallback(async () => {
    setCartItems({});
    if (token) {
      try {
        await axios.post(backendUrl + '/api/cart/clear', {}, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  }, [token, backendUrl]);

  useEffect(() => {
    getProductData();
  }, [getProductData]);

  useEffect(() => {
    // Only fetch cart for regular users, not for doctors or admins
    if (token && user && user.role === 'user') {
      getUserCart(token);
    }
  }, [token, user, getUserCart]);


  const value = {
    login,
    logout,
    user,
    isLoading,
    products,
    currency,
    delivery_fee,
    search, setSearch,
    showSearch, setShowSearch,
    cartItems, setCartItems, 
    addToCart, getCartCount, clearCart,
    updateQuantity, getCartAmount,
    navigate, 
    backendUrl,
    token, setToken
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


  


export default AuthProvider;
