import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import type { Result } from 'axe-core';

const wcagTags = ['wcag2a', 'wcag2aa'] as const;

/** Human-readable axe output for Playwright reports and jira-bug-reporter context. */
export function formatAxeViolationsForReport(violations: Result[]): string {
  if (violations.length === 0) {
    return 'No axe violations.';
  }

  return violations
    .map((violation) => {
      const nodeLines = violation.nodes.slice(0, 5).map((node) => {
        const target = node.target.join(' ');
        const summary =
          node.failureSummary?.split('\n').find((line) => line.trim().length > 0) ??
          violation.help;
        return `    • ${target}\n      ${summary.trim()}`;
      });
      const extra =
        violation.nodes.length > 5
          ? `\n    … +${violation.nodes.length - 5} more node(s)`
          : '';

      return [
        `[${violation.impact}] ${violation.id}`,
        violation.help,
        violation.helpUrl,
        ...nodeLines,
        extra,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

export async function expectNoAxeViolations(
  page: Page,
  configure?: (builder: AxeBuilder) => AxeBuilder,
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([...wcagTags]);
  if (configure) {
    builder = configure(builder);
  }
  const results = await builder.analyze();

  await expect(
    results.violations,
    `Axe violations — record for bug-reporter; do not disableRules() to pass:\n\n${formatAxeViolationsForReport(results.violations)}`,
  ).toEqual([]);
}
