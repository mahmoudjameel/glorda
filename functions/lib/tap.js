"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapService = void 0;
class TapService {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    async verifyCharge(chargeId) {
        if (!this.secretKey) {
            console.error("[Tap] Secret Key not set");
            return { success: false, message: "Tap Secret Key not configured" };
        }
        try {
            const response = await fetch(`${TapService.BASE_URL}/charges/${chargeId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.secretKey}`,
                    "Accept": "application/json",
                },
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("[Tap] API Error Response:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                status: data?.status,
                message: data?.message || (response.ok ? undefined : "Tap API Error"),
                data,
            };
        }
        catch (error) {
            console.error("[Tap] Error verifying charge:", error.message);
            return {
                success: false,
                message: error.message || "Failed to verify Tap charge",
            };
        }
    }
    async createCharge(chargeData) {
        if (!this.secretKey) {
            console.error("[Tap] Secret Key not set");
            return { success: false, message: "Tap Secret Key not configured" };
        }
        try {
            const body = {
                amount: chargeData.amount,
                currency: chargeData.currency,
                threeDSecure: true,
                save_card: false,
                description: `Order ${chargeData.order_id}`,
                statement_descriptor: "Glorda Market",
                metadata: {
                    order_id: chargeData.order_id,
                },
                reference: {
                    transaction: chargeData.order_id,
                    order: chargeData.order_id,
                },
                customer: {
                    first_name: chargeData.customer.first_name,
                    last_name: chargeData.customer.last_name,
                    email: chargeData.customer.email,
                    phone: chargeData.customer.phone,
                },
                source: { id: "src_all" },
                redirect: {
                    url: chargeData.redirect_url,
                },
                post: chargeData.post_url ? { url: chargeData.post_url } : undefined,
            };
            const response = await fetch(`${TapService.BASE_URL}/charges`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.secretKey}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("[Tap] Create Charge API Error:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                status: data?.status,
                message: data?.message || (response.ok ? undefined : "Tap API Error"),
                data,
            };
        }
        catch (error) {
            console.error("[Tap] Error creating charge:", error.message);
            return {
                success: false,
                message: error.message || "Failed to create Tap charge",
            };
        }
    }
}
exports.TapService = TapService;
TapService.BASE_URL = "https://api.tap.company/v2";
//# sourceMappingURL=tap.js.map