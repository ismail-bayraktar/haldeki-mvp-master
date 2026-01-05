# B2B Frontend Technical Specification 🎨

Focus: User experience, responsive design, and state management.

## 🛠️ Tasks
- [x] **Registration Flow**
    - [x] Create `src/pages/BusinessRegistration.tsx` (Model after `BayiKayit.tsx`).
    - [x] Implement token validation logic.
    - [x] Fields: Company Name, Business Type, Tax Number, Tax Office, Contact Info.
- [x] **Admin UI Updates**
    - [x] Update Business management list with "View Password" functionality (consistent with Dealers/Suppliers).
    - [x] Refine B2B price editing in `RegionProducts.tsx`.
- [ ] **Business Dashboard (`/business`)**
    - [ ] Summary cards: Total Orders, Last Order Status, Special Offers.
    - [ ] "Bugün Halde" B2B view integration.
    - [ ] Re-order functionality from history.
- [ ] **Navigation**
    - [ ] Add B2B links to sidebar/header based on role.

## 📝 UI/UX Guidelines
- Highlight "İşletme Özel" prices in green.
- Maintain consistency with shadcn/ui patterns used in Dealer panel.
