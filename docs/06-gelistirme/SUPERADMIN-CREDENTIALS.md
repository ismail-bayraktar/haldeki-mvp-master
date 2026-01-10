# SuperAdmin Credentials - PRODUCTION

> **SECURITY ALERT** - This document contains PRODUCTION credentials
> **CONFIDENTIAL** - Access restricted to authorized personnel only
> **Last Updated**: 2026-01-09
> **Status**: ACTIVE

---

## Security Warning

**CRITICAL SECURITY REQUIREMENTS:**

1. **DO NOT COMMIT** this file to version control
2. **DO NOT SHARE** via email, chat, or unauthorized channels
3. **DO NOT STORE** in cloud storage without encryption
4. **CHANGE PASSWORD** immediately if suspected compromise
5. **USE 2FA** - Multi-factor authentication is mandatory
6. **LOG OUT** after each admin session
7. **SECURE CONNECTION** only - HTTPS required

---

## Production SuperAdmin Account

### Primary SuperAdmin

| Field | Value |
|-------|-------|
| **Email** | `admin@haldeki.com` |
| **Password** | `hws8WadKktlvvjO8` |
| **Role** | superadmin |
| **Created** | 2026-01-09 |
| **Status** | Active |
| **2FA** | Not enabled (ENABLE IMMEDIATELY) |
| **Last Password Change** | 2026-01-09 |

### Access Permissions

**Full System Access:**
- User management (create, edit, delete, ban)
- Supplier management (approve, reject, suspend)
- Product management (all products, all suppliers)
- Order management (view, modify, refund all orders)
- Business panel (all administrative functions)
- System settings (configuration, regions, delivery slots)
- Audit logs (view all system activity)

---

## First-Time Setup

### Step 1: Initial Login

1. Navigate to: `https://haldeki-market.vercel.app`
2. Click "Login" button
3. Enter email: `admin@haldeki.com`
4. Enter password: `hws8WadKktlvvjO8`
5. Click "Sign In"

### Step 2: Enable 2FA (CRITICAL)

**Immediately after first login:**

1. Go to: Profile Settings → Security
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with authenticator app:
   - Google Authenticator (recommended)
   - Authy
   - Microsoft Authenticator
   - 1Password
4. Enter 6-digit verification code
5. Save backup codes in secure location
6. Confirm 2FA is enabled

### Step 3: Change Password (Recommended)

1. Go to: Profile Settings → Security
2. Click "Change Password"
3. Enter current password: `hws8WadKktlvvjO8`
4. Enter new password (minimum 16 characters, must include):
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%^&*)
5. Confirm new password
6. Click "Update Password"
7. **UPDATE THIS DOCUMENT** with new password

### Step 4: Verify Access

**Test all critical functions:**

- [ ] Access User Management page
- [ ] Access Supplier Management page
- [ ] View all products
- [ ] View all orders
- [ ] Access Audit Logs
- [ ] Modify system settings

---

## Admin Panel Features

### User Management

**Location:** Business Panel → Users

**Actions:**
- Create new users (any role)
- Edit user profiles
- Change user roles
- Ban/unban users
- Delete users
- View user activity
- Reset user passwords

**Quick Test:**
1. Navigate to Users page
2. Click "Create User"
3. Fill in user details
4. Select role (customer, supplier, admin)
5. Click "Create"
6. Verify user appears in list

---

### Supplier Management

**Location:** Business Panel → Suppliers

**Actions:**
- View all supplier applications
- Approve pending suppliers
- Reject supplier applications
- Suspend active suppliers
- View supplier details
- Manage supplier products

**Quick Test:**
1. Navigate to Suppliers page
2. Review pending applications
3. Click on supplier to view details
4. Approve or reject as appropriate
5. Verify supplier status change

---

### Product Management

**Location:** Business Panel → Products

**Actions:**
- View all products across all suppliers
- Edit product details
- Delete products
- Manage product variations
- Set global pricing rules

**Quick Test:**
1. Navigate to Products page
2. Filter by supplier or category
3. Click on product to view details
4. Verify product information accuracy

---

### Order Management

**Location:** Business Panel → Orders

**Actions:**
- View all orders
- Filter by status, date, supplier
- View order details
- Modify order status
- Process refunds
- Export order data

**Quick Test:**
1. Navigate to Orders page
2. Apply filters
3. Click on order to view details
4. Verify order information

---

### Audit Logs

**Location:** Business Panel → Audit Logs

**Information:**
- All admin actions
- User activities
- System changes
- Login attempts
- Failed actions

**Quick Test:**
1. Navigate to Audit Logs page
2. Apply filters (date, user, action)
3. Review recent activities
4. Verify logging is working

---

## Beta Testing Workflow

### Creating Test Users

**From SuperAdmin Panel:**

1. Login as SuperAdmin
2. Navigate to: Business Panel → Users
3. Click "Create User"
4. Fill in user details:
   - Email (use test@haldeki.com format)
   - Name
   - Phone (optional)
   - Role (select from dropdown)
   - Password (generate secure password)
5. Click "Create"
6. Record credentials in secure location
7. Share with tester via secure channel

**Example Test User Creation:**

