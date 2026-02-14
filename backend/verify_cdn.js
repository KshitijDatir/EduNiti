
const TEST_ID = '07a6b40d-c860-4424-90a3-1301a7b52707'; // Ensure this matches a real ID from your DB query
const LOGIN_URL = 'http://localhost/api/auth/login';
const TEST_URL = `http://localhost/api/test/${TEST_ID}`;

async function verify() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testuser4@example.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.data?.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        // 2. Fetch Test
        console.log(`Fetching test ${TEST_ID}...`);
        const testRes = await fetch(TEST_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!testRes.ok) {
            console.error('Fetch test failed:', await testRes.text());
            // Retry with the other ID just in case
            return;
        }

        const testData = await testRes.json();
        // console.log('Test Data:', JSON.stringify(testData, null, 2)); // Too verbose

        // 3. Check Media URL
        const question = testData.data?.questions?.[0];
        if (question && question.mediaUrl) {
            console.log('✅ Found mediaUrl:', question.mediaUrl);
            if (question.mediaUrl.includes('cloudfront.net')) {
                console.log('🎉 SUCCESS: Media URL points to CloudFront!');
            } else {
                console.error('❌ FAILURE: Media URL does not point to CloudFront.');
            }
        } else {
            console.error('❌ FAILURE: No mediaUrl found in first question.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verify();
