Feature: Programs — sign out
  As a signed-in user on Programs
  I want to sign out from the app shell
  So that my session cannot keep accessing program data.

  # Why this flow
  # Signing out ends the session and blocks /programs; no spec covered shell Sign out (only DS-2 unauthenticated deep-link).

  # Happy path

  Scenario: Sign out from Programs returns to login
    Given I am signed in on the Programs page
    When I click Sign out in the app shell
    Then the browser path is /login
    And the Sign In button is visible

  # Edge case

  Scenario: Signed-out user cannot open Programs via URL
    Given I am signed in on the Programs page
    When I click Sign out in the app shell
    And I open /programs directly
    Then the browser path is /login
    And the Email field is visible

  # UI recon
  # - Tool: Playwright (accessibility tree / role queries; live crawl 2026-11-04)
  # - Date: 2026-11-04
  # - Base URL: https://test.didaxis.studio
  # - Paths: /login → /programs → Sign out → /login; signed-out GET /programs → /login
  # - Locator hints: getByRole('button', { name: 'Sign out' }); login getByLabel('Email'); getByRole('button', { name: 'Sign In' })
  # - Covered already: ds2-display-program.spec.ts (unauthenticated edit URL only)
  # - Not picked this run: sidebar nav to Calendar/Dashboard-only smoke, New Program optional fields on create, Show AI Generation Config expand
