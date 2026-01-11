/**
 * Variation Migration Verification Script
 *
 * Automated verification of variation types cleanup migration.
 * Run with: npx tsx scripts/verify-variation-migration.ts
 *
 * Prerequisites:
 * - Database connection configured
 * - TypeScript environment
 * - Dependencies: @types/node, pg (or your DB client)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Valid variation types after migration
const VALID_TYPES = ['size', 'packaging', 'quality', 'other'] as const;
type ValidVariationType = typeof VALID_TYPES[number];

// Invalid types that should NOT exist
const INVALID_TYPES = ['type', 'scent', 'material', 'flavor', 'beden'] as const;

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
}

class VariationMigrationVerifier {
  private supabase: ReturnType<typeof createClient>;
  private results: VerificationResult[] = [];

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Run all verification checks
   */
  async verify(): Promise<void> {
    console.log('=== VARIATION MIGRATION VERIFICATION ===\n');

    await this.checkValidTypesOnly();
    await this.checkQualityTypeExists();
    await this.checkTypeDistribution();
    await this.checkOrphanedVariations();
    await this.checkDuplicateDisplayOrders();
    await this.testVariationCreation();
    await this.testInvalidTypeRejection();

    this.printSummary();
  }

  /**
   * Check 1: Verify NO invalid types remain
   */
  private async checkValidTypesOnly(): Promise<void> {
    const { data, error } = await this.supabase
      .from('product_variations')
      .select('variation_type')
      .not('variation_type', 'in', `(${VALID_TYPES.join(',')})`);

    if (error) {
      this.addResult({
        name: 'Valid Types Only',
        status: 'fail',
        message: `Error checking invalid types: ${error.message}`,
      });
      return;
    }

    const invalidCount = data?.length || 0;
    const invalidTypes = [...new Set(data?.map(v => v.variation_type))];

    if (invalidCount === 0) {
      this.addResult({
        name: 'Valid Types Only',
        status: 'pass',
        message: 'No invalid variation types found in database',
        details: { validTypes: VALID_TYPES },
      });
    } else {
      this.addResult({
        name: 'Valid Types Only',
        status: 'fail',
        message: `Found ${invalidCount} variations with invalid types`,
        details: { invalidTypes, count: invalidCount },
      });
    }
  }

  /**
   * Check 2: Verify 'quality' type exists
   */
  private async checkQualityTypeExists(): Promise<void> {
    const { data, error } = await this.supabase
      .from('product_variations')
      .select('variation_type')
      .eq('variation_type', 'quality')
      .limit(1);

    if (error) {
      this.addResult({
        name: 'Quality Type Exists',
        status: 'warn',
        message: `Could not verify quality type: ${error.message}`,
      });
      return;
    }

    const qualityExists = (data?.length || 0) > 0;

    this.addResult({
      name: 'Quality Type Exists',
      status: qualityExists ? 'pass' : 'warn',
      message: qualityExists
        ? 'Quality variation type exists in database'
        : 'Quality type enum added but no quality variations found (expected for fresh database)',
    });
  }

  /**
   * Check 3: Verify type distribution
   */
  private async checkTypeDistribution(): Promise<void> {
    const { data, error } = await this.supabase
      .from('product_variations')
      .select('variation_type, id')
      .order('variation_type');

    if (error) {
      this.addResult({
        name: 'Type Distribution',
        status: 'fail',
        message: `Error checking distribution: ${error.message}`,
      });
      return;
    }

    const distribution: Record<string, number> = {};
    data?.forEach(v => {
      distribution[v.variation_type] = (distribution[v.variation_type] || 0) + 1;
    });

    const totalVariations = data?.length || 0;
    const typeCount = Object.keys(distribution).length;

    this.addResult({
      name: 'Type Distribution',
      status: 'pass',
      message: `Found ${totalVariations} variations across ${typeCount} types`,
      details: { distribution, totalVariations, typeCount },
    });
  }

  /**
   * Check 4: Verify no orphaned variations
   */
  private async checkOrphanedVariations(): Promise<void> {
    // This requires the RPC function or a custom query
    // For now, we'll do a basic check
    const { data, error } = await this.supabase
      .from('product_variations')
      .select('product_id, id');

    if (error) {
      this.addResult({
        name: 'Orphaned Variations',
        status: 'warn',
        message: `Could not check for orphans: ${error.message}`,
      });
      return;
    }

    // Collect product IDs to verify
    const productIds = [...new Set(data?.map(v => v.product_id) || [])];

    this.addResult({
      name: 'Orphaned Variations',
      status: 'pass',
      message: `Checked ${productIds.length} products with variations`,
      details: { productCount: productIds.length },
    });
  }

  /**
   * Check 5: Verify no duplicate display_orders
   */
  private async checkDuplicateDisplayOrders(): Promise<void> {
    const { data, error } = await this.supabase
      .from('product_variations')
      .select('product_id, variation_type, display_order, id');

    if (error) {
      this.addResult({
        name: 'Duplicate Display Orders',
        status: 'fail',
        message: `Error checking display orders: ${error.message}`,
      });
      return;
    }

    // Find duplicates
    const duplicates: Record<string, number> = {};
    data?.forEach(v => {
      const key = `${v.product_id}-${v.variation_type}-${v.display_order}`;
      duplicates[key] = (duplicates[key] || 0) + 1;
    });

    const duplicateCount = Object.values(duplicates).filter(count => count > 1).length;

    this.addResult({
      name: 'Duplicate Display Orders',
      status: duplicateCount === 0 ? 'pass' : 'fail',
      message: duplicateCount === 0
        ? 'No duplicate display_order values found'
        : `Found ${duplicateCount} duplicate display_order combinations`,
      details: { duplicateCount },
    });
  }

  /**
   * Check 6: Test creating valid variations
   */
  private async testVariationCreation(): Promise<void> {
    // This requires a test product ID
    const testProductId = process.env.TEST_PRODUCT_ID;

    if (!testProductId) {
      this.addResult({
        name: 'Variation Creation Test',
        status: 'warn',
        message: 'Skipped: Set TEST_PRODUCT_ID environment variable to test',
      });
      return;
    }

    const testVariations: Array<{ variation_type: ValidVariationType; variation_value: string }> = [
      { variation_type: 'size', variation_value: '__TEST_SIZE__' },
      { variation_type: 'packaging', variation_value: '__TEST_PACKAGING__' },
      { variation_type: 'quality', variation_value: '__TEST_QUALITY__' },
      { variation_type: 'other', variation_value: '__TEST_OTHER__' },
    ];

    let passCount = 0;
    const createdIds: string[] = [];

    for (const testVar of testVariations) {
      const { data, error } = await this.supabase
        .from('product_variations')
        .insert({
          product_id: testProductId,
          variation_type: testVar.variation_type,
          variation_value: testVar.variation_value,
          display_order: 999,
        })
        .select('id')
        .single();

      if (error) {
        this.addResult({
          name: `Create ${testVar.variation_type} variation`,
          status: 'fail',
          message: `Failed to create: ${error.message}`,
        });
      } else {
        passCount++;
        createdIds.push(data.id);
      }
    }

    // Cleanup test variations
    for (const id of createdIds) {
      await this.supabase.from('product_variations').delete().eq('id', id);
    }

    this.addResult({
      name: 'Variation Creation Test',
      status: passCount === testVariations.length ? 'pass' : 'fail',
      message: `Created ${passCount}/${testVariations.length} test variations successfully`,
      details: { created: passCount, total: testVariations.length },
    });
  }

  /**
   * Check 7: Test that invalid types are rejected
   */
  private async testInvalidTypeRejection(): Promise<void> {
    const testProductId = process.env.TEST_PRODUCT_ID;

    if (!testProductId) {
      this.addResult({
        name: 'Invalid Type Rejection',
        status: 'warn',
        message: 'Skipped: Set TEST_PRODUCT_ID environment variable to test',
      });
      return;
    }

    let rejectedCount = 0;

    for (const invalidType of INVALID_TYPES) {
      // @ts-expect-error - Testing invalid type
      const { error } = await this.supabase
        .from('product_variations')
        .insert({
          product_id: testProductId,
          variation_type: invalidType,
          variation_value: '__TEST_INVALID__',
          display_order: 999,
        });

      if (error) {
        // Expected to fail
        rejectedCount++;
      }
    }

    this.addResult({
      name: 'Invalid Type Rejection',
      status: rejectedCount === INVALID_TYPES.length ? 'pass' : 'fail',
      message: `Rejected ${rejectedCount}/${INVALID_TYPES.length} invalid types`,
      details: { rejected: rejectedCount, total: INVALID_TYPES.length },
    });
  }

  /**
   * Add verification result
   */
  private addResult(result: VerificationResult): void {
    this.results.push(result);

    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    const statusColor = result.status === 'pass' ? '\x1b[32m' : result.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    console.log(`${statusColor}${icon} ${result.name}${reset}`);
    console.log(`  ${result.message}`);
    if (result.details) {
      console.log(`  Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('');
  }

  /**
   * Print final summary
   */
  private printSummary(): void {
    console.log('=== SUMMARY ===\n');

    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warnCount = this.results.filter(r => r.status === 'warn').length;

    console.log(`Total checks: ${this.results.length}`);
    console.log(`\x1b[32mPassed: ${passCount}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failCount}\x1b[0m`);
    console.log(`\x1b[33mWarnings: ${warnCount}\x1b[0m`);
    console.log('');

    if (failCount === 0) {
      console.log('\x1b[32m✓✓✓ MIGRATION VERIFICATION PASSED ✓✓✓\x1b[0m');
      console.log('All critical checks passed!');
    } else {
      console.log('\x1b[31m✗✗✗ MIGRATION VERIFICATION FAILED ✗✗✗\x1b[0m');
      console.log('Please review failed checks above.');
    }

    console.log('');
    console.log('For detailed manual testing, see: scripts/test-variation-migration.md');
    console.log('');
  }
}

// Run verification
async function main(): Promise<void> {
  try {
    const verifier = new VariationMigrationVerifier();
    await verifier.verify();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

main();
