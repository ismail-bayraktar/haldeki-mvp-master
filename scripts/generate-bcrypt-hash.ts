// ============================================================================
// GENERATE BCRYPT HASH - For Password Recovery
// ============================================================================
// This script generates bcrypt hashes for passwords to be used in SQL
// ============================================================================
// Usage: npx tsx scripts/generate-bcrypt-hash.ts <password>
// ============================================================================

import * as bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/generate-bcrypt-hash.ts <password>');
  console.error('\nExample:');
  console.error('  npx tsx scripts/generate-bcrypt-hash.ts "MySecurePassword123!"');
  process.exit(1);
}

async function generateHash() {
  try {
    // Generate salt and hash (Supabase uses 10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\nSQL Usage:');
    console.log(`  encrypted_password => '${hash}'`);
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

generateHash();
