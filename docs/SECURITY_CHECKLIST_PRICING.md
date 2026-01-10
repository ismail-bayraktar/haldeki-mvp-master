# Security Checklist: Pricing System Deployment
**Version:** 1.0
**Last Updated:** 2026-01-10
**Status:** PRE-PRODUCTION

---

## Overview

This checklist MUST be completed before deploying the pricing system redesign to production. Each item must be verified by a security reviewer.

**CRITICAL:** Do not deploy if any CRITICAL item is unchecked.

---

## Part 1: Access Control (A01)

### B2B Pricing Isolation

- [ ] **CRIT-001:** Verify business_price column is not exposed to non-business users
  - Test: Create B2C user account
  - Query: `SELECT * FROM region_products WHERE product_id = '<test_id>'`
  - Verify: `business_price` field is NULL
  - Check network response in browser DevTools

- [ ] **CRIT-002:** Verify business_price cannot be accessed through views
  - Test: Attempt `SELECT * FROM bugun_halde_comparison` as B2C user
  - Verify: No business pricing data returned
  - Check: Views use security functions, not direct table access

- [ ] **CRIT-003:** Verify RPC functions filter business prices
  - Test: Call `calculate_product_price()` as B2C user
  - Verify: Returned price does not include business pricing
  - Check: Function has role-based logic

### Supplier Pricing Isolation

- [ ] **HIGH-001:** Verify suppliers cannot see competitor pricing
  - Test: Create supplier account for Supplier A
  - Query: `SELECT * FROM supplier_products WHERE product_id = '<shared_product>'`
  - Verify: Only Supplier A's products returned
  - Check: RLS policy enforces supplier_id = current_supplier

- [ ] **HIGH-002:** Verify supplier_products not public
  - Test: Attempt query without authentication
  - Verify: Returns empty set or error
  - Check: RLS enabled, no public policy

### Regional Pricing Enforcement

- [ ] **HIGH-003:** Verify users cannot access other regions' pricing
  - Test: User in Region A attempts to access Region B pricing
  - Verify: Access denied or prices from Region A returned
  - Check: Region validation in API layer

---

## Part 2: Input Validation (A05)

### Price Validation

- [ ] **CRIT-004:** Verify negative prices rejected
  - Test: Attempt to set price = -100
  - Verify: Constraint violation error
  - Check: Database constraint `CHECK (price > 0)`

- [ ] **CRIT-005:** Verify excessive prices rejected
  - Test: Attempt to set price = 999999999
  - Verify: Constraint violation error
  - Check: Database constraint `CHECK (price <= 999999.99)`

- [ ] **HIGH-004:** Verify price change limits enforced
  - Test: Attempt to change price by 100% (double)
  - Verify: Rejected with "exceeds maximum allowed" error
  - Check: Trigger `validate_price_change()` active

- [ ] **MED-001:** Verify price inputs are NUMERIC type
  - Test: Attempt to pass string or JSON as price
  - Verify: Type conversion error
  - Check: Function parameter types

### SQL Injection Prevention

- [ ] **CRIT-006:** Verify search functions sanitize input
  - Test: Pass `'; DROP TABLE supplier_products; --` as search text
  - Verify: Query executes safely, returns empty or error
  - Check: Input sanitization in RPC functions

