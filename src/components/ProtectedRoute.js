// src/components/ProtectedRoute.js - ROLE-BASED ACCESS CONTROL
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, userRole } = useAuth();

  // Not logged in - redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // If no role restrictions, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles.includes(userRole)) {
    return children;
  }

  // User doesn't have permission - show access denied
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
          <br />
          Your role: <span className="font-semibold text-blue-600">{userRole}</span>
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}