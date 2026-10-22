import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { Result } from 'axe-core';

const wcagTags = ['wcag2a', 'wcag2aa'] as const;

/** Local and A11Y_STRICT=1 fail on violations; CI records report and stays green. */
export function shouldFailA11yTests(): boolean {
  if (process.env.A11Y_STRICT === '1' || process.env.A11Y_STRICT === 'true') {
    return true;
  }
  return !process.env.CI;
}

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
        .join('\n\n');
    })
    .join('\n\n');
}

async function attachA11yReport(label: string, summary: string, jsonBody?: string): Promise<void> {
  const info = test.info();
  const safeName = label.replace(/[^\w.-]+/g, '-').slice(0, 80);
  await info.attach(`${safeName}.txt`, { body: summary, contentType: 'text/plain' });
  if (jsonBody) {
    await info.attach(`${safeName}.json`, { body: jsonBody, contentType: 'application/json' });
  }
  info.annotations.push({
    type: 'notice',
    description: `[a11y] ${label}`,
  });
  console.warn(`[a11y] ${label}\n${summary}`);
}

/** Runs an a11y assertion locally; in CI logs + HTML attachments without failing the job. */
export async function runA11yCheck(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await attachA11yReport(label, message);
    if (shouldFailA11yTests()) {
      throw error;
    }
  }
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
  const summary = formatAxeViolationsForReport(results.violations);

  if (results.violations.length > 0) {
    await attachA11yReport(
      `axe-violations (${results.violations.length})`,
      summary,
      JSON.stringify(results.violations, null, 2),
    );
  }

  if (!shouldFailA11yTests()) {
    return;
  }

  await expect(
    results.violations,
    `Axe violations — record for bug-reporter; do not disableRules() to pass:\n\n${summary}`,
  ).toEqual([]);
}
