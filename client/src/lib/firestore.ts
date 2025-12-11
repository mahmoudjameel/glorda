import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic helpers for Firestore CRUD

export async function getDocData<T = DocumentData>(path: string): Promise<T | null> {
  const snapshot = await getDoc(doc(db, path));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function setDocData(path: string, data: Record<string, unknown>) {
  await setDoc(doc(db, path), {
    ...data,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateDocData(path: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, path), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function addCollectionDoc<T = DocumentData>(collectionPath: string, data: Record<string, unknown>) {
  const ref = await addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id as string;
}

export async function getCollectionWhere<T = DocumentData>(
  collectionPath: string,
  field: string,
  value: unknown
): Promise<T[]> {
  const q = query(collection(db, collectionPath), where(field, "==", value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

export async function getCollectionAll<T = DocumentData>(collectionPath: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionPath));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

export { serverTimestamp } from "firebase/firestore";

