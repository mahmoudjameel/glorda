"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOtp = exports.requestOtp = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const authentica_1 = require("./authentica");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const AUTHENTICA_API_KEY = process.env.AUTHENTICA_API_KEY || functions.config().authentica?.key || "";
console.log("[Setup] Authentica API Key present:", !!AUTHENTICA_API_KEY);
const authenticaService = new authentica_1.AuthenticaService(AUTHENTICA_API_KEY);
const normalizePhone = (phone) => {
    let cleaned = phone.trim().replace(/\s+/g, "");
    if (cleaned.startsWith("05") && cleaned.length === 10) {
        return "966" + cleaned.substring(1);
    }
    if (cleaned.startsWith("5") && cleaned.length === 9) {
        return "966" + cleaned;
    }
    return cleaned;
};
const denormalizePhone = (phone) => {
    if (phone.startsWith("966") && phone.length === 12) {
        return "0" + phone.substring(3);
    }
    return phone;
};
const generateNumericId = (docId) => {
    return parseInt(docId.slice(0, 10), 36);
};
exports.requestOtp = functions.https.onCall(async (data, context) => {
    const { phone: rawPhone } = data;
    if (!rawPhone) {
        throw new functions.https.HttpsError("invalid-argument", "Phone number is required");
    }
    const phone = normalizePhone(rawPhone);
    const result = await authenticaService.sendOTP(phone);
    if (!result.success) {
        console.error("[requestOtp] Authentica Error:", result.message, result.data);
        throw new functions.https.HttpsError("internal", result.message || "Failed to send OTP");
    }
    return { success: true, message: result.message };
});
exports.checkOtp = functions.https.onCall(async (data, context) => {
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
    try {
        const normalizedPhone = phone;
        const dbPhone = denormalizePhone(phone);
        console.log(`[checkOtp] Searching for user: ${dbPhone} or ${normalizedPhone}`);
        const merchantsSnap = await db.collection("merchants")
            .where("mobile", "in", [dbPhone, normalizedPhone])
            .limit(1).get();
        let user = null;
        let userType = "customer";
        if (!merchantsSnap.empty) {
            const data = merchantsSnap.docs[0].data();
            const docId = merchantsSnap.docs[0].id;
            let numericId = data.id;
            if (!numericId || typeof numericId !== "number") {
                numericId = generateNumericId(docId);
                await merchantsSnap.docs[0].ref.update({ id: numericId });
            }
            user = { ...data, id: numericId };
            userType = "merchant";
        }
        else {
            const customersSnap = await db.collection("customers")
                .where("mobile", "in", [dbPhone, normalizedPhone])
                .limit(1).get();
            if (!customersSnap.empty) {
                const data = customersSnap.docs[0].data();
                const docId = customersSnap.docs[0].id;
                let numericId = data.id;
                if (!numericId || typeof numericId !== "number") {
                    numericId = generateNumericId(docId);
                    await customersSnap.docs[0].ref.update({ id: numericId });
                }
                user = { ...data, id: numericId };
                userType = "customer";
            }
            else {
                console.log(`[checkOtp] Registering NEW customer for phone: ${dbPhone}`);
                const newCustomerData = {
                    name: name || dbPhone,
                    mobile: dbPhone,
                    email: null,
                    city: null,
                };
                const docRef = await db.collection("customers").add({
                    ...newCustomerData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                const numericId = generateNumericId(docRef.id);
                await docRef.update({ id: numericId });
                user = { id: numericId, ...newCustomerData };
                userType = "customer";
            }
        }
        const uid = `${userType}_${user.id}`;
        const userRef = db.collection("users").doc(uid);
        console.log(`[checkOtp] Ensuring user profile for UID: ${uid}`);
        await userRef.set({
            role: userType,
            customerId: user.id,
            name: user.name || dbPhone,
            mobile: dbPhone,
            email: user.email || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const userDoc = await userRef.get();
        if (!userDoc.data()?.createdAt) {
            await userRef.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
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
    }
    catch (error) {
        console.error("[checkOtp] Critical Error in business logic:", error.message, error.stack);
        throw new functions.https.HttpsError("internal", error.message || "Failed to process user data");
    }
});
//# sourceMappingURL=index.js.map