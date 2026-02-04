import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { AuthenticaService } from "./authentica";
import { TapService } from "./tap";
import { sendPushToUser, sendPushToAllCustomers } from "./notifications";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// API Key prioritizes process.env (for .env files) then functions.config()
const AUTHENTICA_API_KEY = process.env.AUTHENTICA_API_KEY || functions.config().authentica?.key || "";
console.log("[Setup] Authentica API Key present:", !!AUTHENTICA_API_KEY);
const authenticaService = new AuthenticaService(AUTHENTICA_API_KEY);

const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY || functions.config().tap?.secret || "";
const tapService = new TapService(TAP_SECRET_KEY);

/**
 * Normalizes phone numbers to +966 format
 */
const normalizePhone = (phone: string): string => {
    let cleaned = phone.trim().replace(/\s+/g, "");
    if (cleaned.startsWith("05") && cleaned.length === 10) {
        return "966" + cleaned.substring(1);
    }
    if (cleaned.startsWith("5") && cleaned.length === 9) {
        return "966" + cleaned;
    }
    return cleaned;
};

/**
 * Converts 9665... to 05... for database storage
 */
const denormalizePhone = (phone: string): string => {
    if (phone.startsWith("966") && phone.length === 12) {
        return "0" + phone.substring(3);
    }
    return phone;
};

/**
 * Generates a numeric ID from a document ID, matching the app's logic
 */
const generateNumericId = (docId: string): number => {
    return parseInt(docId.slice(0, 10), 36);
};

/**
 * Request OTP Cloud Function
 * Callable from mobile/web app
 */
export const requestOtp = functions.https.onCall(async (data: any, context: any) => {
    const { phone: rawPhone } = data;
    if (!rawPhone) {
        throw new functions.https.HttpsError("invalid-argument", "Phone number is required");
    }

    const phone = normalizePhone(rawPhone);
    const dbPhone = denormalizePhone(phone);
    const { email, isRegistration } = data;

    if (isRegistration) {
        // Check if phone exists (either 05... or 9665...)
        const merchantsPhoneSnap = await db.collection("merchants")
            .where("mobile", "in", [dbPhone, phone])
            .limit(1).get();
        if (!merchantsPhoneSnap.empty) {
            throw new functions.https.HttpsError("already-exists", "رقم الجوال مسجل بالفعل");
        }

        const customersPhoneSnap = await db.collection("customers")
            .where("mobile", "in", [dbPhone, phone])
            .limit(1).get();
        if (!customersPhoneSnap.empty) {
            throw new functions.https.HttpsError("already-exists", "رقم الجوال مسجل بالفعل");
        }

        // Check if email exists
        if (email) {
            const merchantsEmailSnap = await db.collection("merchants")
                .where("email", "==", email)
                .limit(1).get();
            if (!merchantsEmailSnap.empty) {
                throw new functions.https.HttpsError("already-exists", "البريد الإلكتروني مسجل بالفعل");
            }

            const customersEmailSnap = await db.collection("customers")
                .where("email", "==", email)
                .limit(1).get();
            if (!customersEmailSnap.empty) {
                throw new functions.https.HttpsError("already-exists", "البريد الإلكتروني مسجل بالفعل");
            }
        }
    }

    const result = await authenticaService.sendOTP(phone);
    if (!result.success) {
        console.error("[requestOtp] Authentica Error:", result.message, result.data);
        throw new functions.https.HttpsError("internal", result.message || "Failed to send OTP");
    }

    return { success: true, message: result.message };
});

/**
 * Verify OTP Cloud Function
 * Callable from mobile/web app
 */
