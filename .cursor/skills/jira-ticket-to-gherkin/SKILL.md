---
name: jira-ticket-to-gherkin
description: Turns a Jira ticket's acceptance criteria into structured, reviewable Gherkin test scenarios. Use this skill whenever the user references a Jira ticket (DS-1, DS-2, etc.) and asks for test cases, a test plan, scenarios, or wants to plan testing for a ticket — even if they don't say the word "Gherkin".
---

# Jira Ticket to Gherkin Test Cases

Generate reviewable test scenarios from a Jira ticket. The Gherkin output
is a human-readable checkpoint — the QA reviews it before any Playwright
code gets written.

## Steps

1. Read the referenced Jira ticket using the Atlassian MCP. Extract the
   title, description, and every acceptance criterion.

2. Generate test scenarios as a Gherkin `.feature` file:
   - One `Feature`, named after the ticket
   - Cover every acceptance criterion with at least one `Scenario`
   - Add negative scenarios — what should NOT happen
   - Add edge-case scenarios — boundaries, empty inputs, duplicates,
     special characters, max length, and programs API failures (503 save,
     empty list, malformed payload, 401/403/404/5xx) noting they are
     candidates for `page.route` per programs-network-mocks skill
   - For the programs page, add accessibility coverage:
     1. An axe scan with tags `wcag2a` and `wcag2aa`, asserted empty violations
     2. A keyboard path axe cannot do: tab to the primary control, focused,
        Enter opens the dialog (role-based locators / POMs)

3. Write each scenario in Given / When / Then form. `Given` sets the
   starting state, `When` is the action under test, `Then` is the
   observable expected outcome.

4. Group scenarios with comments: `# Happy paths`, `# Negative`, `# Edge cases`, `# Accessibility`.

5. Use real, specific values from the ticket — never placeholders.

6. End the file with a comment block listing any ambiguities or gaps
   found in the ticket's acceptance criteria, so the QA can resolve them.

## Output

Save as `features/<ticket-key>.feature`.
