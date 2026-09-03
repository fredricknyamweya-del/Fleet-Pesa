// import { createContext, useContext, useState } from "react";
// import { updatePassword, updateProfile } from "../lib/api.js";
// import { useAuth } from "./AuthContext.jsx";

// const SettingsContext = createContext(null);

// export function SettingsProvider({ children }) {
//   const { token, user, setAuth } = useAuth();
//   const [state, setState] = useState({ loading: false, error: "", success: "" });

//   async function saveProfile(values) {
//     setState({ loading: true, error: "", success: "" });
//     try { const response = await updateProfile(values); setAuth({ token, user: response.user }); setState({ loading: false, error: "", success: "Profile updated successfully." }); return response.user; }
//     catch (error) { setState({ loading: false, error: error.message, success: "" }); throw error; }
//   }

//   async function savePassword(values) {
//     setState({ loading: true, error: "", success: "" });
//     try { await updatePassword(values); setState({ loading: false, error: "", success: "Password updated successfully." }); }
//     catch (error) { setState({ loading: false, error: error.message, success: "" }); throw error; }
//   }

//   return <SettingsContext.Provider value={{ user, state, saveProfile, savePassword }}>{children}</SettingsContext.Provider>;
// }

// export function useSettings() {
//   const context = useContext(SettingsContext);
//   if (!context) throw new Error("useSettings must be used within a SettingsProvider");
//   return context;
// }





import {
  createContext,
  useContext,
  useState,
} from "react";

import {
  updatePassword,
  updateProfile,
} from "../lib/api.js";

import { useAuth } from "./AuthContext.jsx";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const {
    token,
    user,
    setAuth,
  } = useAuth();

  const [state, setState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  async function saveProfile(values) {
    setState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      const response = await updateProfile(values);

      // Backend should return:
      //
      // {
      //   message: "...",
      //   user: {...}
      // }

      const updatedUser =
        response?.user || response?.data?.user;

      if (!updatedUser) {
        throw new Error(
          "Profile was updated, but the backend did not return the updated user."
        );
      }

      // Keep AuthContext synchronized
      setAuth({
        token,
        user: updatedUser,
      });

      setState({
        loading: false,
        error: "",
        success: "Profile updated successfully.",
      });

      return updatedUser;
    } catch (error) {
      const message =
        error?.message ||
        "Unable to update profile.";

      setState({
        loading: false,
        error: message,
        success: "",
      });

      throw error;
    }
  }

  // ============================================================
  // UPDATE PASSWORD
  // ============================================================

  async function savePassword(values) {
    setState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      /*
       * Expected values:
       *
       * {
       *   current_password: "...",
       *   new_password: "..."
       * }
       *
       */

      await updatePassword(
        values.current_password,
        values.new_password
      );

      setState({
        loading: false,
        error: "",
        success: "Password updated successfully.",
      });
    } catch (error) {
      const message =
        error?.message ||
        "Unable to update password.";

      setState({
        loading: false,
        error: message,
        success: "",
      });

      throw error;
    }
  }

  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  function clearSettingsMessages() {
    setState({
      loading: false,
      error: "",
      success: "",
    });
  }

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = {
    user,
    state,
    saveProfile,
    savePassword,
    clearSettingsMessages,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used within a SettingsProvider"
    );
  }

  return context;
}

export default SettingsContext;
