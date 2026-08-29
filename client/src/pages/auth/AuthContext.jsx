import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  findDemoUser,
} from "./demoUsers";

const AuthContext =
  createContext(null);

const AUTH_STORAGE_KEY =
  "governscale_current_user";

export const AuthProvider = ({
  children,
}) => {
  const [currentUser, setCurrentUser] =
    useState(() => {
      try {
        const storedUser =
          localStorage.getItem(
            AUTH_STORAGE_KEY
          );

        return storedUser
          ? JSON.parse(storedUser)
          : null;
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );

        return null;
      }
    });

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  const login = (
    email,
    password
  ) => {
    const user =
      findDemoUser(
        email,
        password
      );

    if (!user) {
      return {
        success: false,
        message:
          "Invalid email or password.",
      };
    }

    // Never store password in session
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,

      department:
        user.department,

      organization:
        user.organization,

      team:
        user.team,

      employeeId:
        user.employeeId,
    };

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(
        sessionUser
      )
    );

    setCurrentUser(
      sessionUser
    );

    return {
      success: true,
      user: sessionUser,
    };
  };

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  const logout = () => {
    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    setCurrentUser(null);
  };

  // ----------------------------------------------------------
  // UPDATE USER
  // ----------------------------------------------------------

  const updateCurrentUser = (
    updates
  ) => {
    setCurrentUser(
      (previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          ...updates,
        };

        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(
            updatedUser
          )
        );

        return updatedUser;
      }
    );
  };

  // ----------------------------------------------------------
  // CHECK AUTHENTICATION
  // ----------------------------------------------------------

  const isAuthenticated =
    Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,

        login,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// CUSTOM HOOK
// ============================================================

export const useAuth = () => {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};