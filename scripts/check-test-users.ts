import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTestUsers() {
  console.log('🔍 Checking E2E test users...\n');

  const testEmails = [
    'test-customer@haldeki.com',
    'test-admin@haldeki.com',
    'test-superadmin@haldeki.com',
    'test-dealer@haldeki.com',
    'test-supplier@haldeki.com',
    'test-business@haldeki.com',
    'test-warehouse@haldeki.com',
  ];

  for (const email of testEmails) {
    // Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('email', email)
      .single();

    // Check roles
    let roles = [];
    if (profile) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id);

      roles = roleData?.map(r => r.role) || [];
    }

    console.log(`📧 ${email}`);
    console.log(`   Profile: ${profile ? '✅' : '❌'} ${profile?.full_name || 'N/A'}`);
    console.log(`   Roles: ${roles.length > 0 ? roles.join(', ') : '⚠️  No roles assigned'}`);
    console.log('');
  }

  console.log('\n✅ Check complete!');
}

checkTestUsers().catch(console.error);
