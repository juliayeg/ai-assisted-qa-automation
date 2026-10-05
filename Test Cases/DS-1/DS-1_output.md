# Test Plan: DS-1 — Create new academic program

**Jira:** [DS-1](https://legionqaschool.atlassian.net/browse/DS-1) — *Create new academic program*

**User story:** As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

**Environment verified:** https://test.didaxis.studio/programs (admin)

## Positive flows

### TC-001 — Program creation modal shows required AC fields

**Preconditions:** User is logged in as admin.

**Steps:**
1. Navigate to the Programs page (`/programs`).
2. Click **+ New Program**.

**Expected result:** A modal titled **New Program** opens with editable **Program Name** (required) and **Description** fields. The page also shows optional curriculum fields (Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas) and **Show AI Generation Config**; these are out of DS-1 AC scope but visible on the form.

**Priority:** High

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description
```

---

### TC-002 — New program appears in the Programs table after Create

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique program name (e.g. `Web Development 2026`) in Program Name.
2. Enter `Full-stack web development program` in Description.
3. Click **Create**.

**Expected result:** The modal closes. The Programs table has a row whose **Program** column includes the program name and description (both render in the first data column; the second column is row actions).

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

### TC-003 — Program is created when Description is empty

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique name (e.g. `Data Science Fundamentals`) in Program Name.
2. Leave Description empty.
3. Click **Create**.

**Expected result:** The modal closes. The new program name appears in the Programs table.

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

### TC-004 — Create stays disabled when Program Name is empty

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Leave Program Name empty (Description may be filled or empty).
2. Observe the **Create** button.

**Expected result:** **Create** is disabled. No program is added.

**Priority:** High

```gherkin
Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

---

### TC-005 — Empty Program Name cannot be submitted via keyboard

**Preconditions:** User is logged in as admin. New Program modal is open with Program Name empty.

**Steps:**
1. Optionally fill Description only.
2. Press Enter in Program Name or attempt to activate **Create**.
3. Check the Programs table.

**Expected result:** The modal stays open, **Create** remains disabled, and no new row is added.

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

### TC-006 — Non-admin user cannot create programs

**Preconditions:** User is logged in with a non-admin role.

**Steps:**
1. Navigate to the Programs page.
2. Look for **+ New Program**.

**Expected result:** **+ New Program** is not available (hidden or disabled). Requires non-admin credentials in test env.

**Priority:** High

```gherkin
Scenario: Non-admin cannot create programs
  Given I am logged in as a non-admin user
  When I navigate to the Programs page
  Then I do not see an enabled "+ New Program" button
```

---

## Edge cases

### TC-007 — Program name at 100 characters is accepted

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique 100-character program name.
2. Enter a short description.
3. Click **Create**.

**Expected result:** The program is created and appears in the table. *(Related defects cite missing enforcement above 100 characters; 100 chars should succeed.)*

**Priority:** Medium

```gherkin
Scenario: Accept program name at 100 characters
  Given I am on the program creation form
  When I fill in Program Name with a 100-character string
  And I click Create
  Then the program is created successfully
```

---

### TC-008 — Program name over 100 characters should be rejected

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique 101-character program name.
2. Click **Create**.

**Expected result:** Validation prevents creation (error message and/or disabled **Create**, modal remains open). **Observed on test env:** 101+ characters are accepted and the program is created — defect (see DS-124 / DS-191).

**Priority:** Medium

```gherkin
Scenario: Reject program name over 100 characters
  Given I am on the program creation form
  When I fill in Program Name with a 101-character string
  Then the program is not created
```

---

### TC-009 — Cancel closes modal without persisting data

**Preconditions:** User is logged in as admin. New Program modal is open with Program Name filled.

**Steps:**
1. Enter a unique draft name (e.g. `Draft Program`).
2. Click **Cancel**.
3. Search the Programs table.

**Expected result:** Modal closes. The draft name does not appear in the table.

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

### TC-010 — Long Description is stored when program is created

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique program name (e.g. `Cloud Computing 2026`).
2. Enter a 2000-character Description.
3. Click **Create**.

**Expected result:** Modal closes; row appears in the table with name and description content in the Program column. **Observed:** 501+ character descriptions are also accepted (no 500-char UI limit).

**Priority:** Low

```gherkin
Scenario: Create program with long description
  Given I am on the program creation form
  When I fill in Program Name with "Cloud Computing 2026"
  And I fill in Description with a 2000-character string
  And I click Create
  Then the program is created successfully
```

---

### TC-011 — Whitespace-only Program Name keeps Create disabled

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter only spaces in Program Name.
2. Observe **Create**.

**Expected result:** **Create** remains disabled; no program is created.

**Priority:** Medium

```gherkin
Scenario: Whitespace-only program name is invalid
  Given I am on the program creation form
  When I fill in Program Name with "   "
  Then the Create button is disabled
```

---

### TC-012 — Escape closes modal without saving

**Preconditions:** User is logged in as admin. New Program modal is open with Program Name filled.

**Steps:**
1. Enter a unique draft name.
2. Press Escape.
3. Check the Programs table.

**Expected result:** Modal closes; draft program is not listed.

**Priority:** Low

```gherkin
Scenario: Escape dismisses unsaved program
  Given I am on the program creation form
  And I have entered a program name
  When I press Escape
  Then the modal closes
  And the program is not in the list
```

---

### TC-013 — Double-click Create should not create duplicate programs

**Preconditions:** User is logged in as admin. New Program modal is open.

**Steps:**
1. Enter a unique program name.
2. Double-click **Create** quickly.
3. Count table rows matching that name.

**Expected result:** Exactly one program is created. **Observed on test env:** two rows are created — defect (see DS-110 / DS-123).

**Priority:** High

```gherkin
Scenario: Double-click Create is idempotent
  Given I am on the program creation form
  When I double-click Create
  Then only one program is created
```

---

### TC-014 — Duplicate program name should be rejected

**Preconditions:** A program with name `Existing Program` already exists. Admin is logged in.

**Steps:**
1. Open New Program.
2. Enter `Existing Program` again and click **Create**.

**Expected result:** Duplicate is rejected with a clear error; list count unchanged. **Observed on test env:** duplicate is accepted and a second row is created — defect (see DS-13 / DS-122). Covered in depth in DS-3.

**Priority:** Medium

```gherkin
Scenario: Duplicate program name rejected
  Given a program named "Existing Program" exists
  When I create another program named "Existing Program"
  Then creation is rejected
```

---

## Ambiguities and gaps in the acceptance criteria

- **Description:** Optional in the app (HTML `required` only on Program Name).
- **Create button:** Disabled for empty or whitespace-only names; Description alone does not enable Create.
- **List layout:** Program name and description share one table cell; use row-scoped assertions, not `getByRole('cell', { name })` with name alone.
- **Field length limits:** Not in DS-1 ACs; test env accepts 101+ character names and 500+ character descriptions without UI validation.
- **Duplicate names / double-click:** Not in DS-1 ACs; known defects on test env.
- **Extra form fields:** Hours, audience, focus areas, and AI config are visible but not part of DS-1 ACs.
- **Post-create feedback:** No success toast required in ACs; modal closing + list update is the signal.
- **Non-admin access:** AC assumes admin; TC-006 needs separate credentials.
- **Name trimming:** Leading/trailing spaces in Program Name are stored as entered (defect noted in DS-135).
