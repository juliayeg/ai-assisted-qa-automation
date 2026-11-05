Feature: DS-271 Raya - Program name validation and duplicate prevention
  As an admin user
  I want the system to prevent invalid or duplicate program names
  So that data integrity is maintained

  # UI recon
  # Skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set in this run.

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill other required fields
    And I click Create
    Then the program is created successfully

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted (name is trimmed, treated as empty)

  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    Then I see an error indicating the name already exists

  # Edge cases

  Scenario: Reject case-variant duplicate program name
    Given a program "Web Development 2026" already exists
    When I enter "web development 2026" as the program name
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists

  Scenario: GET programs returns malformed JSON
    Given I am logged in as admin
    When GET programs returns invalid JSON
    Then I see an error or empty state without crashing the page

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

# Ambiguities and gaps in DS-271 acceptance criteria
# Cloned from DS-3; "other required fields" not named; whitespace scenario does not specify disabled vs error UI.
