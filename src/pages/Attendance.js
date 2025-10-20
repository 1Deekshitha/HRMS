// src/pages/Attendance.js - ROLE-BASED ATTENDANCE
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clockIn, clockOut, getAttendanceForUser } from "../firebaseHelpers/attendance";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export default function Attendance() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayStatus, setTodayStatus] = useState({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
  });
  const [viewMode, setViewMode] = useState("personal"); // 'personal' or 'all'

  // Check if user can view all attendance
  const canViewAll = ["HR", "Senior Manager", "Admin", "Management Admin"].includes(userRole);

  useEffect(() => {
    if (viewMode === "personal") {
      fetchPersonalAttendance();
    } else if (canViewAll) {
      fetchAllAttendance();
    }
  }, [viewMode, currentUser]);

  const fetchPersonalAttendance = async () => {
    try {
      setLoading(true);
      const records = await getAttendanceForUser(currentUser.uid);
      
      // Sort by timestamp descending
      const sorted = records.sort((a, b) => {
        const timeA = a.timestamp?.toDate() || new Date(0);
        const timeB = b.timestamp?.toDate() || new Date(0);
        return timeB - timeA;
      });
      
      setAttendanceRecords(sorted);

      // Check today's status
      const today = new Date().toISOString().split("T")[0];
      const todayRecords = sorted.filter((record) => {
        const recordDate = record.timestamp?.toDate().toISOString().split("T")[0];
        return recordDate === today;
      });

      const clockInRecord = todayRecords.find((r) => r.type === "in");
      const clockOutRecord = todayRecords.find((r) => r.type === "out");

      setTodayStatus({
        clockedIn: !!clockInRecord && !clockOutRecord,
        clockInTime: clockInRecord?.timestamp?.toDate(),
        clockOutTime: clockOutRecord?.timestamp?.toDate(),
      });
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(db, "attendance"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error fetching all attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (todayStatus.clockedIn) {
      alert("You have already clocked in today!");
      return;
    }

    try {
      setLoading(true);
      await clockIn({
        uid: currentUser.uid,
        name: currentUser.name || currentUser.email,
      });
      alert("Clocked in successfully!");
      fetchPersonalAttendance();
    } catch (error) {
      console.error("Error clocking in:", error);
      alert("Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayStatus.clockedIn) {
      alert("You need to clock in first!");
      return;
    }

    if (todayStatus.clockOutTime) {
      alert("You have already clocked out today!");
      return;
    }

    try {
      setLoading(true);
      await clockOut({
        uid: currentUser.uid,
        name: currentUser.name || currentUser.email,
      });
      alert("Clocked out successfully!");
      fetchPersonalAttendance();
    } catch (error) {
      console.error("Error clocking out:", error);
      alert("Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
              <p className="text-gray-600 mt-1">
                {viewMode === "personal"
                  ? "Track your attendance"
                  : "View all employee attendance"}
              </p>
            </div>

            {/* View Toggle for Managers */}
            {canViewAll && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("personal")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    viewMode === "personal"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  My Attendance
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    viewMode === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All Employees
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clock In/Out Section - Only in Personal View */}
        {viewMode === "personal" && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Status */}
              <div>
                <h2 className="text-xl font-bold mb-4">Today's Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-blue-200 mr-2">📅</span>
                    <span>{new Date().toLocaleDateString("en-US", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-200 mr-2">
                      {todayStatus.clockedIn ? "✅" : "⏸️"}
                    </span>
                    <span className="font-semibold">
                      {todayStatus.clockedIn ? "Currently Working" : "Not Clocked In"}
                    </span>
                  </div>
                  {todayStatus.clockInTime && (
                    <div className="flex items-center">
                      <span className="text-blue-200 mr-2">🕐</span>
                      <span>Clock In: {formatTime(todayStatus.clockInTime)}</span>
                    </div>
                  )}
                  {todayStatus.clockOutTime && (
                    <div className="flex items-center">
                      <span className="text-blue-200 mr-2">🕐</span>
                      <span>Clock Out: {formatTime(todayStatus.clockOutTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-center gap-3">
                <button
                  onClick={handleClockIn}
                  disabled={loading || todayStatus.clockedIn}
                  className={`py-4 px-6 rounded-lg font-bold text-lg transition ${
                    todayStatus.clockedIn
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {todayStatus.clockedIn ? "Already Clocked In" : "🕐 Clock In"}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={loading || !todayStatus.clockedIn || todayStatus.clockOutTime}
                  className={`py-4 px-6 rounded-lg font-bold text-lg transition ${
                    !todayStatus.clockedIn || todayStatus.clockOutTime
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {todayStatus.clockOutTime ? "Already Clocked Out" : "🕐 Clock Out"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {viewMode === "personal" ? "My Attendance History" : "All Attendance Records"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === "personal"
                ? "Your recent clock in/out records"
                : "Recent attendance across all employees"}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl text-gray-600 mb-2">No attendance records found</p>
              <p className="text-gray-500">
                {viewMode === "personal"
                  ? "Clock in to start tracking your attendance"
                  : "No employee attendance recorded yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    {viewMode === "all" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50 transition">
                      {viewMode === "all" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {record.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium text-gray-900">{record.name}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(record.timestamp?.toDate())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            record.type === "in"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.type === "in" ? "Clock In" : "Clock Out"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box for Employees */}
        {!canViewAll && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">ℹ️</span>
              <div>
                <p className="font-semibold text-blue-800">Employee View</p>
                <p className="text-sm text-blue-700">
                  You can only view your own attendance records. Contact your manager or HR to view company-wide attendance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}