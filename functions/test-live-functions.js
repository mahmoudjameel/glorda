const https = require('https');

const PROJECT_ID = 'glorda';
const REGION = 'us-central1';

async function callFunction(name, data) {
    const postData = JSON.stringify({ data });
    const options = {
        hostname: `${REGION}-${PROJECT_ID}.cloudfunctions.net`,
        path: `/${name}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    console.log("---------------------------------------------------");
    console.log("🧪 Testing LIVE Firebase Cloud Functions");
    console.log("---------------------------------------------------");

    // 1. Test requestOtp
    console.log("\n1️⃣  Calling requestOtp(0500000000)...");
    const reqResult = await callFunction('requestOtp', { phone: '0500000000' });
    console.log("Response:", JSON.stringify(reqResult, null, 2));

    if (reqResult.result && reqResult.result.success) {
        console.log("✅ requestOtp SUCCESS (Bypass working)");
    } else {
        console.log("❌ requestOtp FAILED");
    }

    // 2. Test checkOtp
    console.log("\n2️⃣  Calling checkOtp(0500000000, 1234)...");
    const verResult = await callFunction('checkOtp', {
        phone: '0500000000',
        otp: '1234',
        name: 'Test Account'
    });
    console.log("Response:", JSON.stringify(verResult, null, 2));

    if (verResult.result && verResult.result.success && verResult.result.token) {
        console.log("✅ checkOtp SUCCESS (Bypass & Token generation working)");
        console.log("🎫 Received Token:", verResult.result.token.substring(0, 20) + "...");
    } else {
        console.log("❌ verifyOtp FAILED");
    }

    // 3. Test verifyTapPayment
    console.log("\n3️⃣  Calling verifyTapPayment(chg_test_123)...");
    const tapResult = await callFunction('verifyTapPayment', {
        chargeId: 'chg_test_123'
    });
    console.log("Response:", JSON.stringify(tapResult, null, 2));

    if (tapResult.error) {
        if (tapResult.error.message.includes("TAP_SECRET_KEY not configured")) {
            console.log("🟡 verifyTapPayment: Secret key not set (Expected)");
        } else {
            console.log("❌ verifyTapPayment FAILED:", tapResult.error.message);
        }
    } else {
        console.log("✅ verifyTapPayment SUCCESS (API reachable)");
    }

    // 4. Test createTapCharge
    console.log("\n4️⃣  Calling createTapCharge...");
    const createResult = await callFunction('createTapCharge', {
        amount: 1.0,
        currency: "SAR",
        customer: {
            first_name: "Test",
            last_name: "User",
            email: "test@example.com",
            phone: { country_code: "966", number: "500000000" }
        },
        orderId: "TEST_ORDER_123",
        redirectUrl: "glorda://payment-callback"
    });
    console.log("Response:", JSON.stringify(createResult, null, 2));

    if (createResult.result && createResult.result.transaction && createResult.result.transaction.url) {
        console.log("✅ createTapCharge SUCCESS (URL received)");
        console.log("🔗 Payment URL:", createResult.result.transaction.url);
    } else {
        console.log("❌ createTapCharge FAILED");
    }
}

runTest();
