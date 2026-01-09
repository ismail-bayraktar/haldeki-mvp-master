# VariationManager UI Improvements Manual Test Checklist
## Phase 12 Completion - Sprint 3

### Test Environment
- [ ] Test environment setup complete
- [ ] Supplier user account ready
- [ ] Test products with variations

### Test 1: ProductForm Opens → First 3 Groups Expanded
**Steps:**
1. Login as supplier
2. Navigate to Product Form (new/edit)
3. Observe variation groups state

**Expected Results:**
- [ ] First variation group is expanded (e.g., "Size")
- [ ] Second variation group is expanded (e.g., "Type")
- [ ] Third variation group is expanded (e.g., "Scent")
- [ ] Fourth+ groups are collapsed (if exist)

### Test 2: Icons Display Correctly
**Steps:**
1. Check each variation group header
2. Verify icon rendering

**Expected Results:**
- [ ] Size group shows ruler/measuring icon
- [ ] Type group shows tag/label icon
- [ ] Scent group shows flower/sparkle icon
- [ ] Packaging group shows box icon
- [ ] Material group shows layers icon
- [ ] Flavor group shows utensils/chef icon
- [ ] Other groups shows default icon

### Test 3: Inline Buttons Show (No Popover)
**Steps:**
1. Look at variation group actions
2. Check how add/remove buttons appear

**Expected Results:**
- [ ] Buttons visible inline (not hidden in popover)
- [ ] "Add Variation" button visible
- [ ] Individual variation items have remove button
- [ ] No popover/dropdown for actions
- [ ] One-click access to all actions

### Test 4: Add Multiple Scents → Separate Tags
**Steps:**
1. Go to "Scent" variation group
2. Click "Add Variation"
3. Enter scent: "Lavender"
4. Click "Add Variation" again
5. Enter scent: "Vanilla"
6. Enter scent: "Citrus"

**Expected Results:**
- [ ] Each scent appears as separate tag
- [ ] "Lavender" tag visible
- [ ] "Vanilla" tag visible
- [ ] "Citrus" tag visible
- [ ] All tags displayed inline
- [ ] Tags can be reordered (if applicable)

### Test 5: Remove Individual Scent Tag
**Steps:**
1. Add 3 scents (Lavender, Vanilla, Citrus)
2. Click "X" on "Vanilla" tag
3. Verify removal

**Expected Results:**
- [ ] "Vanilla" tag removed
- [ ] "Lavender" still visible
- [ ] "Citrus" still visible
- [ ] No confirmation dialog (instant removal)
- [ ] Array updated correctly

### Test 6: Add Multiple Size Options
**Steps:**
1. Go to "Size" variation group
2. Add sizes: "Small", "Medium", "Large"

**Expected Results:**
- [ ] All 3 sizes visible as tags
- [ ] Each tag has remove button
- [ ] Display order maintained

### Test 7: Expand/Collapse Variation Group
**Steps:**
1. Click on variation group header
2. Verify expand/collapse toggle

**Expected Results:**
- [ ] Click expands collapsed group
- [ ] Click collapses expanded group
- [ ] Smooth transition animation
- [ ] Chevron icon rotates (if applicable)

### Test 8: Save Product → Variations Persist
**Steps:**
1. Open product form
2. Add variations:
   - Size: Small, Medium
   - Scent: Lavender, Vanilla
   - Type: Organic, Standard
3. Click "Save"
4. Navigate away
5. Return to product edit

**Expected Results:**
- [ ] All variations saved
- [ ] Size: Small, Medium present
- [ ] Scent: Lavender, Vanilla present
- [ ] Type: Organic, Standard present
- [ ] No data loss
- [ ] Display order preserved

### Test 9: Variation Type Selection
**Steps:**
1. Add new variation group
2. Select variation type from dropdown

**Expected Results:**
- [ ] Dropdown shows: Size, Type, Scent, Packaging, Material, Flavor, Other
- [ ] Each type has corresponding icon
- [ ] Selection updates group label
- [ ] Icon updates accordingly

### Test 10: Display Order Configuration
**Steps:**
1. Create 5 variation groups
2. Reorder them
3. Check display order

**Expected Results:**
- [ ] Groups display in configured order
- [ ] Order persists after save
- [ ] Drag-and-drop works (if implemented)

### Test 11: Metadata Field in Variations
**Steps:**
1. Edit a variation item
2. Check for metadata field

