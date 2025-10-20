// src/pages/Payroll.js - ROLE-BASED PAYROLL (HR/Admin Only)
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  generatePayslip,
  getAllPayslips,
  updatePayslipStatus,
  deletePayslip,
  calculateSalary,
} from "../firebaseHelpers/payroll";
import { getAllEmployees } from "../firebaseHelpers/employees";

export default function Payroll() {
  const { userRole } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    hra: 0,
    transport: 0,
    medical: 0,
    tax: 0,
    pf: 0,
    other: 0,
  });

  // Permission check
  const canManage = ["HR", "Admin", "Management Admin"].includes(userRole);

  useEffect(() => {
    if (!canManage) {
      alert("Access Denied: Only HR, Admin, and Management Admin can access payroll");
      window.location.href = "/dashboard";
      return;
    }
    fetchData();
  }, [canManage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payslipsData, employeesData] = await Promise.all([
        getAllPayslips(),
        getAllEmployees(),
      ]);
      setPayslips(payslipsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === employeeId);
    
    if (employee) {
      // Auto-fill with employee's salary
      const basicSalary = employee.salary || 0;
      setFormData({
        ...formData,
        employeeId: employee.id,
        employeeName: employee.name,
        basicSalary,
        hra: Math.round(basicSalary * 0.1), // 10% HRA
        transport: 2000,
        medical: 1000,
        tax: Math.round(basicSalary * 0.06), // 6% tax
        pf: Math.round(basicSalary * 0.04), // 4% PF
        other: 0,
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value) || 0,
    });
  };

  const handleGeneratePayslip = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert("Please select an employee");
      return;
    }

    try {
      const { grossSalary, netSalary } = calculateSalary(
        formData.basicSalary,
        {
          hra: formData.hra,
          transport: formData.transport,
          medical: formData.medical,
        },
        {
          tax: formData.tax,
          pf: formData.pf,
          other: formData.other,
        }
      );

      await generatePayslip({
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        month: formData.month,
        year: formData.year,
        basicSalary: formData.basicSalary,
        allowances: {
          hra: formData.hra,
          transport: formData.transport,
          medical: formData.medical,
        },
        deductions: {
          tax: formData.tax,
          pf: formData.pf,
          other: formData.other,
        },
        grossSalary,
        netSalary,
        status: "pending",
      });

      alert("Payslip generated successfully!");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error generating payslip:", error);
      alert("Failed to generate payslip");
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (window.confirm("Mark this payslip as paid?")) {
      try {
        await updatePayslipStatus(id, "paid");
        alert("Payslip marked as paid!");
        fetchData();
      } catch (error) {
        console.error("Error updating payslip:", error);
        alert("Failed to update payslip status");
      }
    }
  };

  const handleDeletePayslip = async (id, employeeName) => {
    if (window.confirm(`Delete payslip for ${employeeName}?`)) {
      try {
        await deletePayslip(id);
        alert("Payslip deleted!");
        fetchData();
      } catch (error) {
        console.error("Error deleting payslip:", error);
        alert("Failed to delete payslip");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      employeeName: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      hra: 0,
      transport: 0,
      medical: 0,
      tax: 0,
      pf: 0,
      other: 0,
    });
  };

  // Filter payslips
  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch = payslip.employeeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || payslip.status === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading payroll data...</div>
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
              <h1 className="text-3xl font-bold text-gray-800">Payroll Management</h1>
              <p className="text-gray-600 mt-1">Generate and manage employee payslips</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition font-semibold flex items-center justify-center"
            >
              <span className="text-xl mr-2">+</span>
              Generate Payslip
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium">Total Payslips</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{payslips.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="text-gray-600 text-sm font-medium">Pending</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {payslips.filter((p) => p.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm font-medium">Paid</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {payslips.filter((p) => p.status === "paid").length}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employee
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name..."
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
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-xl text-gray-600 mb-2">No payslips found</p>
              <p className="text-gray-500">Generate your first payslip to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayslips.map((payslip) => {
                    const totalDeductions =
                      (payslip.deductions?.tax || 0) +
                      (payslip.deductions?.pf || 0) +
                      (payslip.deductions?.other || 0);

                    return (
                      <tr key={payslip.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {payslip.employeeName[0].toUpperCase()}
                            </div>
                            <div className="font-medium text-gray-900">
                              {payslip.employeeName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {monthNames[payslip.month - 1]} {payslip.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{payslip.grossSalary?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -₹{totalDeductions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ₹{payslip.netSalary?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              payslip.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {payslip.status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {payslip.status === "pending" && (
                              <button
                                onClick={() => handleMarkAsPaid(payslip.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeletePayslip(payslip.id, payslip.employeeName)
                              }
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate Payslip Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Generate Payslip
                </h2>

                <form onSubmit={handleGeneratePayslip}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Employee <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.employeeId}
                        onChange={handleEmployeeSelect}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Choose an employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month & Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        {monthNames.map((month, index) => (
                          <option key={index} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2020"
                        max="2030"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Basic Salary */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Basic Salary (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="basicSalary"
                        value={formData.basicSalary}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Allowances */}
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg border-b pb-2">
                        Allowances
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HRA (₹)
                      </label>
                      <input
                        type="number"
                        name="hra"
                        value={formData.hra}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transport (₹)
                      </label>
                      <input
                        type="number"
                        name="transport"
                        value={formData.transport}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical (₹)
                      </label>
                      <input
                        type="number"
                        name="medical"
                        value={formData.medical}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="md:col-span-2 mt-4">
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg border-b pb-2">
                        Deductions
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax (₹)
                      </label>
                      <input
                        type="number"
                        name="tax"
                        value={formData.tax}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PF (₹)
                      </label>
                      <input
                        type="number"
                        name="pf"
                        value={formData.pf}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other (₹)
                      </label>
                      <input
                        type="number"
                        name="other"
                        value={formData.other}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Summary */}
                    <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Gross Salary:</span>
                          <span className="font-bold text-gray-900 ml-2">
                            ₹
                            {(
                              formData.basicSalary +
                              formData.hra +
                              formData.transport +
                              formData.medical
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Deductions:</span>
                          <span className="font-bold text-red-600 ml-2">
                            -₹
                            {(
                              formData.tax +
                              formData.pf +
                              formData.other
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-300">
                          <span className="text-gray-600">Net Salary:</span>
                          <span className="font-bold text-green-600 ml-2 text-lg">
                            ₹
                            {(
                              formData.basicSalary +
                              formData.hra +
                              formData.transport +
                              formData.medical -
                              formData.tax -
                              formData.pf -
                              formData.other
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition font-semibold"
                    >
                      Generate Payslip
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