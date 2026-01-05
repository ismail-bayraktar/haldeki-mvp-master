# Test Data Attributes Reference

This document lists all `data-testid` attributes that should be added to components for E2E testing.

## Navigation

| Test ID | Component | Location |
|---------|-----------|----------|
| `nav-products` | Products link | Header navigation |
| `nav-bugun-halde` | Bugun Halde link | Header navigation |
| `nav-cart` | Cart link | Header navigation |
| `nav-account` | Account link | Header navigation |
| `cart-count` | Cart item count badge | Header navigation |

## Authentication

| Test ID | Component | Location |
|---------|-----------|----------|
| `auth-drawer-trigger` | Open auth drawer button | Header |
| `auth-drawer` | Auth drawer container | Auth Drawer |
| `auth-login-tab` | Login tab | Auth Drawer |
| `auth-signup-tab` | Signup tab | Auth Drawer |
| `login-form` | Login form container | Auth Drawer |
| `login-email` | Email input | Login form |
| `login-password` | Password input | Login form |
| `login-submit` | Login button | Login form |
| `signup-form` | Signup form container | Auth Drawer |
| `signup-name` | Name input | Signup form |
| `signup-email` | Email input | Signup form |
| `signup-password` | Password input | Signup form |
| `signup-submit` | Signup button | Signup form |
| `user-menu-trigger` | User menu button | Header (when logged in) |
| `logout-button` | Logout button | User menu |

## Region Selection

| Test ID | Component | Location |
|---------|-----------|----------|
| `region-modal` | Region selection modal | Modal overlay |
| `region-Menemen` | Menemen region option | Region selector |
| `region-Aliaga` | Aliaga region option | Region selector |

## Products

| Test ID | Component | Location |
|---------|-----------|----------|
| `product-{id}` | Product card | Products page, Bugun Halde |
| `product-{slug}` | Product detail link | Product card |
| `add-to-cart` | Add to cart button | Product card, detail page |
| `category-{name}` | Category filter | Products page sidebar |
| `search-input` | Search input | Products page |

## Product Detail

| Test ID | Component | Location |
|---------|-----------|----------|
| `product-name` | Product name | Product detail page |
| `product-price` | Product price | Product detail page |
| `add-to-wishlist` | Add to wishlist button | Product detail page |
| `add-to-compare` | Add to compare button | Product detail page |
| `variant-{label}` | Variant option | Product detail page |

## Cart

| Test ID | Component | Location |
|---------|-----------|----------|
| `cart-item-{id}` | Cart item row | Cart page |
| `quantity-input` | Quantity input | Cart item |
| `update-quantity` | Update quantity button | Cart item |
| `remove-item` | Remove item button | Cart item |
| `proceed-to-checkout` | Checkout button | Cart page |
| `cart-total` | Cart total | Cart page |
| `empty-cart` | Empty cart message | Cart page |

## Checkout

| Test ID | Component | Location |
|---------|-----------|----------|
| `address-{id}` | Address option | Checkout page |
| `address-{title}` | Address option by title | Checkout page |
| `add-address` | Add new address button | Checkout page |
| `address-title` | Address title input | Address form |
| `address-district` | District input | Address form |
| `address-full` | Full address input | Address form |
| `address-phone` | Phone input | Address form |
| `save-address` | Save address button | Address form |
| `slot-{id}` | Delivery slot option | Checkout page |
| `slot-{label}` | Delivery slot by label | Checkout page |
| `place-order` | Place order button | Checkout page |
| `order-total` | Order total | Checkout page |
| `order-summary` | Order summary section | Checkout page |
| `address-error` | Address validation error | Checkout page |
| `slot-error` | Slot validation error | Checkout page |
| `minimum-order-error` | Minimum order error | Checkout page |

## Order Complete

| Test ID | Component | Location |
|---------|-----------|----------|
| `order-success` | Success message | Order complete page |
| `order-id` | Order ID display | Order complete page |

## Admin Panel

