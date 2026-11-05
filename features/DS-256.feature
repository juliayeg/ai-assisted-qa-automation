Feature: DS-256 Valeria - Create new academic program
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
    And the program list does not show a program with an empty name

  Scenario: Whitespace-only Program Name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  # Edge cases

  Scenario: Program Name with special characters is created
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026 — C# & .NET"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026 — C# & .NET"

  Scenario: Programs API returns 503 on create
    Given I am logged in as admin
    And I am on the program creation form
    And the programs create API is mocked to return 503
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the user sees an error state and the program is not listed

  Scenario: Programs list API returns empty array
    Given I am logged in as admin
    And the programs list API is mocked to return an empty list
    When I navigate to the Programs page
    Then I see the empty programs state

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

# Ambiguities and gaps in DS-256 acceptance criteria
# - Live UI recon was skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set in this environment.
# - Max length for Program Name and Description is not specified.
# - Description required vs optional is not specified beyond empty-name validation.
# - Duplicate names, trim behavior, and cancel/discard flows are not in the ticket (covered only as edge-case candidates where noted).
# - Exact copy for API failure states is not specified; 503 scenario is a page.route candidate per programs-network-mocks.
