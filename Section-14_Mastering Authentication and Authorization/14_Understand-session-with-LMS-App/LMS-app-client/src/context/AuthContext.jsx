import { createContext, useContext, useState } from "react";
import { logoutApi } from "../api/authApi";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState();

  const login = (email, password) => {
    // In a real app, this would make an API call
    const userData = { email, name: email.split("@")[0] };
    setUser(userData);
  };

  const register = (email, password) => {
    // In a real app, this would make an API call
    const userData = { email, name: email.split("@")[0] };
    setUser(userData);
  };

  const logout = async () => {
    await logoutApi();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
