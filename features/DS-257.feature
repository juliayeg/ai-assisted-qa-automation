Feature: DS-257 Valeria - Edit existing program details
  As an admin user
  I want to edit an existing program's details
  So that I can correct or update program information after creation

  # UI recon
  # Skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set in this run.

  # Happy paths

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  Scenario: Edit preserves unchanged fields
    Given I am logged in as admin
    And I am editing a program
    When I only change the Description
    And I click Save
    Then the Name and other fields remain unchanged

  # Negative

  Scenario: Cancel edit does not change the program
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I cancel the edit
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Empty Program Name is not saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear the Name
    And I click Save
    Then the modal stays open
    And the program list still shows "Web Development 2026"

  # Edge cases

  Scenario: PATCH save returns 503
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When PATCH to save the program returns HTTP 503
    Then I see an error state and the original name remains in the list

  Scenario: Edited name with special characters is saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated & Revised"
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Updated & Revised"

  # Accessibility

  Scenario: Programs page meets WCAG 2 A and AA via axe
    Given I am logged in as admin
    When I navigate to the Programs page
    Then an axe scan with tags wcag2a and wcag2aa reports no violations

  Scenario: Keyboard opens New Program dialog
    Given I am logged in as admin
    When I navigate to the Programs page
    And I tab to the New Program control and press Enter
    Then the New Program dialog is open

# Ambiguities and gaps in DS-257 acceptance criteria
# - Pre-populated fields beyond Name and Description are not specified.
# - "I only change the Description" gives no replacement text; scenario asserts Name unchanged only.
# - Edit validation (empty name, duplicates) is not in ticket AC; negative scenarios extend coverage.
# - Cancel behavior is not specified in ticket AC.
