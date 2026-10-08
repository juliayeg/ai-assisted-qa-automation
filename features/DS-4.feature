Feature: DS-4 Delete program with confirmation
  As an admin user
  I want to delete a program I no longer need, with a confirmation step
  So that accidental deletion is prevented

  # Happy paths

  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  # Negative

  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I click Cancel
    Then the confirmation dialog closes
    And "Test Program" still exists in the list

  Scenario: Opening the confirmation dialog does not delete the program
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And "Test Program" still exists in the list

  Scenario: Deleting one program leaves a different program in the list
    Given I am logged in as admin
    And programs "Test Program" and "Web Development 2026" exist
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list still shows "Web Development 2026"

  # Edge cases

  Scenario: Delete the only program
    Given I am logged in as admin
    And "Test Program" is the only program
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list has no program rows

  Scenario: Confirming deletion once removes "Test Program" only once
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am on the Programs page
    When I click the delete icon for "Test Program"
    And I confirm deletion once
    Then "Test Program" is removed from the program list
    And no second "Test Program" remains

  Scenario: Delete a program whose name contains special characters
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    And I am on the Programs page
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list

# Ambiguities and gaps in DS-4 acceptance criteria
# - The confirmation button label is not specified. Scenarios say "confirm deletion" and "Cancel" because those are the words in the ticket. Confirm the visible button text before automation.
# - Dismiss paths other than Cancel are not specified: Escape, clicking outside the dialog, and a close icon. No scenario asserts those.
# - The dialog copy is not specified.
# - "Web Development 2026" and "Informatique & IA - Niveau 2" are not named in DS-4. They are used so a delete can be checked against a program that must remain, and against a special-character name. DS-4 itself only names "Test Program".
# - Empty-state copy after deleting the last program is not specified. The only-program scenario asserts that no program rows remain.
# - Whether the same name can be created again after deletion is not specified.
# - Double-click on the delete icon or on confirm is not specified. The single-confirm scenario asserts "Test Program" is removed once.