**Expected Results:**
- [ ] Metadata field available (JSON or key-value)
- [ ] Can add custom properties
- [ ] Metadata saved with variation
- [ ] Can be retrieved via API

### Test 12: Variation Value Validation
**Steps:**
1. Try to add variation with empty name
2. Try to add duplicate variation value

**Expected Results:**
- [ ] Empty name shows error
- [ ] Duplicate prevented or warned
- [ ] Validation message clear

### Test 13: Variation Group Collapse Persistence
**Steps:**
1. Expand all variation groups
2. Collapse 4th group
3. Save product
4. Reload page

**Expected Results:**
- [ ] First 3 groups expanded (default)
- [ ] 4th group collapsed (persisted state)

### Test 14: Quick Add Variation
**Steps:**
1. Click "Add Variation" button
2. Type value and press Enter

**Expected Results:**
- [ ] Variation added instantly
- [ ] Focus stays on input
- [ ] Can add multiple quickly
- [ ] No page reload

### Test 15: Variation Tag Styling
**Steps:**
1. Inspect variation tag elements
2. Check CSS classes

**Expected Results:**
- [ ] Tags have rounded corners
- [ ] Background color distinct
- [ ] Remove button (X) visible on hover
- [ ] Tag padding adequate
- [ ] Text readable

### Test 16: Responsive on Mobile
**Steps:**
1. Resize to mobile width
2. Check variation manager

**Expected Results:**
- [ ] Tags stack appropriately
- [ ] Buttons still tappable
- [ ] No horizontal scroll
- [ ] Inline layout works

### Test 17: Load Product with Many Variations
**Steps:**
1. Open product with 10+ variations
2. Check performance

**Expected Results:**
- [ ] Page loads quickly
- [ ] No lag on scroll
- [ ] All variations visible
- [ ] Collapse state managed

### Test 18: Clear All Variations
**Steps:**
1. Add multiple variations
2. Click "Clear All" (if available)
3. Or remove all individually

**Expected Results:**
- [ ] All variations removed
- [ ] Group becomes empty
- [ ] State updates correctly

### Test 19: Variation Preview in Product List
**Steps:**
1. Save product with variations
2. Go to products list
3. Check product card

**Expected Results:**
- [ ] Variation count shown
- [ ] Example variation displayed
- [ ] "3 variations" badge/text

### Test 20: Delete Variation Group
**Steps:**
1. Create variation group
2. Click "Delete Group" button
3. Confirm deletion

**Expected Results:**
- [ ] Entire group removed
- [ ] All variations in group deleted
- [ ] Product still valid
- [ ] Other groups unaffected

### Test 21: Copy Product with Variations
**Steps:**
1. Open product with variations
2. Click "Duplicate/Copy"
3. Check new product

**Expected Results:**
- [ ] All variations copied
- [ ] New product ID assigned
- [ ] Variation IDs regenerated

### Test 22: Variation in Product Search/Filter
**Steps:**
1. Add variations to product
2. Search by variation value
3. Filter by variation type

**Expected Results:**
- [ ] Product appears in search
- [ ] Filter by variation type works
- [ ] Variation values indexed

### Test 23: Inline Editing
**Steps:**
1. Click on variation tag text
2. Edit value in-place

**Expected Results:**
- [ ] Text becomes editable
- [ ] Can type new value
- [ ] Save on Enter/blur
- [ ] Cancel on Esc

### Test 24: Variation Icons Color
**Steps:**
1. Check variation group icons
2. Verify color scheme

**Expected Results:**
- [ ] Icons use theme colors
- [ ] No purple/violet colors
- [ ] Teal/emerald/cyan used
- [ ] Consistent with design system

### Test 25: Integration with Supplier Product
**Steps:**
1. Create supplier product with variations
2. Link to master product
3. Check relationship

**Expected Results:**
- [ ] Variations saved to `product_variations`
- [ ] Linked to `supplier_products`
- [ ] RPC function returns variations

---

## Test Summary

### Pass/Fail Status
- [ ] All tests passed
- [ ] UI improvements working
- [ ] User experience enhanced

### Issues Found
1. ___________
2. ___________
3. ___________

### UI/UX Feedback
- Inline buttons: Better/Worse? _____
- First 3 expanded: Helpful/Confusing? _____
- Icon clarity: Clear/Unclear? _____

### Notes
- ___________
- ___________
- ___________

### Tester Signature
- Name: ___________
- Date: ___________
- Browser: ___________
