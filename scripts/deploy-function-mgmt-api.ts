/**
 * Deploy delete_supplier_image function using Supabase Management API
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ynatuiwdvkxcmmnmejkl'
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

// Get service role key from env
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('Set it in .env.local or run: export SUPABASE_SERVICE_ROLE_KEY=your-key')
  process.exit(1)
}

async function deploy() {
  const sql = readFileSync(join(__dirname, '../supabase/migrations/20260110000000_image_delete_security_fix.sql'), 'utf-8')

  console.log('Deploying delete_supplier_image function...')
  console.log('Project:', PROJECT_REF)

  // Try Management API
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Success!', result)
      return
    }

    const error = await response.text()
    console.error('API Error:', response.status, error)
  } catch (err: any) {
    console.error('Request failed:', err.message)
  }

  console.log('\n==================================')
  console.log('MANUAL DEPLOYMENT INSTRUCTIONS')
  console.log('==================================\n')

  console.log('Please run this SQL in Supabase Dashboard:')
  console.log('https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new\n')

  console.log('SQL:\n' + '='.repeat(80))
  console.log(sql)
  console.log('='.repeat(80))
}

deploy().catch(console.error)
