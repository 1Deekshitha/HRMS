// src/pages/Dashboard.js - COMPLETE ROLE-BASED DASHBOARD
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingPayslips: 0,
    avgPerformance: 0,
    activeGoals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, [userRole, currentUser]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Different stats based on role
      if (userRole === "Employee") {
        await fetchEmployeeStats();
      } else {
        await fetchCompanyStats();
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    try {
      // Check if employee clocked in today
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("uid", "==", currentUser.uid)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      
      let clockedInToday = false;
      let lastClockIn = null;
      let lastClockOut = null;

      attendanceSnap.docs.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        if (timestamp && timestamp.toISOString().split("T")[0] === today) {
          if (data.type === "in") {
            clockedInToday = true;
            lastClockIn = timestamp;
          } else if (data.type === "out") {
            lastClockOut = timestamp;
          }
        }
      });

      // Get employee's performance reviews
      const reviewsQuery = query(
        collection(db, "performance"),
        where("employeeId", "==", currentUser.uid)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const avgScore = reviewsSnap.docs.length > 0
        ? reviewsSnap.docs.reduce((sum, doc) => sum + (doc.data().overallScore || 0), 0) / reviewsSnap.docs.length
        : 0;

      // Get employee's active goals
      const goalsQuery = query(
        collection(db, "goals"),
        where("employeeId", "==", currentUser.uid),
        where("status", "==", "in-progress")
      );
      const goalsSnap = await getDocs(goalsQuery);

      setStats({
        totalEmployees: 1,
        presentToday: clockedInToday ? 1 : 0,
        pendingPayslips: 0,
        avgPerformance: Math.round(avgScore * 10) / 10,
        activeGoals: goalsSnap.size,
      });

      // Set recent activity for employee
      const activity = [];
      if (lastClockIn) {
        activity.push(`Clocked in at ${lastClockIn.toLocaleTimeString()}`);
      }
      if (lastClockOut) {
        activity.push(`Clocked out at ${lastClockOut.toLocaleTimeString()}`);
      }
      if (reviewsSnap.docs.length > 0) {
        activity.push(`${reviewsSnap.docs.length} performance review(s) received`);
      }
      if (goalsSnap.size > 0) {
        activity.push(`${goalsSnap.size} active goal(s) in progress`);
      }
      setRecentActivity(activity.length > 0 ? activity : ["No recent activity"]);
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      setRecentActivity(["Error loading activity"]);
    }
  };

  const fetchCompanyStats = async () => {
    try {
      // Get total employees
      const employeesSnap = await getDocs(collection(db, "employees"));
      const totalEmployees = employeesSnap.size;

      // Count today's attendance
      const today = new Date().toISOString().split("T")[0];
      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const todayAttendance = new Set();
      
      attendanceSnap.docs.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        if (timestamp && timestamp.toISOString().split("T")[0] === today && data.type === "in") {
          todayAttendance.add(data.uid);
        }
      });

      // Pending payslips (if HR/Admin)
      let pendingPayslips = 0;
      if (["HR", "Admin", "Management Admin"].includes(userRole)) {
        const payrollQuery = query(
          collection(db, "payroll"),
          where("status", "==", "pending")
        );
        const payrollSnap = await getDocs(payrollQuery);
        pendingPayslips = payrollSnap.size;
      }

      // Average performance score
      const performanceSnap = await getDocs(collection(db, "performance"));
      const avgScore = performanceSnap.docs.length > 0
        ? performanceSnap.docs.reduce((sum, doc) => sum + (doc.data().overallScore || 0), 0) / performanceSnap.docs.length
        : 0;

      // Active goals count
      const goalsQuery = query(
        collection(db, "goals"),
        where("status", "==", "in-progress")
      );
      const goalsSnap = await getDocs(goalsQuery);

      setStats({
        totalEmployees,
        presentToday: todayAttendance.size,
        pendingPayslips,
        avgPerformance: Math.round(avgScore * 10) / 10,
        activeGoals: goalsSnap.size,
      });

      // Set recent activity for company
      const activity = [
        `${totalEmployees} total employees registered`,
        `${todayAttendance.size} employees present today`,
        `${performanceSnap.docs.length} performance reviews completed`,
        `${goalsSnap.size} active goals in progress`,
      ];
      
      if (pendingPayslips > 0) {
        activity.push(`${pendingPayslips} pending payslips to process`);
      }
      
      setRecentActivity(activity);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      setRecentActivity(["Error loading activity"]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleDescription = () => {
    switch (userRole) {
      case "Management Admin":
        return "You have full access to all system features and company-wide analytics.";
      case "Admin":
        return "Manage employees, payroll, and system configurations.";
      case "Senior Manager":
        return "View company performance, reviews, and team analytics.";
      case "HR":
        return "Manage recruitment, employee records, and HR operations.";
      case "Employee":
        return "View your attendance, performance, and personal information.";
      default:
        return "Welcome to the HRMS platform.";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()}, {currentUser?.name || currentUser?.email?.split("@")[0]}!
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-4 py-1.5 bg-white bg-opacity-20 backdrop-blur rounded-full text-sm font-semibold">
              {userRole}
            </span>
            <p className="text-blue-100">{getRoleDescription()}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees / Personal Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {userRole === "Employee" ? "My Profile" : "Total Employees"}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.totalEmployees}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {userRole === "Employee" ? "Active account" : "Registered"}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Present Today / Attendance Status */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {userRole === "Employee" ? "Attendance Today" : "Present Today"}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.presentToday}
                  {userRole === "Employee" && (
                    <span className="text-lg ml-2">
                      {stats.presentToday > 0 ? "✓" : "✗"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {userRole === "Employee" 
                    ? (stats.presentToday > 0 ? "Marked present" : "Not marked")
                    : `Out of ${stats.totalEmployees}`
                  }
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {userRole === "Employee" ? "My Performance" : "Avg Performance"}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.avgPerformance || 0}/10
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.avgPerformance >= 8 ? "Excellent" : stats.avgPerformance >= 6 ? "Good" : stats.avgPerformance > 0 ? "Needs improvement" : "No reviews yet"}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Goals / Pending Payslips */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {userRole === "Employee" 
                    ? "Active Goals" 
                    : (["HR", "Admin", "Management Admin"].includes(userRole) ? "Pending Payslips" : "Active Goals")
                  }
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {userRole === "Employee" || !["HR", "Admin", "Management Admin"].includes(userRole)
                    ? stats.activeGoals || 0
                    : stats.pendingPayslips
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {userRole === "Employee" 
                    ? "In progress" 
                    : (["HR", "Admin", "Management Admin"].includes(userRole) ? "Require action" : "Company-wide")
                  }
                </p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userRole === "Employee" && (
              <>
                <a href="/attendance" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">⏰</div>
                  <div className="font-semibold text-gray-800">Mark Attendance</div>
                  <div className="text-xs text-gray-500 mt-1">Clock in/out</div>
                </a>
                <a href="/goals" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">🎯</div>
                  <div className="font-semibold text-gray-800">View Goals</div>
                  <div className="text-xs text-gray-500 mt-1">Track progress</div>
                </a>
                <a href="/performance" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">📊</div>
                  <div className="font-semibold text-gray-800">My Performance</div>
                  <div className="text-xs text-gray-500 mt-1">View reviews</div>
                </a>
              </>
            )}

            {(userRole === "HR" || userRole === "Admin" || userRole === "Management Admin") && (
              <>
                <a href="/employees" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">👥</div>
                  <div className="font-semibold text-gray-800">Manage Employees</div>
                  <div className="text-xs text-gray-500 mt-1">Add, edit, delete</div>
                </a>
                <a href="/payroll" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">💰</div>
                  <div className="font-semibold text-gray-800">Payroll</div>
                  <div className="text-xs text-gray-500 mt-1">Generate payslips</div>
                </a>
                <a href="/performance" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">📈</div>
                  <div className="font-semibold text-gray-800">Performance Reviews</div>
                  <div className="text-xs text-gray-500 mt-1">Add reviews</div>
                </a>
              </>
            )}

            {userRole === "Senior Manager" && (
              <>
                <a href="/employees" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">👥</div>
                  <div className="font-semibold text-gray-800">View Employees</div>
                  <div className="text-xs text-gray-500 mt-1">Team overview</div>
                </a>
                <a href="/performance" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">📊</div>
                  <div className="font-semibold text-gray-800">Performance Reviews</div>
                  <div className="text-xs text-gray-500 mt-1">Review team</div>
                </a>
                <a href="/goals" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">🎯</div>
                  <div className="font-semibold text-gray-800">Team Goals</div>
                  <div className="text-xs text-gray-500 mt-1">Monitor progress</div>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                  <p className="text-gray-700">{activity}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No recent activity</p>
            )}
          </div>
        </div>

        {/* System Status (for Admins) */}
        {(userRole === "Admin" || userRole === "Management Admin") && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">✅</span>
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-green-700">
                <span className="mr-2">●</span>
                <span>All services operational</span>
              </div>
              <div className="flex items-center text-green-700">
                <span className="mr-2">●</span>
                <span>Database connected</span>
              </div>
              <div className="flex items-center text-green-700">
                <span className="mr-2">●</span>
                <span>Real-time sync active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}