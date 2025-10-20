// src/firebaseHelpers/employees.js
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
} from "firebase/firestore";
import { db } from "../firebase";

const employeesCollection = collection(db, "employees");

export const addEmployee = async (employee) => {
  // { name, email, department, salary, designation }
  const ref = await addDoc(employeesCollection, {
    ...employee,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

export const getAllEmployees = async () => {
  const snap = await getDocs(employeesCollection);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEmployee = async (id) => {
  const ref = doc(db, "employees", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Employee not found");
  return { id: snap.id, ...snap.data() };
};

export const updateEmployee = async (id, data) => {
  const ref = doc(db, "employees", id);
  await updateDoc(ref, data);
};

export const deleteEmployee = async (id) => {
  const ref = doc(db, "employees", id);
  await deleteDoc(ref);
};
