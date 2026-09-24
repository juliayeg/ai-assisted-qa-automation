# Test Plan: Delete program with confirmation

## Positive flows

### TC-001 — Program is removed after confirming deletion

**Preconditions:** A program "Test Program" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for "Test Program".
3. Verify the confirmation dialog appears.
4. Click Confirm (or equivalent confirm action).

**Expected result:** "Test Program" is removed from the program list. The confirmation dialog closes.

**Priority:** High

```gherkin
Scenario: Delete program with confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list
```

---

### TC-002 — Program remains when deletion is cancelled

**Preconditions:** At least one program exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for a program.
3. When the confirmation dialog appears, click Cancel.

**Expected result:** The dialog closes. The program still appears in the list unchanged.

**Priority:** High

```gherkin
Scenario: Cancel program deletion
  Given I click the delete icon for a program
  When I see the confirmation dialog
  And I click Cancel
  Then the program still exists in the list
```

---

### TC-003 — Confirmation dialog shows the program name being deleted

**Preconditions:** A program "Cybersecurity Basics" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for "Cybersecurity Basics".

**Expected result:** The confirmation dialog displays "Cybersecurity Basics" (or clear reference to the program being deleted).

**Priority:** Medium

```gherkin
Scenario: Confirmation dialog identifies program
  Given a program "Cybersecurity Basics" exists
  When I click the delete icon for "Cybersecurity Basics"
  Then the confirmation dialog references "Cybersecurity Basics"
```

---

### TC-004 — List count updates after successful deletion

**Preconditions:** Three programs exist. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page and note the program count.
2. Delete one program and confirm.

**Expected result:** The list shows one fewer program. No stale entry remains.

**Priority:** Medium

```gherkin
Scenario: Program count decreases after deletion
  Given 3 programs exist
  When I delete one program and confirm
  Then the program list shows 2 programs
```

---

## Negative flows

### TC-005 — Program is not deleted when confirmation dialog is dismissed via Escape

**Preconditions:** A program "Test Program" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for "Test Program".
3. Press Escape to dismiss the dialog.

**Expected result:** The dialog closes. "Test Program" remains in the list.

**Priority:** Medium

```gherkin
Scenario: Escape dismisses dialog without deleting
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  And I press Escape
  Then "Test Program" still exists in the list
```

---

### TC-006 — Non-admin user cannot delete programs

**Preconditions:** A program exists. User is logged in as a non-admin role.

**Steps:**
1. Navigate to the Programs page.
2. Look for delete icons on program rows.

**Expected result:** Delete icons are hidden or disabled. No deletion is possible.

**Priority:** High

```gherkin
Scenario: Non-admin cannot delete programs
  Given I am logged in as a non-admin user
  And a program exists
  When I navigate to the Programs page
  Then I do not see enabled delete icons for programs
```

---

### TC-007 — Double-clicking confirm does not cause errors

**Preconditions:** A program "Test Program" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click delete for "Test Program".
3. Rapidly double-click Confirm.

**Expected result:** The program is deleted once. No error toast or duplicate API call failure occurs.

**Priority:** Low

```gherkin
Scenario: Double confirm does not cause duplicate deletion errors
  Given a program "Test Program" exists
  When I click the delete icon and double-click Confirm
  Then "Test Program" is removed from the list
  And no error is displayed
```

---

## Edge cases

### TC-008 — Delete last remaining program shows empty state

**Preconditions:** Only one program "Test Program" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Delete "Test Program" and confirm.

**Expected result:** The list shows the empty state message and create-first-program prompt.

**Priority:** High

```gherkin
Scenario: Deleting last program shows empty state
  Given only "Test Program" exists
  When I delete "Test Program" and confirm
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

---

### TC-009 — Delete icon works for program with special characters in name

**Preconditions:** A program "Informatique & IA - Niveau 2" exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for "Informatique & IA - Niveau 2".
3. Confirm deletion.

**Expected result:** The program is removed from the list without errors.

**Priority:** Medium

```gherkin
Scenario: Delete program with special characters in name
  Given a program "Informatique & IA - Niveau 2" exists
  When I delete the program and confirm
  Then the program is removed from the list
```

---

### TC-010 — Deletion failure shows error and preserves program in list

**Preconditions:** A program exists. Simulate or trigger a server error on delete.

**Steps:**
1. Navigate to the Programs page.
2. Click delete and confirm.
3. Observe behavior when the server returns an error.

**Expected result:** An error message is shown. The program remains in the list.

**Priority:** Medium

```gherkin
Scenario: Failed deletion preserves program
  Given a program "Test Program" exists
  And the delete API will fail
  When I delete "Test Program" and confirm
  Then I see an error message
  And "Test Program" still exists in the list
```

---

### TC-011 — Clicking outside confirmation dialog cancels deletion

**Preconditions:** A program exists. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon.
3. Click outside the confirmation dialog (backdrop).

**Expected result:** The dialog closes. The program remains in the list.

**Priority:** Low

```gherkin
Scenario: Backdrop click cancels deletion
  Given I click the delete icon for a program
  When I click outside the confirmation dialog
  Then the program still exists in the list
```

---

## Ambiguities and gaps in the acceptance criteria

- **Confirmation dialog content:** Exact message text and button labels (Delete, Confirm, Cancel) are not specified.
- **Soft delete vs. hard delete:** No AC clarifies whether deletion is permanent or recoverable.
- **Cascade effects:** No AC for what happens to courses or enrollments linked to the deleted program.
- **Permissions:** AC assumes delete is available; no role-based criteria provided.
- **Undo option:** No AC for undo or toast with undo after deletion.
- **Keyboard accessibility:** No AC for navigating and confirming the dialog via keyboard.
- **Concurrent deletion:** No AC for deleting a program that was already deleted by another user.
