Feature: DS-257 Valeria - Edit existing program details
  As an admin user
  I want to edit an existing program's details
  So that I can correct or update program information after creation

  # Happy paths

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  Scenario: Successfully edit a program name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  Scenario: Edit preserves unchanged fields
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I only change the Description
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the Name remains "Web Development 2026"

  # Negative

  Scenario: Empty Program Name is not saved
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear the Name
    And I click Save
    Then the modal stays open
    And the program list still shows "Web Development 2026"

  Scenario: Saving a duplicate name is rejected
    Given I am logged in as admin
    And programs "Web Development 2026" and "Web Development 2026 - Updated" both exist
    And I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal stays open
    And I see an error that the name already exists

  # Edge cases

  Scenario: Programs update API returns 503 on save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And the programs update API is mocked to return 503
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the user sees an error state and the list still shows "Web Development 2026"

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

# Ambiguities and gaps in DS-257 acceptance criteria
# - Live UI recon was skipped: DIDAXIS_EMAIL and DIDAXIS_PASSWORD are not set in this environment.
# - Pre-populated fields beyond Name are not specified; open-edit scenario assumes Name "Web Development 2026".
# - Description replacement text for "only change the Description" is not given.
# - Cancel, max length, and trim rules are not in the ticket.