| Role | Email Format | Password |
|------|-------------|----------|
| Supplier | supplier-beta@haldeki.com | [Generate 16-char] |
| Customer | customer-beta@haldeki.com | [Generate 16-char] |
| Dealer | dealer-beta@haldeki.com | [Generate 16-char] |

---

### Creating Supplier Accounts

**Method 1: Direct Creation**

1. Navigate to: Business Panel → Users
2. Click "Create User"
3. Enter supplier details:
   - Email: [supplier-email]@haldeki.com
   - Role: supplier
   - Password: [generate secure password]
4. Click "Create"
5. Navigate to: Business Panel → Suppliers
6. Find new supplier
7. Click "Approve"

**Method 2: Registration + Approval**

1. Share registration link with supplier
2. Supplier registers themselves
3. Navigate to: Business Panel → Suppliers
4. Find pending application
5. Review supplier details
6. Click "Approve" or "Reject"

---

### Supplier Price Update Testing

**Test Supplier Login:**

1. Logout from SuperAdmin
2. Login with supplier credentials:
   - Email: [supplier-email]@haldeki.com
   - Password: [supplier-password]
3. Navigate to: Supplier Panel → Products
4. Select product to update
5. Update price
6. Click "Save"
7. Verify price change in database

**Verify Price Update as SuperAdmin:**

1. Login as SuperAdmin
2. Navigate to: Business Panel → Products
3. Find updated product
4. Verify new price is displayed
5. Check audit log for price change

---

## Security Best Practices

### Password Management

**DO:**
- Use password manager (1Password, Bitwarden, LastPass)
- Enable 2FA on admin account
- Change password every 90 days
- Use unique password for SuperAdmin
- Log out after each session

**DON'T:**
- Write password on paper
- Store in unencrypted file
- Share via email/chat
- Reuse passwords
- Save in browser

### Session Management

**Best Practices:**
1. Always log out when done
2. Don't check "Remember me"
3. Clear browser cache after admin work
4. Use private/incognito mode for admin access
5. Don't use public WiFi for admin access
6. Use VPN if accessing from remote location

### Access Control

**Authorized Personnel Only:**
- System administrators
- DevOps engineers
- CTO/Technical lead
- Designated business admin

**Access Logging:**
- All logins are recorded
- Failed attempts trigger alerts
- Suspicious activity locks account
- Geographic location tracking enabled

---

## Troubleshooting

### Login Issues

**Problem: Cannot login**
- Check email is correct: `admin@haldeki.com`
- Verify password: `hws8WadKktlvvjO8`
- Clear browser cache
- Try different browser
- Check internet connection
- Verify URL: `https://haldeki-market.vercel.app`

**Problem: Account locked**
- Wait 15 minutes (lockout duration)
- Try again with correct password
- Contact system administrator if persists

**Problem: 2FA not working**
- Verify time on device is correct
- Check authenticator app is synced
- Use backup code if available
- Contact system administrator if locked out

---

### Access Issues

**Problem: Cannot access Business Panel**
- Verify account has superadmin role
- Check if logged in with correct account
- Clear browser cache
- Try different browser
- Contact system administrator

**Problem: Cannot create users**
- Check permissions (must be superadmin)
- Verify database connection
- Check browser console for errors
- Contact system administrator

---

## Emergency Procedures

### Compromised Account

**If password is suspected to be compromised:**

1. **IMMEDIATE ACTION:**
   - Login and change password
   - Revoke all active sessions
   - Enable 2FA if not enabled
   - Review audit logs for suspicious activity

2. **If unable to login:**
   - Contact system administrator immediately
   - Use Supabase dashboard to reset password
   - Notify all admin users

3. **Post-incident:**
   - Document what happened
   - Review audit logs
   - Identify affected data
   - Implement additional security measures
   - Update this document

### Account Recovery

**If locked out of account:**

1. Use Supabase dashboard:
   - Go to: Supabase project → Authentication → Users
   - Find admin@haldeki.com
   - Click "Reset Password"
   - Set new secure password
   - Notify user of new password via secure channel

2. Update this document with new password

---

## Maintenance Tasks

### Daily

- [ ] Review failed login attempts
- [ ] Check audit logs for suspicious activity
- [ ] Verify system performance

### Weekly

- [ ] Review new user registrations
- [ ] Check supplier applications
- [ ] Verify data backups
- [ ] Review system logs

### Monthly

- [ ] Change SuperAdmin password
- [ ] Review user access levels
- [ ] Update security documentation
- [ ] Test disaster recovery procedures

---

## Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| System Admin | | | |
| DevOps Engineer | | | |
| CTO | | | |
| Security Lead | | | |

**Emergency Contact:** [Add emergency contact details]

---

## Change Log

| Date | Change | Updated By |
|------|--------|------------|
| 2026-01-09 | Initial document created | System |
| 2026-01-09 | SuperAdmin account created | System |
| | | |
| | | |

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Classification** | CONFIDENTIAL |
| **Distribution** | Authorized personnel only |
| **Review Date** | 2026-02-09 |
| **Next Review** | 2026-02-09 |

---

**IMPORTANT:** This document must be updated immediately when:
- Password is changed
- New admin accounts are created
- Security incidents occur
- Access permissions change
- Contact information changes

**WARNING:** Unauthorized access to this document or the credentials contained herein is a security breach. Report immediately to system administrator.
