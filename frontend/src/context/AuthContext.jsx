import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "fleetpesa_auth";

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY);

      if (!savedAuth) {
        return {
          token: null,
          user: null,
        };
      }

      return JSON.parse(savedAuth);
    } catch (error) {
      console.error("Failed to restore authentication:", error);

      localStorage.removeItem(STORAGE_KEY);

      return {
        token: null,
        user: null,
      };
    }
  });

  const setAuth = (newAuth) => {
    setAuthState(newAuth);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newAuth)
      );
    } catch (error) {
      console.error("Failed to save authentication:", error);
    }
  };

  const logout = () => {
    setAuthState({
      token: null,
      user: null,
    });

    localStorage.removeItem(STORAGE_KEY);
  };

  const isAuthenticated = Boolean(auth?.token);

  const value = useMemo(
    () => ({
      token: auth?.token || null,
      user: auth?.user || null,
      isAuthenticated,
      setAuth,
      logout,
    }),
    [auth, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}

export default AuthContext;
