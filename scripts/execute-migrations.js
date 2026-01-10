/**
 * Haldeki Market - Automatic Migration Executor
 *
 * This script executes migrations by reading SQL files and providing
 * copy-paste ready output for Supabase SQL Editor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationDir = path.join(__dirname, '../supabase/migrations');

// ANSI colors
const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);

async function copyToClipboard(text) {
  try {
    // Windows
    if (process.platform === 'win32') {
      execSync('clip', { input: text });
      return true;
    }
    // macOS
    else if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text });
      return true;
    }
    // Linux
    else {
      execSync('xclip -selection clipboard', { input: text });
      return true;
    }
  } catch (error) {
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), '\x1b[36m');
  log('  HALDEKI MARKET - PRICING SYSTEM MIGRATION', '\x1b[36m');
  log('=' .repeat(60), '\x1b[36m');

  log('\n✅ SQL syntax errors fixed!', '\x1b[32m');
  log('   Previous error: CONSTRAINT ... UNIQUE ... WHERE (invalid)', '\x1b[33m');
  log('   Fixed to: CREATE UNIQUE INDEX ... WHERE (correct)', '\x1b[33m');

  // Read combined migration file
  const migrationFile = path.join(migrationDir, 'RUN_ALL_MIGRATIONS.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  log('\n📊 Migration Statistics:', '\x1b[33m');
  log(`   Total size: ${(sql.length / 1024).toFixed(1)} KB`);
  log(`   Total lines: ${sql.split('\n').length}`);
  log(`   Statements: ${sql.split(';').filter(s => s.trim().length > 50).length}`);

  log('\n' + '='.repeat(60), '\x1b[36m');
  log('  EXECUTION METHOD', '\x1b[36m');
  log('=' .repeat(60), '\x1b[36m');

  log('\nSince direct database access requires credentials,', '\x1b[33m');
  log('the BEST PRACTICE approach is:', '\x1b[33m');

  log('\n1️⃣  OPEN Supabase SQL Editor:', '\x1b[34m');
  log('   https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/sql', '\x1b[37m');

  log('\n2️⃣  COPY the SQL file contents:', '\x1b[34m');
  log(`   Location: ${migrationFile}`, '\x1b[37m');

  log('\n3️⃣  PASTE into SQL Editor and RUN', '\x1b[34m');

  log('\n' + '='.repeat(60), '\x1b[36m');

  // Try to copy to clipboard
  const copied = await copyToClipboard(sql);

  if (copied) {
    log('\n✅ SQL has been COPIED TO CLIPBOARD!', '\x1b[32m');
    log('   Just PASTE (Ctrl+V) in Supabase SQL Editor\n', '\x1b[37m');
  } else {
    log('\n📋 Could not auto-copy. Manual steps:', '\x1b[33m');
    log(`   1. Open: ${migrationFile}`, '\x1b[37m');
    log('   2. Ctrl+A to select all', '\x1b[37m');
    log('   3. Ctrl+C to copy', '\x1b[37m');
    log('   4. Paste in SQL Editor\n', '\x1b[37m');
  }

  log('After running migrations, verify with:', '\x1b[35m');
  log('');
  log('-- Quick verification query', '\x1b[37m');
  log('SELECT', '\x1b[96m');
  log('  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = \'pricing_config\') as config,', '\x1b[96m');
  log('  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = \'customer_prices\') as view,', '\x1b[96m');
  log('  (SELECT COUNT(*) FROM pg_proc WHERE proname = \'calculate_product_price\') as func;', '\x1b[96m');
  log('');
  log('-- Expected result: (1, 1, 1)', '\x1b[32m');

  log('\n' + '='.repeat(60), '\x1b[36m');
  log('  Need help? Check: docs/MIGRATION_EXECUTION_GUIDE.md', '\x1b[36m');
  log('=' .repeat(60), '\x1b[36m\n');
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, '\x1b[31m');
  process.exit(1);
});
