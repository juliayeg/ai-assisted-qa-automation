Feature: DS-256 Valeria - Create new academic program
  As an admin user
  I want to create a new academic program
  So that I can begin designing its curriculum structure

  # UI recon
  # Skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set in this run.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

  Scenario: Successfully create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Negative

  Scenario: Validation prevents empty program name
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the program list does not show a program with an empty name

  Scenario: Whitespace-only Program Name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  Scenario: Duplicate program name is rejected
    Given I am logged in as admin
    And a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal stays open
    And I see a validation error that the name already exists

  # Edge cases

  Scenario: Program Name with special characters is created
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026 — C# & .NET"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026 — C# & .NET"

  Scenario: Programs API returns 503 on create save
    Given I am logged in as admin
    And I am on the program creation form
    When POST to save a program returns HTTP 503
    Then I see an error state and the program is not listed

  Scenario: Programs list API returns empty array
    Given I am logged in as admin
    When GET programs returns an empty list
    Then I see the empty programs state

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

# Ambiguities and gaps in DS-256 acceptance criteria
# - Max length is not specified for Program Name or Description.
# - Uniqueness and case sensitivity for duplicate names are not in the ticket AC; duplicate scenario assumes names must be unique.
# - Description required vs optional is not specified; empty-Description behavior is not covered in ticket AC.
# - Cancel, close, and discard behavior for the modal is not specified.
# - Non-admin access is not specified.
