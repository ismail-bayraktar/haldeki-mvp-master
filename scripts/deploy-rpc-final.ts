/**
 * Deploy delete_supplier_image function
 * Multiple deployment strategies
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sql = readFileSync(join(__dirname, '../supabase/migrations/20260110000000_image_delete_security_fix.sql'), 'utf-8')

async function deployViaCurl() {
  const PROJECT_REF = 'ynatuiwdvkxcmmnmejkl'
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

  console.log('Attempting deployment via Supabase Management API...')
  console.log('URL:', url)

  // Try using curl if available
  const { execSync } = await import('child_process')

  try {
    const response = execSync(
      `curl -s -X POST "${url}" \\
        -H "Authorization: Bearer $(npx supabase status 2>nul | findstr API_URL || echo)" \\
        -H "Content-Type: application/json" \\
        -d '${JSON.stringify({ sql })}'`,
      { encoding: 'utf-8', shell: true }
    )
    console.log('Response:', response)
  } catch (err) {
    console.error('Curl failed:', err.message)
  }
}

async function deployViaPg() {
  console.log('Attempting deployment via pg library...')

  // Need to get database password
  // Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

  console.log('\n==================================')
  console.log('MANUAL DEPLOYMENT REQUIRED')
  console.log('==================================\n')

  console.log('Option 1: Supabase Dashboard SQL Editor')
  console.log('  1. Go to: https://supabase.com/dashboard/project/ynatuiwdvkxcmmnmejkl/sql/new')
  console.log('  2. Paste the SQL below')
  console.log('  3. Click "Run"\n')

  console.log('Option 2: psql (if available)')
  console.log('  psql "postgresql://postgres:[YOUR-PASSWORD]@db.ynatuiwdvkxcmmnmejkl.supabase.co:5432/postgres" -f migrations/20260110000000_image_delete_security_fix.sql\n')

  console.log('SQL to execute:\n' + '='.repeat(80))
  console.log(sql)
  console.log('='.repeat(80))
}

async function main() {
  await deployViaCurl()
  await deployViaPg()
}

main().catch(console.error)
