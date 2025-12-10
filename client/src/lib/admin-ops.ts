import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

const mapDocs = <T = DocumentData>(snap: any): T[] =>
  snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];

// Admin management (list admins only; creation handled manually if needed)
export async function getAdmins() {
  const snap = await getDocs(collection(db, "admins"));
  return mapDocs<{ id: string; email: string; name?: string }>(snap);
}

export async function addAdmin(data: { email: string; name?: string }) {
  const ref = await addDoc(collection(db, "admins"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteAdmin(id: string) {
  await deleteDoc(doc(db, "admins", id));
}

// Merchants
export async function getMerchantsByStatus(status?: string) {
  const col = collection(db, "merchants");
  const snap = status
    ? await getDocs(query(col, where("status", "==", status)))
    : await getDocs(col);
  return mapDocs<any>(snap);
}

export async function updateMerchantStatus(id: string, status: string) {
  await updateDoc(doc(db, "merchants", id), { status, updatedAt: serverTimestamp() });
}

// Customers
export async function getCustomers() {
  const snap = await getDocs(collection(db, "customers"));
  return mapDocs<any>(snap);
}

// Orders
export async function getAllOrders() {
  const snap = await getDocs(collection(db, "orders"));
  return mapDocs<any>(snap);
}

export async function updateOrderStatusAdmin(orderId: string, status: string) {
  await updateDoc(doc(db, "orders", orderId), { status, updatedAt: serverTimestamp() });
}

// Withdrawals
export async function getWithdrawals() {
  const snap = await getDocs(collection(db, "withdrawals"));
  return mapDocs<any>(snap);
}

export async function updateWithdrawalStatus(id: string, status: "completed" | "rejected") {
  await updateDoc(doc(db, "withdrawals", id), { status, updatedAt: serverTimestamp() });
}

// Transactions
export async function getTransactions() {
  const snap = await getDocs(collection(db, "transactions"));
  return mapDocs<any>(snap);
}

// Settings key/value
export async function getSetting(key: string) {
  const snap = await getDocs(query(collection(db, "settings"), where("key", "==", key)));
  if (snap.docs.length === 0) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as any;
}

export async function setSetting(key: string, value: any) {
  // Use doc id = key for simplicity
  await updateDoc(doc(db, "settings", key), { value, updatedAt: serverTimestamp() }).catch(async () => {
    await addDoc(collection(db, "settings"), { key, value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}
