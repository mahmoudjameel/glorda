import {
  collection,
  addDoc,
  getDocs,
  getDoc, // Added import
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

// Notification types
import { addNotification } from "./notifications";

// ...

export async function updateMerchantStatus(id: string, status: string) {
  await updateDoc(doc(db, "merchants", id), { status, updatedAt: serverTimestamp() });

  // Notify merchant
  if (status === "active") {
    await addNotification(
      id,
      "merchant",
      "تم تفعيل حسابك",
      "تم تفعيل حساب التاجر الخاص بك بنجاح. يمكنك الآن البدء في استخدام لوحة التحكم.",
      "system",
      "/dashboard"
    );
  } else if (status === "rejected") {
    await addNotification(
      id,
      "merchant",
      "تم رفض طلب التسجيل",
      "عذراً، تم رفض طلب تسجيل حساب التاجر الخاص بك. يرجى التواصل مع الإدارة للمزيد من التفاصيل.",
      "system"
    );
  }
}

// ...

export async function updateWithdrawalStatus(id: string, status: "completed" | "rejected") {
  const withdrawalRef = doc(db, "withdrawals", id);
  await updateDoc(withdrawalRef, { status, updatedAt: serverTimestamp() });

  // Get withdrawal details to notify merchant
  const wDoc = await getDoc(withdrawalRef);
  if (wDoc.exists()) {
    const data = wDoc.data();
    const title = status === "completed" ? "تم الموافقة على السحب" : "تم رفض طلب السحب";
    const body = status === "completed"
      ? `تم تحويل مبلغ ${data.amount} ر.س إلى حسابك البنكي بنجاح.`
      : `تم رفض طلب سحب مبلغ ${data.amount} ر.س. يرجى مراجعة سبب الرفض او التواصل مع الإدارة.`;

    await addNotification(
      data.merchantId,
      "merchant",
      title,
      body,
      "withdrawal",
      "/dashboard/wallet"
    );
  }
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