- [ ] **CRIT-007:** Verify ILIKE patterns escaped
  - Test: Pass `%_\` characters in search
  - Verify: Treated as literal characters, not wildcards
  - Check: `regexp_replace()` escaping special chars

### UUID Validation

- [ ] **MED-002:** Verify UUID inputs validated
  - Test: Pass invalid UUID `00000000-0000-0000-0000-000000000000`
  - Verify: Returns "not found" error, not crash
  - Check: RPC functions validate UUID format

---

## Part 3: RPC Function Security

### Authentication

- [ ] **CRIT-008:** Verify all RPC functions require authentication
  - Test: Sign out, call any RPC function
  - Verify: Returns "Authentication required" error
  - Check: All functions have `auth.uid() IS NULL` check

- [ ] **CRIT-009:** Verify SECURITY DEFINER functions have auth checks
  - Test: Create function with `SECURITY DEFINER`, test as unauth user
  - Verify: Access denied despite elevated privileges
  - Check: Auth check before any data access

### Authorization

- [ ] **HIGH-005:** Verify role-based access in RPC functions
  - Test: Call admin function as regular user
  - Verify: "Insufficient permissions" error
  - Check: Function verifies `has_role(auth.uid(), '<role>')`

- [ ] **HIGH-006:** Verify supplier ownership checks
  - Test: Supplier A attempts to update Supplier B's product
  - Verify: Access denied
  - Check: Query checks `supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())`

---

## Part 4: Audit Logging (A09)

### Price Change Logging

- [ ] **CRIT-010:** Verify all price changes logged
  - Test: Update a product price
  - Query: `SELECT * FROM price_audit_log WHERE supplier_product_id = '<id>' ORDER BY changed_at DESC LIMIT 1`
  - Verify: New record with old_price, new_price, changed_by, changed_at
  - Check: Trigger `log_price_change()` active

- [ ] **CRIT-011:** Verify audit logs are immutable
  - Test: Attempt `UPDATE price_audit_log SET new_price = 999 WHERE id = '<id>'`
  - Verify: Access denied
  - Check: RLS policy prevents updates/deletes

- [ ] **HIGH-007:** Verify audit logs capture user context
  - Test: Change price as supplier user
  - Query: Check `changed_by_role` in audit log
  - Verify: Correct role (supplier/admin) recorded
  - Check: Trigger fetches user role from profiles table

### Security Event Logging

- [ ] **HIGH-008:** Verify security events table exists
  - Test: Query `SELECT * FROM security_events LIMIT 1`
  - Verify: Table exists and is indexed
  - Check: Table has proper columns (event_type, severity, affected_user)

- [ ] **HIGH-009:** Verify price anomalies logged
  - Test: Change price by 75% (assuming limit is 50%)
  - Query: `SELECT * FROM security_events WHERE event_type = 'price_anomaly'`
  - Verify: Anomaly event recorded
  - Check: Trigger `detect_price_manipulation()` active

---

## Part 5: Rate Limiting & Abuse Prevention

### Price Update Rate Limiting

- [ ] **HIGH-010:** Verify suppliers cannot spam price updates
  - Test: Update same product price 10 times in 1 minute
  - Verify: Rate limit error after threshold
  - Check: Application-level rate limiting or database trigger

- [ ] **MED-003:** Verify API endpoint rate limiting
  - Test: Send 100 requests/second to pricing endpoint
  - Verify: HTTP 429 (Too Many Requests) returned
  - Check: API gateway or Supabase rate limits configured

---

## Part 6: Data Protection (A04)

### Encryption at Rest

- [ ] **MED-004:** Verify sensitive columns protected
  - Check: Database encryption enabled
  - Verify: Backups encrypted
  - Test: Cannot read raw data files

### Encryption in Transit

- [ ] **MED-005:** Verify TLS enforced
  - Test: Attempt HTTP connection
  - Verify: Redirects to HTTPS
  - Check: SSL/TLS certificate valid

### PII Protection

- [ ] **MED-006:** Verify user emails not in pricing data
  - Test: Query supplier_products, region_products
  - Verify: No email addresses in results
  - Check: No PII in pricing tables

---

## Part 7: Error Handling (A10)

### Fail-Secure Behavior

- [ ] **CRIT-012:** Verify pricing errors don't expose internals
  - Test: Trigger a pricing error (invalid input)
  - Verify: Generic error message, no stack traces
  - Check: Error messages don't reveal database structure

- [ ] **HIGH-011:** Verify price calculation failures are safe
  - Test: Pass invalid parameters to price calculation
  - Verify: Returns error or default price, not crash
  - Check: Exception handling in RPC functions

### Graceful Degradation

- [ ] **MED-007:** Verify regional price fallback
  - Test: Query product for region with no pricing
  - Verify: Returns default supplier price or error
  - Check: COALESCE logic in price functions

---

## Part 8: Testing Requirements

### Unit Tests

- [ ] **TEST-001:** Verify price calculation unit tests exist
  - Check: Tests for `calculate_product_price()`
  - Verify: Edge cases covered (null inputs, negative prices, etc.)

- [ ] **TEST-002:** Verify RLS policy unit tests exist
  - Check: Tests for each role (customer, business, supplier, admin)
  - Verify: Each role can only access allowed data

### Integration Tests

- [ ] **TEST-003:** Verify price update flow tested
  - Check: End-to-end test for supplier updating price
  - Verify: Audit log created, price_change field updated

- [ ] **TEST-004:** Verify business pricing flow tested
  - Check: B2B user gets business price
  - Verify: B2C user cannot access business price

### Security Tests

- [ ] **TEST-005:** Verify SQL injection tests exist
  - Check: Test suite includes injection attempts
  - Verify: All attempts blocked

- [ ] **TEST-006:** Verify authorization bypass tests exist
  - Check: Tests for privilege escalation attempts
  - Verify: All attempts blocked

---

## Part 9: Monitoring & Alerting

### Real-time Monitoring

- [ ] **MON-001:** Verify price anomaly alerts configured
  - Test: Trigger price anomaly (> 50% change)
  - Verify: Alert sent to security team
  - Check: Alert integration (email, Slack, PagerDuty)

- [ ] **MON-002:** Verify audit log monitoring
  - Test: Make multiple price changes
  - Verify: Changes visible in monitoring dashboard
  - Check: Dashboard queries audit log table

### Incident Response

- [ ] **MON-003:** Verify rollback procedure documented
  - Check: Runbook for price manipulation incidents
  - Verify: Rollback function tested
  - Check: Admin knows procedure

---

## Part 10: Documentation

### Security Documentation

- [ ] **DOC-001:** Verify security model documented
  - Check: Diagram showing access control flow
  - Verify: RLS policies documented
  - Check: Role permissions matrix

- [ ] **DOC-002:** Verify API security documented
  - Check: Authentication requirements for each endpoint
  - Verify: Rate limits documented
  - Check: Input validation rules listed

### Operational Documentation

- [ ] **DOC-003:** Verify deployment security checklist exists
  - Check: Pre-deployment verification steps
  - Verify: Post-deployment monitoring steps
  - Check: Rollback procedure

---

## Part 11: Compliance

### GDPR Compliance

- [ ] **COMPL-001:** Verify user right to data deletion
  - Test: User account deletion request
  - Verify: Pricing data anonymized or deleted
  - Check: Audit trail preserved (legal requirement)

### Financial Regulations

- [ ] **COMPL-002:** Verify price change audit retention
  - Check: Audit logs retained for required period (e.g., 7 years)
  - Verify: Logs cannot be deleted
  - Check: Backup and archive strategy

---

## Sign-off

### Developer Sign-off

- [ ] All code changes reviewed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed

**Developer:** _______________________ **Date:** ________

### Security Reviewer Sign-off

- [ ] All CRITICAL items addressed
- [ ] All HIGH items addressed or risk accepted
- [ ] Penetration testing completed
- [ ] Security monitoring configured

**Security Reviewer:** _______________________ **Date:** ________

### Operations Sign-off

- [ ] Deployment plan reviewed
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] On-call team notified

**Operations Lead:** _______________________ **Date:** ________

### Product Owner Sign-off

- [ ] Business requirements met
- [ ] User acceptance testing passed
- [ ] Risk assessment reviewed
- [ ] Go/no-go decision made

**Product Owner:** _______________________ **Date:** ________

---

## Final Status

**Total Items:** 61
**Critical:** 12
**High:** 19
**Medium:** 20
**Low/Info:** 10

**Completed:** _____ / 61
**Blocking Issues:** _____

**Deployment Decision:** [ ] APPROVED [ ] DEFERRED [ ] REJECTED

**Comments:**
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

---

**Checklist Version:** 1.0
**Last Updated:** 2026-01-10
**Next Review:** After each security update
