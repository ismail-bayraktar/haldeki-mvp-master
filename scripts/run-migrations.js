#!/usr/bin/env node
/**
 * Pricing Redesign Migration Runner
 *
 * Executes the pricing redesign migrations in correct order:
 * 1. Schema migration
 * 2. Data migration
 * 3. Verification
 *
 * Usage:
 *   node scripts/run-migrations.js [--verify-only] [--rollback]
 *
 * Environment variables required:
 *   - SUPABASE_DB_URL: Full connection string or
 *   - SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 *
 * Example:
 *   SUPABASE_DB_PASSWORD=yourpassword node scripts/run-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.cyan}[STEP ${step}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[OK] ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR] ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARN] ${message}${colors.reset}`);
}

// Migration files in execution order
const MIGRATIONS = [
  {
    name: 'Schema Migration',
    file: 'supabase/migrations/20260110200000_pricing_redesign_schema.sql',
    required: true,
  },
  {
    name: 'Data Migration',
    file: 'supabase/migrations/20260110210000_pricing_redesign_data_migration.sql',
    required: true,
  },
  {
    name: 'Verification',
    file: 'supabase/migrations/20260110220000_pricing_redesign_verification.sql',
    required: false,
  },
];

const ROLLBACK_FILE = 'supabase/migrations/20260110290000_pricing_redesign_rollback.sql';

class MigrationRunner {
  constructor() {
    this.client = null;
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async getConnectionConfig() {
    // Check for full connection string
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

    if (dbUrl) {
      return { connectionString: dbUrl };
    }

    // Build from individual components
    const host = process.env.SUPABASE_DB_HOST || 'db.ynatuiwdvkxcmmnmejkl.supabase.co';
    const port = process.env.SUPABASE_DB_PORT || '5432';
    const database = process.env.SUPABASE_DB_NAME || 'postgres';
    const user = process.env.SUPABASE_DB_USER || 'postgres';
    const password = process.env.SUPABASE_DB_PASSWORD;

    if (!password) {
      throw new Error(
        'Database password not found. Set SUPABASE_DB_PASSWORD environment variable.\n' +
        'Get your password from: https://app.supabase.com/project/ynatuiwdvkxcmmnmejkl/settings/database'
      );
    }

    return {
      host,
      port: parseInt(port),
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false },
    };
  }

  async connect() {
    logStep(0, 'Connecting to database...');

    try {
      const config = await this.getConnectionConfig();
      this.client = new Client(config);

      await this.client.connect();
      logSuccess('Connected to database');

      // Test connection
      const result = await this.client.query('SELECT current_database(), current_user, version()');
      log(`Database: ${result.rows[0].current_database}`);
      log(`User: ${result.rows[0].current_user}`);

    } catch (error) {
      logError(`Connection failed: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      log('Disconnected from database');
    }
  }

  readMigrationFile(filename) {
    const filepath = path.join(this.projectRoot, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Migration file not found: ${filepath}`);
    }

    return fs.readFileSync(filepath, 'utf8');
  }

  async executeMigration(name, filename) {
    logStep('EXEC', `Running: ${name}`);

    try {
      const sql = this.readMigrationFile(filename);

      // Split by semicolon and execute each statement
      // Note: This is simplified - complex SQL with $$ may need better parsing
      const statements = this.splitSQL(sql);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();

        if (!statement || statement.startsWith('--')) {
          continue;
        }

        try {
          await this.client.query(statement);
        } catch (error) {
          // Check if it's a "NOTICE" or expected error
          if (error.code === '42P07') { // relation already exists
            logWarning(`Statement ${i + 1}: Object already exists, continuing...`);
            continue;
          }

          // For DO blocks, the error might be expected
          if (statement.toUpperCase().includes('DO $$')) {
            // DO blocks often raise notices/warnings
            if (error.severity === 'NOTICE') {
              continue;
            }
          }

          throw error;
        }
      }

      logSuccess(`${name} completed`);

    } catch (error) {
      logError(`${name} failed: ${error.message}`);
      if (error.detail) {
        logError(`Detail: ${error.detail}`);
      }
      if (error.hint) {
        logError(`Hint: ${error.hint}`);
      }
      throw error;
    }
  }

  splitSQL(sql) {
    // Split SQL by semicolon, but preserve $$...$$ blocks
    const blocks = [];
    let current = '';
    let inDollarBlock = false;
    let dollarDepth = 0;

    const lines = sql.split('\n');

    for (const line of lines) {
      // Check for $$ boundaries
      if (line.includes('$$')) {
        const matches = line.match(/\$\$/g);
        if (matches) {
          dollarDepth += matches.length;
          inDollarBlock = dollarDepth % 2 !== 0;
        }
      }

      current += line + '\n';

      // Split by semicolon only when not in $$ block
      if (!inDollarBlock && line.trim().endsWith(';')) {
        blocks.push(current.trim());
        current = '';
        dollarDepth = 0;
        inDollarBlock = false;
      }
    }

    // Add remaining content
    if (current.trim()) {
      blocks.push(current.trim());
    }

    return blocks.filter(b => b.trim() && !b.trim().startsWith('--'));
  }

  async preMigrationCheck() {
    logStep('CHECK', 'Pre-migration verification');

    try {
      // Check if schema migration already ran
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'pricing_config'
        ) as exists
      `);

      if (result.rows[0].exists) {
        logWarning('Schema migration already applied (pricing_config table exists)');
        return 'already_applied';
      }

      return 'ready';

    } catch (error) {
      logError(`Pre-check failed: ${error.message}`);
      throw error;
    }
  }

  async runMigrations(options = {}) {
    const { verifyOnly = false, rollback = false } = options;

    try {
      await this.connect();

      if (rollback) {
        logStep('ROLLBACK', 'Rolling back pricing redesign...');
        const rollbackSql = this.readMigrationFile(ROLLBACK_FILE);
        await this.client.query(rollbackSql);
        logSuccess('Rollback completed');
        return;
      }

      if (verifyOnly) {
        logStep('VERIFY', 'Running verification only...');
        const verifyMigration = MIGRATIONS.find(m => m.name === 'Verification');
        await this.executeMigration(verifyMigration.name, verifyMigration.file);
        return;
      }

      const preCheckResult = await this.preMigrationCheck();

      if (preCheckResult === 'already_applied') {
        logWarning('Migrations may already be applied. Proceeding will verify existing state...');
      }

      // Run migrations in order
      for (const migration of MIGRATIONS) {
        if (migration.required || preCheckResult !== 'already_applied') {
          await this.executeMigration(migration.name, migration.file);
        } else if (migration.name === 'Verification') {
          // Always run verification
          await this.executeMigration(migration.name, migration.file);
        }
      }

      logStep('DONE', 'Migration Summary');
      logSuccess('All migrations completed successfully');
      console.log('\nNext steps:');
      console.log('  1. Review verification results above');
      console.log('  2. Test the calculate_product_price() function');
      console.log('  3. Update frontend to use new pricing RPC');
      console.log('  4. Monitor for 7 days before cleanup');

    } catch (error) {
      logError(`Migration failed: ${error.message}`);
      console.log('\nIf you need to rollback, run:');
      console.log('  node scripts/run-migrations.js --rollback');
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verifyOnly: args.includes('--verify-only'),
    rollback: args.includes('--rollback'),
  };

  const runner = new MigrationRunner();

  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  Pricing Redesign Migration Runner${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  if (options.rollback) {
    logWarning('ROLLBACK MODE: This will revert the pricing redesign!', 'red');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    await runner.runMigrations(options);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = MigrationRunner;
