// src/components/Nav.js - ROLE-BASED NAVIGATION
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Navigation items based on role
  const getNavItems = () => {
    const allItems = [
      { path: "/dashboard", label: "Dashboard", icon: "📊", roles: ["all"] },
      { path: "/employees", label: "Employees", icon: "👥", roles: ["all"] },
      { path: "/attendance", label: "Attendance", icon: "⏰", roles: ["all"] },
      { path: "/payroll", label: "Payroll", icon: "💰", roles: ["HR", "Admin", "Management Admin"] },
      { path: "/performance", label: "Performance", icon: "📈", roles: ["HR", "Senior Manager", "Admin", "Management Admin"] },
      { path: "/goals", label: "Goals", icon: "🎯", roles: ["HR", "Senior Manager", "Admin", "Management Admin"] },
      { path: "/recruitment", label: "Recruitment", icon: "📄", roles: ["all"] },
    ];

    return allItems.filter(item => 
      item.roles.includes("all") || item.roles.includes(userRole)
    );
  };

  const navItems = getNavItems();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">HR</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden md:block">
                HRMS Pro
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                    isActive(item.path)
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className="hidden sm:block">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-semibold">
                {userRole}
              </span>
            </div>

            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {currentUser?.name || currentUser?.email?.split("@")[0]}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser?.email}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {(currentUser?.name || currentUser?.email)?.[0]?.toUpperCase()}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 border-t border-gray-200 mt-2 pt-2">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center space-x-1 ${
                  isActive(item.path)
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}