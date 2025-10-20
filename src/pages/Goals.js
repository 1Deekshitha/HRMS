// src/pages/Goals.js - ROLE-BASED GOALS MANAGEMENT
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addGoal,
  getAllGoals,
  updateGoal,
  deleteGoal,
} from "../firebaseHelpers/performance";
import { getAllEmployees } from "../firebaseHelpers/employees";

export default function Goals() {
  const { currentUser, userRole } = useAuth();
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Permission check
  const canManage = ["HR", "Senior Manager", "Admin", "Management Admin"].includes(userRole);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    title: "",
    description: "",
    deadline: "",
    status: "in-progress",
    progress: 0,
  });

  useEffect(() => {
    if (!canManage) {
      alert("Access Denied: Only HR, Senior Manager, Admin, and Management Admin can manage goals");
      window.location.href = "/dashboard";
      return;
    }
    fetchData();
  }, [canManage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsData, employeesData] = await Promise.all([
        getAllGoals(),
        getAllEmployees(),
      ]);
      setGoals(goalsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load goals data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "progress" ? Number(value) : value,
    });
  };

  const handleEmployeeSelect = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === employeeId);
    
    if (employee) {
      setFormData({
        ...formData,
        employeeId: employee.id,
        employeeName: employee.name,
      });
    }
  };

  const handleAddGoal = () => {
    setEditMode(false);
    setFormData({
      employeeId: "",
      employeeName: "",
      title: "",
      description: "",
      deadline: "",
      status: "in-progress",
      progress: 0,
    });
    setShowModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditMode(true);
    setCurrentGoal(goal);
    setFormData({
      employeeId: goal.employeeId,
      employeeName: goal.employeeName,
      title: goal.title,
      description: goal.description || "",
      deadline: goal.deadline,
      status: goal.status,
      progress: goal.progress || 0,
    });
    setShowModal(true);
  };

  const handleDeleteGoal = async (id, title) => {
    if (window.confirm(`Delete goal: ${title}?`)) {
      try {
        await deleteGoal(id);
        alert("Goal deleted successfully!");
        fetchData();
      } catch (error) {
        console.error("Error deleting goal:", error);
        alert("Failed to delete goal");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert("Please select an employee");
      return;
    }
    if (!formData.title.trim()) {
      alert("Please enter goal title");
      return;
    }
    if (!formData.deadline) {
      alert("Please set a deadline");
      return;
    }

    try {
      if (editMode) {
        await updateGoal(currentGoal.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          deadline: formData.deadline,
          status: formData.status,
          progress: formData.progress,
        });
        alert("Goal updated successfully!");
      } else {
        await addGoal({
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          title: formData.title.trim(),
          description: formData.description.trim(),
          deadline: formData.deadline,
          status: formData.status,
          progress: formData.progress,
        });
        alert("Goal added successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("Failed to save goal");
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      employeeName: "",
      title: "",
      description: "",
      deadline: "",
      status: "in-progress",
      progress: 0,
    });
    setCurrentGoal(null);
    setEditMode(false);
  };

  // Filter goals
  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || goal.status === filterStatus.toLowerCase().replace(" ", "-");
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Goals Management</h1>
              <p className="text-gray-600 mt-1">Set and track employee goals</p>
            </div>
            <button
              onClick={handleAddGoal}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition font-semibold flex items-center justify-center"
            >
              <span className="text-xl mr-2">+</span>
              Add Goal
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm font-medium">Total Goals</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{goals.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="text-gray-600 text-sm font-medium">In Progress</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {goals.filter((g) => g.status === "in-progress").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium">Completed</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {goals.filter((g) => g.status === "completed").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="text-gray-600 text-sm font-medium">Overdue</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {goals.filter((g) => g.status === "in-progress" && isOverdue(g.deadline)).length}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Goals
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or employee..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option>All</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl text-gray-600 mb-2">No goals found</p>
              <p className="text-gray-500">Add your first goal to get started</p>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-green-500"
              >
                {/* Employee Info */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {goal.employeeName[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{goal.employeeName}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      goal.status
                    )}`}
                  >
                    {goal.status.replace("-", " ").toUpperCase()}
                  </span>
                </div>

                {/* Goal Title */}
                <h4 className="font-bold text-gray-900 mb-2 text-lg">{goal.title}</h4>

                {/* Description */}
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{goal.description}</p>
                )}

                {/* Deadline */}
                <div className="mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-2">📅 Deadline:</span>
                    <span
                      className={`font-semibold ${
                        isOverdue(goal.deadline) && goal.status === "in-progress"
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {isOverdue(goal.deadline) && goal.status === "in-progress" && (
                    <span className="text-xs text-red-600 font-semibold">⚠️ OVERDUE</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-800">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(
                        goal.progress
                      )}`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditGoal(goal)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editMode ? "Edit Goal" : "Add New Goal"}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Employee Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={handleEmployeeSelect}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                      disabled={editMode}
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Complete React Certification"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Describe the goal..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Deadline */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress: {formData.progress}%
                    </label>
                    <input
                      type="range"
                      name="progress"
                      value={formData.progress}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="5"
                      className="w-full"
                    />
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressColor(
                          formData.progress
                        )}`}
                        style={{ width: `${formData.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition font-semibold"
                    >
                      {editMode ? "Update Goal" : "Add Goal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}