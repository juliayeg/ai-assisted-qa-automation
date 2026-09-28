# Test Plan: TodoMVC (Add, Complete, Delete)

**Application:** React • TodoMVC  
**URL:** https://demo.playwright.dev/todomvc/#/  
**Scope:** Acceptance criteria for adding, completing, and deleting todo items, plus related negative and edge cases.

**UI under test (real names):**

| Element | How it appears in the UI |
| --- | --- |
| Page heading | `todos` |
| New item field | textbox with placeholder **What needs to be done?** |
| Todo checkbox | **Toggle Todo** |
| Delete control | **Delete** (visible on hover over the item) |
| Bulk complete | **Mark all as complete** |
| Remaining counter | **1 item left** / **N items left** |
| Filters | **All**, **Active**, **Completed** |
| Clear action | **Clear completed** |
| Persistence key | `react-todos` in localStorage |

---

## Positive flows

### TC-001 — New todo appears in the list after Enter

**Preconditions:** Browser is on https://demo.playwright.dev/todomvc/#/ with an empty list (no items, footer hidden).

**Steps:**
1. Click the **What needs to be done?** field.
2. Type `Buy groceries`.
3. Press Enter.

**Expected result:** A list item labeled `Buy groceries` is shown. The **What needs to be done?** field is cleared. The footer appears with **1 item left**. Filter **All** is selected. The item is not struck through. **Toggle Todo** is unchecked.

**Priority:** High

---

### TC-002 — Completed todo is marked done and remaining count decreases

**Preconditions:** The list contains an active item `Buy groceries`. The counter shows **1 item left**.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries`.

**Expected result:** `Buy groceries` stays in the **All** list with a strikethrough. **Toggle Todo** is checked. The counter shows **0 items left**. The **Clear completed** button appears.

**Priority:** High

---

### TC-003 — Todo is removed from the list after Delete

**Preconditions:** The list contains `Buy groceries` and `Walk the dog`. The counter shows **2 items left**.

**Steps:**
1. Hover over the `Walk the dog` row so **Delete** appears.
2. Click **Delete**.

**Expected result:** `Walk the dog` is gone. `Buy groceries` remains. The counter shows **1 item left**.

**Priority:** High

---

### TC-004 — Multiple todos can be added in sequence

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type `Buy groceries` and press Enter.
2. Type `Walk the dog` and press Enter.
3. Type `Pay rent` and press Enter.

**Expected result:** The list shows three items in that order: `Buy groceries`, `Walk the dog`, `Pay rent`. The counter shows **3 items left**. The new-item field is empty and focused.

**Priority:** High

---

### TC-005 — Completed todo can be marked active again

**Preconditions:** `Buy groceries` is completed (checked, struck through). Counter shows **0 items left**.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries` again.

**Expected result:** The strikethrough is removed. **Toggle Todo** is unchecked. The counter shows **1 item left**. **Clear completed** is hidden.

**Priority:** Medium

---

### TC-006 — Last remaining todo can be deleted and the list returns to empty state

**Preconditions:** The only item is `Buy groceries`. Footer is visible with **1 item left**.

**Steps:**
1. Hover over `Buy groceries`.
2. Click **Delete**.

**Expected result:** The list is empty. The footer (counter, **All** / **Active** / **Completed**, **Clear completed**) is hidden. Only the **todos** heading and **What needs to be done?** field remain.

**Priority:** High

---

## Negative flows

### TC-007 — Empty input does not create a todo

**Preconditions:** The list is empty.

**Steps:**
1. Click **What needs to be done?**.
2. Leave the field empty.
3. Press Enter.
4. Observe the list.

**Expected result:** No list item is created. The footer stays hidden. The field remains empty.

**Priority:** High

---

### TC-008 — Completing a todo does not remove it from the All list

**Preconditions:** The **All** filter is selected. The list contains active items `Buy groceries` and `Walk the dog`.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries`.

**Expected result:** Both `Buy groceries` and `Walk the dog` are still visible under **All**. Completing does not delete the item. Only `Buy groceries` is struck through.

**Priority:** High

---

### TC-009 — Deleting one todo does not delete or complete other todos

**Preconditions:** The list contains active items `Buy groceries`, `Walk the dog`, and `Pay rent`.

**Steps:**
1. Hover over `Walk the dog`.
2. Click **Delete**.

**Expected result:** Only `Walk the dog` is removed. `Buy groceries` and `Pay rent` remain active (unchecked, not struck through). The counter shows **2 items left**.

**Priority:** High

---

### TC-010 — Completing a todo does not change its title

**Preconditions:** The list contains `Buy groceries`.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries`.
2. Read the item label.

**Expected result:** The label is still `Buy groceries`. The text is not cleared, renamed, or replaced.

**Priority:** Medium

---

### TC-011 — Todo is not created on blur without Enter

**Preconditions:** The list is empty.

**Steps:**
1. Click **What needs to be done?**.
2. Type `Buy groceries`.
3. Click outside the field (do not press Enter).

**Expected result:** No list item is created. The typed text may remain in **What needs to be done?**, but the footer stays hidden.

