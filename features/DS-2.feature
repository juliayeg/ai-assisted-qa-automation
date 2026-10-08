Feature: DS-2 Edit existing program details
  As an admin user
  I want to edit an existing program's details
  So that I can correct or update program information after creation

  # Happy paths

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form
    And Program Name is pre-populated with "Web Development 2026"

  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And the program list does not show "Web Development 2026"

  Scenario: Edit preserves unchanged fields
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I only change the Description
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the Name remains "Web Development 2026"

  # Negative

  Scenario: Cancel edit does not change the program
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I cancel the edit
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Updated"

  Scenario: Empty Program Name is not saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear the Name
    And I click Save
    Then the modal stays open
    And the program list still shows "Web Development 2026"

  Scenario: Saving a duplicate name is rejected
    Given I am logged in as admin
    And programs "Web Development 2026" and "Web Development 2026 - Updated" both exist
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal stays open
    And I see an error that the name already exists
    And the program list still shows "Web Development 2026"

  # Edge cases

  Scenario: Whitespace-only Name is not saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "   "
    And I click Save
    Then the modal stays open
    And the program list still shows "Web Development 2026"
    And the program list does not show "   "

  Scenario: Edited name with special characters is saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated & Revised"
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Updated & Revised"

  Scenario: Leading and trailing spaces are trimmed on save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "  Web Development 2026 - Updated  "
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Updated"
    And the program list does not show "  Web Development 2026 - Updated  "

  Scenario: Saving without changes keeps the current name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I click Save without changing any field
    Then the modal closes
    And the program list shows exactly one "Web Development 2026"

# Ambiguities and gaps in DS-2 acceptance criteria
# - The original Description and any other fields are not specified, so the open-edit scenario only asserts Program Name "Web Development 2026".
# - "I only change the Description" gives no replacement text. The preserve scenario checks that the Name stays "Web Development 2026" and does not assert a specific Description string.
# - Edit validation is not specified. Empty name, whitespace-only name, and duplicate name scenarios assume Save is rejected and "Web Development 2026" stays unchanged.
# - Cancel is not specified. The cancel scenario assumes closing without Save discards "Web Development 2026 - Updated".
# - Max length is not specified for Name or Description, so no character-limit scenario was written.
# - Whether edit uniqueness is case-insensitive is not specified.
# - The exact error copy for a duplicate name on edit is not specified.
