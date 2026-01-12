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
exports.sendPushToUser = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const admin = __importStar(require("firebase-admin"));
const expo = new expo_server_sdk_1.Expo();
async function sendPushToUser(userId, title, body, data = {}) {
    try {
        console.log(`[Notification] Sending to user ${userId}: ${title} - ${body}`);
        const db = admin.firestore();
        let pushTokens = [];
        if (typeof userId === 'string' && (userId.startsWith('customer_') || userId.startsWith('merchant_'))) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data()?.pushToken) {
                pushTokens.push(userDoc.data()?.pushToken);
            }
        }
        else {
            const usersSnap = await db.collection('users')
                .where('customerId', '==', Number(userId))
                .limit(1)
                .get();
            if (!usersSnap.empty) {
                const userData = usersSnap.docs[0].data();
                if (userData.pushToken) {
                    pushTokens.push(userData.pushToken);
                }
            }
        }
        if (pushTokens.length === 0) {
            console.log(`[Notification] No push token found for user ${userId}`);
            return;
        }
        const messages = [];
        for (const token of pushTokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                console.error(`[Notification] Invalid Expo push token: ${token}`);
                continue;
            }
            messages.push({
                to: token,
                sound: 'default',
                title: title,
                body: body,
                data: data,
            });
        }
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error('[Notification] Error sending chunks:', error);
            }
        }
        console.log(`[Notification] Sent ${tickets.length} messages`);
    }
    catch (error) {
        console.error('[Notification] Error sending push:', error);
    }
}
exports.sendPushToUser = sendPushToUser;
//# sourceMappingURL=notifications.js.map