// ============================================================================
// Create Test Users Script
// ============================================================================
// This script creates test accounts for all roles
// Usage: node scripts/create-test-users.js <SERVICE_ROLE_KEY>
// ============================================================================

const https = require('https');

const SUPABASE_URL = 'https://epuhjrdqotyrryvkjnrp.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('Usage: node scripts/create-test-users.js <SERVICE_ROLE_KEY>');
  console.error('Get service role key from: https://supabase.com/dashboard/project/epuhjrdqotyrryvkjnrp/settings/api');
  process.exit(1);
}

const TEST_USERS = [
  { email: 'dealer-approved@test.haldeki.com', password: 'Test1234!', email_confirm: true, user_metadata: { full_name: 'Test Dealer Approved', role: 'dealer', is_test_account: true } },
  { email: 'dealer-pending@test.haldeki.com', password: 'Test1234!', email_confirm: true, user_metadata: { full_name: 'Test Dealer Pending', role: 'dealer', is_test_account: true } },
  { email: 'supplier-approved@test.haldeki.com', password: 'Test1234!', email_confirm: true, user_metadata: { full_name: 'Test Supplier Approved', role: 'supplier', is_test_account: true } },
  { email: 'supplier-pending@test.haldeki.com', password: 'Test1234!', email_confirm: true, user_metadata: { full_name: 'Test Supplier Pending', role: 'supplier', is_test_account: true } },
];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: response });
          } else {
            reject({ status: res.statusCode, error: response });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function createUsers() {
  const results = { created: [], skipped: [], errors: [] };

  for (const user of TEST_USERS) {
    try {
      // Check if user exists
      const checkOptions = {
        hostname: 'epuhjrdqotyrryvkjnrp.supabase.co',
        path: `/rest/v1/profiles?email=eq.${user.email}`,
        method: 'GET',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      };

      const checkResult = await makeRequest(checkOptions);

      if (checkResult.data && checkResult.data.length > 0) {
        console.log(`⏭️  Skipped ${user.email} - already exists`);
        results.skipped.push(user.email);
        continue;
      }

      // Create user
      const createOptions = {
        hostname: 'epuhjrdqotyrryvkjnrp.supabase.co',
        path: '/auth/v1/admin/users',
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      };

      const createResult = await makeRequest(createOptions, user);

      console.log(`✅ Created ${user.email} - ID: ${createResult.data.id}`);
      results.created.push({ email: user.email, id: createResult.data.id });

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.error || error.message);
      results.errors.push({ email: user.email, error: error.error || error.message });
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${results.created.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log('\n⚠️  Run migration again to link users to dealer/supplier records');
}

createUsers().catch(console.error);
