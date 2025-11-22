import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// allows accessibility of auth context for all containers
export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // checking if logged in on first load of page
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // if logging in, set token and change state of setIsLoggedIn
  const login = (token) => {
    localStorage.setItem("token", token);
    setIsLoggedIn(true);
  };

  // same as above
  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // app can access variables
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
