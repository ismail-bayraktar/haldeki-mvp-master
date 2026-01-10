/**
 * Supabase RPC Fonksiyon Otomatik Deployment
 *
 * DATABASE_URL kullanarak migration dosyasını çalıştırır
 *
 * Kullanım:
 *   npm run deploy:rpc
 *   veya
 *   DATABASE_URL="postgres://..." npx tsx scripts/deploy-rpc-automated.ts
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

interface DeployResult {
  success: boolean;
  message: string;
  functionExists?: boolean;
}

async function deployRPCFunction(): Promise<DeployResult> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      success: false,
      message: 'DATABASE_URL environment variable bulunamadı'
    };
  }

  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20260110000000_image_delete_security_fix.sql'
  );

  let sql: string;
  try {
    sql = readFileSync(migrationPath, 'utf-8');
  } catch {
    return {
      success: false,
      message: `Migration dosyası bulunamadı: ${migrationPath}`
    };
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('[OK] Supabase\'a bağlanıldı');

    await client.query(sql);
    console.log('[OK] SQL çalıştırıldı');

    const result = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'delete_supplier_image'
    `);

    const functionExists = result.rows.length > 0;

    if (functionExists) {
      console.log('[OK] Fonksiyon doğrulandı: delete_supplier_image');
      return {
        success: true,
        message: 'RPC fonksiyonu başarıyla oluşturuldu',
        functionExists: true
      };
    }

    return {
      success: true,
      message: 'SQL çalıştırıldı ancak fonksiyon bulunamadı',
      functionExists: false
    };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('[HATA]', message);
    return {
      success: false,
      message
    };
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('=== Supabase RPC Deployment ===\n');

  const result = await deployRPCFunction();

  console.log('\n=== Sonuç ===');
  if (result.success) {
    console.log(`[BAŞARILI] ${result.message}`);
    if (result.functionExists) {
      console.log('\nFonksiyon artık kullanıma hazır.');
      console.log('Supabase Dashboard > Database Functions üzerinden görebilirsiniz.');
    }
    process.exit(0);
  } else {
    console.error(`[BAŞARISIZ] ${result.message}`);
    console.log('\nDATABASE_URL nasıl ayarlanır:');
    console.log('  Windows CMD: set DATABASE_URL="postgres://..."');
    console.log('  PowerShell: $env:DATABASE_URL="postgres://..."');
    console.log('  Linux/Mac: export DATABASE_URL="postgres://..."');
    console.log('\nVeya .env dosyasına ekleyin:');
    console.log('  DATABASE_URL=postgres://postgres:[password]@db.xxx.supabase.co:5432/postgres');
    process.exit(1);
  }
}

main();
