// src/pages/Employees.js - COMPLETE WITH CRUD + ROLE PERMISSIONS
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} from "../firebaseHelpers/employees";

export default function Employees() {
  const { userRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    salary: "",
  });

  // Check if user can edit/delete
  const canManage = ["HR", "Admin", "Management Admin"].includes(userRole);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEmployee = () => {
    if (!canManage) {
      alert("You don't have permission to add employees");
      return;
    }
    setEditMode(false);
    setFormData({
      name: "",
      email: "",
      department: "",
      designation: "",
      salary: "",
    });
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    if (!canManage) {
      alert("You don't have permission to edit employees");
      return;
    }
    setEditMode(true);
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation || "",
      salary: employee.salary?.toString() || "",
    });
    setShowModal(true);
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!canManage) {
      alert("You don't have permission to delete employees");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteEmployee(id);
        alert("Employee deleted successfully!");
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      alert("Email is required");
      return;
    }
    if (!formData.department.trim()) {
      alert("Department is required");
      return;
    }
    if (!formData.salary || formData.salary <= 0) {
      alert("Valid salary is required");
      return;
    }

    try {
      if (editMode) {
        // Update existing employee
        await updateEmployee(currentEmployee.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          salary: Number(formData.salary),
        });
        alert("Employee updated successfully!");
      } else {
        // Add new employee
        await addEmployee({
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          salary: Number(formData.salary),
          createdAt: new Date().toISOString(),
        });
        alert("Employee added successfully!");
      }

      setShowModal(false);
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Failed to save employee");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      department: "",
      designation: "",
      salary: "",
    });
    setCurrentEmployee(null);
    setEditMode(false);
  };

  // Get unique departments for filter
  const departments = ["All", ...new Set(employees.map((e) => e.department))];

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === "All" || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading employees...</div>
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
              <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
              <p className="text-gray-600 mt-1">
                {canManage ? "Manage your organization's employees" : "View employee directory"}
              </p>
            </div>
            {canManage && (
              <button
                onClick={handleAddEmployee}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold flex items-center justify-center"
              >
                <span className="text-xl mr-2">+</span>
                Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employees
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredEmployees.length}</span> of{" "}
            <span className="font-semibold">{employees.length}</span> employees
          </div>
        </div>

        {/* Permission Notice for Non-Managers */}
        {!canManage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">ℹ️</span>
              <div>
                <p className="font-semibold text-yellow-800">View-Only Access</p>
                <p className="text-sm text-yellow-700">
                  You can view employee information but cannot add, edit, or delete employees.
                  Contact HR or Admin for changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-xl text-gray-600 mb-2">No employees found</p>
              <p className="text-gray-500">
                {searchTerm || filterDept !== "All"
                  ? "Try adjusting your search or filter"
                  : "Add your first employee to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    {canManage && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {employee.name[0].toUpperCase()}
                          </div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.designation || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{employee.salary?.toLocaleString() || "0"}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editMode ? "Edit Employee" : "Add New Employee"}
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@company.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Department */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="Engineering, HR, Sales, etc."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Designation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Senior Developer, Manager, etc."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Salary */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="50000"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                    >
                      {editMode ? "Update Employee" : "Add Employee"}
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