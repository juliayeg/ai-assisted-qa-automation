# Test Plan: Program name validation and duplicate prevention

## Positive flows

### TC-001 — Program name with special characters is accepted

**Preconditions:** User is logged in as admin. Program creation form is open. No program named "Informatique & IA - Niveau 2" exists.

**Steps:**
1. Enter "Informatique & IA - Niveau 2" in Program Name.
2. Enter "Advanced AI and informatics track" in Description.
3. Click Create.

**Expected result:** The program is created successfully and appears in the list.

**Priority:** High

```gherkin
Scenario: Accept program name with special characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

---

### TC-002 — Program name with hyphens and numbers is accepted

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "Web-Dev 101 (2026)" in Program Name.
2. Enter a valid description.
3. Click Create.

**Expected result:** The program is created successfully.

**Priority:** Medium

```gherkin
Scenario: Accept program name with hyphens and numbers
  Given I am on the program creation form
  When I enter "Web-Dev 101 (2026)" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

---

### TC-003 — Duplicate check is case-insensitive

**Preconditions:** A program "Web Development 2026" already exists. User is logged in as admin.

**Steps:**
1. Open the program creation form.
2. Enter "web development 2026" in Program Name.
3. Fill Description and click Create.

**Expected result:** An error indicates the name already exists. The program is not created.

**Priority:** High

```gherkin
Scenario: Reject duplicate name regardless of case
  Given a program "Web Development 2026" already exists
  When I try to create a new program with name "web development 2026"
  Then I see an error indicating the name already exists
```

---

## Negative flows

### TC-004 — Whitespace-only program name is rejected

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "   " (spaces only) in Program Name.
2. Click Create.

**Expected result:** The form is not submitted. The name is trimmed and treated as empty. Create button is disabled or validation error is shown.

**Priority:** High

```gherkin
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)
```

---

### TC-005 — Duplicate program name is rejected

**Preconditions:** A program "Web Development 2026" already exists. User is logged in as admin.

**Steps:**
1. Open the program creation form.
2. Enter "Web Development 2026" in Program Name.
3. Fill Description and click Create.

**Expected result:** An error message indicates the program name already exists. The program is not created. The modal remains open.

**Priority:** High

```gherkin
Scenario: Reject duplicate program name
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
```

---

### TC-006 — Leading and trailing whitespace is trimmed before duplicate check

**Preconditions:** A program "Web Development 2026" already exists. User is logged in as admin.

**Steps:**
1. Open the program creation form.
2. Enter "  Web Development 2026  " in Program Name.
3. Fill Description and click Create.

**Expected result:** Duplicate error is shown. The program is not created.

**Priority:** Medium

```gherkin
Scenario: Trimmed duplicate name is rejected
  Given a program "Web Development 2026" already exists
  When I try to create a new program with name "  Web Development 2026  "
  Then I see an error indicating the name already exists
```

---

### TC-007 — Empty program name cannot bypass validation

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Leave Program Name empty.
2. Attempt to click Create or submit via Enter.

**Expected result:** The form is not submitted. No program is created.

**Priority:** High

```gherkin
Scenario: Empty name cannot be submitted
  Given I am on the program creation form
  When I leave the Program Name field empty
  And I attempt to submit the form
  Then the form is not submitted
```

---

## Edge cases

### TC-008 — Program name with Unicode characters is accepted

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "Programme de Développement Web" in Program Name.
2. Fill Description and click Create.

**Expected result:** The program is created and displays correctly in the list.

**Priority:** Medium

```gherkin
Scenario: Accept program name with Unicode characters
  Given I am on the program creation form
  When I enter "Programme de Développement Web" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

---

### TC-009 — Program name at maximum length boundary is validated for duplicates

**Preconditions:** A program with a 255-character name already exists. User is logged in as admin.

**Steps:**
1. Open the program creation form.
2. Enter the same 255-character name.
3. Click Create.

**Expected result:** Duplicate error is shown. No second program is created.

**Priority:** Medium

```gherkin
Scenario: Duplicate check applies at max name length
  Given a program with a 255-character name already exists
  When I try to create another program with the same name
  Then I see an error indicating the name already exists
```

---

### TC-010 — Error message clears when user edits program name after duplicate error

**Preconditions:** A program "Web Development 2026" exists. Duplicate error was just shown on the creation form.

**Steps:**
1. Change Program Name to "Web Development 2027".
2. Observe the error state and Create button.

**Expected result:** The duplicate error clears. Create button becomes enabled (assuming name is valid).

**Priority:** Low

```gherkin
Scenario: Duplicate error clears on name change
  Given I see a duplicate name error on the program creation form
  When I change the program name to "Web Development 2027"
  Then the duplicate name error is cleared
  And the Create button is enabled
```

---

### TC-011 — Program name with only tabs or mixed whitespace is rejected

**Preconditions:** User is logged in as admin. Program creation form is open.

**Steps:**
1. Enter "\t\t  \t" (tabs and spaces) in Program Name.
2. Click Create.

**Expected result:** The form is not submitted. Name is treated as empty after trimming.

**Priority:** Medium

```gherkin
Scenario: Reject program name with tabs and whitespace
  Given I am on the program creation form
  When I enter tabs and spaces as the program name
  And I click Create
  Then the form is not submitted
```

---

## Ambiguities and gaps in the acceptance criteria

- **Case sensitivity:** AC does not specify whether duplicate check is case-sensitive.
- **Trim behavior on save:** AC says whitespace-only is trimmed to empty; unclear if leading/trailing spaces are trimmed on valid names before saving.
- **Error message text:** Exact wording of duplicate and validation errors is not specified.
- **Special character limits:** AC shows one example with `&` and `-`; no full list of allowed/disallowed characters.
- **Max length interaction:** No AC combining max-length validation with duplicate check.
- **Edit vs. create:** Duplicate check AC only covers creation; no criteria for renaming an existing program to a duplicate name.
- **Concurrent creation:** No AC for two users creating the same name simultaneously.
