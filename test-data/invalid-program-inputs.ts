/** Curated invalid names for validation specs — stable, reviewable sets (not random). */
export const WHITESPACE_ONLY_PROGRAM_NAMES = ['   ', '\t\t  \t', '  \t  '] as const;

export const OVER_MAX_LENGTH_PROGRAM_NAME =
  'A'.repeat(101);
