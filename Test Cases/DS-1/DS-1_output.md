# Test Plan: Create new academic program

## Positive flows

### TC-001 — Program creation form displays required fields

**Preconditions:** User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click "+ New Program".

**Expected result:** The program creation modal opens with Program Name and Description fields visible and editable.

**Priority:** High

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description
```

---

### TC-002 — New program appears in list after successful creation

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "Web Development 2026" in Program Name.
2. Enter "Full-stack web development program" in Description.
3. Click Create.

**Expected result:** The modal closes. The Programs list displays "Web Development 2026" with its description.

**Priority:** High

```gherkin
Scenario: Successfully create a program
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"
```

---

### TC-003 — Program is created with description only when name is provided

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "Data Science Fundamentals" in Program Name.
2. Leave Description empty.
3. Click Create.

**Expected result:** The program is created successfully and appears in the list with name "Data Science Fundamentals" and an empty or placeholder description.

**Priority:** Medium

```gherkin
Scenario: Create program with name only
  Given I am on the program creation form
  When I fill in Program Name with "Data Science Fundamentals"
  And I leave Description empty
  And I click Create
  Then the modal closes
  And the program list shows "Data Science Fundamentals"
```

---

## Negative flows

### TC-004 — Create button remains disabled when program name is empty

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Leave Program Name empty.
2. Observe the Create button state.

**Expected result:** The Create button is disabled. No program is created.

**Priority:** High

```gherkin
Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

---

### TC-005 — Program is not created when Create is clicked with empty name via keyboard bypass

**Preconditions:** User is logged in as admin. Program creation form is open with Program Name empty.

**Steps:**
1. Attempt to submit the form using Enter key or any enabled shortcut.
2. Check the Programs list.

**Expected result:** The form is not submitted. No new program appears in the list.

**Priority:** Medium

```gherkin
Scenario: Form submission blocked with empty program name
  Given I am on the program creation form
  And the Program Name field is empty
  When I attempt to submit the form
  Then the form is not submitted
  And no new program is added to the list
```

---

### TC-006 — Non-admin user cannot access program creation

**Preconditions:** User is logged in with a non-admin role (e.g., viewer or instructor).

**Steps:**
1. Navigate to the Programs page.
2. Look for the "+ New Program" button.

**Expected result:** The "+ New Program" button is not visible or is disabled. The user cannot open the creation form.

**Priority:** High

```gherkin
Scenario: Non-admin cannot create programs
  Given I am logged in as a non-admin user
  When I navigate to the Programs page
  Then I do not see an enabled "+ New Program" button
```

---

## Edge cases

### TC-007 — Program name at maximum allowed length is accepted

**Preconditions:** User is logged in as admin. Program creation form is open. Maximum name length is known (e.g., 255 characters).

**Steps:**
1. Enter a program name of exactly 255 characters in Program Name.
2. Enter a valid description.
3. Click Create.

**Expected result:** The program is created successfully and the full name is displayed in the list (or truncated with tooltip if UI limits display length).

**Priority:** Medium

```gherkin
Scenario: Accept program name at max length
  Given I am on the program creation form
  When I fill in Program Name with a 255-character string
  And I fill in Description with "Boundary length test program"
  And I click Create
  Then the program is created successfully
```

---

### TC-008 — Program name exceeding maximum length is rejected

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter a program name of 256 characters in Program Name.
2. Attempt to click Create.

**Expected result:** Validation error is shown or input is prevented. The program is not created.

**Priority:** Medium

```gherkin
Scenario: Reject program name exceeding max length
  Given I am on the program creation form
  When I fill in Program Name with a 256-character string
  Then I see a validation error or the Create button is disabled
  And the program is not created
```

---

### TC-009 — Modal closes without saving when Cancel is clicked

**Preconditions:** User is logged in as admin. Program creation form is open with partially filled fields.

**Steps:**
1. Enter "Draft Program" in Program Name.
2. Click Cancel or close the modal.
3. Check the Programs list.

**Expected result:** The modal closes. "Draft Program" does not appear in the list.

**Priority:** Medium

```gherkin
Scenario: Cancel discards unsaved program
  Given I am on the program creation form
  And I have entered "Draft Program" in Program Name
  When I click Cancel
  Then the modal closes
  And "Draft Program" is not in the program list
```

---

### TC-010 — Description field accepts long text without breaking layout

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "Cloud Computing 2026" in Program Name.
2. Enter a description of 2000 characters in Description.
3. Click Create.

**Expected result:** The program is created. The description is stored and displayed without breaking the list layout.

**Priority:** Low

```gherkin
Scenario: Create program with long description
  Given I am on the program creation form
  When I fill in Program Name with "Cloud Computing 2026"
  And I fill in Description with a 2000-character string
  And I click Create
  Then the program is created successfully
  And the description is stored without data loss
```

---

## Ambiguities and gaps in the acceptance criteria

- **Description required or optional?** ACs show Description filled in one scenario but do not state whether it is mandatory.
- **Create button behavior:** AC says Create is disabled when name is empty; unclear whether whitespace-only names are treated the same (covered in DS-3).
- **Duplicate name handling:** Not mentioned in DS-1 ACs (covered in DS-3).
- **Post-create feedback:** No AC for success toast/notification after creation.
- **Modal dismiss behavior:** No AC for closing via Escape key or clicking outside the modal.
- **Maximum field lengths:** No limits specified for Program Name or Description.
- **Role permissions:** AC assumes admin login; no criteria for other roles.
