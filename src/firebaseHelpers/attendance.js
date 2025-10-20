// src/firebaseHelpers/attendance.js
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const attendanceCollection = collection(db, "attendance");

export const clockIn = async ({ uid, name }) => {
  const ref = await addDoc(attendanceCollection, {
    uid,
    name,
    type: "in",
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

export const clockOut = async ({ uid, name }) => {
  const ref = await addDoc(attendanceCollection, {
    uid,
    name,
    type: "out",
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

export const getAttendanceForUser = async (uid) => {
  const q = query(attendanceCollection, where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
