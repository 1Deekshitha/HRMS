// src/firebaseHelpers/payroll.js
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const payrollCollection = collection(db, "payroll");

// Generate payslip for an employee
export const generatePayslip = async (payslipData) => {
  // payslipData: { employeeId, employeeName, month, year, basicSalary, allowances, deductions, netSalary, status }
  const ref = await addDoc(payrollCollection, {
    ...payslipData,
    generatedAt: serverTimestamp(),
    status: payslipData.status || "pending", // pending, paid
  });
  return ref.id;
};

// Get all payslips
export const getAllPayslips = async () => {
  const q = query(payrollCollection, orderBy("generatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get payslips for specific employee
export const getPayslipsByEmployee = async (employeeId) => {
  const q = query(
    payrollCollection,
    where("employeeId", "==", employeeId),
    orderBy("generatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get payslips for specific month/year
export const getPayslipsByPeriod = async (month, year) => {
  const q = query(
    payrollCollection,
    where("month", "==", month),
    where("year", "==", year)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Update payslip status
export const updatePayslipStatus = async (id, status) => {
  const ref = doc(db, "payroll", id);
  await updateDoc(ref, { 
    status,
    paidAt: status === "paid" ? serverTimestamp() : null
  });
};

// Delete payslip
export const deletePayslip = async (id) => {
  const ref = doc(db, "payroll", id);
  await deleteDoc(ref);
};

// Calculate salary breakdown
export const calculateSalary = (basicSalary, allowances = {}, deductions = {}) => {
  const allowanceTotal = Object.values(allowances).reduce((sum, val) => sum + Number(val || 0), 0);
  const deductionTotal = Object.values(deductions).reduce((sum, val) => sum + Number(val || 0), 0);
  const grossSalary = Number(basicSalary) + allowanceTotal;
  const netSalary = grossSalary - deductionTotal;
  
  return {
    basicSalary: Number(basicSalary),
    allowanceTotal,
    deductionTotal,
    grossSalary,
    netSalary
  };
};