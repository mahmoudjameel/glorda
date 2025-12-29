"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticaService = void 0;
class AuthenticaService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async sendOTP(phone) {
        if (phone === "966500000000") {
            console.log("[Authentica] Using Test Number logic for sendOTP");
            return { success: true, message: "Test OTP sent successfully" };
        }
        if (!this.apiKey) {
            console.warn("[Authentica] API Key not set, using simulation");
            return { success: true, message: "DEV: OTP sent successfully (simulated)" };
        }
        try {
            const response = await fetch(`${AuthenticaService.BASE_URL}/send-otp`, {
                method: "POST",
                headers: {
                    "X-Authorization": this.apiKey,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone,
                    method: "sms",
                    template_id: 1
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("[Authentica] API Error Response:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                message: data?.message || data?.error || (response.ok ? undefined : "API Error"),
                data,
            };
        }
        catch (error) {
            console.error("[Authentica] Error sending OTP:", error.message);
            return {
                success: false,
                message: error.message || "Failed to send OTP",
            };
        }
    }
    async verifyOTP(phone, otp) {
        if (phone === "966500000000") {
            console.log("[Authentica] Using Test Number logic for verifyOTP");
            if (otp === "1234" || otp === "123456") {
                return { success: true, message: "Test OTP verified successfully" };
            }
            return { success: false, message: "Invalid Test OTP (use 1234)" };
        }
        if (!this.apiKey) {
            console.warn("[Authentica] API Key not set, using simulation");
            if (otp === "123456") {
                return { success: true, message: "DEV: OTP verified successfully (simulated)" };
            }
            return { success: false, message: "DEV: Invalid OTP (simulation uses 123456)" };
        }
        try {
            const response = await fetch(`${AuthenticaService.BASE_URL}/verify-otp`, {
                method: "POST",
                headers: {
                    "X-Authorization": this.apiKey,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone, otp }),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("[Authentica] Verify API Error:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                message: data?.message || data?.error || (response.ok ? undefined : "API Error"),
                data,
            };
        }
        catch (error) {
            console.error("[Authentica] Error verifying OTP:", error.message);
            return {
                success: false,
                message: error.message || "Invalid OTP or verification failed",
            };
        }
    }
}
exports.AuthenticaService = AuthenticaService;
AuthenticaService.BASE_URL = "https://api.authentica.sa/api/v2";
//# sourceMappingURL=authentica.js.map