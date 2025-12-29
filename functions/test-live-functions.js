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
        if (verResult.error) {
            console.log("Error Detail:", verResult.error.message);
        }
    }
}

runTest();
