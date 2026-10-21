/** Unique suffix for program names so parallel/serial runs do not collide. */
export function uniqueSuffix(testId: string): string {
  return `${Date.now()}-${testId.slice(-8)}`;
}
