// src/context/AuthContext.js - UPDATED WITH ROLE SUPPORT
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup with role
  async function signup(email, password, name, role = "Employee") {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Create user document in Firestore with role
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role, // Store selected role
        createdAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  // Login
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Sign In
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document with default Employee role
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "Google User",
          role: "Employee", // Default role for Google sign-in
          createdAt: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Fetch user role from Firestore
  async function fetchUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || "Employee");
        // Merge role into currentUser
        setCurrentUser((prev) => ({ ...prev, ...userData }));
      } else {
        setUserRole("Employee"); // Default fallback
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("Employee");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserRole(user.uid);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}