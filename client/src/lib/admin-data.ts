import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

const mapDocs = <T = DocumentData>(snap: any): T[] =>
  snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];

export async function getBanners() {
  const snap = await getDocs(collection(db, "banners"));
  return mapDocs<Banners>(snap);
}

export async function addBanner(data: Partial<Banners>) {
  const ref = await addDoc(collection(db, "banners"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBanner(id: string, data: Partial<Banners>) {
  await updateDoc(doc(db, "banners", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBanner(id: string) {
  await deleteDoc(doc(db, "banners", id));
}

export async function getCategories() {
  const snap = await getDocs(collection(db, "categories"));
  return mapDocs<Categories>(snap);
}

export async function addCategory(data: Partial<Categories>) {
  const ref = await addDoc(collection(db, "categories"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<Categories>) {
  await updateDoc(doc(db, "categories", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, "categories", id));
}

export async function getCities() {
  const snap = await getDocs(collection(db, "cities"));
  return mapDocs<Cities>(snap);
}

export async function addCity(data: Partial<Cities>) {
  const ref = await addDoc(collection(db, "cities"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCity(id: string, data: Partial<Cities>) {
  await updateDoc(doc(db, "cities", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCity(id: string) {
  await deleteDoc(doc(db, "cities", id));
}

export async function getDiscountCodes() {
  const snap = await getDocs(collection(db, "discountCodes"));
  return mapDocs<DiscountCodes>(snap);
}

export async function addDiscountCode(data: Partial<DiscountCodes>) {
  const ref = await addDoc(collection(db, "discountCodes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    usedCount: 0,
  });
  return ref.id;
}

export async function updateDiscountCode(id: string, data: Partial<DiscountCodes>) {
  await updateDoc(doc(db, "discountCodes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDiscountCode(id: string) {
  await deleteDoc(doc(db, "discountCodes", id));
}

// Local types for admin settings
export interface Banners {
  id: string;
  title: string;
  image: string;
  link: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
}

export interface Categories {
  id: string;
  name: string;
  nameEn?: string | null;
  icon?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
}

export interface Cities {
  id: string;
  name: string;
  nameEn?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
}

export interface DiscountCodes {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  usedCount?: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt?: any;
}

// Promotional ads (إعلانات ترويجية) — عنوان ونص وترتيب، تُرسل كبوش نوتيفيكيشن
export interface PromotionalAd {
  id: string;
  title: string;
  body: string;
  order: number;
  isActive: boolean;
  sentAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export async function getPromotionalAds(): Promise<PromotionalAd[]> {
  const snap = await getDocs(collection(db, "promotionalAds"));
  const ads = mapDocs<PromotionalAd>(snap);
  return ads.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addPromotionalAd(data: Partial<PromotionalAd>) {
  const ref = await addDoc(collection(db, "promotionalAds"), {
    title: data.title ?? "",
    body: data.body ?? "",
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePromotionalAd(id: string, data: Partial<PromotionalAd>) {
  const { sentAt, ...rest } = data as PromotionalAd & { sentAt?: any };
  await updateDoc(doc(db, "promotionalAds", id), {
    ...rest,
    ...(sentAt !== undefined && { sentAt }),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePromotionalAd(id: string) {
  await deleteDoc(doc(db, "promotionalAds", id));
}






