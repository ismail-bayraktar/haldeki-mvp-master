# Security Policy

## Credential Management

### NEVER Commit These Files

The following files contain sensitive information and MUST NEVER be committed to git:

- `.env` - Production/development environment variables
- `.env.local` - Local overrides
- `.env.*.local` - Environment-specific local files
- Any files with real API keys, passwords, or secrets

### Protected Files (Already in .gitignore)

```gitignore
# Environment variables - NEVER COMMIT THESE
.env
.env.local
.env.*.local

# Production credentials (NEVER COMMIT)
docs/development/SUPERADMIN-CREDENTIALS.md
docs/BETA-TESTING-GUIDE.md

# Scripts with hardcoded credentials (NEVER COMMIT)
scripts/create-test-*
scripts/deploy-rpc-automated.ts
scripts/check-test-users.ts
scripts/create-aliaga-menemen-suppliers.ts
scripts/reset-supabase-passwords-quick.js
scripts/reset-passwords-admin.js
scripts/diagnose-login-issue.js
scripts/fix-test-user-roles.ts
scripts/deploy-function-mgmt-api.ts
scripts/deploy-with-pg.ts
scripts/create-whitelist-test-users.ts
```

## Required Environment Variables

### Supabase Configuration

```bash
# Required for all environments
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Service Role Keys (Server-Side Only)

```bash
# NEVER expose these in client-side code
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Optional Third-Party Services

```bash
# Stripe (if payment integration is enabled)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Getting Credentials Safely

### 1. Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Navigate to Settings > API
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon/public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only!)

### 2. Database Connection String

1. In Supabase project, go to Settings > Database
2. Find "Connection string" > "URI" tab
3. Copy the PostgreSQL connection string
4. Replace `[password]` with your database password

### 3. Stripe Credentials (Optional)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get API keys from Developers > API keys
3. Set up webhook secret from Developers > Webhooks

## Security Best Practices

### Development Environment

- DO use `.env.local` for local development overrides
- DO add `.env.local` to `.gitignore` (already done)
- DO NOT commit `.env` files with real values
- DO share `.env.example` with placeholder values only

### Production Deployment

- DO use environment variables in your hosting platform (Vercel, Railway, etc.)
- DO NOT commit production credentials to git
- DO rotate credentials if accidentally exposed
- DO use different credentials for each environment

### API Key Protection

| Type | Where to Store | Exposure Risk |
|------|----------------|---------------|
| `VITE_*` variables | `.env` file | Client-side (public) |
| Server-only secrets | Hosting platform env vars | Server-side only |
| Service role keys | NEVER in client code | Critical - keep secret |

### Pre-commit Hooks (Recommended)

Install [git-secrets](https://github.com/awslabs/git-secrets) or similar:

```bash
# Prevent committing common secret patterns
git secrets --add 'password\s*=\s*["\047]?[^\s"]+["\047]?'
git secrets --add 'api[_-]key\s*=\s*["\047]?[^\s"]+["\047]?'
git secrets --add 'secret\s*=\s*["\047]?[^\s"]+["\047]?'
```

## Reporting Security Issues

### Found a Vulnerability?

If you discover a security vulnerability, please:

1. DO NOT create a public issue
2. DO email: info@haldeki.com
3. DO include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Timeline

- **Critical**: Response within 24 hours
- **High**: Response within 48 hours
- **Medium**: Response within 1 week
- **Low**: Response within 2 weeks

## Security Headers

This application implements the following security headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=()
```

## Dependency Security

### Automated Scanning

```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

### Regular Updates

- Update dependencies weekly
- Review security advisories
- Test updates in staging first

## Access Control

### Role-Based Access (RBAC)

This application implements role-based access control:

| Role | Permissions |
|------|-------------|
| `superadmin` | Full system access |
| `admin` | Administrative functions |
| `supplier` | Product management |
| `dealer` | Regional sales |
| `business` | B2B purchasing |
| `warehouse_staff` | Order fulfillment |

### Row Level Security (RLS)

All database tables use Supabase RLS policies:

- Users can only access their own data
- Suppliers can only modify their products
- Dealers see only their assigned regions

## Data Protection

### Sensitive Data Handling

- Passwords are hashed with bcrypt
- PII is encrypted at rest
- API communication uses TLS 1.3
- Database backups are encrypted

### Retention Policy

- User data: Retained until account deletion
- Order history: 5 years (legal requirement)
- Logs: 90 days maximum

## Compliance

This application follows:

- **KVKK** (Turkish Data Protection Law)
- **GDPR** (EU General Data Protection Regulation)
- **PCI DSS** (Payment Card Industry Standards)

---

Last updated: 2026-01-11
