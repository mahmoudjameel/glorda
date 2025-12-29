const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Read API Key from .env
const envPath = path.join(__dirname, '.env');
let apiKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/AUTHENTICA_API_KEY=(.*)/);
        if (match && match[1]) {
            apiKey = match[1].trim();
        }
    }
} catch (e) {
    console.error("Error reading .env file:", e.message);
}

if (!apiKey) {
    console.error("❌ Could not find AUTHENTICA_API_KEY in .env file.");
    process.exit(1);
}

const command = process.argv[2]; // 'send' or 'verify'
const phone = process.argv[3] || "966500000000";
const otp = process.argv[4];

if (!command || (command === 'verify' && !otp)) {
    console.log("Usage:");
    console.log("  node test-authentica.js send <phone>");
    console.log("  node test-authentica.js verify <phone> <otp>");
    process.exit(0);
}

console.log("---------------------------------------------------");
console.log(`🚀 Action: ${command.toUpperCase()}`);
console.log(`📱 Phone: ${phone}`);
if (otp) console.log(`🔢 OTP: ${otp}`);
console.log("---------------------------------------------------");

const apiPath = command === 'send' ? '/api/v2/send-otp' : '/api/v2/verify-otp';
const payload = command === 'send'
    ? { phone, method: "sms", template_id: 1 }
    : { phone, otp };

const data = JSON.stringify(payload);

const options = {
    hostname: 'api.authentica.sa',
    path: apiPath,
    method: 'POST',
    headers: {
        'X-Authorization': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`📡 Sending Request to https://api.authentica.sa${apiPath}...`);
const req = https.request(options, (res) => {
    console.log(`\n📥 Status Code: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => { body += chunk; });

    res.on('end', () => {
        console.log("\n📦 Response Body:");
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2));

            if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
                console.log("\n✅ SUCCESS!");
            } else {
                console.log("\n❌ FAILED!");
            }
        } catch (e) {
            console.log(body);
            console.log("\n❌ FAILED (Invalid JSON response)");
        }
        console.log("---------------------------------------------------");
    });
});

req.on('error', (e) => { console.error("❌ Error:", e.message); });
req.write(data);
req.end();
