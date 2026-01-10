/**
 * Deploy delete_supplier_image function using direct PostgreSQL connection
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres:[password]@db.ynatuiwdvkxcmmnmejkl.supabase.co:5432/postgres" npx tsx scripts/deploy-with-pg.ts
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function deployFunction() {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is required')
    console.error('\nUsage:')
    console.error('  DATABASE_URL="postgresql://postgres:[password]@db.ynatuiwdvkxcmmnmejkl.supabase.co:5432/postgres" npx tsx scripts/deploy-with-pg.ts')
    console.error('\nTo get your database password:')
    console.error('  1. Go to: https://supabase.com/dashboard/project/ynatuiwdvkxcmmnmejkl/settings/database')
    console.error('  2. Scroll to "Connection string"')
    console.error('  3. Copy the "URI" format')
    console.error('  4. Replace [YOUR-PASSWORD] with your database password')
    process.exit(1)
  }

  const sql = readFileSync(join(__dirname, '../supabase/migrations/20260110000000_image_delete_security_fix.sql'), 'utf-8')

  const pool = new Pool({ connectionString: dbUrl })

  try {
    console.log('Connecting to database...')
    const client = await pool.connect()

    console.log('Executing SQL...')
    await client.query(sql)

    console.log('Verifying function creation...')
    const result = await client.query(`
      SELECT
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'delete_supplier_image'
    `)

    if (result.rows.length > 0) {
      console.log('\nFunction deployed successfully!')
      console.log('Function:', result.rows[0].function_name)
    } else {
      console.error('Function not found after deployment')
    }

    client.release()
  } catch (err) {
    console.error('Deployment failed:', err.message)
    throw err
  } finally {
    await pool.end()
  }
}

deployFunction().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