| Test ID | Component | Location |
|---------|-----------|----------|
| `admin-dashboard` | Admin dashboard container | Admin pages |
| `admin-nav-{section}` | Admin navigation link | Admin sidebar |
| `dealers-list` | Dealers list | Admin dealers page |
| `dealer-{id}` | Dealer row | Admin dealers page |
| `dealer-status-pending` | Pending status badge | Dealer row |
| `dealer-status-approved` | Approved status badge | Dealer row |
| `dealer-status-rejected` | Rejected status badge | Dealer row |
| `approve-button` | Approve action button | Dealer/Supplier/Business row |
| `reject-button` | Reject action button | Dealer row |
| `dealer-detail-modal` | Dealer detail modal | Admin dealers page |
| `dealer-name` | Dealer name | Dealer detail modal |
| `dealer-email` | Dealer email | Dealer detail modal |
| `dealer-phone` | Dealer phone | Dealer detail modal |
| `dealer-company` | Dealer company | Dealer detail modal |
| `suppliers-list` | Suppliers list | Admin suppliers page |
| `supplier-{id}` | Supplier row | Admin suppliers page |
| `supplier-status-pending` | Pending status badge | Supplier row |
| `supplier-status-approved` | Approved status badge | Supplier row |
| `supplier-detail-modal` | Supplier detail modal | Admin suppliers page |
| `supplier-categories` | Supplier categories | Supplier detail modal |
| `businesses-list` | Businesses list | Admin businesses page |
| `business-{id}` | Business row | Admin businesses page |
| `business-status-pending` | Pending status badge | Business row |
| `business-status-approved` | Approved status badge | Business row |
| `business-detail-modal` | Business detail modal | Admin businesses page |
| `business-tax-no` | Tax number | Business detail modal |
| `business-address` | Business address | Business detail modal |
| `status-filter` | Status filter dropdown | Admin list pages |
| `search-input` | Search input | Admin list pages |
| `approval-success` | Success toast | Admin approval actions |

## Role Dashboards

| Test ID | Component | Location |
|---------|-----------|----------|
| `dealer-dashboard` | Dealer dashboard container | Dealer dashboard |
| `dealer-nav-customers` | Customers link | Dealer sidebar |
| `supplier-dashboard` | Supplier dashboard container | Supplier dashboard |
| `business-dashboard` | Business dashboard container | Business dashboard |

## Registration Forms

### Dealer Registration

| Test ID | Component | Location |
|---------|-----------|----------|
| `dealer-registration-form` | Form container | Dealer registration page |
| `name-input` | Full name input | All registration forms |
| `email-input` | Email input | All registration forms |
| `password-input` | Password input | All registration forms |
| `confirm-password-input` | Confirm password input | All registration forms |
| `company-name-input` | Company name input | Dealer/Business registration |
| `tax-number-input` | Tax number input | Dealer/Business registration |
| `phone-input` | Phone input | All registration forms |
| `address-input` | Address input | All registration forms |
| `terms-checkbox` | Terms acceptance checkbox | All registration forms |
| `submit-registration` | Submit button | All registration forms |
| `name-error` | Name validation error | All registration forms |
| `email-error` | Email validation error | All registration forms |
| `password-error` | Password validation error | All registration forms |
| `confirm-password-error` | Password confirm error | All registration forms |
| `company-error` | Company validation error | Dealer/Business registration |
| `tax-number-error` | Tax number validation error | Dealer/Business registration |
| `terms-error` | Terms acceptance error | All registration forms |
| `registration-success` | Success message | All registration forms |

### Supplier Registration

| Test ID | Component | Location |
|---------|-----------|----------|
| `supplier-registration-form` | Form container | Supplier registration page |
| `categories-select` | Categories dropdown | Supplier registration |
| `category-{name}` | Category option | Categories dropdown |
| `categories-error` | Categories validation error | Supplier registration |

### Business Registration

| Test ID | Component | Location |
|---------|-----------|----------|
| `business-registration-form` | Form container | Business registration page |
| `business-type-select` | Business type dropdown | Business registration |
| `type-{type}` | Business type option | Business type dropdown |
| `business-type-error` | Business type validation error | Business registration |

## Toast Notifications

| Test ID | Component | Location |
|---------|-----------|----------|
| `toast-error` | Error toast | Global |
| `toast-success` | Success toast | Global |
| `toast-info` | Info toast | Global |

## Implementation Example

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  return (
    <form data-testid="login-form">
      <Input
        data-testid="login-email"
        type="email"
        placeholder="Email"
      />
      <Input
        data-testid="login-password"
        type="password"
        placeholder="Password"
      />
      <Button
        data-testid="login-submit"
        type="submit"
      >
        Giriş Yap
      </Button>
    </form>
  );
}
```

## Adding Test IDs to Existing Components

When adding `data-testid` to existing components:

1. Choose descriptive, stable IDs
2. Avoid dynamic values (use `{id}` placeholders in documentation)
3. Keep IDs consistent across similar components
4. Update this document when adding new IDs
5. Use kebab-case for multi-word IDs

## Priority Implementation

### High Priority (Required for initial tests)
- Authentication drawer and forms
- Navigation elements
- Product cards and add-to-cart buttons
- Cart and checkout flows
- Admin approval buttons

### Medium Priority
- Registration forms
- Admin dashboards
- Role-specific dashboards

### Low Priority
- Search and filters
- Wishlist and compare
- Advanced admin features
