# Test Plan: Display program list

## Positive flows

### TC-001 — Program list shows name and description for each program

**Preconditions:** At least two programs exist (e.g., "Web Development 2026" and "Data Science Fundamentals").

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** Each program row displays its Program Name and Description.

**Priority:** High

```gherkin
Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description
```

---

### TC-002 — Empty state message and create prompt shown when no programs exist

**Preconditions:** No programs exist in the system.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** A message indicates no programs have been created. A prompt or action to create the first program is visible.

**Priority:** High

```gherkin
Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

---

### TC-003 — Empty-state create prompt opens program creation form

**Preconditions:** No programs exist. User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click the create-first-program prompt or button.

**Expected result:** The program creation form opens with Program Name and Description fields.

**Priority:** Medium

```gherkin
Scenario: Empty state create prompt opens form
  Given no programs exist
  And I am logged in as admin
  When I navigate to the Programs page
  And I click the prompt to create the first program
  Then I see the program creation form
```

---

### TC-004 — Newly created program appears in list without page refresh

**Preconditions:** User is logged in as admin. At least one program already exists.

**Steps:**
1. Navigate to the Programs page.
2. Create a new program "Mobile Development 2026".
3. Observe the list after the modal closes.

**Expected result:** "Mobile Development 2026" appears in the list immediately with its description.

**Priority:** High

```gherkin
Scenario: List updates after program creation
  Given I am on the Programs page
  When I create a program named "Mobile Development 2026"
  Then the program list includes "Mobile Development 2026" without a page refresh
```

---

## Negative flows

### TC-005 — Program list is not shown to unauthenticated users

**Preconditions:** User is not logged in.

**Steps:**
1. Navigate directly to the Programs page URL.

**Expected result:** User is redirected to login. Program list is not accessible.

**Priority:** High

```gherkin
Scenario: Unauthenticated user cannot view program list
  Given I am not logged in
  When I navigate to the Programs page
  Then I am redirected to the login page
  And I do not see the program list
```

---

### TC-006 — Empty state is not shown when programs exist

**Preconditions:** At least one program exists in the system.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** The empty-state message and create-first-program prompt are not displayed.

**Priority:** Medium

```gherkin
Scenario: Empty state hidden when programs exist
  Given programs exist in the system
  When I navigate to the Programs page
  Then I do not see the empty state message
```

---

### TC-007 — Program with empty description does not break list display

**Preconditions:** A program "Intro to Python" exists with an empty Description.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** "Intro to Python" appears in the list. The description area shows empty, a dash, or a placeholder — not a broken layout.

**Priority:** Medium

```gherkin
Scenario: Program with empty description displays correctly
  Given a program "Intro to Python" exists with no description
  When I navigate to the Programs page
  Then I see "Intro to Python" in the list
  And the description area does not break the layout
```

---

## Edge cases

### TC-008 — Program with special characters in name displays correctly

**Preconditions:** A program named "Informatique & IA - Niveau 2" exists with description "Advanced AI track".

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** The program name and description render correctly without HTML encoding issues or truncation errors.

**Priority:** Medium

```gherkin
Scenario: Special characters display correctly in list
  Given a program "Informatique & IA - Niveau 2" exists
  When I navigate to the Programs page
  Then I see "Informatique & IA - Niveau 2" displayed correctly in the list
```

---

### TC-009 — Large number of programs renders without performance degradation

**Preconditions:** 100+ programs exist in the system.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.
3. Scroll through the list.

**Expected result:** All programs load within acceptable time. Pagination or virtual scrolling works if implemented.

**Priority:** Low

```gherkin
Scenario: Large program list loads performantly
  Given 100 programs exist in the system
  When I navigate to the Programs page
  Then all programs are accessible within 3 seconds
  And scrolling through the list remains responsive
```

---

### TC-010 — Long description is displayed without breaking list layout

**Preconditions:** A program exists with a 500-character description.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** The description is truncated, wrapped, or expandable without breaking the row layout.

**Priority:** Low

```gherkin
Scenario: Long description does not break list layout
  Given a program exists with a 500-character description
  When I navigate to the Programs page
  Then the program row layout remains intact
```

---

## Ambiguities and gaps in the acceptance criteria

- **List sort order:** No AC specifies default sort (alphabetical, creation date, etc.).
- **Empty description display:** Not defined how missing descriptions appear in the list.
- **Pagination:** No criteria for how many programs are shown per page.
- **Create prompt behavior:** AC says prompt is visible but not whether clicking it opens the form.
- **Non-admin access:** No AC for whether other roles can view the list.
- **Loading state:** No AC for spinner or skeleton while programs load.
- **Overlap with DS-5:** DS-5 ACs are identical; DS-5 feature name mentions filtering but no filter ACs are provided.
