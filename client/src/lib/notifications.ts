import { db } from "./firebase";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch,
    Timestamp,
    onSnapshot
} from "firebase/firestore";

export interface Notification {
    id: string;
    recipientId: string;
    recipientRole: "merchant" | "admin" | "customer";
    title: string;
    body: string;
    type: "system" | "order" | "withdrawal" | "verification" | "review";
    link?: string;
    isRead: boolean;
    createdAt: any;
    metadata?: Record<string, any>;
}

const COLLECTION_NAME = "notifications";

// Add a new notification
export const addNotification = async (
    recipientId: string,
    recipientRole: Notification["recipientRole"],
    title: string,
    body: string,
    type: Notification["type"],
    link?: string,
    metadata?: Record<string, any>
) => {
    try {
        const notificationsRef = collection(db, COLLECTION_NAME);
        await addDoc(notificationsRef, {
            recipientId,
            recipientRole,
            title,
            body,
            type,
            link,
            isRead: false,
            createdAt: serverTimestamp(),
            metadata
        });
    } catch (error) {
        console.error("Error adding notification:", error);
    }
};

// Fetch notifications for a user
export const getUserNotifications = async (userId: string, limitCount = 20) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("recipientId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Notification[];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

// Get unread count
export const getUnreadCount = async (userId: string) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("recipientId", "==", userId),
            where("isRead", "==", false)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error counting unread notifications:", error);
        return 0;
    }
};

// Mark as read
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isRead: true,
            readAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

// Mark all as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("recipientId", "==", userId),
            where("isRead", "==", false)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                isRead: true,
                readAt: serverTimestamp()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
};

// Notify all admins (helper)
export const notifyAdmins = async (title: string, body: string, type: Notification["type"], link?: string, metadata?: Record<string, any>) => {
    try {
        // First fetch all admins
        const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
        const adminsSnapshot = await getDocs(adminsQuery);

        const batch = writeBatch(db);
        const notificationsRef = collection(db, COLLECTION_NAME);

        adminsSnapshot.docs.forEach(adminDoc => {
            const newDocRef = doc(notificationsRef);
            batch.set(newDocRef, {
                recipientId: adminDoc.id,
                recipientRole: "admin",
                title,
                body,
                type,
                link,
                isRead: false,
                createdAt: serverTimestamp(),
                metadata
            });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error notifying admins:", error);
    }
};
