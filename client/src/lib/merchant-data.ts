import {
  addDoc,
  collection,
  getDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { notifyAdmins, addNotification } from "./notifications";

const mapDocs = <T = DocumentData>(snap: any): T[] =>
  snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];

export interface ProductOptionChoice {
  label: string;
}

export interface ProductOption {
  type: "multiple_choice" | "text" | "toggle";
  title: string;
  placeholder?: string;
  required: boolean;
  choices?: ProductOptionChoice[];
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  productType: string;
  category: string;
  promoBadge?: string | null;
  images?: string[] | null;
  status: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  merchantId: string;
  customerId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  status: string;
  deliveryMethod?: string;
  customerNote?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: string;
  message: string;
  createdAt?: any;
}

export interface Transaction {
  id: string;
  merchantId: string;
  amount: number;
  type: "credit" | "debit";
  description?: string;
  status?: string;
  createdAt?: any;
}

export interface Withdrawal {
  id: string;
  merchantId: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  createdAt?: any;
  processedAt?: any;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  merchantId?: string;
  rating: number;
  comment?: string | null;
  createdAt?: any;
}

export async function getMerchantProducts(merchantId: string) {
  const q = query(collection(db, "products"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return mapDocs<Product>(snap);
}

export async function addProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const ref = await addDoc(collection(db, "products"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await updateDoc(doc(db, "products", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}

export async function setProductVisibility(id: string, isActive: boolean) {
  await updateProduct(id, { status: isActive ? "active" : "hidden" });
}

export async function saveProductOptions(productId: string, options: ProductOption[]) {
  const optionsCol = collection(db, "products", productId, "options");
  // Delete existing options then re-add (simple approach)
  const existing = await getDocs(optionsCol);
  await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));

  await Promise.all(
    options.map((opt) =>
      addDoc(optionsCol, {
        ...opt,
        createdAt: serverTimestamp(),
      })
    )
  );
}

export async function getProductOptions(productId: string): Promise<ProductOption[]> {
  const snap = await getDocs(collection(db, "products", productId, "options"));
  return mapDocs<ProductOption>(snap);
}

// Orders
export async function getMerchantOrders(merchantId: string) {
  const q = query(collection(db, "orders"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return mapDocs<Order>(snap);
}

export async function updateOrderStatus(orderId: string, status: string) {
  await updateDoc(doc(db, "orders", orderId), { status, updatedAt: serverTimestamp() });
}

export async function getOrderMessages(orderId: string) {
  const snap = await getDocs(collection(db, "orders", orderId, "messages"));
  return mapDocs<OrderMessage>(snap);
}


export async function addOrderMessage(orderId: string, senderId: string, senderType: string, message: string) {
  await addDoc(collection(db, "orders", orderId, "messages"), {
    senderId,
    senderType,
    message,
    createdAt: serverTimestamp(),
  });

  // If merchant sends message, notify customer
  if (senderType === "merchant") {
    // Get order details to find customerId
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      const customerId = orderData.customerId;

      await addNotification(
        customerId,
        "customer",
        "رسالة جديدة من المتجر",
        `لديك رسالة جديدة بخصوص الطلب رقم ${orderData.orderNumber}: ${message}`,
        "order",
        `/orders/${orderId}` // Assuming customer app route
      );
    }
  }
}

// Transactions & withdrawals
export async function getMerchantTransactions(merchantId: string) {
  const q = query(collection(db, "transactions"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return mapDocs<Transaction>(snap);
}

export async function requestWithdrawal(merchantId: string, amount: number) {
  await addDoc(collection(db, "withdrawals"), {
    merchantId,
    amount,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // Notify admins
  // Fetch store name first for better notification
  const merchantSnap = await getDoc(doc(db, "merchants", merchantId));
  const storeName = merchantSnap.exists() ? merchantSnap.data().storeName : "تاجر";

  await notifyAdmins(
    "طلب سحب جديد",
    `قام ${storeName} بطلب سحب مبلغ ${amount} ر.س`,
    "withdrawal",
    "/admin/withdrawals"
  );
}

// Reviews
export async function getMerchantReviews(merchantId: string) {
  const q = query(collection(db, "reviews"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return mapDocs<Review>(snap);
}

// Single merchant profile helper
export async function getMerchantProfile(merchantId: string) {
  const snap = await getDoc(doc(db, "merchants", merchantId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}




