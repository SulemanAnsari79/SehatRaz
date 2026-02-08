import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const data = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (data) {
      try {
        const userData = JSON.parse(data);
        // Restore token to localStorage if it exists
        if (token) {
          localStorage.setItem("token", token);
        }
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
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
    localStorage.setItem("user", JSON.stringify(userWithRole));
    // Token should be stored by AuthService during login
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
