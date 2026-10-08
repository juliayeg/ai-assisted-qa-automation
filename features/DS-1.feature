Feature: DS-1 Create new academic program
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
    And the program list shows "Full-stack web development program"

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
    And the program list does not show "   "

  Scenario: A single Create click adds "Web Development 2026" only once
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create once
    Then the modal closes
    And the program list shows exactly one "Web Development 2026"

  # Edge cases

  Scenario: Duplicate program name is rejected
    Given I am logged in as admin
    And a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal stays open
    And I see a validation error that "Web Development 2026" already exists
    And the program list still shows exactly one "Web Development 2026"

  Scenario: Case-variant duplicate program name is rejected
    Given I am logged in as admin
    And a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "web development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal stays open
    And I see a validation error that the name already exists
    And the program list does not show "web development 2026"

  Scenario: Program Name with special characters is created
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026 — C# & .NET"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026 — C# & .NET"

  Scenario: Leading and trailing spaces are trimmed from Program Name
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "  Web Development 2026  "
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show "  Web Development 2026  "

  Scenario: Rapid double-click on Create creates only one program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I double-click Create
    Then the modal closes
    And the program list shows exactly one "Web Development 2026"

  Scenario: Empty Description still creates the program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I leave the Description field empty
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

# Ambiguities and gaps in DS-1 acceptance criteria
# - Max length is not specified for Program Name or Description, so no character-limit scenario was written. Related bugs guess 100, 255, 500, and 2000 characters; those limits are not in the ticket.
# - Uniqueness is not specified. Duplicate and case-variant scenarios above assume names must be unique and case-insensitive. Confirm before automation.
# - Description required vs optional is not specified. The empty-Description scenario assumes Description is optional because only an empty Program Name is called out as validation.
# - Whitespace handling is not specified. The whitespace-only and trim scenarios assume a name of only spaces is empty, and surrounding spaces are trimmed before save.
# - Double-click / repeat-submit behavior is not specified. The single-click and double-click scenarios assume exactly one program is created.
# - Cancel, close, and discard behavior for the modal is not specified.
# - Non-admin access is not specified. The user story is admin-only; it does not say whether other roles can open "+ New Program".
# - The ticket does not say whether the list shows Description, only that it shows "Web Development 2026". The success scenario also checks the description text; drop that step if the list shows name only.
# - Error copy for a duplicate name is not specified.
