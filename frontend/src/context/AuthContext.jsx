import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  api,
  login as apiLogin,
  logout as apiLogout,
} from "../lib/api.js";

const AuthContext = createContext(null);

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // CHECK CURRENT USER
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        /*
         * The browser automatically sends the HttpOnly
         * authentication cookie.
         */

        const response = await api.get(
          "/auth/me"
        );

        const authenticatedUser =
          response?.data?.user ?? null;

        if (mounted) {
          setUser(authenticatedUser);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }

        if (error?.response?.status === 401) {
          console.log(
            "[AUTH] No active session."
          );
        } else {
          console.error(
            "[AUTH] Failed to check authentication:",
            error
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  async function login(credentials) {
    try {
      setLoading(true);

      const response = await apiLogin(
        credentials
      );

      const loggedInUser =
        response?.user ?? null;

      if (!loggedInUser) {
        throw new Error(
          "Login succeeded but no user was returned."
        );
      }

      setUser(loggedInUser);

      return loggedInUser;
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // SET AUTH
  // ==========================================================

  function setAuth(authData) {
    if (!authData) {
      setUser(null);
      return;
    }

    setUser(
      authData?.user ?? null
    );
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {
    try {
      /*
       * HttpOnly cookies are automatically sent by Axios
       * because withCredentials: true is enabled in api.js.
       */

      await apiLogout();

      console.log(
        "[AUTH] Logout successful."
      );

      setUser(null);

      return true;
    } catch (error) {
      console.error(
        "[AUTH] Logout request failed:",
        error
      );

      /*
       * Clear local React state even if the server
       * request failed.
       */

      setUser(null);

      return false;
    }
  }

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),

    login,
    logout,

    setAuth,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}

export default AuthContext;

