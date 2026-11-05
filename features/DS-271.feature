Feature: DS-271 Program name validation and duplicate prevention (Raya)
  As an admin user
  I want the system to prevent invalid or duplicate program names
  So that data integrity is maintained

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill other required fields
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the modal stays open

  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I try to create a new program with the same name
    Then I see an error indicating the name already exists
    And the program list shows exactly one "Web Development 2026"

  # Edge cases

  Scenario: Reject a case-variant duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" as the program name
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists

  Scenario: Programs create API returns malformed JSON
    Given I am logged in as admin
    And the programs list API is mocked to return malformed JSON
    When I navigate to the Programs page
    Then the user sees a recoverable error state

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

# Ambiguities and gaps in DS-271 acceptance criteria
# - Live UI recon was skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set in this environment.
# - "Other required fields" are not named; scenarios use Description from the create-program story.
# - Whitespace scenario does not specify disabled Create vs inline error.
# - Case-insensitive duplicate handling is not specified in the ticket.