export const checkOtp = functions.https.onCall(async (data: any, context: any) => {
    const { phone: rawPhone, otp, name } = data;
    if (!rawPhone || !otp) {
        throw new functions.https.HttpsError("invalid-argument", "Phone and OTP are required");
    }

    const phone = normalizePhone(rawPhone);
    console.log(`[checkOtp] Attempting verification for: ${phone}, OTP: ${otp}`);
    const result = await authenticaService.verifyOTP(phone, otp);
    if (!result.success) {
        console.error("[checkOtp] Authentica Verification Failed:", result.message, result.data);
        throw new functions.https.HttpsError("permission-denied", result.message || "Invalid OTP");
    }

    // OTP verified successfully, now get or create user
    try {
        const { email, password } = data;
        const normalizedPhone = phone; // 966...
        const dbPhone = denormalizePhone(phone); // 05...

        console.log(`[checkOtp] Searching for user: ${dbPhone} or ${normalizedPhone}`);

        // Search Merchants
        const merchantsSnap = await db.collection("merchants")
            .where("mobile", "in", [dbPhone, normalizedPhone])
            .limit(1).get();

        let user: any = null;
        let userType: "merchant" | "customer" = "customer";

        if (!merchantsSnap.empty) {
            const doc = merchantsSnap.docs[0];
            const data = doc.data();
            const docId = doc.id;

            // Ensure we have a numeric ID if possible
            let numericId = data.id;
            if (!numericId || typeof numericId !== "number") {
                numericId = generateNumericId(docId);
            }

            const updateData: any = { id: numericId };
            if (name && name !== data.name) updateData.name = name;
            if (email && email !== data.email) updateData.email = email;

            await doc.ref.update(updateData);

            user = { ...data, ...updateData };
            userType = "merchant";
        } else {
            // Search Customers
            const customersSnap = await db.collection("customers")
                .where("mobile", "in", [dbPhone, normalizedPhone])
                .limit(1).get();

            if (!customersSnap.empty) {
                const doc = customersSnap.docs[0];
                const data = doc.data();
                const docId = doc.id;

                // Ensure we have a numeric ID
                let numericId = data.id;
                if (!numericId || typeof numericId !== "number") {
                    numericId = generateNumericId(docId);
                }

                const updateData: any = { id: numericId };
                if (name && name !== data.name) updateData.name = name;
                if (email && email !== data.email) updateData.email = email;

                await doc.ref.update(updateData);

                user = { ...data, ...updateData };
                userType = "customer";
            } else {
                // Auto-register or Register with provided credentials
                console.log(`[checkOtp] Registering NEW customer for phone: ${dbPhone}`);
                const newCustomerData: any = {
                    name: name || dbPhone,
                    mobile: dbPhone,
                    email: email || null,
                    city: null,
                };

                const docRef = await db.collection("customers").add({
                    ...newCustomerData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Match the app's numeric ID logic
                const numericId = generateNumericId(docRef.id);
                await docRef.update({ id: numericId });

                user = { id: numericId, ...newCustomerData };
                userType = "customer";

                // If password provided, create standard Firebase Auth user as well
                if (password) {
                    try {
                        const firebaseEmail = email || `${dbPhone}@glorda.com`;
                        await auth.createUser({
                            uid: `${userType}_${numericId}`,
                            email: firebaseEmail,
                            password: password,
                            displayName: name || dbPhone,
                        });
                        console.log(`[checkOtp] Created Firebase Auth user with email: ${firebaseEmail}`);
                    } catch (authError: any) {
                        console.error("[checkOtp] Error creating Auth user:", authError.message);
                        // Continue anyway, as the custom token will still work
                    }
                }
            }
        }

        // Ensure UID format matches: userType_numericId
        const uid = `${userType}_${user.id}`;
        const userRef = db.collection("users").doc(uid);

        // Always ensure the user profile document is correct and exists
        console.log(`[checkOtp] Ensuring user profile for UID: ${uid}`);
        await userRef.set({
            role: userType,
            customerId: user.id,
            name: user.name || dbPhone,
            mobile: dbPhone, // Always store as 05...
            email: user.email || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // If new, set createdAt
        const userDoc = await userRef.get();
        if (!userDoc.data()?.createdAt) {
            await userRef.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        // Create Firebase custom token
        const customToken = await auth.createCustomToken(`${userType}_${user.id}`, {
            userId: user.id,
            userType: userType,
            phone: phone,
        });

        return {
            success: true,
            token: customToken,
            user: user,
            type: userType
        };
    } catch (error: any) {
        console.error("[checkOtp] Critical Error in business logic:", error.message, error.stack);
        throw new functions.https.HttpsError("internal", error.message || "Failed to process user data");
    }
});

/**
 * Create Tap Charge
 */
export const createTapCharge = functions.https.onCall(async (data: any, context: any) => {
    const { amount, currency, customer, orderId, redirectUrl } = data;

    if (!amount || !currency || !customer || !orderId || !redirectUrl) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required transaction fields");
    }

    try {
        const result = await tapService.createCharge({
            amount,
            currency,
            customer,
            order_id: orderId,
            redirect_url: redirectUrl,
            post_url: `https://${process.env.GCLOUD_PROJECT}.cloudfunctions.net/tapWebhook` // Optional webhook
        });
        return result;
    } catch (error: any) {
        console.error("[createTapCharge] Error:", error.message);
        throw new functions.https.HttpsError("internal", error.message || "Failed to create payment");
    }
});

/**
 * Verify Tap Payment
 */
export const verifyTapPayment = functions.https.onCall(async (data: any, context: any) => {
    const { chargeId } = data;
    if (!chargeId) {
        throw new functions.https.HttpsError("invalid-argument", "chargeId is required");
    }

    try {
        const result = await tapService.verifyCharge(chargeId);
        return result;
    } catch (error: any) {
        console.error("[verifyTapPayment] Error:", error.message);
        throw new functions.https.HttpsError("internal", error.message || "Failed to verify payment");
    }
});

/**
 * Trigger: When Order Status Changes
 */
export const onOrderUpdate = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // If status hasn't changed, do nothing
        if (before.status === after.status) {
            return null;
        }

        const customerId = after.customerId; // This is the numeric ID e.g. 104
        // Logic to get the User UID from customerId is handled in sendPushToUser (it searches users by customerId)

        const statusMap: Record<string, string> = {
            'pending': 'قيد الانتظار',
            'processing': 'قيد التجهيز',
            'shipped': 'تم الشحن',
            'delivered': 'تم التوصيل',
            'cancelled': 'ملغي'
        };

        const statusText = statusMap[after.status] || after.status;
        const title = "تحديث حالة الطلب";
        const body = `تغيرت حالة طلبك #${after.orderNumber || context.params.orderId} إلى ${statusText}`;

        await sendPushToUser(customerId, title, body, { orderId: context.params.orderId, type: 'order' });

        // حفظ إشعار الطلب في مجموعة notifications ليظهر في شاشة الإشعارات بالتطبيق
        const customerIdStr = typeof customerId === 'string' ? customerId : String(customerId);
        await db.collection('notifications').add({
            recipientType: 'customer',
            recipientId: customerIdStr,
            title,
            body,
            actionType: 'order_status',
            actionRef: { orderId: context.params.orderId, orderNumber: after.orderNumber },
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
    });

/**
 * Trigger: When a New Direct Message is Created
 */
export const onMessageCreate = functions.firestore
    .document('directConversations/{conversationId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const conversationId = context.params.conversationId;

        // Get conversation to find participants
        const conversationDoc = await db.collection('directConversations').doc(conversationId).get();
        if (!conversationDoc.exists) {
            console.log('Conversation not found');
            return null;
        }

        const conversation = conversationDoc.data();
        if (!conversation) return null;

        // Determine recipient
        let recipientId;
        if (message.senderId === conversation.customerId) {
            // Sender is customer, notify merchant
            // NOTE: Merchants might not have App Push Tokens yet if they only use Web Panel.
            // But if they log in to the app, they will.
            recipientId = conversation.merchantId;
        } else {
            // Sender is merchant, notify customer
            recipientId = conversation.customerId;
        }

        const title = "رسالة جديدة";
        const body = message.message || "لقد تلقيت رسالة جديدة";

        await sendPushToUser(recipientId, title, body, { conversationId, type: 'chat' });
        return null;
    });


/**
 * Trigger: Order Chat Messages
 */
export const onOrderMessageCreate = functions.firestore
    .document('orders/{orderId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const orderId = context.params.orderId;

        // Get order to find participants
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) return null;
        const order = orderDoc.data();
        if (!order) return null;

        // Determine recipient logic similar to above
        // Assuming message has senderId
        let recipientId;
        // Logic depends on who sent it. 
        // If order.customerId matches sender, notify merchant (order.merchantId)
        // If sender is merchant, notify customer.

        if (String(message.senderId) === String(order.customerId)) {
            recipientId = order.merchantId;
        } else {
            recipientId = order.customerId;
        }

        const title = `رسالة جديدة بخصوص الطلب #${order.orderNumber}`;
        const body = message.message || "رسالة جديدة";

        await sendPushToUser(recipientId, title, body, { orderId, type: 'order_chat' });
        return null;
    });

/**
 * Callable: Send promotional ad as push notification to all customers
 * Called from admin panel when admin clicks "إرسال إشعار" on an ad.
 */
export const sendPromotionalPush = functions.https.onCall(async (data: { adId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'غير مصرح');
    }
    const { adId } = data;
    if (!adId) {
        throw new functions.https.HttpsError('invalid-argument', 'معرف الإعلان مطلوب');
    }

    const adDoc = await db.collection('promotionalAds').doc(adId).get();
    if (!adDoc.exists || !adDoc.data()) {
        throw new functions.https.HttpsError('not-found', 'الإعلان غير موجود');
    }

    const ad = adDoc.data()!;
    const title = ad.title || 'غلوردا';
    const body = ad.body || '';

    const sent = await sendPushToAllCustomers(title, body, { adId });

    await db.collection('promotionalAds').doc(adId).update({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `تم الإرسال إلى ${sent} جهاز`, sent };
});

/**
 * Scheduled: Check Occasion Reminders
 * Runs every hour
 */
export const checkOccasionReminders = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Query occasions where reminderDate is between now and +1 hour
    // Note: This requires 'reminderDate' to be a Firestore Timestamp
    const query = db.collection('occasions')
        .where('reminderDate', '>=', now)
        .where('reminderDate', '<=', oneHourLater);

    const snapshot = await query.get();

    if (snapshot.empty) {
        console.log('No occasions to remind.');
        return null;
    }

    const promises = snapshot.docs.map(async (doc) => {
        const occasion = doc.data();
        const title = "تذكير مناسبة";
        const body = `اقترب موعد مناسبة: ${occasion.title}`;

        if (occasion.userId || occasion.customerId) {
            await sendPushToUser(occasion.userId || occasion.customerId, title, body, { occasionId: doc.id, type: 'occasion' });
        }
    });

    await Promise.all(promises);
    return null;
});
