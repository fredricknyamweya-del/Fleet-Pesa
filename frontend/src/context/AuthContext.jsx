import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "fleetpesa_auth";
const ACCESS_TOKEN_KEY = "access_token";

const EMPTY_AUTH = {
  token: null,
  user: null,
};

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY);
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      const parsedAuth = savedAuth
        ? JSON.parse(savedAuth)
        : {};

      return {
        token: accessToken || parsedAuth?.token || null,
        user: parsedAuth?.user || null,
      };
    } catch (error) {
      console.error(
        "Failed to restore authentication:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);

      return EMPTY_AUTH;
    }
  });

  // Save authentication
  const setAuth = (newAuth) => {
    const token = newAuth?.token || null;
    const user = newAuth?.user || null;

    const authData = {
      token,
      user,
    };

    setAuthState(authData);

    try {
      // Store complete auth state
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authData)
      );

      // Store API access token
      if (token) {
        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          token
        );
      } else {
        localStorage.removeItem(
          ACCESS_TOKEN_KEY
        );
      }
    } catch (error) {
      console.error(
        "Failed to save authentication:",
        error
      );
    }
  };

  // Logout
  const logout = () => {
    setAuthState(EMPTY_AUTH);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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
