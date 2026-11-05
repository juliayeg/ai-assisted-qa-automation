Feature: DS-270 Raya - Create new academic program
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
    Then the Create button is disabled

  # Edge cases

  Scenario: Duplicate program name is rejected
    Given I am logged in as admin
    And a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists

  Scenario: POST create returns 503
    Given I am logged in as admin
    And I am on the program creation form
    When POST to save a program returns HTTP 503
    Then I see an error state and the program is not listed

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

# Ambiguities and gaps in DS-270 acceptance criteria
# Cloned from DS-1; same gaps as DS-256 regarding max length, description optional, cancel/close, non-admin.
