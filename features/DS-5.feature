Feature: DS-5 Program list filtering and display
  As an admin user
  I want to see all programs in a clear list
  So that I can quickly find and manage them

  # Happy paths

  Scenario: Display program list with key details
    Given I am logged in as admin
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see a list showing "Web Development 2026"
    And I see "Full-stack web development program" for that program

  Scenario: Display more than one program
    Given I am logged in as admin
    And programs "Web Development 2026" and "Test Program" exist
    When I navigate to the Programs page
    Then I see "Web Development 2026"
    And I see "Test Program"

  # Negative

  Scenario: Empty state when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program
    And I do not see "Web Development 2026"
    And I do not see "Test Program"

  Scenario: Empty-state message is hidden when programs exist
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    When I navigate to the Programs page
    Then I see "Web Development 2026"
    And I do not see a message indicating no programs have been created

  # Edge cases

  Scenario: List shows a program name that contains special characters
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2"

  Scenario: List shows a program whose description is empty
    Given I am logged in as admin
    And a program "Test Program" exists with an empty description
    When I navigate to the Programs page
    Then I see "Test Program"
    And that row does not show a description

  Scenario: A single program is shown once
    Given I am logged in as admin
    And "Web Development 2026" is the only program
    When I navigate to the Programs page
    Then the list shows exactly one "Web Development 2026"

# Ambiguities and gaps in DS-5 acceptance criteria
# - The summary says "filtering", but the acceptance criteria only cover display and the empty state. No filter control, query, or match rule is specified, so no filtering scenario was written.
# - DS-5 names no programs. "Web Development 2026", "Full-stack web development program", "Test Program", and "Informatique & IA - Niveau 2" come from DS-1, DS-3, and DS-4 so the list checks use concrete values.
# - The empty-state message and the create prompt have no exact copy. Scenarios assert the meaning from the ticket, not a specific sentence.
# - Sort order, pagination, and column layout are not specified.
# - Whether a program with an empty description is allowed, and how that row renders, is not specified.
# - Max length for name and description is not specified, so no truncation scenario was written.
