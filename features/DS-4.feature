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

  Scenario: Confirmation dialog names the program being deleted
    Given I am logged in as admin
    And a program "Cybersecurity Basics" exists
    And I am on the Programs page
    When I click the delete icon for "Cybersecurity Basics"
    Then I see a confirmation dialog
    And the confirmation message contains "Cybersecurity Basics"

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

# UI recon (2026-10-28, cursor-ide-browser — Playwright MCP not available)
# App: https://test.didaxis.studio/programs (admin@didaxis.studio)
# Heading: getByRole('heading', { name: 'Programs' })
# New Program: getByRole('button', { name: 'New Program' })  — visible label "+ New Program"
# List: HTML <table class="mantine-Table-table"> (role=table). Columns: "Program" + empty actions column.
# Row name: table.getByRole('row').filter({ hasText: programName })
# Delete control: getByRole('button', { name: `Delete ${programName}` })
#   — Mantine ActionIcon, aria-label="Delete <ProgramName>", inner SVG tabler-icon-trash (not emoji, not <img>)
# Edit control: getByRole('button', { name: `Edit ${programName}` })
# Confirmation is a NATIVE window.confirm() — not a Mantine/in-app dialog.
#   Playwright: page.waitForEvent('dialog') then dialog.accept() / dialog.dismiss()
#   dialog.type() === 'confirm'
#   Message: Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.
#   OK = confirm deletion; Cancel = keep the program
# Create-for-setup: New Program modal role=dialog, getByLabel('Program Name'), getByLabel('Description'), Create / Cancel
# Live check: creating "DS4 Recon 1793235328754", JS-clicking Delete, accepting confirm → row gone; dismissing confirm → row stayed.
# LAYOUT BLOCKER: a 256-char program name stretches the Program column (~14453px). Delete/Edit icons sit at x≈14747.
#   Parent card overflow:hidden; body does not scroll horizontally. Visual click and MCP click fail
#   ("Could not scroll element into view"). JS .click() still opens confirm and deletes.
#   Playwright locator.click() will likely timeout as outside viewport unless the list has no long names.
#   Related: DS-209 (icons clipped), DS-172 (native confirm vs in-app dialog).
# No searchbox on the page. Tenant had ~742 programs — "last remaining program / empty state" is not testable here.
# programs.a11y.spec.ts already covers Programs page axe + keyboard New Program; do not duplicate.

# Ambiguities and gaps in DS-4 acceptance criteria
# - Ticket says "confirmation dialog" but does not specify native confirm vs in-app modal. Live UI uses window.confirm().
# - Button labels are the browser OK / Cancel, not in-app "Confirm" / "Delete".
# - Dialog copy is not in the ticket; live text is: Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.
# - Dismiss via Escape is native-dialog behavior; backdrop click does not apply to window.confirm().
# - Empty-state copy after deleting the last program is not specified and cannot be verified on this shared tenant.
# - Soft vs hard delete is not specified; live copy says the delete cannot be undone and removes semesters and courses.
# - Non-admin permissions are not specified. Skip if no non-admin credentials.
# - Double-click on the delete icon is not specified (related bugs DS-30 / DS-109 / DS-218).
# - "Web Development 2026" and "Informatique & IA - Niveau 2" are not named in DS-4; used for remain-in-list and special-character coverage. Use unique suffixes in automation.
