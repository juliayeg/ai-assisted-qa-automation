# Test Plan: Program list filtering and display

## Positive flows

### TC-001 — Program list shows name and description for each program

**Preconditions:** Multiple programs exist (e.g., "Web Development 2026", "Data Science Fundamentals", "Cybersecurity Basics").

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** Each program row displays Program Name and Description.

**Priority:** High

```gherkin
Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description
```

---

### TC-002 — Empty state shown when no programs match and none exist

**Preconditions:** No programs exist in the system.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.

**Expected result:** A message indicates no programs have been created. A prompt to create the first program is visible.

**Priority:** High

```gherkin
Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

---

### TC-003 — Filter by program name returns matching programs only

**Preconditions:** Programs "Web Development 2026", "Data Science Fundamentals", and "Web Design Intro" exist.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.
3. Enter "Web" in the search/filter field.

**Expected result:** Only "Web Development 2026" and "Web Design Intro" are shown. "Data Science Fundamentals" is hidden.

**Priority:** High

```gherkin
Scenario: Filter programs by name keyword
  Given programs "Web Development 2026", "Data Science Fundamentals", and "Web Design Intro" exist
  When I navigate to the Programs page
  And I enter "Web" in the filter field
  Then I see "Web Development 2026" and "Web Design Intro"
  And I do not see "Data Science Fundamentals"
```

---

### TC-004 — Filter is case-insensitive

**Preconditions:** A program "Web Development 2026" exists.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.
3. Enter "web development" in the filter field.

**Expected result:** "Web Development 2026" appears in the filtered results.

**Priority:** Medium

```gherkin
Scenario: Filter is case-insensitive
  Given a program "Web Development 2026" exists
  When I enter "web development" in the filter field
  Then I see "Web Development 2026" in the results
```

---

### TC-005 — Clearing filter restores full program list

**Preconditions:** Multiple programs exist. A filter is currently applied showing a subset.

**Steps:**
1. Navigate to the Programs page with filter "Web" applied.
2. Clear the filter field.

**Expected result:** All programs are displayed again.

**Priority:** Medium

```gherkin
Scenario: Clear filter restores full list
  Given multiple programs exist
  And I have filtered by "Web"
  When I clear the filter field
  Then I see all programs in the list
```

---

## Negative flows

### TC-006 — No results message shown when filter matches nothing

**Preconditions:** Programs "Web Development 2026" and "Data Science Fundamentals" exist.

**Steps:**
1. Log in as admin.
2. Navigate to the Programs page.
3. Enter "Nonexistent Program XYZ" in the filter field.

**Expected result:** No programs are shown. A "no results" or "no matching programs" message is displayed. This is distinct from the empty-state (no programs at all).

**Priority:** High

```gherkin
Scenario: No results when filter matches nothing
  Given programs exist in the system
  When I enter "Nonexistent Program XYZ" in the filter field
  Then I see no programs in the list
  And I see a message indicating no matching programs were found
```

---

### TC-007 — Filter does not modify underlying program data

**Preconditions:** Programs exist. User applies a filter.

**Steps:**
1. Navigate to the Programs page.
2. Apply filter "Web".
3. Clear the filter.

**Expected result:** All original programs remain unchanged. No programs were deleted or modified by filtering.

**Priority:** Medium

```gherkin
Scenario: Filtering does not alter program data
  Given 3 programs exist
  When I filter by "Web"
  And I clear the filter
  Then all 3 programs are still present with unchanged names and descriptions
```

---

### TC-008 — Empty state is not shown when programs exist but filter returns no matches

**Preconditions:** At least one program exists.

**Steps:**
1. Navigate to the Programs page.
2. Enter a filter term that matches no programs.

**Expected result:** The "no programs have been created" empty state is not shown. Instead, a "no matching results" message is shown.

**Priority:** High

```gherkin
Scenario: Filter no-match differs from empty state
  Given programs exist in the system
  When I enter a filter with no matches
  Then I do not see the empty state message for no programs created
  And I see a no matching results message
```

---

## Edge cases

### TC-009 — Filter matches program description text

**Preconditions:** A program "Intro to Python" exists with description "Full-stack web development program".

**Steps:**
1. Navigate to the Programs page.
2. Enter "Full-stack" in the filter field.

**Expected result:** "Intro to Python" appears in the filtered results.

**Priority:** Medium

```gherkin
Scenario: Filter matches description content
  Given a program "Intro to Python" with description "Full-stack web development program" exists
  When I enter "Full-stack" in the filter field
  Then I see "Intro to Python" in the results
```

---

### TC-010 — Filter with special characters returns correct results

**Preconditions:** A program "Informatique & IA - Niveau 2" exists.

**Steps:**
1. Navigate to the Programs page.
2. Enter "Informatique & IA" in the filter field.

**Expected result:** "Informatique & IA - Niveau 2" appears in the filtered results.

**Priority:** Medium

```gherkin
Scenario: Filter handles special characters
  Given a program "Informatique & IA - Niveau 2" exists
  When I enter "Informatique & IA" in the filter field
  Then I see "Informatique & IA - Niveau 2" in the results
```

---

### TC-011 — Filter with whitespace-only input shows all programs or no filter applied

**Preconditions:** Multiple programs exist.

**Steps:**
1. Navigate to the Programs page.
2. Enter "   " in the filter field.

**Expected result:** All programs are shown (whitespace is trimmed and treated as no filter), or filter field shows validation. No crash or empty incorrect state.

**Priority:** Low

```gherkin
Scenario: Whitespace-only filter shows all programs
  Given multiple programs exist
  When I enter "   " in the filter field
  Then I see all programs in the list
```

---

### TC-012 — Filter updates results as user types (live search)

**Preconditions:** Programs "Web Development 2026" and "Data Science Fundamentals" exist.

**Steps:**
1. Navigate to the Programs page.
2. Type "Web" one character at a time: "W", "We", "Web".

**Expected result:** Results update dynamically with each keystroke without requiring Enter or a search button.

**Priority:** Low

```gherkin
Scenario: Live filter updates on keystroke
  Given programs "Web Development 2026" and "Data Science Fundamentals" exist
  When I type "Web" in the filter field character by character
  Then the list updates to show only matching programs after each keystroke
```

---

### TC-013 — Filter persists or resets after navigating away and back

**Preconditions:** Multiple programs exist.

**Steps:**
1. Navigate to the Programs page and apply filter "Web".
2. Navigate to another page.
3. Return to the Programs page.

**Expected result:** Behavior is consistent — either filter is preserved or reset to show all programs (document actual behavior).

**Priority:** Low

```gherkin
Scenario: Filter state after page navigation
  Given I have filtered programs by "Web"
  When I navigate away and return to the Programs page
  Then the program list state is consistent with the product specification
```

---

## Ambiguities and gaps in the acceptance criteria

- **Filtering not in Jira ACs:** Feature name mentions filtering but provided ACs only cover display and empty state — filter behavior must be inferred.
- **Filter scope:** Unclear whether filter searches name only, description only, or both.
- **No-results vs. empty state:** AC covers empty state when no programs exist but not when filter returns zero matches.
- **Filter UI element:** No AC specifies search box label, placeholder, or location.
- **Sort combined with filter:** No AC for sort order when filter is active.
- **Overlap with DS-2:** Display and empty-state ACs are identical to DS-2; differentiation relies on filtering scenarios.
- **Performance:** No AC for filter response time with large datasets.
