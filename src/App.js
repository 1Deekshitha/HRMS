// src/App.js - WITH ROLE-BASED ROUTING
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Goals from "./pages/Goals";

// Layout Component
import Nav from "./components/Nav";

function AppLayout({ children }) {
  return (
    <div>
      <Nav />
      <div className="pt-16">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes - All authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Attendance - All roles can access */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Attendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Employees - All roles can VIEW, but only HR/Admin/Management Admin can EDIT */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Employees />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Payroll - Only HR, Admin, Management Admin */}
          <Route
            path="/payroll"
            element={
              <ProtectedRoute allowedRoles={["HR", "Admin", "Management Admin"]}>
                <AppLayout>
                  <Payroll />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Performance - HR, Senior Manager, Admin, Management Admin */}
          <Route
            path="/performance"
            element={
              <ProtectedRoute allowedRoles={["HR", "Senior Manager", "Admin", "Management Admin"]}>
                <AppLayout>
                  <Performance />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Goals - HR, Senior Manager, Admin, Management Admin */}
          <Route
            path="/goals"
            element={
              <ProtectedRoute allowedRoles={["HR", "Senior Manager", "Admin", "Management Admin"]}>
                <AppLayout>
                  <Goals />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}