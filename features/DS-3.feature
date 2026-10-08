Feature: DS-3 Program name validation and duplicate prevention
  As an admin user
  I want the system to prevent invalid or duplicate program names
  So that data integrity is maintained

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the modal stays open
    And the program list does not show "   "

  Scenario: Reject an empty program name
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the program name empty
    And I click Create
    Then the form is not submitted
    And the modal stays open
    And no new program appears in the program list

  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists
    And the program list shows exactly one "Web Development 2026"

  Scenario: Reject a case-variant duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" as the program name
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists
    And the program list does not show "web development 2026"

  # Edge cases

  Scenario: Trimmed name that matches an existing program is rejected
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "  Web Development 2026  " as the program name
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name already exists
    And the program list shows exactly one "Web Development 2026"

  Scenario: Surrounding spaces on a new name are trimmed before create
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "  Informatique & IA - Niveau 2  " as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"
    And the program list does not show "  Informatique & IA - Niveau 2  "

  Scenario: Double-click Create does not create two programs
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Full-stack web development program"
    And I double-click Create
    Then the program list shows exactly one "Informatique & IA - Niveau 2"

# Ambiguities and gaps in DS-3 acceptance criteria
# - "Other required fields" are not named. These scenarios fill Description with "Full-stack web development program" from the create-program story. Confirm which fields are required.
# - The whitespace scenario says the name is trimmed and treated as empty, and that the form is not submitted. It does not say whether Create is disabled or whether an error is shown. The scenario asserts the modal stays open and nothing is created.
# - Case-insensitive duplicates are not specified. The "web development 2026" scenario assumes they are rejected.
# - The trimmed-duplicate scenario assumes comparison happens after trim. The ticket only says a whitespace-only name is trimmed and treated as empty.
# - Max length is not specified for the program name, so no character-limit scenario was written.
# - The exact error copy for a duplicate name is not specified. The ticket only says an error indicating the name already exists.
# - Double-click behavior is not specified. The double-click scenario assumes exactly one "Informatique & IA - Niveau 2" is created.
