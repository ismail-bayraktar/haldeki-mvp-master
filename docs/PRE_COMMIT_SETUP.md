# Pre-commit Hook Setup

This repository includes automated secret scanning in pre-commit hooks to prevent accidental credential commits.

## Installation

### Using Husky (Recommended)

1. Install Husky:
   ```bash
   npm install -D husky
   ```

2. Initialize Git hooks:
   ```bash
   npx husky install
   ```

3. Enable pre-commit hook:
   ```bash
   npx husky add .husky/pre-commit "sh .husky/pre-commit"
   ```

4. Make hook executable (Linux/macOS):
   ```bash
   chmod +x .husky/pre-commit
   ```

### Manual Installation

If you prefer not to use Husky:

1. Copy `.husky/pre-commit` to `.git/hooks/pre-commit`
2. Make it executable:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

## What It Checks

### Forbidden Files

The hook blocks commits of files with these names:
- `.env`, `.env.local`, `.env.*.local`
- `*.pem`, `*.key` files
- Private key files (`id_rsa`, `id_ed25519`)
- Credential files (`credentials.json`, `service-account.json`)

### Secret Patterns

The hook scans for patterns like:
- Supabase service role keys
- Database connection strings with passwords
- Stripe API keys
- JWT secrets
- AWS access keys
- GitHub tokens
- Slack tokens

## Bypassing (Not Recommended)

If you need to bypass the hook (only if you're absolutely sure):

```bash
git commit --no-verify -m "Your message"
```

**WARNING**: Only use `--no-verify` if you've manually verified no secrets are present!

## Troubleshooting

### Hook Not Running

If commits aren't being checked:

1. Verify hook is installed:
   ```bash
   ls -la .husky/pre-commit
   ```

2. Check file is executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

3. Reinstall Husky:
   ```bash
   npx husky install
   ```

### False Positives

If the hook blocks legitimate code:

1. Review the pattern that matched
2. If it's a false positive, use `--no-verify` temporarily
3. Report the false positive to improve the patterns

## Alternative Tools

### Git Secrets

For more comprehensive scanning:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
apt-get install git-secrets  # Linux

# Configure in repository
git secrets --install
git secrets --register-aws
```

### TruffleHog

For deep secret scanning:

```bash
pip install truffleHog

# Scan entire repository
trufflehog --regex --entropy=False /path/to/repo
```

## Best Practices

1. **Never disable pre-commit hooks permanently**
2. **Review blocked commits before bypassing**
3. **Use environment variables for all secrets**
4. **Commit `.env.example` with placeholder values**
5. **Rotate credentials if accidentally committed**

## Contributing

To add new secret patterns:

1. Edit `.husky/pre-commit`
2. Add pattern to `PATTERNS` array
3. Test with:
   ```bash
   sh .husky/pre-commit
   ```
4. Submit pull request

---

For more security information, see [docs/SECURITY.md](SECURITY.md).
