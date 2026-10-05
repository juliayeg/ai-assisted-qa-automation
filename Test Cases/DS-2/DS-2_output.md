# Test Plan: DS-2 — Edit existing program details

**Jira:** [DS-2](https://legionqaschool.atlassian.net/browse/DS-2) — *Edit existing program details*

**User story:** As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

**Environment verified:** https://test.didaxis.studio/programs (admin)

## Positive flows

### TC-001 — Edit icon opens the Edit Program modal with current data

**Preconditions:** User is logged in as admin. A program exists (e.g. `Web Development 2026`) with a known Description.

**Steps:**
1. Navigate to the Programs page (`/programs`).
2. Click the **Edit** icon on that program row (`aria-label`: `Edit {program name}`).

**Expected result:** A modal titled **Edit Program** opens. **Program Name** and **Description** are pre-filled with the program's current values. Additional fields visible on the form (Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas) also show the stored values. Primary actions are **Cancel** and **Save** (not Create).

**Priority:** High

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data
```

---

### TC-002 — Saving a new Program Name updates the list immediately

**Preconditions:** User is logged in as admin. A unique program exists (e.g. `Web Development 2026`).

**Steps:**
1. Open **Edit Program** for that program.
2. Change **Program Name** to `Web Development 2026 - Updated`.
3. Click **Save**.

**Expected result:** The modal closes. The Programs table immediately shows `Web Development 2026 - Updated` in the **Program** column. The previous name is gone. The row **Edit** / **Delete** labels use the new name (`Edit Web Development 2026 - Updated`). Description stays in the same row under the name.

**Priority:** High

```gherkin
Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"
```

---

### TC-003 — Description-only edit leaves Program Name and other fields unchanged

**Preconditions:** User is logged in as admin. A program exists with a name, description, and the form defaults (Default Session Hours `4`, Default Exam Hours `3`).

**Steps:**
1. Open **Edit Program**.
2. Change only **Description**.
3. Click **Save**.
4. Re-open **Edit Program** for the same program.

**Expected result:** Modal closes after Save. **Program Name**, Default Session Hours, and Default Exam Hours still show their previous values. Only Description is updated. The list row still shows the original name. Extra fields below **Show AI Generation Config** (Total Program Hours, Target Audience, Focus Areas) also persist when saved; they sit under a control that intercepts clicks unless scrolled.

**Priority:** High

```gherkin
Scenario: Edit preserves unchanged fields
  Given I am editing a program
  When I only change the Description
  And I click Save
  Then the Name and other fields remain unchanged
```

---

### TC-004 — Clearing Description is allowed and does not remove the program

**Preconditions:** User is logged in as admin. A program exists with a non-empty Description.

**Steps:**
1. Open **Edit Program**.
2. Clear **Description**.
3. Click **Save**.

**Expected result:** Modal closes. The program remains in the list with its name. Description is empty in the table cell (name still renders; layout is not broken). Re-opening edit shows Description empty.

**Priority:** Medium

```gherkin
Scenario: Save edit with empty description
  Given I am editing a program that has a description
  When I clear Description
  And I click Save
  Then the program remains in the list
  And Description is empty
```

---

## Negative flows

### TC-005 — Unauthenticated users cannot open program edit

**Preconditions:** User is not logged in.

**Steps:**
1. Navigate directly to `/programs`.

**Expected result:** User is redirected to `/login`. Program table and Edit actions are not shown.

**Priority:** High

```gherkin
Scenario: Unauthenticated user cannot edit programs
  Given I am not logged in
  When I navigate to the Programs page
  Then I am redirected to the login page
  And I do not see Edit actions
```

---

### TC-006 — Save stays disabled when Program Name is empty

**Preconditions:** User is logged in as admin. **Edit Program** is open.

**Steps:**
1. Clear **Program Name**.
2. Observe **Save**.

**Expected result:** **Program Name** is required. **Save** is disabled. The program is not updated.

**Priority:** High

```gherkin
Scenario: Empty program name cannot be saved
  Given I am editing a program
  When I clear Program Name
  Then the Save button is disabled
```

---

### TC-007 — Cancel discards unsaved edits

**Preconditions:** User is logged in as admin. **Edit Program** is open.

**Steps:**
1. Change **Program Name** and **Description** to values that should not persist.
2. Click **Cancel**.
3. Re-open **Edit Program**.

**Expected result:** Modal closes. List still shows the original name. Re-opened form shows the original name and description.

**Priority:** Medium

```gherkin
Scenario: Cancel discards unsaved program edits
  Given I am editing a program
  And I have changed Program Name and Description
  When I click Cancel
  Then the modal closes
  And the original values remain
```

---

### TC-008 — Clicking the program name cell does not open the edit form

**Preconditions:** User is logged in as admin. At least one program is listed.

**Steps:**
1. Click the program name / first **Program** column cell (not the Edit icon).

**Expected result:** **Edit Program** does not open. URL stays `/programs`. Edit is only available via the **Edit {name}** icon button.

**Priority:** Medium

```gherkin
Scenario: Row text click does not open edit
  Given I am on the Programs page
  When I click the program name in the list
  Then the edit form does not open
```

---

## Edge cases

### TC-009 — Whitespace-only Program Name keeps Save disabled

**Preconditions:** User is logged in as admin. **Edit Program** is open.

**Steps:**
1. Replace **Program Name** with only spaces (`   `).
2. Observe **Save**.

**Expected result:** **Save** remains disabled.

**Priority:** Medium

```gherkin
Scenario: Whitespace-only program name is invalid on edit
  Given I am editing a program
  When I fill in Program Name with "   "
  Then the Save button is disabled
```

---

### TC-010 — Escape from Program Name closes modal without saving

**Preconditions:** User is logged in as admin. **Edit Program** is open.

**Steps:**
1. Change **Program Name**.
2. Press Escape while Program Name is focused.

**Expected result:** Modal closes. Draft name is not in the list. **Observed:** Escape from the Description textarea may not close the modal on the first press (textarea consumes the key).

**Priority:** Low

```gherkin
Scenario: Escape discards unsaved edits
  Given I am editing a program
  And Program Name is focused
  When I press Escape
  Then the modal closes
  And the program is not renamed
```

---

### TC-011 — Modal X close discards unsaved edits

**Preconditions:** User is logged in as admin. **Edit Program** is open.

**Steps:**
1. Change **Description**.
2. Click the modal close (X) control.
3. Re-open edit.

**Expected result:** Modal closes without saving. Description is unchanged.

**Priority:** Low

```gherkin
Scenario: Close icon discards unsaved edits
  Given I am editing a program
  When I change Description
  And I click the modal close control
  Then the original Description is kept
```

---

### TC-012 — Special characters in an edited name display correctly

**Preconditions:** User is logged in as admin. A program exists.

**Steps:**
1. Open **Edit Program**.
2. Change **Program Name** to a unique `Informatique & IA - Niveau 2` value.
3. Click **Save**.

**Expected result:** Modal closes. The list and Edit/Delete labels show the name with `&` and hyphens unescaped.

**Priority:** Medium

```gherkin
Scenario: Edited name with special characters displays correctly
  Given I am editing a program
  When I change Program Name to "Informatique & IA - Niveau 2"
  And I click Save
  Then the list shows "Informatique & IA - Niveau 2"
```

---

### TC-013 — Duplicate program name on edit should be rejected

**Preconditions:** Two uniquely named programs exist. Admin is logged in.

**Steps:**
1. Open **Edit Program** for the second program.
2. Change **Program Name** to the first program's exact name.
3. Click **Save**.

**Expected result:** Save is rejected with a uniqueness error; the edited program keeps its original name. **Observed on test env:** duplicate names are accepted (same defect family as DS-13 / DS-122 on create).

**Priority:** Medium

```gherkin
Scenario: Edit cannot reuse another program's name
  Given programs "Alpha" and "Beta" exist
  When I edit "Beta" and set Program Name to "Alpha"
  And I click Save
  Then I see an error indicating the name already exists
```

---

## Ambiguities and gaps in the acceptance criteria

- **Control vs “edit icon”:** The control is an icon button whose accessible name is `Edit {Program Name}` (same pattern as `Delete {Program Name}`). Clicking the name cell does not open edit.
- **Modal title and submit:** The form is titled **Edit Program**. Submit is **Save**; create uses **Create** on **New Program**.
- **List layout:** Name and description share the **Program** column; actions are a second unnamed column. After rename, assert with `exact: true` on `Edit {name}` so a new name that extends the old one is not a false match.
- **“Other fields”:** ACs do not list them. The live form also has Total Program Hours, Default Session Hours (default `4`), Default Exam Hours (default `3`), Target Audience, Focus Areas, and AI config. Description-only save keeps these values.
- **Description:** Optional. Clearing it on edit is allowed.
- **Validation:** Empty or whitespace-only Program Name disables Save (HTML `required` on Program Name). No `maxlength` on name in the edit form.
- **Duplicates:** Not in DS-2 ACs; test env currently allows renaming onto an existing name.
- **Performance:** Saving refetches the full `/api/programs` list. With thousands of rows the modal can stay visible for many seconds after a successful PATCH.
- **Display / empty state / filtering:** Covered by DS-5, not DS-2. The previous DS-2 display-only cases did not match this ticket.
