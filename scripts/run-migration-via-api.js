/**
 * Haldeki Market - Migration Runner via Supabase Client
 *
 * Uses Supabase Client with service role to execute migrations
 * This bypasses the need for direct database password
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    const value = valueParts.join('=').replace(/^"|"$/g, '').replace(/^'|"$/g, '');
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// SQL execution via RPC is not possible, so we need to use a different approach
// We'll create individual SQL files for manual execution

async function main() {
  log('\n🔄 Haldeki Market - Migration Runner', 'cyan');
  log('=' .repeat(50), 'blue');

  log('\n📋 Migration Files:', 'yellow');
  log('1. Schema: 20260110200000_pricing_redesign_schema.sql');
  log('2. Data:   20260110210000_pricing_redesign_data_migration.sql');
  log('3. Verify: 20260110220000_pricing_redesign_verification.sql');

  log('\n⚠️  NOTE: Direct SQL execution requires database connection.', 'yellow');
  log('Please use one of these methods:', 'yellow');
  log('');
  log('Method 1 (Recommended): Supabase SQL Editor', 'cyan');
  log('  1. Open: https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/sql', 'blue');
  log('  2. Copy: supabase/migrations/RUN_ALL_MIGRATIONS.sql', 'blue');
  log('  3. Paste and Run', 'blue');
  log('');
  log('Method 2: PowerShell Helper', 'cyan');
  log('  .\\scripts\\run-migrations.ps1', 'blue');
  log('');
  log('Method 3: Get DB password from Supabase Dashboard', 'cyan');
  log('  Settings → Database → Connection string → URI', 'blue');
  log('  Then run: node scripts/run-migrations.js', 'blue');

  log('\n📖 Full guide: docs/MIGRATION_EXECUTION_GUIDE.md\n', 'yellow');

  // Verify migration files exist
  const migrationDir = path.join(__dirname, '../supabase/migrations');
  const files = [
    '20260110200000_pricing_redesign_schema.sql',
    '20260110210000_pricing_redesign_data_migration.sql',
    '20260110220000_pricing_redesign_verification.sql',
    'RUN_ALL_MIGRATIONS.sql'
  ];

  log('✅ Migration files check:', 'green');
  files.forEach(file => {
    const filePath = path.join(migrationDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log(`  ✓ ${file} (${stats.size} bytes, ${Math.round(stats.size / 1024)} KB)`, 'green');
    } else {
      log(`  ✗ ${file} - NOT FOUND`, 'red');
    }
  });

  log('\n' + '='.repeat(50), 'blue');
}

main().catch(console.error);
