// src/pages/Performance.js - ROLE-BASED PERFORMANCE REVIEWS
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addPerformanceReview,
  getAllPerformanceReviews,
  updatePerformanceReview,
  deletePerformanceReview,
  calculateOverallScore,
} from "../firebaseHelpers/performance";
import { getAllEmployees } from "../firebaseHelpers/employees";

export default function Performance() {
  const { currentUser, userRole } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Permission check
  const canManage = ["HR", "Senior Manager", "Admin", "Management Admin"].includes(userRole);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    period: "",
    quality: 5,
    productivity: 5,
    teamwork: 5,
    communication: 5,
    leadership: 5,
    comments: "",
  });

  useEffect(() => {
    if (!canManage) {
      alert("Access Denied: Only HR, Senior Manager, Admin, and Management Admin can access performance reviews");
      window.location.href = "/dashboard";
      return;
    }
    fetchData();
  }, [canManage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsData, employeesData] = await Promise.all([
        getAllPerformanceReviews(),
        getAllEmployees(),
      ]);
      setReviews(reviewsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes("quality") || name.includes("productivity") || 
              name.includes("teamwork") || name.includes("communication") || 
              name.includes("leadership") 
        ? Number(value) 
        : value,
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

  const handleAddReview = () => {
    setEditMode(false);
    setFormData({
      employeeId: "",
      employeeName: "",
      period: "",
      quality: 5,
      productivity: 5,
      teamwork: 5,
      communication: 5,
      leadership: 5,
      comments: "",
    });
    setShowModal(true);
  };

  const handleEditReview = (review) => {
    setEditMode(true);
    setCurrentReview(review);
    setFormData({
      employeeId: review.employeeId,
      employeeName: review.employeeName,
      period: review.period,
      quality: review.ratings?.quality || 5,
      productivity: review.ratings?.productivity || 5,
      teamwork: review.ratings?.teamwork || 5,
      communication: review.ratings?.communication || 5,
      leadership: review.ratings?.leadership || 5,
      comments: review.comments || "",
    });
    setShowModal(true);
  };

  const handleDeleteReview = async (id, employeeName) => {
    if (window.confirm(`Delete performance review for ${employeeName}?`)) {
      try {
        await deletePerformanceReview(id);
        alert("Review deleted successfully!");
        fetchData();
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert("Please select an employee");
      return;
    }
    if (!formData.period.trim()) {
      alert("Please enter review period");
      return;
    }

    const ratings = {
      quality: formData.quality,
      productivity: formData.productivity,
      teamwork: formData.teamwork,
      communication: formData.communication,
      leadership: formData.leadership,
    };

    const overallScore = calculateOverallScore(ratings);

    try {
      if (editMode) {
        await updatePerformanceReview(currentReview.id, {
          period: formData.period,
          ratings,
          comments: formData.comments,
          overallScore,
        });
        alert("Review updated successfully!");
      } else {
        await addPerformanceReview({
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          reviewerId: currentUser.uid,
          reviewerName: currentUser.name || currentUser.email,
          period: formData.period,
          ratings,
          comments: formData.comments,
          overallScore,
        });
        alert("Review added successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving review:", error);
      alert("Failed to save review");
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      employeeName: "",
      period: "",
      quality: 5,
      productivity: 5,
      teamwork: 5,
      communication: 5,
      leadership: 5,
      comments: "",
    });
    setCurrentReview(null);
    setEditMode(false);
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) =>
    review.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading performance data...</div>
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
              <h1 className="text-3xl font-bold text-gray-800">Performance Reviews</h1>
              <p className="text-gray-600 mt-1">Evaluate and track employee performance</p>
            </div>
            <button
              onClick={handleAddReview}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold flex items-center justify-center"
            >
              <span className="text-xl mr-2">+</span>
              Add Review
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="text-gray-600 text-sm font-medium">Total Reviews</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{reviews.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium">Average Score</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {reviews.length > 0
                ? (
                    reviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) /
                    reviews.length
                  ).toFixed(1)
                : "0.0"}
              /10
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm font-medium">Employees Reviewed</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {new Set(reviews.map((r) => r.employeeId)).size}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Reviews
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee name..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-gray-600 mb-2">No reviews found</p>
              <p className="text-gray-500">Add your first performance review to get started</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-purple-500"
              >
                {/* Employee Info */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                    {review.employeeName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{review.employeeName}</h3>
                    <p className="text-sm text-gray-600">{review.period}</p>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                  <div className={`text-3xl font-bold ${getRatingColor(review.overallScore)}`}>
                    {review.overallScore?.toFixed(1)}/10
                  </div>
                </div>

                {/* Ratings Breakdown */}
                <div className="space-y-2 mb-4">
                  {review.ratings && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quality:</span>
                        <span className="font-semibold">{review.ratings.quality}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Productivity:</span>
                        <span className="font-semibold">{review.ratings.productivity}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Teamwork:</span>
                        <span className="font-semibold">{review.ratings.teamwork}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Communication:</span>
                        <span className="font-semibold">{review.ratings.communication}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Leadership:</span>
                        <span className="font-semibold">{review.ratings.leadership}/10</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Comments */}
                {review.comments && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Comments:</p>
                    <p className="text-sm text-gray-800">{review.comments}</p>
                  </div>
                )}

                {/* Reviewer Info */}
                <div className="text-xs text-gray-500 mb-4">
                  Reviewed by: {review.reviewerName}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditReview(review)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id, review.employeeName)}
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
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editMode ? "Edit Performance Review" : "Add Performance Review"}
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

                  {/* Period */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="period"
                      value={formData.period}
                      onChange={handleInputChange}
                      placeholder="e.g., Q1 2025, January 2025"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Ratings */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Performance Ratings (1-10)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {["quality", "productivity", "teamwork", "communication", "leadership"].map((rating) => (
                        <div key={rating}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {rating}
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              name={rating}
                              value={formData[rating]}
                              onChange={handleInputChange}
                              min="1"
                              max="10"
                              className="flex-1"
                            />
                            <span className="font-bold text-lg text-gray-800 w-12 text-right">
                              {formData[rating]}/10
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Additional feedback or notes..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Overall Score Preview */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Calculated Overall Score:</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {calculateOverallScore({
                        quality: formData.quality,
                        productivity: formData.productivity,
                        teamwork: formData.teamwork,
                        communication: formData.communication,
                        leadership: formData.leadership,
                      }).toFixed(1)}
                      /10
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"
                    >
                      {editMode ? "Update Review" : "Add Review"}
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