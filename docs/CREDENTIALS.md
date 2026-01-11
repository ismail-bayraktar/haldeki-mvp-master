# Credentials Setup Guide

This guide explains how to securely set up credentials for the Haldeki.com project.

## Prerequisites

Before setting up credentials, ensure you have:

- [ ] Access to the Supabase project
- [ ] Access to the code repository
- [ ] Node.js 22.x installed locally
- [ ] Git configured with SSH keys (not passwords)

## Step 1: Create Local Environment File

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Never commit `.env.local` - it's already in `.gitignore`

## Step 2: Get Supabase Credentials

### Access Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in with your account
3. Select the `haldeki-market` project

### Get Project URL and Anon Key

1. In Supabase, navigate to: **Settings** → **API**
2. Copy the following values:

   | Setting | Copy To |
   |---------|---------|
   | Project URL | `VITE_SUPABASE_URL` |
   | anon/public key | `VITE_SUPABASE_ANON_KEY` |

3. Paste them into your `.env.local` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Get Service Role Key (Server-Side Only)

1. On the same API page in Supabase
2. Copy the `service_role` key
3. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **WARNING**: Never use `service_role` key in client-side code!

### Get Database Connection String

1. In Supabase, navigate to: **Settings** → **Database**
2. Find "Connection string" section
3. Select "URI" tab
4. Choose "Transaction" mode
5. Copy the connection string
6. Replace `[password]` with your database password:
   ```bash
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.your-project.supabase.co:5432/postgres
   ```

### Where to Find Database Password

1. In Supabase, go to: **Settings** → **Database**
2. Scroll to "Database password" section
3. Click "Reset database password" if you don't know it
4. Copy the new password immediately (you won't see it again!)

## Step 3: Optional Third-Party Credentials

### Stripe (Payment Processing)

If using Stripe for payments:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to: **Developers** → **API keys**
3. Copy the keys:

   ```bash
   # Client-side (safe to expose)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51M...

   # Server-side (NEVER commit)
   STRIPE_SECRET_KEY=sk_test_51M...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Other Services

Add any other service credentials following the same pattern:
- Client-safe keys: Prefix with `VITE_`
- Server secrets: No prefix, use in server code only

## Step 4: Verify Your Setup

### Test Environment Variables

```bash
# Start development server
npm run dev
```

If the app loads without errors, your credentials are set up correctly.

### Test Database Connection

```bash
# Run database verification script
npm run auth:verify
```

## Step 5: Production Deployment

### Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**
4. Add each variable from your `.env.local`

**Important**: Use different values for production!

### Environment-Specific Values

| Environment | Supabase Project | Stripe Mode |
|-------------|------------------|-------------|
| Development | `haldeki-dev` | Test mode |
| Staging | `haldeki-staging` | Test mode |
| Production | `haldeki-prod` | Live mode |

## Troubleshooting

### Common Issues

#### "Invalid API Key" Error

**Cause**: Wrong or missing `VITE_SUPABASE_ANON_KEY`

**Solution**:
1. Re-copy the key from Supabase dashboard
2. Ensure no extra spaces or quotes
3. Restart dev server: `npm run dev`

#### "Database connection failed" Error

**Cause**: Wrong `DATABASE_URL` or database password

**Solution**:
1. Verify password in Supabase dashboard
2. Check connection string format
3. Ensure database is not paused (Supabase free tier pauses after 1 week)

#### "Service role key not allowed" Error

**Cause**: Using service role key in client code

**Solution**:
1. Service role keys are for server-side only
2. Use anon key for client operations
3. Use service role in Edge Functions or server scripts

### Reset Credentials

If credentials are compromised:

1. **Supabase**:
   - Go to Settings → API
   - Click "Rotate service role key"
   - Update `.env.local` immediately

2. **Database**:
   - Go to Settings → Database
   - Reset database password
   - Update connection string

3. **Stripe**:
   - Roll API keys in dashboard
   - Update webhook endpoints

## Security Checklist

Before committing or pushing:

- [ ] `.env.local` is in `.gitignore`
- [ ] No real credentials in `.env.example`
- [ ] No credentials in client-side code (`src/` folder)
- [ ] Service role key only used server-side
- [ ] Database password not in git history
- [ ] `.env` file not committed
- [ ] Production secrets use environment variables (Vercel/Railway)

## Credential Rotation Schedule

| Credential | Rotation Frequency | Last Rotated |
|------------|-------------------|--------------|
| Database password | Every 90 days | _ |
| Service role key | Every 60 days | _ |
| API keys | After any breach | _ |
| Webhook secrets | After any breach | _ |

## Need Help?

- **Documentation**: See `docs/SECURITY.md`
- **Email**: info@haldeki.com
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Remember**: Credentials are like keys to your house - keep them safe and never share them publicly!
