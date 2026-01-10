/**
 * Deploy delete_supplier_image function to Supabase
 * Uses direct PostgreSQL connection via psql-style execution
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sqlPath = join(__dirname, '../supabase/migrations/20260110000000_image_delete_security_fix.sql')

async function deployFunction() {
  try {
    console.log('Reading SQL from:', sqlPath)
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('\n============================================')
    console.log('SQL TO EXECUTE:')
    console.log('============================================\n')
    console.log(sql)
    console.log('\n============================================\n')

    console.log('To deploy this function, you have two options:\n')
    console.log('OPTION 1 - Supabase Dashboard (Recommended):')
    console.log('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql')
    console.log('  2. Paste the SQL above')
    console.log('  3. Click "Run"\n')

    console.log('OPTION 2 - psql command line:')
    console.log('  psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f "' + sqlPath + '"\n')

    console.log('Note: The migration push failed due to auth schema permissions.')
    console.log('This specific function only uses public schema and should work.\n')

  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

deployFunction()
