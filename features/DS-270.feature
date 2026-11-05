Feature: DS-270 Create new academic program (Raya)
  As an admin user
  I want to create a new academic program
  So that I can begin designing its curriculum structure

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

  # Edge cases

  Scenario: Programs API returns 503 on create
    Given I am logged in as admin
    And I am on the program creation form
    And the programs create API is mocked to return 503
    When I fill in Program Name with "Web Development 2026"
    And I click Create
    Then the user sees an error state and the program is not listed

  # Accessibility

  Scenario: Programs page meets WCAG 2 A and AA via axe
    Given I am logged in as admin
    When I navigate to the Programs page
    Then an axe scan with tags wcag2a and wcag2aa reports no violations

  Scenario: Keyboard opens New Program dialog from Programs page
    Given I am logged in as admin
    When I navigate to the Programs page
    And I tab until "+ New Program" is focused
    And I press Enter
    Then the program creation dialog is visible

# Ambiguities and gaps in DS-270 acceptance criteria
# - Live UI recon was skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set in this environment.
# - Cloned from DS-1; same gaps as DS-256 regarding duplicates, trim, and optional Description.
