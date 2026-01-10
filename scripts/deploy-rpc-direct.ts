/**
 * Deploy delete_supplier_image function using Supabase Management API
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_REF = 'ynatuiwdvkxcmmnmejkl'

async function getAccessToken(): Promise<string> {
  const { execSync } = await import('child_process')
  try {
    const token = execSync('npx supabase access-token', { encoding: 'utf-8' }).trim()
    return token
  } catch {
    throw new Error('Failed to get access token. Please run: npx supabase login')
  }
}

async function deployViaManagementAPI() {
  const sqlPath = join(__dirname, '../supabase/migrations/20260110000000_image_delete_security_fix.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  console.log('Deploying delete_supplier_image function...')
  console.log('Project Ref:', PROJECT_REF)
  console.log('\nSQL to execute:\n' + '='.repeat(80))
  console.log(sql)
  console.log('='.repeat(80))

  const accessToken = await getAccessToken()

  // Using Supabase Management API v1
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('\nDeployment failed:', error)
    console.log('\nPlease run this SQL manually in Supabase Dashboard > SQL Editor')
    process.exit(1)
  }

  const result = await response.json()
  console.log('\nFunction deployed successfully!')
  console.log('Result:', JSON.stringify(result, null, 2))
}

deployViaManagementAPI().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