**Priority:** Medium

---

### TC-012 — Clicking the todo label does not complete or delete the item

**Preconditions:** The list contains active item `Buy groceries`.

**Steps:**
1. Single-click the `Buy groceries` label (not **Toggle Todo**, not **Delete**).

**Expected result:** The item stays active. It is not completed, not deleted, and not opened for edit.

**Priority:** Medium

---

## Edge cases

### TC-013 — Whitespace-only input does not create a todo

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type three spaces: `   `.
2. Press Enter.

**Expected result:** No list item is created. The footer stays hidden. The field is cleared or left without adding an item.

**Priority:** High

---

### TC-014 — Leading and trailing spaces are trimmed from the saved title

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type `  Buy groceries  `.
2. Press Enter.

**Expected result:** The list shows `Buy groceries` without leading or trailing spaces. The counter shows **1 item left**.

**Priority:** Medium

---

### TC-015 — Duplicate titles are allowed as separate items

**Preconditions:** The list already contains `Buy groceries`.

**Steps:**
1. In **What needs to be done?**, type `Buy groceries` again.
2. Press Enter.

**Expected result:** Two list items both labeled `Buy groceries` are shown. Completing or deleting one does not change the other. The counter shows **2 items left**.

**Priority:** Medium

---

### TC-016 — Special characters are stored and displayed as literal text

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type `Buy milk & eggs <script>alert(1)</script> "now!"`.
2. Press Enter.

**Expected result:** The item title is shown exactly as entered (or trimmed only of outer whitespace). No script runs. The list layout does not break. **Toggle Todo** and **Delete** still work on that item.

**Priority:** Medium

---

### TC-017 — Unicode and emoji titles are accepted

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type `Купить продукты 🛒`.
2. Press Enter.

**Expected result:** The list shows `Купить продукты 🛒`. The counter shows **1 item left**. Complete and delete still work.

**Priority:** Low

---

### TC-018 — Very long title is accepted because the field has no maxlength

**Preconditions:** The list is empty. **What needs to be done?** has no `maxlength` constraint.

**Steps:**
1. Paste a 500-character string (for example, `A` repeated 500 times) into **What needs to be done?**.
2. Press Enter.

**Expected result:** One item is created with the full 500-character title stored. The row may wrap or overflow, but the app does not crash. **Toggle Todo** and **Delete** remain usable.

**Priority:** Medium

---

### TC-019 — Single-character title is accepted

**Preconditions:** The list is empty.

**Steps:**
1. In **What needs to be done?**, type `A`.
2. Press Enter.

**Expected result:** A list item labeled `A` appears. The counter shows **1 item left**.

**Priority:** Low

---

### TC-020 — Completed item can still be deleted

**Preconditions:** `Buy groceries` is completed. **Clear completed** is visible. Counter shows **0 items left**.

**Steps:**
1. Hover over `Buy groceries`.
2. Click **Delete**.

**Expected result:** `Buy groceries` is removed. The list is empty and the footer is hidden. **Clear completed** is gone.

**Priority:** Medium

---

### TC-021 — Mark all as complete checks every item without deleting them

**Preconditions:** The list contains active items `Buy groceries` and `Walk the dog`.

**Steps:**
1. Click **Mark all as complete**.

**Expected result:** Both items are completed (checked, struck through). Neither item is deleted. The counter shows **0 items left**. **Clear completed** appears.

**Priority:** Medium

---

### TC-022 — Active filter hides completed items but does not delete them

**Preconditions:** `Buy groceries` is completed. `Walk the dog` is active. **All** is selected.

**Steps:**
1. Click **Active**.
2. Confirm `Walk the dog` is visible and `Buy groceries` is not.
3. Click **All**.

**Expected result:** Under **Active**, only `Walk the dog` is shown. Switching back to **All** shows both items. The completed item was hidden, not deleted.

**Priority:** Medium

---

## Ambiguities and gaps in the ACs

- **Add gesture:** ACs do not say that a todo is created only by pressing Enter in **What needs to be done?** (there is no Add button).
- **Empty / whitespace:** ACs do not say whether blank or space-only input should be rejected, or whether titles are trimmed.
- **Duplicates:** ACs do not say whether two items can share the same title (the app allows it).
- **Complete vs delete:** ACs do not say that completing must keep the item in the **All** list, or how completed items look (checkmark, strikethrough, **0 items left**, **Clear completed**).
- **Uncomplete:** ACs do not cover toggling a completed item back to active.
- **Delete affordance:** ACs do not mention that **Delete** is a hover-only control, or that there is no confirmation dialog.
- **Last item:** ACs do not define the empty state after the last item is deleted (footer hidden).
- **Max length:** The new-item field has no `maxlength`. ACs do not define a title limit or overflow behavior.
- **Out of AC scope but present in the app:** **Mark all as complete**, filters **All** / **Active** / **Completed**, **Clear completed**, double-click to edit, and persistence in `react-todos`. None of these are in the stated ACs.
- **AC wording:** The three criteria are written as one run-on sentence, so scope (add / complete / delete only vs full TodoMVC) is easy to misread.
