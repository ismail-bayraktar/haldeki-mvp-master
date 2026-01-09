import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynatuiwdvkxcmmnmejkl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYXR1aXdkdmt4Y21tbm1lamtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTYzMywiZXhwIjoyMDgyMzIxNjMzfQ.UZWD2y2d5pmtl-GEaWgRS3cZPcI69s4i0S7SU5V6Jnw';

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
