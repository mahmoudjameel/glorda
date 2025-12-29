export interface AuthenticaResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export class AuthenticaService {
    private static readonly BASE_URL = "https://api.authentica.sa/api/v2";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Send OTP to a phone number
     */
    async sendOTP(phone: string): Promise<AuthenticaResponse> {
        // Test Number Bypass (0500000000 -> 966500000000)
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
                    template_id: 1 // Using 1 as default for OTP
                }),
            });

            const data: any = await response.json();
            if (!response.ok) {
                console.error("[Authentica] API Error Response:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                message: data?.message || data?.error || (response.ok ? undefined : "API Error"),
                data,
            };
        } catch (error: any) {
            console.error("[Authentica] Error sending OTP:", error.message);
            return {
                success: false,
                message: error.message || "Failed to send OTP",
            };
        }
    }

    /**
     * Verify OTP code
     */
    async verifyOTP(phone: string, otp: string): Promise<AuthenticaResponse> {
        // Test Number Bypass
        if (phone === "966500000000") {
            console.log("[Authentica] Using Test Number logic for verifyOTP");
            // Allow both 4-digit and 6-digit test codes for flexibility
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

            const data: any = await response.json();
            if (!response.ok) {
                console.error("[Authentica] Verify API Error:", JSON.stringify(data));
            }
            return {
                success: response.ok,
                message: data?.message || data?.error || (response.ok ? undefined : "API Error"),
                data,
            };
        } catch (error: any) {
            console.error("[Authentica] Error verifying OTP:", error.message);
            return {
                success: false,
                message: error.message || "Invalid OTP or verification failed",
            };
        }
    }
}
