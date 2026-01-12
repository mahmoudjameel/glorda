import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import * as admin from 'firebase-admin';

const expo = new Expo();

export async function sendPushToUser(
    userId: string | number, // support both string and numeric IDs
    title: string,
    body: string,
    data: any = {}
) {
    try {
        console.log(`[Notification] Sending to user ${userId}: ${title} - ${body}`);

        // 1. Get user document to look for pushToken
        const db = admin.firestore();

        // Determine search query based on ID type or just search users collection
        // Our users are stored with UID: "customer_{id}" or "merchant_{id}"
        // But the input might be just the numeric ID.

        let pushTokens: string[] = [];

        // Try getting by exact doc ID if it looks like a UID
        if (typeof userId === 'string' && (userId.startsWith('customer_') || userId.startsWith('merchant_'))) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data()?.pushToken) {
                pushTokens.push(userDoc.data()?.pushToken);
            }
        } else {
            // Search in customers or merchants collection first to find the UID or Token directly?
            // Actually, the app saves the token to `users/{uid}`. 
            // We need to map the numeric ID (common in orders) to the User UID or just find the user by customerId.

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

        // 2. Construct messages
        const messages: ExpoPushMessage[] = [];
        for (const token of pushTokens) {
            if (!Expo.isExpoPushToken(token)) {
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

        // 3. Send chunks
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('[Notification] Error sending chunks:', error);
            }
        }

        console.log(`[Notification] Sent ${tickets.length} messages`);

    } catch (error) {
        console.error('[Notification] Error sending push:', error);
    }
}
