// src/firebaseHelpers/performance.js
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const performanceCollection = collection(db, "performance");
const goalsCollection = collection(db, "goals");

// ===== PERFORMANCE REVIEWS =====

// Add performance review
export const addPerformanceReview = async (reviewData) => {
  // reviewData: { employeeId, employeeName, reviewerId, reviewerName, period, ratings, comments, overallScore }
  const ref = await addDoc(performanceCollection, {
    ...reviewData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Get all performance reviews
export const getAllPerformanceReviews = async () => {
  const q = query(performanceCollection, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get reviews for specific employee
export const getReviewsByEmployee = async (employeeId) => {
  const q = query(
    performanceCollection,
    where("employeeId", "==", employeeId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Update performance review
export const updatePerformanceReview = async (id, data) => {
  const ref = doc(db, "performance", id);
  await updateDoc(ref, data);
};

// Delete performance review
export const deletePerformanceReview = async (id) => {
  const ref = doc(db, "performance", id);
  await deleteDoc(ref);
};

// ===== GOALS MANAGEMENT =====

// Add goal
export const addGoal = async (goalData) => {
  // goalData: { employeeId, employeeName, title, description, deadline, status, progress }
  const ref = await addDoc(goalsCollection, {
    ...goalData,
    status: goalData.status || "in-progress", // in-progress, completed, cancelled
    progress: goalData.progress || 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Get all goals
export const getAllGoals = async () => {
  const q = query(goalsCollection, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get goals for specific employee
export const getGoalsByEmployee = async (employeeId) => {
  const q = query(
    goalsCollection,
    where("employeeId", "==", employeeId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Update goal
export const updateGoal = async (id, data) => {
  const ref = doc(db, "goals", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete goal
export const deleteGoal = async (id) => {
  const ref = doc(db, "goals", id);
  await deleteDoc(ref);
};

// Calculate overall performance score
export const calculateOverallScore = (ratings) => {
  // ratings: { quality, productivity, teamwork, communication, leadership }
  const values = Object.values(ratings).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + Number(val), 0);
  return (sum / values.length).toFixed(2);
};