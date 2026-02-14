import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

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
  const [isLoading, setIsLoading] = useState(true);
  
  // const initialAuth = initializeAuth();
  const [token, setToken] = useState("");
  const [user, setUser] = useState("");


  useEffect(() => {
    // Mark loading as complete after hydration
    setIsLoading(false);
  }, []);

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
    let cartData = structuredClone(cartItems);

    if (!size) {
      toast.error('Select product size');
      return;
    }

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    }
    else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: {Authorization: `Bearer ${token}` } })
      } catch (error) {
        console.log(error);
        toast.error(error.message)
      }
    }
  }

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalCount += cartItems[items][item];
        }
      }
    }
    return totalCount;
  }

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

    let cartData = structuredClone(cartItems);

    cartData[itemId][size] = quantity;
    
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: {Authorization: `Bearer ${token}` }  })
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  }

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
        setCartItems(response.data.cart)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error(error.message || 'Failed to load cart')
    }
  }, [backendUrl]);

  // useEffect(() => {
  //   getProductData();
  // }, [getProductData]);

  // useEffect(() => {
  // if (token) {
  //   getUserCart(token);
  // }
  // }, [token, getUserCart]);


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
    addToCart, getCartCount,
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
