# B2B Backend Technical Specification 🎩

Focus: Data integrity, security (RLS), and automation (Triggers/Edge Functions).

## 🗄️ Database Status
- **Role:** `business` role added to `app_role` enum.
- **Tables:** `businesses` table created.
- **Pricing:** `business_price` added to `region_products`.

## 🛠️ Tasks
- [x] **Email Automation (Brevo)**
    - [x] Add `business_invite` template to `send-email` Edge Function.
    - [x] Add `business_approval` notifications.
- [x] **Trigger Refinement**
    - [x] Audit `handle_new_user` trigger for B2B signup via invite token.
    - [x] Ensure `business_data` JSONB in `pending_invites` matches `businesses` table columns.
- [ ] **Security (RLS)**
    - [ ] Audit RLS for `businesses` table:
        - `SELECT`: Own record for business, all for admin.
        - `UPDATE`: Limited fields for business, all for admin.
    - [ ] Review `orders` RLS: Businesses should only see their own orders.
- [ ] **Type Generation**
    - [ ] Synchronize Supabase types with frontend.

## 📝 Notes
- Check if `pending_invites` needs a specific check for the `business` role to prevent role escalation.
