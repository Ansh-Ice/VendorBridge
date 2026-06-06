import { useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on startup
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.data);
      } catch (err) {
        console.error("Session restoration failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, token } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    setLoading(true);
    try {
      const response = await authApi.register({ name, email, password, role });
      const { user: userData, token } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
